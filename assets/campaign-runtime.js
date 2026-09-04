(() => {
  const DEFAULT = {
    enabled:false,
    badge:'CONDIÇÃO ESPECIAL',
    title:'Condição especial por tempo limitado',
    message:'Confira a condição disponível nesta campanha.',
    startsAt:'',
    endsAt:'',
    countdownEnabled:false,
    ctaLabel:'Ver oferta',
    ctaTarget:'#oferta-card'
  };
  let timer = 0;
  let config = { ...DEFAULT };

  const clean = value => String(value || '').trim();
  function normalize(raw = {}) {
    return { ...DEFAULT, ...(raw || {}), enabled:raw?.enabled === true, countdownEnabled:raw?.countdownEnabled === true };
  }
  function parseDate(value) {
    const text = clean(value);
    if (!text) return null;
    const date = new Date(text);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  function activeNow(cfg) {
    if (!cfg.enabled) return false;
    const now = Date.now();
    const start = parseDate(cfg.startsAt)?.getTime();
    const end = parseDate(cfg.endsAt)?.getTime();
    if (start && now < start) return false;
    if (end && now >= end) return false;
    return true;
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function targetHost() {
    return document.querySelector('[data-edit-id="div-049"]') || document.querySelector('#oferta-card') || document.querySelector('section[data-edit-id="section-009"]');
  }
  function remove() {
    clearInterval(timer);
    timer = 0;
    document.querySelector('#lyCampaignBanner')?.remove();
    document.documentElement.classList.remove('ly-campaign-active');
  }
  function formatRemaining(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return [days,hours,mins,secs].map((value,index) => `${String(value).padStart(2,'0')}<small>${['d','h','m','s'][index]}</small>`);
  }
  function updateCountdown(host, endDate) {
    const tick = () => {
      const left = endDate.getTime() - Date.now();
      if (left <= 0) { remove(); return; }
      const values = formatRemaining(left);
      [...host.querySelectorAll('span')].forEach((span,index) => { span.innerHTML = values[index] || ''; });
    };
    tick();
    clearInterval(timer);
    timer = setInterval(tick, 1000);
  }
  function render(cfg) {
    remove();
    if (!activeNow(cfg)) return;
    const host = targetHost();
    if (!host) return;

    const banner = document.createElement('aside');
    banner.id = 'lyCampaignBanner';
    banner.className = 'ly-campaign-banner';
    banner.setAttribute('aria-label','Campanha atual');
    const end = parseDate(cfg.endsAt);
    const showCountdown = cfg.countdownEnabled && end && end.getTime() > Date.now();
    const cta = clean(cfg.ctaLabel) && clean(cfg.ctaTarget)
      ? `<a class="ly-campaign-cta" data-campaign-cta="1" data-campaign-label="${escapeHtml(cfg.title)}" href="${escapeHtml(cfg.ctaTarget)}">${escapeHtml(cfg.ctaLabel)}</a>` : '';
    banner.innerHTML = `
      <div class="ly-campaign-copy">
        <span class="ly-campaign-badge">${escapeHtml(cfg.badge)}</span>
        <strong class="ly-campaign-title">${escapeHtml(cfg.title)}</strong>
        <span class="ly-campaign-message">${escapeHtml(cfg.message)}</span>
      </div>
      <div class="ly-campaign-side">
        ${showCountdown ? '<div class="ly-campaign-countdown" aria-label="Tempo restante"><span></span><span></span><span></span><span></span></div>' : ''}
        ${cta}
      </div>`;
    host.insertAdjacentElement('beforebegin', banner);
    document.documentElement.classList.add('ly-campaign-active');
    if (showCountdown) updateCountdown(banner.querySelector('.ly-campaign-countdown'), end);
    window.dispatchEvent(new CustomEvent('campaign-rendered', { detail:{ label:cfg.title } }));
  }
  function apply(data = window.__SITE_CONTENT__ || {}) {
    config = normalize(data?.site?.growth?.campaign || {});
    render(config);
    return { ...config };
  }
  window.LyzandraCampaign = { apply, getConfig:() => ({ ...config }) };
  document.addEventListener('DOMContentLoaded', () => apply(), { once:true });
  ['site-content-ready','site-render-ready','conversion-rendered'].forEach(name => window.addEventListener(name, event => setTimeout(() => apply(event.detail || window.__SITE_CONTENT__ || {}), 0)));
})();
