(() => {
  if (!document.querySelector('script[data-mobile-sticky-admin]')) {
    const script = document.createElement('script');
    script.src = '/admin/mobile-sticky-control.js?v=1';
    script.defer = true;
    script.dataset.mobileStickyAdmin = '1';
    document.head.appendChild(script);
  }

  const generalBtn = document.querySelector('#generalBtn');
  if (!generalBtn || document.querySelector('#conversionBlocksShortcut')) return;

  const button = document.createElement('button');
  button.id = 'conversionBlocksShortcut';
  button.type = 'button';
  button.className = 'sector-item general';
  button.innerHTML = '<span class="sector-number">◆</span><span><strong>Blocos extras</strong><small>Hero, cards, oferta e FAQ adicional</small></span>';
  button.onclick = () => {
    generalBtn.click();
    let attempts = 0;
    const find = () => {
      const card = document.querySelector('#conversionExperienceCard');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        card.animate?.([{ outline: '2px solid rgba(245,75,150,.9)' }, { outline: '2px solid transparent' }], { duration: 1200 });
        return;
      }
      if (attempts++ < 20) setTimeout(find, 100);
    };
    setTimeout(find, 100);
  };

  const full = document.querySelector('#fullEditorShortcut');
  if (full) full.insertAdjacentElement('afterend', button);
  else generalBtn.insertAdjacentElement('afterend', button);
})();