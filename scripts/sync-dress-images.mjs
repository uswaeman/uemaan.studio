import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dressesDir = path.join(root, 'public', 'assets', 'dresses');
const outFile = path.join(root, 'src', 'data', 'dressImages.ts');

const imageExt = /\.(jpg|jpeg|png|webp)$/i;

const entries = fs.existsSync(dressesDir)
  ? fs.readdirSync(dressesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  : [];

const map = {};
for (const slug of entries) {
  const folder = path.join(dressesDir, slug);
  const files = fs
    .readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isFile() && imageExt.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
    .map((file) => `/assets/dresses/${slug}/${file}`);

  if (files.length) {
    map[slug] = files;
  }
}

const lines = [
  'export const dressImages: Record<string, string[]> = {',
  ...Object.entries(map).map(([slug, files]) => `  ${JSON.stringify(slug)}: ${JSON.stringify(files)},`),
  '};',
  '',
  'export const imagesForDress = (slug: string, fallback: string[]) =>',
  '  dressImages[slug]?.length ? dressImages[slug] : fallback;',
  '',
];

fs.writeFileSync(outFile, lines.join('\n'));
console.log(`Updated ${path.relative(root, outFile)} with ${Object.keys(map).length} folders.`);
