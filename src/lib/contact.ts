// Kapcsolat – a magveto.hu Kapcsolat oldalának adatai, szerkezetbe rendezve (szó szerint, csak tagolva).
// E-mail: felhasználó + domain külön tárolva; a böngésző rakja össze (spamvédelem, a forrás [pont]/[kukac] álcázása helyett).
// Telefon: a forrásban „235-5020” alak szerepel; megjelenítés és hívószám a budapesti +36 1 előhívóval (Tamás döntése, a kereskedelmi számoknál a forrás is így adja meg).
export type Mail = { u: string; d: string };
export type Person = { name: string; role?: string; phone?: string; mail?: Mail };
export type Group = { title: string; people: Person[]; phones?: string[]; mail?: Mail };

export const company = { name: 'Magvető Könyvkiadó és Kereskedelmi Kft.', address: '1086 Budapest, Dankó u. 4-8.' };

export const groups: Group[] = [
  { title: 'Igazgató', people: [{ name: 'Dávid Anna' }] },
  { title: 'Szerkesztőségi titkár', people: [{ name: 'Pinczési Botond', phone: '235-5020', mail: { u: 'magveto.kiado', d: 'lira.hu' } }] },
  { title: 'Szerkesztőség', people: [
    { name: 'Turi Tímea', role: 'főszerkesztő', mail: { u: 'turi.timea', d: 'lira.hu' } },
    { name: 'Rostás Eni', role: 'szerkesztő', mail: { u: 'rostas.eni', d: 'lira.hu' } },
    { name: 'Schmal Alexandra', role: 'szerkesztő', mail: { u: 'schmal.alexandra', d: 'gmail.com' } },
    { name: 'Szegő János', role: 'szerkesztő', mail: { u: 'szego.janos', d: 'lira.hu' } },
  ] },
  { title: 'PR és marketing', people: [
    { name: 'Árvai Judit', phone: '235-5021', mail: { u: 'arvai.judit', d: 'lira.hu' } },
    { name: 'Szigeti Szonja', phone: '235-5021', mail: { u: 'szigeti.szonja', d: 'lira.hu' } },
  ] },
  { title: 'Kereskedelmi képviselet', people: [], phones: ['(+36/1) 323-3981', '(+36/1) 235-5032'], mail: { u: 'kiadok', d: 'lira.hu' } },
  { title: 'Műszaki vezető', people: [{ name: 'Takács Klári', phone: '235-5033', mail: { u: 'takacs.klara', d: 'lira.hu' } }] },
  { title: 'Nemzetközi kapcsolattartó', people: [{ name: 'Orzóy Ágnes', phone: '235-5020', mail: { u: 'orzoy.agnes', d: 'lira.hu' } }] },
];
export const pressContacts = groups.find((g) => g.title === 'PR és marketing')!.people;

/** Megjelenítés nemzetközi alakban: „235-5020” / „(+36/1) 323-3981” → „+36 1 235 5020” (döntésnapló). */
export function telDisplay(p: string) {
  const local = p.replace(/^\(\+36\/1\)\s*/, '').replace(/\D/g, '');
  return `+36 1 ${local.slice(0, 3)} ${local.slice(3)}`;
}
export function telHref(p: string) {
  const digits = p.replace(/\D/g, '');
  if (p.includes('+36')) return '+' + digits;
  return '+361' + digits;
}
