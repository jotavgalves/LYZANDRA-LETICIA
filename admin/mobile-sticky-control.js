(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const generalBtn = document.querySelector('#generalBtn');
  if (!preview || !editorBox || !generalBtn) return;

  let enabled = false;
  let loaded = false;
  let saving = false;

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

  function hideLegacyControl() {
    document.querySelectorAll('#conversionExperienceCard details').forEach(details => {
      const text = details.querySelector('summary')?.textContent || '';
      if (/CTA fixo no celular/i.test(text)) details.style.display = 'none';
    });
  }

  function applyPreview() {
    const win = preview.contentWindow;
    if (!win) return;
    win.__SITE_CONTENT__ = win.__SITE_CONTENT__ || {};
    win.__SITE_CONTENT__.site = win.__SITE_CONTENT__.site || {};
    win.__SITE_CONTENT__.site.mobileStickyCtaEnabled = enabled;
    win.LyzandraMobilePolish?.setMobileStickyEnabled?.(enabled);
  }

  async function load() {
    if (loaded) return;
    try {
      const content = await api('/api/content');
      enabled = content?.site?.mobileStickyCtaEnabled === true;
    } catch {
      enabled = false;
    }
    loaded = true;
    applyPreview();
  }

  async function persist(value) {
    if (saving) return;
    saving = true;
    try {
      const content = await api('/api/content');
      content.site = { ...(content.site || {}), mobileStickyCtaEnabled: value === true };
      await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
      enabled = value === true;
      applyPreview();
      render(true);
      toast(enabled ? 'CTA fixo do celular ativado.' : 'CTA fixo do celular desativado.');
    } catch (error) {
      toast(error.message);
      render(true);
    } finally {
      saving = false;
    }
  }

  function render(force = false) {
    hideLegacyControl();
    if (!isGeneral() || !loaded) return;
    const existing = document.querySelector('#mobileStickyControlCard');
    if (existing && !force) return;
    existing?.remove();

    const card = document.createElement('div');
    card.id = 'mobileStickyControlCard';
    card.className = 'general-card';
    card.style.cssText += ';display:grid;gap:10px;';
    card.innerHTML = '<h3 style="margin:0">CTA fixo no celular</h3><p style="font-size:10px;color:#807981;line-height:1.55;margin:-3px 0 2px">Controla somente a faixa flutuante “QUERO MINHA VAGA” no mobile. Ela fica desligada por padrão e não altera os botões normais da página.</p>';

    const row = document.createElement('label');
    row.className = 'visibility-line';
    const label = document.createElement('span');
    label.textContent = 'Mostrar faixa fixa “QUERO MINHA VAGA” no celular';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = enabled;
    input.disabled = saving;
    input.onchange = () => persist(input.checked);
    row.append(label, input);
    card.appendChild(row);

    const status = document.createElement('div');
    status.style.cssText = `font-size:10px;line-height:1.45;padding:8px 10px;border-radius:10px;border:1px solid ${enabled ? 'rgba(34,197,94,.22)' : '#eee8eb'};background:${enabled ? 'rgba(34,197,94,.07)' : '#faf8f9'};color:${enabled ? '#237a42' : '#807981'};`;
    status.textContent = enabled ? 'Ativado: a faixa poderá aparecer durante a rolagem no celular.' : 'Desativado: nenhuma faixa fixa de compra será exibida no celular.';
    card.appendChild(status);

    const conversion = document.querySelector('#conversionExperienceCard');
    if (conversion?.parentElement === editorBox) conversion.insertAdjacentElement('afterend', card);
    else editorBox.appendChild(card);
  }

  const refresh = () => {
    hideLegacyControl();
    if (!loaded) load().then(() => render(true));
    else render();
  };

  preview.addEventListener('load', () => setTimeout(applyPreview, 350));
  new MutationObserver(refresh).observe(editorBox, { childList: true, subtree: true });
  const title = document.querySelector('#sectorTitle');
  if (title) new MutationObserver(refresh).observe(title, { childList: true, subtree: true, characterData: true });
  setTimeout(() => load().then(() => render(true)).catch(error => toast(error.message)), 450);
})();