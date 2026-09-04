(() => {
  const generalBtn = document.querySelector('#generalBtn');
  if (!generalBtn || document.querySelector('#formationEditorShortcut')) return;

  const makeButton = (id, symbol, title, description) => {
    const button = document.createElement('button');
    button.id = id;
    button.type = 'button';
    button.className = 'sector-item general';
    button.innerHTML = `<span class="sector-number">${symbol}</span><span><strong>${title}</strong><small>${description}</small></span>`;
    return button;
  };

  const waitFor = (selector, callback, attempts = 35) => {
    const element = document.querySelector(selector);
    if (element) {
      callback(element);
      return;
    }
    if (attempts <= 0) return;
    setTimeout(() => waitFor(selector, callback, attempts - 1), 100);
  };

  const flash = element => {
    element?.animate?.(
      [
        { outline: '2px solid rgba(245,75,150,.95)', outlineOffset: '2px' },
        { outline: '2px solid transparent', outlineOffset: '5px' }
      ],
      { duration: 1300, easing: 'ease-out' }
    );
  };

  const formation = makeButton(
    'formationEditorShortcut',
    '✦',
    'Formação completa',
    'Edite título, descrição e todos os cards'
  );

  formation.onclick = () => {
    generalBtn.click();
    waitFor('#conversionExperienceCard', card => {
      const target = [...card.querySelectorAll('details')].find(details =>
        /o que a aluna recebe/i.test(details.querySelector('summary')?.textContent || '')
      );
      if (!target) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        flash(card);
        return;
      }
      target.open = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      flash(target);
    });
  };

  const funnel = makeButton(
    'growthFunnelShortcut',
    '↗',
    'Funil & campanhas',
    'Visitas, oferta, checkout, campanhas e pós-compra'
  );

  funnel.onclick = () => {
    generalBtn.click();
    setTimeout(() => document.dispatchEvent(new CustomEvent('ly-growth-open')), 40);
    waitFor('#growthSuite', suite => {
      suite.scrollIntoView({ behavior: 'smooth', block: 'start' });
      flash(suite);
    });
  };

  const anchor = document.querySelector('#conversionBlocksShortcut') || generalBtn;
  anchor.insertAdjacentElement('afterend', formation);
  formation.insertAdjacentElement('afterend', funnel);
})();
