(() => {
  const DEFAULT = { version: 2, patches: {}, sectionOrder: [], site: { customCss: '', theme: {} }, videos: {} };
  const qs = (s, root=document) => root.querySelector(s);
  const qsa = (s, root=document) => [...root.querySelectorAll(s)];

  function mergeData(data) {
    return {
      ...DEFAULT,
      ...(data || {}),
      patches: { ...DEFAULT.patches, ...((data && data.patches) || {}) },
      videos: { ...DEFAULT.videos, ...((data && data.videos) || {}) },
      site: {
        ...DEFAULT.site,
        ...((data && data.site) || {}),
        theme: { ...DEFAULT.site.theme, ...((data && data.site && data.site.theme) || {}) }
      }
    };
  }

  function applyPatch(el, patch) {
    if (!el || !patch) return;
    if (typeof patch.html === 'string') el.innerHTML = patch.html;
    if (typeof patch.text === 'string') el.textContent = patch.text;
    if (typeof patch.className === 'string') el.className = patch.className;
    if (typeof patch.styleText === 'string') el.setAttribute('style', patch.styleText);
    if (patch.attrs && typeof patch.attrs === 'object') {
      Object.entries(patch.attrs).forEach(([k,v]) => {
        if (v === null || v === undefined || v === '') el.removeAttribute(k);
        else el.setAttribute(k, String(v));
      });
    }
    if (patch.hidden === true) el.dataset.editorHidden = 'true';
    else if (patch.hidden === false) delete el.dataset.editorHidden;
  }

  function applyTheme(theme={}) {
    const root = document.documentElement;
    const vars = {
      primary: '--primary',
      background: '--background',
      foreground: '--foreground',
      card: '--card',
      muted: '--muted-foreground'
    };
    Object.entries(vars).forEach(([key, cssVar]) => {
      const value = theme[key];
      if (value) root.style.setProperty(cssVar, value);
      else root.style.removeProperty(cssVar);
    });
  }

  function applySite(site={}) {
    if (site.title) document.title = site.title;
    if (typeof site.description === 'string') {
      let meta = qs('meta[name="description"]');
      if (!meta) { meta=document.createElement('meta'); meta.name='description'; document.head.appendChild(meta); }
      meta.content = site.description;
    }
    applyTheme(site.theme || {});
    let style = qs('#site-custom-css');
    if (!style) { style=document.createElement('style'); style.id='site-custom-css'; document.head.appendChild(style); }
    style.textContent = site.customCss || '';
  }

  function applyOrder(order=[]) {
    const main = qs('main');
    if (!main || !Array.isArray(order) || !order.length) return;
    const map = new Map(qsa(':scope > section[data-edit-id]', main).map(s => [s.dataset.editId, s]));
    order.forEach(id => { const el=map.get(id); if (el) main.appendChild(el); });
  }

  function youtubeId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || '';
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || '';
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || '';
        return u.searchParams.get('v') || '';
      }
    } catch {}
    return '';
  }

  function vimeoId(url) {
    try {
      const u = new URL(url);
      if (!u.hostname.includes('vimeo.com')) return '';
      return u.pathname.split('/').filter(Boolean).find(x => /^\d+$/.test(x)) || '';
    } catch {}
    return '';
  }

  function makePlayer(url, cfg={}) {
    const yt = youtubeId(url);
    const vi = vimeoId(url);
    const autoplay = cfg.autoplay ? '1' : '0';
    const controls = cfg.controls === false ? '0' : '1';

    if (yt) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(yt)}?autoplay=${autoplay}&controls=${controls}&rel=0&playsinline=1`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.title = cfg.title || 'Vídeo';
      return iframe;
    }
    if (vi) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://player.vimeo.com/video/${encodeURIComponent(vi)}?autoplay=${autoplay}&controls=${controls}`;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title = cfg.title || 'Vídeo';
      return iframe;
    }

    const isDirect = /\.(mp4|webm|ogg)(?:$|[?#])/i.test(url) || url.startsWith('/media/');
    if (isDirect) {
      const video = document.createElement('video');
      video.src = url;
      video.playsInline = true;
      video.preload = 'metadata';
      video.controls = cfg.controls !== false;
      if (cfg.autoplay) { video.autoplay = true; video.muted = true; }
      return video;
    }

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.title = cfg.title || 'Vídeo';
    return iframe;
  }

  function mountOneVideo(id, cfg={}) {
    const source = qs(`[data-edit-id="${CSS.escape(id)}"]`);
    if (!source) return;
    const host = source.parentElement;
    if (!host) return;

    const previous = host.querySelector(`:scope > .site-video-player[data-video-for="${CSS.escape(id)}"]`);
    if (previous) previous.remove();
    source.hidden = false;
    source.removeAttribute('aria-hidden');

    const url = String(cfg.url || '').trim();
    if (!url) return;

    source.hidden = true;
    source.setAttribute('aria-hidden', 'true');

    const wrap = document.createElement('div');
    wrap.className = 'site-video-player';
    wrap.dataset.videoFor = id;
    wrap.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;overflow:hidden;background:#000;';

    const openPlayer = () => {
      wrap.innerHTML = '';
      const player = makePlayer(url, cfg);
      player.style.cssText = 'width:100%;height:100%;border:0;display:block;object-fit:cover;';
      wrap.appendChild(player);
    };

    if (cfg.poster && !cfg.autoplay) {
      const cover = document.createElement('button');
      cover.type = 'button';
      cover.setAttribute('aria-label', 'Reproduzir vídeo');
      cover.style.cssText = `position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;cursor:pointer;background:#000 url("${String(cfg.poster).replace(/"/g, '%22')}") center/cover no-repeat;`;
      cover.innerHTML = '<span style="position:absolute;inset:0;background:rgba(0,0,0,.18)"></span><span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:999px;background:#dc2626;color:#fff;display:grid;place-items:center;font-size:26px;box-shadow:0 10px 30px rgba(0,0,0,.35)">▶</span>';
      cover.addEventListener('click', openPlayer, {once:true});
      wrap.appendChild(cover);
    } else {
      openPlayer();
    }

    host.appendChild(wrap);
  }

  function applyVideos(videos={}) {
    Object.entries(videos || {}).forEach(([id,cfg]) => mountOneVideo(id, cfg || {}));
  }

  async function loadContent() {
    let data = DEFAULT;
    try {
      const r = await fetch('/api/content', {cache:'no-store'});
      if (r.ok) data = mergeData(await r.json());
    } catch (_) {}
    window.__SITE_CONTENT__ = data;
    Object.entries(data.patches || {}).forEach(([id,patch]) => applyPatch(qs(`[data-edit-id="${CSS.escape(id)}"]`), patch));
    applyOrder(data.sectionOrder);
    applySite(data.site);
    applyVideos(data.videos);
    window.dispatchEvent(new CustomEvent('site-content-ready', {detail:data}));
    return data;
  }

  function initFaq() {
    const faqHeading = qsa('h2').find(h => h.textContent.trim().toLowerCase().includes('perguntas frequentes'));
    const section = faqHeading && faqHeading.closest('section');
    if (!section) return;
    qsa('button[aria-expanded]', section).forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.parentElement;
        const content = card && btn.nextElementSibling;
        if (!content) return;
        const next = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', next ? 'true' : 'false');
        content.classList.toggle('grid-rows-[1fr]', next);
        content.classList.toggle('opacity-100', next);
        content.classList.toggle('grid-rows-[0fr]', !next);
        content.classList.toggle('opacity-0', !next);
        const icon = btn.querySelector('svg');
        if (icon) icon.innerHTML = next ? '<path d="M5 12h14"></path>' : '<path d="M5 12h14"></path><path d="M12 5v14"></path>';
      });
    });
  }

  function initCarousel() {
    qsa('section').forEach(section => {
      const scroller = qs('.overflow-x-auto', section);
      if (!scroller) return;
      const buttons = qsa('button[aria-label]', section);
      const prev = buttons.find(b => /anterior/i.test(b.getAttribute('aria-label')||''));
      const next = buttons.find(b => /próximo|proximo/i.test(b.getAttribute('aria-label')||''));
      const amount = () => Math.max(280, scroller.clientWidth * .82);
      prev && prev.addEventListener('click', () => scroller.scrollBy({left:-amount(),behavior:'smooth'}));
      next && next.addEventListener('click', () => scroller.scrollBy({left: amount(),behavior:'smooth'}));
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadContent();
    initFaq();
    initCarousel();
  });
})();
