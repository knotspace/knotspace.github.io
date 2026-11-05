import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const root = process.cwd();
const dist = path.join(root, 'dist');
const artifacts = path.join(root, 'artifacts', 'responsive');
const baseUrl = 'http://127.0.0.1:4321';
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
const failures = [];
const routes = [];
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const relative = path.relative(dist, full).split(path.sep).join('/');
      if (relative === '404.html') continue;
      htmlFiles.push(full);
      const route = relative === 'index.html'
        ? '/'
        : relative.endsWith('/index.html')
          ? '/' + relative.slice(0, -'index.html'.length)
          : '/' + relative;
      routes.push(route);
    }
  }
}

if (!fs.existsSync(dist)) {
  console.error('Responsive audit: dist/ not found. Run npm run build first.');
  process.exit(1);
}
walk(dist);
const uniqueRoutes = [...new Set(routes)].sort();
if (!uniqueRoutes.length) {
  console.error('Responsive audit: no built HTML routes found.');
  process.exit(1);
}

// Check every same-origin link emitted into built HTML, including non-sitemap routes.
const checkedLinks = new Set();
for (const file of htmlFiles) {
  const relative = path.relative(dist, file).split(path.sep).join('/');
  const route = relative === 'index.html'
    ? '/'
    : relative.endsWith('/index.html')
      ? '/' + relative.slice(0, -'index.html'.length)
      : '/' + relative;
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/\bhref=(?:"([^"]*)"|'([^']*)')/gi)) {
    const href = match[1] ?? match[2] ?? '';
    if (!href || href.startsWith('javascript:') || href.includes('${') || /['\"]\\s*\\+|\\+\\s*['\"]/.test(href)) continue;
    let url;
    try { url = new URL(href, 'https://knotspace.github.io' + route); } catch { continue; }
    if (url.origin !== 'https://knotspace.github.io') continue;
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { pathname = url.pathname; }
    if (checkedLinks.has(pathname)) continue;
    checkedLinks.add(pathname);
    const relativeTarget = pathname.replace(/^\/+/, '');
    const candidates = pathname.endsWith('/')
      ? [path.join(dist, relativeTarget, 'index.html')]
      : [path.join(dist, relativeTarget), path.join(dist, relativeTarget, 'index.html')];
    const safeCandidates = candidates.filter(candidate => path.resolve(candidate).startsWith(path.resolve(dist) + path.sep));
    if (!safeCandidates.some(candidate => fs.existsSync(candidate))) {
      failures.push({ route, issue: 'broken same-origin link', detail: href });
    }
  }
}

const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4321', '--strictPort'], {
  cwd: root,
  stdio: 'ignore',
  shell: process.platform === 'win32',
});
let serverReady = false;
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) { serverReady = true; break; }
    } catch {}
    await delay(500);
  }
  if (!serverReady) throw new Error('Astro preview server did not become ready.');

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      try {
        localStorage.setItem('knot-theme', 'dark');
        localStorage.setItem('knot-study-theme', 'dark');
      } catch {}
    });

    let checkedStates = 0;
    for (const route of uniqueRoutes) {
      const page = await context.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      const pageErrors = [];
      const failedResponses = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('response', response => {
        if (response.url().startsWith(baseUrl) && response.status() >= 400) {
          failedResponses.push(response.status() + ' ' + response.url());
        }
      });

      try {
        const response = await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (!response || response.status() !== 200) {
          failures.push({ route, issue: 'HTTP response', detail: response?.status() ?? 'no response' });
        } else {
          await page.waitForTimeout(100);
          const hasToggle = await page.locator('#theme-toggle').count() > 0;
          if (hasToggle) {
            await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
            await page.locator('#theme-toggle').click({ timeout: 3000 }).catch(() => {});
            const toggled = await page.locator('html').getAttribute('data-theme');
            if (toggled !== 'light') failures.push({ route, issue: 'theme toggle', detail: 'ライトモードに切り替わらない' });
          }

          for (const viewport of viewports) {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            for (const theme of ['dark', 'light']) {
              await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
              await page.waitForTimeout(25);
              const metrics = await page.evaluate(() => ({
                viewport: window.innerWidth,
                htmlWidth: document.documentElement.scrollWidth,
                bodyWidth: document.body?.scrollWidth ?? 0,
                title: document.title,
                overflowNodes: [...document.querySelectorAll('body *')].filter(element => {
                  const rect = element.getBoundingClientRect();
                  const style = getComputedStyle(element);
                  return rect.width > 0 && (rect.right > window.innerWidth + 2 || rect.left < -2) &&
                    !['absolute', 'fixed'].includes(style.position) && style.display !== 'none' && style.visibility !== 'hidden';
                }).slice(0, 12).map(element => {
                  const rect = element.getBoundingClientRect();
                  return { tag: element.tagName, id: element.id, className: String(element.className || '').slice(0, 100), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), position: getComputedStyle(element).position };
                }),
              }));
              checkedStates++;
              if (metrics.htmlWidth > viewport.width + 1 || metrics.bodyWidth > viewport.width + 1) {
                failures.push({ route, viewport: viewport.name, theme, issue: 'horizontal overflow', detail: JSON.stringify(metrics) });
                fs.mkdirSync(artifacts, { recursive: true });
                const safe = route.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'home';
                await page.screenshot({ path: path.join(artifacts, safe + '-' + viewport.name + '-' + theme + '.png'), fullPage: true }).catch(() => {});
              }
            }
          }
        }
        for (const error of pageErrors) failures.push({ route, issue: 'uncaught browser error', detail: error });
        for (const error of failedResponses) failures.push({ route, issue: 'failed same-origin resource', detail: error });
      } catch (error) {
        failures.push({ route, issue: 'navigation/test error', detail: error.message });
      } finally {
        await page.close();
      }
    }

    // Exercise the complete question -> explanation -> result flow on mobile.
    for (const route of ['/study/foundation/', '/study/public-exam/']) {
      const page = await context.newPage();
      await page.setViewportSize({ width: 390, height: 844 });
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      try {
        const response = await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (!response || response.status() !== 200) throw new Error('Study route did not return HTTP 200');
        await page.locator('#amount').selectOption('10');
        await page.locator('#start').click();
        await page.locator('#quiz').waitFor({ state: 'visible', timeout: 10000 });
        for (let question = 0; question < 10; question++) {
          const firstAnswer = page.locator('#answers button').first();
          await firstAnswer.waitFor({ state: 'visible', timeout: 10000 });
          const answerBox = await firstAnswer.boundingBox();
          if (!answerBox || answerBox.width > 392 || answerBox.x < -1) {
            failures.push({ route, viewport: 'mobile', issue: 'answer control bounds', detail: JSON.stringify(answerBox) });
          }
          await firstAnswer.click();
          await page.locator('#foundationExplanation').waitFor({ state: 'visible', timeout: 5000 });
          await page.locator('#next').click();
        }
        await page.locator('#result').waitFor({ state: 'visible', timeout: 10000 });
        const resultText = await page.locator('#score').textContent();
        if (resultText == null) failures.push({ route, viewport: 'mobile', issue: 'result screen', detail: 'score is missing' });
        await page.locator('#backSettings').click();
        await page.locator('#settings').waitFor({ state: 'visible', timeout: 5000 });
      } catch (error) {
        failures.push({ route, viewport: 'mobile', issue: 'Study interaction flow', detail: error.message });
      }
      for (const error of pageErrors) failures.push({ route, viewport: 'mobile', issue: 'Study browser error', detail: error });
      await page.close();
    }

    await context.close();
    console.log('Responsive audit: ' + uniqueRoutes.length + ' routes / ' + viewports.length + ' viewport sizes / ' + checkedStates + ' theme states / ' + checkedLinks.size + ' internal link targets.');
  } finally {
    await browser.close();
  }
} finally {
  server.kill('SIGTERM');
}

if (failures.length) {
  console.error('Responsive audit failed: ' + failures.length + ' issue(s).');
  for (const item of failures) console.error(JSON.stringify(item));
  process.exit(1);
}
console.log('Responsive audit passed: all routes, internal links, responsive widths, themes, and Study exercise/result flows passed.');
