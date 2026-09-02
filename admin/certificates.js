(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  if (!preview || !editorBox || !saveBtn) return;

  const DEFAULT = {
    enabled: true,
    eyebrow: { visible: true, text: 'CERTIFICAÇÃO PROFISSIONAL' },
    title: 'Receba um certificado profissional ao concluir sua formação',
    highlight: 'certificado profissional',
    subtitle: {
      visible: true,
      text: 'Ao final do curso, você recebe um certificado elegante e profissional, que valoriza sua jornada e reforça sua credibilidade para atuar com mais segurança.'
    },
    displayMode: 'single',
    showArrows: true,
    showCounter: true,
    imageFit: 'contain',
    aspect: '4/3',
    premiumGlow: true,
    images: [{ id: 'certificate-1', src: 'https://lycilios.vercel.app/images/certificate.png', alt: 'Certificado profissional de conclusão', visible: true }],
    benefits: {
      visible: true,
      items: ['Certificado profissional', 'Design elegante e sofisticado', 'Mais credibilidade no atendimento', 'Conclusão com mais confiança']
    },
    final: {
      visible: true,
      title: 'Certificação que valoriza sua formação',
      text: 'Mais do que aprender uma técnica, você conclui sua jornada preparada e certificada para atuar com mais segurança e autoridade profissional.'
    }
  };

  let certificates = clone(DEFAULT);
  let loaded = false;
  let dirty = false;
  let renderTimer = 0;

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `certificate-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalize(value) {
    if (preview.contentWindow?.LyzandraCertificates?.normalize) {
      return preview.contentWindow.LyzandraCertificates.normalize(value);
    }
    const raw = value && typeof value === 'object' ? value : {};
    return {
      ...clone(DEFAULT),
      ...raw,
      enabled: raw.enabled !== false,
      eyebrow: { ...DEFAULT.eyebrow, ...((raw && raw.eyebrow) || {}) },
      subtitle: { ...DEFAULT.subtitle, ...((raw && raw.subtitle) || {}) },
      benefits: {
        ...DEFAULT.benefits,
        ...((raw && raw.benefits) || {}),
        items: Array.isArray(raw?.benefits?.items) ? raw.benefits.items.map(x => String(x || '')).filter(Boolean) : clone(DEFAULT.benefits.items)
      },
      final: { ...DEFAULT.final, ...((raw && raw.final) || {}) },
      images: Array.isArray(raw.images) && raw.images.length
        ? raw.images.map((item, index) => ({
            id: String(item?.id || `certificate-${index + 1}`),
            src: String(item?.src || ''),
            alt: String(item?.alt || `Certificado ${index + 1}`),
            visible: item?.visible !== false
          }))
        : clone(DEFAULT.images)
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

  function extractCurrentImage() {
    const doc = preview.contentDocument;
    const legacy = doc?.querySelector('section[data-edit-id="section-006"] img[data-edit-id="img-006"]');
    return legacy?.getAttribute('src') || '';
  }

  async function ensureLoaded() {
    if (loaded) return;
    let content = {};
    try { content = await api('/api/content'); } catch {}
    if (content.site?.certificates) {
      certificates = normalize(content.site.certificates);
    } else {
      const legacySrc = extractCurrentImage();
      certificates = normalize({
        ...DEFAULT,
        images: legacySrc ? [{ id: uid(), src: legacySrc, alt: 'Certificado profissional de conclusão', visible: true }] : DEFAULT.images
      });
    }
    loaded = true;
    applyPreview();
  }

  function applyPreview() {
    const win = preview.contentWindow;
    if (!win) return;
    if (win.LyzandraCertificates?.apply) {
      win.LyzandraCertificates.apply({ site: { certificates: clone(certificates) } });
      return;
    }
    setTimeout(() => {
      preview.contentWindow?.LyzandraCertificates?.apply?.({ site: { certificates: clone(certificates) } });
    }, 220);
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
    const text = document.createElement('span');
    text.textContent = label;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.onchange = () => onChange(input.checked);
    row.append(text, input);
    return row;
  }

  function sectionBlock(title, description = '') {
    const block = document.createElement('div');
    block.style.cssText = 'border-top:1px solid #efedef;padding-top:13px;display:grid;gap:10px;';
    const head = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = title;
    strong.style.fontSize = '12px';
    head.appendChild(strong);
    if (description) {
      const text = document.createElement('p');
      text.textContent = description;
      text.style.cssText = 'margin:4px 0 0;color:#807981;font-size:10px;line-height:1.45;';
      head.appendChild(text);
    }
    block.appendChild(head);
    return block;
  }

  function changed(rerender = false) {
    markDirty();
    applyPreview();
    if (rerender) scheduleRender(true);
  }

  async function compressImage(file, maxDimension = 2600, quality = 0.92) {
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
      const base = String(file.name || 'certificado').replace(/\.[^.]+$/, '') || 'certificado';
      return new File([blob], `${base}.webp`, { type: 'image/webp' });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function uploadImage(file) {
    const optimized = await compressImage(file);
    const form = new FormData();
    form.append('file', optimized);
    return api('/api/upload', { method: 'POST', body: form });
  }

  function imageUploader(item) {
    const box = document.createElement('div');
    box.style.cssText = 'display:grid;gap:8px;';
    if (item.src) {
      const thumb = document.createElement('img');
      thumb.src = item.src;
      thumb.alt = item.alt || '';
      thumb.style.cssText = 'width:100%;max-height:190px;object-fit:contain;border-radius:10px;background:#f6f2f4;border:1px solid #e8e2e6;';
      box.appendChild(thumb);
    }
    const label = document.createElement('label');
    label.className = 'file-label primary-upload';
    label.innerHTML = `${item.src ? 'Trocar imagem' : 'Enviar certificado'}<input type="file" accept="image/*">`;
    label.querySelector('input').onchange = async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        label.style.pointerEvents = 'none';
        label.style.opacity = '.55';
        const result = await uploadImage(file);
        item.src = result.url;
        changed(true);
        toast('Certificado enviado para o armazenamento do site.');
      } catch (error) {
        toast(error.message);
      } finally {
        label.style.pointerEvents = '';
        label.style.opacity = '';
      }
    };
    box.appendChild(label);
    return box;
  }

  function moveImage(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= certificates.images.length) return;
    const [item] = certificates.images.splice(index, 1);
    certificates.images.splice(target, 0, item);
    changed(true);
  }

  function imageCard(item, index) {
    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid #e8e2e6;border-radius:14px;padding:12px;display:grid;gap:10px;background:#fff;';
    const head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;';
    const title = document.createElement('strong');
    title.textContent = `Certificado ${index + 1}`;
    title.style.fontSize = '12px';
    const actions = document.createElement('div');
    actions.className = 'inline-actions';
    const up = document.createElement('button');
    up.type = 'button'; up.className = 'mini-btn'; up.textContent = '↑'; up.disabled = index === 0;
    up.onclick = () => moveImage(index, -1);
    const down = document.createElement('button');
    down.type = 'button'; down.className = 'mini-btn'; down.textContent = '↓'; down.disabled = index === certificates.images.length - 1;
    down.onclick = () => moveImage(index, 1);
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'mini-btn danger'; del.textContent = 'Excluir';
    del.onclick = () => {
      if (!confirm(`Excluir o certificado ${index + 1}?`)) return;
      certificates.images.splice(index, 1);
      changed(true);
    };
    actions.append(up, down, del);
    head.append(title, actions);
    card.appendChild(head);
    card.appendChild(checkbox('Mostrar esta imagem', item.visible !== false, value => {
      item.visible = value;
      changed();
    }));
    card.appendChild(imageUploader(item));
    card.appendChild(field('Texto alternativo', textInput(item.alt, 'Ex.: Certificado Speed Lash', value => {
      item.alt = value;
      changed();
    }), 'Ajuda acessibilidade e descreve a imagem para mecanismos de busca.'));
    return card;
  }

  function benefitRow(text, index) {
    const row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:7px;align-items:center;';
    const input = textInput(text, 'Benefício', value => {
      certificates.benefits.items[index] = value;
      changed();
    });
    const actions = document.createElement('div');
    actions.className = 'inline-actions';
    const up = document.createElement('button');
    up.type = 'button'; up.className = 'mini-btn'; up.textContent = '↑'; up.disabled = index === 0;
    up.onclick = () => {
      const items = certificates.benefits.items;
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      changed(true);
    };
    const down = document.createElement('button');
    down.type = 'button'; down.className = 'mini-btn'; down.textContent = '↓'; down.disabled = index === certificates.benefits.items.length - 1;
    down.onclick = () => {
      const items = certificates.benefits.items;
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
      changed(true);
    };
    const del = document.createElement('button');
    del.type = 'button'; del.className = 'mini-btn danger'; del.textContent = '×';
    del.title = 'Excluir benefício';
    del.onclick = () => {
      certificates.benefits.items.splice(index, 1);
      changed(true);
    };
    actions.append(up, down, del);
    row.append(input, actions);
    return row;
  }

  function isCertificateSector() {
    return /certificad/i.test(document.querySelector('#sectorTitle')?.textContent || '');
  }

  function hideGenericControls() {
    editorBox.querySelectorAll('[data-control-id]').forEach(card => {
      card.style.display = 'none';
    });
  }

  function renderCard(force = false) {
    if (!isCertificateSector()) return;
    if (!loaded) {
      ensureLoaded().then(() => renderCard(true)).catch(error => toast(error.message));
      return;
    }
    const existing = document.querySelector('#certificatesVisualCard');
    if (existing && !force) {
      hideGenericControls();
      return;
    }
    if (existing) existing.remove();

    hideGenericControls();
    const card = document.createElement('div');
    card.id = 'certificatesVisualCard';
    card.className = 'general-card';
    card.style.cssText += ';display:grid;gap:12px;';
    card.innerHTML = '<h3 style="margin:0">Certificado profissional</h3><p style="font-size:10px;color:#807981;line-height:1.5;margin:-4px 0 2px">Edite toda a seção: textos, imagens, benefícios, carrossel e acabamento visual.</p>';

    card.appendChild(checkbox('Mostrar seção de certificado', certificates.enabled !== false, value => {
      certificates.enabled = value;
      changed();
    }));

    const copyBlock = sectionBlock('Textos da seção');
    copyBlock.appendChild(checkbox('Mostrar selo superior', certificates.eyebrow.visible !== false, value => {
      certificates.eyebrow.visible = value;
      changed(true);
    }));
    if (certificates.eyebrow.visible !== false) {
      copyBlock.appendChild(field('Texto do selo', textInput(certificates.eyebrow.text, 'CERTIFICAÇÃO PROFISSIONAL', value => {
        certificates.eyebrow.text = value;
        changed();
      })));
    }
    copyBlock.appendChild(field('Título principal', textArea(certificates.title, 'Título da seção', value => {
      certificates.title = value;
      changed();
    }, 3)));
    copyBlock.appendChild(field('Trecho em rosa', textInput(certificates.highlight, 'certificado profissional', value => {
      certificates.highlight = value;
      changed();
    }), 'Digite exatamente o trecho do título que deve receber a cor de destaque.'));
    copyBlock.appendChild(checkbox('Mostrar subtítulo', certificates.subtitle.visible !== false, value => {
      certificates.subtitle.visible = value;
      changed(true);
    }));
    if (certificates.subtitle.visible !== false) {
      copyBlock.appendChild(field('Subtítulo', textArea(certificates.subtitle.text, 'Explique o valor do certificado...', value => {
        certificates.subtitle.text = value;
        changed();
      })));
    }
    card.appendChild(copyBlock);

    const visual = sectionBlock('Apresentação do certificado', 'Por padrão a imagem é mostrada inteira para não cortar nomes, selos ou assinaturas.');
    visual.appendChild(field('Modo de exibição', selectInput(certificates.displayMode, [
      ['single', 'Uma imagem em destaque'],
      ['carousel', 'Carrossel de certificados']
    ], value => {
      certificates.displayMode = value;
      changed(true);
    })));
    visual.appendChild(field('Proporção do quadro', selectInput(certificates.aspect, [
      ['4/3', '4:3 — recomendado'],
      ['1.414/1', 'A4 horizontal'],
      ['16/9', '16:9'],
      ['auto', 'Proporção original da imagem']
    ], value => {
      certificates.aspect = value;
      changed();
    })));
    visual.appendChild(field('Enquadramento', selectInput(certificates.imageFit, [
      ['contain', 'Mostrar certificado inteiro'],
      ['cover', 'Preencher o quadro (pode cortar)']
    ], value => {
      certificates.imageFit = value;
      changed();
    })));
    visual.appendChild(checkbox('Usar brilho premium ao redor', certificates.premiumGlow !== false, value => {
      certificates.premiumGlow = value;
      changed();
    }));
    if (certificates.displayMode === 'carousel') {
      visual.appendChild(checkbox('Mostrar setas', certificates.showArrows !== false, value => {
        certificates.showArrows = value;
        changed();
      }));
      visual.appendChild(checkbox('Mostrar contador', certificates.showCounter !== false, value => {
        certificates.showCounter = value;
        changed();
      }));
    }
    card.appendChild(visual);

    const images = sectionBlock('Imagens dos certificados', 'Envie PNG, JPG ou WebP. O painel mantém resolução alta para preservar textos e assinaturas.');
    const list = document.createElement('div');
    list.style.cssText = 'display:grid;gap:10px;';
    certificates.images.forEach((item, index) => list.appendChild(imageCard(item, index)));
    images.appendChild(list);
    const addImage = document.createElement('button');
    addImage.type = 'button';
    addImage.className = 'btn primary';
    addImage.textContent = '+ Adicionar certificado';
    addImage.onclick = () => {
      certificates.images.push({ id: uid(), src: '', alt: `Certificado ${certificates.images.length + 1}`, visible: true });
      changed(true);
    };
    images.appendChild(addImage);
    card.appendChild(images);

    const benefits = sectionBlock('Benefícios abaixo do certificado');
    benefits.appendChild(checkbox('Mostrar benefícios', certificates.benefits.visible !== false, value => {
      certificates.benefits.visible = value;
      changed(true);
    }));
    if (certificates.benefits.visible !== false) {
      const benefitList = document.createElement('div');
      benefitList.style.cssText = 'display:grid;gap:8px;';
      certificates.benefits.items.forEach((text, index) => benefitList.appendChild(benefitRow(text, index)));
      benefits.appendChild(benefitList);
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'mini-btn';
      add.textContent = '+ Adicionar benefício';
      add.onclick = () => {
        certificates.benefits.items.push('Novo benefício');
        changed(true);
      };
      benefits.appendChild(add);
    }
    card.appendChild(benefits);

    const final = sectionBlock('Bloco final de autoridade');
    final.appendChild(checkbox('Mostrar bloco final', certificates.final.visible !== false, value => {
      certificates.final.visible = value;
      changed(true);
    }));
    if (certificates.final.visible !== false) {
      final.appendChild(field('Título do bloco', textInput(certificates.final.title, 'Certificação que valoriza sua formação', value => {
        certificates.final.title = value;
        changed();
      })));
      final.appendChild(field('Texto do bloco', textArea(certificates.final.text, 'Texto final...', value => {
        certificates.final.text = value;
        changed();
      })));
    }
    card.appendChild(final);

    editorBox.prepend(card);
  }

  function scheduleRender(force = false) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => renderCard(force), 70);
  }

  async function persist() {
    if (!loaded) await ensureLoaded();
    if (!dirty) return;
    const content = await api('/api/content');
    content.site = { ...(content.site || {}), certificates: clone(certificates) };
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
      toast('Seção do certificado salva.');
    } catch (error) {
      toast(error.message);
    } finally {
      this.disabled = false;
    }
  };

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && dirty) {
      setTimeout(() => persist().catch(error => toast(error.message)), 2400);
    }
  });

  preview.addEventListener('load', () => {
    if (!loaded) ensureLoaded().then(() => scheduleRender()).catch(error => toast(error.message));
    else setTimeout(applyPreview, 260);
  });

  new MutationObserver(() => scheduleRender()).observe(document.querySelector('#sectorTitle'), { childList: true, subtree: true, characterData: true });
  new MutationObserver(() => scheduleRender()).observe(editorBox, { childList: true, subtree: false });
  setTimeout(() => {
    ensureLoaded().then(() => scheduleRender()).catch(error => toast(error.message));
  }, 350);
})();
