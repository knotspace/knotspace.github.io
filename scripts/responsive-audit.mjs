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

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      const relative = path.relative(dist, full).split(path.sep).join('/');
      if (relative === '404.html') continue;
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
      for (const viewport of viewports) {
        const page = await context.newPage();
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        const pageErrors = [];
        const failedResponses = [];
        page.on('pageerror', error => pageErrors.push(error.message));
        page.on('response', response => {
          if (response.url().startsWith(baseUrl) && response.status() >= 400) {
            failedResponses.push(response.status() + ' ' + response.url());
          }
        });

        try {
          const response = await page.goto(baseUrl + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
          if (!response || response.status() !== 200) {
            failures.push({ route, viewport: viewport.name, issue: 'HTTP response', detail: response?.status() ?? 'no response' });
          } else {
            await page.waitForTimeout(180);
            const hasToggle = await page.locator('#theme-toggle').count() > 0;
            if (hasToggle) {
              await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
              await page.locator('#theme-toggle').click({ timeout: 5000 }).catch(() => {});
              const toggled = await page.locator('html').getAttribute('data-theme');
              if (toggled !== 'light') failures.push({ route, viewport: viewport.name, issue: 'theme toggle', detail: 'ライトモードに切り替わらない' });
            }

            for (const theme of ['dark', 'light']) {
              await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
              await page.waitForTimeout(40);
              const metrics = await page.evaluate(() => ({
                viewport: window.innerWidth,
                htmlWidth: document.documentElement.scrollWidth,
                bodyWidth: document.body?.scrollWidth ?? 0,
                title: document.title,
              }));
              checkedStates++;
              if (metrics.htmlWidth > viewport.width + 1 || metrics.bodyWidth > viewport.width + 1) {
                const issue = {
                  route,
                  viewport: viewport.name,
                  theme,
                  issue: 'horizontal overflow',
                  detail: JSON.stringify(metrics),
                };
                failures.push(issue);
                fs.mkdirSync(artifacts, { recursive: true });
                const safe = route.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'home';
                await page.screenshot({ path: path.join(artifacts, safe + '-' + viewport.name + '-' + theme + '.png'), fullPage: true }).catch(() => {});
              }
            }
          }
          for (const error of pageErrors) failures.push({ route, viewport: viewport.name, issue: 'uncaught browser error', detail: error });
          for (const error of failedResponses) failures.push({ route, viewport: viewport.name, issue: 'failed same-origin resource', detail: error });
        } catch (error) {
          failures.push({ route, viewport: viewport.name, issue: 'navigation/test error', detail: error.message });
        } finally {
          await page.close();
        }
      }
    }
    await context.close();
    console.log('Responsive audit: ' + uniqueRoutes.length + ' routes / ' + viewports.length + ' viewport sizes / ' + checkedStates + ' theme states.');
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
console.log('Responsive audit passed: no horizontal overflow, route failures, or uncaught browser errors.');
