(() => {
  const DEFAULTS = { enabled: true, items: [] };

  function mergeConfig(value) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      ...DEFAULTS,
      ...raw,
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

  function makeAvatar(item) {
    if (item.avatar) {
      const img = document.createElement('img');
      img.src = item.avatar;
      img.alt = item.name ? `Foto de ${item.name}` : 'Foto da aluna';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.cssText = 'width:40px;height:40px;border-radius:999px;display:block;object-fit:cover;flex:0 0 auto;';
      return img;
    }
    const initial = document.createElement('span');
    initial.className = 'flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground';
    initial.textContent = (item.name || 'A').trim().charAt(0).toUpperCase() || 'A';
    return initial;
  }

  function objectPosition(position) {
    if (position === 'top') return 'center top';
    if (position === 'bottom') return 'center bottom';
    return 'center center';
  }

  function isStoryPreset(item) {
    return item.mode === 'image' && item.fit === 'contain' && item.position === 'center' && Number(item.imageHeight) === 420;
  }

  function makeContentImage(item) {
    const story = isStoryPreset(item);
    const frame = document.createElement('div');
    frame.dataset.testimonialImageMode = story ? 'story' : 'standard';
    frame.style.cssText = story
      ? 'width:100%;aspect-ratio:9/16;overflow:hidden;border-radius:14px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);'
      : 'width:100%;overflow:hidden;border-radius:14px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name ? `Depoimento de ${item.name}` : 'Imagem do depoimento';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.style.cssText = story
      ? `display:block;width:100%;height:100%;object-fit:contain;object-position:${objectPosition(item.position)};background:#fff;`
      : `display:block;width:100%;height:${item.imageHeight}px;object-fit:${item.fit};object-position:${objectPosition(item.position)};background:#fff;`;
    frame.appendChild(img);
    return frame;
  }

  function makeTextBubble(item) {
    const bubble = document.createElement('div');
    bubble.className = 'rounded-xl rounded-tl-sm bg-white p-3 shadow-sm';
    const text = document.createElement('p');
    text.className = 'text-sm leading-relaxed text-neutral-700';
    text.textContent = item.text || '';
    bubble.appendChild(text);
    if (item.time) {
      const time = document.createElement('span');
      time.className = 'mt-1 block text-right text-[10px] text-neutral-400';
      time.textContent = item.time;
      bubble.appendChild(time);
    }
    return bubble;
  }

  function makeArticle(item) {
    const article = document.createElement('article');
    article.className = 'w-[280px] shrink-0 snap-start rounded-2xl bg-[#efe7de] p-4 text-left shadow-lg';
    article.dataset.testimonialId = item.id;
    if (isStoryPreset(item)) article.dataset.testimonialLayout = 'story';

    const header = document.createElement('div');
    header.className = 'flex items-center gap-3';
    const name = document.createElement('span');
    name.className = 'font-semibold text-neutral-800';
    name.textContent = item.name || 'Aluna';
    header.append(makeAvatar(item), name);
    article.appendChild(header);

    const body = document.createElement('div');
    body.style.cssText = 'margin-top:12px;display:grid;gap:10px;';
    const hasImage = !!item.image;
    const hasText = !!item.text.trim();

    if ((item.mode === 'image' || item.mode === 'image-text') && hasImage) body.appendChild(makeContentImage(item));
    if ((item.mode === 'text' || item.mode === 'image-text' || !hasImage) && hasText) body.appendChild(makeTextBubble(item));
    if (!body.childElementCount) {
      const empty = document.createElement('div');
      empty.className = 'rounded-xl bg-white p-4 text-sm text-neutral-400';
      empty.textContent = 'Depoimento sem conteúdo.';
      body.appendChild(empty);
    }

    article.appendChild(body);
    return article;
  }

  function apply(data) {
    const raw = data?.site?.testimonials;
    if (!raw || !Array.isArray(raw.items)) return;
    const config = mergeConfig(raw);
    const section = document.querySelector('section[data-edit-id="section-002"]');
    if (!section) return;
    section.style.display = config.enabled === false ? 'none' : '';
    if (config.enabled === false) return;

    const scroller = section.querySelector('[data-edit-id="div-008"]') || section.querySelector('.overflow-x-auto');
    if (!scroller) return;
    scroller.innerHTML = '';
    config.items.filter(item => item.visible !== false).forEach(item => scroller.appendChild(makeArticle(item)));
  }

  window.LyzandraTestimonials = { apply, mergeConfig };
  window.addEventListener('site-content-ready', event => apply(event.detail || window.__SITE_CONTENT__ || {}));
  if (window.__SITE_CONTENT__) apply(window.__SITE_CONTENT__);
})();
