(() => {
  const isPreview = new URLSearchParams(location.search).get('admin-preview') === '1';
  const DEFAULT = {
    premiumExperience: { enabled: true, microInteractions: true, cinematicHero: true, offerClimax: true },
    analytics: { enabled: true }
  };

  let config = DEFAULT;
  let observer = null;

  function merge(raw = {}) {
    return {
      ...DEFAULT,
      ...raw,
      premiumExperience: { ...DEFAULT.premiumExperience, ...(raw.premiumExperience || {}) },
      analytics: { ...DEFAULT.analytics, ...(raw.analytics || {}) }
    };
  }

  function growthFrom(data = window.__SITE_CONTENT__ || {}) {
    return merge(data?.site?.growth || {});
  }

  function addResourceHints() {
    const hints = [
      ['preconnect', 'https://pay.kiwify.com.br'],
      ['dns-prefetch', 'https://pay.kiwify.com.br']
    ];
    hints.forEach(([rel, href]) => {
      if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      if (rel === 'preconnect') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  function optimizeMedia() {
    const hero = document.querySelector('section[data-edit-id="section-001"]');
    const heroImages = hero ? [...hero.querySelectorAll('img')] : [];
    heroImages.forEach((img, index) => {
      img.decoding = 'async';
      if (index === 0) {
        img.loading = 'eager';
        img.setAttribute('fetchpriority', 'high');
      } else if (!img.hasAttribute('loading')) img.loading = 'lazy';
    });

    document.querySelectorAll('img').forEach(img => {
      img.decoding = 'async';
      if (!hero?.contains(img) && !img.hasAttribute('loading')) img.loading = 'lazy';
    });
    document.querySelectorAll('iframe').forEach(frame => { if (!frame.hasAttribute('loading')) frame.loading = 'lazy'; });
    document.querySelectorAll('video').forEach(video => {
      if (!hero?.contains(video) && !video.hasAttribute('preload')) video.preload = 'metadata';
      video.setAttribute('playsinline', '');
    });
  }

  function ensureHeroSignature() {
    const hero = document.querySelector('section[data-edit-id="section-001"]');
    if (!hero || hero.querySelector('.ly-hero-signature')) return;
    const mark = document.createElement('div');
    mark.className = 'ly-hero-signature';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = '<span></span><span></span>';
    hero.prepend(mark);
  }

  function bindPointerLight(el) {
    if (!el || el.dataset.lyPointerLight === '1') return;
    el.dataset.lyPointerLight = '1';
    el.addEventListener('pointermove', event => {
      if (!window.matchMedia('(hover:hover)').matches) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--ly-x', `${event.clientX - rect.left}px`);
      el.style.setProperty('--ly-y', `${event.clientY - rect.top}px`);
    }, { passive: true });
  }

  function decorateInteractions() {
    const selectors = [
      'a[data-edit-id="a-001"]',
      'a[data-edit-id="a-002"]',
      'section[data-edit-id="section-005"] article',
      'section[data-edit-id="section-006"] article',
      'section[data-edit-id="section-008"] article',
      'section[data-edit-id="section-010"] button'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(el => {
      el.classList.add('ly-interactive');
      if (!/^(A|BUTTON)$/.test(el.tagName)) el.classList.add('ly-lift');
      bindPointerLight(el);
    });
  }

  function setupReveal() {
    observer?.disconnect();
    const sections = [...document.querySelectorAll('main > section[data-edit-id]')].filter(section => section.dataset.editId !== 'section-001');
    sections.forEach(section => section.classList.add('ly-scroll-reveal'));
    const offer = document.querySelector('[data-edit-id="div-049"]');

    if (!('IntersectionObserver' in window)) {
      sections.forEach(section => section.classList.add('ly-inview'));
      offer?.classList.add('ly-offer-in-view');
      return;
    }

    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('ly-inview');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    sections.forEach(section => observer.observe(section));

    if (offer) {
      const offerObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          offer.classList.toggle('ly-offer-in-view', entry.isIntersecting);
        });
      }, { threshold: .32 });
      offerObserver.observe(offer);
    }
  }

  function apply(data = window.__SITE_CONTENT__ || {}) {
    config = growthFrom(data);
    const enabled = config.premiumExperience.enabled !== false;
    document.documentElement.classList.toggle('ly-premium-enabled', enabled);
    if (!enabled) return config;
    addResourceHints();
    optimizeMedia();
    if (config.premiumExperience.cinematicHero !== false) ensureHeroSignature();
    if (config.premiumExperience.microInteractions !== false) decorateInteractions();
    setupReveal();
    return config;
  }

  window.LyzandraPremiumExperience = { apply, getConfig: () => JSON.parse(JSON.stringify(config)) };
  document.addEventListener('DOMContentLoaded', () => apply(), { once: true });
  ['site-content-ready', 'site-render-ready', 'conversion-rendered'].forEach(name => {
    window.addEventListener(name, event => requestAnimationFrame(() => apply(event.detail || window.__SITE_CONTENT__ || {})));
  });

  if (!isPreview) {
    const mo = new MutationObserver(mutations => {
      if (!mutations.some(m => m.addedNodes.length)) return;
      optimizeMedia();
      decorateInteractions();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 7000);
  }
})();
