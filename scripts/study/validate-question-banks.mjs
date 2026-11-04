#!/usr/bin/env node
// KNOT Study 問題バンク検証スクリプト
//   使い方: npm run study:validate            (人が読む要約)
//           npm run study:validate -- --json  (機械可読)
//           npm run study:validate -- --strict (警告もエラー扱い)
//
// 既存の4種類のスキーマ(q/choices/answer, prompt/options/correct, q/a/c/e)を
// 共通形に正規化して検査する。データは一切書き換えない(読み取り専用)。
//
// エラー(終了コード1): 公開してはいけない構造的な欠陥
// 警告: 品質上の注意(正解位置の偏り、重複、最長選択肢が正解になりやすい等)

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(ROOT, 'src/data/study');
const args = new Set(process.argv.slice(2));

// [ファイル, 問題配列を取り出す関数, 出典情報の必須度]
//   provenance: 'required' = sourceType 必須(過去問系) / 'optional'
const BANKS = [
  ['private-math-beta.json', (d) => d.questions, 'required'],
  ['private-past-bank.json', (d) => d.questions, 'required'],
  ['private-practice-bank.json', (d) => d.questions, 'optional'],
  ['study-foundation.json', (d) => d.questions, 'optional'],
  ['public-exam.json', (d) => d.questions, 'optional'],
  ['public-exam-upgrade.json', (d) => d.questions, 'required'],
  ['study-questions.json', (d) => d, 'optional'],
];

const errors = [];
const warnings = [];
const err = (file, id, msg) => errors.push({ file, id, msg });
const warn = (file, id, msg) => warnings.push({ file, id, msg });

function normalize(q) {
  if ('choices' in q) return { text: q.q, choices: q.choices, answer: q.answer, explanation: q.explanation };
  if ('options' in q) return { text: q.prompt, choices: q.options, answer: q.correct, explanation: q.explanation };
  return { text: q.q, choices: q.a, answer: q.c, explanation: q.e };
}

// /study/summary/<name>/ が実在するページか
const summaryDir = join(ROOT, 'src/pages/study/summary');
const summaryPages = new Set(['/study/summary/']);
if (existsSync(summaryDir)) {
  for (const f of readdirSync(summaryDir)) {
    if (f.endsWith('.astro') && f !== 'index.astro') summaryPages.add(`/study/summary/${f.slice(0, -6)}/`);
  }
}

const idLocations = new Map(); // id -> [file,...]
const stats = [];

for (const [file, pick, provenance] of BANKS) {
  const path = join(DATA, file);
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    err(file, '-', `JSONを読み込めない: ${e.message}`);
    continue;
  }
  const questions = pick(raw);
  if (!Array.isArray(questions)) {
    err(file, '-', '問題配列が見つからない');
    continue;
  }

  const seenIds = new Set();
  const seenText = new Map();
  const answerPos = [0, 0, 0, 0, 0, 0];
  let correctLongest = 0;

  for (const q of questions) {
    const id = q.id ?? '(idなし)';
    if (!q.id) err(file, id, 'idがない');
    if (seenIds.has(id)) err(file, id, '同一ファイル内でID重複');
    seenIds.add(id);
    if (!idLocations.has(id)) idLocations.set(id, []);
    idLocations.get(id).push(file);

    const n = normalize(q);
    if (typeof n.text !== 'string' || !n.text.trim()) err(file, id, '問題文が空');
    if (!Array.isArray(n.choices) || n.choices.length !== 4) {
      err(file, id, `選択肢が4つではない(${Array.isArray(n.choices) ? n.choices.length : '配列でない'})`);
      continue;
    }
    if (n.choices.some((c) => typeof c !== 'string' || !c.trim())) err(file, id, '空の選択肢がある');
    if (new Set(n.choices).size !== n.choices.length) err(file, id, '選択肢に同一の文言がある');
    if (!Number.isInteger(n.answer) || n.answer < 0 || n.answer >= n.choices.length) {
      err(file, id, `正答indexが範囲外(${n.answer})`);
      continue;
    }
    answerPos[n.answer]++;
    const maxLen = Math.max(...n.choices.map((c) => c.length));
    if (n.choices[n.answer].length === maxLen && n.choices.filter((c) => c.length === maxLen).length === 1) correctLongest++;
    if (typeof n.explanation !== 'string' || !n.explanation.trim()) err(file, id, '解説が空');

    if (q.link && q.link.startsWith('/study/summary/') && !summaryPages.has(q.link)) {
      err(file, id, `要点まとめのリンク先が存在しない: ${q.link}`);
    }
    if (provenance === 'required') {
      if (!q.sourceType) err(file, id, 'sourceType(原本/再構成/オリジナルの区別)がない');
      if (/公式過去問/.test(q.level ?? '') && !q.sourceBig) err(file, id, '公式過去問と表示しているのに出典(sourceBig)がない');
    }
    // 解説の段階的説明と誤答解説(高品質問題の基準)
    if (provenance === 'required' && (!q.solutionSteps || !q.choiceNotes)) {
      warn(file, id, '段階的解説(solutionSteps)または誤答解説(choiceNotes)がない');
    }
    if (q.choiceNotes && q.choiceNotes.length !== n.choices.length) {
      err(file, id, `choiceNotesの数(${q.choiceNotes.length})が選択肢数と違う`);
    }

    // 問題文と選択肢集合の両方が同じ場合だけ重複とみなす(同じ設問文で選択肢が違う問題は正当)
    const key = n.text.replace(/\s+/g, '') + '|' + [...n.choices].sort().join('|');
    if (seenText.has(key)) warn(file, id, `問題文・選択肢が ${seenText.get(key)} と同一(重複の可能性)`);
    else seenText.set(key, id);
  }

  const total = questions.length;
  const maxPos = Math.max(...answerPos.slice(0, 4));
  if (total >= 20 && maxPos / total > 0.4) {
    const pos = answerPos.indexOf(maxPos);
    warn(file, '(全体)', `正解位置が偏っている: 選択肢${pos + 1}が ${maxPos}/${total} 問(${Math.round((maxPos / total) * 100)}%)`);
  }
  if (total >= 20 && correctLongest / total > 0.5) {
    warn(file, '(全体)', `最長の選択肢が正解になりやすい: ${correctLongest}/${total} 問(${Math.round((correctLongest / total) * 100)}%)`);
  }
  stats.push({ file, total, answerPos: answerPos.slice(0, 4), correctLongest });
}

for (const [id, files] of idLocations) {
  if (files.length > 1) warn(files.join(' + '), id, 'ファイルをまたいでID重複');
}

if (args.has('--json')) {
  console.log(JSON.stringify({ stats, errors, warnings }, null, 2));
} else {
  console.log('KNOT Study 問題バンク検証\n');
  for (const s of stats) {
    console.log(`  ${s.file.padEnd(30)} ${String(s.total).padStart(5)}問  正解位置(1〜4番目)=${s.answerPos.join('/')}`);
  }
  const show = (label, list) => {
    console.log(`\n${label}: ${list.length}件`);
    for (const x of list.slice(0, 40)) console.log(`  - [${x.file}] ${x.id}: ${x.msg}`);
    if (list.length > 40) console.log(`  ... 他 ${list.length - 40} 件(--json で全件)`);
  };
  show('エラー', errors);
  show('警告', warnings);
}

const fail = errors.length > 0 || (args.has('--strict') && warnings.length > 0);
process.exit(fail ? 1 : 0);
