# Sun Punks Clothing — Overhaul

A comprehensive front-end overhaul of [sunpunksclothing.com](https://sunpunksclothing.com),
authored as static HTML/CSS/JS but **architected for migration to a Shopify Liquid theme**.

The existing storefront is a stock Dawn-ish Shopify install with default typography
and layout. This project rebuilds the brand presentation around the "Surf. Sun. Soul."
tagline — sun-bleached palette, blocky punk display type, and confident editorial
layout — while keeping the markup carved into the same boundaries Shopify uses
(`layout/theme.liquid`, `sections/*`, `snippets/*`, `templates/*`).

## Folder layout

```
sunpunks-overhaul/
├── index.html              # Home — Liquid target: templates/index.liquid
├── collection.html         # PLP  — Liquid target: templates/collection.liquid
├── product.html            # PDP  — Liquid target: templates/product.liquid
├── cart.html               # Cart — Liquid target: templates/cart.liquid
├── contact.html            # Page — Liquid target: templates/page.contact.liquid
├── assets/
│   ├── theme.css           # Design system + components
│   └── theme.js            # Drawer, nav, qty stepper, variant swap
├── liquid-stubs/           # Reference Liquid versions of key files
│   ├── layout/theme.liquid
│   ├── sections/{header,footer,hero,featured-collection,newsletter}.liquid
│   ├── snippets/{product-card,price,icon-cart}.liquid
│   └── templates/{product,collection}.liquid
└── README.md
```

## HTML → Liquid mapping

Every HTML file is bracketed by comments like:

```html
<!-- LIQUID: {% section 'header' %} -->
...
<!-- /LIQUID -->
```

Inside each bracket, the markup is *exactly* what should land in the corresponding
Shopify section/snippet — the only difference is that sample copy and product data
are hard-coded here. Swap the hard-coded values for `{{ ... }}` outputs and `{% ... %}`
tags and the file moves into the theme without restructuring.

| HTML region                       | Liquid file                                  |
| --------------------------------- | -------------------------------------------- |
| `<head>` + body shell             | `layout/theme.liquid`                        |
| `.site-header`                    | `sections/header.liquid`                     |
| `.site-footer`                    | `sections/footer.liquid`                     |
| `.hero` (homepage)                | `sections/hero.liquid`                       |
| `.featured-collection`            | `sections/featured-collection.liquid`        |
| `.editorial-split`                | `sections/image-with-text.liquid`            |
| `.newsletter`                     | `sections/newsletter.liquid`                 |
| `.product-card`                   | `snippets/product-card.liquid`               |
| `.price`                          | `snippets/price.liquid`                      |
| `.collection-toolbar` + grid      | `sections/main-collection.liquid`            |
| Product gallery + form (PDP)      | `sections/main-product.liquid`               |
| `.cart`                           | `sections/main-cart.liquid`                  |
| `.cart-drawer`                    | `snippets/cart-drawer.liquid`                |

The `liquid-stubs/` directory contains one converted example per major type so the
translation pattern is concrete.

## Design system

CSS custom properties on `:root` — change one variable, the brand follows:

| Token            | Value      | Role                              |
| ---------------- | ---------- | --------------------------------- |
| `--sand`         | `#f4ead5`  | Page background (sun-bleached)    |
| `--cream`        | `#fbf6e9`  | Card / surface                    |
| `--ink`          | `#1b2a3a`  | Body text, deep navy              |
| `--sunset`       | `#e8552c`  | Primary accent (sunset orange)    |
| `--ocean`        | `#1f8a8f`  | Secondary accent (teal)           |
| `--acid`         | `#f7d24c`  | Punk highlight (yellow)           |
| `--shadow`       | `#1b2a3a14`| Soft brand shadow                 |

Display type is `Anton`/`Bebas`-class condensed sans for headings; body is system
sans for performance. One web font, loaded with `font-display: swap`.

## Running locally

It's all static — open any HTML file directly, or:

```bash
cd ~/sunpunks-overhaul && python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Migration checklist (HTML → Liquid)

1. Copy `assets/theme.css` and `assets/theme.js` into the Shopify theme's `assets/`.
2. Move the `<head>` + body wrapper into `layout/theme.liquid`, replacing static
   `<title>`, `<meta>`, and `<link>` tags with `{{ page_title }}`, `{{ content_for_header }}`,
   `{{ 'theme.css' | asset_url | stylesheet_tag }}`, and `{{ content_for_layout }}`.
3. Lift each `<!-- LIQUID: {% section 'X' %} -->` block into `sections/X.liquid`. The
   stubs in `liquid-stubs/` show the section-schema JSON you'll want.
4. Replace the hardcoded product loops with `{% for product in collection.products %}`
   and the card body with `{% render 'product-card', product: product %}`.
5. Swap sample prices for `{% render 'price', product: product %}`.
6. Delete the static HTML files once the theme is uploaded.
