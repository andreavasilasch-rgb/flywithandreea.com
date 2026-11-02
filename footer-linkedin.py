#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LinkedIn in the footer, on every page of the site.

    cd ~/Documents/GitHub/flywithandreea.com
    python3 footer-linkedin.py          # show what would change
    python3 footer-linkedin.py --write  # actually change it

Runs over every .html file in the repository, at any depth.

WHAT IT CHANGES

In the footer Contact column there are two links, WhatsApp and Instagram.
This adds a third, LinkedIn, immediately after Instagram.

The footer is written four slightly different ways across the site:

    <a href="https://www.instagram.com/" target="_blank">Instagram</a>
    <a href="https://www.instagram.com/">Instagram</a>
    <a href="https://www.instagram.com/" target="_blank" rel="noopener">Instagram</a>

so this matches the Instagram link by its href and label, keeps whatever
attributes that particular page used, and copies the indentation in front
of it so the new line sits exactly like its neighbours.

WHAT IT DELIBERATELY DOES NOT CHANGE

The Instagram link is left exactly as it is, attributes and all.

Worth knowing for later, when you come back to it: every one of those
Instagram links points at

    https://www.instagram.com/

which is Instagram's own home page, not the profile. The homepage links
correctly to /flywithAndreea a few hundred lines further up the same file,
so it looks like a typo rather than a decision. Not touched here.

rel="me" ON THE NEW LINK

rel="me" is the convention for "this is the same entity as me". It is one
of the signals used to tie a website to a profile, which is the whole
point of adding this. Where the page already uses target="_blank" the new
link gets rel="me noopener", because an external link opened in a new tab
should always carry noopener.
"""
import os
import re
import shutil
import sys

IG_PROFILE = 'https://www.instagram.com/flywithAndreea'
LINKEDIN = 'https://www.linkedin.com/company/fly-with-andreea/'

# (whitespace before)(the anchor's attributes after the href)
PATTERN = re.compile(
    r'([ \t]*\n?[ \t]*)?<a href="https://www\.instagram\.com/"([^>]*)>Instagram</a>')

SKIP_DIRS = {'.git', 'node_modules', '.cache', 'dist', '.next'}


def build(match):
    """Leave the Instagram anchor exactly as it is, add LinkedIn after it.

    The Instagram href is wrong on every page, it points at
    https://www.instagram.com/ rather than the profile. That is deliberately
    NOT corrected here, it is a separate change for another time.
    """
    ws = match.group(1) or ''
    attrs = match.group(2) or ''
    if 'target=' in attrs:
        li_attrs = ' target="_blank" rel="me noopener"'
    else:
        li_attrs = ' rel="me"'
    ig = '<a href="https://www.instagram.com/"%s>Instagram</a>' % attrs
    li = '<a href="%s"%s>LinkedIn</a>' % (LINKEDIN, li_attrs)
    sep = ws if ws.strip('\r\n\t ') == '' and ws else ''
    return '%s%s%s%s' % (ws, ig, sep, li)


def walk():
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs
                   if d not in SKIP_DIRS and not d.startswith('.')]
        for name in sorted(files):
            if name.lower().endswith(('.html', '.htm')):
                yield os.path.join(root, name)[2:]


def main():
    write = '--write' in sys.argv

    print()
    print('Working in: %s' % os.getcwd())
    print('Mode      : %s' % ('WRITE' if write else 'preview only, nothing '
                                                    'will be changed'))
    print()

    hits, already, skipped = [], [], 0

    for path in walk():
        try:
            src = open(path, encoding='utf-8').read()
        except (OSError, UnicodeDecodeError):
            skipped += 1
            continue
        # Only a footer anchor whose visible text is LinkedIn counts as
        # already done. The about page carries the same LinkedIn URL in its
        # schema and in the founder card, so testing for the URL alone would
        # wrongly skip it and leave that footer without the link.
        if '>LinkedIn</a>' in src:
            already.append(path)
            continue
        n = len(PATTERN.findall(src))
        if n:
            hits.append((path, n, src))

    if not hits and not already:
        print('  No footer Instagram link found in any .html file.')
        print('  Nothing to do. Check you are in the repository root.')
        return

    for path in already:
        print('  %-44s already has LinkedIn, skipped' % path)

    total = 0
    for path, n, _ in hits:
        print('  %-44s %d link%s' % (path, n, '' if n == 1 else 's'))
        total += n

    print()
    print('  %d file%s to change, %d link%s added'
          % (len(hits), '' if len(hits) == 1 else 's',
             total, '' if total == 1 else 's'))
    if skipped:
        print('  %d file(s) could not be read and were skipped' % skipped)

    if not write:
        print()
        print('  This was a preview. Nothing was written.')
        print('  Run it again with --write to apply:')
        print()
        print('      python3 footer-linkedin.py --write')
        print()
        return

    print()
    for path, n, src in hits:
        out = PATTERN.sub(build, src)
        if out.count('Instagram</a>') != src.count('Instagram</a>'):
            print('  SKIPPED %s, link count changed unexpectedly' % path)
            continue
        shutil.copy2(path, path + '.backup')
        open(path, 'w', encoding='utf-8').write(out)

    print('DONE')
    print('  %d file(s) updated, each with a .backup beside it' % len(hits))
    print()
    print('In GitHub Desktop, commit the .html files and untick every')
    print('.backup file and this script.')
    print()


if __name__ == '__main__':
    main()
