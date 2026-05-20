# Claude Session Handoff — Sun Punks Shopify Theme

If you're a Claude session reading this, **read this entire file first** before doing anything else. Then summarize the state in 3 bullets to the user and ask what's next. Do not start editing code until the user has confirmed direction.

---

## What this project is

A custom **Shopify Online Store 2.0 theme** for **Sun Punks Clothing**
(sunpunksclothing.com). Brand voice: "Surf. Sun. Soul." Sun-bleached 30A
beach aesthetic. Built from scratch as a comprehensive overhaul of their
existing storefront.

The repo doubles as:
1. The Shopify theme (root-level `layout/`, `sections/`, `snippets/`, `templates/`, `assets/`, `config/`, `locales/`)
2. A `static-preview/` folder with the original static HTML for local browser preview

## Repo state

- **Working dir:** `/Users/mikeodonnell/sunpunks-overhaul`
- **GitHub (origin):** https://github.com/mikeyod3-dev/sunpunks-overhaul-test (public, connected to Shopify via GitHub integration)
- **GitHub (site):** https://github.com/mikeyod3-dev/sun-punks-site (currently HTTP 404 — went private or got deleted after a successful early push)
- **Default branch:** `main`
- **Remote name conventions:** `origin` = sunpunks-overhaul-test, `site` = sun-punks-site
- **SSH preferred** per user's saved memory (`id_ed25519`, GitHub user `mikeyod3-dev`)

Quick health check on session start:
```bash
git status
git log --oneline -5
git rev-parse HEAD origin/main
```

## Critical workflow gotchas

1. **Shopify auto-commits back to GitHub.** When the merchant edits anything in Shopify's theme editor (a color, a section, a setting), Shopify writes to `settings_data.json` and template `*.json` files and commits to the connected branch as `shopify[bot]`. Before any local commit, **always `git fetch && git pull --rebase origin main`**, otherwise the push will be rejected.

2. **Shopify wraps `*.json` config files with a comment header** like:
   ```
   /*
    * IMPORTANT: The contents of this file are auto-generated.
    * ...
    */
   ```
   Python's strict JSON parser chokes on it. Strip the leading `/* ... */` before parsing. Shopify accepts JSONC.

3. **Theme size cap is 50MB total.** The bundled surf MP4s (~73MB) blew past it on the first import. They were deleted from `assets/`. The hero video is now configured via:
   - Theme editor → Hero section → **Upload hero video** (Shopify Files, no size cap), OR
   - **External video URL** field (YouTube/Vimeo iframe), OR
   - The bundled-clip playlist fallback (requires manually uploading clips to assets)

4. **`assets/` must be flat.** Shopify's `asset_url` filter takes only a filename. No subdirectories. The video clips were originally in `assets/surf/` but had to be flattened to `assets/surf-{id}.mp4` (now deleted; pattern documented for future use).

5. **GitHub repo must be PUBLIC** (or the Shopify GitHub app must have explicit access) for Shopify to import. The repo was private at first and the import failed silently with "Doesn't reach Shopify at all."

## The 404 saga (resolved, but worth knowing)

The merchant kept seeing only the 404 page when previewing the theme in the editor. Root cause: **`content_for_index: []` had been auto-added by Shopify's theme editor to `settings_data.json`**. That's the legacy OS 1.0 "Sections everywhere" homepage mechanism. With an empty array, it overrode `templates/index.json` and rendered the home page as completely empty → the editor showed 404 as a fallback.

Fix: removed `content_for_index` from `settings_data.json` (commit `44b6abc`). The merchant was also editing what they thought was the home page in the theme editor — actually the 404 template (you can see those sections in `templates/404.json`). Not harmful, just informational.

Secondary cleanup: a Shopify Magic AI draft block in `temp/blocks/.../unconfirmed/` was committed back to the repo by the auto-sync; removed in commit `ee4f1b1`.

After both fixes, the diagnostic minimal `index.json` rendered correctly, and the full 8-section homepage was restored in commit `735d1df`.

## File map (the important bits)

```
layout/theme.liquid                         Master page wrapper
config/
  settings_schema.json                      Theme-editor settings (colors, spin toggle, social URLs,
                                            CUSTOM CSS + CUSTOM <head> HTML fields)
  settings_data.json                        Current setting values (DON'T re-add content_for_index)
locales/en.default.json                     Translation strings
sections/                                   15+ sections, each with {% schema %}:
  announcement-bar, header, footer, spin-to-win
  hero-sun-punks-on-film (video + YouTube/Vimeo + bundled fallback)
  value-props, coming-soon-dropcard (Hacky Sacks)
  featured-collection, ugc-circle, collection-tiles, newsletter
  custom-html (merchant-editable arbitrary HTML)
  main-cart / -collection / -product / -page / -page-contact / -page-swimsuits
  main-page-new-punk / -customers-account
snippets/
  product-card, price, cart-drawer, demo-products
  icon-cart, icon-account, icon-search, icon-menu
templates/
  index.json (8 sections), collection.json, product.json, cart.json
  page.json, page.contact.json, page.swimsuits.json, page.new-punk.json
  customers/account.json, 404.json
assets/
  theme.css (~2000 lines, single design-system file with brand tokens)
  theme.js (cart state, toast, wishlist, quick-add, back-to-top, spin-to-win, hero playlist,
            scroll-anim observer, account/order-page logic)
  hero-poster.svg (B&W moon-over-Gulf hero fallback)
static-preview/                             Original 8 static HTML pages for local browser preview
welcome-page.css, homepage.css              Standalone extracts of theme.css for custom-CSS pastes
README.md                                   Full theme docs + Shopify connection steps
```

## Brand tokens (theme settings — editable in the theme editor)

| Token   | Hex      | Purpose                              |
|---------|----------|--------------------------------------|
| sunset  | `#e8552c`| Primary accent (buttons, badges)     |
| ocean   | `#1f8a8f`| Secondary accent                     |
| acid    | `#f7d24c`| Highlight (mark-acid, hero stamps)   |
| ink     | `#1b2a3a`| Body text, dark backgrounds          |
| sand    | `#f4ead5`| Page background                      |

Fonts: **Anton** (chunky condensed sans, headings + display) + **Pacifico** (surf-shop brush script, hero title). Loaded via Google Fonts in `layout/theme.liquid`.

## Known interactive features

- **Spin-to-win** popup: email-gated, weighted JS roll (FREE HACKY SACK = 2%, 10% OFF = 10%, NOTHING = 88%). One spin per browser session via `sessionStorage`. Floating "Spin to win" button (bottom-right).
- **Persistent cart** via `localStorage` (`sunpunks-cart`). Header badge syncs across pages. Cart drawer renders from this state.
- **Wishlist hearts** on every product card via auto-injection. Persists in `localStorage`. Sunset-orange when saved.
- **Quick-add (+)** button on every product card. Hover-reveal on desktop, always-on for touch.
- **Toast notifications** site-wide. API: `SunPunks.toast(msg, type)`.
- **Back-to-top** floating button (appears after 600px scroll).
- **UGC rotating feed** — 12 fan posts cycle every 7 seconds on the homepage.
- **Scroll-triggered animations** via `data-anim` attribute + IntersectionObserver.
- **Account page** uses `localStorage` to mock customer state (shipping name, sizes, "Sun Punk since [date]" badge, mock order history).
- **New Punk appreciation page** (`/pages/new-punk`) greets customer by shipping name in Anton caps with kraft-paper receipt + timeline + share CTA.
- **Hero video playlist** mode (legacy, currently unused) — reads URLs from `data-playlist-urls` attribute set by Liquid.

## Open items / things to watch

1. **`sun-punks-site` repo is HTTP 404** — went private or got deleted. User may want to recreate or grant Shopify access if they want it as a secondary remote.
2. **Custom HTML section may escape HTML** in the editor's settings textarea (cosmetic — the rendered page is fine). Not investigated in depth.
3. **Hero video** needs to be uploaded via theme editor (Shopify Files) or set to YouTube/Vimeo URL — bundled MP4s were removed to fit the 50MB cap.
4. **Shopify keeps auto-committing.** Most are harmless (cosmetic edits the merchant makes in the theme editor). But watch out for `content_for_index` being re-added to `settings_data.json` — if it comes back empty, the homepage breaks again.
5. **`templates/404.json` has been heavily customized** by the merchant (they accidentally added homepage-style sections to it). Not harmful, but worth knowing.

## Recent commit timeline

```
735d1df  Restore full homepage (8 sections) — diagnostic confirmed template loads
04b969b  Debug: minimal index.json (single custom-html block)
68ff997  Update from Shopify for theme sunpunks-overhaul-test/main (auto)
ee4f1b1  Drop temp/blocks AI-generated welcome draft
44b6abc  Strip legacy content_for_index from settings_data.json  ← THE 404 FIX
6019321  Add Custom HTML section + slot it into the homepage
4697930  Update from Shopify for theme sunpunks-overhaul-test/main (auto)
c654f30  Add Custom CSS + Custom <head> HTML fields to theme settings
39bc535  Add demo-product fallbacks (so the imported theme looks right out-of-box)
528255e  Drop bundled surf MP4s — theme was over Shopify's 50MB limit
954127d  Hero video: add Shopify upload + YouTube/Vimeo URL options
8ffd1f7  Convert to Shopify Online Store 2.0 theme
5d10217  Add New Punk page, UGC feature, UX kit; consolidate nav; drop dressing room
310ac8d  Add Sun Punks on Film hero, dressing room, swimsuits, accounts, spin-to-win
b0571fc  Initial Sun Punks Clothing overhaul
```

## User communication preferences

- No emojis in output (per saved feedback).
- Terse, action-oriented updates. Don't narrate internal deliberation.
- Format file paths as `file_path:line_number` when referring to code.
- macOS environment — `pbcopy` works for clipboard, `open <url>` opens browser tabs.
- They like seeing things visually — opening pages in the browser after changes is appreciated.
- They iterate fast and ship quickly. Don't ask too many clarifying questions; pick a sensible interpretation and move.

## Quick local preview

```bash
cd /Users/mikeodonnell/sunpunks-overhaul
python3 -m http.server 8765
# then open http://localhost:8765/static-preview/index.html
```

## Once you've read this

Reply to the user with:
- One sentence confirming the handoff was received
- 3 bullets summarizing the current state
- One question: "What's next?"

Do NOT start editing files until they answer.
