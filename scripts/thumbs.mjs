// Kisméretű (360 px széles) borító-bélyegképek készítése a listákhoz.
// Csak a hiányzókat készíti el, így gyors. Build előtt fut (npm run build).
import sharp from 'sharp';
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
const src = 'public/media/covers', out = 'public/media/covers/thumb';
if (!existsSync(out)) mkdirSync(out, { recursive: true });
let n = 0;
for (const f of readdirSync(src)) {
  if (!f.endsWith('.webp')) continue;
  const dest = `${out}/${f}`;
  if (existsSync(dest)) continue;
  await sharp(`${src}/${f}`).resize({ width: 360 }).webp({ quality: 78 }).toFile(dest);
  n++;
}
console.log(`thumbs: ${n} új bélyegkép`);

// Líra-bannerek: az animált GIF-ből statikus első képkocka (WCAG 2.2.2: ne legyen magától mozgó tartalom).
const bsrc = 'public/media/banners';
if (existsSync(bsrc)) for (const f of readdirSync(bsrc)) {
  if (!f.endsWith('.gif')) continue;
  const dest = `${bsrc}/${f.replace('.gif', '.webp')}`;
  if (!existsSync(dest)) await sharp(`${bsrc}/${f}`, { pages: 1 }).webp({ quality: 82 }).toFile(dest);
}
