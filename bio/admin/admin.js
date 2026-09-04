(() => {
  const clone = v => JSON.parse(JSON.stringify(v));
  const merge = (base, raw) => {
    if (Array.isArray(base)) return Array.isArray(raw) ? raw : clone(base);
    if (!base || typeof base !== 'object') return raw ?? base;
    const out = { ...base };
    Object.keys(base).forEach(k => { out[k] = merge(base[k], raw?.[k]); });
    if (raw && typeof raw === 'object') Object.keys(raw).forEach(k => { if (!(k in out)) out[k] = raw[k]; });
    return out;
  };

  const loginView = document.querySelector('#loginView');
  const adminApp = document.querySelector('#adminApp');
  const editor = document.querySelector('#editor');
  const status = document.querySelector('#saveStatus');
  const preview = document.querySelector('#previewFrame');
  const previewShell = document.querySelector('#previewShell');
  const sectorTitle = document.querySelector('#sectorTitle');
  const sectorDescription = document.querySelector('#sectorDescription');
  const sectorSelect = document.querySelector('#sectorSelect');

  const META = {
    geral: ['Configurações gerais', 'Marca, textos, redes sociais e links institucionais.'],
    imagens: ['Imagens do topo', 'Carrossel, enquadramento e textos do hero da bio.'],
    links: ['Botões e acessos', 'CTA principal, links, ordem, ícones e destinos.'],
    marketing: ['Marketing e Pixel', 'Meta Pixel, Google Analytics, Tag Manager e eventos de clique.'],
    visual: ['Visual', 'Cores exclusivas da bio, sem alterar a landing principal.']
  };

  const ICON_OPTIONS = [
    ['bag', 'Compra'], ['video', 'Vídeo / curso'], ['chart', 'Resultados'],
    ['certificate', 'Certificado'], ['user', 'Pessoa'], ['whatsapp', 'WhatsApp'],
    ['instagram', 'Instagram'], ['globe', 'Site']
  ];

  let config = clone(window.BIO_DEFAULT || {});
  let active = 'geral';
  let dirty = false;

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
    box.textContent = message;
    box.classList.remove('hidden');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.add('hidden'), 2800);
  }

  function setStatus(text, kind = 'saved') {
    status.classList.remove('saved', 'dirty');
    status.classList.add(kind);
    let label = status.querySelector('span:last-child');
    if (!label) {
      status.innerHTML = '<span class="dot"></span><span></span>';
      label = status.querySelector('span:last-child');
    }
    label.textContent = text;
  }

  function mark() {
    dirty = true;
    setStatus('Alterações não salvas', 'dirty');
    refreshPreview();
  }

  function field(label, control, hint = '') {
    const wrap = document.createElement('div');
    wrap.className = 'mini-field';
    const lab = document.createElement('label');
    lab.textContent = label;
    wrap.appendChild(lab);
    if (hint) {
      const small = document.createElement('small');
      small.textContent = hint;
      wrap.appendChild(small);
    }
    wrap.appendChild(control);
    return wrap;
  }

  function input(value, onInput, type = 'text') {
    const el = document.createElement('input');
    el.type = type;
    el.value = value ?? '';
    el.oninput = () => { onInput(type === 'checkbox' ? el.checked : el.value); mark(); };
    return el;
  }

  function textarea(value, onInput, rows = 4) {
    const el = document.createElement('textarea');
    el.rows = rows;
    el.value = value ?? '';
    el.oninput = () => { onInput(el.value); mark(); };
    return el;
  }

  function select(value, options, onChange) {
    const el = document.createElement('select');
    options.forEach(([v, label]) => {
      const option = document.createElement('option');
      option.value = v;
      option.textContent = label;
      option.selected = v === value;
      el.appendChild(option);
    });
    el.onchange = () => { onChange(el.value); mark(); };
    return el;
  }

  function check(label, checked, onChange) {
    const row = document.createElement('label');
    row.className = 'check';
    const text = document.createElement('span');
    text.textContent = label;
    const el = document.createElement('input');
    el.type = 'checkbox';
    el.checked = !!checked;
    el.onchange = () => { onChange(el.checked); mark(); render(); };
    row.append(text, el);
    return row;
  }

  function section(title, description = '') {
    const box = document.createElement('section');
    box.className = 'section';
    const h = document.createElement('h2');
    h.textContent = title;
    box.appendChild(h);
    if (description) {
      const p = document.createElement('p');
      p.textContent = description;
      box.appendChild(p);
    }
    return box;
  }

  function row(...elements) {
    const box = document.createElement('div');
    box.className = 'row';
    elements.forEach(el => box.appendChild(el));
    return box;
  }

  function miniButton(label, fn, cls = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mini ${cls}`.trim();
    button.textContent = label;
    button.onclick = fn;
    return button;
  }

  async function uploadInto(target, key) {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.onchange = async () => {
      const file = picker.files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      try {
        toast('Enviando imagem…');
        const result = await api('/api/upload', { method: 'POST', body: form });
        target[key] = result.url;
        mark();
        render();
        toast('Imagem enviada.');
      } catch (error) {
        toast(error.message);
      }
    };
    picker.click();
  }

  function imageField(label, object, key, hint = '') {
    const wrap = document.createElement('div');
    wrap.className = 'mini-field';
    const lab = document.createElement('label');
    lab.textContent = label;
    wrap.appendChild(lab);
    if (hint) {
      const small = document.createElement('small');
      small.textContent = hint;
      wrap.appendChild(small);
    }
    const line = document.createElement('div');
    line.className = 'upload-line';
    const text = input(object[key] || '', value => object[key] = value);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Upload';
    button.onclick = () => uploadInto(object, key);
    line.append(text, button);
    wrap.appendChild(line);
    return wrap;
  }

  function renderGeneral() {
    const s = config.site;
    const sec = section('Identidade e texto', 'A bio agora usa somente o nome da marca no topo; não há logo visível na página pública.');
    sec.append(
      row(
        field('Marca', input(s.brand, value => s.brand = value)),
        field('Subtítulo da marca', input(s.brandSubtitle, value => s.brandSubtitle = value))
      ),
      field('Título da página', input(s.title, value => s.title = value)),
      field('Descrição / SEO', textarea(s.description, value => s.description = value, 3)),
      field('Frase da Lyzandra', textarea(s.quote, value => s.quote = value, 4)),
      row(
        field('Autor da frase', input(s.quoteAuthor, value => s.quoteAuthor = value)),
        field('Linha inferior', input(s.location, value => s.location = value))
      ),
      row(
        field('Termos', input(s.termsUrl, value => s.termsUrl = value)),
        field('Privacidade', input(s.privacyUrl, value => s.privacyUrl = value))
      )
    );
    editor.appendChild(sec);

    const tags = section('Chips da formação', 'Uma linha por item.');
    tags.append(
      check('Mostrar chips', config.tags.visible !== false, value => config.tags.visible = value),
      field('Título', input(config.tags.title, value => config.tags.title = value)),
      field('Itens', textarea((config.tags.items || []).join('\n'), value => {
        config.tags.items = value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      }, 6))
    );
    editor.appendChild(tags);

    const social = section('Redes sociais');
    social.append(
      field('Instagram', input(config.socials.instagram, value => config.socials.instagram = value)),
      field('WhatsApp', input(config.socials.whatsapp, value => config.socials.whatsapp = value), 'Use o link completo wa.me.'),
      field('Site', input(config.socials.website, value => config.socials.website = value))
    );
    editor.appendChild(social);
  }

  function renderImages() {
    const sec = section('Carrossel de imagens', 'Cada slide tem upload, enquadramento, ordem e textos independentes.');
    sec.append(
      check('Autoplay', config.carousel.autoplay !== false, value => config.carousel.autoplay = value),
      field('Intervalo entre imagens (ms)', input(config.carousel.intervalMs, value => config.carousel.intervalMs = Math.max(2500, Number(value) || 4800), 'number'))
    );

    (config.carousel.slides || []).forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'item';
      const head = document.createElement('div');
      head.className = 'item-head';
      const title = document.createElement('strong');
      title.textContent = `Imagem ${index + 1}`;
      const actions = document.createElement('div');
      actions.className = 'mini-actions';
      actions.append(
        miniButton('↑', () => {
          if (!index) return;
          [config.carousel.slides[index - 1], config.carousel.slides[index]] = [config.carousel.slides[index], config.carousel.slides[index - 1]];
          mark(); render();
        }),
        miniButton('↓', () => {
          if (index >= config.carousel.slides.length - 1) return;
          [config.carousel.slides[index + 1], config.carousel.slides[index]] = [config.carousel.slides[index], config.carousel.slides[index + 1]];
          mark(); render();
        }),
        miniButton('Excluir', () => { config.carousel.slides.splice(index, 1); mark(); render(); }, 'danger')
      );
      head.append(title, actions);
      card.append(
        head,
        check('Mostrar slide', item.visible !== false, value => item.visible = value),
        imageField('Imagem', item, 'image'),
        field('Posição / enquadramento', input(item.position || 'center', value => item.position = value), 'Ex.: center, center 25%, 40% 20%.'),
        field('Selo', input(item.eyebrow, value => item.eyebrow = value)),
        field('Título', input(item.title, value => item.title = value)),
        field('Palavra destacada', input(item.highlight, value => item.highlight = value)),
        field('Subtítulo', textarea(item.subtitle, value => item.subtitle = value, 3))
      );
      sec.appendChild(card);
    });

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn soft';
    add.textContent = '+ Adicionar imagem';
    add.onclick = () => {
      config.carousel.slides.push({ visible: true, image: '', position: 'center', eyebrow: '', title: '', highlight: '', subtitle: '' });
      mark(); render();
    };
    sec.appendChild(add);
    editor.appendChild(sec);
  }

  function renderLinks() {
    const featured = config.featured;
    const top = section('CTA principal');
    top.append(
      check('Mostrar CTA principal', featured.visible !== false, value => featured.visible = value),
      row(
        field('Ícone', select(featured.icon || 'bag', ICON_OPTIONS, value => featured.icon = value)),
        field('Título', input(featured.title, value => featured.title = value))
      ),
      field('Subtítulo', input(featured.subtitle, value => featured.subtitle = value)),
      field('URL', input(featured.url, value => featured.url = value))
    );
    editor.appendChild(top);

    const sec = section('Lista de acessos', 'Edite, reorganize ou crie quantos botões quiser.');
    (config.links || []).forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'item';
      const head = document.createElement('div');
      head.className = 'item-head';
      const title = document.createElement('strong');
      title.textContent = `Botão ${index + 1}`;
      const actions = document.createElement('div');
      actions.className = 'mini-actions';
      actions.append(
        miniButton('↑', () => {
          if (!index) return;
          [config.links[index - 1], config.links[index]] = [config.links[index], config.links[index - 1]];
          mark(); render();
        }),
        miniButton('↓', () => {
          if (index >= config.links.length - 1) return;
          [config.links[index + 1], config.links[index]] = [config.links[index], config.links[index + 1]];
          mark(); render();
        }),
        miniButton('Excluir', () => { config.links.splice(index, 1); mark(); render(); }, 'danger')
      );
      head.append(title, actions);
      card.append(
        head,
        check('Mostrar', item.visible !== false, value => item.visible = value),
        row(
          field('Ícone', select(item.icon || 'globe', ICON_OPTIONS, value => item.icon = value)),
          field('Título', input(item.label, value => item.label = value))
        ),
        field('Descrição', input(item.detail, value => item.detail = value)),
        field('URL', input(item.url, value => item.url = value))
      );
      sec.appendChild(card);
    });

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn soft';
    add.textContent = '+ Adicionar botão';
    add.onclick = () => {
      config.links.push({ visible: true, icon: 'globe', label: 'Novo acesso', detail: '', url: '' });
      mark(); render();
    };
    sec.appendChild(add);
    editor.appendChild(sec);
  }

  function renderMarketing() {
    const meta = section('Meta Pixel', 'Fica desligado até o ID ser preenchido e a opção ativada.');
    meta.append(
      check('Ativar Meta Pixel', config.marketing.metaPixel.enabled === true, value => config.marketing.metaPixel.enabled = value),
      field('Pixel ID', input(config.marketing.metaPixel.id, value => config.marketing.metaPixel.id = value), 'Ex.: 123456789012345')
    );
    editor.appendChild(meta);

    const ga = section('Google Analytics 4');
    ga.append(
      check('Ativar GA4', config.marketing.ga4.enabled === true, value => config.marketing.ga4.enabled = value),
      field('Measurement ID', input(config.marketing.ga4.id, value => config.marketing.ga4.id = value), 'Ex.: G-XXXXXXXXXX')
    );
    editor.appendChild(ga);

    const gtm = section('Google Tag Manager');
    gtm.append(
      check('Ativar GTM', config.marketing.gtm.enabled === true, value => config.marketing.gtm.enabled = value),
      field('Container ID', input(config.marketing.gtm.id, value => config.marketing.gtm.id = value), 'Ex.: GTM-XXXXXXX')
    );
    editor.appendChild(gtm);

    const events = section('Eventos');
    events.append(check('Rastrear cliques dos botões', config.marketing.trackClicks !== false, value => config.marketing.trackClicks = value));
    editor.appendChild(events);
  }

  function renderVisual() {
    const t = config.theme;
    const sec = section('Cores', 'Estas cores afetam somente a bio.');
    sec.append(
      row(
        field('Fundo', input(t.background, value => t.background = value, 'color')),
        field('Fundo secundário', input(t.backgroundSoft, value => t.backgroundSoft = value, 'color'))
      ),
      row(
        field('Rosa principal', input(t.primary, value => t.primary = value, 'color')),
        field('Rosa claro', input(t.primarySoft, value => t.primarySoft = value, 'color'))
      ),
      row(
        field('Texto', input(t.text, value => t.text = value, 'color')),
        field('Texto secundário', input(t.muted, value => t.muted = value, 'color'))
      )
    );
    editor.appendChild(sec);
  }

  function updateHeading() {
    const [title, description] = META[active] || META.geral;
    sectorTitle.textContent = title;
    sectorDescription.textContent = description;
    sectorSelect.value = active;
    document.querySelectorAll('.sector-item[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === active));
  }

  function render() {
    editor.innerHTML = '';
    updateHeading();
    ({ geral: renderGeneral, imagens: renderImages, links: renderLinks, marketing: renderMarketing, visual: renderVisual }[active] || renderGeneral)();
  }

  function refreshPreview() {
    clearTimeout(refreshPreview.timer);
    refreshPreview.timer = setTimeout(() => {
      try {
        if (preview.contentWindow?.BioApp?.apply) preview.contentWindow.BioApp.apply(clone(config));
      } catch {}
    }, 120);
  }

  async function load() {
    const session = await api('/api/session');
    if (!session.authenticated) {
      loginView.classList.remove('hidden');
      adminApp.classList.add('hidden');
      return;
    }
    loginView.classList.add('hidden');
    adminApp.classList.remove('hidden');
    const data = await api('/api/bio-content');
    config = merge(config, data);
    dirty = false;
    setStatus('Salvo', 'saved');
    render();
    setTimeout(refreshPreview, 450);
  }

  async function save() {
    const button = document.querySelector('#saveBtn');
    try {
      button.disabled = true;
      await api('/api/bio-content', { method: 'PUT', body: JSON.stringify(config) });
      dirty = false;
      setStatus('Salvo', 'saved');
      toast('Bio salva.');
    } catch (error) {
      toast(error.message);
    } finally {
      button.disabled = false;
    }
  }

  document.querySelector('#loginForm').onsubmit = async event => {
    event.preventDefault();
    const error = document.querySelector('#loginError');
    error.textContent = '';
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify({ password: document.querySelector('#password').value }) });
      await load();
    } catch (err) {
      error.textContent = err.message;
    }
  };

  document.querySelector('#tabs').onclick = event => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    active = button.dataset.tab;
    render();
  };

  sectorSelect.onchange = () => { active = sectorSelect.value; render(); };
  document.querySelector('#saveBtn').onclick = save;
  document.querySelector('#openBio').onclick = () => window.open('../', '_blank', 'noopener');
  document.querySelector('#reloadBtn').onclick = () => { preview.src = '../?admin-preview=1&t=' + Date.now(); };
  document.querySelector('#logoutBtn').onclick = async () => {
    try { await api('/api/logout', { method: 'POST' }); } catch {}
    location.reload();
  };

  document.querySelectorAll('[data-device]').forEach(button => {
    button.onclick = () => {
      document.querySelectorAll('[data-device]').forEach(item => item.classList.toggle('active', item === button));
      previewShell.classList.remove('desktop', 'tablet', 'mobile');
      previewShell.classList.add(button.dataset.device);
    };
  });

  preview.addEventListener('load', () => setTimeout(refreshPreview, 180));

  window.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      save();
    }
  });

  load().catch(error => { document.querySelector('#loginError').textContent = error.message; });
})();
