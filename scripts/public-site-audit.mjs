import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const targets = [
  ['KNOT', 'https://knotspace.github.io/'],
  ['Study', 'https://knotspace.github.io/study/'],
  ['Game portal', 'https://knotspace.github.io/game/'],
  ['Blue Branch', 'https://knotspace.github.io/game/%E9%9D%92%E3%81%AE%E5%88%86%E5%B2%90%E7%82%B9/'],
  ['TT INSIGHT', 'https://knotspace.github.io/sport/tabletennis/'],
  ['TT INSIGHT News', 'https://knotspace.github.io/sport/tabletennis/news/'],
  ['TT INSIGHT Articles', 'https://knotspace.github.io/sport/tabletennis/articles/'],
  ['TT INSIGHT Article Detail', 'https://knotspace.github.io/sport/tabletennis/articles/2026-wtt-frankfurt-results/'],
  ['TT INSIGHT Rankings', 'https://knotspace.github.io/sport/tabletennis/rankings/'],
  ['Vote Match', 'https://knotspace.github.io/vote-match/'],
  ['ORBIT LAB', 'https://knotspace.github.io/orbit-lab/lab/'],
  ['Shirataki', 'https://knotspace.github.io/aaa/'],
  ['Location quiz', 'https://knotspace.github.io/ichiate/'],
];

const sitemapUrls = [
  'https://knotspace.github.io/sitemap.xml',
  'https://knotspace.github.io/study/sitemap.xml',
  'https://knotspace.github.io/game/sitemap.xml',
  'https://knotspace.github.io/sport/sitemap.xml',
  'https://knotspace.github.io/orbit-lab/sitemap.xml',
  'https://knotspace.github.io/aaa/sitemap.xml',
  'https://knotspace.github.io/ichiate/sitemap.xml',
];

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 960 },
];
const browser = await chromium.launch({ headless: true });
const failures = [];
const report = [];
const allTargets = new Map(targets.map(([site, url]) => [url, site]));

for (const sitemapUrl of sitemapUrls) {
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    for (const entry of xml.split('<loc>').slice(1)) {
      const url = entry.split('</loc>')[0].trim();
      if (url.startsWith('https://knotspace.github.io/')) {
        allTargets.set(url, new URL(url).pathname.split('/').filter(Boolean)[0] || 'KNOT');
      }
    }
  } catch (error) {
    failures.push({ site: 'sitemap', viewport: 'n/a', url: sitemapUrl, issues: [String(error)] });
    console.log(JSON.stringify(failures.at(-1)));
  }
}

try {
  for (const [url, site] of allTargets) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      const pageErrors = [];
      const failedAssets = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('response', response => {
        if (response.status() >= 400 && new URL(response.url()).hostname === 'knotspace.github.io') {
          failedAssets.push(`${response.status()} ${response.url()}`);
        }
      });

      let status = 0;
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        status = response?.status() ?? 0;
        await page.waitForTimeout(1200);

        const layout = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          document: document.documentElement.scrollWidth,
          body: document.body?.scrollWidth ?? 0,
          missingImages: [...document.images]
            .filter(image => image.loading !== 'lazy' && (!image.complete || image.naturalWidth === 0))
            .map(image => image.currentSrc || image.src),
          missingViewport: !document.querySelector('meta[name="viewport"]'),
          title: document.title,
        }));

        const overflows = layout.document > layout.viewport + 2 || layout.body > layout.viewport + 2;
        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        const seriousA11y = axe.violations
          .filter(item => ['critical', 'serious'].includes(item.impact))
          .map(item => ({ id: item.id, impact: item.impact, count: item.nodes.length }));

        const issues = [];
        if (status < 200 || status >= 400) issues.push(`HTTP ${status}`);
        if (overflows) issues.push(`horizontal overflow (viewport ${layout.viewport}px, document ${layout.document}px, body ${layout.body}px)`);
        if (layout.missingViewport) issues.push('missing viewport meta');
        if (layout.missingImages.length) issues.push(`broken eager images: ${layout.missingImages.join(', ')}`);
        if (failedAssets.length) issues.push(`broken same-site assets: ${failedAssets.join(', ')}`);
        if (pageErrors.length) issues.push(`JavaScript exceptions: ${pageErrors.join(' | ')}`);
        if (seriousA11y.length) issues.push(`serious accessibility: ${JSON.stringify(seriousA11y)}`);

        const result = { site, viewport: viewport.name, url, title: layout.title, status, issues };
        report.push(result);
        if (issues.length) failures.push(result);
        console.log(JSON.stringify(result));
      } catch (error) {
        const result = { site, viewport: viewport.name, url, status, issues: [String(error)] };
        report.push(result);
        failures.push(result);
        console.log(JSON.stringify(result));
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

console.log(`\nAudited ${report.length} site/viewpoint combinations; ${failures.length} failed.`);
if (failures.length) process.exitCode = 1;
