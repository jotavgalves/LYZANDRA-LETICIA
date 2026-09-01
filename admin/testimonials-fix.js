(() => {
  const pane = document.querySelector('.editor-pane');
  const editor = document.querySelector('#sectorEditor');
  const title = document.querySelector('#sectorTitle');
  if (!pane || !editor || !title) return;

  let wasTestimonials = false;
  let timer = 0;

  const isTestimonials = () => /Resultados das alunas/i.test(title.textContent || '');

  function findItemCards(manager) {
    const list = manager.lastElementChild;
    if (!list) return [];
    return [...list.children].filter(el => el.matches('div') && !el.classList.contains('empty-card'));
  }

  function addQuickImageButton(card, index) {
    if (card.querySelector('[data-quick-testimonial-image]')) return;

    const modeField = [...card.querySelectorAll('.mini-field')].find(field =>
      /Como mostrar o depoimento/i.test(field.querySelector('label')?.textContent || '')
    );
    const modeSelect = modeField?.querySelector('select');
    if (!modeField || !modeSelect) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn primary';
    button.dataset.quickTestimonialImage = '1';
    button.style.cssText = 'width:100%;margin-top:8px;padding:11px 12px;';
    button.textContent = 'Adicionar imagem / print';
    button.onclick = () => {
      if (modeSelect.value === 'text') {
        modeSelect.value = 'image-text';
        modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }

      setTimeout(() => {
        const manager = document.querySelector('#testimonialsVisualCard');
        const refreshed = manager ? findItemCards(manager)[index] : null;
        const imageField = refreshed && [...refreshed.querySelectorAll('.mini-field')].find(field =>
          /Imagem ou print do depoimento/i.test(field.querySelector('label')?.textContent || '')
        );
        const input = imageField?.querySelector('input[type="file"]');
        if (input) input.click();
      }, 120);
    };

    modeField.insertAdjacentElement('afterend', button);
  }

  function enhance() {
    clearTimeout(timer);
    if (!isTestimonials()) {
      wasTestimonials = false;
      return;
    }

    const manager = document.querySelector('#testimonialsVisualCard');
    if (!manager) {
      timer = setTimeout(enhance, 120);
      return;
    }

    if (!wasTestimonials) {
      pane.scrollTop = 0;
      wasTestimonials = true;
    }

    findItemCards(manager).forEach(addQuickImageButton);
  }

  new MutationObserver(enhance).observe(title, { childList: true, subtree: true, characterData: true });
  new MutationObserver(enhance).observe(editor, { childList: true, subtree: true });
  window.addEventListener('load', enhance);
  setTimeout(enhance, 250);
})();
