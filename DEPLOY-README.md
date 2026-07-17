# Fly with Andreea — Deploy Package

Generated: 2026-07-05
Bundle: `FLYWITHANDREEA-MASTER-DEPLOY.zip`

## What this is
A complete, self-contained snapshot of flywithandreea.com ready to publish to Cloudflare Pages as **static assets** (no server code). Unzip and the folder IS the site root.

## Contents (3,226 pages)
- **5 homepages** — English + Italian, French, Spanish, Romanian (`/`, `/it/`, `/fr/`, `/es/`, `/ro/`)
- **Core pages ×5 languages** — aircraft catalogue, frequent routes, airport guide, empty legs, fast quote, about Andreea, privacy, terms, cookies
- **39 airport guides** — localized across all 5 languages
- **2,999 private-jet route pages** — `/en/private-jet/from-X-to-Y` (batches 1–3), each with pricing, aircraft, airports, flight time, a prefilled quote form, canonical footer, internal-link mesh, and FAQ schema
- **Shared scripts at root** — `sticky-cta.js` (4-CTA sticky bar + scroll ring), `aircraft-trail.js` (cursor trail)
- **Site map** — human view at `/site-map`, XML at `/sitemap.xml` (index → core + 3 route sitemaps)

## Pre-deploy checklist (all verified)
- [x] Assets-only — no `worker.js` / `_worker.js` / `wrangler.toml` (keeps site online per DEPLOY-SAFETY.md)
- [x] `_headers` and `_redirects` present
- [x] `robots.txt` points to `/sitemap.xml`
- [x] All sitemaps well-formed XML; index references 4 child maps
- [x] Empty legs filtered to 07 July onward (0 stale entries)
- [x] Root assets present: `logo.png`, `sticky-cta.js`, `aircraft-trail.js`
- [x] Every route page: quote form + footer + mesh + FAQ schema + canonical (2,999/2,999)
- [x] No language leaks in route pages (EN-only)
- [x] No `.DS_Store` / junk files

## Not yet included
Route batches 4–27 (routes 3,001–26,152) are queued. Each generates to the same template and drops in as `/en/private-jet/...` plus a new `sitemap-routes-N.xml` added to the index. Deploying now and adding batches later is safe — later batches only ADD pages.

Note: mesh links on route pages may point to sibling routes not yet deployed; those resolve once their batch ships. No broken layout, just a 404 on a not-yet-published sibling until then.

## How to publish (Cloudflare Pages)
Deploy the unzipped folder as the build output directory (static). Do not add a Functions/Worker. The included `_headers` and `_redirects` are honored automatically.
