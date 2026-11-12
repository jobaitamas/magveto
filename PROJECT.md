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
| 2026-11-12 | **Brand: „A – Papír” irány** (Newsreader + Instrument Sans; papír #F5F1E8, tinta #1B1A17, grafit #5E5A52, pecsétpiros #A4281B) | Tamás |
| 2026-11-12 | Logó: kell a „Magvető” felirat is; a régi oldali logót (`images/logo.jpg`, 295×97) a scraper letölti → vektorizálni; ha a minősége kevés, nyitott tétel marad | Tamás |
| 2026-11-12 | Határidő megerősítve: 2026-11-19. Stack: Astro, Supabase nélkül | Tamás |
| 2026-11-12 | Repo: https://github.com/jobaitamas/magveto (push-hoz a Claude GitHub App telepítése kell a repóra) | Tamás |
| 2026-11-12 | Első leszedés kész (GitHub Actions): 325 könyv (59 „core” = kezdőlap + 50 legfrissebb, + a core-szerzők összes műve), 252 szerző (176 fotóval, 148 hosszú bióval), 50 sajtótétel, 31 kategória; 74 hiba, főleg hiányzó (404) képfájl a forrásszerveren. Minden szerző műlistájában összesen 687 mű van | Claude |
| 2026-11-12 | Logó-felirat: a régi `logo.jpg` 295×97 px, pontos vektorizálás nem lehetséges → újraszedés a legközelebbi ingyenes betűvel: **Montserrat 500, nagybetű, ritkítva, két sor („MAGVETŐ / KIADÓ”)**. Ez rekonstrukció, nem az eredeti; a pitchnél jelezni / az eredeti vektort a kiadótól kérni | Claude |
| 2026-11-12 | IA-1: scope-on kívüli oldalak (A kiadóról, E-könyv, Hírek, Kéziratról, English) → a láblécben a mostani oldalra linkelünk (↗) | Tamás |
| 2026-11-12 | IA-2: a szerzőoldalakon szereplő **összes** mű adatlapját leszedjük (`--works all`) – teljesebb kép, nincs zsákutca | Tamás |
| 2026-11-12 | IA-3: események közül csak a jövőbeliek látszanak (build-időpont szerint; a dátum év nélkül van a forrásban → az aktuális/következő évre értelmezzük) | Tamás |
| 2026-11-12 | IA-4: Líra-bannerek **maradnak**, de konszolidáltan (kisebb, kevésbé prominens „Ajánló” hely). Kutatás: a Magvető anyacége a Líra Könyv Zrt.; 1993-as privatizáció után a Líra és Lant Rt. (ma Líra Könyv Zrt.) vásárolta meg, azóta önállóan működik a Líra-csoporton belül. A Líra kiadói csoport + könyvesbolt-hálózat + nagykereskedő → a vásárlás-linkek (lira.hu) és a bannerek a kiadó saját értékesítési csatornái. Következmény: lábléc „A Líra-csoport tagja” + csoportlinkek; „Megvásárolom a Líránál” marad elsődleges CTA | Tamás + Claude |
| 2026-11-12 | IA-5: nincs műfajszűrő az MVP-ben (rendezés + állapot: Megjelent / Előkészületben / E-könyvben is), **de a meglévő besorolás megmarad**: a könyv oldalán címkék, a címke egy kategóriaoldalra visz („a kiadó besorolása szerint”, darabszámmal). Ez Claude értelmezése → Tamás ellenőrizze a Fázis 4-ben | Tamás |
| 2026-11-12 | IA-6: tipográfiai normalizálás engedélyezve (,, → „ ”, hiányzó szóköz írásjel után, CSUPA NAGYBETŰS nevek → Mácsai Pál, „Ernaux, Annie” → „Annie Ernaux” megjelenítésben; névsorrendhez az eredeti forma). A szöveg szóra pontosan marad | Tamás |
| 2026-11-12 | Fázis 3 (IA) **jóváhagyva** | Tamás |
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
- Claude GitHub App telepítése a repóra (push blokkolva nélküle)
- Vercel: Tamás köti be a repót (Import project → jobaitamas/magveto), amikor az Astro-projekt fent van
- Tipográfiai normalizálás engedélye (,, → „, szóköz, kis-nagybetű, névsorrend a kártyákon) – szöveg szóra pontosan marad
- Könyv-aloldalak köre: a scraper első futása után számok alapján döntünk (core = kezdőlap + 50 legfrissebb; + a szerzőik összes műve?)

## 9. Státusz
- Fázis 0: kész, kivéve repo/GitHub.
- Fázis 1 (leszedés): kész (lásd döntésnapló). Kategória-címkék teljes bejárása folyamatban/kész (`--only-categories`).
- Fázis 2 (brand): **jóváhagyva – A „Papír”**. Részletes design system a Fázis 4-ben.
- Fázis 3 (IA + wireframe): **jóváhagyva** (`ia/ia-wireframes-v1.html` + döntésnapló IA-1…6).
- Fázis 4 (design system + kulcsképernyők): indul – kódban (Astro), élő preview-n bemutatva: stílusoldal + Kezdőlap + Kiadvány aloldal.

## 10. Következő lépés
- Claude: Fázis 4 Astro-ban → push → Tamás beköti a Vercelt → preview link jóváhagyásra.
- GitHub Actions indítása: `gh api -X POST repos/jobaitamas/magveto/actions/workflows/scrape.yml/dispatches -f ref=main -f 'inputs[...]=...'` (a `gh workflow run` GraphQL miatt nem megy).
