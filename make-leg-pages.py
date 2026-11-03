#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""One page per empty leg, generated from FWA_EL in empty-legs.html.

    cd ~/Documents/GitHub/flywithandreea.com

    python3 make-leg-pages.py --from 2026-11-07
    python3 make-leg-pages.py --from 2026-11-07 --write

    python3 make-leg-pages.py --sample      # write ONE page, to look at
    python3 make-leg-pages.py               # preview everything
    python3 make-leg-pages.py --write       # write everything

--from takes only the legs departing on or after that date. On a flexible
leg, the later of its two dates is the one that counts, so a leg running
"6 or 7 November" is kept by --from 2026-11-07.

THE URL

    /empty-legs/san-jose-to-paris-7-november-2026-034

Route, then the day in digits, the month spelled out, the year in digits,
and the listing reference in digits.

If a leg already has a page under an older naming, that page is deleted
and a 301 to the new URL is written into _redirects, so there are never
two pages describing the same flight and nothing 404s.

THE SOURCE

empty-legs.html carries a 127 KB object called FWA_EL with three parts:

    airports   138 entries, ICAO -> [city, country, lat, lon, name, IATA]
    aircraft    85 entries, keyed AC-020, with the full specification
    legs       168 entries, each naming its aircraft and its airports

Every figure on a generated page comes out of that object. Nothing is
looked up elsewhere and nothing is invented.

    leg       id, ac, f, t, fc, fy, ff, tc, ty, tf, date, sk, flex,
              nm, km, hh, mm, mins, price, region
    aircraft  mfr, t, cat, yr, ref, pax, bags, ch, cl, cw, kt, rng,
              wifi, lav, fa, pets, smoke, amb, amen, pics

THE RULE ABOUT BLANKS

Your own code says it, next to the Range line:

    said only where the operator has said it. A blank is not a No.

So a field is printed only when it holds a positive value. wifi 0 means
the operator has not stated wifi, not that there is none, and no page
will ever say there is none. pets "No" is printed, because that is the
operator saying it. pets "" is not printed at all.

AIR AMBULANCE IS DELIBERATELY LEFT OUT

One aircraft in the file carries amb 1. Your empty legs page handles that
carefully and separately, and rightly: the file says the cabin takes a
stretcher, not that a medical team comes with it. That is not a line to
put on an automatically generated page beside the cabin width, so these
pages do not mention it. /air-ambulance is the page for that.

DEPARTED LEGS

Never deleted. Once the date has passed the page stays at the same URL,
the headline gains "departed", a notice replaces the reserve buttons, the
schema availability changes to SoldOut, and it points at the legs running
now plus a quote request.

PAGE WEIGHT

empty-legs.html is 601 KB. Copying that shell 168 times would be 60 MB of
near identical bytes. These pages share one stylesheet, /empty-leg.css,
written once, so each page is about 11 KB.
"""
import html
import json
import os
import re
import sys
from datetime import date, datetime

SRC = 'empty-legs.html'
GUIDE = 'airport-guide.html'
OUTDIR = 'empty-legs'
CSSFILE = 'empty-leg.css'
PHOTOS = '/aircraft-photos/'
BASE = 'https://www.flywithandreea.com'
WA = '971503372980'


# ---------------------------------------------------------------- helpers
def esc(s):
    return html.escape(str(s) if s is not None else '', quote=True)


def slugify(text):
    text = (text or '').lower()
    for a, b in (('ä', 'a'), ('ö', 'o'), ('ü', 'u'), ('ß', 'ss'), ('é', 'e'),
                 ('è', 'e'), ('ê', 'e'), ('á', 'a'), ('à', 'a'), ('í', 'i'),
                 ('ó', 'o'), ('ú', 'u'), ('ñ', 'n'), ('ç', 'c'), ('å', 'a'),
                 ('ø', 'o'), ('ã', 'a'), ('â', 'a'), ('î', 'i'), ('ş', 's'),
                 ('ğ', 'g'), ('ı', 'i'), ('ř', 'r'), ('ž', 'z'), ('š', 's')):
        text = text.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', text).strip('-')


def stop(*lines):
    print()
    print('STOPPED. Nothing was written.')
    for line in lines:
        print('  ' + line)
    sys.exit(1)


MONTHS = ('january', 'february', 'march', 'april', 'may', 'june', 'july',
          'august', 'september', 'october', 'november', 'december')


def date_slug(sk):
    """20261107 -> 7-november-2026

    Day in digits with no leading zero, month spelled out in full, year in
    digits. The full month name is also the word somebody actually types,
    as in "abu dhabi doha charter flight november".
    """
    if not sk:
        return ''
    y, m, d = sk // 10000, (sk // 100) % 100, sk % 100
    if not 1 <= m <= 12:
        return str(sk)
    return '%d-%s-%d' % (d, MONTHS[m - 1], y)


def ref_digits(lid):
    """L034 -> 034.  The reference, digits only."""
    digits = re.sub(r'\D', '', lid or '')
    return digits or (lid or '').lower()


def read_fwa_el(src):
    """Pull the FWA_EL object out of the page by matching braces."""
    i = src.find('FWA_EL')
    if i < 0:
        return None
    start = src.find('{', i)
    depth, in_str, escaped = 0, False, False
    for k in range(start, len(src)):
        c = src[k]
        if in_str:
            if escaped:
                escaped = False
            elif c == '\\':
                escaped = True
            elif c == '"':
                in_str = False
            continue
        if c == '"':
            in_str = True
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(src[start:k + 1])
                except Exception:
                    return None
    return None


def airport_map(guide_html):
    """IATA -> /airports/... slug. Your slugs end in the IATA code."""
    out = {}
    for href in set(re.findall(r'href="(/airports/[^"]+)"', guide_html or '')):
        code = href.rstrip('/').rsplit('-', 1)[-1].upper()
        if len(code) == 3 and code.isalpha():
            out[code] = href
    return out


def extract(src, start_pat, end_pat):
    i = src.find(start_pat)
    if i < 0:
        return None
    j = src.find(end_pat, i)
    return src[i:j + len(end_pat)] if j > 0 else None


def money(value):
    if value in (None, '', 0):
        return None
    try:
        return '€' + format(int(value), ',d')
    except Exception:
        return str(value)


def duration_words(hh, mm):
    hh, mm = hh or 0, mm or 0
    if hh and mm:
        return '%d h %02d min' % (hh, mm)
    if hh:
        return '%d h' % hh
    return '%d min' % mm


def iso_duration(hh, mm):
    return 'PT%dH%dM' % (hh or 0, mm or 0)


# ---------------------------------------------------------------- the css
CSS = '''/* Fly with Andreea, the empty leg pages.
   One stylesheet for all of them, so each page stays around 11 KB.
   Tokens are the site's own. */
:root{--gold:#CBAD91;--gold-deep:#B8966B;--gold-light:#E0C4A0;
  --ink:#1D1D1F;--ink-soft:#2A2A2E;--paper:#FAFAFB;--paper-warm:#F7F5F2;
  --card:#fff;--line:rgba(29,29,31,.12);--grey:#8a8a90;--grey-light:#D2D2D7;
  --grey-dark:#6E6E73;
  --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
  --serif:'Cinzel',Georgia,serif}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);
  -webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:1160px;margin:0 auto;padding:0 48px}
@media(max-width:860px){.wrap{padding:0 20px}}

.topbar{position:fixed;top:0;left:0;right:0;z-index:110;height:40px;
  background:var(--ink);display:flex;align-items:center;
  justify-content:space-between;gap:16px;padding:0 24px;color:#fff;font-size:12px}
.topbar a{color:rgba(255,255,255,.82);text-decoration:none}
.topbar a:hover{color:#fff}
nav#navbar{position:fixed;top:40px;left:0;right:0;z-index:100;display:flex;
  align-items:center;justify-content:space-between;padding:18px 48px;
  background:rgba(250,250,251,.94);backdrop-filter:saturate(1.6) blur(12px);
  border-bottom:1px solid var(--line)}
.nav-logo-img{height:30px;display:block}
.nav-links{list-style:none;display:flex;gap:26px;margin:0;padding:0}
.nav-links a{font-size:13px;color:var(--ink-soft);text-decoration:none}
.nav-links a:hover{color:var(--gold-deep)}
.nav-cta{background:var(--gold);color:#fff;padding:10px 22px;border-radius:999px;
  font-size:13px;font-weight:600;text-decoration:none}
.nav-cta:hover{background:var(--gold-light)}
@media(max-width:1000px){.nav-links{display:none}nav#navbar{padding:14px 20px}}

main{padding:150px 0 0}
.crumbs{font-size:12px;color:var(--grey);margin:0 0 22px}
.crumbs a{color:var(--grey);text-decoration:none}
.crumbs a:hover{color:var(--gold-deep)}
h1{font-family:var(--serif);font-weight:400;font-size:clamp(28px,3.4vw,46px);
  line-height:1.14;letter-spacing:.01em;margin:0 0 16px}
.lede{font-size:18px;line-height:1.6;color:var(--grey-dark);margin:0 0 30px;
  max-width:72ch}
.lede strong{color:var(--ink);font-weight:600}

.gone{background:var(--paper-warm);border:1px solid var(--gold-light);
  border-radius:14px;padding:18px 22px;margin:0 0 30px}
.gone p{margin:0;font-size:15px;line-height:1.65;color:var(--ink-soft)}
.gone strong{color:var(--ink)}

.facts{width:100%;border-collapse:collapse;margin:0 0 28px;
  border:1px solid var(--grey-light);border-radius:12px;overflow:hidden}
.facts th,.facts td{text-align:left;padding:14px 18px;font-size:15px;
  border-bottom:1px solid var(--grey-light)}
.facts tr:last-child th,.facts tr:last-child td{border-bottom:0}
.facts th{width:190px;font-weight:600;color:var(--grey-dark);
  background:var(--paper-warm);font-size:13px;letter-spacing:.04em;
  text-transform:uppercase}
.facts a{color:var(--gold-deep);text-decoration:none;
  border-bottom:1px solid var(--line)}

.cta{display:flex;flex-wrap:wrap;gap:12px;margin:0 0 44px}
.btn{display:inline-flex;align-items:center;padding:13px 26px;border-radius:999px;
  font-size:14px;font-weight:600;text-decoration:none;border:1px solid transparent}
.btn.gold{background:var(--gold);color:#fff}
.btn.gold:hover{background:var(--gold-light)}
.btn.ghost{border-color:var(--grey-light);color:var(--ink)}
.btn.ghost:hover{border-color:var(--gold)}

h2{font-family:var(--serif);font-weight:400;font-size:clamp(20px,2.2vw,28px);
  letter-spacing:.01em;margin:44px 0 14px}
main p{font-size:16px;line-height:1.75;color:var(--grey-dark);margin:0 0 1.1em;
  max-width:74ch}
main p a{color:var(--gold-deep);text-decoration:none;
  border-bottom:1px solid var(--line)}
main p a:hover{border-bottom-color:var(--gold)}

/* the aircraft specification block */
.eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--gold-deep);font-weight:600;margin:0 0 18px}
.specs{display:grid;grid-template-columns:repeat(auto-fit,minmax(142px,1fr));
  gap:24px 30px;margin:0 0 26px;padding:26px 0;
  border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.specs > div{min-width:0}
.specs dt{font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--grey);margin:0 0 7px}
.specs dd{margin:0;font-size:16.5px;color:var(--ink);line-height:1.3}
.d-h{font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--grey);margin:26px 0 10px;font-weight:600}
.inc,.amen{list-style:none;margin:0 0 6px;padding:0;display:flex;
  flex-wrap:wrap;gap:9px}
.inc li,.amen li{font-size:13.5px;color:var(--ink-soft);
  background:var(--paper-warm);border:1px solid var(--line);
  border-radius:999px;padding:7px 15px}

.faq h3{font-family:var(--serif);font-weight:400;font-size:18px;margin:26px 0 6px}

.also{list-style:none;margin:18px 0 0;padding:0;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.also a{display:block;border:1px solid var(--grey-light);border-radius:12px;
  padding:16px 18px;text-decoration:none;font-size:14.5px;color:var(--ink);
  transition:border-color .2s}
.also a:hover{border-color:var(--gold)}
.also .d{display:block;font-size:12.5px;color:var(--grey);margin-top:4px}

.ref{font-size:13px;color:var(--grey);font-style:italic;margin:44px 0 0;
  padding-top:22px;border-top:1px solid var(--line)}
.pn{display:flex;justify-content:space-between;gap:20px;margin:26px 0 70px;
  font-size:13.5px}
.pn a{color:var(--gold-deep);text-decoration:none}

footer{background:#F5F5F7;border-top:1px solid var(--grey-light);
  padding:48px 0 28px;margin-top:40px}
.footer-inner,.footer-bottom,.footer-disclaimer{max-width:1100px;margin:0 auto;
  padding:0 24px}
.footer-inner{display:flex;flex-wrap:wrap;gap:40px;justify-content:space-between}
.footer-logo-img{height:34px}
.footer-tagline{font-size:12px;color:#86868b;margin:10px 0 0}
.footer-links{display:flex;flex-wrap:wrap;gap:48px}
.footer-col h4{font-size:11px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--gold);margin:0 0 12px;font-weight:600}
.footer-col a{display:block;font-size:13.5px;color:var(--grey-dark);
  text-decoration:none;margin:0 0 8px}
.footer-col a:hover{color:var(--ink)}
.footer-disclaimer{font-size:11px;line-height:1.6;color:var(--grey);
  margin:30px auto 16px}
.footer-bottom{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;
  border-top:1px solid var(--grey-light);padding-top:16px}
.footer-copy,.footer-legal a{font-size:11.5px;color:var(--grey)}
.footer-legal{display:flex;gap:16px}
.footer-legal a{text-decoration:none}
'''

TOPBAR = ('<div class="topbar">\n'
          '  <a href="/empty-legs">Empty legs, updated daily</a>\n'
          '  <a href="https://wa.me/%s" target="_blank" rel="noopener">'
          'WhatsApp Andreea</a>\n'
          '</div>' % WA)


# ------------------------------------------------------- aircraft section
def spec_block(a):
    """The specification grid. A field appears only when the file has it."""
    rows = []

    def add(label, value):
        if value not in (None, '', 0):
            rows.append('<div><dt>%s</dt><dd>%s</dd></div>'
                        % (esc(label), esc(value)))

    full = ' '.join(x for x in [a.get('mfr'), a.get('t')] if x)
    add('Type', full or a.get('t'))
    add('Category', a.get('cat'))
    add('Year of make', a.get('yr'))
    add('Refurbished', a.get('ref'))
    if a.get('pax'):
        add('Passengers', 'Up to %s' % a['pax'])
    if a.get('bags'):
        add('Luggage', '%s suitcase%s' % (a['bags'],
                                          '' if a['bags'] == 1 else 's'))
    add('Cabin height', a.get('ch'))
    add('Cabin width', a.get('cw'))
    add('Cabin length', a.get('cl'))
    if a.get('kt'):
        add('Typical cruise', '%s kt' % a['kt'])
    if a.get('rng'):
        add('Range', '{:,} nm'.format(a['rng']))
    if a.get('smoke'):
        add('Smoking', 'Permitted' if a['smoke'] == 'Yes' else 'Not permitted')
    if not rows:
        return ''
    return '<dl class="specs">%s</dl>' % ''.join(rows)


def included_list(a):
    """Only what the operator has positively stated. A blank is not a No."""
    out = []
    if a.get('wifi'):
        out.append('Wi-Fi on board')
    if a.get('lav'):
        out.append('Enclosed lavatory')
    if a.get('fa') == 'Yes':
        out.append('Cabin attendant')
    elif a.get('fa') == 'On request':
        out.append('Cabin attendant on request')
    if a.get('pets') == 'Yes':
        out.append('Pets in the cabin')
    elif a.get('pets') == 'On request':
        out.append('Pets on request')
    elif a.get('pets') == 'No':
        out.append('No pets on this aircraft')
    if not out:
        return ''
    return ('<p class="d-h">Confirmed by the operator</p><ul class="inc">%s</ul>'
            % ''.join('<li>%s</li>' % esc(x) for x in out))


def amenity_list(a):
    items = a.get('amen') or []
    if not items:
        return ''
    return ('<p class="d-h">In this cabin</p><ul class="amen">%s</ul>'
            % ''.join('<li>%s</li>' % esc(x) for x in items))


def aircraft_prose(a, dur, nm):
    """Plain sentences, built only from fields that are present."""
    name = ' '.join(x for x in [a.get('mfr'), a.get('t')] if x) or 'the aircraft'
    bits = []
    first = 'This leg is flown by %s' % name
    if a.get('cat'):
        first += ', %s aircraft' % a['cat'].lower()
    if a.get('yr'):
        first += ', built in %s' % a['yr']
    if a.get('ref'):
        first += ' and refurbished in %s' % a['ref']
    bits.append(first + '.')
    if a.get('pax'):
        s = 'It is configured for up to %s passengers' % a['pax']
        if a.get('bags'):
            s += ' with room for %s suitcase%s' % (
                a['bags'], '' if a['bags'] == 1 else 's')
        bits.append(s + '.')
    if a.get('rng') and nm:
        bits.append('Its range of {:,} nm is well beyond the {:,} nm of this '
                    'sector, so the flight is flown direct.'.format(
                        a['rng'], nm))
    elif a.get('rng'):
        bits.append('Its range is {:,} nm.'.format(a['rng']))
    if dur:
        bits.append('Expect about %s in the air.' % dur)
    return ' '.join(bits)


# ---------------------------------------------------------------- page
def build(leg, D, nav, footer, apmap, others, today):
    a = (D.get('aircraft') or {}).get(leg.get('ac')) or {}
    airports = D.get('airports') or {}

    def ap(icao, city, country, name):
        row = airports.get(icao) or []
        iata = row[5] if len(row) > 5 else ''
        return {'icao': icao, 'iata': iata,
                'city': city or (row[0] if row else ''),
                'country': country or (row[1] if len(row) > 1 else ''),
                'name': name or (row[4] if len(row) > 4 else '')}

    dep = ap(leg.get('f'), leg.get('fc'), leg.get('fy'), leg.get('ff'))
    arr = ap(leg.get('t'), leg.get('tc'), leg.get('ty'), leg.get('tf'))

    lid = leg.get('id') or ''
    sk = leg.get('sk') or 0
    sk2 = leg.get('sk2') or 0
    iso = '%04d-%02d-%02d' % (sk // 10000, (sk // 100) % 100, sk % 100) if sk else ''

    # Some legs are flexible: flex 1, with a second date the operator will
    # also fly. The headline date stays the first one, so the URL and the
    # title never move, but the page says both and the departed test uses
    # the later of the two.
    flexible = bool(leg.get('flex')) and bool(leg.get('date2'))
    nice = leg.get('date') or ''
    date_cell = esc(nice)
    if flexible:
        date_cell = '%s or %s' % (esc(nice), esc(leg['date2']))
    last_day = max(sk, sk2) if sk2 else sk
    departed = bool(last_day and last_day < int(today.strftime('%Y%m%d')))
    dur = duration_words(leg.get('hh'), leg.get('mm'))
    nm, km = leg.get('nm'), leg.get('km')
    price = money(leg.get('price'))
    craft = ' '.join(x for x in [a.get('mfr'), a.get('t')] if x) or 'the aircraft'
    craft_short = a.get('t') or craft

    route = '%s to %s' % (dep['city'], arr['city'])
    slug = '%s-to-%s-%s-%s' % (slugify(dep['city']), slugify(arr['city']),
                               date_slug(sk), ref_digits(lid))
    url = '%s/%s/%s' % (BASE, OUTDIR, slug)

    # TITLE. No brand suffix. Google appends the site name itself from
    # og:site_name and the Organization schema, and "| Fly with Andreea" is
    # 19 characters that pushed every one of these past the roughly 60 that
    # a result actually shows, so the brand was being truncated off anyway.
    # The route and the date always survive; the aircraft is what gives way
    # on a long city pair.
    base = 'Empty leg %s, %s' % (route, nice)
    if departed:
        title = base + ' (departed)'
    else:
        with_craft = '%s, %s' % (base, craft_short)
        title = with_craft if len(with_craft) <= 60 else base

    # DESCRIPTION. Where there is a price it goes in, because the figure is
    # the thing that earns the click. Kept under 155 characters, trimming
    # the brand clause first and the aircraft second rather than letting
    # Google cut it mid-sentence.
    if departed:
        desc = ('This %s empty leg on %s has departed. See the empty legs '
                'available now, or ask Fly with Andreea to quote the route '
                'on your own dates.' % (route, nice))
    # The fallbacks shorten by dropping detail, never the brand: the
    # aircraft goes first, then the repositioning explanation. "Fly with
    # Andreea" stays in every version, because the description is one of
    # the few places the name is read in full in a search result.
    elif price:
        options = [
            'Empty leg private jet %s, %s, %s, from %s. Whole aircraft, one '
            'way, arranged by Fly with Andreea.'
            % (route, nice, craft_short, price),
            'Empty leg private jet %s, %s, from %s. Whole aircraft, one way, '
            'arranged by Fly with Andreea.' % (route, nice, price),
            'Empty leg %s, %s, from %s. Arranged by Fly with Andreea.'
            % (route, nice, price)]
    else:
        options = [
            'Empty leg private jet %s on %s by %s. One-way repositioning '
            'flight, the whole aircraft, arranged by Fly with Andreea.'
            % (route, nice, craft_short),
            'Empty leg private jet %s on %s by %s. Whole aircraft, one way, '
            'arranged by Fly with Andreea.' % (route, nice, craft_short),
            'Empty leg private jet %s on %s. Whole aircraft, one way, '
            'arranged by Fly with Andreea.' % (route, nice)]
    if not departed:
        desc = next((o for o in options if len(o) <= 155), options[-1])

    def cell(x):
        label = '%s (%s)' % (x['name'] or x['city'], x['icao'] or x['iata'])
        href = apmap.get((x['iata'] or '').upper())
        inner = '<a href="%s">%s</a>' % (href, esc(label)) if href else esc(label)
        return '%s, %s' % (inner, esc(x['country'])) if x['country'] else inner

    wa_msg = ('Hello Fly with Andreea, I would like the empty leg %s on %s '
              '(%s, listing %s).' % (route, nice, craft_short, lid))
    wa = 'https://wa.me/%s?text=%s' % (
        WA, re.sub(r'[^A-Za-z0-9]', lambda m: '%%%02X' % ord(m.group()), wa_msg))

    # No photographs on the page itself, by request. The filenames are still
    # used for og:image and for the schema, which are metadata: one feeds the
    # preview card when somebody shares the link, the other describes the
    # aircraft to a crawler. Neither puts a picture on the page.
    #
    # Only 14 of the 85 aircraft have usable photographs anyway. The other 71
    # carry a "want" list of filenames that were planned and never added, and
    # every one of those returns 404, which is why "want" is never used.
    pics = a.get('pics') or []

    if departed:
        notice = ('<div class="gone"><p><strong>This flight has departed.</strong> '
                  'The page is kept for reference. Empty legs on this route come '
                  'up regularly, so <a href="/empty-legs">see what is available '
                  'now</a>, or ask Fly with Andreea to quote %s on your own '
                  'dates.</p></div>' % esc(route))
        ctas = ('<div class="cta">'
                '<a class="btn gold" href="/empty-legs">See current empty legs</a>'
                '<a class="btn ghost" href="/#quote">Quote %s on my dates</a>'
                '</div>' % esc(route))
    else:
        notice = ''
        ctas = ('<div class="cta">'
                '<a class="btn gold" href="%s" target="_blank" rel="noopener">'
                'Reserve on WhatsApp</a>'
                '<a class="btn ghost" href="/#quote">Request this flight</a>'
                '<a class="btn ghost" href="/empty-legs">All empty legs</a>'
                '</div>' % wa)

    rows = [('Date', date_cell), ('From', cell(dep)), ('To', cell(arr))]
    if nm:
        rows.append(('Distance', '{:,} nm, {:,} km'.format(nm, km or 0)))
    if dur:
        rows.append(('Flight time', 'About ' + esc(dur)))
    rows.append(('Aircraft', esc(craft)))
    if a.get('pax'):
        rows.append(('Passengers', 'Up to %s' % esc(a['pax'])))
    rows.append(('Price', esc(price) if price else 'Price on request'))
    rows.append(('Booking', 'The whole aircraft, one way'))
    facts = ''.join('<tr><th>%s</th><td>%s</td></tr>' % r for r in rows)

    also = ''
    if others:
        cards = ''.join(
            '<li><a href="/%s/%s">%s<span class="d">%s &middot; %s</span></a></li>'
            % (OUTDIR, o['slug'], esc(o['route']), esc(o['date']),
               esc(o['craft'])) for o in others[:6])
        also = '<h2>Other empty legs</h2><ul class="also">%s</ul>' % cards

    body = '''<main><div class="wrap">
<p class="crumbs"><a href="/">Home</a> &rsaquo; <a href="/empty-legs">Empty legs</a> &rsaquo; %(route)s</p>
<h1>Empty leg: %(route)s, %(nice)s%(depmark)s</h1>
<p class="lede"><strong>One-way empty leg private jet from %(dcity)s to %(acity)s on %(nice)s, flown by a %(craft_short)s.</strong> An empty leg is a repositioning flight the operator has already scheduled, offered as a whole-aircraft charter at a reduced rate. The date and the route are fixed by the aircraft, not by you.%(flexnote)s</p>
%(notice)s
<table class="facts">%(facts)s</table>
%(ctas)s

<p class="eyebrow">The aircraft</p>
%(specs)s
%(included)s
%(amen)s
<p>%(craft_prose)s</p>
<p>Fly with Andreea arranges this flight with the AOC-certified operator and does not own or operate aircraft. If this cabin is more or less than you need, the <a href="/fleet">fleet</a> runs from light jets to VIP airliners and a <a href="/#quote">charter quote</a> can be built around your own dates.</p>

<h2>About the %(route)s route</h2>
<p>This leg flies from %(dname)s (%(dicao)s) in %(dcountry)s to %(aname)s (%(aicao)s) in %(acountry)s%(dist)s. Departure is set by the operator's schedule for %(nice)s and can move by a few hours, so confirm before planning around it.</p>
<p>Because the aircraft is repositioning anyway, the whole cabin goes for a fraction of the same routing chartered from scratch. You are not buying a seat. You are buying the aircraft.</p>

<h2>How empty leg flights work</h2>
<p>When a private jet flies one way for a client it often has to return or reposition with nobody on board. Those legs are offered at a reduced rate. The trade is flexibility: the date, the route and the aircraft are already decided, and a leg can be withdrawn if the original trip changes.</p>
<p>Fly with Andreea lists every available leg on the <a href="/empty-legs">empty legs</a> page, updated daily. If the timing does not suit, the same route can be quoted as a normal charter on your dates.</p>

<div class="faq">
<h2>Frequently asked questions</h2>
<h3>Can I change the date or the route?</h3>
<p>No. The operator has already set this flight, which is what makes the price what it is. For a date you choose, ask Fly with Andreea for a <a href="/#quote">charter quote</a> on the same routing.</p>
<h3>Is a return from %(acity)s to %(dcity)s available?</h3>
<p>This listing is the one-way leg from %(dcity)s to %(acity)s. A matching return depends on the aircraft's onward schedule, so ask and Fly with Andreea will check whether a return leg or a quote can be arranged.</p>
<h3>What is included in the price?</h3>
<p>One written all-in figure before you commit, covering the aircraft, crew, handling and standard catering. Anything beyond that is set out in the same message, so nothing is added later.</p>
<h3>How much luggage fits?</h3>
<p>%(bagsentence)s If you are travelling with skis, golf clubs or anything awkward, say so in your request and it is checked against this aircraft before it is confirmed.</p>
</div>

%(also)s
<p class="ref">Listing %(lid)s. Availability and price are confirmed at reservation. Fly with Andreea is an air charter broker and arranges flights with third-party AOC-certified operators.</p>
<div class="pn"><a href="/empty-legs">&larr; All empty legs</a><a href="/frequent-routes">Frequent routes &rarr;</a></div>
</div></main>''' % dict(
        route=esc(route), nice=esc(nice),
        depmark=' (departed)' if departed else '',
        flexnote=(' This one is flexible: the operator will fly it on %s or %s.'
                  % (esc(nice), esc(leg.get('date2')))) if flexible else '',
        dcity=esc(dep['city']), acity=esc(arr['city']),
        craft_short=esc(craft_short),
        notice=notice, facts=facts, ctas=ctas,
        specs=spec_block(a), included=included_list(a), amen=amenity_list(a),
        craft_prose=esc(aircraft_prose(a, dur, nm)).replace('&amp;', '&'),
        dname=esc(dep['name'] or dep['city']), aname=esc(arr['name'] or arr['city']),
        dicao=esc(dep['icao'] or dep['iata']), aicao=esc(arr['icao'] or arr['iata']),
        dcountry=esc(dep['country']), acountry=esc(arr['country']),
        dist=(', %s nm' % '{:,}'.format(nm)) if nm else '',
        bagsentence=('The hold on this aircraft takes %s suitcase%s.'
                     % (a['bags'], '' if a['bags'] == 1 else 's'))
        if a.get('bags') else
        'Luggage depends on the hold and the configuration on the day, and the '
        'allowance for this aircraft is confirmed with the quote.',
        also=also, lid=esc(lid))

    # ---- schema, every value from the file
    flight = {
        '@type': 'Flight', '@id': url + '#flight', 'url': url,
        'name': 'Empty leg %s, %s, %s' % (route, nice, craft_short),
        'flightDistance': ('%s km' % km) if km else None,
        'estimatedFlightDuration': iso_duration(leg.get('hh'), leg.get('mm')),
        'departureTime': iso,
        'aircraft': craft,
        'seller': {'@id': BASE + '/#org'},
        'provider': {'@id': BASE + '/#org'},
        'departureAirport': {
            '@type': 'Airport', 'name': dep['name'], 'iataCode': dep['iata'],
            'icaoCode': dep['icao'],
            'address': {'@type': 'PostalAddress',
                        'addressLocality': dep['city'],
                        'addressCountry': dep['country']}},
        'arrivalAirport': {
            '@type': 'Airport', 'name': arr['name'], 'iataCode': arr['iata'],
            'icaoCode': arr['icao'],
            'address': {'@type': 'PostalAddress',
                        'addressLocality': arr['city'],
                        'addressCountry': arr['country']}},
        'offers': {
            '@type': 'Offer', 'url': url,
            'availability': ('https://schema.org/SoldOut' if departed
                             else 'https://schema.org/LimitedAvailability'),
            'validThrough': (iso + 'T23:59:59Z') if iso else None,
            'seller': {'@id': BASE + '/#org'}},
    }
    if leg.get('price'):
        flight['offers']['price'] = leg['price']
        flight['offers']['priceCurrency'] = 'EUR'
    if pics:
        flight['image'] = [BASE + PHOTOS + p for p in pics]

    def prune(o):
        if isinstance(o, dict):
            return {k: prune(v) for k, v in o.items() if v not in (None, '', [])}
        if isinstance(o, list):
            return [prune(x) for x in o]
        return o

    graph = [prune(flight),
             {'@type': 'WebPage', '@id': url + '#webpage', 'url': url,
              'name': title.split(' | ')[0], 'description': desc,
              'inLanguage': 'en', 'isPartOf': {'@id': BASE + '/#site'},
              'about': {'@id': url + '#flight'},
              'publisher': {'@id': BASE + '/#org'}},
             {'@type': 'BreadcrumbList', '@id': url + '#crumbs',
              'itemListElement': [
                  {'@type': 'ListItem', 'position': 1, 'name': 'Home',
                   'item': BASE + '/'},
                  {'@type': 'ListItem', 'position': 2, 'name': 'Empty legs',
                   'item': BASE + '/empty-legs'},
                  {'@type': 'ListItem', 'position': 3, 'name': route,
                   'item': url}]}]
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph},
                    ensure_ascii=False, indent=1)

    head = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>%(title)s</title>
<meta name="description" content="%(desc)s">
<link rel="canonical" href="%(url)s">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Fly with Andreea">
<meta property="og:title" content="%(title)s">
<meta property="og:description" content="%(desc)s">
<meta property="og:url" content="%(url)s">
%(ogimg)s<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&display=swap">
<link rel="stylesheet" href="/%(css)s?v=1">
<script type="application/ld+json">
%(ld)s
</script>
</head>
<body>
%(topbar)s
%(nav)s
''' % dict(title=esc(title), desc=esc(desc), url=esc(url), ld=ld, css=CSSFILE,
           topbar=TOPBAR, nav=nav,
           ogimg=('<meta property="og:image" content="%s%s%s">\n'
                  % (BASE, PHOTOS, esc(pics[0]))) if pics else '')

    meta = {'slug': slug, 'route': route, 'date': nice, 'craft': craft_short,
            'departed': departed, 'url': url, 'iso': iso}
    return slug, head + body + '\n' + footer + '\n</body>\n</html>\n', meta


# ---------------------------------------------------------------- main
def read_from_flag():
    """--from 2026-11-07   only legs departing on or after that date."""
    if '--from' not in sys.argv:
        return None
    i = sys.argv.index('--from')
    if i + 1 >= len(sys.argv):
        stop('--from needs a date, for example  --from 2026-11-07')
    raw = sys.argv[i + 1]
    try:
        d = datetime.strptime(raw, '%Y-%m-%d').date()
    except Exception:
        stop('could not read "%s" as a date.' % raw,
             'Use the form --from 2026-11-07')
    return int(d.strftime('%Y%m%d'))


def main():
    write = '--write' in sys.argv
    sample = '--sample' in sys.argv
    cutoff = read_from_flag()
    today = date.today()

    print()
    print('Working in: %s' % os.getcwd())

    if not os.path.exists(SRC):
        stop('%s is not in this folder.' % SRC,
             'Run this from the repository root.')
    src = open(SRC, encoding='utf-8').read()
    guide = open(GUIDE, encoding='utf-8').read() if os.path.exists(GUIDE) else ''

    D = read_fwa_el(src)
    if not D or 'legs' not in D:
        stop('could not read the FWA_EL object out of %s.' % SRC,
             'The page structure has changed. Tell Claude.')

    nav = extract(src, '<nav id="navbar"', '</nav>')
    footer = extract(src, '<footer>', '</footer>')
    if not nav or not footer:
        stop('could not find the <nav> or <footer> block in %s.' % SRC)

    apmap = airport_map(guide)
    all_legs = D['legs']

    # The departure date, or the later of the two on a flexible leg, decides
    # whether a leg is in this batch.
    def leg_day(l):
        return max(l.get('sk') or 0, l.get('sk2') or 0)

    if cutoff:
        legs = [l for l in all_legs if leg_day(l) >= cutoff]
    else:
        legs = all_legs
    if not legs:
        stop('no legs depart on or after %s.' % cutoff,
             'The file holds %d legs in total.' % len(all_legs))

    print('Mode      : %s' % ('WRITE' if write else
                              ('SAMPLE' if sample else
                               'preview, nothing will be written')))
    if cutoff:
        print('From      : %s onwards' % datetime.strptime(
            str(cutoff), '%Y%m%d').date().strftime('%-d %b %Y'))
    print()
    if cutoff:
        print('  legs in the file : %d' % len(all_legs))
        print('  before the date  : %d, skipped' % (len(all_legs) - len(legs)))
    print('  legs            : %d' % len(legs))
    print('  aircraft         : %d with full specification'
          % len(D.get('aircraft') or {}))
    print('  airports         : %d' % len(D.get('airports') or {}))
    print('  with a price     : %d' % sum(1 for l in legs if l.get('price')))
    print('  airport pages    : %d IATA codes matched' % len(apmap))
    print()

    first = [build(l, D, nav, footer, apmap, [], today) for l in legs]
    live = [m for _, _, m in first if not m['departed']]

    pages = []
    for i, l in enumerate(legs):
        others = [m for m in live if m['slug'] != first[i][2]['slug']]
        pages.append(build(l, D, nav, footer, apmap, others[:6], today))

    gone = sum(1 for _, _, m in pages if m['departed'])
    sizes = [len(d) for _, d, _ in pages]
    print('  pages            : %d' % len(pages))
    print('  already departed : %d' % gone)
    print('  average size     : %.1f KB' % (sum(sizes) / len(sizes) / 1024))
    print()
    for _, _, m in pages[:5]:
        print('    /%s/%s' % (OUTDIR, m['slug']))
    if len(pages) > 5:
        print('    ... and %d more' % (len(pages) - 5))

    if not (write or sample):
        print()
        print('  Preview only. Nothing was written.')
        print('      python3 make-leg-pages.py --sample')
        print('      python3 make-leg-pages.py --write')
        print()
        return

    os.makedirs(OUTDIR, exist_ok=True)
    chosen = [p for p in pages if not p[2]['departed']][:1] if sample else pages
    if not chosen:
        chosen = pages[:1]

    moved = [] if sample else retire_old_slugs(chosen)

    for slug, doc, _ in chosen:
        open(os.path.join(OUTDIR, slug + '.html'), 'w',
             encoding='utf-8').write(doc)
    open(CSSFILE, 'w', encoding='utf-8').write(CSS)

    print()
    print('DONE')
    print('  %d page(s) in %s/' % (len(chosen), OUTDIR))
    print('  %s written' % CSSFILE)
    if moved:
        print('  %d old URL(s) replaced, 301s written into %s'
              % (len(moved), REDIRECTS))
        for old, new in moved[:3]:
            print('      %s  ->  %s' % (old, new))
        if len(moved) > 3:
            print('      ... and %d more' % (len(moved) - 3))
    if sample:
        print()
        print('  Look at: %s/%s.html' % (OUTDIR, chosen[0][0]))
        print()
        return

    # ---- link them from the hub, and list them in a sitemap ----------
    metas = [m for _, _, m in pages]
    link_and_sitemap(src, metas, legs)
    print()


# ------------------------------------------------- hub links + sitemap
SITEMAP = 'sitemap-empty-leg-pages.xml'
INDEX = 'sitemap.xml'
REDIRECTS = '_redirects'


def retire_old_slugs(chosen):
    """Replace a leg's old page rather than leaving two of them.

    The URL format changed. A leg that already has a page under the old
    naming would otherwise keep it and gain a second one, and two pages
    describing the same flight compete with each other for the same search.

    The reference number at the end of the filename identifies the leg, so
    any existing file ending in that same reference, under a different
    name, is the old page for this leg. It is deleted and a permanent
    redirect to the new URL is written into _redirects, which Cloudflare
    serves. Nothing 404s and whatever the old URL had earned carries over.
    """
    moved = []
    existing = [f for f in os.listdir(OUTDIR) if f.endswith('.html')] \
        if os.path.isdir(OUTDIR) else []

    for slug, _, _ in chosen:
        ref = slug.rsplit('-', 1)[-1]
        for name in existing:
            old = name[:-5]
            if old == slug:
                continue
            if old.rsplit('-', 1)[-1].lstrip('l') != ref.lstrip('l'):
                continue
            try:
                os.remove(os.path.join(OUTDIR, name))
            except OSError:
                continue
            moved.append(('/%s/%s' % (OUTDIR, old), '/%s/%s' % (OUTDIR, slug)))

    if moved:
        lines = []
        if os.path.exists(REDIRECTS):
            lines = open(REDIRECTS, encoding='utf-8').read().splitlines()
        have = {l.split()[0] for l in lines if l.strip()
                and not l.strip().startswith('#')}
        added = 0
        for old, new in moved:
            if old in have:
                continue
            lines.append('%s %s 301' % (old, new))
            added += 1
        if added:
            open(REDIRECTS, 'w', encoding='utf-8').write(
                '\n'.join(lines).rstrip() + '\n')
    return moved


def link_and_sitemap(src, metas, legs):
    """Put a link inside each listing line, and write the sitemap.

    The hub already prints every leg as

        <li id="leg-L034">San Jose to Paris, 7 Nov 2026 ...</li>

    so that line is the natural anchor. A page nothing links to is a page
    Google will not find, and this is the only thing pointing at them.
    """
    by_id = {m['slug'].rsplit('-', 1)[-1].upper(): m for m in metas}
    for leg, m in zip(legs, metas):
        by_id[(leg.get('id') or '').upper()] = m

    added, already = 0, 0
    out = src
    for lid, m in by_id.items():
        pat = re.compile(r'(<li id="leg-%s"[^>]*>)([\s\S]*?)(</li>)' % re.escape(lid))
        found = pat.search(out)
        if not found:
            continue
        if '/%s/%s"' % (OUTDIR, m['slug']) in found.group(2):
            already += 1
            continue
        # Drop any link left from a previous run. The URL format has changed
        # once, so a line can be holding a link to a page that no longer
        # exists, and appending a second one would leave both.
        inner = re.sub(r'\s*<a class="leg-more"[\s\S]*?</a>', '',
                       found.group(2))
        link = (' <a class="leg-more" href="/%s/%s">Full details and '
                'reservation &rsaquo;</a>' % (OUTDIR, m['slug']))
        out = out[:found.start()] + found.group(1) + inner.rstrip() \
            + link + found.group(3) + out[found.end():]
        added += 1

    if added:
        shutil_copy(SRC, SRC + '.backup')
        open(SRC, 'w', encoding='utf-8').write(out)

    urls = ''.join(
        '  <url><loc>%s</loc><changefreq>daily</changefreq>'
        '<priority>0.7</priority></url>\n' % m['url'] for m in metas)
    sm = ('<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          '%s</urlset>\n' % urls)
    open(SITEMAP, 'w', encoding='utf-8').write(sm)

    listed = False
    if os.path.exists(INDEX):
        idx = open(INDEX, encoding='utf-8').read()
        if SITEMAP in idx:
            listed = True
        else:
            entry = ('  <sitemap><loc>%s/%s</loc></sitemap>\n'
                     % (BASE, SITEMAP))
            if '</sitemapindex>' in idx:
                shutil_copy(INDEX, INDEX + '.backup')
                open(INDEX, 'w', encoding='utf-8').write(
                    idx.replace('</sitemapindex>', entry + '</sitemapindex>'))
                listed = True

    print()
    print('  hub links added  : %d' % added)
    if already:
        print('  already linked   : %d' % already)
    print('  %s : %d urls' % (SITEMAP, len(metas)))
    print('  %s : %s' % (INDEX, 'listed' if listed else
                         'COULD NOT ADD, add it by hand'))
    print()
    print('  Commit: the %s/ folder, %s, %s, %s and %s'
          % (OUTDIR, CSSFILE, SRC, SITEMAP, INDEX))


def shutil_copy(a, b):
    import shutil
    shutil.copy2(a, b)


if __name__ == '__main__':
    main()
