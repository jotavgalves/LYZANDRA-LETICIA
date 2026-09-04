(() => {
  const DEFAULT = { target: '#planos', offset: 24, smooth: true, destinationVersion: 2 };
  let config = { ...DEFAULT };

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    let targetRaw = String(raw.target || DEFAULT.target).trim();

    // Migração do comportamento antigo: antes o CTA caía direto no card de preço.
    // A partir da v2 o padrão é mostrar também título e contexto da oferta.
    if (Number(raw.destinationVersion || 0) < 2 && /^#?oferta-card$/i.test(targetRaw)) {
      targetRaw = '#planos';
    }

    const target = /^(https?:|mailto:|tel:|#)/i.test(targetRaw)
      ? targetRaw
      : `#${targetRaw.replace(/^#/, '')}`;
    return {
      target: target || DEFAULT.target,
      offset: Math.max(0, Math.min(300, Number(raw.offset ?? DEFAULT.offset) || 0)),
      smooth: raw.smooth !== false,
      destinationVersion: 2
    };
  }

  function getSettings(data) {
    return normalize(data?.site?.primaryCta || window.__SITE_CONTENT__?.site?.primaryCta || {});
  }

  function cleanAddress() {
    try {
      history.replaceState(history.state, '', `${location.pathname}${location.search}`);
    } catch {}
  }

  function ensureOfferTargets(settings) {
    const section = document.querySelector('section[data-edit-id="section-009"]');
    if (section) {
      section.id = 'planos';
      section.dataset.offerSectionAnchor = '1';
      section.style.scrollMarginTop = `${settings.offset}px`;
    }

    const card = document.querySelector('[data-edit-id="div-049"]');
    if (card) {
      card.id = 'oferta-card';
      card.dataset.offerAnchor = '1';
      card.style.scrollMarginTop = `${settings.offset}px`;
    }

    return { section, card };
  }

  function internalSelector(target) {
    if (!String(target || '').startsWith('#')) return '';
    try { return target; } catch { return ''; }
  }

  function bindPrimaryButton(settings) {
    const button = document.querySelector('[data-edit-id="a-001"]');
    if (!button) return;
    button.href = settings.target;
    button.dataset.primaryCtaTarget = settings.target;
    if (button.dataset.offerAnchorBound === '1') return;
    button.dataset.offerAnchorBound = '1';
    button.addEventListener('click', event => {
      const target = button.dataset.primaryCtaTarget || DEFAULT.target;
      const selector = internalSelector(target);
      if (!selector) return;
      let destination = null;
      try { destination = document.querySelector(selector); } catch {}
      if (!destination) return;
      event.preventDefault();
      destination.scrollIntoView({ behavior: config.smooth ? 'smooth' : 'auto', block: 'start' });
      cleanAddress();
    });
  }

  function apply(data = window.__SITE_CONTENT__ || {}) {
    config = getSettings(data);
    ensureOfferTargets(config);
    bindPrimaryButton(config);
    return { ...config };
  }

  async function boot() {
    let data = window.__SITE_CONTENT__ || null;
    if (!data) {
      try {
        const response = await fetch('/api/content', { cache: 'no-store' });
        if (response.ok) data = await response.json();
      } catch {}
    }
    apply(data || {});
  }

  window.LyzandraOfferAnchor = {
    apply,
    getConfig: () => ({ ...config })
  };

  ['site-content-ready', 'site-render-ready', 'conversion-rendered'].forEach(name => {
    window.addEventListener(name, () => setTimeout(() => apply(window.__SITE_CONTENT__ || {}), 0));
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
