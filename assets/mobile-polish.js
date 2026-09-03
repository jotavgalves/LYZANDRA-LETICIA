(() => {
  const isMobile = () => window.matchMedia('(max-width: 640px)').matches;
  let mobileStickyEnabled = false;

  const playSvg = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8.25 5.7c0-1.12 1.22-1.82 2.19-1.25l8.1 4.76a1.46 1.46 0 0 1 0 2.52l-8.1 4.76a1.46 1.46 0 0 1-2.19-1.25V5.7Z" fill="currentColor" stroke="none"/>
    </svg>`;

  const whatsappSvg = `
    <svg data-whatsapp-brand-svg="true" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path fill="currentColor" fill-rule="evenodd" d="M16 3.2A12.77 12.77 0 0 0 5.02 22.48L3.2 28.8l6.5-1.7A12.8 12.8 0 1 0 16 3.2Zm0 23.28a10.5 10.5 0 0 1-5.35-1.47l-.38-.23-3.86 1.01 1.03-3.76-.25-.39A10.49 10.49 0 1 1 16 26.48Zm5.76-7.87c-.31-.16-1.86-.92-2.15-1.03-.29-.1-.5-.16-.71.16-.21.31-.81 1.03-1 1.24-.18.21-.37.24-.68.08-.32-.16-1.33-.49-2.53-1.57-.93-.83-1.57-1.86-1.75-2.17-.18-.32-.02-.49.14-.64.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.11-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.61-.52-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.32-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.23 3.4 5.4 4.77.75.32 1.34.52 1.8.66.76.24 1.44.21 1.99.13.61-.09 1.86-.76 2.12-1.5.26-.73.26-1.36.18-1.49-.08-.13-.29-.21-.61-.37Z"/>
    </svg>`;

  function resolveMobileStickyEnabled(data = window.__SITE_CONTENT__) {
    mobileStickyEnabled = data?.site?.mobileStickyCtaEnabled === true;
    document.documentElement.dataset.mobileStickyCta = mobileStickyEnabled ? 'on' : 'off';
    return mobileStickyEnabled;
  }

  function replaceRuntimePlayGlyphs(root = document) {
    root.querySelectorAll('.site-video-player button').forEach(button => {
      const spans = button.querySelectorAll(':scope > span');
      const control = spans[spans.length - 1];
      if (!control || control.dataset.sitePlayIcon === 'true') return;
      const text = (control.textContent || '').trim();
      if (text === '▶' || text === '▶️' || text === '►') {
        control.dataset.sitePlayIcon = 'true';
        control.textContent = '';
        control.innerHTML = playSvg;
      }
    });
  }

  function normalizeStaticPlayButtons(root = document) {
    ['span-004', 'span-026'].forEach(id => {
      const control = root.querySelector(`[data-edit-id="${id}"]`);
      if (!control) return;
      const svg = control.querySelector('svg');
      if (svg) {
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.innerHTML = '<path d="M8.25 5.7c0-1.12 1.22-1.82 2.19-1.25l8.1 4.76a1.46 1.46 0 0 1 0 2.52l-8.1 4.76a1.46 1.46 0 0 1-2.19-1.25V5.7Z" fill="currentColor" stroke="none"/>';
      }
    });
  }

  function upgradeWhatsApp(root = document) {
    const anchor = root.querySelector('a[data-edit-id="a-006"]');
    if (!anchor) return;
    anchor.setAttribute('aria-label', 'Falar pelo WhatsApp');
    anchor.title = 'Falar pelo WhatsApp';
    anchor.querySelectorAll(':scope > svg').forEach(svg => svg.dataset.whatsappReplaced = 'true');
    let icon = anchor.querySelector('[data-whatsapp-brand-icon]');
    if (!icon) {
      icon = document.createElement('span');
      icon.dataset.whatsappBrandIcon = 'true';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = whatsappSvg;
      anchor.prepend(icon);
    }
  }

  let scrollBound = false;
  function setupMobileStickyCta() {
    const wrap = document.querySelector('#conversionStickyCta');
    if (!wrap) {
      document.documentElement.classList.remove('mobile-sticky-active');
      return;
    }

    if (!isMobile() || !mobileStickyEnabled) {
      wrap.classList.remove('mobile-cta-ready', 'mobile-cta-visible');
      wrap.style.display = 'none';
      document.documentElement.classList.remove('mobile-sticky-active');
      return;
    }

    wrap.style.removeProperty('display');
    wrap.classList.add('mobile-cta-ready');
    const update = () => {
      if (!isMobile() || !mobileStickyEnabled) {
        wrap.classList.remove('mobile-cta-ready', 'mobile-cta-visible');
        wrap.style.display = 'none';
        document.documentElement.classList.remove('mobile-sticky-active');
        return;
      }
      const hero = document.querySelector('#inicio');
      const heroTop = hero ? hero.getBoundingClientRect().top + window.scrollY : 0;
      const threshold = heroTop + Math.min(360, Math.max(240, window.innerHeight * 0.38));
      const visible = window.scrollY > threshold;
      wrap.classList.toggle('mobile-cta-visible', visible);
      document.documentElement.classList.toggle('mobile-sticky-active', visible);
    };
    update();

    if (!scrollBound) {
      scrollBound = true;
      let ticking = false;
      const requestUpdate = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
          setupMobileStickyCta();
        });
      };
      window.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate, { passive: true });
      window.addEventListener('orientationchange', requestUpdate, { passive: true });
    }
  }

  function applyPolish(data) {
    if (data) resolveMobileStickyEnabled(data);
    else if (!document.documentElement.dataset.mobileStickyCta) resolveMobileStickyEnabled();
    normalizeStaticPlayButtons(document);
    replaceRuntimePlayGlyphs(document);
    upgradeWhatsApp(document);
    setupMobileStickyCta();
  }

  function setMobileStickyEnabled(value) {
    mobileStickyEnabled = value === true;
    document.documentElement.dataset.mobileStickyCta = mobileStickyEnabled ? 'on' : 'off';
    setupMobileStickyCta();
  }

  resolveMobileStickyEnabled();
  window.LyzandraMobilePolish = { applyPolish, setMobileStickyEnabled, setupMobileStickyCta };

  document.addEventListener('DOMContentLoaded', () => applyPolish(), { once: true });
  window.addEventListener('site-content-ready', event => requestAnimationFrame(() => applyPolish(event.detail || window.__SITE_CONTENT__ || {})));
  window.addEventListener('conversion-rendered', () => requestAnimationFrame(() => applyPolish()));

  const observer = new MutationObserver(mutations => {
    if (!mutations.some(mutation => mutation.addedNodes.length)) return;
    replaceRuntimePlayGlyphs(document);
    upgradeWhatsApp(document);
    setupMobileStickyCta();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 6000);
})();
