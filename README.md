# Sun Punks — Shopify theme

A custom Shopify theme for [sunpunksclothing.com](https://sunpunksclothing.com),
built from the brand's "Surf. Sun. Soul." identity.

The repo is structured as a valid Shopify Online Store 2.0 theme. Connect it to
a Shopify store via **Shopify admin → Online Store → Themes → Add theme → Connect from GitHub**.

## Theme structure

```
.
├── assets/                    # CSS, JS, fonts, surf clips, poster SVG
│   ├── theme.css
│   ├── theme.js
│   ├── hero-poster.svg
│   └── surf-*.mp4             # 12 hero playlist clips
├── config/
│   ├── settings_schema.json   # Theme editor settings (colors, social, spin toggle)
│   └── settings_data.json
├── layout/
│   └── theme.liquid           # Master wrapper for every page
├── locales/
│   └── en.default.json
├── sections/                  # Theme-editor-driven sections (each has {% schema %})
│   ├── announcement-bar.liquid
│   ├── header.liquid
│   ├── footer.liquid
│   ├── spin-to-win.liquid
│   ├── hero-sun-punks-on-film.liquid
│   ├── value-props.liquid
│   ├── coming-soon-dropcard.liquid
│   ├── featured-collection.liquid
│   ├── ugc-circle.liquid
│   ├── collection-tiles.liquid
│   ├── newsletter.liquid
│   └── main-*.liquid          # Per-template main sections
├── snippets/
│   ├── product-card.liquid
│   ├── price.liquid
│   ├── cart-drawer.liquid
│   └── icon-*.liquid
├── templates/                 # Composed JSON templates
│   ├── index.json
│   ├── collection.json
│   ├── product.json
│   ├── cart.json
│   ├── page.json
│   ├── page.contact.json
│   ├── page.swimsuits.json
│   ├── page.new-punk.json
│   ├── customers/account.json
│   └── 404.json
└── static-preview/            # Original static HTML, for local browser preview
```

## Connecting this repo to Shopify

1. Push to GitHub (already done at https://github.com/mikeyod3-dev/sunpunks-overhaul-test).
2. In your Shopify admin: **Online Store → Themes → Add theme → Connect from GitHub**.
3. Authorize Shopify on your GitHub account, choose this repo and the `main` branch.
4. Shopify will install the theme on a development branch. Preview, then publish.
5. Edits to the connected branch sync live in Shopify; edits in the theme editor
   commit back to the branch (or to a feature branch you configure).

## ⚠️ Hero video setup (important)

Shopify themes have a hard **50MB total size cap**, so the surf clips that
shipped with the static demo are NOT bundled in this repo. After import:

1. Open the theme editor → click the hero section
2. **Upload hero video** — drag in an MP4 (Shopify Files, no size cap there)
3. *Or* paste a YouTube / Vimeo URL into the **External video URL** field

Until one of those is set the hero shows the SVG poster artwork. The hero
section will never crash from missing video assets.

## What's in here vs. what Shopify will fill in

The theme provides the **structure and visuals**; Shopify provides the **data**:

| The theme renders                                | From Shopify's data                                          |
| ------------------------------------------------ | ------------------------------------------------------------ |
| Product cards on the homepage & collection page  | Products in the collection chosen in the theme editor        |
| Product detail page (variants, price, ATC)       | Each product's variants / images / description / metafields  |
| Cart drawer & cart page line items               | Live cart state                                              |
| Account dashboard (orders, addresses)            | `customer.orders`, `customer.default_address`                |
| New Punk appreciation page                       | `customer.orders.first` (latest order)                       |
| Footer payment icons + social links              | `shop.enabled_payment_types` + the social URLs in settings   |

The Hacky Sacks "Coming Soon" dropcard, the rotating UGC feed, the surf-clip
hero, and the spin-to-win popup are **static content sections** with editable
text in the theme editor — none of them require backing Shopify objects.

## What you'll want to set up in Shopify after import

1. **Online Store → Navigation:**
   - **Main menu** with links to Collections, Pages, etc. (the header reads
     `linklists[section.settings.menu]` — defaults to `main-menu`)
   - **Footer menu** for the footer column
2. **Products + Collections:**
   - Create a `featured` collection (or rename — pick it in the theme editor's
     featured-collection section)
   - Create per-category collections (`tees`, `koozies`, `bags`) that the
     category-tile blocks link to
   - For swim, create `boardshorts-5`, `boardshorts-8`, `rashguards` and assign
     them in the swim page template
3. **Pages:**
   - Create a `Contact` page using the `page.contact` template
   - Create a `Swimsuits` page using `page.swimsuits` (URL: `/pages/swimsuits`)
   - Create a `New Punk` page using `page.new-punk` (URL: `/pages/new-punk`)
4. **Settings → Notifications:** Enable customer account creation if you want
   orders to feed the account / appreciation pages

## Brand tokens (editable in the theme editor)

| Setting       | Default     | Used for                              |
| ------------- | ----------- | ------------------------------------- |
| Sunset        | `#e8552c`   | Primary accent (buttons, badges)      |
| Ocean         | `#1f8a8f`   | Secondary accent (USA badges, links)  |
| Acid          | `#f7d24c`   | Highlight (mark-acid, hero ribbons)   |
| Ink           | `#1b2a3a`   | Body text, dark backgrounds           |
| Sand          | `#f4ead5`   | Page background                       |

Display type is **Anton** (chunky condensed sans); display script is **Pacifico**.
Both loaded via Google Fonts in `layout/theme.liquid`.

## Local development

You can preview the design without a Shopify store by opening files in
`static-preview/` (original static HTML versions). They read CSS/JS from
`../assets/`. Some interactive features that depend on Shopify objects
(cart, account, products) won't render real data locally.

```bash
python3 -m http.server 8000
# then http://localhost:8000/static-preview/index.html
```

For real Shopify previews:

```bash
# Install the Shopify CLI (one time)
npm install -g @shopify/cli @shopify/theme

# Pull theme + preview against your dev store
shopify theme dev
```

## Things to know about this conversion

- Asset folder is flat (Shopify's `asset_url` filter takes a filename, not a path).
  The hero playlist clips live at `assets/surf-{id}.mp4`; the JS reads asset URLs
  Liquid renders into the `data-playlist-urls` attribute.
- Sections all have `{% schema %}` blocks so merchants can edit copy, colors,
  CTAs, and collection pickers without touching code.
- The `customers/account` template uses the new Online Store 2.0 layout; if you
  want the legacy account flow, swap it back to a `.liquid` file.
- The Spin-to-Win popup persists state in `sessionStorage`; one spin per session.
  Toggle it off in **Theme editor → Theme settings → Add-ons**.
