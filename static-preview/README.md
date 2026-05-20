# Static preview

These are the original static HTML files for previewing the design locally
without running Shopify. They reference `../assets/theme.css` and `../assets/theme.js`
from the parent Shopify theme.

> ⚠️ The surf clip filenames changed when this folder was migrated into a Shopify
> theme. Previously the playlist read from `assets/surf/{id}.mp4`; now the files
> live at the root of `assets/` as `assets/surf-{id}.mp4`. If the homepage hero
> doesn't play here, update the `data-playlist-path` attribute on the
> `.hero-video` in `index.html` from `assets/surf/` to `../assets/` and the
> `data-playlist` ids from `1568` to `surf-1568`, or just open the Shopify
> theme in a Shopify store to see the real rendering.

To preview locally:

```bash
cd .. && python3 -m http.server 8000
# then visit http://localhost:8000/static-preview/index.html
```
