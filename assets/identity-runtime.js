(() => {
  const DEFAULT_IDENTITY = {
    logo: { src: '', visible: true, width: 170, position: 'center', href: '' },
    footerLogo: { src: '', useMain: true, visible: true, width: 120, position: 'center', href: '' },
    favicon: ''
  };

  const mergeIdentity = value => ({
    ...DEFAULT_IDENTITY,
    ...(value || {}),
    logo: { ...DEFAULT_IDENTITY.logo, ...((value && value.logo) || {}) },
    footerLogo: { ...DEFAULT_IDENTITY.footerLogo, ...((value && value.footerLogo) || {}) }
  });

  function ensureRuntime(selector, src, datasetKey) {
    if (document.querySelector(selector)) return;
    const script = document.createElement('script');
    script.src = src;
    script.dataset[datasetKey] = '1';
    document.head.appendChild(script);
  }

  function ensureTestimonialsRuntime() {
    ensureRuntime('script[data-testimonials-runtime]', '/assets/testimonials-runtime.js?v=3', 'testimonialsRuntime');
  }

  function ensureMarketingRuntime() {
    ensureRuntime('script[data-marketing-runtime]', '/assets/marketing-runtime.js?v=2', 'marketingRuntime');
  }

  function ensureCertificatesRuntime() {
    ensureRuntime('script[data-certificates-runtime]', '/assets/certificates-runtime.js?v=2', 'certificatesRuntime');
  }

  function ensureSeoRuntime() {
    ensureRuntime('script[data-seo-runtime]', '/assets/seo-runtime.js?v=1', 'seoRuntime');
  }

  function justify(position) {
    if (position === 'left') return 'flex-start';
    if (position === 'right') return 'flex-end';
    return 'center';
  }

  function makeLogo(cfg, role) {
    if (!cfg || cfg.visible === false || !cfg.src) return null;
    const wrapper = document.createElement(cfg.href ? 'a' : 'div');
    wrapper.dataset.siteIdentityGenerated = role;
    wrapper.style.cssText = `width:100%;display:flex;justify-content:${justify(cfg.position)};align-items:center;max-width:100%;${role === 'main-logo' ? 'margin:0 0 24px;' : 'margin:0 0 6px;'}`;
    if (cfg.href) {
      wrapper.href = cfg.href;
      if (/^https?:\/\//i.test(cfg.href)) {
        wrapper.target = '_blank';
        wrapper.rel = 'noopener';
      }
    }
    const image = document.createElement('img');
    image.src = cfg.src;
    image.alt = 'Logo';
    image.style.cssText = `display:block;width:${Math.max(50, Math.min(420, Number(cfg.width) || 160))}px;max-width:100%;height:auto;object-fit:contain;`;
    wrapper.appendChild(image);
    return wrapper;
  }

  function applyIdentity(data) {
    const identity = mergeIdentity(data?.site?.identity);
    document.querySelectorAll('[data-site-identity-generated]').forEach(el => el.remove());

    const mainHost = document.querySelector('section[data-edit-id="section-001"] .mx-auto.flex.max-w-3xl') ||
      document.querySelector('section[data-edit-id="section-001"] > div');
    const mainLogo = makeLogo(identity.logo, 'main-logo');
    if (mainHost && mainLogo) mainHost.insertBefore(mainLogo, mainHost.firstChild);

    const footerHost = document.querySelector('footer[data-edit-id="footer-001"] > div') || document.querySelector('footer > div');
    const footerCfg = identity.footerLogo.useMain
      ? { ...identity.logo, visible: identity.footerLogo.visible, width: identity.footerLogo.width, position: identity.footerLogo.position, href: identity.footerLogo.href || identity.logo.href }
      : identity.footerLogo;
    const footerLogo = makeLogo(footerCfg, 'footer-logo');
    if (footerHost && footerLogo) footerHost.insertBefore(footerLogo, footerHost.firstChild);

    if (identity.favicon) {
      const icon = document.createElement('link');
      icon.rel = 'icon';
      icon.href = identity.favicon;
      icon.dataset.siteIdentityGenerated = 'favicon';
      document.head.appendChild(icon);
    }
  }

  ensureSeoRuntime();
  ensureTestimonialsRuntime();
  ensureMarketingRuntime();
  ensureCertificatesRuntime();
  window.addEventListener('site-content-ready', event => applyIdentity(event.detail || window.__SITE_CONTENT__ || {}));
  if (window.__SITE_CONTENT__) applyIdentity(window.__SITE_CONTENT__);
})();
