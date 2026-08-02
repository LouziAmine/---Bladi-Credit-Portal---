#!/usr/bin/env node
import { PurgeCSS } from 'purgecss';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const browserDir = path.join(repoRoot, 'dist', 'bladi-credit-portal', 'browser');

const cssFiles = readdirSync(browserDir).filter((f) => f.endsWith('.css'));
if (cssFiles.length === 0) {
  throw new Error(`No CSS files found in ${browserDir} - did the build run first?`);
}

const totalBefore = cssFiles.reduce(
  (sum, f) => sum + statSync(path.join(browserDir, f)).size,
  0,
);

const results = await new PurgeCSS().purge({
  content: [
    path.join(browserDir, '*.js'),
    path.join(repoRoot, 'src/**/*.html'),
  ],
  css: cssFiles.map((f) => path.join(browserDir, f)),
  safelist: {
    standard: ['modal-open', 'modal-backdrop', 'offcanvas-backdrop'],
  },
});

let totalAfter = 0;
for (const result of results) {
  writeFileSync(result.file, result.css);
  totalAfter += Buffer.byteLength(result.css);
}

const savedKiB = ((totalBefore - totalAfter) / 1024).toFixed(1);
console.log(`purge-css: ${(totalBefore / 1024).toFixed(1)} KiB -> ${(totalAfter / 1024).toFixed(1)} KiB (saved ${savedKiB} KiB)`);