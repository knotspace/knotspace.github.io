import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const OWNER = 'knotspace';
const REPOSITORY = 'kosen-question-bank';
const BRANCH = 'main';
const DESTINATION = resolve('src/data/study');
const FILES = [
  'private-math-beta.json',
  'private-past-bank.json',
  'private-practice-bank.json',
  'study-foundation.json',
  'public-exam.json',
  'public-exam-upgrade.json',
  'study-questions.json',
];

async function download(file) {
  const url = `https://raw.githubusercontent.com/${OWNER}/${REPOSITORY}/${BRANCH}/data/questions/${file}`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${file}`);
      const source = await response.text();
      const data = JSON.parse(source);
      const questions = Array.isArray(data) ? data : data?.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error(`${file}: questions must be a non-empty array`);
      }
      return { file, source: source.endsWith('\n') ? source : source + '\n', count: questions.length };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
}

// Download and validate every bank before replacing any local build inputs.
const downloaded = await Promise.all(FILES.map(download));
await mkdir(DESTINATION, { recursive: true });
for (const item of downloaded) {
  const destination = resolve(DESTINATION, item.file);
  const temporary = destination + '.download.tmp';
  await writeFile(temporary, item.source, 'utf8');
  await rename(temporary, destination);
  console.log(`Synced ${item.file}: ${item.count.toLocaleString('en-US')} questions`);
}
console.log(`Question bank synced from ${OWNER}/${REPOSITORY}@${BRANCH} (${downloaded.length} files).`);
