(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  if (!preview || !editorBox || !saveBtn) return;

  const DEFAULT_IDENTITY = {
    logo: { src: '', visible: true, width: 170, position: 'center', href: '' },
    footerLogo: { src: '', useMain: true, visible: true, width: 120, position: 'center', href: '' },
    favicon: ''
  };

  let identity = JSON.parse(JSON.stringify(DEFAULT_IDENTITY));
  let loaded = false;
  let identityDirty = false;

  const clone = value => JSON.parse(JSON.stringify(value));
  const mergeIdentity = value => ({
    ...clone(DEFAULT_IDENTITY),
    ...(value || {}),
    logo: { ...DEFAULT_IDENTITY.logo, ...((value && value.logo) || {}) },
    footerLogo: { ...DEFAULT_IDENTITY.footerLogo, ...((value && value.footerLogo) || {}) }
  });

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

  function markDirty() {
    identityDirty = true;
    const status = document.querySelector('#saveStatus');
    if (status) {
      status.classList.add('dirty');
      status.classList.remove('saved');
      const text = status.querySelector('span:last-child');
      if (text) text.textContent = 'Alterações não salvas';
    }
  }

  function justify(position) {
    if (position === 'left') return 'flex-start';
    if (position === 'right') return 'flex-end';
    return 'center';
  }

  function makeLogo(doc, cfg, role) {
    if (!cfg || cfg.visible === false || !cfg.src) return null;
    const wrapper = doc.createElement(cfg.href ? 'a' : 'div');
    wrapper.dataset.siteIdentityGenerated = role;
    wrapper.style.cssText = `width:100%;display:flex;justify-content:${justify(cfg.position)};align-items:center;max-width:100%;${role === 'main-logo' ? 'margin:0 0 24px;' : 'margin:0 0 6px;'}`;
    if (cfg.href) {
      wrapper.href = cfg.href;
      if (/^https?:\/\//i.test(cfg.href)) {
        wrapper.target = '_blank';
        wrapper.rel = 'noopener';
      }
    }
    const img = doc.createElement('img');
    img.src = cfg.src;
    img.alt = 'Logo';
    img.style.cssText = `display:block;width:${Math.max(50, Math.min(420, Number(cfg.width) || 160))}px;max-width:100%;height:auto;object-fit:contain;`;
    wrapper.appendChild(img);
    return wrapper;
  }

  function applyIdentity(doc) {
    if (!doc) return;
    doc.querySelectorAll('[data-site-identity-generated]').forEach(el => el.remove());

    const mainHost = doc.querySelector('section[data-edit-id="section-001"] .mx-auto.flex.max-w-3xl') ||
      doc.querySelector('section[data-edit-id="section-001"] > div');
    const mainLogo = makeLogo(doc, identity.logo, 'main-logo');
    if (mainHost && mainLogo) mainHost.insertBefore(mainLogo, mainHost.firstChild);

    const footerHost = doc.querySelector('footer[data-edit-id="footer-001"] > div') || doc.querySelector('footer > div');
    const footerCfg = identity.footerLogo.useMain
      ? { ...identity.logo, visible: identity.footerLogo.visible, width: identity.footerLogo.width, position: identity.footerLogo.position, href: identity.footerLogo.href || identity.logo.href }
      : identity.footerLogo;
    const footerLogo = makeLogo(doc, footerCfg, 'footer-logo');
    if (footerHost && footerLogo) footerHost.insertBefore(footerLogo, footerHost.firstChild);

    if (identity.favicon) {
      const link = doc.createElement('link');
      link.rel = 'icon';
      link.href = identity.favicon;
      link.dataset.siteIdentityGenerated = 'favicon';
      doc.head.appendChild(link);
    }
  }

  async function ensureLoaded() {
    if (loaded) return;
    try {
      const content = await api('/api/content');
      identity = mergeIdentity(content.site?.identity);
    } catch {
      identity = mergeIdentity();
    }
    loaded = true;
    applyIdentity(preview.contentDocument);
  }

  async function upload(file) {
    if (!file) return null;
    const form = new FormData();
    form.append('file', file);
    return api('/api/upload', { method: 'POST', body: form });
  }

  function field(label, input) {
    const wrap = document.createElement('div');
    wrap.className = 'mini-field';
    const title = document.createElement('label');
    title.textContent = label;
    wrap.append(title, input);
    return wrap;
  }

  function textInput(value, placeholder, onInput) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.placeholder = placeholder || '';
    input.oninput = () => onInput(input.value);
    return input;
  }

  function checkbox(label, checked, onChange) {
    const row = document.createElement('label');
    row.className = 'visibility-line';
    const text = document.createElement('span');
    text.textContent = label;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.onchange = () => onChange(input.checked);
    row.append(text, input);
    return row;
  }

  function positionSelect(value, onChange) {
    const select = document.createElement('select');
    select.innerHTML = '<option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option>';
    select.value = value || 'center';
    select.onchange = () => onChange(select.value);
    return select;
  }

  function rangeInput(value, min, max, onInput) {
    const row = document.createElement('div');
    row.className = 'range-row';
    const left = document.createElement('span');
    left.textContent = 'Menor';
    const range = document.createElement('input');
    range.type = 'range';
    range.min = String(min);
    range.max = String(max);
    range.value = String(value);
    const right = document.createElement('span');
    right.textContent = `${value}px`;
    range.oninput = () => {
      right.textContent = `${range.value}px`;
      onInput(Number(range.value));
    };
    row.append(left, range, right);
    return row;
  }

  function uploadButton(text, accept, onDone) {
    const label = document.createElement('label');
    label.className = 'file-label primary-upload';
    label.innerHTML = `${text}<input type="file" accept="${accept}">`;
    label.querySelector('input').onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const result = await upload(file);
        if (result?.url) onDone(result.url);
      } catch (error) {
        toast(error.message);
      }
    };
    return label;
  }

  function changed() {
    markDirty();
    applyIdentity(preview.contentDocument);
  }

  function makeLogoSection(title, cfg, isFooter = false) {
    const section = document.createElement('div');
    section.style.cssText = 'padding:12px 0;border-top:1px solid #efedef;display:grid;gap:10px;';
    const h = document.createElement('strong');
    h.textContent = title;
    h.style.fontSize = '12px';
    section.appendChild(h);

    if (isFooter) {
      section.appendChild(checkbox('Usar a mesma logo principal no rodapé', cfg.useMain !== false, value => {
        cfg.useMain = value;
        changed();
        renderIdentityCard(true);
      }));
    }

    if (!isFooter || cfg.useMain === false) {
      const actions = document.createElement('div');
      actions.className = 'inline-actions';
      actions.appendChild(uploadButton('Enviar logo', 'image/*', url => {
        cfg.src = url;
        changed();
        renderIdentityCard(true);
      }));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'mini-btn danger';
      remove.textContent = 'Remover logo';
      remove.onclick = () => {
        cfg.src = '';
        changed();
        renderIdentityCard(true);
      };
      actions.appendChild(remove);
      section.appendChild(actions);
      section.appendChild(field('Ou cole o link da imagem', textInput(cfg.src, 'https://.../logo.png', value => {
        cfg.src = value.trim();
        changed();
      })));
    }

    section.appendChild(checkbox('Mostrar esta logo', cfg.visible !== false, value => {
      cfg.visible = value;
      changed();
    }));
    section.appendChild(field('Tamanho da logo', rangeInput(cfg.width || (isFooter ? 120 : 170), 60, 360, value => {
      cfg.width = value;
      changed();
    })));
    section.appendChild(field('Posição', positionSelect(cfg.position, value => {
      cfg.position = value;
      changed();
    })));
    section.appendChild(field('Ao clicar na logo, abrir', textInput(cfg.href, 'https://... ou deixe vazio', value => {
      cfg.href = value.trim();
      changed();
    })));
    return section;
  }

  function renderIdentityCard(force = false) {
    const title = document.querySelector('#sectorTitle')?.textContent || '';
    if (!/Configurações gerais/i.test(title)) return;
    const existing = document.querySelector('#identityVisualCard');
    if (existing && !force) return;
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'identityVisualCard';
    card.className = 'general-card';
    card.innerHTML = '<h3>Logo e identidade visual</h3><p style="font-size:10px;color:#807981;line-height:1.5;margin:-3px 0 12px">Adicione sua marca sem mexer em código. Tudo aparece na prévia na mesma hora.</p>';

    card.appendChild(makeLogoSection('Logo principal', identity.logo, false));
    card.appendChild(makeLogoSection('Logo do rodapé', identity.footerLogo, true));

    const fav = document.createElement('div');
    fav.style.cssText = 'padding:12px 0 0;border-top:1px solid #efedef;display:grid;gap:10px;';
    const favTitle = document.createElement('strong');
    favTitle.textContent = 'Ícone da aba do navegador (favicon)';
    favTitle.style.fontSize = '12px';
    fav.appendChild(favTitle);
    const favActions = document.createElement('div');
    favActions.className = 'inline-actions';
    favActions.appendChild(uploadButton('Enviar ícone', 'image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon', url => {
      identity.favicon = url;
      changed();
      renderIdentityCard(true);
    }));
    const clearFav = document.createElement('button');
    clearFav.type = 'button';
    clearFav.className = 'mini-btn danger';
    clearFav.textContent = 'Remover ícone';
    clearFav.onclick = () => {
      identity.favicon = '';
      changed();
      renderIdentityCard(true);
    };
    favActions.appendChild(clearFav);
    fav.appendChild(favActions);
    fav.appendChild(field('Ou cole o link do ícone', textInput(identity.favicon, 'https://.../icone.png', value => {
      identity.favicon = value.trim();
      changed();
    })));
    card.appendChild(fav);

    editorBox.prepend(card);
  }

  async function persistIdentity() {
    if (!identityDirty) return;
    const content = await api('/api/content');
    content.site = { ...(content.site || {}), identity: clone(identity) };
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    identityDirty = false;
  }

  const originalSave = saveBtn.onclick;
  saveBtn.onclick = async function(event) {
    if (typeof originalSave === 'function') await originalSave.call(this, event);
    if (!identityDirty) return;
    try {
      this.disabled = true;
      await persistIdentity();
      const status = document.querySelector('#saveStatus');
      if (status) {
        status.classList.remove('dirty');
        status.classList.add('saved');
        const text = status.querySelector('span:last-child');
        if (text) text.textContent = 'Salvo';
      }
      toast('Logo e identidade salvas.');
    } catch (error) {
      toast(error.message);
    } finally {
      this.disabled = false;
    }
  };

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && identityDirty) {
      setTimeout(() => persistIdentity().catch(error => toast(error.message)), 700);
    }
  });

  preview.addEventListener('load', async () => {
    await ensureLoaded();
    setTimeout(() => applyIdentity(preview.contentDocument), 250);
  });

  const observer = new MutationObserver(async () => {
    await ensureLoaded();
    renderIdentityCard(false);
  });
  observer.observe(editorBox, { childList: true, subtree: false });

  ensureLoaded().then(() => renderIdentityCard(false));
})();