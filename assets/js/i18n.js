(
    async () => {
  /* ── Web app base URL ── */
  const APP_URL          = 'https://ashy-dune-098494d0f.7.azurestaticapps.net';
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

  /* ── Helpers ── */
  const get = (obj, path) =>
    path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);

  /* ── Apply translations to static elements ── */
  function applyTranslations(lang) {
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
        <a href="${planUrl}" class="btn-plan ${i === featuredIdx ? 'btn-plan-primary' : 'btn-plan-outline'}">${d.btn_hire}</a>
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

  /* ── Language switcher ── */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      localStorage.setItem('sr-lang', lang);
      applyTranslations(lang);
    });
  });

  /* ── Init ── */
  const savedLang = localStorage.getItem('sr-lang') || 'en';
  applyTranslations(savedLang);

  

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


})

