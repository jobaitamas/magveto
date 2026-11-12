# Magvető redesign – projektnapló (MINDEN FUTÁS ELŐTT OLVASD EL)

> Ez a fájl a projekt egyetlen igazságforrása. Új session elején: 1) olvasd el teljesen, 2) nézd meg a „Státusz" és „Következő lépés" részt, 3) csak utána dolgozz. Minden döntés után frissítsd.

## 1. Cél
- **Mi:** A magveto.hu néhány fő oldalának és flow-jának UX, UI és brand szempontból javított, lefejlesztett, élesre kirakott verziója.
- **Miért:** Bemutatni a Magvető Kiadónak (pitch / koncepció).
- **Határidő:** 1 hét a kick-offtól (kick-off: 2026-11-12 csüt.) → **2026-11-19** *(megerősítendő)*.
- **Siker mérése (szubjektív):**
  - Tartalom / irodalmi megfelelés: Tamás dönt.
  - UX: standard UX-elvek (Nielsen-heurisztikák, IA best practice), jelenlegi trendek; WCAG 2.2 AA akadálymentesség.

## 2. Scope (MVP)
| Oldal | Forrás URL |
|---|---|
| Főoldal | https://www.magveto.hu/ |
| Kiadványok (lista) | https://magveto.hu/index.php?action=list&mode=normal |
| Szerzők (lista) | https://magveto.hu/index.php?action=szerzok |
| Kiadvány aloldal (minta) | https://magveto.hu/index.php?action=konyv&id=139537122 (Mácsai Pál: Két kép között) |
| Szerző aloldal (minta) | https://magveto.hu/index.php?action=szerzo&id=5573 (Mácsai Pál) – a flow-kból következik |
| Sajtószoba | https://magveto.hu/index.php?action=rolunk („Rólunk írták") |
| Kapcsolat | https://magveto.hu/index.php?action=kapcsolat |
| Keresés találati lista | új oldal (a mostani oldalon nincs kereső) |

Flow-k:
1. Főoldal → Kiadványok → Kiadvány aloldal → Szerző aloldal
2. Főoldal → Szerzők → Szerző aloldal → Kiadvány aloldal
3. Főoldal keresés → Találati lista → Kiadvány vagy Szerző aloldal

Brand: új brand, **csak a jelenlegi logó marad**. Minden más (szín, tipó, layout, ikonok, képi világ) új.

Kontextus-forrás az identitáshoz: https://magveto.hu/index.php?action=kiadorol

## 3. Alapvetések (Tamástól, nem változtatható nélküle)
1. Csak valós tartalom (a példaoldalakról leszedve). **Semmilyen szakmai tartalmat (szerző, mű, leírás) nem adunk hozzá.** UI-szövegek (gombok, címkék, üres állapotok) írhatók.
2. Vizualitás a logón kívül teljesen újra.
3. Csak magyar nyelvű verzió.
4. Claude csinál mindent, Tamást csak a szükséges esetekben vonja be.
5. Minden exploration után: ellenőrzés a célokhoz → iteráció, ha kell → **jóváhagyás kérése Tamástól, mielőtt továbbmegyünk.**
6. Nem feltételezünk; bizonytalanságnál kérdezünk.
7. Ez a fájl tartalmaz minden döntést, módszertant, célt.

## 4. Munkafolyamat (fázisok, mindegyik végén jóváhagyási kapu ✋)
0. Setup: projektfájl, repo, hozzáférések
1. Tartalom-kinyerés → `content/*.json` + `public/images/` ✋ (gyors ellenőrzés)
2. Brand exploration: benchmark (külföldi kiadók) → 2–3 irány → önellenőrzés → ✋
3. IA + flow-k + wireframe-ek (sitemap, oldalsablonok, keresés logika) ✋
4. UI / design system (tokenek, komponensek, kulcsképernyők) ✋
5. Fejlesztés → preview deploy ✋
6. QA: a11y (WCAG 2.2 AA), Lighthouse, reszponzív, flow-teszt → éles ✋

## 5. Technikai tények (felmérés, 2026-11-12)
- A Claude felhős munkakörnyezete **nem éri el** a magveto.hu-t (proxy 403). GitHub elérhető, de a beépített gh token érvénytelen.
- Leszedés útja (terv): Tamás Chrome-ja (Claude in Chrome) – az oldalon futó JS-sel strukturált JSON + képek kinyerése, egy ZIP letöltése → Letöltések mappa → munkakörnyezet.
- Méretek: ~1250 kiadvány (125 oldal × 10), 252 szerző, több száz sajtóhír (2021–2026).
- URL-minták: könyv `index.php?action=konyv&id=<id>`, szerző `index.php?action=szerzo&id=<id>`, borító `media/kiadok/photo/<id>.jpg`.
- Ismert tartalmi hiányok a forrásban: szerző-aloldalakon gyakran nincs fotó és bio (Mácsai Pálnál sincs); egyes szerzőlinkek id nélküliek (törött). → design-szinten kezelni kell (üres állapot), tartalmat NEM pótolunk.
- Kapcsolat oldal: nincs űrlap, csak címek/telefonok/e-mailek/személyek.
- Logó: `https://magveto.hu/images/logo.jpg` (raszteres, fekete-fehér).

## 6. Tech stack (javaslat, jóváhagyásra vár)
- **Astro** (statikus tartalomoldal, gyors, egyszerű) + TypeScript, tartalom JSON-ból
- Keresés: kliensoldali (Pagefind vagy Fuse.js) – nincs szerver
- Hosting: **Vercel** (GitHub-ról automatikus deploy)
- **Supabase: MVP-ben nem kell** (nincs írás, nincs login, a keresés statikus). Ha később kell (pl. hírlevél), akkor bevonjuk.

## 7. Döntésnapló
| Dátum | Döntés | Ki |
|---|---|---|
| 2026-11-12 | Projekt indul, fázisok rögzítve | Tamás + Claude |
| 2026-11-12 | Tartalom mélysége: „flow-khoz elég" – főoldal összes könyve; Kiadványok legfrissebb ~50 tétel adatlappal; mind a 252 szerző névvel, szerző-aloldal a leszedett könyvek szerzőinek; legutóbbi ~50 sajtóhír; Kapcsolat teljes; Kiadóról (csak kontextusnak) | Tamás |
| 2026-11-12 | Repo: Tamás hozza létre (üres GitHub repo), a Vercelt is ő köti be; Claude a repóhoz push-hozzáférést kér (add_repo) | Tamás |
| 2026-11-12 | Láthatóság: nyilvános, de „Koncepcióterv – nem hivatalos oldal" sáv minden oldalon, `noindex`, nincs valódi vásárlás / űrlapküldés | Tamás |
| 2026-11-12 | Logó: Tamás feltölti a vektoros változatot | Tamás |

| 2026-11-12 | Logó: Tamás 512 px PNG-t adott (csak az „m” jel); Claude vektorizálta → `brand/logo.svg` (0 eltérő pixel). A régi fejlécben a jel mellett „MAGVETŐ KIADÓ” talpatlan felirat is van – kérdés: megtartjuk-e | Claude |
| 2026-11-12 | Leszedés módja: **GitHub Actions** (`.github/workflows/scrape.yml` + `scraper/scrape.py`), mert a Claude-környezet nem éri el a magveto.hu-t; Claude in Chrome nem csatlakozik; a beépített böngésző csak felderítésre kellett | Claude |
| 2026-11-12 | Képek: borító max 900 px, szerzőfotó max 800 px, WebP, a repóban (`public/media/`) | Claude |
| 2026-11-12 | Betűk: Google Fonts helyett önhosztolt @fontsource csomagok (npm-ről elérhetők, gyorsabb, GDPR-barátabb) | Claude |

## 7b. Forrásoldal-szerkezet (felderítve, a scraperhez)
- Tartalom a `<!-- CONTENT -->` és `<!-- FOOTER -->` közt; kezdőlap-karusszel a CONTENT előtt (`#featuredLarge li`).
- Könyv: `.konyv_cim`, `.konyv_szerzo a`, `.szlogen` (alcím), „Fordította:” sor, leírás = első hosszú div; bal oszlop: Megjelenés, Első kiadás dátuma, ISBN, „N oldal”, Méret, Ára, „E-könyvben is”, lira.hu vásárlás-link.
- Szerző: `media/kiadok/szerzok/...jpg` fotó (vagy `nincs_kep`), `.cim_nagy` név, rövid + hosszú bio (HTML), „A szerző kiadónál megjelent művei:” lista (`konyvek/slug/id`).
- Szerzők lista: 252 szerző, mindegyikhez rövid bio (`div.cim_nagy` + következő div).
- Sok helyen **üres szerző-id** (`szerzo&id=`) → név alapján párosítjuk a szerzőlistához.
- Kiadványok: 31 kategória/sorozat (`mode=t&t=<id>`), lapozás `limit`/`page`, rendezés `ord`.
- Sajtószoba (`rolunk`): egy oldalon az összes tétel (1,3 MB!); tétel: cím (forrás zárójelben), kapcsolódó könyv, dátum, `r_id` → aloldalon kivonat + „A teljes cikk itt olvasható” link + Forrás sor.
- Kereső: `index.php?action=kereses&op=kereses&keresett=...` (3 karakter minimum) – csak referenciának.
- Kapcsolat: egyetlen középre zárt szöveges blokk; e-mailek [pont]/[kukac] álcázással.

## 8. Nyitott kérdések
- Repo neve + GitHub összekötése a claude.ai-ban (Tamás)
- Határidő megerősítése: 2026-11-19?
- Tech stack (Astro, Supabase nélkül) jóváhagyása
- Logó-felirat: régi „MAGVETŐ KIADÓ” vagy új betűvel szedett „Magvető”?
- Brand irány választás (exploration v1: A Papír / B Kontraszt / C Polc; javaslat: A + B vonalai)
- Tipográfiai normalizálás engedélye (,, → „, szóköz, kis-nagybetű, névsorrend a kártyákon) – szöveg szóra pontosan marad
- Könyv-aloldalak köre: a scraper első futása után számok alapján döntünk (core = kezdőlap + 50 legfrissebb; + a szerzőik összes műve?)

## 9. Státusz
- Fázis 0: kész, kivéve repo/GitHub.
- Fázis 1 (leszedés): scraper + workflow kész, repóra vár.
- Fázis 2 (brand): exploration v1 kész → `brand/exploration-v1.html` (generátor: `/home/claude/build_explore.py`, sablon: `brand/exploration-template.html`) → **Tamás jóváhagyására vár**.

## 10. Következő lépés
- Tamás: repo + GitHub-összekötés, brand-irány döntés.
- Claude: repóba push → scrape workflow futtatása → eredmény ellenőrzése → Fázis 3 (IA + wireframe).
