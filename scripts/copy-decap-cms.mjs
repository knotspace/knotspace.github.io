import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const source = resolve('node_modules/decap-cms/dist/decap-cms.js');
const destination = resolve('public/admin/decap-cms.js');
await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
console.log('Copied pinned Decap CMS bundle into the local admin assets.');
