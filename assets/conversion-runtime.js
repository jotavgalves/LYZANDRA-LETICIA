(() => {
  const ICONS = {
    'book-open': '<path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11v17H4.5A2.5 2.5 0 0 0 2 22V5.5Z"/><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H13v17h6.5A2.5 2.5 0 0 1 22 22V5.5Z"/>',
    'badge-check': '<path d="M12 2.5 14.2 5l3.3-.2.7 3.2 2.8 1.7-1.5 2.9 1.5 2.9-2.8 1.7-.7 3.2-3.3-.2L12 22.5l-2.2-2.3-3.3.2-.7-3.2L3 15.5l1.5-2.9L3 9.7 5.8 8l.7-3.2 3.3.2L12 2.5Z"/><path d="m8.5 12.5 2.2 2.2 4.8-5"/>',
    'headset': '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19c0 1.7-1.3 3-3 3h-3"/><rect x="3" y="13" width="4" height="6" rx="2"/><rect x="17" y="13" width="4" height="6" rx="2"/>',
    'files': '<path d="M14 2H6a2 2 0 0 0-2 2v12"/><path d="M14 2v6h6"/><path d="M20 8v10a2 2 0 0 1-2 2H8"/><path d="M8 6h4M8 10h8M8 14h8"/>',
    'eye': '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
    'shield-check': '<path d="M12 3 4.5 6v5.5c0 4.8 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.7 7.5-9.5V6L12 3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    'monitor-play': '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="m10 8 5 2.5-5 2.5V8Z"/><path d="M8 21h8M12 17v4"/>',
    'key-round': '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l2 2M18 5l2 2"/>',
    'message-circle': '<path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.3-4A8 8 0 1 1 21 12Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
    'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    'lock': '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    'sparkles': '<path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2L12 3Z"/><path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13ZM6 14l.7 1.8 1.8.7-1.8.7L6 19l-.7-1.8-1.8-.7 1.8-.7L6 14Z"/>',
    'graduation-cap': '<path d="m2 10 10-5 10 5-10 5L2 10Z"/><path d="M6 12.5V17c3.5 2.5 8.5 2.5 12 0v-4.5M22 10v6"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    'heart': '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>',
    'star': '<path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/>'
  };

  const DEFAULT = {
    enabled: true,
    navigation: { enabled: true, brand: 'Speed Lash', ctaLabel: 'Quero minha vaga', items: [
      { label: 'Método', target: 'metodo' }, { label: 'Resultados', target: 'resultados' }, { label: 'Certificado', target: 'certificado' }, { label: 'Sobre', target: 'sobre' }, { label: 'Dúvidas', target: 'duvidas' }
    ] },
    hero: { enabled: true, trustItems: ['Curso online', 'Acesso após confirmação', 'Certificado profissional', 'Suporte'], trustIcons: ['monitor-play', 'key-round', 'badge-check', 'headset'], proofText: 'Método estruturado para otimizar o atendimento com técnica, segurança e consistência.' },
    stickyCta: { enabled: true, label: 'QUERO MINHA VAGA', sublabel: 'Conheça a oferta', target: 'planos' },
    receive: { enabled: true, eyebrow: 'TUDO O QUE VOCÊ RECEBE', title: 'Uma formação completa, não apenas aulas', description: 'O Speed Lash reúne conteúdo técnico, prática orientada e recursos para você estudar com uma sequência clara e aplicar o método com mais segurança.', items: [
      { title: '5 módulos + módulo bônus', text: 'Conteúdo organizado do preparo à finalização, com prática e gestão do atendimento.', icon: 'book-open' },
      { title: 'Certificado profissional', text: 'Conclusão com certificado para valorizar sua formação e trajetória profissional.', icon: 'badge-check' },
      { title: 'Suporte durante a formação', text: 'Apoio para dúvidas e acompanhamento durante o processo de aprendizagem.', icon: 'headset' },
      { title: 'Materiais complementares', text: 'Conteúdos extras para reforçar o estudo e a execução das técnicas.', icon: 'files' },
      { title: 'Técnicas procuradas', text: 'Volume Russo, Capping e Efeito Molhado dentro da metodologia do curso.', icon: 'eye' },
      { title: '7 dias de garantia', text: 'Período de garantia apresentado na própria oferta do Speed Lash.', icon: 'shield-check' }
    ] },
    authority: { enabled: true, title: 'Experiência que sustenta o método', description: 'Os números abaixo reproduzem as informações apresentadas na própria página e podem ser editados pelo painel.', stats: [
      { value: 'Mais de 4 anos', label: 'de experiência profissional' }, { value: 'Mais de 9 mil', label: 'atendimentos realizados' }, { value: 'Palestrante e jurada', label: 'em eventos e campeonatos' }
    ] },
    offerTrust: { enabled: true, items: ['Pagamento seguro', '7 dias de garantia', 'Acesso após confirmação', 'Checkout protegido'], icons: ['credit-card', 'shield-check', 'key-round', 'lock'] },
    faq: { enabled: true, title: 'Mais dúvidas antes de começar?', items: [
      { question: 'O curso tem certificado?', answer: 'Sim. A formação inclui certificado de conclusão, apresentado em uma seção própria desta página.' },
      { question: 'Quais técnicas estão incluídas?', answer: 'O conteúdo apresentado inclui Volume Russo, Capping e Efeito Molhado, além de fundamentos, patologia ocular, treino prático, finalização e gestão.' },
      { question: 'Como funciona a garantia?', answer: 'A oferta informa garantia incondicional de 7 dias. Consulte os termos da compra para os detalhes aplicáveis ao seu pedido.' },
      { question: 'Quando recebo meu acesso?', answer: 'O acesso é liberado conforme a confirmação do pagamento pela plataforma de checkout. As instruções são enviadas no fluxo da compra.' }
    ] },
    microInteractions: true
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = value => JSON.parse(JSON.stringify(value));
  let autoInitialized = false;

  function inferIcon(text, fallback = 'sparkles') {
    const value = String(text || '').toLocaleLowerCase('pt-BR');
    if (/certific/.test(value)) return 'badge-check';
    if (/garantia/.test(value)) return 'shield-check';
    if (/checkout|protegid|cadeado/.test(value)) return 'lock';
    if (/pagamento|cartão|cartao/.test(value)) return 'credit-card';
    if (/acesso|libera|chave/.test(value)) return 'key-round';
    if (/suporte|dúvida|duvida|ajuda/.test(value)) return 'headset';
    if (/material|arquivo|apostila|pdf/.test(value)) return 'files';
    if (/técnic|tecnic|cíli|cilio|volume|lash/.test(value)) return 'eye';
    if (/módulo|modulo|aula|conteúdo|conteudo|formação|formacao/.test(value)) return 'book-open';
    if (/online|vídeo|video/.test(value)) return 'monitor-play';
    return ICONS[fallback] ? fallback : 'sparkles';
  }

  function iconSvg(name, size = 20) {
    const key = ICONS[name] ? name : 'sparkles';
    return `<svg data-icon-name="${key}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="width:${size}px;height:${size}px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round">${ICONS[key]}</svg>`;
  }

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    const normalized = {
      ...clone(DEFAULT), ...raw,
      navigation: { ...clone(DEFAULT.navigation), ...(raw.navigation || {}), items: Array.isArray(raw.navigation?.items) ? raw.navigation.items : clone(DEFAULT.navigation.items) },
      hero: { ...clone(DEFAULT.hero), ...(raw.hero || {}), trustItems: Array.isArray(raw.hero?.trustItems) ? raw.hero.trustItems : clone(DEFAULT.hero.trustItems), trustIcons: Array.isArray(raw.hero?.trustIcons) ? raw.hero.trustIcons : clone(DEFAULT.hero.trustIcons) },
      stickyCta: { ...clone(DEFAULT.stickyCta), ...(raw.stickyCta || {}) },
      receive: { ...clone(DEFAULT.receive), ...(raw.receive || {}), items: Array.isArray(raw.receive?.items) ? raw.receive.items : clone(DEFAULT.receive.items) },
      authority: { ...clone(DEFAULT.authority), ...(raw.authority || {}), stats: Array.isArray(raw.authority?.stats) ? raw.authority.stats : clone(DEFAULT.authority.stats) },
      offerTrust: { ...clone(DEFAULT.offerTrust), ...(raw.offerTrust || {}), items: Array.isArray(raw.offerTrust?.items) ? raw.offerTrust.items : clone(DEFAULT.offerTrust.items), icons: Array.isArray(raw.offerTrust?.icons) ? raw.offerTrust.icons : clone(DEFAULT.offerTrust.icons) },
      faq: { ...clone(DEFAULT.faq), ...(raw.faq || {}), items: Array.isArray(raw.faq?.items) ? raw.faq.items : clone(DEFAULT.faq.items) },
      enabled: raw.enabled !== false,
      microInteractions: raw.microInteractions !== false
    };
    normalized.receive.items = normalized.receive.items.map((item, index) => ({ ...(item || {}), icon: ICONS[item?.icon] ? item.icon : inferIcon(item?.title, DEFAULT.receive.items[index]?.icon || 'sparkles') }));
    return normalized;
  }

  function cleanup() {
    ['conversionNav','conversionHeroTrust','conversionStickyCta','conversionReceive','conversionAuthority','conversionOfferTrust','conversionFaqExtras'].forEach(id => document.getElementById(id)?.remove());
    document.documentElement.classList.remove('conversion-enhanced');
    $$('.conversion-reveal,.conversion-revealed').forEach(el => el.classList.remove('conversion-reveal','conversion-revealed'));
  }

  function replaceLegacyCopy(root = document) {
    const replacements = [[/Start Lashes/g, 'Speed Lash'], [/JK Academy/g, 'Ly Cílios'], [/\bJamily\b/g, 'Lyzandra']];
    const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT, { acceptNode(node) {
      const parent = node.parentElement; if (!parent || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
      const text = node.nodeValue || ''; return (text.includes('Start Lashes') || text.includes('JK Academy') || text.includes('Jamily')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }});
    const nodes = []; let node; while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode => { let text = textNode.nodeValue || ''; replacements.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); }); textNode.nodeValue = text; });
  }

  function setSectionIds() {
    const ids = { 'section-001':'inicio','section-002':'resultados','section-003':'metodo','section-004':'tecnicas','section-005':'conteudo','section-006':'certificado','section-007':'sobre','section-008':'diferenciais','section-009':'planos','section-010':'duvidas' };
    Object.entries(ids).forEach(([editId, id]) => { const section = $(`section[data-edit-id="${editId}"]`); if (section) section.id = id; });
  }

  function targetHref(target) {
    const value = String(target || '').trim(); if (!value) return '#planos';
    if (/^(https?:|mailto:|tel:|#)/i.test(value)) return value;
    return `#${value.replace(/^#/, '')}`;
  }

  function ensureNavigation(config) {
    if (!config.navigation.enabled) return;
    const nav = document.createElement('header'); nav.id = 'conversionNav'; nav.className = 'conversion-nav';
    const inner = document.createElement('div'); inner.className = 'conversion-nav__inner';
    const brand = document.createElement('a'); brand.id = 'conversionNavBrand'; brand.className = 'conversion-nav__brand'; brand.href = '#inicio'; brand.textContent = config.navigation.brand || 'Speed Lash';
    const links = document.createElement('nav'); links.className = 'conversion-nav__links';
    (config.navigation.items || []).filter(item => item?.label && item?.target).forEach((item, index) => { const link = document.createElement('a'); link.id = `conversionNavLink${index + 1}`; link.href = targetHref(item.target); link.textContent = item.label; links.appendChild(link); });
    const cta = document.createElement('a'); cta.id = 'conversionNavCta'; cta.className = 'conversion-nav__cta'; cta.href = '#planos'; cta.textContent = config.navigation.ctaLabel || 'Quero minha vaga';
    inner.append(brand, links, cta); nav.appendChild(inner); document.body.prepend(nav);
  }

  function ensureHero(config) {
    if (!config.hero.enabled) return;
    const section = $('#inicio'); const ctaHost = section?.querySelector('[data-edit-id="div-005"]'); if (!section || !ctaHost) return;
    const box = document.createElement('div'); box.id = 'conversionHeroTrust'; box.className = 'conversion-hero-trust';
    const list = document.createElement('div'); list.className = 'conversion-hero-trust__list';
    (config.hero.trustItems || []).filter(Boolean).forEach((value, index) => {
      const chip = document.createElement('span'); chip.id = `conversionHeroChip${index + 1}`;
      const icon = ICONS[config.hero.trustIcons?.[index]] ? config.hero.trustIcons[index] : inferIcon(value, DEFAULT.hero.trustIcons[index] || 'check-circle');
      chip.innerHTML = `<b aria-hidden="true">${iconSvg(icon, 12)}</b>${escapeHtml(value)}`; list.appendChild(chip);
    });
    box.appendChild(list);
    if (config.hero.proofText) { const proof = document.createElement('p'); proof.id = 'conversionHeroProof'; proof.textContent = config.hero.proofText; box.appendChild(proof); }
    ctaHost.parentElement.insertBefore(box, ctaHost);
  }

  function ensureStickyCta(config) {
    if (!config.stickyCta.enabled) return;
    const wrap = document.createElement('aside'); wrap.id = 'conversionStickyCta'; wrap.className = 'conversion-sticky-cta';
    const link = document.createElement('a'); link.id = 'conversionStickyLink'; link.href = targetHref(config.stickyCta.target || 'planos');
    const text = document.createElement('span'); text.innerHTML = `<strong id="conversionStickyTitle">${escapeHtml(config.stickyCta.label || 'QUERO MINHA VAGA')}</strong><small id="conversionStickySubtitle">${escapeHtml(config.stickyCta.sublabel || '')}</small>`;
    const arrow = document.createElement('b'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '→'; link.append(text, arrow); wrap.appendChild(link); document.body.appendChild(wrap);
    const hero = $('#inicio');
    if ('IntersectionObserver' in window && hero) { const observer = new IntersectionObserver(entries => wrap.classList.toggle('is-visible', !entries[0]?.isIntersecting), { threshold: 0.08 }); observer.observe(hero); }
    else wrap.classList.add('is-visible');
  }

  function ensureReceive(config) {
    if (!config.receive.enabled) return;
    const offer = $('#planos'); if (!offer?.parentElement) return;
    const section = document.createElement('section'); section.id = 'conversionReceive'; section.className = 'conversion-receive';
    const cards = (config.receive.items || []).filter(item => item?.title).map((item, index) => `
      <article id="conversionReceiveCard${index + 1}" class="conversion-receive__card">
        <span id="conversionReceiveIcon${index + 1}" class="conversion-receive__icon">${iconSvg(item.icon || inferIcon(item.title), 20)}</span>
        <h3 id="conversionReceiveTitle${index + 1}">${escapeHtml(item.title)}</h3>
        <p id="conversionReceiveText${index + 1}">${escapeHtml(item.text || '')}</p>
      </article>`).join('');
    section.innerHTML = `<div class="conversion-shell"><span id="conversionReceiveEyebrow" class="conversion-eyebrow">${escapeHtml(config.receive.eyebrow || '')}</span><h2 id="conversionReceiveHeading">${escapeHtml(config.receive.title || '')}</h2><p id="conversionReceiveDescription" class="conversion-lead">${escapeHtml(config.receive.description || '')}</p><div class="conversion-receive__grid">${cards}</div></div>`;
    offer.parentElement.insertBefore(section, offer);
  }

  function ensureAuthority(config) {
    if (!config.authority.enabled) return;
    const section = $('#sobre'); const host = section?.querySelector(':scope > div') || section; if (!section || !host) return;
    const box = document.createElement('div'); box.id = 'conversionAuthority'; box.className = 'conversion-authority';
    const stats = (config.authority.stats || []).filter(item => item?.value || item?.label).map((item, index) => `<div id="conversionAuthorityStat${index + 1}" class="conversion-authority__stat"><strong id="conversionAuthorityValue${index + 1}">${escapeHtml(item.value || '')}</strong><span id="conversionAuthorityLabel${index + 1}">${escapeHtml(item.label || '')}</span></div>`).join('');
    box.innerHTML = `<div class="conversion-authority__copy"><h3 id="conversionAuthorityHeading">${escapeHtml(config.authority.title || '')}</h3><p id="conversionAuthorityDescription">${escapeHtml(config.authority.description || '')}</p></div><div class="conversion-authority__stats">${stats}</div>`; host.appendChild(box);
  }

  function ensureOfferTrust(config) {
    if (!config.offerTrust.enabled) return;
    const section = $('#planos'); const actionBox = section?.querySelector('[data-edit-id="div-052"]'); if (!actionBox) return;
    const row = document.createElement('div'); row.id = 'conversionOfferTrust'; row.className = 'conversion-offer-trust';
    (config.offerTrust.items || []).filter(Boolean).forEach((item, index) => { const span = document.createElement('span'); span.id = `conversionOfferTrustItem${index + 1}`; const icon = ICONS[config.offerTrust.icons?.[index]] ? config.offerTrust.icons[index] : inferIcon(item, DEFAULT.offerTrust.icons[index] || 'check-circle'); span.innerHTML = `<b aria-hidden="true">${iconSvg(icon, 11)}</b>${escapeHtml(item)}`; row.appendChild(span); });
    actionBox.appendChild(row); section.classList.add('conversion-offer-enhanced');
  }

  function makeFaqItem(item, index) {
    const article = document.createElement('article'); article.id = `conversionFaqItem${index + 1}`; article.className = 'conversion-faq-item';
    const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-expanded', 'false'); button.innerHTML = `<span id="conversionFaqQuestion${index + 1}">${escapeHtml(item.question || '')}</span><b aria-hidden="true">+</b>`;
    const answer = document.createElement('div'); answer.className = 'conversion-faq-answer'; answer.innerHTML = `<p id="conversionFaqAnswer${index + 1}">${escapeHtml(item.answer || '')}</p>`;
    button.addEventListener('click', () => { const open = button.getAttribute('aria-expanded') === 'true'; button.setAttribute('aria-expanded', open ? 'false' : 'true'); button.querySelector('b').textContent = open ? '+' : '−'; answer.classList.toggle('is-open', !open); });
    article.append(button, answer); return article;
  }

  function ensureFaq(config) {
    if (!config.faq.enabled) return;
    const section = $('#duvidas'); const host = section?.querySelector(':scope > div') || section; if (!section || !host) return;
    const box = document.createElement('div'); box.id = 'conversionFaqExtras'; box.className = 'conversion-faq-extra';
    if (config.faq.title) { const title = document.createElement('h3'); title.id = 'conversionFaqHeading'; title.textContent = config.faq.title; box.appendChild(title); }
    (config.faq.items || []).filter(item => item?.question).forEach((item, index) => box.appendChild(makeFaqItem(item, index))); host.appendChild(box);
  }

  function improveTestimonials() {
    const section = $('#resultados'); if (!section) return;
    section.querySelectorAll('article').forEach(article => { const header = article.querySelector(':scope > div:first-child'); if (!header || header.querySelector('[data-speed-lash-role]')) return; const name = header.querySelector('.font-semibold'); if (!name) return; const group = document.createElement('span'); group.style.cssText = 'display:grid;gap:1px;'; const clonedName = name.cloneNode(true); const role = document.createElement('small'); role.dataset.speedLashRole = '1'; role.textContent = 'Aluna Speed Lash'; role.style.cssText = 'font-size:9px;line-height:1.2;color:#8b7f84;font-weight:500;letter-spacing:.02em;'; group.append(clonedName, role); name.replaceWith(group); });
  }

  function optimizeMedia() {
    $$('img').forEach((img, index) => { img.decoding = 'async'; if (img.closest('#inicio') && index < 2) { img.loading = 'eager'; img.setAttribute('fetchpriority', 'high'); } else if (!img.hasAttribute('loading')) img.loading = 'lazy'; });
    $$('iframe').forEach(frame => { if (!frame.hasAttribute('loading')) frame.loading = 'lazy'; });
  }

  function initMicroInteractions(config) {
    if (!config.microInteractions || !('IntersectionObserver' in window)) return;
    const targets = $$('main > section, #conversionReceive, .conversion-receive__card, .conversion-authority__stat').filter(el => !el.classList.contains('conversion-reveal'));
    targets.forEach(el => el.classList.add('conversion-reveal'));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('conversion-revealed'); observer.unobserve(entry.target); } }), { threshold: 0.08, rootMargin: '0px 0px -40px' });
    targets.forEach(el => observer.observe(el));
  }

  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' })[char]); }

  function apply(data = {}) {
    const config = normalize(data?.site?.conversion || {});
    cleanup(); replaceLegacyCopy(document); setSectionIds(); if (!config.enabled) return;
    document.documentElement.classList.add('conversion-enhanced');
    ensureNavigation(config); ensureHero(config); ensureStickyCta(config); ensureReceive(config); ensureAuthority(config); ensureOfferTrust(config); ensureFaq(config); improveTestimonials(); optimizeMedia(); initMicroInteractions(config);
    window.dispatchEvent(new CustomEvent('conversion-rendered', { detail: config }));
  }

  function autoApply(data) {
    if (autoInitialized) return;
    autoInitialized = true;
    apply(data || window.__SITE_CONTENT__ || {});
  }

  async function fallbackLoad() {
    if (autoInitialized) return;
    if (window.__SITE_CONTENT__) return autoApply(window.__SITE_CONTENT__);
    try { const response = await fetch('/api/content', { cache: 'no-store' }); autoApply(response.ok ? await response.json() : {}); }
    catch { autoApply({}); }
  }

  window.LyzandraConversion = { apply, normalize, DEFAULT: clone(DEFAULT), ICONS: Object.keys(ICONS), iconSvg, inferIcon };
  window.addEventListener('site-content-ready', event => autoApply(event.detail || window.__SITE_CONTENT__ || {}), { once: true });
  if (window.__SITE_CONTENT_READY__) autoApply(window.__SITE_CONTENT__ || {});
  document.addEventListener('DOMContentLoaded', () => setTimeout(fallbackLoad, 140), { once: true });
})();