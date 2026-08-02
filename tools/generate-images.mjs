#!/usr/bin/env node
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const master = path.join(publicDir, 'logo.png');

const variants = [
  { name: 'logo-sm', width: 74, height: 64 },
  { name: 'logo-md', width: 368, height: 320 },
];

for (const { name, width, height } of variants) {
  const png = path.join(publicDir, `${name}.png`);
  const webp = path.join(publicDir, `${name}.webp`);
  await sharp(master).resize(width, height).png({ quality: 90, palette: true, compressionLevel: 9 }).toFile(png);
  await sharp(master).resize(width, height).webp({ quality: 75, effort: 6 }).toFile(webp);
  console.log(`wrote ${name}.png / ${name}.webp (${width}x${height})`);
}

await sharp(master).webp({ quality: 75, effort: 6 }).toFile(path.join(publicDir, 'logo.webp'));
console.log('wrote logo.webp (536x465)');
