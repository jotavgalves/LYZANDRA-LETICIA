(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  if (!preview || !editorBox || !saveBtn) return;

  const DEFAULT = {
    enabled: true,
    index: true,
    siteName: 'Ly Cílios',
    title: 'Speed Lash | Curso de extensão de cílios com Lyzandra Letícia',
    description: 'Aprenda técnicas de extensão de cílios para ganhar velocidade, melhorar retenção e elevar a qualidade dos atendimentos com o método Speed Lash.',
    canonicalUrl: '',
    searchConsoleVerification: '',
    socialImage: '',
    organizationName: 'Ly Cílios',
    courseName: 'Speed Lash',
    courseDescription: 'Curso de extensão de cílios com foco em velocidade, retenção, segurança e técnicas avançadas.',
    instructorName: 'Lyzandra Letícia'
  };

  let seo = { ...DEFAULT };
  let loaded = false;
  let dirty = false;
  let timer = 0;

  const clone = value => JSON.parse(JSON.stringify(value));

  function normalize(value) {
    if (preview.contentWindow?.LyzandraSEO?.normalize) return preview.contentWindow.LyzandraSEO.normalize(value);
    const raw = value && typeof value === 'object' ? value : {};
    return { ...DEFAULT, ...raw, enabled: raw.enabled !== false, index: raw.index !== false };
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
    toast.timer = setTimeout(() => box.classList.add('hidden'), 3300);
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
    let content = {};
    try { content = await api('/api/content'); } catch {}
    seo = normalize(content.site?.seo || {});
    if (!content.site?.seo) {
      seo.title = content.site?.title || seo.title;
      seo.description = content.site?.description || seo.description;
    }
    loaded = true;
    applyPreview();
  }

  function applyPreview() {
    const data = { site: { seo: clone(seo) } };
    if (preview.contentWindow?.LyzandraSEO?.apply) preview.contentWindow.LyzandraSEO.apply(data);
    else setTimeout(() => preview.contentWindow?.LyzandraSEO?.apply?.(data), 250);
  }

  function changed(rerender = false) {
    markDirty();
    applyPreview();
    if (rerender) scheduleRender(true);
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

  function textInput(value, placeholder, onInput) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value || '';
    input.placeholder = placeholder || '';
    input.oninput = () => onInput(input.value);
    return input;
  }

  function textArea(value, placeholder, onInput, rows = 4) {
    const input = document.createElement('textarea');
    input.rows = rows;
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

  function countField(label, value, recommended, onInput, textarea = false) {
    const wrap = document.createElement('div');
    wrap.className = 'mini-field';
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;justify-content:space-between;gap:8px;align-items:center;';
    const lab = document.createElement('label');
    lab.textContent = label;
    const count = document.createElement('small');
    count.style.cssText = 'font-size:10px;color:#807981;';
    head.append(lab, count);
    const input = textarea ? document.createElement('textarea') : document.createElement('input');
    if (!textarea) input.type = 'text';
    else input.rows = 4;
    input.value = value || '';
    const paint = () => {
      count.textContent = `${input.value.length} caracteres · ideal ${recommended}`;
      onInput(input.value);
    };
    count.textContent = `${input.value.length} caracteres · ideal ${recommended}`;
    input.oninput = paint;
    wrap.append(head, input);
    return wrap;
  }

  async function uploadImage(file) {
    const form = new FormData();
    form.append('file', file);
    return api('/api/upload', { method: 'POST', body: form });
  }

  function socialImageControl() {
    const box = document.createElement('div');
    box.style.cssText = 'display:grid;gap:8px;';
    if (seo.socialImage) {
      const img = document.createElement('img');
      img.src = seo.socialImage;
      img.alt = '';
      img.style.cssText = 'width:100%;aspect-ratio:1200/630;object-fit:cover;border-radius:12px;border:1px solid #e8e2e6;background:#f5f2f4;';
      box.appendChild(img);
    }
    const actions = document.createElement('div');
    actions.className = 'inline-actions';
    const label = document.createElement('label');
    label.className = 'file-label primary-upload';
    label.innerHTML = `${seo.socialImage ? 'Trocar imagem' : 'Enviar imagem 1200×630'}<input type="file" accept="image/*">`;
    label.querySelector('input').onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        label.style.pointerEvents = 'none';
        label.style.opacity = '.55';
        const result = await uploadImage(file);
        seo.socialImage = result.url;
        changed(true);
        toast('Imagem SEO enviada.');
      } catch (error) {
        toast(error.message);
      } finally {
        label.style.pointerEvents = '';
        label.style.opacity = '';
      }
    };
    actions.appendChild(label);
    if (seo.socialImage) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'mini-btn danger';
      remove.textContent = 'Remover';
      remove.onclick = () => { seo.socialImage = ''; changed(true); };
      actions.appendChild(remove);
    }
    box.appendChild(actions);
    return box;
  }

  function isGeneral() {
    return /Configurações gerais/i.test(document.querySelector('#sectorTitle')?.textContent || '');
  }

  function renderSnippet(card) {
    const previewBox = document.createElement('div');
    previewBox.style.cssText = 'border:1px solid #e8e2e6;border-radius:14px;padding:14px;background:#fff;display:grid;gap:4px;';
    const url = document.createElement('div');
    url.style.cssText = 'font-size:11px;color:#4d5156;';
    url.textContent = seo.canonicalUrl || 'https://seu-dominio.com/';
    const title = document.createElement('div');
    title.style.cssText = 'font-size:17px;line-height:1.3;color:#1a0dab;';
    title.textContent = seo.title;
    const desc = document.createElement('div');
    desc.style.cssText = 'font-size:12px;line-height:1.5;color:#4d5156;';
    desc.textContent = seo.description;
    previewBox.append(url, title, desc);
    card.appendChild(field('Prévia aproximada no Google', previewBox, 'O Google pode reescrever título e descrição conforme a busca do usuário.'));
  }

  function renderCard(force = false) {
    if (!isGeneral()) return;
    if (!loaded) {
      ensureLoaded().then(() => renderCard(true)).catch(error => toast(error.message));
      return;
    }
    const existing = document.querySelector('#seoGoogleCard');
    if (existing && !force) return;
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'seoGoogleCard';
    card.className = 'general-card';
    card.style.cssText += ';display:grid;gap:12px;';
    card.innerHTML = '<h3 style="margin:0">SEO e Google</h3><p style="font-size:10px;color:#807981;line-height:1.5;margin:-4px 0 2px">Controle como o site é apresentado aos mecanismos de busca e prepare a verificação no Google Search Console.</p>';

    card.appendChild(checkbox('Ativar configuração SEO', seo.enabled !== false, value => { seo.enabled = value; changed(); }));
    card.appendChild(checkbox('Permitir indexação no Google', seo.index !== false, value => { seo.index = value; changed(); }));
    card.appendChild(field('Nome do site / marca', textInput(seo.siteName, 'Ly Cílios', value => { seo.siteName = value; changed(); })));
    card.appendChild(countField('Título SEO', seo.title, '50–60', value => { seo.title = value; changed(); }));
    card.appendChild(countField('Meta description', seo.description, '140–160', value => { seo.description = value; changed(); }, true));
    card.appendChild(field('URL canônica', textInput(seo.canonicalUrl, 'Ex.: https://www.seudominio.com/', value => { seo.canonicalUrl = value.trim(); changed(); }), 'Pode deixar vazio: o site usa automaticamente o domínio em que estiver publicado. Ao usar domínio próprio, prefira informar a URL final aqui.'));
    card.appendChild(field('Código do Google Search Console', textInput(seo.searchConsoleVerification, 'Cole somente o código content="..."', value => { seo.searchConsoleVerification = value.trim(); changed(); }), 'Campo de apoio para a tag de verificação. Para propriedade de domínio, prefira a verificação por DNS no Search Console.'));
    card.appendChild(field('Imagem de compartilhamento', socialImageControl(), 'Recomendado: 1200 × 630 px. Usada em Open Graph e cartões sociais.'));

    const structured = document.createElement('div');
    structured.style.cssText = 'border-top:1px solid #efedef;padding-top:13px;display:grid;gap:10px;';
    structured.innerHTML = '<strong style="font-size:12px">Dados estruturados</strong><p style="margin:-5px 0 0;color:#807981;font-size:10px;line-height:1.45">Informações que ajudam o Google a entender o site, a marca, a instrutora e o curso.</p>';
    structured.appendChild(field('Nome da organização', textInput(seo.organizationName, 'Ly Cílios', value => { seo.organizationName = value; changed(); })));
    structured.appendChild(field('Nome do curso', textInput(seo.courseName, 'Speed Lash', value => { seo.courseName = value; changed(); })));
    structured.appendChild(field('Nome da instrutora', textInput(seo.instructorName, 'Lyzandra Letícia', value => { seo.instructorName = value; changed(); })));
    structured.appendChild(field('Descrição do curso', textArea(seo.courseDescription, 'Descrição objetiva do curso...', value => { seo.courseDescription = value; changed(); }), 'Use apenas informações que realmente aparecem e são oferecidas na página.'));
    card.appendChild(structured);

    renderSnippet(card);

    const help = document.createElement('div');
    help.style.cssText = 'border-radius:12px;background:#faf7f9;border:1px solid #eee6ea;padding:11px;font-size:10px;line-height:1.55;color:#645d61;';
    help.innerHTML = '<strong>Depois de publicar:</strong> verifique o domínio no Google Search Console e envie <code>/sitemap.xml</code>. O site já gera <code>/robots.txt</code> automaticamente e mantém o painel administrativo fora do índice.';
    card.appendChild(help);

    editorBox.appendChild(card);
  }

  function scheduleRender(force = false) {
    clearTimeout(timer);
    timer = setTimeout(() => renderCard(force), 70);
  }

  async function persist(force = false) {
    if (!loaded) await ensureLoaded();
    if (!dirty && !force) return;
    const content = await api('/api/content');
    content.site = { ...(content.site || {}), seo: clone(seo) };
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    dirty = false;
  }

  const originalSave = saveBtn.onclick;
  saveBtn.onclick = async function(event) {
    if (typeof originalSave === 'function') await originalSave.call(this, event);
    try {
      this.disabled = true;
      await persist(true);
      const status = document.querySelector('#saveStatus');
      if (status) {
        status.classList.remove('dirty');
        status.classList.add('saved');
        const text = status.querySelector('span:last-child');
        if (text) text.textContent = 'Salvo';
      }
      if (dirty) toast('Configurações de SEO salvas.');
    } catch (error) {
      toast(error.message);
    } finally {
      this.disabled = false;
    }
  };

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      setTimeout(() => persist(true).catch(error => toast(error.message)), 2700);
    }
  });

  preview.addEventListener('load', () => {
    if (!loaded) ensureLoaded().then(() => scheduleRender()).catch(error => toast(error.message));
    else setTimeout(applyPreview, 300);
  });

  new MutationObserver(() => scheduleRender()).observe(document.querySelector('#sectorTitle'), { childList: true, subtree: true, characterData: true });
  new MutationObserver(() => scheduleRender()).observe(editorBox, { childList: true, subtree: false });
  setTimeout(() => ensureLoaded().then(() => scheduleRender()).catch(error => toast(error.message)), 400);
})();
