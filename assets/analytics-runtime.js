(() => {
  if (new URLSearchParams(location.search).get('admin-preview') === '1') return;

  const SESSION_KEY = 'ly_funnel_session_v1';
  const ATTR_KEY = 'ly_attribution_v1';
  const sent = new Set();
  let enabled = true;

  function id() {
    try {
      let value = localStorage.getItem(SESSION_KEY);
      if (!/^[a-zA-Z0-9_-]{8,64}$/.test(value || '')) {
        value = (crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0,64);
        localStorage.setItem(SESSION_KEY, value);
      }
      return value;
    } catch {
      return `s${Date.now()}${Math.random().toString(36).slice(2,10)}`;
    }
  }

  function attribution() {
    const params = new URLSearchParams(location.search);
    const incoming = {
      source: params.get('src') || params.get('utm_source') || '',
      campaign: params.get('utm_campaign') || params.get('sck') || ''
    };
    if (incoming.source || incoming.campaign) {
      try { localStorage.setItem(ATTR_KEY, JSON.stringify(incoming)); } catch {}
      return incoming;
    }
    try { return JSON.parse(localStorage.getItem(ATTR_KEY) || '{}') || {}; } catch { return {}; }
  }

  function settings(data = window.__SITE_CONTENT__ || {}) {
    return data?.site?.growth?.analytics || {};
  }

  function send(event, detail = {}) {
    if (!enabled) return;
    const key = `${event}:${detail.label || ''}:${detail.campaign || ''}`;
    if (sent.has(key) && !['checkout_click','whatsapp_click','campaign_click'].includes(event)) return;
    sent.add(key);
    const attr = attribution();
    const payload = {
      event,
      session: id(),
      page: 'landing',
      source: detail.source || attr.source || '',
      campaign: detail.campaign || attr.campaign || '',
      label: detail.label || ''
    };
    try {
      fetch('/api/analytics', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(payload),
        keepalive:true,
        credentials:'omit'
      }).catch(()=>{});
    } catch {}
  }

  function destination(anchor) {
    return String(anchor?.dataset?.privateHref || anchor?.getAttribute?.('href') || '').trim();
  }

  function observeStage(selector, event, threshold = .25) {
    const el = document.querySelector(selector);
    if (!el) return;
    if (!('IntersectionObserver' in window)) return;
    const obs = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      send(event);
      obs.disconnect();
    }, { threshold, rootMargin:'0px 0px -4% 0px' });
    obs.observe(el);
  }

  function setupScroll() {
    const marks = [25,50,75,100];
    const check = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const pct = Math.min(100, Math.round((scrollY / max) * 100));
      marks.forEach(mark => { if (pct >= mark) send(`scroll_${mark}`); });
    };
    addEventListener('scroll', check, { passive:true });
    addEventListener('resize', check, { passive:true });
    check();
  }

  function bindClicks() {
    document.addEventListener('click', event => {
      const anchor = event.target.closest?.('a');
      if (!anchor) return;
      const href = destination(anchor);
      const editId = anchor.dataset.editId || '';
      if (editId === 'a-002' || /pay\.kiwify\.com\.br/i.test(href)) {
        send('checkout_click', { label: (anchor.textContent || '').trim().slice(0,80) });
      }
      if (editId === 'a-005' || editId === 'a-006' || /(?:wa\.me|whatsapp:|api\.whatsapp\.com)/i.test(href)) {
        send('whatsapp_click', { label: (anchor.textContent || '').trim().slice(0,80) });
      }
      if (anchor.dataset.campaignCta === '1') {
        send('campaign_click', { label: anchor.dataset.campaignLabel || '', campaign: anchor.dataset.campaignLabel || '' });
      }
    }, { capture:true });
  }

  function apply(data = window.__SITE_CONTENT__ || {}) {
    enabled = settings(data).enabled !== false;
    if (!enabled) return;
    send('page_view');
  }

  function boot() {
    apply();
    observeStage('section[data-edit-id="section-002"],#resultados','results_view',.18);
    observeStage('[data-edit-id="div-049"],#oferta-card,section[data-edit-id="section-009"]','offer_view',.28);
    setupScroll();
    bindClicks();
  }

  window.addEventListener('campaign-rendered', event => {
    send('campaign_view', { label:event.detail?.label || '', campaign:event.detail?.label || '' });
  });
  window.addEventListener('site-content-ready', event => apply(event.detail || {}));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
