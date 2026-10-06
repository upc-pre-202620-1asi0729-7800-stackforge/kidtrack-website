(
    async () => {
  /* ── Web app base URL ── */
  const APP_URL          = 'https://salmon-bush-078a34410.3.azurestaticapps.net';
  const SIGNIN_URL       = `${APP_URL}/identity-and-access-management/sign-in`;
  const SIGNUP_ADMIN_URL = `${APP_URL}/identity-and-access-management/sign-up`;

  /* ── 1. Load translations ── */
  let translations = {};
  try {
    const res = await fetch('assets/i18n/translations.json');
    translations = await res.json();
  } catch (e) {
    console.error('Could not load translations.json', e);
    return;
  }

  let currentLang = 'en';

  /* ── Helpers ── */
  const get = (obj, path) =>
    path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);

  /* ── Render dynamic lists ── */
  function renderFeatures(lang) {
    const cards = translations[lang].features.cards;
    document.getElementById('features-grid').innerHTML = cards.map(c => `
      <div class="feature-card">
        <div class="feature-icon">${c.icon}</div>
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
      </div>`).join('');
  }

  function renderRoles(lang) {
    const cards = translations[lang].roles.cards;
    document.getElementById('roles-grid').innerHTML = cards.map(c => `
      <div class="role-card">
        <div class="role-emoji">${c.emoji}</div>
        <h3>${c.title}</h3>
        <ul>${c.items.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>`).join('');
  }

  function renderPlans(lang) {
    const d = translations[lang].plans;
    const featuredIdx  = 1;
    const planKeys     = ['BASIC', 'INTERMEDIATE', 'COMPLETE'];
    document.getElementById('plans-grid').innerHTML = d.cards.map((c, i) => {
      const planUrl = `${SIGNUP_ADMIN_URL}?planTier=${planKeys[i]}&planName=${encodeURIComponent(c.name)}&planPrice=${encodeURIComponent(c.price)}`;
      return `
      <div class="plan-card ${i === featuredIdx ? 'featured' : ''}">
        ${i === featuredIdx ? `<div class="plan-badge">${d.badge_popular}</div>` : ''}
        <div class="plan-name">${c.emoji} ${c.name}</div>
        <div class="plan-price">${c.price} <span>${c.period}</span></div>
        <div class="plan-desc">${c.desc}</div>
        <ul class="plan-features">
          ${c.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <a href="${planUrl}" data-plan-index="${i}" class="btn-plan ${i === featuredIdx ? 'btn-plan-primary' : 'btn-plan-outline'}">${d.btn_hire}</a>
      </div>`;
    }).join('');
  }

  function renderSteps(lang) {
    const steps = translations[lang].how.steps;
    document.getElementById('steps-list').innerHTML = steps.map((s, i) => `
      <div class="step">
        <div class="step-num">${i + 1}</div>
        <div class="step-content"><h4>${s.title}</h4><p>${s.desc}</p></div>
      </div>`).join('');
  }

  /* ── Apply translations to static elements ── */
  function applyTranslations(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.title = lang === 'es'
      ? 'KidTrack — Transporte Escolar Seguro'
      : 'KidTrack — Safe School Transportation';

    /* text content */
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = get(translations[lang], key);
      if (val !== undefined) el.textContent = val;
    });

    /* innerHTML (for tags like <strong>) */
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = get(translations[lang], key);
      if (val !== undefined) el.innerHTML = val;
    });

    /* dynamic sections */
    renderFeatures(lang);
    renderRoles(lang);
    renderPlans(lang);
    renderSteps(lang);

    /* update button states */
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    /* ── CTA links → web app ── */
    const set = (id, url) => { const el = document.getElementById(id); if (el) el.href = url; };
    set('nav-cta-link',    SIGNIN_URL);
    set('cta-hire-link',   SIGNUP_ADMIN_URL);
    set('cta-signin-link', SIGNIN_URL);
  }

  /* ── Payment simulation (demo: no card data leaves the page) ── */
  const PLAN_KEYS = ['BASIC', 'INTERMEDIATE', 'COMPLETE'];
  const modal     = document.getElementById('pay-modal');
  const payForm   = document.getElementById('pay-form');
  const payStatus = document.getElementById('pay-status');
  const field     = id => document.getElementById(`pay-${id}`);
  let selected      = null;   // { tier, name, price }
  let redirectTimer = null;

  const pt = key => get(translations[currentLang], `payment.${key}`) || '';

  function openPayment(index) {
    const c = translations[currentLang].plans.cards[index];
    selected = { tier: PLAN_KEYS[index], name: c.name, price: c.price };
    document.getElementById('pay-plan-name').textContent  = `${c.emoji} ${c.name}`;
    document.getElementById('pay-plan-price').textContent = `${c.price} ${pt('per_month')}`;
    document.getElementById('pay-submit').textContent     = `${pt('pay')} ${c.price}`;
    payForm.hidden = false;
    payStatus.hidden = true;
    payForm.querySelectorAll('.pay-err').forEach(e => (e.textContent = ''));
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    field('holder').focus();
  }

  function closePayment() {
    clearTimeout(redirectTimer);
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function validate() {
    const errs = {};
    const digits = field('number').value.replace(/\s/g, '');
    const m = field('expiry').value.match(/^(\d{2})\/(\d{2})$/);
    if (!field('holder').value.trim()) errs.holder = pt('err_name');
    if (!/^\d{16}$/.test(digits)) errs.number = pt('err_number');
    if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1], 1) <= new Date()) errs.expiry = pt('err_expiry');
    if (!/^\d{3}$/.test(field('cvv').value)) errs.cvv = pt('err_cvv');
    payForm.querySelectorAll('.pay-err').forEach(e => (e.textContent = errs[e.dataset.for] || ''));
    return Object.keys(errs).length === 0;
  }

  function showStatus(done) {
    payForm.hidden = true;
    payStatus.hidden = false;
    document.getElementById('pay-spinner').hidden = done;
    document.getElementById('pay-check').hidden   = !done;
    document.getElementById('pay-status-title').textContent = done ? pt('success_title') : pt('processing');
    document.getElementById('pay-status-desc').textContent  = done ? pt('success_desc') : '';
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-plan-index]');
    if (btn) { e.preventDefault(); openPayment(+btn.dataset.planIndex); }
  });
  document.getElementById('pay-close').addEventListener('click', closePayment);
  modal.addEventListener('click', e => { if (e.target === modal) closePayment(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closePayment(); });

  field('number').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  });
  field('expiry').addEventListener('input', e => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  });
  field('cvv').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); });

  payForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate() || !selected) return;
    showStatus(false);
    setTimeout(() => {
      showStatus(true);
      const url = `${SIGNUP_ADMIN_URL}?planTier=${selected.tier}` +
        `&planName=${encodeURIComponent(selected.name)}` +
        `&planPrice=${encodeURIComponent(selected.price)}&paid=simulated`;
      redirectTimer = setTimeout(() => { window.location.href = url; }, 1800);
    }, 1800);
  });

  /* ── Language switcher ── */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      localStorage.setItem('sr-lang', lang);
      applyTranslations(lang);
    });
  });


    /* ── About videos: data-yt is the single source of truth.
        Fills the thumbnail, then swaps in the YouTube player on click. ── */
  document.querySelectorAll('.about-frame').forEach(frame => {
    const id = frame.dataset.yt;
    const ready = id && !id.startsWith('VIDEO_ID'); // false while still a placeholder
    const thumb = frame.querySelector('.about-thumb');

    if (ready && thumb) thumb.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

    frame.addEventListener('click', () => {
      if (!ready) return;
      frame.innerHTML =
        `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0"
                 title="KidTrack video" allowfullscreen
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
    });
  });

  /* ── Init ── */
  const savedLang = localStorage.getItem('sr-lang') || 'en';
  applyTranslations(savedLang);
})
();