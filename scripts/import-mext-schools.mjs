import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'src/data/game/schools.json');
const SOURCES = [
  'https://www.mext.go.jp/content/20260825-mxt_chousa01-000011635_2-1.csv',
  'https://www.mext.go.jp/content/20260825-mxt_chousa01-000011635_2-2.csv',
  'https://www.mext.go.jp/content/20260825-mxt_chousa01-000011635_4.csv',
  'https://www.mext.go.jp/content/20260825-mxt_chousa01-000011635_6.csv'
];
const TYPE_MAP = {A1:'幼稚園',A2:'幼保連携型認定こども園',B1:'小学校',C1:'中学校',C2:'義務教育学校',D1:'高等学校',D2:'中等教育学校',E1:'特別支援学校',F1:'大学',F2:'短期大学',G1:'高等専門学校',H1:'専修学校',H2:'各種学校'};
const OWNERSHIP_MAP = {'1':'国立','2':'公立','3':'私立'};
const PREFECTURES = ['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];

function parseCsv(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delimiters = [',', '\t', ';'];
  const delimiter = delimiters.sort((a,b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (quoted) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); if (row.some(v => v.trim())) rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  return rows;
}
function findColumn(headers, patterns) {
  return headers.findIndex(h => patterns.some(p => p.test(h.replace(/^\uFEFF/, '').trim())));
}
function pick(record, headers, patterns) {
  const i = findColumn(headers, patterns); return i < 0 ? '' : String(record[i] ?? '').trim();
}
const records = new Map();
for (const url of SOURCES) {
  console.log('Fetching', url);
  const response = await fetch(url, { headers: { 'user-agent': 'KNOT-School-Database-Importer/1.0' } });
  if (!response.ok) throw new Error(`MEXT CSV fetch failed: ${response.status} ${url}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  let csvText = new TextDecoder('utf-8').decode(bytes);
  if (!csvText.includes('学校コード') || !csvText.includes('学校名')) {
    try { csvText = new TextDecoder('shift_jis').decode(bytes); } catch {}
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) csvText = new TextDecoder('utf-16le').decode(bytes);
  const rows = parseCsv(csvText);
  if (rows.length < 2) continue;
  const headerIndex = rows.findIndex(r => r.some(v => /学校コード/.test(v)) && r.some(v => /学校名/.test(v)));
  if (headerIndex < 0) {
    console.log('Could not identify CSV header. First rows:', JSON.stringify(rows.slice(0, 3)));
    continue;
  }
  const headers = rows[headerIndex].map(v => v.replace(/^\uFEFF/, '').trim());
  console.log('Detected school CSV columns:', headers.slice(0, 20).join(' | '));
  for (const row of rows.slice(headerIndex + 1)) {
    const code = pick(row, headers, [/^学校コード$/,/学校コード/]);
    const name = pick(row, headers, [/学校名/,/学校名称/]);
    if (!code || !name) continue;
    if (pick(row, headers, [/廃止年月日/])) continue;
    const typeCode = pick(row, headers, [/学校種/]) || code.slice(0, 2);
    const schoolType = TYPE_MAP[typeCode] || typeCode;
    const ownershipCode = pick(row, headers, [/設置区分/,/設置者区分/,/国公私立/]) || code.slice(4, 5);
    const ownership = OWNERSHIP_MAP[ownershipCode] || ownershipCode;
    const prefectureCode = pick(row, headers, [/都道府県番号/]) || code.slice(2, 4);
    const prefecture = PREFECTURES[Number(prefectureCode) - 1] || pick(row, headers, [/都道府県/]);
    const city = pick(row, headers, [/市区町村/]);
    const address = pick(row, headers, [/所在地/,/住所/]);
    const postalCode = pick(row, headers, [/郵便番号/]);
    records.set(code, {
      schoolCode: code, name, schoolType, ownership, prefecture, city, address, postalCode,
      establishedBy: pick(row, headers, [/設置者名/,/設置者/]),
      department: pick(row, headers, [/学科/,/学部/]),
      integratedSchool: /中等教育学校|中高一貫|附属/.test(schoolType + name),
      officialUrl: '',
      sourceYear: '2026-05-01',
      source: '文部科学省 学校コード一覧'
    });
  }
}
if (records.size === 0) throw new Error('No schools imported. Check the CSV header diagnostics above.');
const schools = [...records.values()].sort((a,b) =>
  PREFECTURES.indexOf(a.prefecture) - PREFECTURES.indexOf(b.prefecture) ||
  a.schoolType.localeCompare(b.schoolType, 'ja') ||
  a.name.localeCompare(b.name, 'ja')
);
const schoolTypes = ['小学校','中学校','義務教育学校','中等教育学校','高等学校','特別支援学校','大学','短期大学','高等専門学校','専修学校','各種学校'];
const ownershipTypes = ['国立','公立','私立'];
const fields = ['schoolCode','name','schoolType','ownership','prefecture','city','address','postalCode','establishedBy','department','integratedSchool','officialUrl','sourceYear','source'];
const publicDir = path.join(ROOT, 'public/data/game/schools');
await mkdir(publicDir, { recursive: true });
const byPrefecture = new Map(PREFECTURES.map(pref => [pref, []]));
for (const school of schools) {
  if (byPrefecture.has(school.prefecture)) byPrefecture.get(school.prefecture).push(school);
}
const prefectureFiles = {};
for (let i = 0; i < PREFECTURES.length; i++) {
  const pref = PREFECTURES[i];
  const file = String(i + 1).padStart(2, '0') + '.json';
  const list = byPrefecture.get(pref) || [];
  await writeFile(path.join(publicDir, file), JSON.stringify({ prefecture: pref, count: list.length, schools: list }) + '\n', 'utf8');
  prefectureFiles[pref] = { file, count: list.length };
}
const output = {
  meta: {
    name: 'KNOT National School Database',
    schemaVersion: 2,
    source: '文部科学省 学校コード一覧',
    sourceUrl: 'https://www.mext.go.jp/b_menu/toukei/mext_01087.html',
    referenceDate: '2026-05-01',
    importedAt: new Date().toISOString(),
    status: 'imported',
    count: schools.length,
    note: '全国データは都道府県別JSONに分割。偏差値・入試倍率は別データで年度と出典を保持。'
  },
  prefectures: PREFECTURES,
  prefectureFiles,
  schoolTypes,
  ownershipTypes,
  fields
};
await writeFile(OUTPUT, JSON.stringify(output) + '\n', 'utf8');
console.log(`Imported ${schools.length} schools into ${PREFECTURES.length} prefecture files.`);
