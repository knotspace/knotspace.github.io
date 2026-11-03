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
  if (relative.startsWith('admin/') || relative === '404.html') continue;
  const html = fs.readFileSync(file, 'utf8');
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '';
  const description = metaContent(html, 'description');
  const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/i)?.[1] ?? '';
  const robots = metaContent(html, 'robots').toLowerCase();
  const noindex = robots.includes('noindex');

  if (!title) errors.push(relative + ': titleタグがありません');
  if (!description) errors.push(relative + ': meta descriptionがありません');
  if (!canonical) errors.push(relative + ': canonical URLがありません');

  if (title && title.length > 65) warnings.push(relative + ': titleが長め (' + title.length + '文字)');
  if (description && (description.length < 60 || description.length > 170)) warnings.push(relative + ': descriptionの長さを確認 (' + description.length + '文字)');

  if (!noindex && canonical) {
    indexableCount++;
    if (canonicalOwners.has(canonical)) errors.push(relative + ': canonicalが重複 (' + canonicalOwners.get(canonical) + ')');
    else canonicalOwners.set(canonical, relative);
    if (!/<meta\b[^>]*property=["']og:title["']/i.test(html)) warnings.push(relative + ': og:titleがありません');
    if (!/<meta\b[^>]*property=["']og:description["']/i.test(html)) warnings.push(relative + ': og:descriptionがありません');
  }

  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(match[1]); }
    catch { errors.push(relative + ': JSON-LDが正しいJSONではありません'); }
  }
}

const sitemapPath = path.join(root, 'sitemap.xml');
const robotsPath = path.join(root, 'robots.txt');
if (!fs.existsSync(sitemapPath)) errors.push('sitemap.xmlが生成されていません');
if (!fs.existsSync(robotsPath)) errors.push('robots.txtが生成されていません');
else if (!fs.readFileSync(robotsPath, 'utf8').includes('sitemap.xml')) errors.push('robots.txtにSitemapの記載がありません');

if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  if (!sitemap.includes('https://knotspace.github.io/')) errors.push('サイトマップに本番ドメインがありません');
  for (const match of sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)) {
    const url = match[1];
    const pathname = new URL(url).pathname.replace(/^\//, '');
    const target = path.join(root, pathname, 'index.html');
    const fileTarget = path.join(root, pathname);
    if (!fs.existsSync(target) && !fs.existsSync(fileTarget) && !pathname.endsWith('.xml')) {
      warnings.push('サイトマップのURLに対応するファイルが見つかりません: ' + url);
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
