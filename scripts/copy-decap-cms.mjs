import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';

const source = resolve('node_modules/decap-cms/dist/decap-cms.js');
const destination = resolve('public/admin/decap-cms.js');
await mkdir(dirname(destination), { recursive: true });
await copyFile(source, destination);
await build({
  entryPoints: ['public/admin/gutenberg-editor.js'],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  outfile: 'public/admin/gutenberg-editor.bundle.js',
  legalComments: 'none',
  logLevel: 'info'
});
console.log('Built the isolated Gutenberg editor bundle.');
