# Deploy notes — Fly with Andreea

Base: repo snapshot 2026-07-02, with this session's updates applied to every page.

## Applied to ALL 226 pages
- Sticky 4-CTA bar (Quote / Email / Call / WhatsApp) + scroll-progress ring, via `/sticky-cta.js` (auto-removes the old 3-button bar and old back-to-top).
- Aircraft cursor-trail effect, via `/aircraft-trail.js` (homepages already carry it inline, so they are not double-loaded).
- Both are `<script defer>` before `</body>`, idempotent, and disabled on touch / reduced-motion.

## Empty legs
- Removed every leg dated before 07 Jul 2026. 258 -> 163 kept.
- Applied to `empty-legs-data.js` (feeds airport pages + all /empty-legs pages) and the inline data on all 5 homepages.

## Homepages (EN + IT/FR/ES/RO)
- Deployed the updated + translated homepages (reordered sections, TIME NOW flight-deck, "Request a quote" copy, aircraft glow, empty-leg card fixes).
- Jet size categories kept in English; "Cargo" kept in English.
- Removed dead "World Cup" nav/subnav links (no worldcup page exists).
- Route cards now link to `/frequent-routes` (added). IT/FR empty-leg links point to the real slugs (`/it/voli-empty-leg`, `/fr/vols-a-vide`).

## Added pages
- `about-andreea.html` + `it|fr|es|ro/about-andreea.html` (footer links resolve).
- `frequent-routes.html`.

## Caveat
Base is the 2 Jul snapshot. If the live site has newer edits since then on non-homepage pages, re-sync those before deploying, or hand me the current files.
