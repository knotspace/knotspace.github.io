import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('map');
const destination = path.resolve('dist/map');

if (!fs.existsSync(source)) {
  console.warn('MAP source directory not found; skipping static copy.');
  process.exit(0);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, { recursive: true, force: true });
console.log('Copied MAP PWA files to dist/map.');
