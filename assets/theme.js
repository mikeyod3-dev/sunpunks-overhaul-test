/* Sun Punks — theme.js
   Minimal vanilla helpers: cart drawer, mobile nav, qty stepper, year stamp,
   thumbnail switch on PDP. Designed to translate 1:1 into a Shopify theme
   (replace fetch endpoints with /cart/add.js, /cart/update.js, etc.).
*/
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Year stamp ----------
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // ---------- Cart drawer ----------
  const openDrawer  = () => document.body.setAttribute('data-drawer-open', '');
  const closeDrawer = () => document.body.removeAttribute('data-drawer-open');

  $$('[data-cart-toggle]').forEach(b => b.addEventListener('click', openDrawer));
  $$('[data-drawer-close]').forEach(b => b.addEventListener('click', closeDrawer));
  $('[data-drawer-backdrop]')?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  // ---------- Mobile nav ----------
  $$('[data-nav-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const nav = $('.site-header__nav');
      if (!nav) return;
      const open = nav.style.display === 'flex';
      nav.style.display = open ? '' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.position = open ? '' : 'absolute';
      nav.style.top = open ? '' : '100%';
      nav.style.left = open ? '' : '0';
      nav.style.right = open ? '' : '0';
      nav.style.background = open ? '' : 'var(--sand)';
      nav.style.padding = open ? '' : '1rem var(--gutter)';
      nav.style.borderBottom = open ? '' : '1px solid var(--line)';
    });
  });

  // ---------- Quantity stepper ----------
  $$('.qty').forEach(group => {
    const input = $('[data-qty-input]', group);
    if (!input) return;
    $$('[data-qty]', group).forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.qty);
        const next = Math.max(1, (Number(input.value) || 1) + delta);
        input.value = next;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  });

  // ---------- PDP thumbnail switch ----------
  const thumbs = $$('.product__thumbs button');
  thumbs.forEach(t => t.addEventListener('click', () => {
    thumbs.forEach(x => x.setAttribute('aria-current', 'false'));
    t.setAttribute('aria-current', 'true');
    // In Liquid: swap the main image src here.
  }));

  // ---------- Variant swatch sync (PDP) ----------
  $$('.option__choices input[type=radio]').forEach(radio => {
    radio.addEventListener('change', () => {
      // In Liquid: post the variant change to /variants/{id}.js to update
      // price, availability, and selected_variant id on the form.
    });
  });
})();
