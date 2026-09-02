(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  const generalBtn = document.querySelector('#generalBtn');
  if (!preview || !editorBox || !saveBtn || !generalBtn) return;

  const API = '/api/full-editor';
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

  function runtime() {
    return preview.contentWindow?.LyzandraFullEditor || null;
  }

  function doc() {
    return preview.contentDocument || null;
  }

  async function ensureLoaded() {
    if (loaded) return;
    try {
      const data = await api(API);
      patches = data?.patches && typeof data.patches === 'object' ? data.patches : {};
    } catch {
      patches = {};
    }
    loaded = true;
    runtime()?.setPatches?.(patches);
  }

  function patchFor(key, el = null) {
    if (!patches[key] || typeof patches[key] !== 'object') patches[key] = {};
    const patch = patches[key];
    if (!Array.isArray(patch.parts) && el) patch.parts = runtime()?.getParts?.(el) || [];
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
    patch.parts[index] = value;
    apply(key);
    setDirty();
  }

  function setAttr(key, el, name, value) {
    const patch = patchFor(key, el);
    patch.attrs = { ...(patch.attrs || {}), [name]: value };
    apply(key);
    setDirty();
  }

  function setHidden(key, el, hidden) {
    const patch = patchFor(key, el);
    patch.hidden = !!hidden;
    apply(key);
    setDirty();
  }

  function setFit(key, el, value) {
    const patch = patchFor(key, el);
    patch.fit = value;
    apply(key);
    setDirty();
  }

  async function upload(file) {
    if (!file) throw new Error('Selecione uma imagem.');
    const fd = new FormData();
    fd.append('file', file);
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

  function typeLabel(el) {
    if (el.tagName === 'IMG') return 'Imagem';
    if (el.tagName === 'VIDEO' || el.tagName === 'IFRAME') return 'Vídeo / mídia';
    if (el.tagName === 'A') return 'Botão / link';
    if (el.tagName === 'BUTTON') return 'Botão';
    if (['SECTION','HEADER','FOOTER','ASIDE'].includes(el.tagName)) return 'Bloco';
    if (/^H[1-6]$/.test(el.tagName)) return 'Título';
    return 'Texto';
  }

  function previewText(el) {
    if (el.tagName === 'IMG') return el.getAttribute('alt') || el.getAttribute('src') || 'Imagem';
    if (el.tagName === 'VIDEO' || el.tagName === 'IFRAME') return el.getAttribute('src') || 'Mídia';
    if (['SECTION','HEADER','FOOTER','ASIDE'].includes(el.tagName)) return zoneLabel(el);
    return String(el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  function focusElement(key) {
    const rt = runtime();
    const el = rt?.find?.(key);
    if (!el) return;
    const d = doc();
    d?.querySelectorAll('.__fullEditorActive').forEach(item => item.classList.remove('__fullEditorActive'));
    let style = d?.getElementById('__fullEditorFocusCss');
    if (d && !style) {
      style = d.createElement('style');
      style.id = '__fullEditorFocusCss';
      style.textContent = '.__fullEditorActive{outline:3px solid #22c55e!important;outline-offset:3px!important}';
      d.head.appendChild(style);
    }
    el.classList.add('__fullEditorActive');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => el.classList.remove('__fullEditorActive'), 1800);
  }

  function makeField(labelText, input) {
    const wrap = document.createElement('div');
    wrap.className = 'mini-field';
    const label = document.createElement('label');
    label.textContent = labelText;
    wrap.append(label, input);
    return wrap;
  }

  function makeTextInput(value, multiline = false) {
    const input = multiline ? document.createElement('textarea') : document.createElement('input');
    if (multiline) input.rows = 3;
    else input.type = 'text';
    input.value = value || '';
    return input;
  }

  function makeItem(el) {
    const key = el.getAttribute('data-full-edit-id');
    const card = document.createElement('div');
    card.className = 'control-card full-editor-item';
    card.dataset.search = `${zoneLabel(el)} ${typeLabel(el)} ${previewText(el)}`.toLowerCase();
    card.style.cssText += ';display:grid;gap:9px;';

    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;';
    const copy = document.createElement('div');
    const type = document.createElement('div');
    type.className = 'control-title';
    type.textContent = typeLabel(el);
    const snippet = document.createElement('div');
    snippet.className = 'control-preview';
    snippet.textContent = previewText(el) || 'Item sem texto visível';
    copy.append(type, snippet);
    const locate = document.createElement('button');
    locate.type = 'button';
    locate.className = 'mini-btn';
    locate.textContent = 'Localizar';
    locate.onclick = () => focusElement(key);
    head.append(copy, locate);
    card.appendChild(head);

    if (!['SECTION','HEADER','FOOTER','ASIDE','IMG','VIDEO','IFRAME'].includes(el.tagName)) {
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
      const input = makeTextInput(el.getAttribute('href') || '');
      input.placeholder = 'https://... ou #secao';
      input.onfocus = () => focusElement(key);
      input.oninput = () => setAttr(key, el, 'href', input.value);
      card.appendChild(makeField('Destino do link / botão', input));
    }

    if (el.tagName === 'BUTTON' && el.getAttribute('aria-label')) {
      const input = makeTextInput(el.getAttribute('aria-label') || '');
      input.oninput = () => setAttr(key, el, 'aria-label', input.value);
      card.appendChild(makeField('Descrição do botão', input));
    }

    if (el.tagName === 'IMG') {
      const thumb = document.createElement('img');
      thumb.src = el.getAttribute('src') || '';
      thumb.alt = '';
      thumb.style.cssText = 'width:100%;max-height:130px;object-fit:contain;border-radius:10px;background:#f4f1f2;border:1px solid #eee8eb;';
      card.appendChild(thumb);

      const actions = document.createElement('div');
      actions.className = 'inline-actions';
      const uploadLabel = document.createElement('label');
      uploadLabel.className = 'file-label primary-upload';
      uploadLabel.innerHTML = 'Trocar imagem<input type="file" accept="image/*">';
      uploadLabel.querySelector('input').onchange = async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          const result = await upload(file);
          setAttr(key, el, 'src', result.url);
          thumb.src = result.url;
          srcInput.value = result.url;
          toast('Imagem atualizada.');
        } catch (error) { toast(error.message); }
      };
      actions.appendChild(uploadLabel);
      card.appendChild(actions);

      const srcInput = makeTextInput(el.getAttribute('src') || '');
      srcInput.onchange = () => { setAttr(key, el, 'src', srcInput.value); thumb.src = srcInput.value; };
      card.appendChild(makeField('Link da imagem', srcInput));

      const altInput = makeTextInput(el.getAttribute('alt') || '');
      altInput.oninput = () => setAttr(key, el, 'alt', altInput.value);
      card.appendChild(makeField('Descrição da imagem (alt)', altInput));

      const fit = document.createElement('select');
      fit.innerHTML = '<option value="cover">Preencher quadro</option><option value="contain">Ajustar imagem</option><option value="fill">Esticar para preencher</option>';
      const currentFit = preview.contentWindow?.getComputedStyle(el)?.objectFit || 'cover';
      fit.value = ['cover','contain','fill'].includes(currentFit) ? currentFit : 'cover';
      fit.onchange = () => setFit(key, el, fit.value);
      card.appendChild(makeField('Ajuste da imagem', fit));
    }

    if (el.tagName === 'VIDEO' || el.tagName === 'IFRAME') {
      const src = makeTextInput(el.getAttribute('src') || '');
      src.onchange = () => setAttr(key, el, 'src', src.value);
      card.appendChild(makeField('Fonte da mídia', src));
    }

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;border-top:1px solid #eee8eb;padding-top:8px;';
    const visible = document.createElement('label');
    visible.className = 'visibility-line';
    visible.style.cssText += ';border:0;padding:0;flex:1;';
    visible.innerHTML = '<span>Mostrar no site</span><input type="checkbox">';
    const checkbox = visible.querySelector('input');
    checkbox.checked = el.getAttribute('data-full-editor-hidden') !== 'true';
    checkbox.onchange = () => setHidden(key, el, !checkbox.checked);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'mini-btn danger';
    reset.textContent = 'Restaurar';
    reset.onclick = async () => {
      if (!patches[key]) return;
      delete patches[key];
      dirty = true;
      try {
        await persist(true);
        preview.src = '/?admin-preview=1&t=' + Date.now();
        toast('Item restaurado ao conteúdo original.');
      } catch (error) { toast(error.message); }
    };
    footer.append(visible, reset);
    card.appendChild(footer);
    return card;
  }

  function collectGroups() {
    const rt = runtime();
    if (!rt) return new Map();
    const elements = rt.scan?.(doc()) || [];
    const groups = new Map();
    elements.forEach(el => {
      if (!el.isConnected) return;
      if (el.closest('.site-video-player')) return;
      const label = zoneLabel(el);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(el);
    });
    return groups;
  }

  function addShortcut() {
    if (document.querySelector('#fullEditorShortcut')) return;
    const shortcut = document.createElement('button');
    shortcut.id = 'fullEditorShortcut';
    shortcut.type = 'button';
    shortcut.className = 'sector-item general';
    shortcut.innerHTML = '<span class="sector-number">✎</span><span><strong>Editor completo</strong><small>Todos os textos, links e imagens</small></span>';
    shortcut.onclick = () => {
      generalBtn.click();
      setTimeout(() => document.querySelector('#fullEditorCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 180);
    };
    generalBtn.insertAdjacentElement('afterend', shortcut);
  }

  async function renderCard(force = false) {
    if (!isGeneral()) return;
    if (!loaded) await ensureLoaded();
    const rt = runtime();
    if (!rt) return;
    rt.assign?.(doc());

    const existing = document.querySelector('#fullEditorCard');
    if (existing && !force) return;
    existing?.remove();

    const card = document.createElement('div');
    card.id = 'fullEditorCard';
    card.className = 'general-card';
    card.style.cssText += ';display:grid;gap:12px;';

    const title = document.createElement('h3');
    title.style.margin = '0';
    title.textContent = 'Editor completo do site';
    const description = document.createElement('p');
    description.style.cssText = 'font-size:10px;color:#807981;line-height:1.55;margin:-4px 0 0;';
    description.textContent = 'Aqui aparecem todos os conteúdos visíveis encontrados na página — inclusive elementos antigos, rodapé e blocos adicionados pelos módulos novos. Alterações desta área são salvas separadamente para não serem sobrescritas por outros editores.';

    const statusRow = document.createElement('div');
    statusRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;';
    const status = document.createElement('small');
    status.id = 'fullEditorStatus';
    status.style.cssText = 'font-size:10px;color:#14804a;font-weight:650;';
    status.textContent = 'Salvo automaticamente';
    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.className = 'mini-btn';
    refresh.textContent = 'Reexaminar página';
    refresh.onclick = () => renderCard(true);
    statusRow.append(status, refresh);

    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Buscar texto, seção, botão ou imagem…';
    search.style.cssText = 'width:100%;border:1px solid #e8e0e4;border-radius:11px;padding:10px 11px;font:inherit;font-size:11px;background:#fff;';

    const list = document.createElement('div');
    list.style.cssText = 'display:grid;gap:9px;';
    const groups = collectGroups();
    let itemCount = 0;

    groups.forEach((elements, label) => {
      const detail = document.createElement('details');
      detail.className = 'full-editor-group';
      detail.style.cssText = 'border:1px solid #eee8eb;border-radius:14px;background:#fff;overflow:hidden;';
      const summary = document.createElement('summary');
      summary.style.cssText = 'cursor:pointer;padding:12px 13px;font-size:11px;font-weight:750;color:#292427;display:flex;justify-content:space-between;gap:10px;';
      summary.innerHTML = `<span></span><small style="color:#92868d;font-weight:600"></small>`;
      summary.querySelector('span').textContent = label;
      summary.querySelector('small').textContent = `${elements.length} itens`;
      const body = document.createElement('div');
      body.style.cssText = 'display:grid;gap:8px;padding:0 10px 10px;';
      elements.forEach(el => {
        body.appendChild(makeItem(el));
        itemCount += 1;
      });
      detail.append(summary, body);
      list.appendChild(detail);
    });

    const count = document.createElement('div');
    count.style.cssText = 'font-size:10px;color:#807981;';
    count.textContent = `${itemCount} conteúdos editáveis encontrados em ${groups.size} áreas.`;

    search.oninput = () => {
      const query = search.value.trim().toLowerCase();
      list.querySelectorAll('.full-editor-group').forEach(group => {
        let visibleCount = 0;
        group.querySelectorAll('.full-editor-item').forEach(item => {
          const match = !query || item.dataset.search.includes(query);
          item.style.display = match ? '' : 'none';
          if (match) visibleCount += 1;
        });
        group.style.display = visibleCount ? '' : 'none';
        if (query && visibleCount) group.open = true;
      });
    };

    card.append(title, description, statusRow, search, count, list);
    editorBox.appendChild(card);
  }

  function scheduleRender(force = false) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => renderCard(force).catch(error => toast(error.message)), 100);
  }

  preview.addEventListener('load', () => {
    loaded = false;
    setTimeout(async () => {
      await ensureLoaded();
      runtime()?.setPatches?.(patches);
      scheduleRender(true);
    }, 650);
  });

  window.addEventListener('full-editor-ready', () => scheduleRender(true));
  new MutationObserver(() => scheduleRender()).observe(document.querySelector('#sectorTitle'), { childList: true, subtree: true, characterData: true });
  new MutationObserver(() => scheduleRender()).observe(editorBox, { childList: true, subtree: false });

  saveBtn.addEventListener('click', () => setTimeout(() => persist(true).catch(error => toast(error.message)), 700));
  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') setTimeout(() => persist(true).catch(error => toast(error.message)), 800);
  });
  window.addEventListener('beforeunload', event => {
    if (dirty) { event.preventDefault(); event.returnValue = ''; }
  });

  addShortcut();
  setTimeout(async () => {
    await ensureLoaded();
    scheduleRender();
  }, 900);
})();
