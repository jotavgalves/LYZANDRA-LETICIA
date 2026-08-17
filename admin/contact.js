(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  if (!preview || !editorBox || !saveBtn) return;

  const DEFAULT_CONTACT = {
    phone: '',
    message: 'Olá! Gostaria de saber mais sobre o curso.',
    customUrl: '',
    openNew: true,
    floating: {
      visible: true,
      text: 'Fale com a nossa equipe',
      color: '#22c55e',
      position: 'right'
    },
    footer: {
      visible: true,
      useSameLink: true,
      text: 'Fale com a nossa equipe',
      customUrl: ''
    }
  };

  let contact = clone(DEFAULT_CONTACT);
  let loaded = false;
  let contactDirty = false;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeContact(value) {
    return {
      ...clone(DEFAULT_CONTACT),
      ...(value || {}),
      floating: { ...DEFAULT_CONTACT.floating, ...((value && value.floating) || {}) },
      footer: { ...DEFAULT_CONTACT.footer, ...((value && value.footer) || {}) }
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
    toast.timer = setTimeout(() => box.classList.add('hidden'), 3000);
  }

  function markDirty() {
    contactDirty = true;
    const status = document.querySelector('#saveStatus');
    if (!status) return;
    status.classList.add('dirty');
    status.classList.remove('saved');
    const text = status.querySelector('span:last-child');
    if (text) text.textContent = 'Alterações não salvas';
  }

  function cleanPhone(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function buildMainUrl() {
    const custom = String(contact.customUrl || '').trim();
    if (custom) return custom;
    const phone = cleanPhone(contact.phone);
    if (!phone) return '#';
    const message = String(contact.message || '').trim();
    return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  }

  function footerUrl() {
    if (contact.footer.useSameLink !== false) return buildMainUrl();
    return String(contact.footer.customUrl || '').trim() || '#';
  }

  function setExternalBehavior(anchor, url) {
    if (!anchor) return;
    if (contact.openNew && /^(https?:)?\/\//i.test(url)) {
      anchor.target = '_blank';
      anchor.rel = 'noopener';
    } else {
      anchor.removeAttribute('target');
      anchor.removeAttribute('rel');
    }
  }

  function setAnchorTextKeepingIcon(anchor, text) {
    if (!anchor) return;
    const wanted = String(text || '').trim() || 'Fale com a nossa equipe';
    let textNode = [...anchor.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
    if (!textNode) {
      textNode = anchor.ownerDocument.createTextNode(wanted);
      anchor.insertBefore(textNode, anchor.firstChild);
    } else {
      textNode.nodeValue = wanted;
    }
  }

  function applyContact(doc) {
    if (!doc) return;
    const mainUrl = buildMainUrl();
    const floating = doc.querySelector('[data-edit-id="a-006"]');
    const floatingText = doc.querySelector('[data-edit-id="span-070"]');
    const footer = doc.querySelector('[data-edit-id="a-005"]');

    if (floating) {
      floating.href = mainUrl;
      setExternalBehavior(floating, mainUrl);
      if (contact.floating.visible === false) floating.dataset.editorHidden = 'true';
      else delete floating.dataset.editorHidden;
      floating.style.backgroundColor = contact.floating.color || '#22c55e';
      if (contact.floating.position === 'left') {
        floating.style.left = '20px';
        floating.style.right = 'auto';
      } else {
        floating.style.right = '20px';
        floating.style.left = 'auto';
      }
    }

    if (floatingText) floatingText.textContent = contact.floating.text || 'Fale com a nossa equipe';

    if (footer) {
      const url = footerUrl();
      footer.href = url;
      setExternalBehavior(footer, url);
      if (contact.footer.visible === false) footer.dataset.editorHidden = 'true';
      else delete footer.dataset.editorHidden;
      setAnchorTextKeepingIcon(footer, contact.footer.text || 'Fale com a nossa equipe');
    }
  }

  async function ensureLoaded() {
    if (loaded) return;
    try {
      const content = await api('/api/content');
      contact = mergeContact(content.site?.contact);
    } catch {
      contact = mergeContact();
    }
    loaded = true;
    applyContact(preview.contentDocument);
  }

  function field(label, input, hint = '') {
    const wrap = document.createElement('div');
    wrap.className = 'mini-field';
    const title = document.createElement('label');
    title.textContent = label;
    wrap.appendChild(title);
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
    input.value = value || '';
    input.placeholder = placeholder || '';
    input.rows = 3;
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

  function changed(reRender = false) {
    markDirty();
    applyContact(preview.contentDocument);
    if (reRender) renderContactCard(true);
  }

  function makeSegmentedPosition() {
    const box = document.createElement('div');
    box.className = 'segmented';
    [['left', 'Esquerda'], ['right', 'Direita']].forEach(([value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.classList.toggle('active', contact.floating.position === value);
      button.onclick = () => {
        contact.floating.position = value;
        changed(true);
      };
      box.appendChild(button);
    });
    return box;
  }

  function renderContactCard(force = false) {
    const title = document.querySelector('#sectorTitle')?.textContent || '';
    if (!/Configurações gerais/i.test(title)) return;
    const existing = document.querySelector('#contactVisualCard');
    if (existing && !force) return;
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'contactVisualCard';
    card.className = 'general-card';
    card.innerHTML = '<h3>WhatsApp e contato</h3><p style="font-size:10px;color:#807981;line-height:1.5;margin:-3px 0 12px">Controle o botão verde “Fale com a nossa equipe” e o contato do rodapé. A prévia muda na mesma hora.</p>';

    card.appendChild(field(
      'Número do WhatsApp',
      textInput(contact.phone, 'Ex.: 5583999999999', value => {
        contact.phone = value;
        changed();
      }),
      'Digite com código do país + DDD. Exemplo: 55 + DDD + número.'
    ));

    card.appendChild(field(
      'Mensagem que já abre pronta',
      textArea(contact.message, 'Olá! Gostaria de saber mais sobre o curso.', value => {
        contact.message = value;
        changed();
      })
    ));

    card.appendChild(field(
      'Usar outro link em vez do WhatsApp (opcional)',
      textInput(contact.customUrl, 'https://... deixe vazio para usar o WhatsApp', value => {
        contact.customUrl = value.trim();
        changed();
      })
    ));

    const floating = document.createElement('div');
    floating.style.cssText = 'padding:12px 0;border-top:1px solid #efedef;display:grid;gap:10px;';
    const floatingTitle = document.createElement('strong');
    floatingTitle.textContent = 'Botão flutuante';
    floatingTitle.style.fontSize = '12px';
    floating.appendChild(floatingTitle);
    floating.appendChild(checkbox('Mostrar botão flutuante', contact.floating.visible !== false, value => {
      contact.floating.visible = value;
      changed();
    }));
    floating.appendChild(field('Texto do botão', textInput(contact.floating.text, 'Fale com a nossa equipe', value => {
      contact.floating.text = value;
      changed();
    })));

    const colorRow = document.createElement('div');
    colorRow.className = 'visual-row';
    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Cor do botão';
    const color = document.createElement('input');
    color.type = 'color';
    color.value = contact.floating.color || '#22c55e';
    color.oninput = () => {
      contact.floating.color = color.value;
      changed();
    };
    colorRow.append(colorLabel, color);
    floating.appendChild(colorRow);
    floating.appendChild(field('Lado da tela', makeSegmentedPosition()));
    card.appendChild(floating);

    const footer = document.createElement('div');
    footer.style.cssText = 'padding:12px 0 0;border-top:1px solid #efedef;display:grid;gap:10px;';
    const footerTitle = document.createElement('strong');
    footerTitle.textContent = 'Contato no rodapé';
    footerTitle.style.fontSize = '12px';
    footer.appendChild(footerTitle);
    footer.appendChild(checkbox('Mostrar “Fale com a nossa equipe” no rodapé', contact.footer.visible !== false, value => {
      contact.footer.visible = value;
      changed();
    }));
    footer.appendChild(checkbox('Usar o mesmo WhatsApp/link do botão flutuante', contact.footer.useSameLink !== false, value => {
      contact.footer.useSameLink = value;
      changed(true);
    }));
    footer.appendChild(field('Texto no rodapé', textInput(contact.footer.text, 'Fale com a nossa equipe', value => {
      contact.footer.text = value;
      changed();
    })));
    if (contact.footer.useSameLink === false) {
      footer.appendChild(field('Link próprio do rodapé', textInput(contact.footer.customUrl, 'https://...', value => {
        contact.footer.customUrl = value.trim();
        changed();
      })));
    }
    card.appendChild(footer);
    card.appendChild(checkbox('Abrir links externos em nova aba', contact.openNew !== false, value => {
      contact.openNew = value;
      changed();
    }));

    const identityCard = document.querySelector('#identityVisualCard');
    if (identityCard && identityCard.parentElement === editorBox) identityCard.insertAdjacentElement('afterend', card);
    else editorBox.prepend(card);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function makeFooterHtml(doc) {
    const current = doc?.querySelector('[data-edit-id="a-005"]');
    const svg = current?.querySelector('svg')?.outerHTML || '';
    return `${escapeHtml(contact.footer.text || 'Fale com a nossa equipe')}${svg}`;
  }

  async function persistContact() {
    const content = await api('/api/content');
    content.site = { ...(content.site || {}), contact: clone(contact) };
    content.patches = { ...(content.patches || {}) };

    const mainUrl = buildMainUrl();
    const footerLink = footerUrl();
    const floatingStyle = [
      `background-color:${contact.floating.color || '#22c55e'}`,
      contact.floating.position === 'left' ? 'left:20px' : 'left:auto',
      contact.floating.position === 'left' ? 'right:auto' : 'right:20px'
    ].join(';') + ';';

    content.patches['a-006'] = {
      ...(content.patches['a-006'] || {}),
      attrs: {
        ...((content.patches['a-006'] || {}).attrs || {}),
        href: mainUrl,
        target: contact.openNew && /^(https?:)?\/\//i.test(mainUrl) ? '_blank' : '',
        rel: contact.openNew && /^(https?:)?\/\//i.test(mainUrl) ? 'noopener' : ''
      },
      styleText: floatingStyle,
      hidden: contact.floating.visible === false
    };

    content.patches['span-070'] = {
      ...(content.patches['span-070'] || {}),
      text: contact.floating.text || 'Fale com a nossa equipe'
    };

    content.patches['a-005'] = {
      ...(content.patches['a-005'] || {}),
      attrs: {
        ...((content.patches['a-005'] || {}).attrs || {}),
        href: footerLink,
        target: contact.openNew && /^(https?:)?\/\//i.test(footerLink) ? '_blank' : '',
        rel: contact.openNew && /^(https?:)?\/\//i.test(footerLink) ? 'noopener' : ''
      },
      html: makeFooterHtml(preview.contentDocument),
      hidden: contact.footer.visible === false
    };

    await api('/api/content', { method: 'PUT', body: JSON.stringify(content) });
    contactDirty = false;
  }

  const originalSave = saveBtn.onclick;
  saveBtn.onclick = async function(event) {
    if (typeof originalSave === 'function') await originalSave.call(this, event);
    try {
      this.disabled = true;
      await persistContact();
      const status = document.querySelector('#saveStatus');
      if (status) {
        status.classList.remove('dirty');
        status.classList.add('saved');
        const text = status.querySelector('span:last-child');
        if (text) text.textContent = 'Salvo';
      }
      if (contactDirty) toast('Contato salvo.');
    } catch (error) {
      toast(error.message);
    } finally {
      this.disabled = false;
    }
  };

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      setTimeout(() => persistContact().catch(error => toast(error.message)), 1000);
    }
  });

  preview.addEventListener('load', async () => {
    await ensureLoaded();
    setTimeout(() => applyContact(preview.contentDocument), 300);
  });

  const observer = new MutationObserver(async () => {
    await ensureLoaded();
    renderContactCard(false);
  });
  observer.observe(editorBox, { childList: true, subtree: false });

  ensureLoaded().then(() => renderContactCard(false));
})();