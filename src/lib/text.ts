// Szöveg-segédfüggvények. FONTOS: csak a FORMÁT igazítjuk (idézőjel, szóköz, kis-nagybetű),
// a szöveg tartalmát soha nem írjuk át (döntésnapló IA-6).

const HU_LOWER = 'a-záéíóöőúüű';
const HU_UPPER = 'A-ZÁÉÍÓÖŐÚÜŰ';

/** Magyar tipográfia: ,,szöveg" → „szöveg”, "szöveg" → „szöveg”, hiányzó szóköz vessző után. */
export function typo(s: string | null | undefined): string {
  if (!s) return '';
  let t = s;
  t = t.replace(/,,\s?/g, '„');                       // ,, → „
  t = t.replace(/„([^„"”]*?)["“]/g, '„$1”');          // „…" → „…”
  t = t.replace(/(^|[\s(\[–-])"([^"]+?)"/g, '$1„$2”'); // "…" → „…”
  t = t.replace(new RegExp(`([${HU_LOWER}]),(?=[${HU_LOWER}${HU_UPPER}])`, 'g'), '$1, '); // a,b → a, b
  t = t.replace(new RegExp(`([${HU_LOWER}]{2})\\.(?=[${HU_UPPER}][${HU_LOWER}])`, 'g'), '$1. '); // szó.Szó → szó. Szó
  t = t.replace(/ - /g, ' – ');                        // gondolatjel
  return t;
}

/** CSUPA NAGYBETŰS név → Kezdőbetűs (pl. MÁCSAI PÁL → Mácsai Pál). Vegyes írásmódhoz nem nyúl. */
export function fixCaps(name: string): string {
  if (!name) return name;
  const letters = name.replace(/[^A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]/g, '');
  if (!letters || letters !== letters.toUpperCase()) return name;
  return name.toLocaleLowerCase('hu').replace(/(^|[\s\-.(])([a-záéíóöőúüű])/g, (_, a, b) => a + b.toLocaleUpperCase('hu'));
}

/** Név szétbontása: „Esterházy Péter (1950–2016)” → { name: 'Esterházy Péter', years: '1950–2016' } */
export function splitLifespan(raw: string): { name: string; years: string | null } {
  const m = raw.match(/^(.*?)\s*\(([^()]*\d{4}[^()]*)\)\s*$/);
  if (!m) return { name: raw.trim(), years: null };
  return { name: m[1].trim(), years: m[2].replace(/\s*-\s*/g, '–').replace(/\s*–\s*/g, '–').trim() };
}

/** Megjelenítési név: „Ernaux, Annie” → „Annie Ernaux”. A magyar (vessző nélküli) nevekhez nem nyúl. */
export function displayName(raw: string): string {
  const { name } = splitLifespan(fixCaps(raw));
  const parts = name.split(', ');
  if (parts.length === 2 && !/\d/.test(name)) return `${parts[1]} ${parts[0]}`;
  return name;
}

/** Rendezési név: a forrás szerinti alak (Vezetéknév, Utónév), életévek nélkül. */
export function sortName(raw: string): string {
  return splitLifespan(fixCaps(raw)).name;
}

/** Ékezetek nélküli, kisbetűs alak kereséshez és párosításhoz. */
export function fold(s: string): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** URL-barát „slug”: Két kép között → ket-kep-kozott */
export function slugify(s: string): string {
  return fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'x';
}

export const collator = new Intl.Collator('hu', { sensitivity: 'base', numeric: true });

/** Magyar ábécé szerinti betűcsoport (a hosszú magánhangzók a rövid párjukkal egy csoportban). */
const DIGRAPHS = ['Dzs', 'Cs', 'Dz', 'Gy', 'Ly', 'Ny', 'Sz', 'Ty', 'Zs'];
const MERGE: Record<string, string> = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ő': 'Ö', 'Ú': 'U', 'Ű': 'Ü', 'Dzs': 'D', 'Dz': 'D' };
export const HU_ALPHABET = ['A','B','C','Cs','D','E','F','G','Gy','H','I','J','K','L','Ly','M','N','Ny','O','Ö','P','Q','R','S','Sz','T','Ty','U','Ü','V','W','X','Y','Z','Zs'];
export function letterOf(name: string): string {
  const n = name.trim();
  for (const d of DIGRAPHS) if (n.startsWith(d)) return MERGE[d] ?? d;
  const c = n.charAt(0).toLocaleUpperCase('hu');
  return MERGE[c] ?? c;
}

/** HTML-tisztítás a forrásból jövő bio/sajtó szövegekhez: stílusok, font-tagek, üres bekezdések ki. */
export function cleanHtml(html: string | null | undefined): string {
  if (!html) return '';
  let h = html;
  h = h.replace(/\s(style|class|align|face|size|color|lang)="[^"]*"/gi, '');
  h = h.replace(/<\/?(font|span|o:p)[^>]*>/gi, '');
  h = h.replace(/<p>\s*(&nbsp;|\s|<br\s*\/?>)*\s*<\/p>/gi, '');
  h = h.replace(/<a ([^>]*?)target="_blank"([^>]*)>/gi, '<a $1$2 target="_blank" rel="noopener">');
  // szövegcsomópontok tipográfiája
  h = h.replace(/>([^<]+)</g, (_, txt) => '>' + typo(txt) + '<');
  return h.trim();
}

export function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Rövid kivonat szóhatáron. */
export function excerpt(s: string, max = 220): string {
  if (!s || s.length <= max) return s || '';
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:–\s]+$/, '') + '…';
}

const MONTHS = ['január','február','március','április','május','június','július','augusztus','szeptember','október','november','december'];
/** 2026-11-03 → 2026. november 3. ; 2026-11 → 2026. november */
export function huDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return iso;
  const [, y, mo, d] = m;
  return `${y}. ${MONTHS[+mo - 1]}${d ? ' ' + (+d) + '.' : ''}`;
}
export function monthName(n: number) { return MONTHS[n - 1]; }

/** „6499 Ft” → „6 499 Ft” (magyar ezres tagolás, nem törő szóközzel) */
export function price(p: string | null | undefined): string {
  if (!p) return '';
  return p.replace(/(\d+)/, (n) => Number(n).toLocaleString('hu-HU').replace(/\s/g, ' ')).replace(/\s*Ft/, ' Ft');
}
