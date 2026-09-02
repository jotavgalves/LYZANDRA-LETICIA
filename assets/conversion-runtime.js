(() => {
  const DEFAULT = {
    enabled: true,
    navigation: {
      enabled: true,
      brand: 'Speed Lash',
      ctaLabel: 'Quero minha vaga',
      items: [
        { label: 'Método', target: 'metodo' },
        { label: 'Resultados', target: 'resultados' },
        { label: 'Certificado', target: 'certificado' },
        { label: 'Sobre', target: 'sobre' },
        { label: 'Dúvidas', target: 'duvidas' }
      ]
    },
    hero: {
      enabled: true,
      trustItems: ['Curso online', 'Acesso após confirmação', 'Certificado profissional', 'Suporte'],
      proofText: 'Método estruturado para otimizar o atendimento com técnica, segurança e consistência.'
    },
    stickyCta: {
      enabled: true,
      label: 'QUERO MINHA VAGA',
      sublabel: 'Conheça a oferta',
      target: 'planos'
    },
    receive: {
      enabled: true,
      eyebrow: 'TUDO O QUE VOCÊ RECEBE',
      title: 'Uma formação completa, não apenas aulas',
      description: 'O Speed Lash reúne conteúdo técnico, prática orientada e recursos para você estudar com uma sequência clara e aplicar o método com mais segurança.',
      items: [
        { title: '5 módulos + módulo bônus', text: 'Conteúdo organizado do preparo à finalização, com prática e gestão do atendimento.' },
        { title: 'Certificado profissional', text: 'Conclusão com certificado para valorizar sua formação e trajetória profissional.' },
        { title: 'Suporte durante a formação', text: 'Apoio para dúvidas e acompanhamento durante o processo de aprendizagem.' },
        { title: 'Materiais complementares', text: 'Conteúdos extras para reforçar o estudo e a execução das técnicas.' },
        { title: 'Técnicas procuradas', text: 'Volume Russo, Capping e Efeito Molhado dentro da metodologia do curso.' },
        { title: '7 dias de garantia', text: 'Período de garantia apresentado na própria oferta do Speed Lash.' }
      ]
    },
    authority: {
      enabled: true,
      title: 'Experiência que sustenta o método',
      description: 'Os números abaixo reproduzem as informações apresentadas na própria página e podem ser editados pelo painel.',
      stats: [
        { value: 'Mais de 4 anos', label: 'de experiência profissional' },
        { value: 'Mais de 9 mil', label: 'atendimentos realizados' },
        { value: 'Palestrante e jurada', label: 'em eventos e campeonatos' }
      ]
    },
    offerTrust: {
      enabled: true,
      items: ['Pagamento seguro', '7 dias de garantia', 'Acesso após confirmação', 'Checkout protegido']
    },
    faq: {
      enabled: true,
      title: 'Mais dúvidas antes de começar?',
      items: [
        { question: 'O curso tem certificado?', answer: 'Sim. A formação inclui certificado de conclusão, apresentado em uma seção própria desta página.' },
        { question: 'Quais técnicas estão incluídas?', answer: 'O conteúdo apresentado inclui Volume Russo, Capping e Efeito Molhado, além de fundamentos, patologia ocular, treino prático, finalização e gestão.' },
        { question: 'Como funciona a garantia?', answer: 'A oferta informa garantia incondicional de 7 dias. Consulte os termos da compra para os detalhes aplicáveis ao seu pedido.' },
        { question: 'Quando recebo meu acesso?', answer: 'O acesso é liberado conforme a confirmação do pagamento pela plataforma de checkout. As instruções são enviadas no fluxo da compra.' }
      ]
    },
    microInteractions: true
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clone = value => JSON.parse(JSON.stringify(value));

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      ...clone(DEFAULT),
      ...raw,
      navigation: { ...clone(DEFAULT.navigation), ...(raw.navigation || {}), items: Array.isArray(raw.navigation?.items) ? raw.navigation.items : clone(DEFAULT.navigation.items) },
      hero: { ...clone(DEFAULT.hero), ...(raw.hero || {}), trustItems: Array.isArray(raw.hero?.trustItems) ? raw.hero.trustItems : clone(DEFAULT.hero.trustItems) },
      stickyCta: { ...clone(DEFAULT.stickyCta), ...(raw.stickyCta || {}) },
      receive: { ...clone(DEFAULT.receive), ...(raw.receive || {}), items: Array.isArray(raw.receive?.items) ? raw.receive.items : clone(DEFAULT.receive.items) },
      authority: { ...clone(DEFAULT.authority), ...(raw.authority || {}), stats: Array.isArray(raw.authority?.stats) ? raw.authority.stats : clone(DEFAULT.authority.stats) },
      offerTrust: { ...clone(DEFAULT.offerTrust), ...(raw.offerTrust || {}), items: Array.isArray(raw.offerTrust?.items) ? raw.offerTrust.items : clone(DEFAULT.offerTrust.items) },
      faq: { ...clone(DEFAULT.faq), ...(raw.faq || {}), items: Array.isArray(raw.faq?.items) ? raw.faq.items : clone(DEFAULT.faq.items) },
      enabled: raw.enabled !== false,
      microInteractions: raw.microInteractions !== false
    };
  }

  function cleanup() {
    ['conversionNav','conversionHeroTrust','conversionStickyCta','conversionReceive','conversionAuthority','conversionOfferTrust','conversionFaqExtras'].forEach(id => document.getElementById(id)?.remove());
    document.documentElement.classList.remove('conversion-enhanced');
    $$('.conversion-reveal,.conversion-revealed').forEach(el => el.classList.remove('conversion-reveal','conversion-revealed'));
  }

  function replaceLegacyCopy(root = document) {
    const replacements = [
      [/Start Lashes/g, 'Speed Lash'],
      [/JK Academy/g, 'Ly Cílios'],
      [/\bJamily\b/g, 'Lyzandra']
    ];
    const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        const text = node.nodeValue || '';
        return (text.includes('Start Lashes') || text.includes('JK Academy') || text.includes('Jamily')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode => {
      let text = textNode.nodeValue || '';
      replacements.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); });
      textNode.nodeValue = text;
    });
  }

  function setSectionIds() {
    const ids = {
      'section-001': 'inicio',
      'section-002': 'resultados',
      'section-003': 'metodo',
      'section-004': 'tecnicas',
      'section-005': 'conteudo',
      'section-006': 'certificado',
      'section-007': 'sobre',
      'section-008': 'diferenciais',
      'section-009': 'planos',
      'section-010': 'duvidas'
    };
    Object.entries(ids).forEach(([editId, id]) => {
      const section = $(`section[data-edit-id="${editId}"]`);
      if (section) section.id = id;
    });
  }

  function targetHref(target) {
    const value = String(target || '').trim();
    if (!value) return '#planos';
    if (/^(https?:|mailto:|tel:|#)/i.test(value)) return value;
    return `#${value.replace(/^#/, '')}`;
  }

  function ensureNavigation(config) {
    document.getElementById('conversionNav')?.remove();
    if (!config.navigation.enabled) return;
    const nav = document.createElement('header');
    nav.id = 'conversionNav';
    nav.className = 'conversion-nav';
    const inner = document.createElement('div');
    inner.className = 'conversion-nav__inner';
    const brand = document.createElement('a');
    brand.className = 'conversion-nav__brand';
    brand.href = '#inicio';
    brand.textContent = config.navigation.brand || 'Speed Lash';
    const links = document.createElement('nav');
    links.className = 'conversion-nav__links';
    (config.navigation.items || []).filter(item => item?.label && item?.target).forEach(item => {
      const link = document.createElement('a');
      link.href = targetHref(item.target);
      link.textContent = item.label;
      links.appendChild(link);
    });
    const cta = document.createElement('a');
    cta.className = 'conversion-nav__cta';
    cta.href = '#planos';
    cta.textContent = config.navigation.ctaLabel || 'Quero minha vaga';
    inner.append(brand, links, cta);
    nav.appendChild(inner);
    document.body.prepend(nav);
  }

  function ensureHero(config) {
    document.getElementById('conversionHeroTrust')?.remove();
    if (!config.hero.enabled) return;
    const section = $('#inicio');
    const ctaHost = section?.querySelector('[data-edit-id="div-005"]');
    if (!section || !ctaHost) return;
    const box = document.createElement('div');
    box.id = 'conversionHeroTrust';
    box.className = 'conversion-hero-trust';
    const list = document.createElement('div');
    list.className = 'conversion-hero-trust__list';
    (config.hero.trustItems || []).filter(Boolean).forEach(value => {
      const chip = document.createElement('span');
      chip.innerHTML = `<b aria-hidden="true">✓</b>${String(value)}`;
      list.appendChild(chip);
    });
    box.appendChild(list);
    if (config.hero.proofText) {
      const proof = document.createElement('p');
      proof.textContent = config.hero.proofText;
      box.appendChild(proof);
    }
    ctaHost.parentElement.insertBefore(box, ctaHost);
  }

  function ensureStickyCta(config) {
    document.getElementById('conversionStickyCta')?.remove();
    if (!config.stickyCta.enabled) return;
    const wrap = document.createElement('aside');
    wrap.id = 'conversionStickyCta';
    wrap.className = 'conversion-sticky-cta';
    const link = document.createElement('a');
    link.href = targetHref(config.stickyCta.target || 'planos');
    const text = document.createElement('span');
    text.innerHTML = `<strong>${config.stickyCta.label || 'QUERO MINHA VAGA'}</strong><small>${config.stickyCta.sublabel || ''}</small>`;
    const arrow = document.createElement('b');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    link.append(text, arrow);
    wrap.appendChild(link);
    document.body.appendChild(wrap);

    const hero = $('#inicio');
    if ('IntersectionObserver' in window && hero) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries[0]?.isIntersecting;
        wrap.classList.toggle('is-visible', !visible);
      }, { threshold: 0.08 });
      observer.observe(hero);
    } else wrap.classList.add('is-visible');
  }

  function iconSvg(index) {
    const icons = [
      '<path d="M20 6 9 17l-5-5"/>',
      '<path d="M12 2v20M2 12h20"/>',
      '<path d="M4 4h16v16H4z"/><path d="m9 12 2 2 4-4"/>',
      '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
      '<path d="M4 19h16M7 16V8l5-4 5 4v8"/>',
      '<path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7z"/><path d="m9 12 2 2 4-4"/>'
    ];
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[index % icons.length]}</svg>`;
  }

  function ensureReceive(config) {
    document.getElementById('conversionReceive')?.remove();
    if (!config.receive.enabled) return;
    const offer = $('#planos');
    if (!offer?.parentElement) return;
    const section = document.createElement('section');
    section.id = 'conversionReceive';
    section.className = 'conversion-receive';
    const cards = (config.receive.items || []).filter(item => item?.title).map((item, index) => `
      <article class="conversion-receive__card">
        <span class="conversion-receive__icon">${iconSvg(index)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text || '')}</p>
      </article>`).join('');
    section.innerHTML = `
      <div class="conversion-shell">
        <span class="conversion-eyebrow">${escapeHtml(config.receive.eyebrow || '')}</span>
        <h2>${escapeHtml(config.receive.title || '')}</h2>
        <p class="conversion-lead">${escapeHtml(config.receive.description || '')}</p>
        <div class="conversion-receive__grid">${cards}</div>
      </div>`;
    offer.parentElement.insertBefore(section, offer);
  }

  function ensureAuthority(config) {
    document.getElementById('conversionAuthority')?.remove();
    if (!config.authority.enabled) return;
    const section = $('#sobre');
    const host = section?.querySelector(':scope > div') || section;
    if (!section || !host) return;
    const box = document.createElement('div');
    box.id = 'conversionAuthority';
    box.className = 'conversion-authority';
    const stats = (config.authority.stats || []).filter(item => item?.value || item?.label).map(item => `
      <div class="conversion-authority__stat"><strong>${escapeHtml(item.value || '')}</strong><span>${escapeHtml(item.label || '')}</span></div>`).join('');
    box.innerHTML = `<div class="conversion-authority__copy"><h3>${escapeHtml(config.authority.title || '')}</h3><p>${escapeHtml(config.authority.description || '')}</p></div><div class="conversion-authority__stats">${stats}</div>`;
    host.appendChild(box);
  }

  function ensureOfferTrust(config) {
    document.getElementById('conversionOfferTrust')?.remove();
    if (!config.offerTrust.enabled) return;
    const section = $('#planos');
    const actionBox = section?.querySelector('[data-edit-id="div-052"]');
    if (!actionBox) return;
    const row = document.createElement('div');
    row.id = 'conversionOfferTrust';
    row.className = 'conversion-offer-trust';
    (config.offerTrust.items || []).filter(Boolean).forEach(item => {
      const span = document.createElement('span');
      span.innerHTML = `<b aria-hidden="true">✓</b>${escapeHtml(item)}`;
      row.appendChild(span);
    });
    actionBox.appendChild(row);
    section.classList.add('conversion-offer-enhanced');
  }

  function makeFaqItem(item, index) {
    const article = document.createElement('article');
    article.className = 'conversion-faq-item';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = `<span>${escapeHtml(item.question || '')}</span><b aria-hidden="true">+</b>`;
    const answer = document.createElement('div');
    answer.className = 'conversion-faq-answer';
    answer.innerHTML = `<p>${escapeHtml(item.answer || '')}</p>`;
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', open ? 'false' : 'true');
      button.querySelector('b').textContent = open ? '+' : '−';
      answer.classList.toggle('is-open', !open);
    });
    article.append(button, answer);
    return article;
  }

  function ensureFaq(config) {
    document.getElementById('conversionFaqExtras')?.remove();
    if (!config.faq.enabled) return;
    const section = $('#duvidas');
    const host = section?.querySelector(':scope > div') || section;
    if (!section || !host) return;
    const box = document.createElement('div');
    box.id = 'conversionFaqExtras';
    box.className = 'conversion-faq-extra';
    if (config.faq.title) {
      const title = document.createElement('h3');
      title.textContent = config.faq.title;
      box.appendChild(title);
    }
    (config.faq.items || []).filter(item => item?.question).forEach((item, index) => box.appendChild(makeFaqItem(item, index)));
    host.appendChild(box);
  }

  function improveTestimonials() {
    const section = $('#resultados');
    if (!section) return;
    section.querySelectorAll('article').forEach(article => {
      const header = article.querySelector(':scope > div:first-child');
      if (!header || header.querySelector('[data-speed-lash-role]')) return;
      const name = header.querySelector('.font-semibold');
      if (!name) return;
      const group = document.createElement('span');
      group.style.cssText = 'display:grid;gap:1px;';
      const clonedName = name.cloneNode(true);
      const role = document.createElement('small');
      role.dataset.speedLashRole = '1';
      role.textContent = 'Aluna Speed Lash';
      role.style.cssText = 'font-size:9px;line-height:1.2;color:#8b7f84;font-weight:500;letter-spacing:.02em;';
      group.append(clonedName, role);
      name.replaceWith(group);
    });
  }

  function optimizeMedia() {
    const images = $$('img');
    images.forEach((img, index) => {
      img.decoding = 'async';
      if (img.closest('#inicio') && index < 2) {
        img.loading = 'eager';
        img.setAttribute('fetchpriority', 'high');
      } else if (!img.hasAttribute('loading')) img.loading = 'lazy';
    });
    $$('iframe').forEach(frame => { if (!frame.hasAttribute('loading')) frame.loading = 'lazy'; });
  }

  function initMicroInteractions(config) {
    if (!config.microInteractions || !('IntersectionObserver' in window)) return;
    const targets = $$('main > section, #conversionReceive, .conversion-receive__card, .conversion-authority__stat').filter(el => !el.classList.contains('conversion-reveal'));
    targets.forEach(el => el.classList.add('conversion-reveal'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('conversion-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px' });
    targets.forEach(el => observer.observe(el));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  }

  function apply(data = {}) {
    const config = normalize(data?.site?.conversion || {});
    cleanup();
    replaceLegacyCopy(document);
    setSectionIds();
    if (!config.enabled) return;
    document.documentElement.classList.add('conversion-enhanced');
    ensureNavigation(config);
    ensureHero(config);
    ensureStickyCta(config);
    ensureReceive(config);
    ensureAuthority(config);
    ensureOfferTrust(config);
    ensureFaq(config);
    improveTestimonials();
    optimizeMedia();
    initMicroInteractions(config);
  }

  async function fallbackLoad() {
    if (window.__SITE_CONTENT__) return apply(window.__SITE_CONTENT__);
    try {
      const response = await fetch('/api/content', { cache: 'no-store' });
      const data = response.ok ? await response.json() : {};
      apply(data);
    } catch {
      apply({});
    }
  }

  window.LyzandraConversion = { apply, normalize, DEFAULT: clone(DEFAULT) };
  window.addEventListener('site-content-ready', event => apply(event.detail || window.__SITE_CONTENT__ || {}));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(fallbackLoad, 80), { once: true });
  else setTimeout(fallbackLoad, 80);
})();
