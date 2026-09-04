(() => {
  const DEFAULT = { target: '#oferta-card', offset: 24, smooth: true };
  let config = { ...DEFAULT };

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    const targetRaw = String(raw.target || DEFAULT.target).trim();
    const target = /^(https?:|mailto:|tel:|#)/i.test(targetRaw)
      ? targetRaw
      : `#${targetRaw.replace(/^#/, '')}`;
    return {
      target: target || DEFAULT.target,
      offset: Math.max(0, Math.min(300, Number(raw.offset ?? DEFAULT.offset) || 0)),
      smooth: raw.smooth !== false
    };
  }

  function getSettings(data) {
    return normalize(data?.site?.primaryCta || window.__SITE_CONTENT__?.site?.primaryCta || {});
  }

  function ensureOfferCard(settings) {
    const card = document.querySelector('[data-edit-id="div-049"]');
    if (!card) return null;
    card.id = 'oferta-card';
    card.dataset.offerAnchor = '1';
    card.style.scrollMarginTop = `${settings.offset}px`;
    return card;
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
      try { history.replaceState(null, '', target); } catch {}
    });
  }

  function apply(data = window.__SITE_CONTENT__ || {}) {
    config = getSettings(data);
    ensureOfferCard(config);
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
