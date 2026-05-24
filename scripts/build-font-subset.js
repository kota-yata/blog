import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Fontmin = require('fontmin');

const root = process.cwd();
const sourceDir = path.join(root, 'static', 'fonts', 'gen-interface-jp');
const destDir = path.join(sourceDir, 'subset');

const sourceDefinitions = [
  { dir: path.join(root, 'src', 'contents', 'posts'), exts: ['.md'] },
  { dir: path.join(root, 'src', 'contents', 'posts-en'), exts: ['.md'] },
  { dir: path.join(root, 'src', 'routes'), exts: ['.svelte', '.ts'] },
  { dir: path.join(root, 'src', 'lib'), exts: ['.svelte', '.ts'] },
];

const collectFiles = (dir, exts) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath, exts);
    if (!exts.includes(path.extname(entry.name))) return [];
    return [fullPath];
  });
};

const files = sourceDefinitions.flatMap(({ dir, exts }) => collectFiles(dir, exts));
const text = files.map((file) => fs.readFileSync(file, 'utf8')).join('');
const glyphText = Array.from(new Set(text)).join('');

if (!glyphText) {
  console.warn('No glyphs found for subset generation.');
  process.exit(0);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Font source directory not found: ${sourceDir}`);
  process.exit(1);
}

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir, { recursive: true });

const fontmin = new Fontmin()
  .src(path.join(sourceDir, '*.ttf'))
  .use(Fontmin.glyph({ text: glyphText }))
  .dest(destDir);

fontmin.run((err, generated) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Generated ${generated.length} subset fonts in ${path.relative(root, destDir)}`);
});
