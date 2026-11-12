#!/usr/bin/env python3
"""
Magvető tartalom-leszedő (csak a projekt scope-jában lévő oldalak).

Futtatás: GitHub Actions-ben (a Claude-munkakörnyezet nem éri el a magveto.hu-t).
    python scraper/scrape.py --works scope     # alapértelmezett
    python scraper/scrape.py --works none      # csak indexek + szerzők, könyv-aloldalak nélkül (számoláshoz)

Kimenet:
    content/home.json, content/books.json, content/authors.json, content/press.json,
    content/categories.json, content/pages/kapcsolat.html, content/pages/kiadorol.html,
    content/_report.json  (statisztika, hibák)
    public/media/covers/<id>.webp, public/media/authors/<id>.webp
    scraper/raw.tar.gz    (nyers HTML-ek, újrafeldolgozáshoz)

Szabály: NEM találunk ki tartalmat. Ami nincs a forrásban, az üres marad (None / []).
"""
import argparse, io, json, os, re, sys, tarfile, time, unicodedata
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urljoin, urlparse, parse_qs

import requests
from bs4 import BeautifulSoup, NavigableString
from PIL import Image

BASE = "https://magveto.hu/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "content")
MEDIA = os.path.join(ROOT, "public", "media")
UA = "Mozilla/5.0 (concept-redesign content snapshot; contact: repo owner)"
S = requests.Session()
S.headers["User-Agent"] = UA
RAW = {}          # path -> html (nyers mentéshez)
ERRORS = []

# ---------------------------------------------------------------- helpers
def get(path, tries=3):
    url = urljoin(BASE, path)
    for i in range(tries):
        try:
            r = S.get(url, timeout=30)
            r.encoding = "utf-8"
            if r.status_code == 200:
                RAW[path] = r.text
                time.sleep(0.15)  # udvarias tempó
                return r.text
            ERRORS.append({"url": url, "status": r.status_code})
            return None
        except Exception as e:
            if i == tries - 1:
                ERRORS.append({"url": url, "error": str(e)})
            time.sleep(1 + i * 2)
    return None

def soup(html):
    return BeautifulSoup(html or "", "html.parser")

def txt(el):
    if el is None:
        return None
    t = el.get_text(" ", strip=True)
    t = re.sub(r"\s+", " ", t).strip()
    return t or None

def multiline(el):
    """Szöveg bekezdésekkel (br és sortörés megtartva)."""
    if el is None:
        return None
    for br in el.find_all("br"):
        br.replace_with("\n")
    t = el.get_text("", strip=False)
    t = t.replace("\r", "")
    lines = [re.sub(r"[ \t]+", " ", l).strip() for l in t.split("\n")]
    out, blank = [], 0
    for l in lines:
        if l:
            out.append(l); blank = 0
        else:
            blank += 1
            if blank == 1 and out:
                out.append("")
    t = "\n".join(out).strip()
    return t or None

def qid(href, key="id"):
    if not href:
        return None
    href = href.replace("&amp;", "&")
    m = re.search(r"/(\d+)/?$", urlparse(href).path)   # konyvek/slug/123
    if key == "id" and m and "konyvek" in href:
        return m.group(1)
    v = parse_qs(urlparse(href).query).get(key, [None])[0]
    return v or None

def norm_name(n):
    if not n:
        return ""
    n = re.sub(r"\(.*?\)", "", n)
    n = unicodedata.normalize("NFC", n).casefold()
    return re.sub(r"\s+", " ", n).strip(" ,")

def content_part(html):
    a = html.find("<!-- CONTENT -->"); b = html.find("<!-- FOOTER -->")
    return html[a:b] if a >= 0 and b > a else html

def parse_card(div):
    """Főoldali / oldalsáv kártya (main_szerzo, cim, szlogen, teaser)."""
    a_cover = div.select_one("a.cim img")
    title_a = None
    for a in div.select("a.cim"):
        if a.get_text(strip=True):
            title_a = a; break
    if not title_a:
        return None
    au = div.select_one(".main_szerzo a, .top_szerzo a, .felso_szerzo a")
    card = {
        "bookId": qid(title_a.get("href")),
        "title": txt(title_a),
        "author": txt(au),
        "authorId": qid(au.get("href")) if au else None,
        "subtitle": txt(div.select_one(".szlogen")),
        "translator": None,
        "teaser": None,
        "extra": {},
    }
    info = title_a.find_parent("div").find_parent("div") if title_a.find_parent("div") else None
    if info:
        for d in info.find_all("div", recursive=False):
            t = txt(d)
            if not t or d.select_one(".main_szerzo, a.cim") or "szlogen" in (d.get("class") or []) or "main_szerzo" in (d.get("class") or []):
                continue
            if t.startswith("Fordította"):
                card["translator"] = t.split(":", 1)[1].strip()
            elif ":" in t and len(t) < 60 and d.find("strong"):
                k, v = t.split(":", 1); card["extra"][k.strip()] = v.strip()
            elif not card["teaser"]:
                card["teaser"] = t
    return card

# ---------------------------------------------------------------- home
def scrape_home():
    html = get("index.php")
    sp = soup(html)
    home = {"carousel": [], "sections": {}, "toplist": [], "events": [], "video": None, "newsletterUrl": None}
    for li in sp.select("#featuredLarge li"):
        img = li.select_one("img")
        au = li.select_one(".felso_szerzo a")
        more = li.select_one("a[href*='konyvek/']")
        divs = [d for d in li.select("td div") if not d.get("class") and txt(d) and not d.find("a") and not d.find("div")]
        home["carousel"].append({
            "bookId": qid(more.get("href")) if more else (re.search(r"photo/(\d+)", img["src"]).group(1) if img else None),
            "title": txt(li.select_one(".felso_cim")),
            "author": txt(au),
            "authorId": qid(au.get("href")) if au else None,
            "teaser": txt(divs[-1]) if divs else None,
        })
    c = soup(content_part(html))
    # szekciók: a fejléc-kép linkje (mode=...) után következő .boxes
    for head in c.select("img.fejlecKep"):
        a = head.find_parent("a")
        key = None
        if a and "mode=" in a.get("href", ""):
            key = qid(a["href"], "mode")
        src = head.get("src", "")
        if "toplista" in src: key = "toplista"
        if "esemenynaptar" in src: key = "esemenynaptar"
        if "hirlevel" in src: key = "hirlevel"
        box = head.find_parent("div").find_next_sibling("div", class_="boxes")
        if not box or not key:
            continue
        if key == "toplista":
            for i, d in enumerate(box.select("div .top_szerzo"), 1):
                wrap = d.find_parent("div")
                a2 = wrap.select_one("a.cim")
                home["toplist"].append({"rank": i, "author": txt(d.find("a")), "authorId": qid(d.find("a").get("href")),
                                        "title": txt(a2), "bookId": qid(a2.get("href"))})
        elif key == "esemenynaptar":
            cells = [x for x in box.find_all(["td", "div"]) ]
            # dátum cellák és linkek párosítása szöveg alapján
            raw = box.get_text("\n", strip=True).split("\n")
            links = box.select("a")
            dates = [t for t in raw if re.match(r"^[IVX]+\.\s*\d{2}\.$", t)]
            for dt, a3 in zip(dates, links):
                home["events"].append({"date": dt, "text": txt(a3), "url": a3.get("href")})
        elif key == "hirlevel":
            l = box.select_one("a"); home["newsletterUrl"] = l.get("href") if l else None
        else:
            cards = []
            for a3 in box.select("a.cim"):
                if a3.get_text(strip=True):
                    card = parse_card(a3.find_parent("div").find_parent("div").find_parent("div") or box)
                    if card and card["bookId"] not in [x["bookId"] for x in cards]:
                        cards.append(card)
            home["sections"][key] = cards
    yt = c.select_one("iframe[src*='youtube']")
    if yt:
        home["video"] = {"src": yt["src"], "title": yt.get("title")}
    return home

# ---------------------------------------------------------------- categories
def scrape_categories(pages_per_cat):
    html = get("index.php?action=list&mode=normal&limit=50")
    c = soup(content_part(html))
    cats = []
    for a in c.select("a[href*='mode=t&t='], a[href*='mode=t&amp;t=']"):
        cats.append({"id": qid(a["href"], "t"), "name": txt(a), "bookIds": []})
    def fill(cat):
        for p in range(1, pages_per_cat + 1):
            h = get(f"index.php?action=list&mode=t&t={cat['id']}&limit=50&ord=datum%20DESC&page={p}")
            if not h: break
            ids = [qid(a["href"]) for a in soup(content_part(h)).select("a.cim_nagy")]
            if not ids: break
            cat["bookIds"] += [i for i in ids if i]
            if len(ids) < 50: break
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(fill, cats))
    return cats, html

def parse_list(html):
    c = soup(content_part(html))
    items = []
    for a in c.select("a.cim_nagy"):
        bid = qid(a["href"])
        if bid and bid not in items:
            items.append(bid)
    return items

# ---------------------------------------------------------------- authors
def scrape_author_index():
    html = get("index.php?action=szerzok")
    c = soup(content_part(html))
    out = []
    for h in c.select("div.cim_nagy"):
        a = h.select_one("a[href*='action=szerzo']")
        if not a: continue
        short = h.find_next_sibling("div")
        out.append({"id": qid(a["href"]), "name": txt(a), "short": txt(short) if short and "további részletek" not in (txt(short) or "") else None})
    return out

def scrape_author(aid):
    html = get(f"index.php?action=szerzo&id={aid}")
    if not html: return None
    c = soup(content_part(html))
    name_el = c.select_one("div.cim_nagy")
    if not name_el: return None
    block = name_el.find_parent("div")
    img = c.select_one("img[src*='media/kiadok/szerzok'], img[src*='nincs_kep']")
    sibs = [d for d in name_el.find_next_siblings("div")]
    short = txt(sibs[0]) if sibs else None
    long_html = None
    if len(sibs) > 1 and sibs[1].find(["p", "br", "strong"]):
        long_html = str(sibs[1]); long_html = re.sub(r"^<div[^>]*>|</div>$", "", long_html).strip()
    works = []
    marker = c.find(string=re.compile("kiadónál megjelent művei"))
    if marker:
        for d in marker.find_parent("div").find_next_siblings("div"):
            a = d.select_one("a.cim")
            if a: works.append({"bookId": qid(a["href"]), "title": txt(a)})
    photo = img["src"] if img and "nincs_kep" not in img["src"] else None
    return {"id": aid, "name": txt(name_el), "short": short, "bioHtml": long_html,
            "photoSrc": urljoin(BASE, photo) if photo else None, "works": works}

# ---------------------------------------------------------------- books
LABELS = [("Megjelenés", "published"), ("Első kiadás dátuma", "firstEdition"), ("ISBN", "isbn"),
          ("Méret", "size"), ("Ára", "price"), ("Várható megjelenés", "expected"),
          ("Tervezett ár", "plannedPrice"), ("Tervezett oldalszám", "plannedPages"), ("Sorozat", "series")]

def scrape_book(bid):
    html = get(f"index.php?action=konyv&id={bid}")
    if not html: return None
    c = soup(content_part(html))
    title = c.select_one(".konyv_cim")
    if not title: return None
    main = title.find_parent("div")
    authors = []
    for a in c.select(".konyv_szerzo a"):
        authors.append({"name": txt(a), "id": qid(a.get("href"))})
    if not authors and c.select_one(".konyv_szerzo"):
        n = txt(c.select_one(".konyv_szerzo"))
        if n: authors.append({"name": n, "id": None})
    subtitle, translator, desc, extra_lines = None, None, None, []
    for d in title.find_next_siblings("div"):
        cls = d.get("class") or []
        if "szlogen" in cls and not subtitle:
            subtitle = txt(d); continue
        t = txt(d)
        if not t: continue
        if t.startswith("Fordította"):
            translator = t.split(":", 1)[1].strip(); continue
        if desc is None and len(t) > 80:
            desc = multiline(d); continue
        extra_lines.append(t)
    left = c.select_one("img[src*='media/kiadok/photo']")
    lefttd = left.find_parent("td") if left else None
    meta, raw_meta, buy, ebook = {}, [], None, None
    if lefttd:
        for d in lefttd.find_all("div"):
            if d.find("div"): continue
            t = txt(d)
            if not t: continue
            raw_meta.append(t)
            m = re.match(r"^(\d+)\s*oldal$", t)
            if m: meta["pages"] = int(m.group(1)); continue
            for lab, key in LABELS:
                if t.startswith(lab + ":") or t.startswith(lab + " :"):
                    meta[key] = t.split(":", 1)[1].strip()
        for a in lefttd.select("a[href]"):
            h = a["href"]
            if "jcbs" in h or "/konyv/" in h: buy = buy or h
            if "ekonyv" in h: ebook = ebook or h
        meta["hasEbook"] = "E-könyvben is" in lefttd.get_text()
    return {"id": str(bid), "title": txt(title), "subtitle": subtitle, "authors": authors,
            "translator": translator, "description": desc, "extraLines": extra_lines,
            "coverSrc": urljoin(BASE, left["src"]) if left else None, "meta": meta, "rawMeta": raw_meta,
            "buyUrl": buy, "ebookUrl": ebook}

# ---------------------------------------------------------------- press
def scrape_press(limit):
    html = get("index.php?action=rolunk")
    c = soup(content_part(html))
    items = []
    for h in c.select("div.cim_nagy")[:limit]:
        a = h.select_one("a")
        if not a: continue
        rid = qid(a["href"], "r_id")
        full = txt(a)
        m = re.match(r"^(.*)\s\(([^()]*)\)\s*$", full or "")
        rel = h.find_next_sibling("div")
        rb = rel.select_one("a") if rel else None
        date = h.find_next("i")
        items.append({"id": rid, "title": m.group(1) if m else full, "source": m.group(2) if m else None,
                      "fullTitle": full, "bookId": qid(rb["href"]) if rb else None, "bookTitle": txt(rb),
                      "date": txt(date)})
    def detail(it):
        h = get(f"index.php?action=rolunk&r_id={it['id']}")
        if not h: return
        d = soup(content_part(h))
        head = d.select_one("div.cim_nagy")
        body = None
        for sib in head.find_next_siblings("div") if head else []:
            if sib.find("p"):
                body = sib; break
        if body:
            link = body.find("a", string=re.compile("teljes cikk|tovább|olvasható", re.I)) or body.select_one("a[href^='http']")
            it["originalUrl"] = link["href"] if link else None
            src = body.find(string=re.compile(r"^\s*Forrás:"))
            it["sourceLine"] = src.strip() if src else None
            it["bodyHtml"] = re.sub(r"^<div[^>]*>|</div>$", "", str(body)).strip()
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(detail, items))
    return items

# ---------------------------------------------------------------- images
def save_image(src, dest, max_w):
    if not src or os.path.exists(dest): return bool(src)
    try:
        r = S.get(src, timeout=60)
        if r.status_code != 200:
            ERRORS.append({"url": src, "status": r.status_code}); return False
        im = Image.open(io.BytesIO(r.content)).convert("RGB")
        if im.width > max_w:
            im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        im.save(dest, "WEBP", quality=82, method=6)
        return {"w": im.width, "h": im.height}
    except Exception as e:
        ERRORS.append({"url": src, "error": str(e)}); return False

# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--works", choices=["none", "scope", "all"], default="scope",
                    help="none: csak index+szerzők; scope: kezdőlap+lista könyvei + ezek szerzőinek összes műve; all: minden szerző minden műve")
    ap.add_argument("--list-size", type=int, default=50)
    ap.add_argument("--press", type=int, default=50)
    ap.add_argument("--cat-pages", type=int, default=3)
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)

    print("home…"); home = scrape_home()
    print("categories + list…"); cats, list_html = scrape_categories(a.cat_pages)
    list_ids = parse_list(list_html)[: a.list_size]
    print("author index…"); index = scrape_author_index()
    by_name = {norm_name(x["name"]): x["id"] for x in index}

    print("authors…")
    with ThreadPoolExecutor(4) as ex:
        authors = [x for x in ex.map(scrape_author, [x["id"] for x in index]) if x]
    amap = {x["id"]: x for x in authors}
    for x in index:
        if x["id"] in amap: amap[x["id"]]["indexShort"] = x["short"]

    # könyv-készlet
    home_ids = set()
    for x in home["carousel"] + home["toplist"] + [c for s in home["sections"].values() for c in s]:
        if x.get("bookId"): home_ids.add(x["bookId"])
    core = list(dict.fromkeys(list(home_ids) + list_ids))
    book_ids = list(core)
    if a.works != "none":
        print(f"core books: {len(core)} – fetching to find authors…")
        with ThreadPoolExecutor(4) as ex:
            core_books = {b["id"]: b for b in ex.map(scrape_book, core) if b}
        core_author_ids = set()
        for b in core_books.values():
            for au in b["authors"]:
                au["id"] = au["id"] or by_name.get(norm_name(au["name"]))
                if au["id"]: core_author_ids.add(au["id"])
        scope_authors = amap.keys() if a.works == "all" else core_author_ids
        extra = [w["bookId"] for aid in scope_authors if aid in amap for w in amap[aid]["works"] if w["bookId"]]
        extra = [i for i in dict.fromkeys(extra) if i not in core_books]
        print(f"extra works: {len(extra)}")
        with ThreadPoolExecutor(4) as ex:
            more = {b["id"]: b for b in ex.map(scrape_book, extra) if b}
        books = {**core_books, **more}
        for b in books.values():
            for au in b["authors"]:
                au["id"] = au["id"] or by_name.get(norm_name(au["name"]))
    else:
        books = {}

    # kategória-címkék
    for b in books.values():
        b["categories"] = [c["id"] for c in cats if b["id"] in c["bookIds"]]
    for c in cats:
        c["bookIds"] = [i for i in c["bookIds"] if i in books]

    print("press…"); press = scrape_press(a.press)
    print("static pages…")
    os.makedirs(os.path.join(OUT, "pages"), exist_ok=True)
    for name, path in [("kapcsolat", "index.php?action=kapcsolat"), ("kiadorol", "index.php?action=kiadorol")]:
        h = get(path)
        open(os.path.join(OUT, "pages", f"{name}.html"), "w").write(content_part(h or ""))

    print("site logo (wordmark forrás)…")
    os.makedirs(os.path.join(ROOT, "brand", "source"), exist_ok=True)
    for name in ["images/logo.jpg"]:
        r = S.get(urljoin(BASE, name), timeout=30)
        if r.status_code == 200:
            open(os.path.join(ROOT, "brand", "source", os.path.basename(name)), "wb").write(r.content)
    print("images…")
    def cov(b):
        r = save_image(b["coverSrc"], os.path.join(MEDIA, "covers", f"{b['id']}.webp"), 900)
        if isinstance(r, dict): b["cover"] = {"src": f"/media/covers/{b['id']}.webp", **r}
        elif r: b["cover"] = {"src": f"/media/covers/{b['id']}.webp"}
        else: b["cover"] = None
    def aph(au):
        r = save_image(au["photoSrc"], os.path.join(MEDIA, "authors", f"{au['id']}.webp"), 800)
        if isinstance(r, dict): au["photo"] = {"src": f"/media/authors/{au['id']}.webp", **r}
        elif r: au["photo"] = {"src": f"/media/authors/{au['id']}.webp"}
        else: au["photo"] = None
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(cov, books.values())); list(ex.map(aph, authors))
    # home kártyák borítói (ha a könyv nincs a készletben)
    for x in home["carousel"] + home["toplist"] + [c for s in home["sections"].values() for c in s]:
        if x.get("bookId") and x["bookId"] not in books:
            save_image(urljoin(BASE, f"media/kiadok/photo/{x['bookId']}.jpg"), os.path.join(MEDIA, "covers", f"{x['bookId']}.webp"), 900)

    def dump(name, obj):
        json.dump(obj, open(os.path.join(OUT, name), "w"), ensure_ascii=False, indent=1)
    dump("home.json", home)
    dump("books.json", list(books.values()))
    dump("authors.json", authors)
    dump("authorIndex.json", index)
    dump("categories.json", cats)
    dump("press.json", press)
    dump("listOrder.json", list_ids)
    report = {"books": len(books), "coreBooks": len(core), "authors": len(authors), "authorIndex": len(index),
              "press": len(press), "categories": len(cats),
              "booksWithoutDescription": [b["id"] for b in books.values() if not b["description"]],
              "booksWithUnresolvedAuthor": [b["id"] for b in books.values() if any(not au["id"] for au in b["authors"])],
              "authorsWithPhoto": sum(1 for x in authors if x.get("photo")),
              "authorsWithBio": sum(1 for x in authors if x.get("bioHtml")),
              "worksTotalAllAuthors": len({w["bookId"] for x in authors for w in x["works"]}),
              "errors": ERRORS[:200], "errorCount": len(ERRORS),
              "scrapedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    dump("_report.json", report)
    with tarfile.open(os.path.join(ROOT, "scraper", "raw.tar.gz"), "w:gz") as tf:
        for p, h in RAW.items():
            data = h.encode("utf-8"); ti = tarfile.TarInfo(re.sub(r"[^\w.=&-]", "_", p) + ".html"); ti.size = len(data)
            tf.addfile(ti, io.BytesIO(data))
    print(json.dumps({k: v for k, v in report.items() if k != "errors"}, ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()
