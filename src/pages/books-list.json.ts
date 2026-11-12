// Tömör könyvlista a Kiadványok oldal kliensoldali rendezéséhez, szűréséhez és „Továbbiak” betöltéséhez.
import { booksNewest, authorById } from '../lib/data';
import { price, huDate } from '../lib/text';
export async function GET() {
  const rows = booksNewest.map((b, i) => {
    const first = b.authors[0];
    const so = first?.id ? authorById.get(first.id)?.sortName ?? first.name : first?.name ?? '';
    return {
      s: b.slug, t: b.title, st: b.subtitle, a: b.authors.map((x) => x.name).join(', '), so,
      c: b.cover?.thumb ?? null, h: b.cover?.w && b.cover?.h ? Math.round((b.cover.h / b.cover.w) * 360) : 540,
      p: b.forthcoming ? '' : price(b.price), f: b.forthcoming, e: b.hasEbook, n: i, alt: b.altText,
      ex: b.expected ? huDate(b.expected) : '',
    };
  });
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
}
