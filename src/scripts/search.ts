// Kliensoldali kereső (böngészőben fut, szerver nélkül).
// A kereső-index (/search-index.json) build közben készül; csak az első fókuszkor töltjük le.
import MiniSearch from 'minisearch';

export type Doc = { id: string; type: 'book' | 'author'; title: string; sub: string; extra: string; href: string; img: string | null; rank: number };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let mini: MiniSearch<Doc> | null = null;
let loading: Promise<MiniSearch<Doc>> | null = null;

export function loadIndex(): Promise<MiniSearch<Doc>> {
  if (mini) return Promise.resolve(mini);
  if (loading) return loading;
  loading = fetch('/search-index.json').then((r) => r.json()).then((docs: Doc[]) => {
    const ms = new MiniSearch<Doc>({
      fields: ['title', 'sub', 'extra'],
      storeFields: ['type', 'title', 'sub', 'href', 'img', 'rank'],
      processTerm: (t) => fold(t),
      searchOptions: { prefix: true, fuzzy: (term) => (term.length > 4 ? 0.2 : false), boost: { title: 3, sub: 1.5 }, combineWith: 'AND' },
    });
    ms.addAll(docs);
    mini = ms;
    return ms;
  });
  return loading;
}

export function search(ms: MiniSearch<Doc>, q: string) {
  const res = ms.search(q).map((r: any) => ({ ...r, score: r.score * (r.type === 'author' ? 1.6 : 1) }));
  res.sort((a: any, b: any) => b.score - a.score);
  return { authors: res.filter((r: any) => r.type === 'author'), books: res.filter((r: any) => r.type === 'book') };
}

function esc(s: string) { return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!)); }
/** A keresett szórészek kiemelése ékezetfüggetlenül. */
export function highlight(text: string, q: string) {
  const terms = fold(q).split(/\s+/).filter((t) => t.length > 0);
  if (!terms.length) return esc(text);
  const f = fold(text);
  const marks: [number, number][] = [];
  for (const t of terms) { let i = f.indexOf(t); while (i !== -1) { marks.push([i, i + t.length]); i = f.indexOf(t, i + t.length); } }
  if (!marks.length) return esc(text);
  marks.sort((a, b) => a[0] - b[0]);
  let out = '', pos = 0;
  for (const [s, e] of marks) { if (s < pos) continue; out += esc(text.slice(pos, s)) + '<mark>' + esc(text.slice(s, e)) + '</mark>'; pos = e; }
  return out + esc(text.slice(pos));
}

export function initSearchBox() {
  const form = document.querySelector<HTMLFormElement>('[data-search]');
  if (!form) return;
  const input = form.querySelector<HTMLInputElement>('input')!;
  const pop = form.querySelector<HTMLElement>('#q-pop')!;
  const list = form.querySelector<HTMLUListElement>('#q-list')!;
  const all = form.querySelector<HTMLAnchorElement>('[data-all]')!;
  const status = form.querySelector<HTMLElement>('[data-status]')!;
  let active = -1;

  const close = () => { pop.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; };
  const options = () => Array.from(list.querySelectorAll<HTMLAnchorElement>('[role="option"]'));
  const setActive = (i: number) => {
    const opts = options(); if (!opts.length) return;
    active = (i + opts.length) % opts.length;
    opts.forEach((o, k) => o.setAttribute('aria-selected', String(k === active)));
    input.setAttribute('aria-activedescendant', opts[active].id);
    opts[active].scrollIntoView({ block: 'nearest' });
  };

  async function render() {
    const q = input.value.trim();
    if (!q) { close(); return; }
    const ms = await loadIndex();
    if (input.value.trim() !== q) return;
    const { authors, books } = search(ms, q);
    const a = authors.slice(0, 3), b = books.slice(0, 5);
    let html = '';
    let n = 0;
    const opt = (r: any) => `<li role="presentation"><a role="option" id="opt-${n++}" aria-selected="false" href="${r.href}">${r.img ? `<img class="opt-img${r.type === 'author' ? ' round' : ''}" src="${r.img}" alt="" width="32" height="48" loading="lazy">` : `<span class="opt-img${r.type === 'author' ? ' round' : ''}" aria-hidden="true"></span>`}<span><span class="opt-t">${highlight(r.title, q)}</span><br><span class="opt-s">${highlight(r.sub || '', q)}</span></span></a></li>`;
    if (a.length) html += `<li role="presentation" class="grp" aria-hidden="true">Szerzők</li>` + a.map(opt).join('');
    if (b.length) html += `<li role="presentation" class="grp" aria-hidden="true">Kiadványok</li>` + b.map(opt).join('');
    if (!a.length && !b.length) html = `<li role="presentation" class="empty">Nincs találat erre: „${esc(q)}”. Próbáld rövidebben vagy más szóval.</li>`;
    list.innerHTML = html;
    const total = authors.length + books.length;
    all.href = `/kereses?q=${encodeURIComponent(q)}`;
    all.textContent = total ? `Összes találat (${total}) →` : 'Keresés indítása →';
    status.textContent = total ? `${authors.length} szerző és ${books.length} kiadvány található. Nyilakkal választhatsz.` : 'Nincs találat.';
    pop.hidden = false; input.setAttribute('aria-expanded', 'true'); active = -1;
  }

  let t: number | undefined;
  input.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(render, 90); });
  input.addEventListener('focus', () => { loadIndex(); if (input.value.trim()) render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (pop.hidden) render(); else setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Escape') { close(); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); window.location.href = options()[active].href; }
  });
  form.addEventListener('submit', (e) => { if (!input.value.trim()) e.preventDefault(); });
  document.addEventListener('click', (e) => { if (!form.contains(e.target as Node)) close(); });
}
