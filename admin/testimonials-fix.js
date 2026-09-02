(() => {
  const pane = document.querySelector('.editor-pane');
  const editor = document.querySelector('#sectorEditor');
  const title = document.querySelector('#sectorTitle');
  if (!pane || !editor || !title) return;

  let wasTestimonials = false;
  let timer = 0;
  let pendingStoryIndex = -1;
  let storyPickerOpened = false;

  const isTestimonials = () => /Resultados das alunas/i.test(title.textContent || '');

  function findItemCards(manager) {
    const list = manager.lastElementChild;
    if (!list) return [];
    return [...list.children].filter(el => el.matches('div') && !el.classList.contains('empty-card'));
  }

  function findField(card, labelPattern) {
    return [...card.querySelectorAll('.mini-field')].find(field =>
      labelPattern.test(field.querySelector('label')?.textContent || '')
    );
  }

  function addQuickImageButton(card, index) {
    if (card.querySelector('[data-quick-testimonial-image]')) return;

    const modeField = findField(card, /Como mostrar o depoimento/i);
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
        const imageField = refreshed && findField(refreshed, /Imagem ou print do depoimento/i);
        const input = imageField?.querySelector('input[type="file"]');
        if (input) input.click();
      }, 120);
    };

    modeField.insertAdjacentElement('afterend', button);
  }

  function applyStoryPreset(index) {
    const manager = document.querySelector('#testimonialsVisualCard');
    const card = manager ? findItemCards(manager)[index] : null;
    if (!card) return false;

    const modeField = findField(card, /Como mostrar o depoimento/i);
    const modeSelect = modeField?.querySelector('select');
    if (!modeSelect) return false;

    if (modeSelect.value !== 'image') {
      modeSelect.value = 'image';
      modeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      return false;
    }

    const imageField = findField(card, /Imagem ou print do depoimento/i);
    const imageInput = imageField?.querySelector('input[type="file"]');
    const hasImage = !!imageField?.querySelector('img');

    if (!hasImage) {
      if (!storyPickerOpened && imageInput) {
        storyPickerOpened = true;
        imageInput.click();
      }
      return false;
    }

    const fit = findField(card, /Enquadramento/i)?.querySelector('select');
    const position = findField(card, /Posição da imagem/i)?.querySelector('select');
    const height = findField(card, /Altura da imagem no card/i)?.querySelector('input[type="range"]');
    if (!fit || !position || !height) return false;

    if (fit.value !== 'contain') {
      fit.value = 'contain';
      fit.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (position.value !== 'center') {
      position.value = 'center';
      position.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (height.value !== '420') {
      height.value = '420';
      height.dispatchEvent(new Event('input', { bubbles: true }));
    }

    pendingStoryIndex = -1;
    storyPickerOpened = false;
    return true;
  }

  function addStoryButton(card, index) {
    if (card.querySelector('[data-testimonial-story]')) return;
    const quickImage = card.querySelector('[data-quick-testimonial-image]');
    if (!quickImage) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn secondary';
    button.dataset.testimonialStory = '1';
    button.style.cssText = 'width:100%;margin-top:7px;padding:11px 12px;border:1px solid #f0d6e1;';
    button.textContent = 'Story 9:16 · só imagem';
    button.title = 'Usa a imagem inteira em proporção vertical 9:16 e remove o texto do depoimento.';
    button.onclick = () => {
      pendingStoryIndex = index;
      storyPickerOpened = false;
      applyStoryPreset(index);
      setTimeout(enhance, 100);
    };
    quickImage.insertAdjacentElement('afterend', button);
  }

  function enhance() {
    clearTimeout(timer);
    if (!isTestimonials()) {
      wasTestimonials = false;
      pendingStoryIndex = -1;
      storyPickerOpened = false;
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

    const cards = findItemCards(manager);
    cards.forEach((card, index) => {
      addQuickImageButton(card, index);
      addStoryButton(card, index);
    });

    if (pendingStoryIndex >= 0) {
      if (!applyStoryPreset(pendingStoryIndex)) timer = setTimeout(enhance, 180);
    }
  }

  new MutationObserver(enhance).observe(title, { childList: true, subtree: true, characterData: true });
  new MutationObserver(enhance).observe(editor, { childList: true, subtree: true });
  window.addEventListener('focus', () => {
    if (pendingStoryIndex >= 0) {
      storyPickerOpened = false;
      setTimeout(enhance, 250);
    }
  });
  window.addEventListener('load', enhance);
  setTimeout(enhance, 250);
})();
