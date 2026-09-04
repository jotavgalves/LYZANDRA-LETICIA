(() => {
  if (new URLSearchParams(location.search).get('admin-preview') === '1') return;

  const initialHash = location.hash || '';
  const cleanAddress = () => {
    try {
      history.replaceState(history.state, '', `${location.pathname}${location.search}`);
    } catch {}
  };

  function destinationOf(anchor) {
    return String(anchor?.dataset?.privateHref || anchor?.getAttribute?.('href') || '').trim();
  }

  function isUsableDestination(value) {
    return !!value && value !== '#' && !/^javascript:/i.test(value);
  }

  function isActivationUnlocked(anchor) {
    return Number(anchor?.dataset?.activationUnlockedUntil || 0) > Date.now();
  }

  function neutralizeAnchor(anchor, force = false) {
    if (!(anchor instanceof HTMLAnchorElement)) return;
    if (!force && isActivationUnlocked(anchor)) return;

    const liveHref = String(anchor.getAttribute('href') || '').trim();
    if (isUsableDestination(liveHref)) anchor.dataset.privateHref = liveHref;
    if (!isUsableDestination(anchor.dataset.privateHref || '')) return;

    anchor.removeAttribute('href');
    delete anchor.dataset.activationUnlockedUntil;
    anchor.dataset.destinationHidden = 'true';
    if (!anchor.hasAttribute('role')) anchor.setAttribute('role', 'link');
    if (!anchor.hasAttribute('tabindex')) anchor.tabIndex = 0;
  }

  function neutralizeAll(root = document) {
    if (root instanceof HTMLAnchorElement) neutralizeAnchor(root);
    root.querySelectorAll?.('a').forEach(neutralizeAnchor);
  }

  function restoreForActivation(anchor) {
    if (!(anchor instanceof HTMLAnchorElement)) return '';
    const destination = destinationOf(anchor);
    if (!isUsableDestination(destination)) return '';
    anchor.dataset.activationUnlockedUntil = String(Date.now() + 1200);
    anchor.setAttribute('href', destination);
    return destination;
  }

  function hideAgain(anchor, delay = 0) {
    window.setTimeout(() => {
      if (!(anchor instanceof HTMLAnchorElement) || !anchor.isConnected) return;
      const current = String(anchor.getAttribute('href') || '').trim();
      if (isUsableDestination(current)) anchor.dataset.privateHref = current;
      delete anchor.dataset.activationUnlockedUntil;
      neutralizeAnchor(anchor, true);
    }, delay);
  }

  function findHashTarget(hash) {
    if (!hash || hash[0] !== '#') return null;
    try { return document.querySelector(hash); } catch { return null; }
  }

  function scrollWithoutHash(hash, smooth = true) {
    const target = findHashTarget(hash);
    if (!target) return false;
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    cleanAddress();
    return true;
  }

  function closestShieldedAnchor(target) {
    return target?.closest?.('a[data-private-href]') || null;
  }

  // Keep href out of the browser hover/status UI. It is restored only during activation
  // so existing analytics/checkout listeners can still read the real destination.
  window.addEventListener('pointerdown', event => {
    const anchor = closestShieldedAnchor(event.target);
    if (anchor) restoreForActivation(anchor);
  }, true);

  window.addEventListener('touchstart', event => {
    const anchor = closestShieldedAnchor(event.target);
    if (anchor) restoreForActivation(anchor);
  }, { capture: true, passive: true });

  window.addEventListener('click', event => {
    const anchor = closestShieldedAnchor(event.target);
    if (!anchor) return;

    const destination = restoreForActivation(anchor) || destinationOf(anchor);
    if (!destination) return;

    if (destination.startsWith('#')) {
      event.preventDefault();
      requestAnimationFrame(() => {
        if (!scrollWithoutHash(destination, true)) cleanAddress();
      });
      hideAgain(anchor, 0);
      return;
    }

    // Checkout tracking may delay navigation for a few hundred milliseconds.
    // Keep href alive through that callback, then hide it again if the page is still open.
    hideAgain(anchor, 950);
  }, true);

  window.addEventListener('keydown', event => {
    const key = String(event.key || '').toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const macInspect = event.metaKey && event.altKey && ['i', 'j', 'c', 'u'].includes(key);
    const inspectCombo = ctrlOrMeta && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key);
    const sourceCombo = ctrlOrMeta && ['u', 's'].includes(key);

    if (event.key === 'F12' || macInspect || inspectCombo || sourceCombo) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const anchor = closestShieldedAnchor(event.target);
    if (!anchor) return;
    if (event.key === 'Enter') {
      restoreForActivation(anchor);
      hideAgain(anchor, 950);
    } else if (event.key === ' ') {
      event.preventDefault();
      restoreForActivation(anchor);
      anchor.click();
    }
  }, true);

  // Disable the ordinary browser context menu and asset dragging on the public landing.
  document.addEventListener('contextmenu', event => event.preventDefault(), { capture: true });
  document.addEventListener('dragstart', event => {
    if (event.target?.closest?.('img,picture,video,canvas,svg')) event.preventDefault();
  }, { capture: true });

  function protectMedia(root = document) {
    root.querySelectorAll?.('img,picture,video,canvas,svg').forEach(node => {
      node.setAttribute('draggable', 'false');
      node.dataset.assetProtected = 'true';
    });
  }

  neutralizeAll(document);
  protectMedia(document);

  // If an old external link opened the page with #planos/#certificado/etc., honor the
  // destination and immediately return the address bar to the clean canonical URL.
  if (initialHash) {
    cleanAddress();
    const tryInitial = () => scrollWithoutHash(initialHash, false);
    requestAnimationFrame(tryInitial);
    window.addEventListener('site-render-ready', tryInitial, { once: true });
    setTimeout(tryInitial, 450);
  }

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.target instanceof HTMLAnchorElement) {
        neutralizeAnchor(mutation.target);
        return;
      }
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        neutralizeAll(node);
        protectMedia(node);
      });
    });
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'draggable']
  });

  window.LyzandraPublicHardening = {
    neutralizeAll,
    cleanAddress,
    scrollWithoutHash,
    destinationOf
  };
})();
