(() => {
  const editorBox = document.querySelector('#sectorEditor');
  const preview = document.querySelector('#preview');
  if (!editorBox || !preview) return;

  function patchCertificateControls() {
    const card = document.querySelector('#certificatesVisualCard');
    if (!card) return;

    [...card.querySelectorAll('select')].forEach(select => {
      const options = [...select.options];
      const values = options.map(option => option.value);

      if (values.includes('contain') && values.includes('cover')) {
        const selectedBeforePatch = select.value;
        const contain = options.find(option => option.value === 'contain');
        const fill = options.find(option => option.value === 'cover');

        if (contain) contain.textContent = 'Ajustar imagem — mantém proporção e cria faixas se necessário';
        if (fill) {
          fill.value = 'fill';
          fill.textContent = 'Preencher quadro — estica a imagem para ocupar 100%';
        }

        const field = select.closest('.mini-field');
        const label = field?.querySelector(':scope > label');
        if (label) label.textContent = 'Ajuste da imagem';

        if (selectedBeforePatch === 'contain') select.value = 'contain';
        else select.value = 'fill';
      }

      if (values.includes('1.414/1') && values.includes('4/3')) {
        options.forEach(option => {
          if (option.value === '1.414/1') option.textContent = 'A4 horizontal — recomendado · 2600 × 1839 px';
          if (option.value === '4/3') option.textContent = '4:3';
        });
      }
    });

    const headings = [...card.querySelectorAll('strong')];
    const visualHeading = headings.find(node => /Apresentação do certificado/i.test(node.textContent || ''));
    const description = visualHeading?.parentElement?.querySelector('p');
    if (description) {
      description.textContent = 'Use A4 horizontal para manter a proporção ideal. “Preencher quadro” estica a imagem; “Ajustar imagem” preserva a proporção e cria faixas quando necessário.';
    }
  }

  const observer = new MutationObserver(() => setTimeout(patchCertificateControls, 0));
  observer.observe(editorBox, { childList: true, subtree: true });
  preview.addEventListener('load', () => setTimeout(patchCertificateControls, 400));
  setTimeout(patchCertificateControls, 500);
})();
