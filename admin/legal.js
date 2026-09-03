(() => {
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  if (!editorBox || !saveBtn) return;

  const API = '/api/legal';
  let legal = null;
  let loaded = false;
  let dirty = false;
  let renderTimer = 0;
  let saveTimer = 0;

  const clone = value => JSON.parse(JSON.stringify(value));

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

  function isGeneral() {
    return /Configurações gerais/i.test(document.querySelector('#sectorTitle')?.textContent || '');
  }

  function markDirty() {
    dirty = true;
    const status = document.querySelector('#saveStatus');
    if (status) {
      status.classList.add('dirty');
      status.classList.remove('saved');
      const label = status.querySelector('span:last-child');
      if (label) label.textContent = 'Alterações não salvas';
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => persist().catch(error => toast(error.message)), 1200);
  }

  async function ensureLoaded() {
    if (loaded) return;
    legal = await api(API);
    loaded = true;
  }

  async function persist(force = false) {
    if (!loaded) await ensureLoaded();
    if (!dirty && !force) return;
    clearTimeout(saveTimer);
    await api(API, { method: 'PUT', body: JSON.stringify(legal) });
    dirty = false;
    const status = document.querySelector('#saveStatus');
    if (status) {
      status.classList.remove('dirty');
      status.classList.add('saved');
      const label = status.querySelector('span:last-child');
      if (label) label.textContent = 'Salvo';
    }
    const local = document.querySelector('#legalSaveStatus');
    if (local) local.textContent = 'Salvo automaticamente';
  }

  function changed(rerender = false) {
    markDirty();
    const local = document.querySelector('#legalSaveStatus');
    if (local) local.textContent = 'Alterações pendentes…';
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

  function input(value, onInput, type = 'text', placeholder = '') {
    const el = document.createElement('input');
    el.type = type;
    el.value = value || '';
    el.placeholder = placeholder;
    el.oninput = () => { onInput(el.value); changed(); };
    return el;
  }

  function textarea(value, onInput, rows = 5, placeholder = '') {
    const el = document.createElement('textarea');
    el.rows = rows;
    el.value = value || '';
    el.placeholder = placeholder;
    el.oninput = () => { onInput(el.value); changed(); };
    return el;
  }

  function sectionTitle(text) {
    const el = document.createElement('div');
    el.style.cssText = 'font-size:12px;font-weight:800;color:#292427;padding-top:4px;';
    el.textContent = text;
    return el;
  }

  function actionsRow(...buttons) {
    const row = document.createElement('div');
    row.className = 'inline-actions';
    buttons.forEach(button => row.appendChild(button));
    return row;
  }

  function button(label, onClick, danger = false) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = danger ? 'mini-btn danger' : 'mini-btn';
    el.textContent = label;
    el.onclick = onClick;
    return el;
  }

  function move(array, index, delta) {
    const next = index + delta;
    if (next < 0 || next >= array.length) return;
    [array[index], array[next]] = [array[next], array[index]];
    changed(true);
  }

  function highlightEditor(doc) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;gap:8px;';
    doc.highlights.forEach((item, index) => {
      const box = document.createElement('div');
      box.className = 'control-card';
      box.style.cssText += ';display:grid;gap:8px;';
      box.append(
        field('Título do destaque', input(item.title, value => item.title = value)),
        field('Texto', textarea(item.text, value => item.text = value, 2))
      );
      box.appendChild(actionsRow(
        button('↑', () => move(doc.highlights, index, -1)),
        button('↓', () => move(doc.highlights, index, 1)),
        button('Excluir', () => { doc.highlights.splice(index, 1); changed(true); }, true)
      ));
      wrap.appendChild(box);
    });
    wrap.appendChild(button('+ Adicionar destaque', () => { doc.highlights.push({ title: 'Novo destaque', text: 'Explique este ponto em uma frase curta.' }); changed(true); }));
    return wrap;
  }

  function sectionsEditor(doc) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;gap:9px;';
    doc.sections.forEach((section, index) => {
      const detail = document.createElement('details');
      detail.style.cssText = 'border:1px solid #eee8eb;border-radius:14px;background:#fff;overflow:hidden;';
      const summary = document.createElement('summary');
      summary.style.cssText = 'cursor:pointer;padding:12px 13px;font-size:11px;font-weight:750;color:#292427;';
      summary.textContent = section.title || `Seção ${index + 1}`;
      const body = document.createElement('div');
      body.style.cssText = 'display:grid;gap:9px;padding:0 11px 11px;';
      body.append(
        field('Título da seção', input(section.title, value => { section.title = value; summary.textContent = value || `Seção ${index + 1}`; })),
        field('Conteúdo', textarea(section.body, value => section.body = value, 8, 'Use uma linha em branco para separar parágrafos. Para lista, comece cada item com “- ”.'), 'Use uma linha em branco para separar parágrafos. Linhas iniciadas por “- ” viram lista na página.'),
        actionsRow(
          button('↑ Mover', () => move(doc.sections, index, -1)),
          button('↓ Mover', () => move(doc.sections, index, 1)),
          button('Excluir seção', () => { doc.sections.splice(index, 1); changed(true); }, true)
        )
      );
      detail.append(summary, body);
      wrap.appendChild(detail);
    });
    wrap.appendChild(button('+ Adicionar seção', () => { doc.sections.push({ title: `${doc.sections.length + 1}. Nova seção`, body: 'Escreva aqui o conteúdo desta cláusula.' }); changed(true); }));
    return wrap;
  }

  function documentEditor(kind, doc) {
    const detail = document.createElement('details');
    detail.open = false;
    detail.style.cssText = 'border:1px solid #e9e2e6;border-radius:14px;background:#faf8f9;overflow:hidden;';
    const summary = document.createElement('summary');
    summary.style.cssText = 'cursor:pointer;padding:13px 14px;font-size:12px;font-weight:800;color:#292427;';
    summary.textContent = kind === 'terms' ? 'Termos de Uso e Compra' : 'Política de Privacidade';
    const body = document.createElement('div');
    body.style.cssText = 'display:grid;gap:11px;padding:0 12px 12px;';

    const openPage = button(kind === 'terms' ? 'Abrir Termos no site ↗' : 'Abrir Privacidade no site ↗', () => {
      window.open(kind === 'terms' ? '/termos.html' : '/privacidade.html', '_blank', 'noopener');
    });

    body.append(
      actionsRow(openPage),
      field('Data da última atualização', input(doc.updatedAt, value => doc.updatedAt = value, 'date')),
      field('Selo superior', input(doc.badge, value => doc.badge = value)),
      field('Título da página', input(doc.title, value => doc.title = value)),
      field('Introdução ao cliente', textarea(doc.intro, value => doc.intro = value, 5)),
      sectionTitle('Destaques do topo'),
      highlightEditor(doc),
      sectionTitle('Cláusulas / seções'),
      sectionsEditor(doc)
    );
    detail.append(summary, body);
    return detail;
  }

  function missingBusinessFields() {
    const b = legal.business || {};
    const missing = [];
    if (!String(b.supplierName || '').trim()) missing.push('nome/razão social do fornecedor');
    if (!String(b.taxId || '').trim()) missing.push('CPF/CNPJ');
    if (!String(b.physicalAddress || '').trim()) missing.push('endereço físico');
    if (!String(b.contactEmail || '').trim()) missing.push('e-mail de atendimento');
    return missing;
  }

  function renderCard(force = false) {
    if (!isGeneral() || !loaded) return;
    const existing = document.querySelector('#legalCard');
    if (existing && !force) return;
    existing?.remove();

    const card = document.createElement('div');
    card.id = 'legalCard';
    card.className = 'general-card';
    card.style.cssText += ';display:grid;gap:12px;';
    card.innerHTML = '<h3 style="margin:0">Legal · Termos e Privacidade</h3><p style="font-size:10px;color:#807981;line-height:1.55;margin:-4px 0 0">Edite integralmente as páginas que o cliente consulta antes ou depois da compra. O conteúdo é salvo separadamente no KV e renderizado no servidor.</p>';

    const status = document.createElement('small');
    status.id = 'legalSaveStatus';
    status.style.cssText = 'font-size:10px;color:#14804a;font-weight:650;';
    status.textContent = 'Salvo automaticamente';
    card.appendChild(status);

    const missing = missingBusinessFields();
    if (missing.length) {
      const warning = document.createElement('div');
      warning.style.cssText = 'border:1px solid #f0c36a;background:#fff9e8;border-radius:12px;padding:11px;color:#6d5017;font-size:10px;line-height:1.55;';
      warning.innerHTML = `<strong>Complete a identificação do fornecedor.</strong><br>Faltam: ${missing.join(', ')}. Esses dados são importantes para transparência na contratação online.`;
      card.appendChild(warning);
    }

    card.appendChild(sectionTitle('Identificação e contato'));
    const b = legal.business;
    card.append(
      field('Marca', input(b.brandName, value => b.brandName = value, 'text', 'Ly Cílios')),
      field('Nome do curso', input(b.courseName, value => b.courseName = value, 'text', 'Speed Lash')),
      field('Instrutora apresentada', input(b.instructorName, value => b.instructorName = value, 'text', 'Lyzandra Letícia')),
      field('Nome ou razão social do fornecedor', input(b.supplierName, value => b.supplierName = value, 'text', 'Nome completo / Razão social'), 'Use quem efetivamente realiza a venda.'),
      field('CPF ou CNPJ', input(b.taxId, value => b.taxId = value, 'text', 'CPF ou CNPJ do fornecedor')),
      field('Endereço físico', textarea(b.physicalAddress, value => b.physicalAddress = value, 2, 'Rua, número, cidade/UF, CEP'), 'Informe o endereço adequado para identificação do fornecedor.'),
      field('E-mail de atendimento', input(b.contactEmail, value => b.contactEmail = value, 'email', 'contato@seudominio.com')),
      field('Descrição do canal de atendimento', input(b.contactLabel, value => b.contactLabel = value, 'text', 'Canal “Fale com a nossa equipe”…')),
      field('Plataforma de checkout', input(b.checkoutPlatform, value => b.checkoutPlatform = value, 'text', 'Kiwify'))
    );

    const refreshWarning = button('Revalidar dados obrigatórios', () => renderCard(true));
    card.appendChild(actionsRow(refreshWarning));
    card.appendChild(documentEditor('terms', legal.terms));
    card.appendChild(documentEditor('privacy', legal.privacy));

    const note = document.createElement('div');
    note.style.cssText = 'border:1px solid #eee6ea;background:#faf7f9;border-radius:12px;padding:11px;font-size:10px;line-height:1.55;color:#645d61;';
    note.innerHTML = '<strong>Importante:</strong> o painel permite adaptar o texto ao funcionamento real da operação. Não informe CNPJ, endereço, suporte, prazo de acesso ou condições comerciais que não correspondam ao fornecedor e à oferta efetivamente utilizados.';
    card.appendChild(note);

    editorBox.appendChild(card);
  }

  function scheduleRender(force = false) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => renderCard(force), 80);
  }

  const previousSave = saveBtn.onclick;
  saveBtn.onclick = async function(event) {
    if (typeof previousSave === 'function') await previousSave.call(this, event);
    try { await persist(true); }
    catch (error) { toast(error.message); }
  };

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') setTimeout(() => persist(true).catch(error => toast(error.message)), 3000);
  });

  new MutationObserver(() => scheduleRender()).observe(document.querySelector('#sectorTitle'), { childList: true, subtree: true, characterData: true });
  new MutationObserver(() => scheduleRender()).observe(editorBox, { childList: true, subtree: false });

  setTimeout(() => ensureLoaded().then(() => scheduleRender()).catch(error => toast(error.message)), 500);
})();
