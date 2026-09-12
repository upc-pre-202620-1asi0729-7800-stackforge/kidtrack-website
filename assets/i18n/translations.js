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
})

