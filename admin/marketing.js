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
    gtmId: '',
    consent: {
      enabled: true,
      title: 'Privacidade e cookies',
      text: 'Usamos cookies e tecnologias de medição para entender o uso do site e melhorar nossos anúncios.',
      privacyUrl: ''
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
    toast.timer = setTimeout(() => box.classList.add('hidden'), 3400);
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
    return issues.length ? { ok: false, text: issues.join(' ') } : { ok: true, text: 'Configuração válida para publicação.' };
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
    card.innerHTML = '<h3 style="margin:0">Marketing, Pixel e Ads</h3><p style="font-size:10px;color:#807981;line-height:1.5;margin:-3px 0 4px">Prepare Meta Pixel, Google Analytics, Google Ads ou Google Tag Manager sem editar o código do site.</p>';

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
    }), 'Escolha apenas um método. Isso evita Pixel ou Google Ads disparando duas vezes.'));

    if (marketing.mode === 'direct') {
      const meta = section('Meta', 'O Pixel dispara PageView automaticamente. Cliques no WhatsApp disparam Contact e o botão de compra dispara InitiateCheckout.');
      meta.appendChild(field('Meta Pixel ID', input(marketing.metaPixelId, 'Ex.: 123456789012345', value => {
        marketing.metaPixelId = clean(value);
        changed();
      }), 'É o número do conjunto de dados/Pixel usado no Gerenciador de Eventos.'));
      meta.appendChild(field('Verificação de domínio da Meta (opcional)', input(marketing.metaDomainVerification, 'Cole apenas o código de verificação', value => {
        marketing.metaDomainVerification = clean(value);
        changed();
      }), 'Gera a meta tag facebook-domain-verification. DNS continua sendo uma alternativa válida.'));
      card.appendChild(meta);

      const google = section('Google', 'O site carrega gtag.js uma única vez e configura os destinos preenchidos abaixo.');
      google.appendChild(field('Google Analytics 4 — ID de medição', input(marketing.googleAnalyticsId, 'G-XXXXXXXXXX', value => {
        marketing.googleAnalyticsId = clean(value).toUpperCase();
        changed();
      })));
      google.appendChild(field('Google Ads — ID da tag', input(marketing.googleAdsId, 'AW-123456789', value => {
        marketing.googleAdsId = clean(value).toUpperCase();
        changed();
      }), 'Use o ID AW- da tag do Google Ads.'));
      google.appendChild(field('Rótulo de conversão — clique no WhatsApp', input(marketing.googleAdsLeadLabel, 'Ex.: AbC-D_efG-h12_34-567', value => {
        marketing.googleAdsLeadLabel = clean(value);
        changed();
      }), 'Opcional. Se preenchido, o clique no WhatsApp envia uma conversão para AW-ID/RÓTULO.'));
      google.appendChild(field('Rótulo de conversão — iniciar compra', input(marketing.googleAdsCheckoutLabel, 'Ex.: XyZ-123abc', value => {
        marketing.googleAdsCheckoutLabel = clean(value);
        changed();
      }), 'Opcional. Dispara ao clicar no botão principal de compra da oferta.'));
      card.appendChild(google);
    } else {
      const gtm = section('Google Tag Manager', 'Neste modo o site carrega apenas o contêiner GTM. Configure Meta Pixel, Google Ads e Analytics dentro do próprio GTM para não duplicar tags.');
      gtm.appendChild(field('ID do contêiner', input(marketing.gtmId, 'GTM-XXXXXXX', value => {
        marketing.gtmId = clean(value).toUpperCase();
        changed();
      })));
      const events = document.createElement('div');
      events.className = 'quality-note';
      events.textContent = 'Eventos enviados ao dataLayer: whatsapp_click e begin_checkout. Eles podem ser usados como acionadores no GTM.';
      gtm.appendChild(events);
      card.appendChild(gtm);
    }

    const consent = section('Consentimento e privacidade', 'Quando ativado, o Google recebe os sinais do Consent Mode. O Meta Pixel só é carregado depois do aceite do visitante.');
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
      consent.appendChild(field('Link da Política de Privacidade', input(marketing.consent.privacyUrl, 'https://.../privacidade', value => {
        marketing.consent.privacyUrl = clean(value);
        changed();
      })));
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
    test.textContent = 'Validar IDs';
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
