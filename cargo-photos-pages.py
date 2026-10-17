# -*- coding: utf-8 -*-
"""Put cargo photographs on the older cargo pages.

RUN FROM THE ROOT OF THE REPOSITORY.

    python3 cargo-photos-pages.py            # dry run, writes a preview of each
    python3 cargo-photos-pages.py --apply    # writes the pages themselves

WHAT IT DOES TO EACH PAGE

  1. The hero band behind the h1 still carries /hero-photo.webp, which is the
     inside of a private jet cabin. It is replaced with a 21:9 cargo
     photograph chosen for that page's subject.
  2. A wide captioned photograph is inserted after the first content section.

Both are idempotent: the page carries a marker, and a second run does nothing.

THE DRY RUN WRITES PREVIEWS

Without --apply it writes <slug>.cargo-preview.html next to each page, so the
result can be opened and judged before anything real is changed. Delete those
previews afterwards.

The photographs are the ones already deployed in /extras/, so nothing new has
to be uploaded.
"""
import io, os, re, sys

APPLY = '--apply' in sys.argv
MARK = '<!-- fwa-cargo-photo -->'

# page -> (hero, photograph in the body, caption, alt, the statement band)
# CARDS holds the inline card pictures to swap. The cards carry their image in
# a style attribute, style="background-image:url('/extras/luggage.jpg')", and
# on the cargo pages those are private jet cabin photographs: a handbag on a
# cabin seat under the words FOR TIME-CRITICAL FREIGHT, and a jet airstair
# door under FOR OUTSIZE & SPECIALIST CARGO. Anything in this list is replaced
# wherever it appears in a card, in order.
CARDS = {
 'cargo-charter':                 ['cargo-ramp-pallets-dusk', 'cargo-outsize-piece'],
 'heavy-outsize-cargo':           ['cargo-outsize-piece', 'cargo-main-deck-loading'],
 'urgent-cargo-charter':          ['cargo-ramp-pallets-dusk', 'cargo-side-door-loading'],
 'emergency-response-charters':   ['cargo-relief-pallets-hold', 'cargo-containers-on-ramp'],
 'humanitarian-relief-aid-cargo': ['cargo-relief-pallets-hold', 'cargo-pallet-to-aircraft'],
 'oil-gas-industry':              ['cargo-outsize-piece', 'cargo-nose-door-open'],
 'automotive':                    ['cargo-main-deck-loading', 'cargo-containers-on-ramp'],
 'cargo-charter-flights':         ['cargo-main-deck-loading', 'cargo-heavy-lift-freighter'],
 'air-cargo-charter-guide':       ['cargo-lower-hold-loading', 'cargo-ramp-pallets-dusk'],
}

# the pictures that belong to the passenger side of the site and must not sit
# on a cargo page
PASSENGER = ('luggage.jpg', 'door-to-tarmac.jpeg', 'hero-photo.webp',
             'card-private-jet-charter.png', 'card-vip-airliners.jpeg',
             'card-executive-airliners.png', 'card-private-jet-packages.png')
# Each page gets pictures that match what it is about, and no page repeats one.
#
# The band is the full width dark section carrying 1 sentence in caps. It
# already had a background, /extras/luggage.jpg, which is a passenger
# photograph and reads as flat black behind the overlay. It gets a cargo
# photograph instead.
PAGES = {
 'cargo-charter': (
   'cargo-main-deck-loading', 'cargo-side-door-loading',
   'Side door loading. The door sets the pallet height, not the deck.',
   'Cargo being loaded through the side door of a freighter on stand',
   'cargo-containers-on-ramp'),
 'heavy-outsize-cargo': (
   'cargo-outsize-piece', 'cargo-heavy-lift-freighter',
   'Heavy lift. Chartered whole, because the piece will not travel any other way.',
   'A heavy lift freighter on the runway',
   'cargo-nose-door-open'),
 'urgent-cargo-charter': (
   'cargo-ramp-pallets-dusk', 'cargo-pallet-to-aircraft',
   'Build up. Finished before the cut off, or the consignment waits for the next service.',
   'A handler moving a palletised load of cartons beside an aircraft',
   'cargo-main-deck-loading'),
 'emergency-response-charters': (
   'cargo-relief-pallets-hold', 'cargo-ramp-pallets-dusk',
   'Ramp handling. Where a slot is kept or lost.',
   'Loaded pallets standing under the wing of a freighter at dusk',
   'cargo-pallet-to-aircraft'),
 'humanitarian-relief-aid-cargo': (
   'cargo-pallet-to-aircraft', 'cargo-relief-pallets-hold',
   'Relief cargo. Moved on the first aircraft available, not the cheapest.',
   'Sacks of relief supplies netted on pallets inside a freighter hold',
   'cargo-ramp-pallets-dusk'),
 'oil-gas-industry': (
   'cargo-heavy-lift-freighter', 'cargo-outsize-piece',
   'Outsize. The largest single piece decides the aircraft, not the gross weight.',
   'An outsize covered piece on a transport frame at the ramp of a heavy lift freighter',
   'cargo-nose-door-open'),
 'automotive': (
   'cargo-side-door-loading', 'cargo-main-deck-loading',
   'Main deck. Pallet positions are what a part charter is sold in.',
   'A main deck loader raising pallets to the side door of a 747 freighter',
   'cargo-containers-on-ramp'),
 'cargo-charter-flights': (
   'cargo-nose-door-open', 'cargo-containers-on-ramp',
   'On the ramp. Every piece standing here has a cut off time behind it.',
   'Air cargo containers and crates standing on the ramp beside an aircraft',
   'cargo-main-deck-loading'),
 'air-cargo-charter-guide': (
   'cargo-containers-on-ramp', 'cargo-lower-hold-loading',
   'Lower hold. 160 cm of height, which rules out more machinery than weight ever does.',
   'A container being loaded into the lower hold of a widebody aircraft',
   'cargo-side-door-loading'),
}

# what prepare-photos.py actually produced, read from the folder itself so the
# widths in the markup are never guessed
EXTRAS = 'extras'


def widths(base, slot):
    """The sizes on disk for 1 photograph and 1 slot, largest first."""
    out = []
    for f in os.listdir(EXTRAS):
        m = re.match(r'^%s-%s-(\d+)\.(webp|jpg)$' % (re.escape(base), slot), f)
        if m:
            out.append((int(m.group(1)), m.group(2)))
    return sorted(set(w for w, _ in out), reverse=True)


def band_style(base):
    """The dark statement band. Same gradient it already uses, so the caps
    heading keeps its contrast, with a cargo photograph behind it."""
    w = widths(base, 'hero')
    if not w:
        return ''
    big = w[0]
    return ("<style>.imgband{background:linear-gradient(rgba(22,22,26,.46),"
            "rgba(22,22,26,.60)),#26262d url('/%s/%s-hero-%d.jpg') center/cover "
            "no-repeat}@supports(background-image:url(x.webp)){.imgband{background:"
            "linear-gradient(rgba(22,22,26,.46),rgba(22,22,26,.60)),#26262d "
            "url('/%s/%s-hero-%d.webp') center/cover no-repeat}}</style>"
            % (EXTRAS, base, big, EXTRAS, base, big))


def hero_style(base):
    w = widths(base, 'hero')
    if not w:
        return None
    big = w[0]
    return ("<style>.svc-hero{background:linear-gradient(180deg,rgba(22,22,26,.62),"
            "rgba(22,22,26,.78)),#26262d url('/%s/%s-hero-%d.jpg') center 45%%/cover "
            "no-repeat}@supports(background-image:url(x.webp)){.svc-hero{background:"
            "linear-gradient(180deg,rgba(22,22,26,.62),rgba(22,22,26,.78)),#26262d "
            "url('/%s/%s-hero-%d.webp') center 45%%/cover no-repeat}}</style>"
            % (EXTRAS, base, big, EXTRAS, base, big))


FIG_CSS = """<style>
.fwa-fig{margin:0 auto;max-width:1100px}
.fwa-fig picture{display:block;border-radius:16px;overflow:hidden;
 border:1px solid rgba(29,29,31,.12);background:#F5F5F7}
.fwa-fig img{display:block;width:100%;height:auto}
.fwa-fig figcaption{margin:10px 2px 0;font-size:12.5px;line-height:1.6;
 color:#6E6E73;text-align:left}
.fwa-fig-sec{padding-top:0}
</style>"""


def figure(base, cap, alt):
    w = widths(base, 'wide')
    if not w:
        return None
    big, small = w[0], (w[-1] if len(w) > 1 else w[0])
    h = int(round(big * 9 / 16.0))
    src = '/%s/%s-wide' % (EXTRAS, base)
    srcset = ('%s-%d.webp %dw, ' % (src, small, small)) if small != big else ''
    return ('\n<section class="svc fwa-fig-sec"><div class="svc-in">'
            '<figure class="fwa-fig"><picture>'
            '<source type="image/webp" srcset="%s%s-%d.webp %dw" '
            'sizes="(max-width:820px) 92vw, 1100px">'
            '<img src="%s-%d.jpg" width="%d" height="%d" alt="%s" '
            'loading="lazy" decoding="async"></picture>'
            '<figcaption>%s</figcaption></figure></div></section>\n'
            % (srcset, src, big, big, src, big, big, h,
               alt.replace('"', '&quot;'), cap))


def patch(html, slug):
    hero, body, cap, alt, band = PAGES[slug]
    if MARK in html:
        return html, 'already done, nothing to change'
    st = hero_style(hero)
    if not st:
        return html, 'SKIPPED, no hero crop of %s in /%s' % (hero, EXTRAS)
    fig = figure(body, cap, alt)
    if not fig:
        return html, 'SKIPPED, no wide crop of %s in /%s' % (body, EXTRAS)

    # 1. the hero, overridden after the last stylesheet in the head
    i = html.rfind('</style>')
    if i < 0:
        return html, 'SKIPPED, no style block to go after'
    i += len('</style>')
    out = html[:i] + FIG_CSS + st + band_style(band) + MARK + html[i:]

    # 2. the card pictures, swapped in the order they appear. Only the
    #    passenger photographs are touched, so running this on a page whose
    #    cards are already right changes nothing.
    picked = list(CARDS.get(slug, []))
    swapped = 0

    def repl(m):
        global_swapped.append(1)
        base = picked.pop(0)
        w = widths(base, 'wide')
        if not w:
            return m.group(0)
        return m.group(1) + '/%s/%s-wide-%d.jpg' % (EXTRAS, base, w[0]) + m.group(3)

    global_swapped = []
    if picked:
        pat = re.compile(r'(<div class="duo-card-img" style="background-image:url\(\')'
                         r'(/extras/[^\']+)(\'\)")')

        def guard(m):
            if not picked:
                return m.group(0)
            if not m.group(2).split('/')[-1] in PASSENGER:
                return m.group(0)
            return repl(m)

        out = pat.sub(guard, out)
        swapped = len(global_swapped)

    # 2b. the sharing picture. og:image, twitter:image and the image in the
    #     structured data all point at the same passenger photograph, so a
    #     cargo page shared on WhatsApp or shown as a rich result arrives
    #     carrying a handbag on a cabin seat. The 16:9 crop is used here
    #     because it is closest to the 1.91:1 that the social cards expect.
    w = widths(body, 'wide')
    if w:
        big = w[0]
        url = 'https://www.flywithandreea.com/%s/%s-wide-%d.jpg' % (EXTRAS, body, big)
        for old in PASSENGER:
            out = out.replace('https://www.flywithandreea.com/%s/%s' % (EXTRAS, old), url)
        out = re.sub(r'("width":\s*)\d+(,\s*"height":\s*)\d+',
                     lambda m: '%s%d%s%d' % (m.group(1), big, m.group(2),
                                             int(round(big * 9 / 16.0))), out)

    # 3. the photograph, after the first content section below the hero
    h = out.find('<section class="svc-hero">')
    if h < 0:
        return out, 'hero styled, but no hero section found for the photograph'
    e1 = out.find('</section>', h)
    e2 = out.find('</section>', e1 + 1)
    if e2 < 0:
        return out, 'hero styled, only 1 section on the page, photograph skipped'
    e2 += len('</section>')
    out = out[:e2] + fig + out[e2:]
    return out, ('hero %s, band %s, photograph %s, %d card picture%s'
                 % (hero, band, body, swapped, '' if swapped == 1 else 's'))


def main():
    if not os.path.isdir(EXTRAS):
        sys.exit('No %s/ folder here. Run this from the repository root.' % EXTRAS)
    print('%-32s %s' % ('page', 'result'))
    for slug in sorted(PAGES):
        p = slug + '.html'
        if not os.path.exists(p):
            print('%-32s not found, skipped' % slug)
            continue
        html = io.open(p, encoding='utf-8').read()
        out, msg = patch(html, slug)
        print('%-32s %s' % (slug, msg))
        if out == html:
            continue
        if APPLY:
            io.open(p, 'w', encoding='utf-8').write(out)
        else:
            io.open(slug + '.cargo-preview.html', 'w', encoding='utf-8').write(out)
    print('\nWRITTEN' if APPLY else
          '\nDRY RUN. Previews written as <page>.cargo-preview.html. '
          'Open them, then rerun with --apply and delete the previews.')


if __name__ == '__main__':
    main()
