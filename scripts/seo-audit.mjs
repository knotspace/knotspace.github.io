import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const errors = [];
const warnings = [];
const htmlFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

function metaContent(html, key) {
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (tag[0].includes('name="' + key + '"') || tag[0].includes("name='" + key + "'")) {
      return tag[0].match(/\bcontent=["']([^"']*)["']/i)?.[1] ?? '';
    }
  }
  return '';
}

if (!fs.existsSync(root)) {
  console.error('SEO audit: dist/ not found. Run the Astro build first.');
  process.exit(1);
}

walk(root);
const canonicalOwners = new Map();
let indexableCount = 0;

for (const file of htmlFiles) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  if (relative.startsWith('admin/') || relative.startsWith('tina-admin/') || relative === '404.html' || /^google[0-9a-f]+\.html$/i.test(relative)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '';
  const description = metaContent(html, 'description');
  const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1] ?? '';
  const robots = metaContent(html, 'robots').toLowerCase();
  const noindex = robots.includes('noindex');
  // Redirect/utility pages marked noindex are intentionally excluded from indexable-page metadata checks.
  if (noindex) continue;

  if (!title) errors.push(relative + ': title繧ｿ繧ｰ縺後≠繧翫∪縺帙ｓ');
  if (!description) errors.push(relative + ': meta description縺後≠繧翫∪縺帙ｓ');
  if (!canonical) errors.push(relative + ': canonical URL縺後≠繧翫∪縺帙ｓ');

  if (title && title.length > 65) warnings.push(relative + ': title縺碁聞繧・(' + title.length + '譁・ｭ・');
  if (description && (description.length < 60 || description.length > 170)) warnings.push(relative + ': description縺ｮ髟ｷ縺輔ｒ遒ｺ隱・(' + description.length + '譁・ｭ・');

  if (!noindex && canonical) {
    indexableCount++;
    if (canonicalOwners.has(canonical)) errors.push(relative + ': canonical縺碁㍾隍・(' + canonicalOwners.get(canonical) + ')');
    else canonicalOwners.set(canonical, relative);
    if (!/<meta\b[^>]*property=["']og:title["']/i.test(html)) warnings.push(relative + ': og:title縺後≠繧翫∪縺帙ｓ');
    if (!/<meta\b[^>]*property=["']og:description["']/i.test(html)) warnings.push(relative + ': og:description縺後≠繧翫∪縺帙ｓ');
  }

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); }
    catch { errors.push(relative + ': JSON-LD縺梧ｭ｣縺励＞JSON縺ｧ縺ｯ縺ゅｊ縺ｾ縺帙ｓ'); }
  }
}

const sitemapPath = path.join(root, 'sitemap.xml');
const robotsPath = path.join(root, 'robots.txt');
if (!fs.existsSync(sitemapPath)) errors.push('sitemap.xml縺檎函謌舌＆繧後※縺・∪縺帙ｓ');
if (!fs.existsSync(robotsPath)) errors.push('robots.txt縺檎函謌舌＆繧後※縺・∪縺帙ｓ');
else if (!fs.readFileSync(robotsPath, 'utf8').includes('sitemap.xml')) errors.push('robots.txt縺ｫSitemap縺ｮ險倩ｼ峨′縺ゅｊ縺ｾ縺帙ｓ');

if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemap.includes('https://knotspace.github.io/')) errors.push('繧ｵ繧､繝医・繝・・縺ｫ譛ｬ逡ｪ繝峨Γ繧､繝ｳ縺後≠繧翫∪縺帙ｓ');
  for (const match of sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)) {
    const url = match[1];
    const pathname = new URL(url).pathname.replace(/^\//, '');
    const target = path.join(root, pathname, 'index.html');
    const fileTarget = path.join(root, pathname);
    if (!fs.existsSync(target) && !fs.existsSync(fileTarget) && !pathname.endsWith('.xml')) {
      warnings.push('繧ｵ繧､繝医・繝・・縺ｮURL縺ｫ蟇ｾ蠢懊☆繧九ヵ繧｡繧､繝ｫ縺瑚ｦ九▽縺九ｊ縺ｾ縺帙ｓ: ' + url);
    }
  }
}

console.log('SEO audit: ' + htmlFiles.length + ' HTML files / ' + indexableCount + ' indexable pages');
for (const warning of warnings) console.warn('WARN ' + warning);
for (const error of errors) console.error('ERROR ' + error);
if (errors.length) {
  console.error('SEO audit failed: ' + errors.length + ' error(s).');
  process.exit(1);
}
console.log('SEO audit passed.');

