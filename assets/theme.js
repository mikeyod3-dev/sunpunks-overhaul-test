/* Sun Punks — theme.js
   Minimal vanilla helpers: cart drawer, mobile nav, qty stepper, year stamp,
   thumbnail switch on PDP. Designed to translate 1:1 into a Shopify theme
   (replace fetch endpoints with /cart/add.js, /cart/update.js, etc.).
*/
(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

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

    // Prize table — weights sum to 100, so HACKY SACK is exactly 1/100.
    // centerDeg = angle (in conic-gradient terms, 0=top, clockwise) of that segment's center.
    const PRIZES = [
      { id: 'HACKY',  label: 'FREE HACKY SACK', code: 'HACKYPUNK',  centerDeg: 330, weight: 1,
        title: 'YOU JUST WON A HACKY SACK!',
        banner: '1 in 100 · You did it', cta: 'Add to your next order' },
      { id: 'OFF15',  label: '15% off',         code: 'PUNKS15',    centerDeg: 30,  weight: 15,
        title: '15% off your order',
        banner: 'Nice spin', cta: 'Shop the drop' },
      { id: 'OFF10',  label: '10% off',         code: 'PUNKS10',    centerDeg: 270, weight: 25,
        title: '10% off your order',
        banner: 'Solid', cta: 'Shop the drop' },
      { id: 'STICK',  label: 'Free sticker pack', code: 'STICKER',  centerDeg: 90,  weight: 20,
        title: 'Free sticker pack',
        banner: 'Pack it up', cta: 'Add to your next order' },
      { id: 'SHIP',   label: 'Free shipping',   code: 'SHIPFREE',   centerDeg: 150, weight: 10,
        title: 'Free shipping',
        banner: 'Ships clean', cta: 'Use your code' },
      { id: 'AGAIN',  label: 'Try again next drop', code: null,     centerDeg: 210, weight: 29,
        title: 'Almost.',
        banner: 'Maybe next drop', cta: 'Keep shopping' },
    ];

    const pickPrize = () => {
      const roll = Math.random() * 100;
      let cum = 0;
      for (const p of PRIZES) {
        cum += p.weight;
        if (roll < cum) return p;
      }
      return PRIZES[PRIZES.length - 1];
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
        : `Sign up sticks — we'll DM you when the next drop lands.`;
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
      const email = $('#spinEmail').value.trim();
      if (!email) return;
      sessionStorage.setItem(EMAIL_KEY, email);
      // Also stamp account creation if not set (consumed by account page)
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
      const turns = 5 + Math.floor(Math.random() * 3);   // 5–7 full rotations
      const jitter = (Math.random() - 0.5) * 30;          // ±15° within the segment
      const target = turns * 360 - prize.centerDeg + jitter;
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

      const nameFromEmail = (email.split('@')[0] || 'punk').replace(/[.\-_]+/g, ' ');
      $$('[data-account-name]').forEach(e => e.textContent = nameFromEmail);
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
      const email = e.target.querySelector('input[type=email]').value.trim();
      if (!email) return;
      localStorage.setItem('sunpunks-since', new Date().toISOString());
      localStorage.setItem('sunpunks-email', email);
      location.reload();
    });

    $('[data-account-logout]')?.addEventListener('click', () => {
      if (!confirm('Log out and clear local Sun Punks data?')) return;
      ['sunpunks-since', 'sunpunks-email', 'sunpunks-sizes'].forEach(k => localStorage.removeItem(k));
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

  // ---------- Hero surf clip playlist (cycles through assets/surf/*.mp4) ----------
  const heroVid = $('.hero-video[data-playlist]');
  if (heroVid) {
    const ids = heroVid.dataset.playlist.split(',').map(s => s.trim()).filter(Boolean);
    // Shuffle so the loop feels fresh each pageload, but keep stable inside one session.
    const order = ids.slice().sort(() => Math.random() - 0.5);
    const srcOf = i => `assets/surf/${order[i % order.length]}.mp4`;
    let idx = 0;

    const preload = src => {
      // Hint the browser to start fetching the next clip.
      const v = document.createElement('video');
      v.preload = 'auto';
      v.src = src;
    };

    const playAt = i => {
      idx = i % order.length;
      heroVid.src = srcOf(idx);
      heroVid.load();
      heroVid.play().catch(() => { /* autoplay denied; user can interact */ });
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
