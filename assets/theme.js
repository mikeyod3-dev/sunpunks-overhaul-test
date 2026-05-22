/* Sun Punks — theme.js
   Minimal vanilla helpers: cart drawer, mobile nav, qty stepper, year stamp,
   thumbnail switch on PDP. Designed to translate 1:1 into a Shopify theme
   (replace fetch endpoints with /cart/add.js, /cart/update.js, etc.).
*/
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ============================================================
  //  SunPunks UX kit — toast, cart, wishlist, back-to-top
  // ============================================================
  window.SunPunks = window.SunPunks || {};

  // ----- Toast -----
  const toast = (msg, type = 'success') => {
    let host = document.querySelector('.toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'toast-host';
      document.body.appendChild(host);
    }
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    host.appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-visible'));
    setTimeout(() => {
      t.classList.remove('is-visible');
      setTimeout(() => t.remove(), 280);
    }, 2800);
  };
  window.SunPunks.toast = toast;

  // ----- Cart (localStorage) -----
  const Cart = {
    KEY: 'sunpunks-cart',
    read() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
    write(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); this.refresh(); },
    add(item) {
      const items = this.read();
      const existing = items.find(x => x.id === item.id && (x.variant || '') === (item.variant || ''));
      if (existing) existing.qty = (existing.qty || 1) + (item.qty || 1);
      else items.push({ ...item, qty: item.qty || 1 });
      this.write(items);
    },
    count() { return this.read().reduce((s, i) => s + (i.qty || 1), 0); },
    total() { return this.read().reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0); },
    refresh() {
      const n = this.count();
      $$('[data-cart-count]').forEach(el => {
        el.textContent = n;
        el.style.display = n > 0 ? '' : 'none';
      });
      this.renderDrawer();
    },
    renderDrawer() {
      const body = $('.drawer__body');
      const foot = $('.drawer__foot strong:last-child');
      if (!body) return;
      const items = this.read();
      if (!items.length) {
        body.innerHTML = '<p class="muted" style="text-align:center; padding:2rem 1rem;">Your cart is empty.<br/>Pick a fit from the <a href="collection.html">Collection</a>.</p>';
        if (foot) foot.textContent = '$0.00';
        return;
      }
      body.innerHTML = items.map(i => `
        <div class="cart-item">
          <div class="cart-item__img" style="background:${i.color || '#1b2a3a'};"></div>
          <div>
            <strong>${i.title}</strong>
            <div class="muted" style="font-size:.85rem;">${i.variant || 'One size'} · Qty ${i.qty}</div>
          </div>
          <span>$${(i.price * i.qty).toFixed(2)}</span>
        </div>`).join('');
      if (foot) foot.textContent = '$' + this.total().toFixed(2);
    },
  };
  window.SunPunks.cart = Cart;
  Cart.refresh();

  // ----- Wishlist (localStorage) -----
  const Wishlist = {
    KEY: 'sunpunks-wishlist',
    read() { try { return JSON.parse(localStorage.getItem(this.KEY)) || []; } catch { return []; } },
    write(ids) { localStorage.setItem(this.KEY, JSON.stringify(ids)); this.refresh(); },
    has(id) { return this.read().includes(id); },
    toggle(id) {
      const items = this.read();
      const i = items.indexOf(id);
      if (i >= 0) items.splice(i, 1); else items.push(id);
      this.write(items);
      return this.has(id);
    },
    refresh() {
      const ids = this.read();
      $$('.wishlist-btn').forEach(btn => btn.setAttribute('aria-pressed', ids.includes(btn.dataset.id) ? 'true' : 'false'));
    },
  };
  window.SunPunks.wishlist = Wishlist;

  // ----- Auto-enhance: inject quick-add + wishlist on every product card -----
  const HEART_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.5 4 4 0 0 1 7 2.5c0 6.5-7 11-7 11Z"/></svg>';
  const PLUS_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  $$('.product-card').forEach(card => {
    const title = card.querySelector('.product-card__title')?.textContent.trim();
    if (!title) return;
    // Skip category tiles (they end with → for navigation, no price)
    if (title.endsWith('→') || title.endsWith('→')) return;
    if (!card.querySelector('.product-card__price')) return;
    if (card.querySelector('.quick-add')) return;     // already enhanced

    const priceText = card.querySelector('.product-card__price')?.textContent.trim() || '';
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    const id = slug(title);

    const qa = document.createElement('button');
    qa.type = 'button';
    qa.className = 'quick-add';
    qa.setAttribute('aria-label', `Quick add ${title}`);
    qa.innerHTML = PLUS_SVG;
    qa.dataset.id = id;
    qa.dataset.title = title;
    qa.dataset.price = price;

    const wl = document.createElement('button');
    wl.type = 'button';
    wl.className = 'wishlist-btn';
    wl.setAttribute('aria-label', `Save ${title}`);
    wl.setAttribute('aria-pressed', Wishlist.has(id) ? 'true' : 'false');
    wl.innerHTML = HEART_SVG;
    wl.dataset.id = id;

    card.appendChild(qa);
    card.appendChild(wl);
  });

  // Delegated click handling for quick-add / wishlist (works for newly-injected nodes)
  document.addEventListener('click', (e) => {
    const qa = e.target.closest('.quick-add');
    if (qa) {
      e.preventDefault();
      e.stopPropagation();
      Cart.add({
        id: qa.dataset.id,
        title: qa.dataset.title,
        price: parseFloat(qa.dataset.price) || 0
      });
      qa.classList.add('is-popped');
      setTimeout(() => qa.classList.remove('is-popped'), 350);
      toast(`Added · ${qa.dataset.title}`);
      return;
    }
    const wl = e.target.closest('.wishlist-btn');
    if (wl) {
      e.preventDefault();
      e.stopPropagation();
      const saved = Wishlist.toggle(wl.dataset.id);
      toast(saved ? 'Saved to wishlist' : 'Removed from wishlist', saved ? 'save' : 'info');
      wl.setAttribute('aria-pressed', saved ? 'true' : 'false');
    }
  });

  // ----- Back-to-top -----
  const btt = document.createElement('button');
  btt.type = 'button';
  btt.className = 'back-to-top';
  btt.setAttribute('aria-label', 'Back to top');
  btt.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(btt);
  const onScroll = () => btt.classList.toggle('is-visible', window.scrollY > 600);
  window.addEventListener('scroll', onScroll, { passive: true });
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  onScroll();

  // ---------- Spin to win (1/100 free hacky sack, email-gated) ----------
  const spinModal = $('#spinModal');
  if (spinModal) {
    const SPIN_KEY    = 'sunpunks-spin-result';
    const EMAIL_KEY   = 'sunpunks-email';
    const fab         = $('.spin-fab');
    const rotor       = $('[data-wheel-rotor]', spinModal);
    const stepIntro   = $('[data-spin-step="intro"]', spinModal);
    const stepGame    = $('[data-spin-step="game"]', spinModal);
    const stepResult  = $('[data-spin-step="result"]', spinModal);
    const form        = $('[data-spin-form]', spinModal);
    const spinBtn     = $('[data-spin-go]', spinModal);
    const titleEl     = $('[data-result-title]', spinModal);
    const bannerEl    = $('[data-result-banner]', spinModal);
    const bodyEl      = $('[data-result-body]', spinModal);
    const codeWrap    = $('[data-result-code-wrap]', spinModal);
    const codeEl      = $('[data-result-code]', spinModal);
    const copyBtn     = $('[data-result-copy]', spinModal);

    // Three prizes. Weights total 100. The wheel has six visual segments;
    // some prizes appear in multiple positions, so the spin lands on a random
    // matching segment for variety.
    const PRIZES = {
      HACKY:   { id: 'HACKY',   label: 'FREE HACKY SACK', code: 'HACKYPUNK', weight: 2,
                 title: 'YOU JUST WON A HACKY SACK!',
                 banner: '1 in 50 · You did it' },
      OFF10:   { id: 'OFF10',   label: '10% OFF',         code: 'PUNKS10',   weight: 10,
                 title: '10% off your next order',
                 banner: 'Nice spin' },
      NOTHING: { id: 'NOTHING', label: 'Nothing',         code: null,        weight: 88,
                 title: 'No luck this time.',
                 banner: 'Wax up — try the next drop' },
    };

    // centerDeg = conic-gradient angle (0 = top, clockwise) for each segment.
    const SEGMENTS = [
      { centerDeg:  30, prize: 'NOTHING' },
      { centerDeg:  90, prize: 'OFF10'   },
      { centerDeg: 150, prize: 'NOTHING' },
      { centerDeg: 210, prize: 'HACKY'   },
      { centerDeg: 270, prize: 'NOTHING' },
      { centerDeg: 330, prize: 'OFF10'   },
    ];

    const pickPrize = () => {
      const roll = Math.random() * 100;
      if (roll < PRIZES.HACKY.weight) return PRIZES.HACKY;
      if (roll < PRIZES.HACKY.weight + PRIZES.OFF10.weight) return PRIZES.OFF10;
      return PRIZES.NOTHING;
    };

    const segmentFor = (prizeId) => {
      const matches = SEGMENTS.filter(s => s.prize === prizeId);
      return matches[Math.floor(Math.random() * matches.length)];
    };

    const openModal  = () => { spinModal.setAttribute('data-open', ''); spinModal.setAttribute('aria-hidden', 'false'); };
    const closeModal = () => { spinModal.removeAttribute('data-open'); spinModal.setAttribute('aria-hidden', 'true'); };
    const goStep = (which) => {
      [stepIntro, stepGame, stepResult].forEach(el => el.hidden = true);
      ({ intro: stepIntro, game: stepGame, result: stepResult })[which].hidden = false;
    };

    const showResult = (prize) => {
      titleEl.textContent = prize.title;
      bannerEl.textContent = prize.banner;
      bodyEl.textContent = prize.code
        ? `Use this code at checkout — one use per customer.`
        : `Your email's on the list — we'll DM you when the next drop lands.`;
      if (prize.code) {
        codeEl.textContent = prize.code;
        codeWrap.hidden = false;
      } else {
        codeWrap.hidden = true;
      }
      goStep('result');
      if (prize.id === 'HACKY') confetti(spinModal);
    };

    // If user already spun in this browser, show the result on open.
    const restorePrior = () => {
      try {
        const cached = sessionStorage.getItem(SPIN_KEY);
        if (!cached) return null;
        return JSON.parse(cached);
      } catch { return null; }
    };

    // Wire UI events
    $$('[data-spin-open]').forEach(b => b.addEventListener('click', () => {
      const prior = restorePrior();
      if (prior) showResult(prior); else goStep(sessionStorage.getItem(EMAIL_KEY) ? 'game' : 'intro');
      openModal();
    }));
    $$('[data-spin-close]', spinModal).forEach(b => b.addEventListener('click', closeModal));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && spinModal.hasAttribute('data-open')) closeModal(); });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = ($('#spinName')?.value || '').trim();
      const email = $('#spinEmail').value.trim();
      if (!email) return;
      sessionStorage.setItem(EMAIL_KEY, email);
      if (name) localStorage.setItem('sunpunks-name', name);
      // Stamp account creation if not set (consumed by the account + appreciation pages)
      if (!localStorage.getItem('sunpunks-since')) {
        localStorage.setItem('sunpunks-since', new Date().toISOString());
        localStorage.setItem('sunpunks-email', email);
      }
      goStep('game');
    });

    let spun = false;
    spinBtn.addEventListener('click', () => {
      if (spun) return;
      spun = true;
      spinBtn.disabled = true;
      spinBtn.textContent = 'Spinning…';
      const prize = pickPrize();
      const seg = segmentFor(prize.id);
      const turns = 5 + Math.floor(Math.random() * 3);   // 5–7 full rotations
      const jitter = (Math.random() - 0.5) * 30;          // ±15° within the segment
      const target = turns * 360 - seg.centerDeg + jitter;
      rotor.classList.add('is-spinning');
      rotor.style.transform = `rotate(${target}deg)`;
      setTimeout(() => {
        sessionStorage.setItem(SPIN_KEY, JSON.stringify(prize));
        showResult(prize);
      }, 4500);
    });

    copyBtn.addEventListener('click', () => {
      const code = codeEl.textContent;
      if (!code) return;
      navigator.clipboard?.writeText(code);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 1500);
    });

    function confetti(host) {
      const wrap = document.createElement('div');
      wrap.className = 'spin-confetti';
      host.querySelector('.spin-modal__panel').appendChild(wrap);
      const colors = ['#e8552c', '#f7d24c', '#1f8a8f', '#fbf6e9', '#1b2a3a'];
      for (let i = 0; i < 70; i++) {
        const c = document.createElement('span');
        c.style.left = (Math.random() * 100) + '%';
        c.style.background = colors[Math.floor(Math.random() * colors.length)];
        c.style.animationDelay = (Math.random() * .4) + 's';
        c.style.transform = `rotate(${Math.random()*360}deg)`;
        wrap.appendChild(c);
      }
      setTimeout(() => wrap.remove(), 3500);
    }
  }

  // Prefer the shipping name; fall back to the email handle, then 'punk'.
  const displayName = () => {
    const stored = (localStorage.getItem('sunpunks-name') || '').trim();
    if (stored) return stored;
    const email = (localStorage.getItem('sunpunks-email') || '').trim();
    if (email) return (email.split('@')[0] || 'punk').replace(/[.\-_]+/g, ' ');
    return 'punk';
  };

  // ---------- Latest order / appreciation page ----------
  if (document.body.dataset.template === 'customers.order') {
    const since = localStorage.getItem('sunpunks-since');
    $$('[data-customer-name]').forEach(e => e.textContent = displayName());
    $$('[data-order-date]').forEach(e => e.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    if (since) {
      const days = Math.max(1, Math.floor((Date.now() - new Date(since).getTime()) / 86400000));
      $$('[data-account-days]').forEach(e => e.textContent = days + (days === 1 ? ' day' : ' days'));
    } else {
      $$('[data-account-days]').forEach(e => e.textContent = 'Day 1');
    }
  }

  // ---------- Account page (Sun Punk since · sizes · orders) ----------
  if (document.body.dataset.template === 'customers.account') {
    const loggedIn  = !!localStorage.getItem('sunpunks-since');
    const inEl  = $$('[data-account-loggedin]');
    const outEl = $$('[data-account-loggedout]');
    inEl.forEach(e => e.hidden  = !loggedIn);
    outEl.forEach(e => e.hidden = loggedIn);

    if (loggedIn) {
      const email = localStorage.getItem('sunpunks-email') || 'sun.punk@thebeach.com';
      const since = new Date(localStorage.getItem('sunpunks-since'));
      const sizes = JSON.parse(localStorage.getItem('sunpunks-sizes') || '{"tee":"M","bottom":"32","shoe":"10"}');

      const monthDay = since.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const days = Math.max(1, Math.floor((Date.now() - since.getTime()) / 86400000));

      const name = displayName();
      const firstName = name.split(/\s+/)[0];
      $$('[data-account-name]').forEach(e => e.textContent = firstName);
      $$('[data-account-shipping-name]').forEach(e => e.textContent = name);
      $$('[data-account-since]').forEach(e => e.textContent = monthDay);
      $$('[data-account-since-full]').forEach(e => e.textContent = monthDay);
      $$('[data-account-days]').forEach(e => e.textContent = days + (days === 1 ? ' day' : ' days') + ' strong');
      $$('[data-account-email]').forEach(e => e.textContent = email);
      $$('[data-size-tee]').forEach(e => e.textContent = sizes.tee);
      $$('[data-size-bottom]').forEach(e => e.textContent = sizes.bottom);
      $$('[data-size-shoe]').forEach(e => e.textContent = sizes.shoe);
      $$('[data-stat-orders]').forEach(e => e.textContent = '3');
      $$('[data-stat-spent]').forEach(e => e.textContent = '$64.97');
      $$('[data-stat-size]').forEach(e => e.textContent = sizes.tee);
    }

    $('[data-account-signup]')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = e.target.querySelector('input[type=text]').value.trim();
      const email = e.target.querySelector('input[type=email]').value.trim();
      if (!email) return;
      if (name) localStorage.setItem('sunpunks-name', name);
      localStorage.setItem('sunpunks-since', new Date().toISOString());
      localStorage.setItem('sunpunks-email', email);
      location.reload();
    });

    $('[data-edit-name]')?.addEventListener('click', () => {
      const current = localStorage.getItem('sunpunks-name') || '';
      const next = prompt('Shipping name', current);
      if (next === null) return;
      const trimmed = next.trim();
      if (trimmed) localStorage.setItem('sunpunks-name', trimmed);
      else localStorage.removeItem('sunpunks-name');
      location.reload();
    });

    $('[data-account-logout]')?.addEventListener('click', () => {
      if (!confirm('Log out and clear local Sun Punks data?')) return;
      ['sunpunks-since', 'sunpunks-email', 'sunpunks-name', 'sunpunks-sizes'].forEach(k => localStorage.removeItem(k));
      sessionStorage.removeItem('sunpunks-spin-result');
      sessionStorage.removeItem('sunpunks-email');
      location.reload();
    });

    $('[data-edit-sizes]')?.addEventListener('click', e => {
      e.preventDefault();
      const cur = JSON.parse(localStorage.getItem('sunpunks-sizes') || '{"tee":"M","bottom":"32","shoe":"10"}');
      const tee = prompt('Tee size (S/M/L/XL/2XL):', cur.tee) || cur.tee;
      const bottom = prompt('Bottoms size:', cur.bottom) || cur.bottom;
      const shoe = prompt('Shoe size:', cur.shoe) || cur.shoe;
      localStorage.setItem('sunpunks-sizes', JSON.stringify({ tee, bottom, shoe }));
      location.reload();
    });
  }

  // ---------- UGC featured repost (one big "as if seen on socials" post, rotates) ----------
  const ugcFeature = $('[data-ugc-feature]');
  if (ugcFeature) {
    const POSTS = [
      { h:'sandbar.salt',    c:'Best fit for the sunset run.',          bg:'linear-gradient(135deg,#e8552c,#c8441f)', label:'TEE',    likes:'247', comments:'18', shares:'9',  time:'2h',  tags:'#sunpunks #30a #beachpunks' },
      { h:'30a.dreamer',     c:'Wearing it literally everywhere.',      bg:'linear-gradient(135deg,#1f8a8f,#166b6f)', label:'KOOZIE', likes:'182', comments:'11', shares:'4',  time:'4h',  tags:'#sunpunks #graytonbeach #tribal' },
      { h:'gulfsidehang',    c:'Got the boys matching on the boat.',    bg:'linear-gradient(135deg,#f7d24c,#e8552c)', label:'CREW',   likes:'309', comments:'27', shares:'12', time:'6h',  tags:'#sunpunks #boysboys #30alove' },
      { h:'beachpunks',      c:'Wave check, suns out.',                 bg:'linear-gradient(135deg,#1b2a3a,#3a4b5e)', label:'WAVE',   likes:'412', comments:'33', shares:'18', time:'1d',  tags:'#sunpunks #surfclub #saltlife' },
      { h:'grayton.crew',    c:'Tribal koozie pulling double duty.',    bg:'linear-gradient(135deg,#e8552c,#f7d24c)', label:'CREW',   likes:'164', comments:'9',  shares:'3',  time:'1d',  tags:'#sunpunks #koozie #firstdrop' },
      { h:'santarosabum',    c:'Sun Punks summer ’26 is real.',         bg:'linear-gradient(135deg,#1f8a8f,#aab38a)', label:'SUMMER', likes:'298', comments:'21', shares:'7',  time:'2d',  tags:'#sunpunks #summer26 #santarosabeach' },
      { h:'theresnoinland',  c:'Tee + tote combo. Perfect Saturday.',   bg:'linear-gradient(135deg,#ead8b2,#1b2a3a)', label:'COMBO',  likes:'221', comments:'14', shares:'5',  time:'2d',  tags:'#sunpunks #ecotote #vintagetee' },
      { h:'doglovesdusk',    c:'Beach dog approved.',                   bg:'linear-gradient(135deg,#f4ead5,#e8552c)', label:'PUP',    likes:'577', comments:'62', shares:'24', time:'3d',  tags:'#sunpunks #beachdog #goldenhour' },
      { h:'sealevelmind',    c:'Salt water tested, salt water approved.', bg:'linear-gradient(135deg,#1f8a8f,#1b2a3a)', label:'SALT', likes:'195', comments:'8',  shares:'4',  time:'4d',  tags:'#sunpunks #saltlife #surfgear' },
      { h:'thirty.acoast',   c:'USA tee for the 4th. Stars and sunsets.', bg:'linear-gradient(135deg,#1b2a3a,#e8552c)', label:'USA',  likes:'401', comments:'29', shares:'15', time:'5d',  tags:'#sunpunks #usa #starsandsunsets' },
      { h:'sunbleachedsoul', c:'Vintage feel, faded just right.',       bg:'linear-gradient(135deg,#ead8b2,#aab38a)', label:'FADED',  likes:'267', comments:'19', shares:'6',  time:'1w',  tags:'#sunpunks #garmentdyed #vintagevibes' },
      { h:'ridethewavefl',   c:'Punk circle, sunset vibes.',            bg:'linear-gradient(135deg,#f7d24c,#1f8a8f)', label:'CIRCLE', likes:'333', comments:'24', shares:'10', time:'1w',  tags:'#sunpunks #punkcircle #floridalife' },
    ];

    const media     = $('[data-ugc-media]', ugcFeature);
    const label     = $('[data-ugc-label]', ugcFeature);
    const handle    = $('[data-ugc-handle]', ugcFeature);
    const time      = $('[data-ugc-time]', ugcFeature);
    const avatar    = $('[data-ugc-avatar]', ugcFeature);
    const caption   = $('[data-ugc-caption]', ugcFeature);
    const tags      = $('[data-ugc-tags]', ugcFeature);
    const likes     = $('[data-ugc-likes]', ugcFeature);
    const comments  = $('[data-ugc-comments]', ugcFeature);
    const shares    = $('[data-ugc-shares]', ugcFeature);
    const progress  = $('[data-ugc-progress]', ugcFeature);
    const followBtn = $('[data-ugc-follow]', ugcFeature);

    let idx = Math.floor(Math.random() * POSTS.length);

    const render = (p) => {
      // Fade media, then swap
      media.classList.add('is-changing');
      setTimeout(() => {
        media.style.background = p.bg;
        if (label) label.textContent = p.label;
        if (handle) handle.textContent = '@' + p.h;
        if (time) time.textContent = p.time;
        if (caption) caption.textContent = p.c;
        if (tags) tags.textContent = p.tags;
        if (likes) likes.textContent = p.likes;
        if (comments) comments.textContent = p.comments;
        if (shares) shares.textContent = p.shares;
        if (avatar) avatar.textContent = p.h[0].toUpperCase();
        if (followBtn) { followBtn.textContent = 'Follow'; followBtn.classList.remove('btn--primary'); followBtn.classList.add('btn--ghost'); }
        media.classList.remove('is-changing');
        // Restart progress
        if (progress) {
          progress.classList.remove('is-active');
          // Force reflow so the transition restarts
          void progress.offsetWidth;
          progress.classList.add('is-active');
        }
      }, 250);
    };

    const advance = () => {
      idx = (idx + 1) % POSTS.length;
      render(POSTS[idx]);
    };

    render(POSTS[idx]);
    let timer = setInterval(advance, 7000);

    $$('[data-ugc-next]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        clearInterval(timer);
        advance();
        timer = setInterval(advance, 7000);
      });
    });

    // Click the media to also advance
    media.addEventListener('click', () => {
      clearInterval(timer);
      advance();
      timer = setInterval(advance, 7000);
    });

    // Follow button toggles (cosmetic)
    if (followBtn) {
      followBtn.addEventListener('click', () => {
        const following = followBtn.textContent.trim() === 'Following';
        followBtn.textContent = following ? 'Follow' : 'Following';
        followBtn.classList.toggle('btn--primary', !following);
        followBtn.classList.toggle('btn--ghost', following);
        if (window.SunPunks?.toast) window.SunPunks.toast(following ? 'Unfollowed' : `Following @${POSTS[idx].h}`, following ? 'info' : 'success');
      });
    }
  }

  // ---------- Year stamp ----------
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  // ---------- Scroll-triggered animations ----------
  // Auto-distribute stagger delays inside any [data-anim-stagger] container.
  $$('[data-anim-stagger]').forEach(container => {
    const kids = Array.from(container.children);
    kids.forEach((kid, i) => {
      if (!kid.hasAttribute('data-anim')) kid.setAttribute('data-anim', '');
      kid.style.setProperty('--anim-delay', (i * 80) + 'ms');
    });
  });

  const animTargets = $$('[data-anim]');
  if (animTargets.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    animTargets.forEach(el => io.observe(el));
  } else {
    // No IO support → just reveal everything.
    animTargets.forEach(el => el.classList.add('is-visible'));
  }

  // ---------- Hero surf clip playlist ----------
  // Accepts either:
  //   data-playlist-urls="url1|url2|url3"          (Shopify Liquid renders asset_urls)
  //   data-playlist="id1,id2" data-playlist-path="assets/surf/"  (static preview)
  const heroVid = $('.hero-video[data-playlist-urls], .hero-video[data-playlist]');
  if (heroVid) {
    let order = [];
    if (heroVid.dataset.playlistUrls) {
      order = heroVid.dataset.playlistUrls.split('|').map(s => s.trim()).filter(Boolean);
    } else if (heroVid.dataset.playlist) {
      const ids = heroVid.dataset.playlist.split(',').map(s => s.trim()).filter(Boolean);
      const pathPrefix = heroVid.dataset.playlistPath || 'assets/';
      order = ids.map(id => `${pathPrefix}${id}.mp4`);
    }
    if (order.length === 0) return;   // no clips configured — leave the poster
    // Shuffle so the loop feels fresh each pageload, but keep stable within a session.
    order = order.slice().sort(() => Math.random() - 0.5);
    const srcOf = i => order[i % order.length];
    let idx = 0;

    const preload = src => {
      const v = document.createElement('video');
      v.preload = 'auto';
      v.src = src;
    };

    const playAt = i => {
      idx = ((i % order.length) + order.length) % order.length;
      heroVid.src = srcOf(idx);
      heroVid.load();
      heroVid.play().catch(() => { /* autoplay denied */ });
      preload(srcOf(idx + 1));
    };

    heroVid.addEventListener('ended', () => playAt(idx + 1));
    heroVid.addEventListener('error', () => playAt(idx + 1));
    playAt(0);
  }

  // ---------- Live cam clock (Grayton Beach · Central Time) ----------
  const clockEl = $('[data-live-clock]');
  if (clockEl) {
    const tick = () => {
      const t = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit', second: '2-digit',
        hour12: true, timeZone: 'America/Chicago'
      });
      clockEl.textContent = t.replace(/\s?(AM|PM)$/i, ' $1') + ' CT';
    };
    tick();
    setInterval(tick, 1000);
  }

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

  // ---------- PDP gallery + variant sync ----------
  $$('.product').forEach(productEl => {
    const dataEl = productEl.querySelector('[data-product-variants]');
    if (!dataEl) return;

    let variants;
    try { variants = JSON.parse(dataEl.textContent); } catch (e) { return; }

    const form      = productEl.querySelector('.product-form');
    const hiddenId  = form && form.querySelector('input[name="id"]');
    const atcButton = form && form.querySelector('button[type="submit"][name="add"]');
    const priceEl   = productEl.querySelector('.product__price .product-card__price');
    const heroImg   = productEl.querySelector('.product__hero img');
    const thumbs    = productEl.querySelectorAll('.product__thumbs button');

    const money = cents => '$' + (Number(cents) / 100).toFixed(2);

    function getSelected() {
      const opts = [];
      productEl.querySelectorAll('.option__choices').forEach(group => {
        const checked = group.querySelector('input[type=radio]:checked');
        if (checked) opts.push(checked.value);
      });
      return opts;
    }

    function getSelectedColor() {
      // Find which option is the Color and return its current value
      const groups = productEl.querySelectorAll('.option');
      for (const g of groups) {
        const label = g.querySelector('.option__label');
        if (label && /color/i.test(label.textContent)) {
          const checked = g.querySelector('input[type=radio]:checked');
          if (checked) return checked.value;
        }
      }
      return null;
    }

    function findVariant(opts) {
      return variants.find(v => {
        const vo = v.options || [];
        if (vo.length !== opts.length) return false;
        return vo.every((val, i) => val === opts[i]);
      });
    }

    function setHero(imageId, fallbackSrc) {
      if (!heroImg) return;
      const matchingThumb = productEl.querySelector('.product__thumbs button[data-image-id="' + imageId + '"]');
      if (matchingThumb && matchingThumb.dataset.heroSrc) {
        heroImg.src = matchingThumb.dataset.heroSrc;
      } else if (fallbackSrc) {
        try {
          const u = new URL(fallbackSrc);
          u.searchParams.set('width', '1200');
          heroImg.src = u.toString();
        } catch (e) { heroImg.src = fallbackSrc; }
      }
      heroImg.dataset.imageId = String(imageId);
      thumbs.forEach(t => t.setAttribute('aria-current', String(t.dataset.imageId) === String(imageId) ? 'true' : 'false'));
    }

    function filterGalleryByColor(color) {
      // Strict mode: show ONLY 3 thumbnails per color — front, back, folded.
      //   front  = the variant's featured_image (linked in Shopify Admin)
      //   back   = an image whose alt text contains the color AND "back"
      //   folded = an image whose alt text contains the color AND "fold"
      // Set the alt text in Shopify Admin → Products → [product] → Media.
      thumbs.forEach(t => { t.hidden = true; });
      if (!color) return;
      const colorLower = color.toLowerCase();

      // Front: the color's variant featured_image
      const variantForColor = variants.find(v => v.option1 === color);
      const frontId = variantForColor && variantForColor.featured_image && variantForColor.featured_image.id;
      if (frontId != null) {
        const frontThumb = productEl.querySelector('.product__thumbs button[data-image-id="' + frontId + '"]');
        if (frontThumb) frontThumb.hidden = false;
      }

      // Back & folded: first alt-text match wins
      let backShown = false, foldedShown = false;
      thumbs.forEach(t => {
        const alt = (t.dataset.imageAlt || '').toLowerCase();
        if (alt.indexOf(colorLower) === -1) return;
        if (!backShown && alt.indexOf('back') !== -1) {
          t.hidden = false; backShown = true; return;
        }
        if (!foldedShown && (alt.indexOf('fold') !== -1 || alt.indexOf('flat') !== -1)) {
          t.hidden = false; foldedShown = true; return;
        }
      });
    }

    // Thumbnail clicks swap the hero without changing the variant.
    thumbs.forEach(t => t.addEventListener('click', (e) => {
      e.preventDefault();
      setHero(t.dataset.imageId, t.dataset.heroSrc);
    }));

    function update() {
      const v = findVariant(getSelected());
      if (!v) {
        if (atcButton) { atcButton.disabled = true; atcButton.innerHTML = 'Unavailable'; }
        return;
      }
      if (hiddenId) hiddenId.value = v.id;
      if (priceEl) {
        if (v.compare_at_price && v.compare_at_price > v.price) {
          priceEl.innerHTML = '<span class="price--sale">' + money(v.price) + '</span> ' +
                              '<s class="price--was muted">' + money(v.compare_at_price) + '</s>';
        } else {
          priceEl.innerHTML = money(v.price);
        }
      }
      if (atcButton) {
        atcButton.disabled = !v.available;
        atcButton.innerHTML = v.available ? 'Add to cart · ' + money(v.price) : 'Sold out';
      }
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location);
        url.searchParams.set('variant', v.id);
        window.history.replaceState({}, '', url);
      }
      filterGalleryByColor(getSelectedColor());
      if (v.featured_image) {
        setHero(v.featured_image.id, v.featured_image.src);
      }
    }

    productEl.querySelectorAll('.option__choices input[type=radio]').forEach(radio => {
      radio.addEventListener('change', update);
    });
    update();
  });
})();
