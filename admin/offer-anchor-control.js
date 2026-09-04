(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const generalBtn = document.querySelector('#generalBtn');
  if (!preview || !editorBox || !generalBtn) return;

  const DEFAULT = { target: '#oferta-card', offset: 24, smooth: true };
  let settings = { ...DEFAULT };
  let loaded = false;
  let saving = false;
  let saveTimer = 0;

  async function api(url, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (opts.body && !(opts.body instanceof FormData)) headers['content-type'] = 'application/json';
    const response = await fetch(url, { ...opts, headers });
    let data = {};
    try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data.error || `Erro ${response.status}`);
    return data;
  }

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    let target = String(raw.target || DEFAULT.target).trim();
    if (target && !/^(https?:|mailto:|tel:|#)/i.test(target)) target = `#${target.replace(/^#/, '')}`;
    return {
      target: target || DEFAULT.target,
      offset: Math.max(0, Math.min(300, Number(raw.offset ?? DEFAULT.offset) || 0)),
      smooth: raw.smooth !== false
    };
  }

  function toast(message) {
    const box = document.querySelector('#toast');
    if (!box) return;
    box.textContent = message;
    box.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.add('hidden'), 2800);
  }

  function isGeneral() {
    return /Configurações gerais/i.test(document.querySelector('#sectorTitle')?.textContent || '');
  }

  function applyPreview() {
    const win = preview.contentWindow;
    if (!win) return;
    win.__SITE_CONTENT__ = win.__SITE_CONTENT__ || {};
    win.__SITE_CONTENT__.site = win.__SITE_CONTENT__.site || {};
    win.__SITE_CONTENT__.site.primaryCta = { ...settings };
    win.LyzandraOfferAnchor?.apply?.({ site: { primaryCta: { ...settings } } });
  }

  async function load() {
    if (loaded) return;
    try {
      const content = await api('/api/content');
      settings = normalize(content?.site?.primaryCta || {});
    } catch {
      settings = { ...DEFAULT };
    }
    loaded = true;
    applyPreview();
  }

  async function persist(showToast = true) {
    if (saving) return;
    saving = true;
    try {
      const content = await api('/api/content');
      content.site = { ...(content.site || {}), primaryCta: normalize(settings) };
      await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
      settings = normalize(settings);
      applyPreview();
      render(true);
      if (showToast) toast('Destino do botão principal salvo.');
    } catch (error) {
      toast(error.message);
    } finally {
      saving = false;
    }
  }

  function schedulePersist() {
    applyPreview();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persist(false), 650);
  }

  function targetLabel(target) {
    if (target === '#oferta-card') return 'Card exato de preço e compra';
    if (target === '#planos') return 'Início da seção de oferta';
    return 'Destino personalizado';
  }

  function render(force = false) {
    if (!isGeneral() || !loaded) return;
    const existing = document.querySelector('#offerAnchorControlCard');
    if (existing && !force) return;
    existing?.remove();

    const card = document.createElement('div');
    card.id = 'offerAnchorControlCard';
    card.className = 'general-card';
    card.style.cssText += ';display:grid;gap:10px;';
    card.innerHTML = '<h3 style="margin:0">Destino do botão principal</h3><p style="font-size:10px;color:#807981;line-height:1.55;margin:-3px 0 2px">Controla para onde o botão “QUERO MINHA VAGA” do primeiro bloco leva a visitante. O padrão abre exatamente no topo do card de preço.</p>';

    const presetWrap = document.createElement('div');
    presetWrap.className = 'mini-field';
    const presetLabel = document.createElement('label');
    presetLabel.textContent = 'Destino';
    const select = document.createElement('select');
    select.innerHTML = '<option value="#oferta-card">Card de preço (recomendado)</option><option value="#planos">Início da seção de oferta</option><option value="__custom__">Personalizado</option>';
    select.value = ['#oferta-card', '#planos'].includes(settings.target) ? settings.target : '__custom__';
    presetWrap.append(presetLabel, select);
    card.appendChild(presetWrap);

    const customWrap = document.createElement('div');
    customWrap.className = 'mini-field';
    customWrap.style.display = select.value === '__custom__' ? 'grid' : 'none';
    const customLabel = document.createElement('label');
    customLabel.textContent = 'Âncora ou URL personalizada';
    const custom = document.createElement('input');
    custom.type = 'text';
    custom.value = select.value === '__custom__' ? settings.target : '';
    custom.placeholder = '#certificado ou https://...';
    customWrap.append(customLabel, custom);
    card.appendChild(customWrap);

    const offsetWrap = document.createElement('div');
    offsetWrap.className = 'mini-field';
    const offsetLabel = document.createElement('label');
    offsetLabel.textContent = 'Margem acima do destino (px)';
    const offset = document.createElement('input');
    offset.type = 'number';
    offset.min = '0';
    offset.max = '300';
    offset.step = '1';
    offset.value = String(settings.offset);
    offsetWrap.append(offsetLabel, offset);
    card.appendChild(offsetWrap);

    const smoothRow = document.createElement('label');
    smoothRow.className = 'visibility-line';
    const smoothText = document.createElement('span');
    smoothText.textContent = 'Usar rolagem suave';
    const smooth = document.createElement('input');
    smooth.type = 'checkbox';
    smooth.checked = settings.smooth !== false;
    smoothRow.append(smoothText, smooth);
    card.appendChild(smoothRow);

    const status = document.createElement('div');
    status.style.cssText = 'font-size:10px;line-height:1.45;padding:8px 10px;border-radius:10px;border:1px solid #eee8eb;background:#faf8f9;color:#6f6870;';
    status.textContent = `Atual: ${targetLabel(settings.target)} · ${settings.offset}px de margem.`;
    card.appendChild(status);

    select.onchange = () => {
      customWrap.style.display = select.value === '__custom__' ? 'grid' : 'none';
      if (select.value !== '__custom__') {
        settings.target = select.value;
        schedulePersist();
        render(true);
      }
    };
    custom.oninput = () => {
      settings.target = custom.value.trim() || DEFAULT.target;
      schedulePersist();
    };
    offset.oninput = () => {
      settings.offset = Math.max(0, Math.min(300, Number(offset.value) || 0));
      schedulePersist();
    };
    smooth.onchange = () => {
      settings.smooth = smooth.checked;
      schedulePersist();
    };

    const mobile = document.querySelector('#mobileStickyControlCard');
    const conversion = document.querySelector('#conversionExperienceCard');
    if (mobile?.parentElement === editorBox) mobile.insertAdjacentElement('afterend', card);
    else if (conversion?.parentElement === editorBox) conversion.insertAdjacentElement('afterend', card);
    else editorBox.appendChild(card);
  }

  const refresh = () => {
    if (!loaded) load().then(() => render(true));
    else render();
  };

  preview.addEventListener('load', () => setTimeout(applyPreview, 350));
  new MutationObserver(refresh).observe(editorBox, { childList: true, subtree: true });
  const title = document.querySelector('#sectorTitle');
  if (title) new MutationObserver(refresh).observe(title, { childList: true, subtree: true, characterData: true });
  setTimeout(() => load().then(() => render(true)).catch(error => toast(error.message)), 500);
})();
