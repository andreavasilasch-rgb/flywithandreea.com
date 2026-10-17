# -*- coding: utf-8 -*-
"""Put the chat scripts on every page.

Two lines before </body>, the same shape as the site's other root scripts. The
words file has to load first, so it is written first:

    <script src="/fwa-flows.js" defer></script>
    <script src="/fwa-chat.js" defer></script>

Run it from the repository root. Nothing is written until you add --apply, and
--remove takes it back off again if you change your mind.

    python3 install-chat.py
    python3 install-chat.py --apply
    python3 install-chat.py --remove --apply
"""
import io, os, re, sys, collections

TAG = ('<script src="/fwa-flows.js" defer></script>'
       '<script src="/fwa-chat.js" defer></script>')
SKIP_DIRS = {'.git', 'node_modules', '.wrangler', 'functions'}
# Pages that should not carry it: anything that is not a page a visitor reads.
SKIP_FILES = re.compile(r'(^|/)(404|500|_headers|_redirects)\.html$', re.I)


def main():
    apply_ = '--apply' in sys.argv
    remove = '--remove' in sys.argv
    root = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('-') else '.'

    c = collections.Counter()
    for dirpath, dirnames, files in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in files:
            if not f.endswith('.html'):
                continue
            p = os.path.join(dirpath, f)
            rel = os.path.relpath(p, root).replace(os.sep, '/')
            if SKIP_FILES.search(rel):
                c['skipped'] += 1
                continue
            c['scanned'] += 1
            h = io.open(p, encoding='utf-8', errors='ignore').read()
            has = TAG in h

            if remove:
                if not has:
                    continue
                new = h.replace(TAG, '').replace('\n\n</body>', '\n</body>')
                c['removed'] += 1
            else:
                if has:
                    c['already'] += 1
                    continue
                if '</body>' not in h:
                    c['no body tag'] += 1
                    continue
                i = h.rindex('</body>')
                new = h[:i] + TAG + h[i:]
                c['added'] += 1
            if apply_ and new != h:
                io.open(p, 'w', encoding='utf-8').write(new)

    for k in ('scanned', 'added', 'already', 'removed', 'skipped', 'no body tag'):
        if c[k]:
            print('  %-14s %d' % (k, c[k]))
    print()
    print('WRITTEN' if apply_ else 'DRY RUN. Nothing written. Add --apply.')


if __name__ == '__main__':
    main()
