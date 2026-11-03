import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const blogDir = path.join(root, 'src/content/blog');
const fix = process.argv.includes('--fix');
const normalize = value => { try { const u = new URL(value); return u.origin + u.pathname; } catch { return value; } };
const failures = [];
const seen = new Map();
let fixed = 0;
const files = fs.readdirSync(blogDir).filter(name => name.endsWith('.md')).sort();
for (const name of files) {
  const file = path.join(blogDir, name);
  const original = fs.readFileSync(file, 'utf8');
  const hero = original.match(/^heroImage:\s*["']([^"']+)["']/m)?.[1];
  const local = new Set();
  const output = [];
  for (const line of original.split(/\r?\n/)) {
    const match = line.match(/^!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)\s*$/);
    if (!match) { output.push(line); continue; }
    const image = normalize(match[1]);
    if (hero && image === normalize(hero)) {
      if (fix) { fixed++; continue; }
      failures.push(name + ':本文画像とアイキャッチ画像が重複');
      output.push(line);
      continue;
    }
    if (local.has(image)) {
      if (fix) { fixed++; continue; }
      failures.push(name + ':本文画像が重複');
    }
    local.add(image);
    output.push(line);
  }
  const next = output.join('\n');
  if (fix && next !== original) fs.writeFileSync(file, next);
  for (const raw of [hero, ...local].filter(Boolean)) {
    const image = normalize(raw);
    const previous = seen.get(image);
    if (previous && previous !== name) failures.push(previous + ' / ' + name + ':記事間で画像が重複');
    else seen.set(image, name);
  }
}
const extensions = new Set(['.md','.astro','.ts','.js','.json','.yml','.yaml','.html','.sql','.toml']);
const dirs = ['src','public','supabase','database'];
const patterns = [
  {label:'email', regex:/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i},
  {label:'Japanese phone', regex:/(?:\+81[- ]?)?0\d{1,4}[- ]\d{1,4}[- ]\d{3,4}/},
  {label:'Japanese postal code', regex:/〒?\d{3}-\d{4}/}
];
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => {
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) return walk(full);
    return extensions.has(path.extname(entry.name))?[full]:[];
  });
}
for (const dir of dirs) for (const file of walk(path.join(root,dir))) {
  const content=fs.readFileSync(file,'utf8');
  for (const p of patterns) if(p.regex.test(content)) failures.push(path.relative(root,file)+':個人情報の可能性 ('+p.label+')');
}
if (fix && fixed) console.log('自動修正: 重複画像 ' + fixed + ' 件');
if (failures.length) {
  console.error('KNOT quality check failed:');
  for(const item of [...new Set(failures)]) console.error('- '+item);
  process.exit(1);
}
console.log('KNOT content/privacy check passed: ' + files.length + ' blog posts checked.');
