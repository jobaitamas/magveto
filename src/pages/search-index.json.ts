// Kereső-index: build közben készül egy JSON fájl, ezt tölti be a böngésző.
import { books, authors } from '../lib/data';
export async function GET() {
  const docs = [
    ...authors.map((a) => ({ id: 'a' + a.id, type: 'author', title: a.name, sub: [a.years, a.short].filter(Boolean).join(' · ').slice(0, 140),
      extra: a.sortName, href: `/szerzok/${a.slug}`, img: a.photo?.src ?? null, rank: a.workIds.length })),
    ...books.map((b) => ({ id: 'b' + b.id, type: 'book', title: b.title, sub: b.authors.map((x) => x.name).join(', '),
      extra: [b.subtitle, b.translator, b.isbn].filter(Boolean).join(' '), href: `/konyvek/${b.slug}`, img: b.cover?.thumb ?? null, rank: 0 })),
  ];
  return new Response(JSON.stringify(docs), { headers: { 'Content-Type': 'application/json' } });
}
