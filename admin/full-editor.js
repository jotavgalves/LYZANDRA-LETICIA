(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  const generalBtn = document.querySelector('#generalBtn');
  if (!preview || !editorBox || !saveBtn || !generalBtn) return;

  const API = '/api/full-editor';
  const ICONS = {
    'zap': '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    'shield-plus': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M9 12h6M12 9v6"/>',
    'droplets': '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',
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
    'calendar-heart': '<path d="M12.1 22H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5"/><path d="M16 2v4M3 10h18M8 2v4"/><path d="M18 21s-4-2.5-4-5a2.3 2.3 0 0 1 4-1.5A2.3 2.3 0 0 1 22 16c0 2.5-4 5-4 5Z"/>',
    'trending-up': '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
    'heart': '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>',
    'star': '<path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z"/>',
    'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/>'
  };
  const ICON_OPTIONS = [
    ['zap','Raio / velocidade'],['shield-plus','Proteção / retenção'],['droplets','Efeito molhado'],['badge-check','Certificado'],
    ['book-open','Livro / módulos'],['headset','Suporte'],['files','Materiais'],['eye','Cílios / técnica'],['shield-check','Garantia'],
    ['monitor-play','Curso online'],['key-round','Acesso'],['message-circle','Mensagem'],['credit-card','Pagamento'],['lock','Proteção'],
    ['sparkles','Destaque'],['graduation-cap','Formação'],['clock','Tempo'],['calendar','Agenda'],['calendar-heart','Agenda / cuidado'],
    ['trending-up','Crescimento'],['heart','Cuidado'],['star','Destaque / avaliação'],['check-circle','Confirmação']
  ];

  let patches = {};
  let loaded = false;
  let dirty = false;
  let saveTimer = 0;
  let renderTimer = 0;

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
    toast.timer = setTimeout(() => box.classList.add('hidden'), 3000);
  }

  function isGeneral() {
    return /Configurações gerais/i.test(document.querySelector('#sectorTitle')?.textContent || '');
  }

  function runtime() { return preview.contentWindow?.LyzandraFullEditor || null; }
  function doc() { return preview.contentDocument || null; }

  function iconSvg(name) {
    const key = ICONS[name] ? name : 'sparkles';
    return `<svg data-icon-name="${key}" aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">${ICONS[key]}</svg>`;
  }

  function detectIcon(el) {
    const svg = el?.querySelector?.(':scope > svg');
    const explicit = svg?.getAttribute('data-icon-name');
    if (explicit && ICONS[explicit]) return explicit;
    const cls = String(svg?.getAttribute('class') || '');
    const match = cls.match(/lucide-([a-z0-9-]+)/i);
    return match && ICONS[match[1]] ? match[1] : 'sparkles';
  }

  function iconSelect(value, onChange) {
    const select = document.createElement('select');
    ICON_OPTIONS.forEach(([key, label]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = label;
      select.appendChild(option);
    });
    select.value = ICONS[value] ? value : 'sparkles';
    select.onchange = () => onChange(select.value);
    return select;
  }

  async function ensureLoaded() {
    if (loaded) return;
    try {
      const data = await api(API);
      patches = data?.patches && typeof data.patches === 'object' ? data.patches : {};
    } catch { patches = {}; }
    loaded = true;
    runtime()?.setPatches?.(patches);
  }

  function patchFor(key, el = null) {
    if (!patches[key] || typeof patches[key] !== 'object') patches[key] = {};
    const patch = patches[key];
    if (!Array.isArray(patch.parts) && el && typeof patch.html !== 'string') patch.parts = runtime()?.getParts?.(el) || [];
    return patch;
  }

  function setDirty() {
    dirty = true;
    updateLocalStatus('Alterações pendentes…', true);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persist().catch(error => toast(error.message)), 900);
  }

  function updateLocalStatus(text, pending = false) {
    const status = document.querySelector('#fullEditorStatus');
    if (!status) return;
    status.textContent = text;
    status.style.color = pending ? '#b45309' : '#14804a';
  }

  async function persist(force = false) {
    if (!loaded) await ensureLoaded();
    if (!dirty && !force) return;
    clearTimeout(saveTimer);
    await api(API, { method: 'PUT', body: JSON.stringify({ version: 1, patches }) });
    dirty = false;
    updateLocalStatus('Salvo automaticamente', false);
  }

  function apply(key) {
    const rt = runtime();
    const el = rt?.find?.(key);
    if (el) rt.applyPatch(el, patches[key] || {});
  }

  function setPart(key, el, index, value) {
    const patch = patchFor(key, el);
    delete patch.html;
    patch.parts[index] = value;
    apply(key); setDirty();
  }

  function setAttr(key, el, name, value) {
    const patch = patchFor(key, el);
    patch.attrs = { ...(patch.attrs || {}), [name]: value };
    apply(key); setDirty();
  }

  function setHidden(key, el, hidden) {
    const patch = patchFor(key, el);
    patch.hidden = !!hidden;
    apply(key); setDirty();
  }

  function setFit(key, el, value) {
    const patch = patchFor(key, el);
    patch.fit = value;
    apply(key); setDirty();
  }

  function setIcon(key, el, icon) {
    const patch = patchFor(key, el);
    delete patch.parts;
    patch.html = iconSvg(icon);
    apply(key); setDirty();
  }

  async function upload(file) {
    if (!file) throw new Error('Selecione uma imagem.');
    const fd = new FormData(); fd.append('file', file);
    return api('/api/upload', { method: 'POST', body: fd });
  }

  function zoneLabel(el) {
    const section = el.closest('section');
    if (section) {
      const heading = section.querySelector('h1,h2,h3');
      const text = String(heading?.textContent || '').replace(/\s+/g, ' ').trim();
      if (text) return text.slice(0, 72);
      if (section.id) return section.id;
      if (section.dataset.editId) return section.dataset.editId;
      return 'Seção do site';
    }
    if (el.closest('header')) return 'Cabeçalho e navegação';
    if (el.closest('footer')) return 'Rodapé';
    if (el.closest('aside')) return 'Elementos flutuantes';
    return 'Elementos gerais';
  }

  function isIconHost(el) { return !!el?.querySelector?.(':scope > svg'); }

  function typeLabel(el) {
    if (isIconHost(el) && !String(el.textContent || '').trim()) return 'Ícone';
    if (el.tagName === 'IMG') return 'Imagem';
    if (el.tagName === 'VIDEO' || el.tagName === 'IFRAME') return 'Vídeo / mídia';
    if (el.tagName === 'A') return 'Botão / link';
    if (el.tagName === 'BUTTON') return 'Botão';
    if (['SECTION','HEADER','FOOTER','ASIDE'].includes(el.tagName)) return 'Bloco';
    if (/^H[1-6]$/.test(el.tagName)) return 'Título';
    return 'Texto';
  }

  function previewText(el) {
    if (isIconHost(el) && !String(el.textContent || '').trim()) {
      const context = String(el.parentElement?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90);
      return context ? `Ícone de: ${context}` : 'Ícone gráfico';
    }
    if (el.tagName === 'IMG') return el.getAttribute('alt') || el.getAttribute('src') || 'Imagem';
    if (el.tagName === 'VIDEO' || el.tagName === 'IFRAME') return el.getAttribute('src') || 'Mídia';
    if (['SECTION','HEADER','FOOTER','ASIDE'].includes(el.tagName)) return zoneLabel(el);
    return String(el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  function focusElement(key) {
    const el = runtime()?.find?.(key);
    if (!el) return;
    const d = doc();
    d?.querySelectorAll('.__fullEditorActive').forEach(item => item.classList.remove('__fullEditorActive'));
    let style = d?.getElementById('__fullEditorFocusCss');
    if (d && !style) {
      style = d.createElement('style'); style.id = '__fullEditorFocusCss';
      style.textContent = '.__fullEditorActive{outline:3px solid #22c55e!important;outline-offset:3px!important}'; d.head.appendChild(style);
    }
    el.classList.add('__fullEditorActive'); el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => el.classList.remove('__fullEditorActive'), 1800);
  }

  function makeField(labelText, input) {
    const wrap = document.createElement('div'); wrap.className = 'mini-field';
    const label = document.createElement('label'); label.textContent = labelText;
    wrap.append(label, input); return wrap;
  }

  function makeTextInput(value, multiline = false) {
    const input = multiline ? document.createElement('textarea') : document.createElement('input');
    if (multiline) input.rows = 3; else input.type = 'text';
    input.value = value || ''; return input;
  }

  function makeItem(el) {
    const key = el.getAttribute('data-full-edit-id');
    const card = document.createElement('div');
    card.className = 'control-card full-editor-item';
    card.dataset.search = `${zoneLabel(el)} ${typeLabel(el)} ${previewText(el)}`.toLowerCase();
    card.style.cssText += ';display:grid;gap:9px;';

    const head = document.createElement('div'); head.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;';
    const copy = document.createElement('div');
    const type = document.createElement('div'); type.className = 'control-title'; type.textContent = typeLabel(el);
    const snippet = document.createElement('div'); snippet.className = 'control-preview'; snippet.textContent = previewText(el) || 'Item sem texto visível';
    copy.append(type, snippet);
    const locate = document.createElement('button'); locate.type = 'button'; locate.className = 'mini-btn'; locate.textContent = 'Localizar'; locate.onclick = () => focusElement(key);
    head.append(copy, locate); card.appendChild(head);

    const iconOnly = isIconHost(el) && !String(el.textContent || '').trim();
    if (iconOnly) {
      card.appendChild(makeField('Ícone exibido', iconSelect(detectIcon(el), value => setIcon(key, el, value))));
    } else if (!['SECTION','HEADER','FOOTER','ASIDE','IMG','VIDEO','IFRAME'].includes(el.tagName)) {
      const parts = runtime()?.getParts?.(el) || [];
      parts.forEach((value, index) => {
        const input = makeTextInput(value, value.length > 90);
        input.onfocus = () => focusElement(key);
        input.oninput = () => {
          setPart(key, el, index, input.value);
          snippet.textContent = previewText(el) || 'Item sem texto visível';
          card.dataset.search = `${zoneLabel(el)} ${typeLabel(el)} ${previewText(el)}`.toLowerCase();
        };
        card.appendChild(makeField(parts.length > 1 ? `Parte ${index + 1}` : 'Texto', input));
      });
    }

    if (el.tagName === 'A') {
      const input = makeTextInput(el.getAttribute('href') || ''); input.placeholder = 'https://... ou #secao';
      input.onfocus = () => focusElement(key); input.oninput = () => setAttr(key, el, 'href', input.value);
      card.appendChild(makeField('Destino do link / botão', input));
    }

    if (el.tagName === 'BUTTON' && el.getAttribute('aria-label')) {
      const input = makeTextInput(el.getAttribute('aria-label') || ''); input.oninput = () => setAttr(key, el, 'aria-label', input.value);
      card.appendChild(makeField('Descrição do botão', input));
    }

    if (el.tagName === 'IMG') {
      const thumb = document.createElement('img'); thumb.src = el.getAttribute('src') || ''; thumb.alt = '';
      thumb.style.cssText = 'width:100%;max-height:130px;object-fit:contain;border-radius:10px;background:#f4f1f2;border:1px solid #eee8eb;'; card.appendChild(thumb);
      const actions = document.createElement('div'); actions.className = 'inline-actions';
      const uploadLabel = document.createElement('label'); uploadLabel.className = 'file-label primary-upload'; uploadLabel.innerHTML = 'Trocar imagem<input type="file" accept="image/*">';
      uploadLabel.querySelector('input').onchange = async event => {
        const file = event.target.files?.[0]; if (!file) return;
        try { const result = await upload(file); setAttr(key, el, 'src', result.url); thumb.src = result.url; srcInput.value = result.url; toast('Imagem atualizada.'); }
        catch (error) { toast(error.message); }
      };
      actions.appendChild(uploadLabel); card.appendChild(actions);
      const srcInput = makeTextInput(el.getAttribute('src') || ''); srcInput.onchange = () => { setAttr(key, el, 'src', srcInput.value); thumb.src = srcInput.value; };
      card.appendChild(makeField('Link da imagem', srcInput));
      const altInput = makeTextInput(el.getAttribute('alt') || ''); altInput.oninput = () => setAttr(key, el, 'alt', altInput.value);
      card.appendChild(makeField('Descrição da imagem (alt)', altInput));
      const fit = document.createElement('select');
      fit.innerHTML = '<option value="cover">Preencher quadro</option><option value="contain">Ajustar imagem</option><option value="fill">Esticar para preencher</option>';
      const currentFit = preview.contentWindow?.getComputedStyle(el)?.objectFit || 'cover'; fit.value = ['cover','contain','fill'].includes(currentFit) ? currentFit : 'cover'; fit.onchange = () => setFit(key, el, fit.value);
      card.appendChild(makeField('Ajuste da imagem', fit));
    }

    if (el.tagName === 'VIDEO' || el.tagName === 'IFRAME') {
      const src = makeTextInput(el.getAttribute('src') || ''); src.onchange = () => setAttr(key, el, 'src', src.value);
      card.appendChild(makeField('Fonte da mídia', src));
    }

    const footer = document.createElement('div'); footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #eee8eb;padding-top:8px;';
    const visible = document.createElement('label'); visible.className = 'visibility-line'; visible.style.cssText += ';border:0;padding:0;flex:1;'; visible.innerHTML = '<span>Mostrar no site</span><input type="checkbox">';
    const checkbox = visible.querySelector('input'); checkbox.checked = el.getAttribute('data-full-editor-hidden') !== 'true'; checkbox.onchange = () => setHidden(key, el, !checkbox.checked);
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'mini-btn danger'; reset.textContent = 'Restaurar';
    reset.onclick = async () => {
      if (!patches[key]) return; delete patches[key]; dirty = true;
      try { await persist(true); preview.src = '/?admin-preview=1&t=' + Date.now(); toast('Item restaurado ao conteúdo original.'); }
      catch (error) { toast(error.message); }
    };
    footer.append(visible, reset); card.appendChild(footer); return card;
  }

  function collectGroups() {
    const rt = runtime(); if (!rt) return new Map();
    const elements = rt.scan?.(doc()) || []; const groups = new Map();
    elements.forEach(el => {
      if (!el.isConnected || el.closest('.site-video-player')) return;
      const label = zoneLabel(el); if (!groups.has(label)) groups.set(label, []); groups.get(label).push(el);
    });
    return groups;
  }

  function addShortcut() {
    if (document.querySelector('#fullEditorShortcut')) return;
    const shortcut = document.createElement('button'); shortcut.id = 'fullEditorShortcut'; shortcut.type = 'button'; shortcut.className = 'sector-item general';
    shortcut.innerHTML = '<span class="sector-number">✎</span><span><strong>Editor completo</strong><small>Textos, ícones, links e imagens</small></span>';
    shortcut.onclick = () => { generalBtn.click(); setTimeout(() => document.querySelector('#fullEditorCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180); };
    generalBtn.insertAdjacentElement('afterend', shortcut);
  }

  async function renderCard(force = false) {
    if (!isGeneral()) return;
    if (!loaded) await ensureLoaded();
    const rt = runtime(); if (!rt) return; rt.assign?.(doc());
    const existing = document.querySelector('#fullEditorCard'); if (existing && !force) return; existing?.remove();

    const card = document.createElement('div'); card.id = 'fullEditorCard'; card.className = 'general-card'; card.style.cssText += ';display:grid;gap:12px;';
    const title = document.createElement('h3'); title.style.margin = '0'; title.textContent = 'Editor completo do site';
    const description = document.createElement('p'); description.style.cssText = 'font-size:10px;color:#807981;line-height:1.55;margin:-4px 0 0;';
    description.textContent = 'Edite textos, botões, links, imagens e também ícones. O scanner roda depois dos módulos dinâmicos, então os blocos de conversão e certificado também aparecem aqui.';
    const statusRow = document.createElement('div'); statusRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;';
    const status = document.createElement('small'); status.id = 'fullEditorStatus'; status.style.cssText = 'font-size:10px;color:#14804a;font-weight:650;'; status.textContent = 'Salvo automaticamente';
    const refresh = document.createElement('button'); refresh.type = 'button'; refresh.className = 'mini-btn'; refresh.textContent = 'Reexaminar página'; refresh.onclick = () => renderCard(true);
    statusRow.append(status, refresh);
    const search = document.createElement('input'); search.type = 'search'; search.placeholder = 'Buscar texto, seção, botão, ícone ou imagem…'; search.style.cssText = 'width:100%;border:1px solid #e8e0e4;border-radius:11px;padding:10px 11px;font:inherit;font-size:11px;background:#fff;';
    const list = document.createElement('div'); list.style.cssText = 'display:grid;gap:9px;';
    const groups = collectGroups(); let itemCount = 0;

    groups.forEach((elements, label) => {
      const detail = document.createElement('details'); detail.className = 'full-editor-group'; detail.style.cssText = 'border:1px solid #eee8eb;border-radius:14px;background:#fff;overflow:hidden;';
      const summary = document.createElement('summary'); summary.style.cssText = 'cursor:pointer;padding:12px 13px;font-size:11px;font-weight:750;color:#292427;display:flex;justify-content:space-between;gap:10px;'; summary.innerHTML = '<span></span><small style="color:#92868d;font-weight:600"></small>';
      summary.querySelector('span').textContent = label; summary.querySelector('small').textContent = `${elements.length} itens`;
      const body = document.createElement('div'); body.style.cssText = 'display:grid;gap:8px;padding:0 10px 10px;';
      elements.forEach(el => { body.appendChild(makeItem(el)); itemCount += 1; }); detail.append(summary, body); list.appendChild(detail);
    });

    const count = document.createElement('div'); count.style.cssText = 'font-size:10px;color:#807981;'; count.textContent = `${itemCount} conteúdos editáveis encontrados em ${groups.size} áreas.`;
    search.oninput = () => {
      const query = search.value.trim().toLowerCase();
      list.querySelectorAll('.full-editor-group').forEach(group => {
        let visibleCount = 0;
        group.querySelectorAll('.full-editor-item').forEach(item => { const match = !query || item.dataset.search.includes(query); item.style.display = match ? '' : 'none'; if (match) visibleCount += 1; });
        group.style.display = visibleCount ? '' : 'none'; if (query && visibleCount) group.open = true;
      });
    };
    card.append(title, description, statusRow, search, count, list); editorBox.appendChild(card);
  }

  function scheduleRender(force = false) { clearTimeout(renderTimer); renderTimer = setTimeout(() => renderCard(force).catch(error => toast(error.message)), 100); }

  preview.addEventListener('load', () => {
    loaded = false;
    setTimeout(async () => { await ensureLoaded(); runtime()?.setPatches?.(patches); scheduleRender(true); }, 500);
  });
  window.addEventListener('full-editor-ready', () => scheduleRender(true));
  new MutationObserver(() => scheduleRender()).observe(document.querySelector('#sectorTitle'), { childList: true, subtree: true, characterData: true });
  new MutationObserver(() => scheduleRender()).observe(editorBox, { childList: true, subtree: false });
  saveBtn.addEventListener('click', () => setTimeout(() => persist(true).catch(error => toast(error.message)), 700));
  window.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') setTimeout(() => persist(true).catch(error => toast(error.message)), 800); });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });

  addShortcut();
  setTimeout(async () => { await ensureLoaded(); scheduleRender(); }, 750);
})();