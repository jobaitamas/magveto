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
