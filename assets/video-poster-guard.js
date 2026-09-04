(() => {
  const TEMPLATE_IMAGE_RE = /(?:^|\/)images\//i;

  function usesTemplateImage(value = '') {
    return TEMPLATE_IMAGE_RE.test(String(value || ''));
  }

  function cleanPlayer(player) {
    if (!player) return;
    const cover = player.querySelector('button');
    if (!cover) return;
    const background = `${cover.style.backgroundImage || ''} ${cover.style.background || ''} ${getComputedStyle(cover).backgroundImage || ''}`;
    if (!usesTemplateImage(background)) return;

    // Nunca usar imagens herdadas do HTML original como capa de um vídeo configurado.
    // Capas enviadas pelo admin (/media/...) e thumbnails do próprio provedor continuam intactas.
    cover.style.setProperty('background-image', 'none', 'important');
    cover.style.setProperty('background-color', '#050305', 'important');
    player.classList.add('ly-video-without-template-poster');
  }

  function cleanAll(root = document) {
    root.querySelectorAll?.('.site-video-player[data-video-for]').forEach(cleanPlayer);
  }

  const cleanSoon = () => {
    cleanAll();
    requestAnimationFrame(() => cleanAll());
  };

  document.addEventListener('DOMContentLoaded', cleanSoon, { once: true });
  window.addEventListener('site-content-ready', cleanSoon);
  window.addEventListener('site-render-ready', cleanSoon);

  const observer = new MutationObserver(mutations => {
    if (!mutations.some(m => m.addedNodes.length || m.type === 'attributes')) return;
    cleanAll();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });

  setTimeout(() => observer.disconnect(), 12000);
})();
