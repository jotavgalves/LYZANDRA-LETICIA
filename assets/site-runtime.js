(() => {
  const DEFAULT = { version: 1, patches: {}, sectionOrder: [], site: { customCss: '' } };
  const qs = (s, root=document) => root.querySelector(s);
  const qsa = (s, root=document) => [...root.querySelectorAll(s)];

  function mergeData(data) {
    return {
      ...DEFAULT,
      ...(data || {}),
      patches: { ...DEFAULT.patches, ...((data && data.patches) || {}) },
      site: { ...DEFAULT.site, ...((data && data.site) || {}) }
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
    if (patch.hidden === true) {
      el.dataset.editorHidden = 'true';
    } else if (patch.hidden === false) {
      delete el.dataset.editorHidden;
    }
  }

  function applySite(site={}) {
    if (site.title) document.title = site.title;
    if (typeof site.description === 'string') {
      let meta = qs('meta[name="description"]');
      if (!meta) { meta=document.createElement('meta'); meta.name='description'; document.head.appendChild(meta); }
      meta.content = site.description;
    }
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

  async function loadContent() {
    let data = DEFAULT;
    try {
      const r = await fetch('/api/content', {cache:'no-store'});
      if (r.ok) data = mergeData(await r.json());
    } catch (_) { /* Site remains fully usable without bindings/API. */ }
    window.__SITE_CONTENT__ = data;
    Object.entries(data.patches || {}).forEach(([id,patch]) => applyPatch(qs(`[data-edit-id="${CSS.escape(id)}"]`), patch));
    applyOrder(data.sectionOrder);
    applySite(data.site);
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
