(() => {
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  if (!editorBox || !saveBtn) return;

  const DEFAULT = {
    enabled: false,
    mode: 'direct',
    metaPixelId: '',
    metaDomainVerification: '',
    googleAnalyticsId: '',
    googleAdsId: '',
    googleAdsLeadLabel: '',
    googleAdsCheckoutLabel: '',
    conversionValue: '',
    currency: 'BRL',
    gtmId: '',
    consent: {
      enabled: true,
      title: 'Privacidade e cookies',
      text: 'Usamos cookies e tecnologias de medição para entender o uso do site e melhorar nossos anúncios.',
      privacyUrl: '/privacidade.html'
    }
  };

  let marketing = JSON.parse(JSON.stringify(DEFAULT));
  let loaded = false;
  let dirty = false;

  const clone = value => JSON.parse(JSON.stringify(value));
  const clean = value => String(value || '').trim();

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      ...clone(DEFAULT),
      ...raw,
      enabled: raw.enabled === true,
      mode: raw.mode === 'gtm' ? 'gtm' : 'direct',
      metaPixelId: clean(raw.metaPixelId),
      metaDomainVerification: clean(raw.metaDomainVerification),
      googleAnalyticsId: clean(raw.googleAnalyticsId).toUpperCase(),
      googleAdsId: clean(raw.googleAdsId).toUpperCase(),
      googleAdsLeadLabel: clean(raw.googleAdsLeadLabel),
      googleAdsCheckoutLabel: clean(raw.googleAdsCheckoutLabel),
      conversionValue: clean(raw.conversionValue),
      currency: clean(raw.currency || 'BRL').toUpperCase() || 'BRL',
      gtmId: clean(raw.gtmId).toUpperCase(),
      consent: { ...DEFAULT.consent, ...((raw && raw.consent) || {}) }
    };
  }

  async function api(url, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (opts.body && !(opts.body instanceof FormData)) headers['content-type'] = 'application/json';
    const response = await fetch(url, { ...opts, headers });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data.error || `Erro ${response.status}`);
    return data;
  }

  function toast(message) {
    const box = document.querySelector('#toast');
    if (!box) return;
    box.textContent = message;
    box.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.add('hidden'), 4200);
  }

  function markDirty() {
    dirty = true;
    const status = document.querySelector('#saveStatus');
    if (!status) return;
    status.classList.add('dirty');
    status.classList.remove('saved');
    const text = status.querySelector('span:last-child');
    if (text) text.textContent = 'Alterações não salvas';
  }

  async function ensureLoaded() {
    if (loaded) return;
    try {
      const content = await api('/api/content');
      marketing = normalize(content.site?.marketing);
    } catch {
      marketing = normalize();
    }
    loaded = true;
  }

  function field(label, input, hint = '') {
    const wrap = document.createElement('div');
    wrap.className = 'mini-field';
    const lab = document.createElement('label');
    lab.textContent = label;
    wrap.appendChild(lab);
    if (hint) {
      const small = document.createElement('small');
      small.textContent = hint;
      small.style.cssText = 'display:block;color:#807981;font-size:10px;line-height:1.45;margin:-2px 0 5px;';
      wrap.appendChild(small);
    }
    wrap.appendChild(input);
    return wrap;
  }

  function input(value, placeholder, onInput) {
    const el = document.createElement('input');
    el.type = 'text';
    el.value = value || '';
    el.placeholder = placeholder || '';
    el.autocomplete = 'off';
    el.oninput = () => onInput(el.value);
    return el;
  }

  function textarea(value, placeholder, onInput) {
    const el = document.createElement('textarea');
    el.rows = 3;
    el.value = value || '';
    el.placeholder = placeholder || '';
    el.oninput = () => onInput(el.value);
    return el;
  }

  function select(value, options, onChange) {
    const el = document.createElement('select');
    options.forEach(([key, label]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = label;
      el.appendChild(option);
    });
    el.value = value;
    el.onchange = () => onChange(el.value);
    return el;
  }

  function checkbox(label, checked, onChange) {
    const row = document.createElement('label');
    row.className = 'visibility-line';
    const text = document.createElement('span');
    text.textContent = label;
    const el = document.createElement('input');
    el.type = 'checkbox';
    el.checked = checked;
    el.onchange = () => onChange(el.checked);
    row.append(text, el);
    return row;
  }

  function section(title, description = '') {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'padding:12px 0;border-top:1px solid #efedef;display:grid;gap:10px;';
    const head = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = title;
    strong.style.fontSize = '12px';
    head.appendChild(strong);
    if (description) {
      const p = document.createElement('p');
      p.textContent = description;
      p.style.cssText = 'font-size:10px;color:#807981;line-height:1.45;margin:4px 0 0;';
      head.appendChild(p);
    }
    wrap.appendChild(head);
    return wrap;
  }

  function changed(rerender = false) {
    markDirty();
    if (rerender) renderMarketingCard(true);
  }

  function checkoutHref() {
    const preview = document.querySelector('#preview');
    const anchor = preview?.contentDocument?.querySelector('[data-edit-id="a-002"]');
    return clean(anchor?.getAttribute('href'));
  }

  function validStatus() {
    const issues = [];
    if (!marketing.enabled) return { ok: true, text: 'Rastreamento preparado, mas desativado.' };

    if (marketing.mode === 'gtm') {
      if (!/^GTM-[A-Z0-9]+$/i.test(marketing.gtmId)) issues.push('Informe um ID GTM válido, como GTM-ABC1234.');
    } else {
      if (marketing.metaPixelId && !/^\d{5,25}$/.test(marketing.metaPixelId)) issues.push('O Meta Pixel ID deve conter somente números.');
      if (marketing.googleAnalyticsId && !/^G-[A-Z0-9]+$/i.test(marketing.googleAnalyticsId)) issues.push('O ID do GA4 deve começar com G-.');
      if (marketing.googleAdsId && !/^AW-\d+$/i.test(marketing.googleAdsId)) issues.push('O ID do Google Ads deve começar com AW-.');
      if (!marketing.metaPixelId && !marketing.googleAnalyticsId && !marketing.googleAdsId) issues.push('Informe ao menos um ID de rastreamento.');
      if ((marketing.googleAdsLeadLabel || marketing.googleAdsCheckoutLabel) && !marketing.googleAdsId) issues.push('Os rótulos de conversão precisam de um Google Ads ID.');
    }

    if (marketing.consent.enabled !== false && !clean(marketing.consent.privacyUrl)) {
      issues.push('Informe a Política de Privacidade para o aviso de consentimento.');
    }

    const href = checkoutHref();
    if (!href || href === '#') issues.push('O botão principal de compra ainda está sem um link de checkout real.');

    return issues.length ? { ok: false, text: issues.join(' ') } : { ok: true, text: 'Configuração técnica da landing page válida. Falta apenas validar os disparos nas plataformas e no checkout.' };
  }

  async function renderMarketingCard(force = false) {
    const titleText = document.querySelector('#sectorTitle')?.textContent || '';
    if (!/Configurações gerais/i.test(titleText)) return;
    await ensureLoaded();

    const existing = document.querySelector('#marketingVisualCard');
    if (existing && !force) return;
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'marketingVisualCard';
    card.className = 'general-card';
    card.style.cssText += ';display:grid;gap:10px;';
    card.innerHTML = '<h3 style="margin:0">Marketing, Pixel e Ads</h3><p style="font-size:10px;color:#807981;line-height:1.5;margin:-3px 0 4px">Meta Pixel, Google Analytics, Google Ads ou Google Tag Manager com proteção contra disparos duplicados.</p>';

    card.appendChild(checkbox('Ativar rastreamento no site público', marketing.enabled === true, value => {
      marketing.enabled = value;
      changed(true);
    }));

    card.appendChild(field('Como instalar as tags?', select(marketing.mode, [
      ['direct', 'Direto pelo site (Meta + Google)'],
      ['gtm', 'Google Tag Manager (GTM)']
    ], value => {
      marketing.mode = value;
      changed(true);
    }), 'Escolha apenas um método. Não instale as mesmas tags novamente pelo GTM se estiver usando o modo direto.'));

    if (marketing.mode === 'direct') {
      const meta = section('Meta', 'A landing dispara PageView. WhatsApp dispara Contact. O clique para o checkout é um evento personalizado CheckoutClick para não duplicar o InitiateCheckout que a plataforma de checkout deve disparar.');
      meta.appendChild(field('Meta Pixel ID', input(marketing.metaPixelId, 'Ex.: 123456789012345', value => {
        marketing.metaPixelId = clean(value);
        changed();
      }), 'Use o mesmo Pixel também na sua plataforma de checkout para que ela registre InitiateCheckout e Purchase.'));
      meta.appendChild(field('Verificação de domínio da Meta (opcional)', input(marketing.metaDomainVerification, 'Cole apenas o código de verificação', value => {
        marketing.metaDomainVerification = clean(value);
        changed();
      }), 'Para campanha real, prefira verificar o domínio por DNS na Meta. Se usar Kiwify, conecte também o domínio de pixels recomendado pela própria Kiwify.'));
      card.appendChild(meta);

      const google = section('Google', 'O site carrega gtag.js uma única vez. O checkout deve registrar begin_checkout e purchase; a landing registra apenas o clique que levou até ele.');
      google.appendChild(field('Google Analytics 4 — ID de medição', input(marketing.googleAnalyticsId, 'G-XXXXXXXXXX', value => {
        marketing.googleAnalyticsId = clean(value).toUpperCase();
        changed();
      }), 'Se usar Kiwify, configure este mesmo GA4 no produto para receber begin_checkout e purchase com transaction_id e valor.'));
      google.appendChild(field('Google Ads — ID da tag', input(marketing.googleAdsId, 'AW-123456789', value => {
        marketing.googleAdsId = clean(value).toUpperCase();
        changed();
      }), 'Use o ID AW- da sua conta. A conversão de venda deve ser configurada também no checkout.'));
      google.appendChild(field('Rótulo — clique no WhatsApp', input(marketing.googleAdsLeadLabel, 'Ex.: AbC-D_efG-h12_34-567', value => {
        marketing.googleAdsLeadLabel = clean(value);
        changed();
      }), 'Opcional. Use somente se clique no WhatsApp for uma conversão que você realmente quer otimizar.'));
      google.appendChild(field('Rótulo — clique no botão de compra', input(marketing.googleAdsCheckoutLabel, 'Ex.: XyZ-123abc', value => {
        marketing.googleAdsCheckoutLabel = clean(value);
        changed();
      }), 'Opcional e apenas como microconversão. Não use este mesmo rótulo como Purchase ou InitiateCheckout na Kiwify.'));
      google.appendChild(field('Valor da microconversão (opcional)', input(marketing.conversionValue, 'Ex.: 97,00', value => {
        marketing.conversionValue = clean(value);
        changed();
      }), 'Se preencher, o valor é enviado apenas para as conversões de clique configuradas nesta landing. O valor real da venda deve vir do checkout.'));
      google.appendChild(field('Moeda', select(marketing.currency, [['BRL','BRL — Real'],['USD','USD — Dólar'],['EUR','EUR — Euro']], value => {
        marketing.currency = value;
        changed();
      })));
      card.appendChild(google);
    } else {
      const gtm = section('Google Tag Manager', 'Neste modo o site carrega apenas o contêiner GTM. Configure Meta e Google dentro do GTM e respeite o consentimento para não duplicar tags.');
      gtm.appendChild(field('ID do contêiner', input(marketing.gtmId, 'GTM-XXXXXXX', value => {
        marketing.gtmId = clean(value).toUpperCase();
        changed();
      })));
      const events = document.createElement('div');
      events.className = 'quality-note';
      events.textContent = 'Eventos enviados ao dataLayer: whatsapp_click e checkout_click. Não há begin_checkout nem purchase na landing; esses eventos devem vir do checkout.';
      gtm.appendChild(events);
      card.appendChild(gtm);
    }

    const checkout = section('Checkout externo', 'A landing não consegue confirmar uma compra aprovada. A plataforma de checkout precisa disparar os eventos de fundo de funil.');
    const checkoutNote = document.createElement('div');
    checkoutNote.className = 'quality-note';
    checkoutNote.innerHTML = '<strong>Se usar Kiwify:</strong> configure o mesmo Meta Pixel, GA4 e Google Ads dentro do produto na Kiwify. A Kiwify deve registrar InitiateCheckout/begin_checkout e Purchase. Ative também a API de Conversões da Meta na Kiwify. A landing encaminha automaticamente UTM, src/sck e click IDs para links Kiwify.';
    checkout.appendChild(checkoutNote);
    const href = checkoutHref();
    const linkState = document.createElement('div');
    linkState.className = 'quality-note';
    linkState.style.background = href && href !== '#' ? '#f2fbf6' : '#fff6e8';
    linkState.style.color = href && href !== '#' ? '#286344' : '#7b5418';
    linkState.textContent = href && href !== '#' ? `Link de compra detectado: ${href}` : 'ATENÇÃO: o botão de compra ainda está com #. Configure a URL real do checkout antes de anunciar.';
    checkout.appendChild(linkState);
    card.appendChild(checkout);

    const consent = section('Consentimento e privacidade', 'O Google recebe os sinais Consent Mode v2. No modo direto, o Meta Pixel só é carregado depois do aceite. O visitante pode reabrir as opções pelo rodapé.');
    consent.appendChild(checkbox('Mostrar aviso de cookies e consentimento', marketing.consent.enabled !== false, value => {
      marketing.consent.enabled = value;
      changed(true);
    }));
    if (marketing.consent.enabled !== false) {
      consent.appendChild(field('Título do aviso', input(marketing.consent.title, 'Privacidade e cookies', value => {
        marketing.consent.title = value;
        changed();
      })));
      consent.appendChild(field('Texto do aviso', textarea(marketing.consent.text, 'Explique o uso de cookies e medição...', value => {
        marketing.consent.text = value;
        changed();
      })));
      consent.appendChild(field('Link da Política de Privacidade', input(marketing.consent.privacyUrl, '/privacidade.html', value => {
        marketing.consent.privacyUrl = clean(value);
        changed();
      }), 'O projeto já inclui /privacidade.html. Troque apenas se quiser usar outra política.'));
    }
    card.appendChild(consent);

    const status = validStatus();
    const note = document.createElement('div');
    note.className = 'quality-note';
    note.style.background = status.ok ? '#f2fbf6' : '#fff6e8';
    note.style.color = status.ok ? '#286344' : '#7b5418';
    note.textContent = status.text;
    card.appendChild(note);

    const test = document.createElement('button');
    test.type = 'button';
    test.className = 'mini-btn';
    test.textContent = 'Auditar configuração';
    test.onclick = () => {
      const result = validStatus();
      toast(result.text);
    };
    card.appendChild(test);

    editorBox.appendChild(card);
  }

  async function persist() {
    if (!dirty) return;
    const content = await api('/api/content');
    content.site = { ...(content.site || {}), marketing: clone(marketing) };
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    dirty = false;
  }

  const originalSave = saveBtn.onclick;
  saveBtn.onclick = async function(event) {
    if (typeof originalSave === 'function') await originalSave.call(this, event);
    if (!dirty) return;
    try {
      this.disabled = true;
      await persist();
      const status = document.querySelector('#saveStatus');
      if (status) {
        status.classList.remove('dirty');
        status.classList.add('saved');
        const text = status.querySelector('span:last-child');
        if (text) text.textContent = 'Salvo';
      }
      toast('Configurações de marketing salvas.');
    } catch (error) {
      toast(error.message);
    } finally {
      this.disabled = false;
    }
  };

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && dirty) {
      setTimeout(() => persist().catch(error => toast(error.message)), 2100);
    }
  });

  new MutationObserver(() => renderMarketingCard(false)).observe(editorBox, { childList: true, subtree: false });
  renderMarketingCard(false);
})();
