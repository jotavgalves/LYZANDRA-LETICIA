(() => {
  const DEFAULT = {
    version: 5,
    patches: {},
    sectionOrder: [],
    site: { customCss: '', theme: {} },
    videos: {}
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

  function mergeData(data = {}) {
    return {
      ...DEFAULT,
      ...data,
      patches: { ...DEFAULT.patches, ...(data.patches || {}) },
      videos: { ...DEFAULT.videos, ...(data.videos || {}) },
      site: {
        ...DEFAULT.site,
        ...(data.site || {}),
        theme: { ...DEFAULT.site.theme, ...((data.site && data.site.theme) || {}) }
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
      Object.entries(patch.attrs).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') el.removeAttribute(key);
        else el.setAttribute(key, String(value));
      });
    }
    if (patch.hidden === true) el.dataset.editorHidden = 'true';
    else if (patch.hidden === false) delete el.dataset.editorHidden;
  }

  function applyTheme(theme = {}) {
    const map = {
      primary: '--primary',
      background: '--background',
      foreground: '--foreground',
      card: '--card',
      muted: '--muted-foreground'
    };
    Object.entries(map).forEach(([key, cssVar]) => {
      if (theme[key]) document.documentElement.style.setProperty(cssVar, theme[key]);
      else document.documentElement.style.removeProperty(cssVar);
    });
  }

  function applySite(site = {}) {
    if (site.title) document.title = site.title;
    if (typeof site.description === 'string') {
      let meta = qs('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = site.description;
    }
    applyTheme(site.theme || {});
    let style = qs('#site-custom-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'site-custom-css';
      document.head.appendChild(style);
    }
    style.textContent = site.customCss || '';

    if (!qs('script[data-identity-runtime]')) {
      const identityRuntime = document.createElement('script');
      identityRuntime.src = '/assets/identity-runtime.js?v=1';
      identityRuntime.dataset.identityRuntime = '1';
      document.head.appendChild(identityRuntime);
    }
  }

  function applyOrder(order = []) {
    const main = qs('main');
    if (!main || !Array.isArray(order) || !order.length) return;
    const map = new Map(qsa(':scope > section[data-edit-id]', main).map(section => [section.dataset.editId, section]));
    order.forEach(id => {
      const section = map.get(id);
      if (section) main.appendChild(section);
    });
  }

  function youtubeId(url) {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || '';
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname.startsWith('/embed/') || u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || '';
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

  function tiktokId(url) {
    const value = String(url || '');
    const match = value.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i) || value.match(/tiktok\.com\/player\/v1\/(\d+)/i);
    return match?.[1] || '';
  }

  function instagramInfo(url) {
    try {
      const u = new URL(url);
      if (!u.hostname.includes('instagram.com')) return null;
      const match = u.pathname.match(/^\/(reel|p|tv)\/([^/?#]+)/i);
      return match ? { type: match[1].toLowerCase(), code: match[2] } : null;
    } catch {
      return null;
    }
  }

  function isFacebook(url) {
    try {
      const u = new URL(url);
      return /(^|\.)facebook\.com$|(^|\.)fb\.watch$/.test(u.hostname);
    } catch {
      return false;
    }
  }

  function isDirect(url) {
    return /\.(mp4|webm|ogg|m4v)(?:$|[?#])/i.test(url) || String(url || '').startsWith('/media/');
  }

  function providerOf(url) {
    if (youtubeId(url)) return 'youtube';
    if (vimeoId(url)) return 'vimeo';
    if (tiktokId(url)) return 'tiktok';
    if (instagramInfo(url)) return 'instagram';
    if (isFacebook(url)) return 'facebook';
    if (isDirect(url)) return 'arquivo';
    return url ? 'outro' : 'vazio';
  }

  function autoPoster(url) {
    const id = youtubeId(url);
    return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/maxresdefault.jpg` : '';
  }

  function effectivePoster(url, cfg = {}, fallback = '') {
    if (cfg.posterCustom && cfg.poster) return cfg.poster;
    return autoPoster(url) || cfg.poster || fallback || '';
  }

  function makePlayer(url, cfg = {}) {
    const provider = providerOf(url);
    const autoplay = cfg.autoplay ? '1' : '0';
    const controls = cfg.controls === false ? '0' : '1';
    const loop = cfg.loop ? '1' : '0';
    const muted = (cfg.autoplay || cfg.muted) ? '1' : '0';

    if (provider === 'youtube') {
      const id = youtubeId(url);
      const playlist = cfg.loop ? `&loop=1&playlist=${encodeURIComponent(id)}` : '';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=${autoplay}&controls=${controls}&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}&mute=${muted}${playlist}`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      return iframe;
    }

    if (provider === 'vimeo') {
      const id = vimeoId(url);
      const iframe = document.createElement('iframe');
      iframe.src = `https://player.vimeo.com/video/${encodeURIComponent(id)}?autoplay=${autoplay}&controls=${controls}&loop=${loop}&muted=${muted}&quality=1080p&max_quality=4k&quality_selector=1`;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      return iframe;
    }

    if (provider === 'tiktok') {
      const id = tiktokId(url);
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.tiktok.com/player/v1/${encodeURIComponent(id)}?controls=${controls}&autoplay=${autoplay}&muted=${muted}&loop=${loop}&rel=0`;
      iframe.allow = 'autoplay; fullscreen';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      return iframe;
    }

    if (provider === 'instagram') {
      const info = instagramInfo(url);
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.instagram.com/${encodeURIComponent(info.type)}/${encodeURIComponent(info.code)}/embed/`;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      return iframe;
    }

    if (provider === 'facebook') {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=1280&autoplay=${autoplay}`;
      iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      return iframe;
    }

    if (provider === 'arquivo') {
      const video = document.createElement('video');
      video.src = url;
      video.playsInline = true;
      video.preload = 'metadata';
      video.controls = cfg.controls !== false;
      video.loop = !!cfg.loop;
      video.muted = !!(cfg.autoplay || cfg.muted);
      if (cfg.autoplay) video.autoplay = true;
      return video;
    }

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    return iframe;
  }

  function mountOneVideo(id, cfg = {}) {
    const source = qs(`[data-edit-id="${CSS.escape(id)}"]`);
    if (!source) return;
    const host = source.parentElement;
    if (!host) return;

    host.querySelectorAll(`:scope > .site-video-player[data-video-for="${CSS.escape(id)}"]`).forEach(x => x.remove());
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

    const fallback = source.querySelector('img')?.getAttribute('src') || '';
    const poster = effectivePoster(url, cfg, fallback);

    if (poster && !cfg.autoplay) {
      const cover = document.createElement('button');
      cover.type = 'button';
      cover.setAttribute('aria-label', 'Reproduzir vídeo');
      cover.style.cssText = `position:absolute;inset:0;width:100%;height:100%;border:0;padding:0;cursor:pointer;background:#000 url("${String(poster).replace(/"/g, '%22')}") center/cover no-repeat;`;
      cover.innerHTML = '<span style="position:absolute;inset:0;background:rgba(0,0,0,.16)"></span><span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:999px;background:#dc2626;color:#fff;display:grid;place-items:center;font-size:25px;box-shadow:0 10px 30px rgba(0,0,0,.35)">▶</span>';
      cover.addEventListener('click', openPlayer, { once: true });
      wrap.appendChild(cover);
    } else {
      openPlayer();
    }

    host.appendChild(wrap);
  }

  function applyVideos(videos = {}) {
    qsa('.site-video-player').forEach(x => x.remove());
    Object.entries(videos || {}).forEach(([id, cfg]) => mountOneVideo(id, cfg || {}));
  }

  async function loadContent() {
    let data = DEFAULT;
    try {
      const response = await fetch('/api/content', { cache: 'no-store' });
      if (response.ok) data = mergeData(await response.json());
    } catch {}

    window.__SITE_CONTENT__ = data;
    Object.entries(data.patches || {}).forEach(([id, patch]) => {
      applyPatch(qs(`[data-edit-id="${CSS.escape(id)}"]`), patch);
    });
    applyOrder(data.sectionOrder);
    applySite(data.site);
    applyVideos(data.videos);
    window.dispatchEvent(new CustomEvent('site-content-ready', { detail: data }));
    return data;
  }

  function initFaq() {
    const heading = qsa('h2').find(h => h.textContent.trim().toLowerCase().includes('perguntas frequentes'));
    const section = heading && heading.closest('section');
    if (!section) return;

    qsa('button[aria-expanded]', section).forEach(button => {
      button.addEventListener('click', () => {
        const content = button.nextElementSibling;
        if (!content) return;
        const next = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', next ? 'true' : 'false');
        content.classList.toggle('grid-rows-[1fr]', next);
        content.classList.toggle('opacity-100', next);
        content.classList.toggle('grid-rows-[0fr]', !next);
        content.classList.toggle('opacity-0', !next);
        const icon = button.querySelector('svg');
        if (icon) {
          icon.innerHTML = next
            ? '<path d="M5 12h14"></path>'
            : '<path d="M5 12h14"></path><path d="M12 5v14"></path>';
        }
      });
    });
  }

  function initCarousel() {
    qsa('section').forEach(section => {
      const scroller = qs('.overflow-x-auto', section);
      if (!scroller) return;
      const buttons = qsa('button[aria-label]', section);
      const prev = buttons.find(b => /anterior/i.test(b.getAttribute('aria-label') || ''));
      const next = buttons.find(b => /próximo|proximo/i.test(b.getAttribute('aria-label') || ''));
      const amount = () => Math.max(280, scroller.clientWidth * 0.82);
      if (prev) prev.addEventListener('click', () => scroller.scrollBy({ left: -amount(), behavior: 'smooth' }));
      if (next) next.addEventListener('click', () => scroller.scrollBy({ left: amount(), behavior: 'smooth' }));
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadContent();
    initFaq();
    initCarousel();
  });
})();