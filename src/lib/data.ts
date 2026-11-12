// Adatréteg: a leszedett JSON-okból (content/) egységes, összekötött modellt épít.
// Build közben fut egyszer; az oldalak innen kérik el az adatokat.
import rawBooks from '../../content/books.json';
import rawAuthors from '../../content/authors.json';
import rawIndex from '../../content/authorIndex.json';
import rawCats from '../../content/categories.json';
import rawPress from '../../content/press.json';
import rawHome from '../../content/home.json';
import listOrder from '../../content/listOrder.json';
import { typo, fixCaps, displayName, sortName, splitLifespan, slugify, fold, cleanHtml, collator, letterOf, stripHtml } from './text';

export type Cover = { src: string; thumb: string; w?: number; h?: number } | null;
export interface AuthorRef { id: string | null; name: string; slug: string | null }
export interface Book {
  id: string; slug: string; title: string; subtitle: string; translator: string;
  authors: AuthorRef[]; description: string[]; cover: Cover;
  published: string | null; firstEdition: string | null; expected: string | null;
  pages: number | null; plannedPages: string | null; size: string | null; price: string | null; plannedPrice: string | null;
  isbn: string | null; hasEbook: boolean; buyUrl: string | null; ebookUrl: string | null;
  forthcoming: boolean; categoryIds: string[]; sortKey: string; altText: string;
}
export interface Author {
  id: string; slug: string; name: string; sortName: string; years: string | null; letter: string;
  short: string; bioHtml: string; photo: { src: string; w?: number; h?: number } | null;
  workIds: string[]; untrackedWorks: string[];
}
export interface Category { id: string; name: string; slug: string; bookIds: string[]; kind: 'mufaj' | 'sorozat' }
export interface PressItem {
  id: string; slug: string; title: string; source: string; date: string; bookId: string | null; bookTitle: string;
  bodyHtml: string; originalUrl: string | null; sourceLine: string | null; excerpt: string;
}

// ---------- szerzők
const indexShort = new Map((rawIndex as any[]).map((a) => [a.id, a.short]));
const usedAuthorSlugs = new Set<string>();
export const authors: Author[] = (rawAuthors as any[]).map((a) => {
  const { years } = splitLifespan(fixCaps(a.name));
  let slug = slugify(displayName(a.name));
  if (usedAuthorSlugs.has(slug)) slug = `${slug}-${a.id}`;
  usedAuthorSlugs.add(slug);
  const sn = sortName(a.name);
  return {
    id: a.id, slug, name: displayName(a.name), sortName: sn, years, letter: letterOf(sn),
    short: typo(indexShort.get(a.id) || a.short || ''),
    bioHtml: cleanHtml(a.bioHtml),
    photo: a.photo ? { src: a.photo.src, w: a.photo.w, h: a.photo.h } : null,
    workIds: (a.works || []).map((w: any) => w.bookId).filter(Boolean),
    untrackedWorks: [],
  };
}).sort((x, y) => collator.compare(x.sortName, y.sortName));
export const authorById = new Map(authors.map((a) => [a.id, a]));
const authorByFold = new Map<string, Author>();
for (const a of authors) { authorByFold.set(fold(a.sortName), a); authorByFold.set(fold(a.name), a); }
export function resolveAuthor(id: string | null | undefined, name: string): Author | undefined {
  if (id && authorById.has(id)) return authorById.get(id);
  return authorByFold.get(fold(sortName(name))) || authorByFold.get(fold(displayName(name)));
}

// ---------- kategóriák (a kiadó saját besorolása; csak megjelenítés, nem szűrő – IA-5)
const SERIES_HINT = /(sorozat|művei|életmű|zsebkönyvtár|tények és tanúk|időmérték|klasszikusok|színház az egész|alapdarab)/i;
export const categories: Category[] = (rawCats as any[]).map((c) => ({
  id: c.id, name: c.name, slug: slugify(c.name), bookIds: c.bookIds, kind: SERIES_HINT.test(c.name) ? 'sorozat' : 'mufaj',
}));
export const categoryById = new Map(categories.map((c) => [c.id, c]));

// ---------- könyvek
const forthcomingIds = new Set(((rawHome as any).sections?.elo || []).map((c: any) => c.bookId));
const homeExtra = new Map<string, any>();
for (const c of ((rawHome as any).sections?.elo || [])) homeExtra.set(c.bookId, c.extra || {});
const usedBookSlugs = new Map<string, number>();
const tmpBooks = (rawBooks as any[]).map((b) => ({ b, base: slugify(b.title) }));
for (const { base } of tmpBooks) usedBookSlugs.set(base, (usedBookSlugs.get(base) || 0) + 1);

function paragraphs(desc: string | null): string[] {
  if (!desc) return [];
  return typo(desc).split(/\n{1,}/).map((p) => p.trim()).filter(Boolean);
}

export const books: Book[] = tmpBooks.map(({ b, base }) => {
  const m = b.meta || {};
  const extra = homeExtra.get(b.id) || {};
  const expected = m.expected || extra['Várható megjelenés'] || null;
  const forthcoming = forthcomingIds.has(b.id) || (!!expected && !m.published);
  const auths: AuthorRef[] = (b.authors || []).map((a: any) => {
    const r = resolveAuthor(a.id, a.name);
    return { id: r?.id ?? null, name: r?.name ?? displayName(a.name), slug: r?.slug ?? null };
  });
  const slug = (usedBookSlugs.get(base) || 0) > 1 ? `${base}-${b.id}` : base;
  const title = typo(b.title);
  return {
    id: b.id, slug, title, subtitle: typo(b.subtitle || ''), translator: b.translator || '',
    authors: auths, description: paragraphs(b.description),
    cover: b.cover ? { src: b.cover.src, thumb: b.cover.src.replace('/covers/', '/covers/thumb/'), w: b.cover.w, h: b.cover.h } : null,
    published: m.published || null, firstEdition: m.firstEdition || null, expected,
    pages: m.pages ?? null, plannedPages: extra['Tervezett oldalszám'] || m.plannedPages || null,
    size: m.size || null, price: m.price || null, plannedPrice: extra['Tervezett ár'] || m.plannedPrice || null,
    isbn: m.isbn || null, hasEbook: !!m.hasEbook, buyUrl: b.buyUrl || null, ebookUrl: b.ebookUrl || null,
    forthcoming, categoryIds: b.categories || [],
    sortKey: (m.published || m.firstEdition || (expected ? expected + '-28' : '') || '0000') + '|' + String(b.id).padStart(12, '0'),
    altText: `${auths.map((a) => a.name).join(', ')}${auths.length ? ': ' : ''}${title} – borító`,
  };
});
export const bookById = new Map(books.map((b) => [b.id, b]));
export const booksNewest = [...books].sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));

// szerzők művei: csak a ténylegesen leszedett adatlapok linkelhetők
for (const a of authors) {
  const raw = (rawAuthors as any[]).find((x) => x.id === a.id);
  a.untrackedWorks = (raw?.works || []).filter((w: any) => !bookById.has(w.bookId)).map((w: any) => typo(w.title));
  a.workIds = a.workIds.filter((id) => bookById.has(id))
    .sort((x, y) => (bookById.get(x)!.sortKey < bookById.get(y)!.sortKey ? 1 : -1));
}
// könyv → szerző kapcsolat a szerzőoldalak műlistájából is (ha a könyvoldalon nincs feloldva)
for (const a of authors) for (const id of a.workIds) {
  const b = bookById.get(id)!;
  if (!b.authors.some((x) => x.id === a.id) && b.authors.every((x) => !x.id) && b.authors.length <= 1) {
    b.authors = [{ id: a.id, name: a.name, slug: a.slug }];
  }
}

// ---------- sajtó
export const press: PressItem[] = (rawPress as any[]).map((p) => {
  let body = cleanHtml(p.bodyHtml || '');
  body = body.replace(/<p>[^<]*<a [^>]*>[^<]*(teljes cikk|olvasható)[^<]*<\/a>[^<]*<\/p>/gi, '');
  body = body.replace(/<p>\s*Forrás:[\s\S]*?<\/p>/gi, '');
  const date = (p.date || '').slice(0, 10);
  return {
    id: p.id, slug: `${p.id}-${slugify(p.title)}`.slice(0, 90), title: typo(p.title), source: p.source || '',
    date, bookId: bookById.has(p.bookId) ? p.bookId : null, bookTitle: typo(p.bookTitle || ''),
    bodyHtml: body, originalUrl: p.originalUrl || null, sourceLine: p.sourceLine ? typo(p.sourceLine) : null,
    excerpt: stripHtml(body).slice(0, 240),
  };
});
export function pressForBook(id: string) { return press.filter((p) => p.bookId === id); }
export function pressForAuthor(a: Author) { const s = new Set(a.workIds); return press.filter((p) => p.bookId && s.has(p.bookId)); }

// ---------- kezdőlap
const H = rawHome as any;
function ref(id: string) { return bookById.get(id); }
const seen = new Set<string>();
export const home = {
  featured: (H.carousel || []).map((c: any) => ref(c.bookId)).filter(Boolean) as Book[],
  newest: [] as Book[],
  forthcoming: (H.sections?.elo || []).map((c: any) => ref(c.bookId)).filter(Boolean) as Book[],
  toplist: (H.toplist || []).map((t: any) => ({ rank: t.rank, book: ref(t.bookId), title: typo(t.title), author: displayName(t.author || ''),
    authorRef: resolveAuthor(t.authorId, t.author || '') })),
  events: [] as { date: Date; label: string; time: string; title: string; url: string }[],
  video: H.video as { src: string; title: string } | null,
  newsletterUrl: H.newsletterUrl as string | null,
  banners: (H.banners || []) as { img: string; href: string }[],
};
home.featured.forEach((b) => seen.add(b.id));
home.newest = [...(H.sections?.uj || []), ...(H.sections?.kiemelt || []), ...(H.sections?.ekonyv_ujdonsag || [])]
  .map((c: any) => ref(c.bookId)).filter((b: Book | undefined): b is Book => !!b && !seen.has(b.id))
  .filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);
if (home.newest.length < 4) for (const id of listOrder as string[]) {
  const b = ref(id); if (b && !seen.has(b.id) && !home.newest.includes(b) && !b.forthcoming) home.newest.push(b);
  if (home.newest.length >= 8) break;
}
// események: római hónap + nap, év nélkül → a build napjához viszonyítva csak a jövőbeliek (IA-3)
const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
const today = new Date(); today.setHours(0, 0, 0, 0);
for (const e of (H.events || [])) {
  const m = (e.date || '').match(/^([IVX]+)\.\s*(\d{1,2})\./);
  if (!m) continue;
  let d = new Date(today.getFullYear(), ROMAN[m[1]] - 1, +m[2]);
  if (d.getTime() < today.getTime() - 1000 * 60 * 60 * 24 * 180) d = new Date(today.getFullYear() + 1, ROMAN[m[1]] - 1, +m[2]);
  if (d < today) continue;
  const t = (e.text || '').match(/^(\d{1,2}:\d{2})\s*(.*)$/);
  const title = typo((t ? t[2] : e.text).replace(/\s*│\s*/g, ' │ ').trim());
  home.events.push({ date: d, label: e.date, time: t ? t[1] : '', title, url: e.url });
}

export const listOrderIds = listOrder as string[];
export const stats = { books: books.length, authors: authors.length, press: press.length };
