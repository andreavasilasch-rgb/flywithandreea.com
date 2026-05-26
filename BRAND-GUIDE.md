# FLY WITH ANDREEA — Brand Guide
## flywithandreea.com

---

### FONTS
- **Display / Headings:** Cinzel (Google Fonts) · weights 300, 400
- **Body / UI:** SF Pro Display / SF Pro Text (system font) · weights 300, 400, 500

---

### COLOURS
| Token | Hex | Usage |
|---|---|---|
| Gold | `#CBAD91` | CTAs, accents, numbers, highlights |
| Gold Light | `#D6B89C` | Hover states, italic text |
| Gold Pale | `#F0E6D8` | Background tints |
| Ink | `#1D1D1F` | Primary headings |
| Ink 2 | `#3A3A3C` | Secondary headings |
| Grey Dark | `#6E6E73` | Body text |
| Grey | `#86868B` | Captions, metadata |
| Grey Light | `#D2D2D7` | Borders, dividers |
| White | `#FFFFFF` | Primary backgrounds |
| Off-white | `#F5F5F7` | Section backgrounds |
| Warm Grey | `#E8E8ED` | Panel backgrounds |

**Distribution:** 65% white · 25% off-white · 10% warm-grey · gold accent only

---

### TYPE SCALE
11 · 13 · 15 · 17 · 22 · 28 · 40 · 56px

---

### SPACING
8 · 16 · 24 · 48 · 80 · 120px

---

### BORDER RADIUS
- Buttons / pills / inputs: `40px`
- Large cards: `20px`
- Small elements: `12px`

---

### FILES
```
fly-with-andreea.html   ← homepage
routes.json             ← 920 routes with Q&A (location-aware)
empty-legs.csv          ← empty legs (update manually)
logo.png                ← brand logo
hero-bg.mp4             ← hero background video
BRAND-GUIDE.md          ← this file
```

---

### BEFORE GOING LIVE — checklist
- [ ] Replace WhatsApp number: search `+1234567890` → your real number
- [ ] Update Instagram handle: `flywithAndreea` → your real handle  
- [ ] Add email address: `mailto:you@flywithandreea.com` in footer
- [ ] Add phone number: `tel:+XX...` in footer
- [ ] Upload all files to your hosting root at `www.flywithandreea.com`
- [ ] Replace placeholder testimonial metrics with real numbers
- [ ] Replace Instagram section photos with real screenshots
- [ ] Create `Privacy Policy` and `Terms of Service` pages
- [ ] Connect form to email handler (Formspree, Netlify Forms, or custom)
- [ ] Submit sitemap.xml to Google Search Console
- [ ] Set up Google Business Profile

---

### DEVELOPER NOTES
- `routes.json` is loaded client-side via `fetch()` — must be served from same domain
- Location detection uses `ipapi.co` (free, no key, GDPR-safe)
- `empty-legs.csv` is not auto-loaded — update HTML manually or ask developer to wire it
- Video `hero-bg.mp4` must sit in same directory as the HTML file
- All external images use Unsplash CDN — replace with owned images before launch
