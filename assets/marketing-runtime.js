(() => {
  const CONSENT_KEY = 'lyzandra_marketing_consent_v1';
  const DEFAULT = {
    enabled: false,
    mode: 'direct',
    metaPixelId: '',
    metaDomainVerification: '',
    googleAnalyticsId: '',
    googleAdsId: '',
    googleAdsLeadLabel: '',
    googleAdsCheckoutLabel: '',
    gtmId: '',
    consent: {
      enabled: true,
      title: 'Privacidade e cookies',
      text: 'Usamos cookies e tecnologias de medição para entender o uso do site e melhorar nossos anúncios.',
      privacyUrl: ''
    }
  };

  let config = null;
  let initialized = false;
  let clickBound = false;
  let metaLoaded = false;
  let googlePrepared = false;

  const clean = value => String(value || '').trim();
  const validMeta = value => /^\d{5,25}$/.test(clean(value));
  const validGA = value => /^G-[A-Z0-9]+$/i.test(clean(value));
  const validAW = value => /^AW-\d+$/i.test(clean(value));
  const validGTM = value => /^GTM-[A-Z0-9]+$/i.test(clean(value));
  const isPreview = () => new URLSearchParams(location.search).get('admin-preview') === '1';

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      ...DEFAULT,
      ...raw,
      enabled: raw.enabled === true,
      mode: raw.mode === 'gtm' ? 'gtm' : 'direct',
      metaPixelId: clean(raw.metaPixelId),
      metaDomainVerification: clean(raw.metaDomainVerification),
      googleAnalyticsId: clean(raw.googleAnalyticsId).toUpperCase(),
      googleAdsId: clean(raw.googleAdsId).toUpperCase(),
      googleAdsLeadLabel: clean(raw.googleAdsLeadLabel),
      googleAdsCheckoutLabel: clean(raw.googleAdsCheckoutLabel),
      gtmId: clean(raw.gtmId).toUpperCase(),
      consent: { ...DEFAULT.consent, ...((raw && raw.consent) || {}) }
    };
  }

  function consentChoice() {
    if (!config?.consent?.enabled) return 'granted';
    try {
      const value = localStorage.getItem(CONSENT_KEY);
      return value === 'granted' || value === 'denied' ? value : 'unset';
    } catch {
      return 'unset';
    }
  }

  function ensureDataLayer() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
  }

  function setGoogleConsentDefault() {
    if (!config?.consent?.enabled) return;
    ensureDataLayer();
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500
    });
  }

  function updateGoogleConsent(choice) {
    if (!config?.consent?.enabled) return;
    ensureDataLayer();
    const value = choice === 'granted' ? 'granted' : 'denied';
    window.gtag('consent', 'update', {
      ad_storage: value,
      analytics_storage: value,
      ad_user_data: value,
      ad_personalization: value
    });
  }

  function injectMetaVerification(token) {
    if (!token) return;
    let meta = document.querySelector('meta[name="facebook-domain-verification"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'facebook-domain-verification';
      document.head.appendChild(meta);
    }
    meta.content = token;
  }

  function loadGoogleDirect() {
    const ids = [];
    if (validGA(config.googleAnalyticsId)) ids.push(config.googleAnalyticsId);
    if (validAW(config.googleAdsId)) ids.push(config.googleAdsId);
    if (!ids.length) return;

    ensureDataLayer();
    if (!googlePrepared) {
      setGoogleConsentDefault();
      window.gtag('js', new Date());
      ids.forEach(id => window.gtag('config', id));
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids[0])}`;
      script.dataset.lyGoogleTag = '1';
      document.head.appendChild(script);
      googlePrepared = true;
    }

    if (consentChoice() === 'granted') updateGoogleConsent('granted');
  }

  function loadGTM() {
    if (!validGTM(config.gtmId) || document.querySelector('script[data-ly-gtm]')) return;
    ensureDataLayer();
    setGoogleConsentDefault();
    if (consentChoice() === 'granted') updateGoogleConsent('granted');
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtmId)}`;
    script.dataset.lyGtm = '1';
    document.head.appendChild(script);
    googlePrepared = true;
  }

  function loadMeta() {
    if (metaLoaded || !validMeta(config.metaPixelId)) return;
    if (config.consent.enabled !== false && consentChoice() !== 'granted') return;

    if (!window.fbq) {
      const fbq = function(){ fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
      if (!window._fbq) window._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = '2.0';
      fbq.queue = [];
      window.fbq = fbq;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      script.dataset.lyMetaPixel = '1';
      const first = document.getElementsByTagName('script')[0];
      if (first?.parentNode) first.parentNode.insertBefore(script, first);
      else document.head.appendChild(script);
    }

    window.fbq('init', config.metaPixelId);
    window.fbq('track', 'PageView');
    metaLoaded = true;
  }

  function adsSendTo(label) {
    const value = clean(label);
    if (!value || !validAW(config.googleAdsId)) return '';
    if (/^AW-\d+\//i.test(value)) return value;
    return `${config.googleAdsId}/${value}`;
  }

  function pushEvent(name, details = {}) {
    ensureDataLayer();
    window.dataLayer.push({ event: name, ...details });
  }

  function googleEvent(name, params = {}) {
    if (config.mode !== 'direct') return;
    if (!validGA(config.googleAnalyticsId) && !validAW(config.googleAdsId)) return;
    ensureDataLayer();
    window.gtag('event', name, params);
  }

  function metaEvent(name, params = {}) {
    if (config.mode !== 'direct' || !metaLoaded || typeof window.fbq !== 'function') return;
    window.fbq('track', name, params);
  }

  function trackWhatsApp(anchor) {
    pushEvent('whatsapp_click', { link_url: anchor?.href || '' });
    googleEvent('generate_lead', { method: 'whatsapp' });
    const sendTo = adsSendTo(config.googleAdsLeadLabel);
    if (sendTo && config.mode === 'direct') window.gtag('event', 'conversion', { send_to: sendTo });
    metaEvent('Contact', { content_name: 'WhatsApp' });
  }

  function trackCheckout(anchor) {
    pushEvent('begin_checkout', { link_url: anchor?.href || '' });
    googleEvent('begin_checkout', { currency: 'BRL' });
    const sendTo = adsSendTo(config.googleAdsCheckoutLabel);
    if (sendTo && config.mode === 'direct') window.gtag('event', 'conversion', { send_to: sendTo });
    metaEvent('InitiateCheckout');
  }

  function bindClicks() {
    if (clickBound) return;
    clickBound = true;
    document.addEventListener('click', event => {
      if (!config?.enabled) return;
      const anchor = event.target.closest?.('a');
      if (!anchor) return;
      const href = clean(anchor.getAttribute('href'));
      const id = anchor.dataset.editId || '';
      const whatsapp = /(?:wa\.me|api\.whatsapp\.com|whatsapp:)/i.test(href) || id === 'a-005' || id === 'a-006';
      if (whatsapp) {
        trackWhatsApp(anchor);
        return;
      }
      if (id === 'a-002') trackCheckout(anchor);
    }, { capture: true });
  }

  function removeBanner() {
    document.querySelector('[data-ly-consent-banner]')?.remove();
  }

  function saveConsent(choice) {
    try { localStorage.setItem(CONSENT_KEY, choice); } catch {}
    updateGoogleConsent(choice);
    if (choice === 'granted' && config.mode === 'direct') loadMeta();
    removeBanner();
  }

  function showConsentBanner() {
    if (!config.consent.enabled || consentChoice() !== 'unset' || document.querySelector('[data-ly-consent-banner]')) return;

    const banner = document.createElement('aside');
    banner.dataset.lyConsentBanner = '1';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', config.consent.title || 'Privacidade e cookies');
    banner.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;z-index:10000;max-width:620px;margin:auto;padding:18px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(18,15,17,.97);color:#fff;box-shadow:0 18px 55px rgba(0,0,0,.4);font-family:Poppins,system-ui,sans-serif;';

    const title = document.createElement('strong');
    title.textContent = config.consent.title || 'Privacidade e cookies';
    title.style.cssText = 'display:block;font-size:15px;margin-bottom:6px;';
    const text = document.createElement('p');
    text.textContent = config.consent.text || DEFAULT.consent.text;
    text.style.cssText = 'font-size:12px;line-height:1.55;color:#d7d1d5;margin:0 0 12px;';
    banner.append(title, text);

    if (config.consent.privacyUrl) {
      const link = document.createElement('a');
      link.href = config.consent.privacyUrl;
      link.textContent = 'Política de Privacidade';
      link.style.cssText = 'display:inline-block;color:#ff6eae;font-size:11px;margin-bottom:12px;text-decoration:underline;';
      banner.appendChild(link);
    }

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;';
    const reject = document.createElement('button');
    reject.type = 'button';
    reject.textContent = 'Recusar';
    reject.style.cssText = 'border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;border-radius:999px;padding:9px 14px;font:600 11px Poppins,system-ui,sans-serif;cursor:pointer;';
    reject.onclick = () => saveConsent('denied');
    const accept = document.createElement('button');
    accept.type = 'button';
    accept.textContent = 'Aceitar';
    accept.style.cssText = 'border:0;background:#f54b96;color:#fff;border-radius:999px;padding:10px 16px;font:700 11px Poppins,system-ui,sans-serif;cursor:pointer;';
    accept.onclick = () => saveConsent('granted');
    actions.append(reject, accept);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  function initialize(data) {
    if (initialized || isPreview()) return;
    config = normalize(data?.site?.marketing);
    injectMetaVerification(config.metaDomainVerification);
    if (!config.enabled) return;

    initialized = true;
    bindClicks();

    if (config.mode === 'gtm') loadGTM();
    else {
      loadGoogleDirect();
      loadMeta();
    }

    showConsentBanner();
  }

  window.LyzandraTracking = {
    track(name, details = {}) {
      if (!config?.enabled) return;
      pushEvent(name, details);
      googleEvent(name, details);
    },
    consent(choice) {
      if (choice === 'granted' || choice === 'denied') saveConsent(choice);
    },
    resetConsent() {
      try { localStorage.removeItem(CONSENT_KEY); } catch {}
      location.reload();
    }
  };

  window.addEventListener('site-content-ready', event => initialize(event.detail || window.__SITE_CONTENT__ || {}));
  if (window.__SITE_CONTENT__) initialize(window.__SITE_CONTENT__);
})();
