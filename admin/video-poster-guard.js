(() => {
  const TEMPLATE_IMAGE_RE = /(?:^|\/)images\//i;
  const editor = document.querySelector('#sectorEditor');
  if (!editor) return;

  function isTemplateImage(value = '') {
    return TEMPLATE_IMAGE_RE.test(String(value || ''));
  }

  function cleanVideoThumbnails() {
    editor.querySelectorAll('.media-card').forEach(card => {
      if (!card.querySelector('.video-url')) return;
      const thumb = card.querySelector('.media-thumb');
      if (!thumb) return;
      const src = thumb.getAttribute('src') || '';
      if (!isTemplateImage(src)) return;

      thumb.removeAttribute('src');
      thumb.alt = 'Sem capa definida';
      thumb.style.background = 'linear-gradient(145deg,#130c11,#090608)';
      thumb.style.minHeight = '72px';
      thumb.dataset.templatePosterRemoved = '1';
    });
  }

  const observer = new MutationObserver(cleanVideoThumbnails);
  observer.observe(editor, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src']
  });

  cleanVideoThumbnails();
})();
