import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const blogDir = path.join(root, 'src/content/blog');
const fix = process.argv.includes('--fix');
const failures = [];
const seenAcrossArticles = new Map();
let fixed = 0;
const files = fs.readdirSync(blogDir).filter((name) => name.endsWith('.md')).sort();

function normalizeImage(value) {
  try {
    const url = new URL(value, 'https://knotspace.github.io/');
    return url.origin + url.pathname;
  } catch {
    return value;
  }
}

function collectImages(content) {
  const found = [];
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const markdown = line.match(/^\s*!\[[^\]]*\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)\s*$/);
    if (markdown) found.push({ raw: markdown[1], line: index, kind: 'markdown' });
    const html = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
    for (const match of line.matchAll(html)) {
      found.push({ raw: match[1], line: index, kind: 'html' });
      if (!/\balt=["'][^"']+["']/.test(match[0])) {
        failures.push('画像のalt属性がありません（行 ' + (index + 1) + '）');
      }
    }
  });
  return found;
}

for (const name of files) {
  const file = path.join(blogDir, name);
  const original = fs.readFileSync(file, 'utf8');
  const hero = original.match(/^heroImage:\s*["']([^"']+)["']/m)?.[1];
  const images = collectImages(original);
  const localSeen = new Map();
  const removeLines = new Set();

  for (const image of images) {
    const normalized = normalizeImage(image.raw);
    const previousLine = localSeen.get(normalized);
    if (hero && normalized === normalizeImage(hero)) {
      failures.push(name + ':アイキャッチ画像と本文画像が重複');
      if (fix && image.kind === 'markdown') removeLines.add(image.line);
    } else if (previousLine !== undefined) {
      failures.push(name + ':本文画像が重複 (' + image.raw + ')');
      if (fix && image.kind === 'markdown') removeLines.add(image.line);
    } else {
      localSeen.set(normalized, image.line);
    }
  }

  if (fix && removeLines.size) {
    const next = original.split(/\r?\n/).filter((_, index) => !removeLines.has(index)).join('\n');
    fs.writeFileSync(file, next);
    fixed += removeLines.size;
  }

  const allImages = [hero, ...images.map((image) => image.raw)].filter(Boolean);
  for (const raw of allImages) {
    const normalized = normalizeImage(raw);
    const previous = seenAcrossArticles.get(normalized);
    if (previous && previous !== name) {
      failures.push(previous + ' / ' + name + ':記事間で画像が重複 (' + raw + ')');
    } else {
      seenAcrossArticles.set(normalized, name);
    }
  }
}

const extensions = new Set(['.md', '.astro', '.ts', '.js', '.json', '.yml', '.yaml', '.html', '.sql', '.toml']);
const dirs = ['src', 'public', 'supabase', 'database'];
const patterns = [
  { label: 'email', regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { label: 'Japanese phone', regex: /(?:\+81[- ]?)?0\d{1,4}[- ]\d{1,4}[- ]\d{3,4}/ },
  { label: 'Japanese postal code', regex: /(?:〒|郵便番号[：: ]*)\d{3}-\d{4}/ },
  { label: 'specific school grade', regex: /(?:中学|高校)[1-3１-３]年生/ }
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return extensions.has(path.extname(entry.name)) ? [full] : [];
  });
}

for (const dir of dirs) {
  for (const file of walk(path.join(root, dir))) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        failures.push(path.relative(root, file) + ':個人情報の可能性 (' + pattern.label + ')');
      }
    }
  }
}

if (fix && fixed) console.log('自動修正: 重複画像 ' + fixed + ' 件');
if (failures.length) {
  console.error('KNOT quality check failed:');
  for (const item of [...new Set(failures)]) console.error('- ' + item);
  process.exit(1);
}
console.log('KNOT content/privacy/image check passed: ' + files.length + ' blog posts checked.');
