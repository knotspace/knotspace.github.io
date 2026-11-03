import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const banks = [
  { name: '総合問題演習', file: 'src/data/study/study-questions.json', question: 'q', choices: 'a', answer: 'c', explanation: 'e' },
  { name: '基礎網羅', file: 'src/data/study/study-foundation.json', question: 'prompt', choices: 'options', answer: 'correct' },
  { name: '高専対策', file: 'src/data/study/kosen-questions.json', question: 'q', choices: 'choices', answer: 'answer' }
];
const errors = [];
const warnings = [];
const ids = new Set();
const questionTexts = new Map();
const explanationTexts = new Map();
const summaryFor = (topic) => {
  const value = String(topic || '');
  if (value.includes('物理')) return 'physics';
  if (value.includes('化学')) return 'chemistry';
  if (value.includes('生物')) return 'biology';
  if (value.includes('地学')) return 'earth';
  if (value.includes('地理')) return 'geography';
  if (value.includes('歴史')) return 'history';
  if (value.includes('公民')) return 'civics';
  return null;
};

let total = 0;
for (const bank of banks) {
  const file = path.join(root, bank.file);
  let questions;
  try {
    questions = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    errors.push(`[${bank.name}] JSONを読み込めません: ${error.message}`);
    continue;
  }
  if (!Array.isArray(questions)) {
    errors.push(`[${bank.name}] 問題データが配列ではありません。`);
    continue;
  }
  total += questions.length;
  for (const [index, item] of questions.entries()) {
    const label = `[${bank.name} / ${item?.id || index + 1}]`;
    if (!item || typeof item !== 'object') {
      errors.push(`${label} 問題データがオブジェクトではありません。`);
      continue;
    }
    if (typeof item.id !== 'string' || !item.id.trim()) errors.push(`${label} IDがありません。`);
    else if (ids.has(item.id)) errors.push(`${label} IDが重複しています。`);
    else ids.add(item.id);

    if (typeof item[bank.question] !== 'string' || !item[bank.question].trim()) errors.push(`${label} 問題文がありません。`);
    const choices = item[bank.choices];
    if (!Array.isArray(choices) || choices.length !== 4 || choices.some(choice => typeof choice !== 'string' || !choice.trim())) {
      errors.push(`${label} 選択肢は空欄のない4択にしてください。`);
    } else if (new Set(choices.map(choice => choice.trim())).size !== 4) {
      errors.push(`${label} 選択肢が重複しています。`);
    }
    if (!Number.isInteger(item[bank.answer]) || item[bank.answer] < 0 || item[bank.answer] > 3) {
      errors.push(`${label} 正解番号が0〜3の範囲外です。`);
    }
    const explanation = item[bank.explanation || 'explanation'];
    if (typeof explanation !== 'string' || explanation.trim().length < 12) {
      errors.push(`${label} 解説がないか、短すぎます。`);
    }
    const slug = summaryFor(item.topic);
    if (slug && item.link !== `/study/summary/${slug}/`) {
      errors.push(`${label} 関連まとめリンクが分野と一致しません（期待: /study/summary/${slug}/）。`);
    }
    const normalized = String(item[bank.question] || '').replace(/[\s　]/g, '');
    if (normalized) questionTexts.set(normalized, (questionTexts.get(normalized) || 0) + 1);
    const explanationText = String(explanation || '').trim();
    if (explanationText) explanationTexts.set(explanationText, (explanationTexts.get(explanationText) || 0) + 1);
  }
}

// 公式過去問の自動採点データも検証する。
const mockFile = path.join(root, 'src/data/study/mock-2026-social.json');
try {
  const mock = JSON.parse(fs.readFileSync(mockFile, 'utf8'));
  if (!Array.isArray(mock.questions)) {
    errors.push('[高専過去問] 問題データが配列ではありません。');
  } else {
    if (mock.questions.length !== 25) errors.push(`[高専過去問] 問題数が25問ではありません（${mock.questions.length}問）。`);
    const mockIds = new Set();
    let points = 0;
    for (const [index, question] of mock.questions.entries()) {
      const label = `[高専過去問 / ${question?.id || index + 1}]`;
      if (!question || typeof question !== 'object') {
        errors.push(`${label} 問題データが不正です。`);
        continue;
      }
      if (typeof question.id !== 'string' || mockIds.has(question.id)) errors.push(`${label} IDがないか重複しています。`);
      mockIds.add(question.id);
      if (!Array.isArray(question.choices) || question.choices.length < 4 || question.choices.length > 6) errors.push(`${label} 選択肢数が4〜6個ではありません。`);
      if (!question.choices?.includes(question.correct)) errors.push(`${label} 正解が選択肢に含まれていません。`);
      if (!Number.isInteger(question.points) || question.points !== 4) errors.push(`${label} 配点が4点ではありません。`);
      points += Number(question.points) || 0;
    }
    if (points !== 100) errors.push(`[高専過去問] 配点合計が100点ではありません（${points}点）。`);
  }
  if (mock.minutes !== 50) errors.push('[高専過去問] 制限時間が50分ではありません。');
  if (!mock.source?.problem || !mock.source?.answer) errors.push('[高専過去問] 公式問題・解答の出典URLがありません。');
} catch (error) {
  errors.push(`[高専過去問] 自動採点データを読み込めません: ${error.message}`);
}

for (const slug of ['physics', 'chemistry', 'biology', 'earth', 'geography', 'civics']) {
  const summaryPath = path.join(root, `src/pages/study/summary/${slug}.astro`);
  try {
    const page = fs.readFileSync(summaryPath, 'utf8');
    if (!page.includes(`<SummaryBoost slug="${slug}" />`)) errors.push(`[${slug}] 要点まとめの強化コンテンツが組み込まれていません。`);
  } catch {
    errors.push(`[${slug}] 要点まとめページを読み込めません。`);
  }
}

for (const [question, count] of questionTexts) {
  if (count > 1) warnings.push(`同じ問題文が${count}件あります: ${question.slice(0, 50)}`);
}
for (const [explanation, count] of explanationTexts) {
  if (count >= 4) warnings.push(`同じ解説が${count}問で使われています: ${explanation.slice(0, 55)}`);
}

console.log(`Study問題チェック: ${total}問を確認`);
if (warnings.length) {
  console.warn(`注意: ${warnings.length}件`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}
if (errors.length) {
  console.error(`エラー: ${errors.length}件`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('問題形式・ID・正解番号・解説・関連リンクにエラーはありません。');
}
