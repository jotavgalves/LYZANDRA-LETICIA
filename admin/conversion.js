(() => {
  const preview = document.querySelector('#preview');
  const editorBox = document.querySelector('#sectorEditor');
  const saveBtn = document.querySelector('#saveBtn');
  if (!preview || !editorBox || !saveBtn) return;

  const ICON_OPTIONS = [
    ['book-open', 'Livro / módulos'],
    ['badge-check', 'Certificado'],
    ['headset', 'Suporte'],
    ['files', 'Materiais / arquivos'],
    ['eye', 'Cílios / técnica'],
    ['shield-check', 'Garantia / proteção'],
    ['monitor-play', 'Curso online / vídeo'],
    ['key-round', 'Acesso'],
    ['message-circle', 'Mensagem / atendimento'],
    ['credit-card', 'Pagamento'],
    ['lock', 'Checkout protegido'],
    ['sparkles', 'Destaque / brilho'],
    ['graduation-cap', 'Formação'],
    ['clock', 'Tempo / agilidade'],
    ['calendar', 'Agenda'],
    ['heart', 'Cuidado'],
    ['star', 'Destaque / avaliação'],
    ['check-circle', 'Confirmação']
  ];

  const FALLBACK = {
    enabled: true,
    navigation: { enabled: true, brand: 'Speed Lash', ctaLabel: 'Quero minha vaga', items: [
      { label: 'Método', target: 'metodo' }, { label: 'Resultados', target: 'resultados' }, { label: 'Certificado', target: 'certificado' }, { label: 'Sobre', target: 'sobre' }, { label: 'Dúvidas', target: 'duvidas' }
    ] },
    hero: {
      enabled: true,
      trustItems: ['Curso online', 'Acesso após confirmação', 'Certificado profissional', 'Suporte'],
      trustIcons: ['monitor-play', 'key-round', 'badge-check', 'headset'],
      proofText: 'Método estruturado para otimizar o atendimento com técnica, segurança e consistência.'
    },
    stickyCta: { enabled: true, label: 'QUERO MINHA VAGA', sublabel: 'Conheça a oferta', target: 'planos' },
    receive: { enabled: true, eyebrow: 'TUDO O QUE VOCÊ RECEBE', title: 'Uma formação completa, não apenas aulas', description: 'O Speed Lash reúne conteúdo técnico, prática orientada e recursos para você estudar com uma sequência clara e aplicar o método com mais segurança.', items: [
      { title: '5 módulos + módulo bônus', text: 'Conteúdo organizado do preparo à finalização, com prática e gestão do atendimento.', icon: 'book-open' },
      { title: 'Certificado profissional', text: 'Conclusão com certificado para valorizar sua formação e trajetória profissional.', icon: 'badge-check' },
      { title: 'Suporte durante a formação', text: 'Apoio para dúvidas e acompanhamento durante o processo de aprendizagem.', icon: 'headset' },
      { title: 'Materiais complementares', text: 'Conteúdos extras para reforçar o estudo e a execução das técnicas.', icon: 'files' },
      { title: 'Técnicas procuradas', text: 'Volume Russo, Capping e Efeito Molhado dentro da metodologia do curso.', icon: 'eye' },
      { title: '7 dias de garantia', text: 'Período de garantia apresentado na própria oferta do Speed Lash.', icon: 'shield-check' }
    ] },
    authority: { enabled: true, title: 'Experiência que sustenta o método', description: 'Os números abaixo reproduzem as informações apresentadas na própria página e podem ser editados pelo painel.', stats: [
      { value: 'Mais de 4 anos', label: 'de experiência profissional' }, { value: 'Mais de 9 mil', label: 'atendimentos realizados' }, { value: 'Palestrante e jurada', label: 'em eventos e campeonatos' }
    ] },
    offerTrust: {
      enabled: true,
      items: ['Pagamento seguro', '7 dias de garantia', 'Acesso após confirmação', 'Checkout protegido'],
      icons: ['credit-card', 'shield-check', 'key-round', 'lock']
    },
    faq: { enabled: true, title: 'Mais dúvidas antes de começar?', items: [
      { question: 'O curso tem certificado?', answer: 'Sim. A formação inclui certificado de conclusão, apresentado em uma seção própria desta página.' },
      { question: 'Quais técnicas estão incluídas?', answer: 'O conteúdo apresentado inclui Volume Russo, Capping e Efeito Molhado, além de fundamentos, patologia ocular, treino prático, finalização e gestão.' },
      { question: 'Como funciona a garantia?', answer: 'A oferta informa garantia incondicional de 7 dias. Consulte os termos da compra para os detalhes aplicáveis ao seu pedido.' },
      { question: 'Quando recebo meu acesso?', answer: 'O acesso é liberado conforme a confirmação do pagamento pela plataforma de checkout. As instruções são enviadas no fluxo da compra.' }
    ] },
    microInteractions: true
  };

  let config = JSON.parse(JSON.stringify(FALLBACK));
  let loaded = false;
  let dirty = false;
  let renderTimer = 0;
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

  function inferIcon(text, fallback = 'sparkles') {
    if (preview.contentWindow?.LyzandraConversion?.inferIcon) return preview.contentWindow.LyzandraConversion.inferIcon(text, fallback);
    const value = String(text || '').toLocaleLowerCase('pt-BR');
    if (/certific/.test(value)) return 'badge-check';
    if (/garantia/.test(value)) return 'shield-check';
    if (/checkout|protegid/.test(value)) return 'lock';
    if (/pagamento|cartão|cartao/.test(value)) return 'credit-card';
    if (/acesso|libera/.test(value)) return 'key-round';
    if (/suporte|dúvida|duvida/.test(value)) return 'headset';
    if (/material|arquivo/.test(value)) return 'files';
    if (/técnic|tecnic|cíli|cilio|volume|lash/.test(value)) return 'eye';
    if (/módulo|modulo|aula|conteúdo|conteudo|formação|formacao/.test(value)) return 'book-open';
    if (/online|vídeo|video/.test(value)) return 'monitor-play';
    return fallback;
  }

  function normalize(value) {
    if (preview.contentWindow?.LyzandraConversion?.normalize) return preview.contentWindow.LyzandraConversion.normalize(value);
    const raw = value && typeof value === 'object' ? value : {};
    const out = clone(FALLBACK);
    Object.assign(out, raw);
    ['navigation','hero','stickyCta','receive','authority','offerTrust','faq'].forEach(key => { out[key] = { ...clone(FALLBACK[key]), ...(raw[key] || {}) }; });
    ['navigation','receive','authority','faq'].forEach(key => {
      const prop = key === 'navigation' ? 'items' : key === 'authority' ? 'stats' : 'items';
      if (!Array.isArray(out[key][prop])) out[key][prop] = clone(FALLBACK[key][prop]);
    });
    if (!Array.isArray(out.hero.trustItems)) out.hero.trustItems = clone(FALLBACK.hero.trustItems);
    if (!Array.isArray(out.hero.trustIcons)) out.hero.trustIcons = clone(FALLBACK.hero.trustIcons);
    if (!Array.isArray(out.offerTrust.items)) out.offerTrust.items = clone(FALLBACK.offerTrust.items);
    if (!Array.isArray(out.offerTrust.icons)) out.offerTrust.icons = clone(FALLBACK.offerTrust.icons);
    out.receive.items = out.receive.items.map((item, index) => ({ ...(item || {}), icon: item?.icon || inferIcon(item?.title, FALLBACK.receive.items[index]?.icon || 'sparkles') }));
    return out;
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
    status?.classList.add('dirty');
    status?.classList.remove('saved');
    const text = status?.querySelector('span:last-child');
    if (text) text.textContent = 'Alterações não salvas';
  }

  function changed(rerender = false) {
    markDirty();
    applyPreview();
    if (rerender) scheduleRender(true);
  }

  async function ensureLoaded() {
    if (loaded) return;
    let content = {};
    try { content = await api('/api/content'); } catch {}
    config = normalize(content.site?.conversion || {});
    loaded = true;
    applyPreview();
  }

  function applyPreview() {
    const data = { site: { conversion: clone(config) } };
    if (preview.contentWindow?.LyzandraConversion?.apply) preview.contentWindow.LyzandraConversion.apply(data);
    else setTimeout(() => preview.contentWindow?.LyzandraConversion?.apply?.(data), 280);
  }

  function isGeneral() {
    return /Configurações gerais/i.test(document.querySelector('#sectorTitle')?.textContent || '');
  }

  function checkbox(label, checked, onChange) {
    const row = document.createElement('label');
    row.className = 'visibility-line';
    const text = document.createElement('span'); text.textContent = label;
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = !!checked;
    input.onchange = () => onChange(input.checked);
    row.append(text, input); return row;
  }

  function field(label, input, hint = '') {
    const wrap = document.createElement('div'); wrap.className = 'mini-field';
    const lab = document.createElement('label'); lab.textContent = label; wrap.appendChild(lab);
    if (hint) { const small = document.createElement('small'); small.textContent = hint; small.style.cssText = 'display:block;color:#807981;font-size:10px;line-height:1.45;margin:-2px 0 5px;'; wrap.appendChild(small); }
    wrap.appendChild(input); return wrap;
  }

  function textInput(value, placeholder, onInput) {
    const input = document.createElement('input'); input.type = 'text'; input.value = value || ''; input.placeholder = placeholder || '';
    input.oninput = () => onInput(input.value); return input;
  }

  function textArea(value, placeholder, onInput, rows = 4) {
    const input = document.createElement('textarea'); input.rows = rows; input.value = value || ''; input.placeholder = placeholder || '';
    input.oninput = () => onInput(input.value); return input;
  }

  function iconSelect(value, onChange) {
    const select = document.createElement('select');
    select.style.cssText = 'width:100%;min-height:38px;border:1px solid #ded8dc;border-radius:10px;background:#fff;padding:0 10px;font:inherit;color:#292427;';
    ICON_OPTIONS.forEach(([key, label]) => {
      const option = document.createElement('option');
      option.value = key; option.textContent = label; option.selected = key === value;
      select.appendChild(option);
    });
    if (!ICON_OPTIONS.some(([key]) => key === value)) select.value = 'sparkles';
    select.onchange = () => onChange(select.value);
    return select;
  }

  function details(title, description = '') {
    const box = document.createElement('details'); box.open = false;
    box.style.cssText = 'border:1px solid #eee8eb;border-radius:14px;padding:0 12px;background:#fff;';
    const summary = document.createElement('summary'); summary.style.cssText = 'cursor:pointer;padding:12px 2px;font-size:12px;font-weight:750;color:#292427;'; summary.textContent = title;
    box.appendChild(summary);
    if (description) { const p = document.createElement('p'); p.textContent = description; p.style.cssText = 'font-size:10px;line-height:1.5;color:#807981;margin:-2px 0 10px;'; box.appendChild(p); }
    const body = document.createElement('div'); body.style.cssText = 'display:grid;gap:10px;padding:0 0 12px;'; box.appendChild(body);
    return { box, body };
  }

  function linesEditor(values, placeholder, onChange) {
    return textArea((values || []).join('\n'), placeholder, value => onChange(value.split(/\r?\n/).map(v => v.trim()).filter(Boolean)), 5);
  }

  function iconSequenceEditor(labels, values, onChange) {
    const box = document.createElement('div');
    box.style.cssText = 'display:grid;gap:7px;';
    (labels || []).forEach((label, index) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:grid;grid-template-columns:minmax(0,1fr) minmax(130px,.85fr);gap:8px;align-items:center;padding:8px;border:1px solid #eee8eb;border-radius:10px;background:#faf8f9;';
      const title = document.createElement('span');
      title.textContent = label;
      title.style.cssText = 'font-size:10px;color:#5f575c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      const current = values?.[index] || inferIcon(label);
      row.append(title, iconSelect(current, icon => {
        while (values.length <= index) values.push('sparkles');
        values[index] = icon;
        onChange(values);
      }));
      box.appendChild(row);
    });
    return box;
  }

  function navEditor() {
    const value = (config.navigation.items || []).map(item => `${item.label || ''}|${item.target || ''}`).join('\n');
    return textArea(value, 'Método|metodo\nResultados|resultados', text => {
      config.navigation.items = text.split(/\r?\n/).map(line => {
        const [label, target] = line.split('|');
        return { label: (label || '').trim(), target: (target || '').trim() };
      }).filter(item => item.label && item.target);
      changed();
    }, 6);
  }

  function pairRepeater(items, labels) {
    const box = document.createElement('div'); box.style.cssText = 'display:grid;gap:8px;';
    const render = () => {
      box.innerHTML = '';
      items.forEach((item, index) => {
        const card = document.createElement('div'); card.style.cssText = 'display:grid;gap:7px;padding:10px;border:1px solid #eee8eb;border-radius:12px;background:#faf8f9;';
        if (labels.iconKey) {
          const current = item[labels.iconKey] || inferIcon(item[labels.aKey], labels.defaultIcon || 'sparkles');
          card.appendChild(field(labels.iconLabel || 'Ícone', iconSelect(current, value => { item[labels.iconKey] = value; changed(); })));
        }
        const a = textInput(item[labels.aKey] || '', labels.aLabel, value => {
          item[labels.aKey] = value;
          if (labels.iconKey && !item[labels.iconKey]) item[labels.iconKey] = inferIcon(value, labels.defaultIcon || 'sparkles');
          changed();
        });
        const b = labels.textarea
          ? textArea(item[labels.bKey] || '', labels.bLabel, value => { item[labels.bKey] = value; changed(); }, 3)
          : textInput(item[labels.bKey] || '', labels.bLabel, value => { item[labels.bKey] = value; changed(); });
        const actions = document.createElement('div'); actions.className = 'inline-actions';
        const up = document.createElement('button'); up.type = 'button'; up.className = 'mini-btn'; up.textContent = '↑'; up.disabled = index === 0;
        up.onclick = () => { [items[index - 1], items[index]] = [items[index], items[index - 1]]; changed(true); };
        const down = document.createElement('button'); down.type = 'button'; down.className = 'mini-btn'; down.textContent = '↓'; down.disabled = index === items.length - 1;
        down.onclick = () => { [items[index + 1], items[index]] = [items[index], items[index + 1]]; changed(true); };
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'mini-btn danger'; remove.textContent = 'Excluir';
        remove.onclick = () => { items.splice(index, 1); changed(true); };
        actions.append(up, down, remove); card.append(a, b, actions); box.appendChild(card);
      });
      const add = document.createElement('button'); add.type = 'button'; add.className = 'mini-btn'; add.textContent = labels.addLabel || '+ Adicionar';
      add.onclick = () => {
        const item = { [labels.aKey]: '', [labels.bKey]: '' };
        if (labels.iconKey) item[labels.iconKey] = labels.defaultIcon || 'sparkles';
        items.push(item); changed(true);
      };
      box.appendChild(add);
    };
    render(); return box;
  }

  function renderCard(force = false) {
    if (!isGeneral()) return;
    if (!loaded) { ensureLoaded().then(() => renderCard(true)).catch(error => toast(error.message)); return; }
    const existing = document.querySelector('#conversionExperienceCard');
    if (existing && !force) return;
    existing?.remove();

    const card = document.createElement('div'); card.id = 'conversionExperienceCard'; card.className = 'general-card'; card.style.cssText += ';display:grid;gap:12px;';
    card.innerHTML = '<h3 style="margin:0">Conversão e experiência</h3><p style="font-size:10px;color:#807981;line-height:1.5;margin:-4px 0 2px">Controla navegação, prova de confiança, CTA móvel, conteúdo da oferta e agora também os ícones semânticos exibidos na landing.</p>';
    card.appendChild(checkbox('Ativar melhorias de conversão', config.enabled !== false, value => { config.enabled = value; changed(); }));
    card.appendChild(checkbox('Ativar microinterações suaves', config.microInteractions !== false, value => { config.microInteractions = value; changed(); }));

    const nav = details('Navegação superior', 'Menu discreto no desktop para facilitar o acesso às principais partes da landing.');
    nav.body.append(
      checkbox('Mostrar navegação', config.navigation.enabled !== false, value => { config.navigation.enabled = value; changed(); }),
      field('Nome / marca', textInput(config.navigation.brand, 'Speed Lash', value => { config.navigation.brand = value; changed(); })),
      field('Texto do botão', textInput(config.navigation.ctaLabel, 'Quero minha vaga', value => { config.navigation.ctaLabel = value; changed(); })),
      field('Links do menu', navEditor(), 'Uma linha por item no formato: Texto|alvo. Alvos: metodo, resultados, certificado, sobre, duvidas, planos.')
    ); card.appendChild(nav.box);

    const hero = details('Confiança no primeiro bloco', 'Linha curta de informações que aparece perto do CTA principal, agora com ícones específicos.');
    hero.body.append(
      checkbox('Mostrar informações de confiança', config.hero.enabled !== false, value => { config.hero.enabled = value; changed(); }),
      field('Itens', linesEditor(config.hero.trustItems, 'Curso online\nCertificado', value => {
        config.hero.trustItems = value;
        config.hero.trustIcons = value.map((text, index) => config.hero.trustIcons[index] || inferIcon(text));
        changed();
      }), 'Um item por linha.'),
      field('Ícones', iconSequenceEditor(config.hero.trustItems, config.hero.trustIcons, value => { config.hero.trustIcons = [...value]; changed(); }), 'Cada ícone acompanha o item na mesma posição.'),
      field('Texto de apoio', textArea(config.hero.proofText, '', value => { config.hero.proofText = value; changed(); }, 3))
    ); card.appendChild(hero.box);

    const sticky = details('CTA fixo no celular', 'Surge depois que a pessoa sai do primeiro bloco e não cobre o conteúdo.');
    sticky.body.append(
      checkbox('Ativar CTA móvel', config.stickyCta.enabled !== false, value => { config.stickyCta.enabled = value; changed(); }),
      field('Texto principal', textInput(config.stickyCta.label, '', value => { config.stickyCta.label = value; changed(); })),
      field('Texto pequeno', textInput(config.stickyCta.sublabel, '', value => { config.stickyCta.sublabel = value; changed(); }))
    ); card.appendChild(sticky.box);

    const receive = details('O que a aluna recebe', 'Cada card possui um ícone próprio que continua vinculado ao item mesmo se ele for reorganizado.');
    receive.body.append(
      checkbox('Mostrar bloco', config.receive.enabled !== false, value => { config.receive.enabled = value; changed(); }),
      field('Selo', textInput(config.receive.eyebrow, '', value => { config.receive.eyebrow = value; changed(); })),
      field('Título', textInput(config.receive.title, '', value => { config.receive.title = value; changed(); })),
      field('Descrição', textArea(config.receive.description, '', value => { config.receive.description = value; changed(); }, 3)),
      field('Itens', pairRepeater(config.receive.items, { aKey: 'title', bKey: 'text', iconKey: 'icon', iconLabel: 'Ícone do card', defaultIcon: 'sparkles', aLabel: 'Título', bLabel: 'Descrição', textarea: true, addLabel: '+ Adicionar item' }))
    ); card.appendChild(receive.box);

    const authority = details('Autoridade da Lyzandra', 'Transforma os dados já apresentados na página em elementos visuais de credibilidade.');
    authority.body.append(
      checkbox('Mostrar reforço de autoridade', config.authority.enabled !== false, value => { config.authority.enabled = value; changed(); }),
      field('Título', textInput(config.authority.title, '', value => { config.authority.title = value; changed(); })),
      field('Descrição', textArea(config.authority.description, '', value => { config.authority.description = value; changed(); }, 3)),
      field('Dados / números', pairRepeater(config.authority.stats, { aKey: 'value', bKey: 'label', aLabel: 'Destaque', bLabel: 'Legenda', textarea: false, addLabel: '+ Adicionar dado' }))
    ); card.appendChild(authority.box);

    const offer = details('Confiança perto do pagamento', 'Os selos próximos ao checkout usam ícones coerentes com pagamento, garantia, acesso e proteção.');
    offer.body.append(
      checkbox('Mostrar linha de segurança', config.offerTrust.enabled !== false, value => { config.offerTrust.enabled = value; changed(); }),
      field('Itens', linesEditor(config.offerTrust.items, 'Pagamento seguro\n7 dias de garantia', value => {
        config.offerTrust.items = value;
        config.offerTrust.icons = value.map((text, index) => config.offerTrust.icons[index] || inferIcon(text));
        changed();
      }), 'Um item por linha.'),
      field('Ícones', iconSequenceEditor(config.offerTrust.items, config.offerTrust.icons, value => { config.offerTrust.icons = [...value]; changed(); }), 'Cada ícone acompanha o item na mesma posição.')
    ); card.appendChild(offer.box);

    const faq = details('Perguntas comerciais extras', 'Complementa o FAQ já existente.');
    faq.body.append(
      checkbox('Mostrar perguntas extras', config.faq.enabled !== false, value => { config.faq.enabled = value; changed(); }),
      field('Título', textInput(config.faq.title, '', value => { config.faq.title = value; changed(); })),
      field('Perguntas', pairRepeater(config.faq.items, { aKey: 'question', bKey: 'answer', aLabel: 'Pergunta', bLabel: 'Resposta', textarea: true, addLabel: '+ Adicionar pergunta' }))
    ); card.appendChild(faq.box);

    editorBox.appendChild(card);
  }

  function scheduleRender(force = false) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => renderCard(force), 70);
  }

  async function persist(force = false) {
    if (!loaded) await ensureLoaded();
    if (!dirty && !force) return;
    const content = await api('/api/content');
    content.site = { ...(content.site || {}), conversion: clone(config) };
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
      status?.classList.remove('dirty'); status?.classList.add('saved');
      const text = status?.querySelector('span:last-child'); if (text) text.textContent = 'Salvo';
    } catch (error) { toast(error.message); }
    finally { this.disabled = false; }
  };

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') setTimeout(() => persist(true).catch(error => toast(error.message)), 3000);
  });

  preview.addEventListener('load', () => {
    if (!loaded) ensureLoaded().then(() => scheduleRender()).catch(error => toast(error.message));
    else setTimeout(applyPreview, 320);
  });
  new MutationObserver(() => scheduleRender()).observe(document.querySelector('#sectorTitle'), { childList: true, subtree: true, characterData: true });
  new MutationObserver(() => scheduleRender()).observe(editorBox, { childList: true, subtree: false });
  setTimeout(() => ensureLoaded().then(() => scheduleRender()).catch(error => toast(error.message)), 520);
})();