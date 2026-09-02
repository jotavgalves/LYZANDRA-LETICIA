(() => {
  const API = '/api/full-editor';
  const ATTR = 'data-full-edit-id';
  const HIDDEN_ATTR = 'data-full-editor-hidden';
  const TEXT_PARENT_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,a,button,li,label,blockquote,figcaption';
  const CANDIDATE_SELECTOR = [
    'h1','h2','h3','h4','h5','h6','p','a','button','li','label','blockquote','figcaption','small','span','strong',
    'img','video','iframe','section','header','footer','aside'
  ].join(',');

  let patches = {};
  let observer = null;
  let scheduled = 0;

  function slug(value) {
    return String(value || 'item')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'item';
  }

  function hash(value) {
    let h = 2166136261;
    const text = String(value || '');
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function nthOfType(el) {
    let index = 1;
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === el.tagName) index += 1;
      sibling = sibling.previousElementSibling;
    }
    return index;
  }

  function anchorFor(el) {
    return el.closest('section[data-edit-id],section[id],header[id],footer[id],aside[id],main[data-edit-id],main') || document.body;
  }

  function anchorName(anchor) {
    if (!anchor) return 'body';
    return anchor.dataset?.editId || anchor.id || anchor.tagName?.toLowerCase() || 'body';
  }

  function pathWithin(anchor, el) {
    const parts = [];
    let node = el;
    while (node && node !== anchor && node !== document.body) {
      parts.unshift(`${node.tagName.toLowerCase()}:${nthOfType(node)}`);
      node = node.parentElement;
    }
    return parts.join('/');
  }

  function keyFor(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el.dataset?.editId) return `legacy-${slug(el.dataset.editId)}`;
    if (el.id) return `dom-${slug(el.id)}`;
    const anchor = anchorFor(el);
    const signature = `${anchorName(anchor)}|${pathWithin(anchor, el)}`;
    return `auto-${slug(anchorName(anchor))}-${hash(signature)}`;
  }

  function hasMeaningfulText(el) {
    return !!String(el?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function shouldSkip(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.closest('script,style,svg,noscript,[data-full-editor-skip],.site-video-player')) return true;
    if (el.closest('#cookieConsentBanner') && !el.id && !el.dataset.editId) return false;
    return false;
  }

  function isEligible(el) {
    if (shouldSkip(el)) return false;
    const tag = el.tagName;
    if (['SECTION','HEADER','FOOTER','ASIDE','IMG','VIDEO','IFRAME'].includes(tag)) return true;
    if (['A','BUTTON'].includes(tag)) return hasMeaningfulText(el) || !!el.getAttribute('aria-label') || tag === 'A';
    if (['SPAN','STRONG','SMALL'].includes(tag)) {
      if (!hasMeaningfulText(el)) return false;
      const parent = el.parentElement?.closest(TEXT_PARENT_SELECTOR);
      if (parent && parent !== el) return false;
      return true;
    }
    return hasMeaningfulText(el);
  }

  function leafTextNodes(el) {
    if (!el) return [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || parent.closest('script,style,svg,noscript')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  }

  function assign(root = document) {
    const scope = root.nodeType === 1 ? root : document;
    const candidates = [];
    if (scope.nodeType === 1 && scope.matches?.(CANDIDATE_SELECTOR)) candidates.push(scope);
    candidates.push(...scope.querySelectorAll(CANDIDATE_SELECTOR));

    candidates.forEach(el => {
      if (!isEligible(el) || el.hasAttribute(ATTR)) return;
      const key = keyFor(el);
      if (!key) return;
      el.setAttribute(ATTR, key);
    });
    return candidates.filter(el => el.hasAttribute?.(ATTR));
  }

  function preserveWhitespace(node, value) {
    const current = node.nodeValue || '';
    const leading = current.match(/^\s*/)?.[0] || '';
    const trailing = current.match(/\s*$/)?.[0] || '';
    node.nodeValue = `${leading}${String(value ?? '')}${trailing}`;
  }

  function applyPatch(el, patch) {
    if (!el || !patch || typeof patch !== 'object') return;

    if (Array.isArray(patch.parts)) {
      const nodes = leafTextNodes(el);
      patch.parts.forEach((value, index) => {
        if (nodes[index] && typeof value === 'string') preserveWhitespace(nodes[index], value);
      });
    }

    if (patch.attrs && typeof patch.attrs === 'object') {
      Object.entries(patch.attrs).forEach(([name, value]) => {
        if (value === null || value === undefined || value === '') el.removeAttribute(name);
        else el.setAttribute(name, String(value));
      });
    }

    if (typeof patch.fit === 'string' && el.tagName === 'IMG') el.style.objectFit = patch.fit;

    if (patch.hidden === true) el.setAttribute(HIDDEN_ATTR, 'true');
    else if (patch.hidden === false) el.removeAttribute(HIDDEN_ATTR);
  }

  function applyAll(root = document) {
    assign(root);
    const scope = root.nodeType === 1 ? root : document;
    const elements = [];
    if (scope.nodeType === 1 && scope.hasAttribute?.(ATTR)) elements.push(scope);
    elements.push(...scope.querySelectorAll(`[${ATTR}]`));
    elements.forEach(el => {
      const key = el.getAttribute(ATTR);
      if (key && patches[key]) applyPatch(el, patches[key]);
    });
  }

  function find(key) {
    return document.querySelector(`[${ATTR}="${CSS.escape(String(key || ''))}"]`);
  }

  function getParts(el) {
    return leafTextNodes(el).map(node => node.nodeValue.trim());
  }

  function scheduleApply(root = document) {
    clearTimeout(scheduled);
    scheduled = setTimeout(() => applyAll(root), 30);
  }

  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(records => {
      let changed = false;
      records.forEach(record => {
        record.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            assign(node);
            changed = true;
          }
        });
      });
      if (changed) scheduleApply(document);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function ensureStyle() {
    if (document.getElementById('full-editor-runtime-style')) return;
    const style = document.createElement('style');
    style.id = 'full-editor-runtime-style';
    style.textContent = `[${HIDDEN_ATTR}="true"]{display:none!important}`;
    document.head.appendChild(style);
  }

  async function load() {
    ensureStyle();
    assign(document);
    try {
      const response = await fetch(API, { cache: 'no-store' });
      const data = response.ok ? await response.json() : {};
      patches = data?.patches && typeof data.patches === 'object' ? data.patches : {};
    } catch {
      patches = {};
    }
    applyAll(document);
    startObserver();
    window.dispatchEvent(new CustomEvent('full-editor-ready', { detail: { patches } }));
  }

  window.LyzandraFullEditor = {
    assign,
    scan(root = document) {
      assign(root);
      const scope = root.nodeType === 1 ? root : document;
      return [...scope.querySelectorAll(`[${ATTR}]`)];
    },
    keyFor,
    find,
    getParts,
    applyPatch,
    applyAll,
    setPatches(value) {
      patches = value && typeof value === 'object' ? value : {};
      applyAll(document);
    },
    getPatches() { return patches; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
