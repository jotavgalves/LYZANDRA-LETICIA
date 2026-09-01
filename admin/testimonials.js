(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  if (!preview || !editorBox || !saveBtn) return;

  const LEGACY_IDS = new Set([
    'span-006','span-007','p-005','span-008',
    'span-009','span-010','p-006','span-011',
    'span-012','span-013','p-007','span-014',
    'span-015','span-016','p-008','span-017',
    'span-018','span-019','p-009','span-020',
    'span-021','span-022','p-010','span-023'
  ]);

  let testimonials = { enabled: true, items: [] };
  let loaded = false;
  let dirty = false;
  let renderTimer = 0;

  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `testimonial-${Date.now()}-${Math.random().toString(16).slice(2)}`);

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
    toast.timer = setTimeout(() => box.classList.add('hidden'), 3200);
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

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      enabled: raw.enabled !== false,
      items: Array.isArray(raw.items) ? raw.items.map((item, index) => ({
        id: item?.id || `testimonial-${index + 1}`,
        name: String(item?.name || 'Aluna'),
        avatar: String(item?.avatar || ''),
        mode: ['text', 'image', 'image-text'].includes(item?.mode) ? item.mode : 'text',
        image: String(item?.image || ''),
        text: String(item?.text || ''),
        time: String(item?.time || ''),
        fit: item?.fit === 'contain' ? 'contain' : 'cover',
        position: ['top', 'center', 'bottom'].includes(item?.position) ? item.position : 'center',
        imageHeight: Math.max(120, Math.min(420, Number(item?.imageHeight) || 210)),
        visible: item?.visible !== false
      })) : []
    };
  }

  function extractLegacy(doc) {
    const section = doc?.querySelector('section[data-edit-id="section-002"]');
    if (!section) return [];
    return [...section.querySelectorAll('[data-edit-id^="article-"]')].map((article, index) => {
      const header = article.firstElementChild;
      const spans = header ? [...header.querySelectorAll('span')] : [];
      const body = article.querySelector('p')?.parentElement;
      return {
        id: article.dataset.editId || uid(),
        name: (spans[1]?.textContent || spans[0]?.textContent || `Aluna ${index + 1}`).trim(),
        avatar: '',
        mode: 'text',
        image: '',
        text: (article.querySelector('p')?.textContent || '').trim(),
        time: (body?.querySelector('span')?.textContent || '').trim(),
        fit: 'cover',
        position: 'center',
        imageHeight: 210,
        visible: article.dataset.editorHidden !== 'true'
      };
    });
  }

  async function ensureLoaded() {
    if (loaded) return;
    let content = {};
    try { content = await api('/api/content'); } catch {}
    if (content.site?.testimonials && Array.isArray(content.site.testimonials.items)) {
      testimonials = normalize(content.site.testimonials);
    } else {
      testimonials = normalize({ enabled: true, items: extractLegacy(preview.contentDocument) });
    }
    loaded = true;
    applyPreview();
  }

  function applyPreview() {
    const win = preview.contentWindow;
    if (!win) return;
    if (win.LyzandraTestimonials?.apply) {
      win.LyzandraTestimonials.apply({ site: { testimonials: clone(testimonials) } });
      return;
    }
    setTimeout(() => {
      if (preview.contentWindow?.LyzandraTestimonials?.apply) {
        preview.contentWindow.LyzandraTestimonials.apply({ site: { testimonials: clone(testimonials) } });
      }
    }, 250);
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

  function textArea(value, placeholder, onInput) {
    const input = document.createElement('textarea');
    input.rows = 4;
    input.value = value || '';
    input.placeholder = placeholder || '';
    input.oninput = () => onInput(input.value);
    return input;
  }

  function selectInput(value, options, onChange) {
    const select = document.createElement('select');
    options.forEach(([key, label]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = label;
      select.appendChild(option);
    });
    select.value = value;
    select.onchange = () => onChange(select.value);
    return select;
  }

  function checkbox(label, checked, onChange) {
    const row = document.createElement('label');
    row.className = 'visibility-line';
    const span = document.createElement('span');
    span.textContent = label;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.onchange = () => onChange(input.checked);
    row.append(span, input);
    return row;
  }

  function change(item, rerender = false) {
    markDirty();
    applyPreview();
    if (rerender) renderTestimonialsCard(true);
  }

  async function compressImage(file, maxDimension = 1800, quality = 0.86) {
    if (!file || !String(file.type).startsWith('image/')) throw new Error('Selecione uma imagem.');
    if (/image\/(gif|svg\+xml)/i.test(file.type)) return file;

    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
        img.src = url;
      });
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: true });
      ctx.drawImage(image, 0, 0, width, height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
      if (!blob || blob.size >= file.size) return file;
      const base = String(file.name || 'imagem').replace(/\.[^.]+$/, '') || 'imagem';
      return new File([blob], `${base}.webp`, { type: 'image/webp' });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function uploadImage(file, maxDimension) {
    const optimized = await compressImage(file, maxDimension);
    const form = new FormData();
    form.append('file', optimized);
    return api('/api/upload', { method: 'POST', body: form });
  }

  function imageUploader(labelText, currentUrl, maxDimension, onDone) {
    const box = document.createElement('div');
    box.style.cssText = 'display:grid;gap:8px;';
    if (currentUrl) {
      const thumb = document.createElement('img');
      thumb.src = currentUrl;
      thumb.alt = '';
      thumb.style.cssText = 'width:100%;max-height:150px;object-fit:contain;border-radius:10px;background:#f5f2f4;border:1px solid #e8e2e6;';
      box.appendChild(thumb);
    }
    const actions = document.createElement('div');
    actions.className = 'inline-actions';
    const upload = document.createElement('label');
    upload.className = 'file-label primary-upload';
    upload.innerHTML = `${labelText}<input type="file" accept="image/*">`;
    upload.querySelector('input').onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        upload.style.pointerEvents = 'none';
        upload.style.opacity = '.55';
        const result = await uploadImage(file, maxDimension);
        onDone(result.url);
        toast('Imagem enviada para o armazenamento do site.');
      } catch (error) {
        toast(error.message);
      } finally {
        upload.style.pointerEvents = '';
        upload.style.opacity = '';
      }
    };
    actions.appendChild(upload);
    if (currentUrl) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'mini-btn danger';
      remove.textContent = 'Remover imagem';
      remove.onclick = () => onDone('');
      actions.appendChild(remove);
    }
    box.appendChild(actions);
    return box;
  }

  function itemCard(item, index) {
    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid #e8e2e6;border-radius:14px;padding:12px;display:grid;gap:10px;background:#fff;';

    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;';
    const title = document.createElement('strong');
    title.textContent = `${index + 1}. ${item.name || 'Aluna'}`;
    title.style.fontSize = '12px';
    const actions = document.createElement('div');
    actions.className = 'inline-actions';
    const up = document.createElement('button');
    up.type = 'button'; up.className = 'mini-btn'; up.textContent = '↑'; up.title = 'Mover para cima';
    up.disabled = index === 0;
    up.onclick = () => move(index, -1);
    const down = document.createElement('button');
    down.type = 'button'; down.className = 'mini-btn'; down.textContent = '↓'; down.title = 'Mover para baixo';
    down.disabled = index === testimonials.items.length - 1;
    down.onclick = () => move(index, 1);
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'mini-btn danger'; del.textContent = 'Excluir';
    del.onclick = () => {
      if (!confirm(`Excluir o depoimento de ${item.name || 'esta aluna'}?`)) return;
      testimonials.items.splice(index, 1);
      change(item, true);
    };
    actions.append(up, down, del);
    head.append(title, actions);
    card.appendChild(head);

    card.appendChild(checkbox('Mostrar este depoimento', item.visible !== false, value => {
      item.visible = value;
      change(item);
    }));

    card.appendChild(field('Nome da aluna', textInput(item.name, 'Nome', value => {
      item.name = value;
      title.textContent = `${index + 1}. ${item.name || 'Aluna'}`;
      change(item);
    })));

    card.appendChild(field('Foto da aluna (opcional)', imageUploader('Enviar foto', item.avatar, 900, url => {
      item.avatar = url;
      change(item, true);
    }), 'Sem foto, o site mostra automaticamente a inicial do nome.'));

    card.appendChild(field('Como mostrar o depoimento', selectInput(item.mode, [
      ['text', 'Somente texto'],
      ['image', 'Somente imagem / print'],
      ['image-text', 'Imagem + texto']
    ], value => {
      item.mode = value;
      change(item, true);
    })));

    if (item.mode !== 'text') {
      card.appendChild(field('Imagem ou print do depoimento', imageUploader('Enviar imagem', item.image, 1800, url => {
        item.image = url;
        change(item, true);
      }), 'A imagem é otimizada no navegador e armazenada no mesmo Cloudflare KV do site.'));

      if (item.image) {
        card.appendChild(field('Enquadramento', selectInput(item.fit, [
          ['cover', 'Preencher o espaço'],
          ['contain', 'Mostrar a imagem inteira']
        ], value => {
          item.fit = value;
          change(item);
        })));
        card.appendChild(field('Posição da imagem', selectInput(item.position, [
          ['top', 'Topo'],
          ['center', 'Centro'],
          ['bottom', 'Base']
        ], value => {
          item.position = value;
          change(item);
        })));

        const rangeWrap = document.createElement('div');
        rangeWrap.className = 'range-row';
        const left = document.createElement('span');
        left.textContent = '120px';
        const range = document.createElement('input');
        range.type = 'range'; range.min = '120'; range.max = '420'; range.step = '10'; range.value = String(item.imageHeight || 210);
        const right = document.createElement('span');
        right.textContent = `${range.value}px`;
        range.oninput = () => {
          item.imageHeight = Number(range.value);
          right.textContent = `${range.value}px`;
          change(item);
        };
        rangeWrap.append(left, range, right);
        card.appendChild(field('Altura da imagem no card', rangeWrap));
      }
    }

    if (item.mode !== 'image') {
      card.appendChild(field('Texto do depoimento', textArea(item.text, 'Digite o depoimento...', value => {
        item.text = value;
        change(item);
      })));
      card.appendChild(field('Horário (opcional)', textInput(item.time, 'Ex.: 19:55', value => {
        item.time = value;
        change(item);
      })));
    }

    return card;
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= testimonials.items.length) return;
    const [item] = testimonials.items.splice(index, 1);
    testimonials.items.splice(target, 0, item);
    change(item, true);
  }

  function hideLegacyControls() {
    editorBox.querySelectorAll('[data-control-id]').forEach(card => {
      if (LEGACY_IDS.has(card.dataset.controlId)) card.style.display = 'none';
    });
  }

  function renderTestimonialsCard(force = false) {
    const titleText = document.querySelector('#sectorTitle')?.textContent || '';
    if (!/Resultados das alunas/i.test(titleText)) return;
    if (!loaded) {
      ensureLoaded().then(() => renderTestimonialsCard(true)).catch(error => toast(error.message));
      return;
    }

    const existing = document.querySelector('#testimonialsVisualCard');
    if (existing && !force) {
      hideLegacyControls();
      return;
    }
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'testimonialsVisualCard';
    card.className = 'general-card';
    card.style.cssText += ';display:grid;gap:12px;';

    const heading = document.createElement('div');
    heading.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;';
    const copy = document.createElement('div');
    copy.innerHTML = '<h3 style="margin:0 0 4px">Depoimentos das alunas</h3><p style="font-size:10px;color:#807981;line-height:1.5;margin:0">Use texto, foto, print ou os dois. As imagens ficam no armazenamento KV que o site já utiliza.</p>';
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn primary';
    add.textContent = '+ Adicionar';
    add.onclick = () => {
      testimonials.items.push({
        id: uid(), name: 'Nova aluna', avatar: '', mode: 'text', image: '', text: '', time: '',
        fit: 'cover', position: 'center', imageHeight: 210, visible: true
      });
      change(testimonials.items[testimonials.items.length - 1], true);
    };
    heading.append(copy, add);
    card.appendChild(heading);

    card.appendChild(checkbox('Mostrar a seção de depoimentos', testimonials.enabled !== false, value => {
      testimonials.enabled = value;
      markDirty();
      applyPreview();
    }));

    const list = document.createElement('div');
    list.style.cssText = 'display:grid;gap:12px;';
    testimonials.items.forEach((item, index) => list.appendChild(itemCard(item, index)));
    if (!testimonials.items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-card';
      empty.textContent = 'Nenhum depoimento cadastrado. Clique em “+ Adicionar”.';
      list.appendChild(empty);
    }
    card.appendChild(list);

    editorBox.prepend(card);
    hideLegacyControls();
  }

  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => renderTestimonialsCard(false), 50);
  }

  async function persistTestimonials() {
    if (!loaded) await ensureLoaded();
    const content = await api('/api/content');
    content.site = { ...(content.site || {}), testimonials: clone(testimonials) };
    content.patches = { ...(content.patches || {}) };
    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    dirty = false;
  }

  const originalSave = saveBtn.onclick;
  saveBtn.onclick = async function(event) {
    if (typeof originalSave === 'function') await originalSave.call(this, event);
    const hadDirtyTestimonials = dirty;
    try {
      this.disabled = true;
      await persistTestimonials();
      const status = document.querySelector('#saveStatus');
      if (status) {
        status.classList.remove('dirty');
        status.classList.add('saved');
        const text = status.querySelector('span:last-child');
        if (text) text.textContent = 'Salvo';
      }
      if (hadDirtyTestimonials) toast('Depoimentos salvos.');
    } catch (error) {
      toast(error.message);
    } finally {
      this.disabled = false;
    }
  };

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      setTimeout(() => persistTestimonials().catch(error => toast(error.message)), 1700);
    }
  });

  preview.addEventListener('load', () => {
    if (!loaded) ensureLoaded().then(scheduleRender).catch(error => toast(error.message));
    else {
      setTimeout(applyPreview, 300);
      scheduleRender();
    }
  });

  const title = document.querySelector('#sectorTitle');
  if (title) new MutationObserver(scheduleRender).observe(title, { childList: true, subtree: true, characterData: true });
  new MutationObserver(scheduleRender).observe(editorBox, { childList: true });
  scheduleRender();
})();
