(() => {
  const DEFAULT = {
    enabled: true,
    eyebrow: { visible: true, text: 'CERTIFICAÇÃO PROFISSIONAL' },
    title: 'Receba um certificado profissional ao concluir sua formação',
    highlight: 'certificado profissional',
    subtitle: { visible: true, text: 'Ao final do curso, você recebe um certificado elegante e profissional, que valoriza sua jornada e reforça sua credibilidade para atuar com mais segurança.' },
    displayMode: 'single',
    showArrows: true,
    showCounter: true,
    fitVersion: 2,
    imageFit: 'fill',
    aspect: '1.414/1',
    premiumGlow: true,
    images: [{ id: 'certificate-1', src: '/images/certificate.webp', alt: 'Certificado profissional de conclusão', visible: true }],
    benefits: { visible: true, items: ['Certificado profissional', 'Design elegante e sofisticado', 'Mais credibilidade no atendimento', 'Conclusão com mais confiança'] },
    final: { visible: true, title: 'Certificação que valoriza sua formação', text: 'Mais do que aprender uma técnica, você conclui sua jornada preparada e certificada para atuar com mais segurança e autoridade profissional.' }
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  let autoInitialized = false;

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    const eyebrow = { ...DEFAULT.eyebrow, ...((raw && raw.eyebrow) || {}) };
    const subtitle = { ...DEFAULT.subtitle, ...((raw && raw.subtitle) || {}) };
    const benefits = { ...DEFAULT.benefits, ...((raw && raw.benefits) || {}) };
    const final = { ...DEFAULT.final, ...((raw && raw.final) || {}) };
    const images = Array.isArray(raw.images) && raw.images.length
      ? raw.images.map((item, index) => ({ id: String(item?.id || `certificate-${index + 1}`), src: String(item?.src || ''), alt: String(item?.alt || `Certificado ${index + 1}`), visible: item?.visible !== false }))
      : clone(DEFAULT.images);
    const migrated = Number(raw.fitVersion || 0) < 2;
    const imageFit = migrated ? 'fill' : (raw.imageFit === 'contain' ? 'contain' : 'fill');
    const aspect = migrated ? '1.414/1' : (['auto','4/3','16/9','1.414/1'].includes(raw.aspect) ? raw.aspect : DEFAULT.aspect);
    return {
      ...clone(DEFAULT), ...raw,
      enabled: raw.enabled !== false,
      eyebrow,
      title: String(raw.title || DEFAULT.title),
      highlight: String(raw.highlight || DEFAULT.highlight),
      subtitle,
      displayMode: raw.displayMode === 'carousel' ? 'carousel' : 'single',
      showArrows: raw.showArrows !== false,
      showCounter: raw.showCounter !== false,
      fitVersion: 2,
      imageFit,
      aspect,
      premiumGlow: raw.premiumGlow !== false,
      images,
      benefits: { ...benefits, visible: benefits.visible !== false, items: Array.isArray(benefits.items) ? benefits.items.map(item => String(item || '')).filter(Boolean) : clone(DEFAULT.benefits.items) },
      final: { ...final, visible: final.visible !== false, title: String(final.title || DEFAULT.final.title), text: String(final.text || DEFAULT.final.text) }
    };
  }

  function ensureStyle() {
    if (document.querySelector('#ly-certificates-style')) return;
    const style = document.createElement('style'); style.id = 'ly-certificates-style';
    style.textContent = `
      [data-ly-certificates-root]{max-width:1060px;margin:0 auto;text-align:center}
      [data-ly-certificates-eyebrow]{display:inline-flex;align-items:center;justify-content:center;border:1px solid color-mix(in srgb,var(--primary) 38%,transparent);background:color-mix(in srgb,var(--primary) 10%,transparent);color:var(--primary);border-radius:999px;padding:8px 14px;font-size:11px;font-weight:700;letter-spacing:.18em}
      [data-ly-certificates-title]{max-width:850px;margin:18px auto 0;font-family:var(--font-serif,Georgia,serif);font-size:clamp(32px,5.2vw,58px);line-height:1.02;font-weight:700;letter-spacing:-.025em;text-wrap:balance}
      [data-ly-certificates-title] strong{color:var(--primary);font:inherit}
      [data-ly-certificates-subtitle]{max-width:760px;margin:18px auto 0;color:var(--muted-foreground);font-size:clamp(15px,2vw,18px);line-height:1.7;text-wrap:pretty}
      [data-ly-certificates-stage]{position:relative;margin:42px auto 0;max-width:930px}
      [data-ly-certificates-frame]{position:relative;overflow:hidden;border-radius:28px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));padding:clamp(12px,2vw,22px);box-shadow:0 28px 80px rgba(0,0,0,.38)}
      [data-ly-certificates-frame][data-glow="true"]:before{content:"";position:absolute;inset:-25%;background:radial-gradient(circle at 50% 20%,color-mix(in srgb,var(--primary) 25%,transparent),transparent 58%);pointer-events:none}
      [data-ly-certificates-media]{position:relative;z-index:1;display:grid;place-items:center;overflow:hidden;border-radius:18px;background:#f6f1ed;box-shadow:0 10px 34px rgba(0,0,0,.24)}
      [data-ly-certificates-media][data-aspect="4/3"]{aspect-ratio:4/3}[data-ly-certificates-media][data-aspect="16/9"]{aspect-ratio:16/9}[data-ly-certificates-media][data-aspect="1.414/1"]{aspect-ratio:1.414/1}
      [data-ly-certificates-media] img{display:block;width:100%;max-width:100%;max-height:720px;object-position:center;background:#f6f1ed}
      [data-ly-certificates-media][data-aspect="auto"] img{height:auto}[data-ly-certificates-media]:not([data-aspect="auto"]) img{height:100%}
      [data-ly-certificates-media][data-fit="fill"] img{width:100%;height:100%;object-fit:fill;background:transparent}[data-ly-certificates-media][data-fit="contain"] img{object-fit:contain}
      [data-ly-certificates-arrow]{position:absolute;z-index:4;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:999px;border:1px solid rgba(255,255,255,.15);background:rgba(10,5,8,.76);color:#fff;display:grid;place-items:center;cursor:pointer;backdrop-filter:blur(10px);box-shadow:0 10px 24px rgba(0,0,0,.28);font-size:23px;line-height:1}
      [data-ly-certificates-arrow="prev"]{left:18px}[data-ly-certificates-arrow="next"]{right:18px}
      [data-ly-certificates-counter]{display:inline-flex;margin:14px auto 0;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.045);border-radius:999px;padding:7px 12px;color:var(--muted-foreground);font-size:12px}
      [data-ly-certificates-benefits]{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:30px auto 0;max-width:930px}
      [data-ly-certificate-benefit]{display:flex;align-items:center;gap:10px;text-align:left;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.035);border-radius:16px;padding:14px 15px;font-size:13px;line-height:1.4}
      [data-ly-certificate-benefit] i{display:grid;place-items:center;flex:0 0 25px;width:25px;height:25px;border-radius:999px;background:color-mix(in srgb,var(--primary) 16%,transparent);color:var(--primary);font-style:normal;font-weight:800}
      [data-ly-certificates-final]{max-width:780px;margin:28px auto 0;padding:22px 24px;border-radius:20px;border:1px solid color-mix(in srgb,var(--primary) 20%,rgba(255,255,255,.06));background:linear-gradient(135deg,color-mix(in srgb,var(--primary) 8%,transparent),rgba(255,255,255,.025))}
      [data-ly-certificates-final] h3{margin:0;font-family:var(--font-serif,Georgia,serif);font-size:clamp(21px,3vw,28px);font-weight:700}[data-ly-certificates-final] p{margin:9px auto 0;max-width:650px;color:var(--muted-foreground);font-size:14px;line-height:1.65}
      @media(max-width:780px){[data-ly-certificates-benefits]{grid-template-columns:repeat(2,minmax(0,1fr))}[data-ly-certificates-arrow]{width:38px;height:38px}[data-ly-certificates-arrow="prev"]{left:10px}[data-ly-certificates-arrow="next"]{right:10px}}
      @media(max-width:480px){[data-ly-certificates-benefits]{grid-template-columns:1fr}[data-ly-certificates-stage]{margin-top:30px}[data-ly-certificates-frame]{border-radius:22px}[data-ly-certificates-media]{border-radius:14px}}
    `;
    document.head.appendChild(style);
  }

  function appendHighlightedText(host, text, highlight) {
    const full = String(text || ''); const needle = String(highlight || '').trim();
    if (!needle) { host.textContent = full; return; }
    const index = full.toLocaleLowerCase('pt-BR').indexOf(needle.toLocaleLowerCase('pt-BR'));
    if (index < 0) { host.textContent = full; return; }
    host.append(document.createTextNode(full.slice(0, index)));
    const strong = document.createElement('strong'); strong.id = 'certificateHighlightedText'; strong.textContent = full.slice(index, index + needle.length); host.appendChild(strong);
    host.append(document.createTextNode(full.slice(index + needle.length)));
  }

  function makeButton(direction, onClick) {
    const button = document.createElement('button'); button.type = 'button'; button.id = direction === 'prev' ? 'certificatePrev' : 'certificateNext'; button.dataset.lyCertificatesArrow = direction;
    button.setAttribute('aria-label', direction === 'prev' ? 'Certificado anterior' : 'Próximo certificado'); button.textContent = direction === 'prev' ? '‹' : '›'; button.onclick = onClick; return button;
  }

  function render(config, section) {
    ensureStyle(); section.style.display = config.enabled === false ? 'none' : ''; if (config.enabled === false) return;
    const visibleImages = config.images.filter(item => item.visible !== false && item.src); const images = visibleImages.length ? visibleImages : clone(DEFAULT.images);
    let index = Math.max(0, Math.min(Number(section.dataset.lyCertificateIndex) || 0, images.length - 1));
    section.innerHTML = '';
    const root = document.createElement('div'); root.id = 'certificateContentRoot'; root.dataset.lyCertificatesRoot = '1';

    if (config.eyebrow.visible !== false && config.eyebrow.text) { const eyebrow = document.createElement('span'); eyebrow.id = 'certificateEyebrow'; eyebrow.dataset.lyCertificatesEyebrow = '1'; eyebrow.textContent = config.eyebrow.text; root.appendChild(eyebrow); }
    const title = document.createElement('h2'); title.id = 'certificateHeading'; title.dataset.lyCertificatesTitle = '1'; appendHighlightedText(title, config.title, config.highlight); root.appendChild(title);
    if (config.subtitle.visible !== false && config.subtitle.text) { const subtitle = document.createElement('p'); subtitle.id = 'certificateSubtitle'; subtitle.dataset.lyCertificatesSubtitle = '1'; subtitle.textContent = config.subtitle.text; root.appendChild(subtitle); }

    const stage = document.createElement('div'); stage.id = 'certificateStage'; stage.dataset.lyCertificatesStage = '1';
    const frame = document.createElement('div'); frame.dataset.lyCertificatesFrame = '1'; frame.dataset.glow = config.premiumGlow !== false ? 'true' : 'false';
    const media = document.createElement('div'); media.dataset.lyCertificatesMedia = '1'; media.dataset.aspect = config.aspect; media.dataset.fit = config.imageFit;
    const image = document.createElement('img'); image.id = 'certificateImage'; image.src = images[index].src; image.alt = images[index].alt || `Certificado ${index + 1}`; image.loading = 'lazy'; image.decoding = 'async'; image.style.objectFit = config.imageFit;
    media.appendChild(image); frame.appendChild(media); stage.appendChild(frame);

    const updateImage = nextIndex => { index = (nextIndex + images.length) % images.length; section.dataset.lyCertificateIndex = String(index); image.src = images[index].src; image.alt = images[index].alt || `Certificado ${index + 1}`; const counter = root.querySelector('[data-ly-certificates-counter]'); if (counter) counter.textContent = `${index + 1} de ${images.length}`; };
    const carousel = config.displayMode === 'carousel' && images.length > 1;
    if (carousel && config.showArrows !== false) stage.append(makeButton('prev', () => updateImage(index - 1)), makeButton('next', () => updateImage(index + 1)));
    root.appendChild(stage);
    if (carousel && config.showCounter !== false) { const counter = document.createElement('span'); counter.id = 'certificateCounter'; counter.dataset.lyCertificatesCounter = '1'; counter.textContent = `${index + 1} de ${images.length}`; root.appendChild(counter); }

    if (config.benefits.visible !== false && config.benefits.items.length) {
      const benefits = document.createElement('div'); benefits.id = 'certificateBenefits'; benefits.dataset.lyCertificatesBenefits = '1';
      config.benefits.items.forEach((text, itemIndex) => { const item = document.createElement('div'); item.id = `certificateBenefit${itemIndex + 1}`; item.dataset.lyCertificateBenefit = '1'; const icon = document.createElement('i'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = '✓'; const label = document.createElement('span'); label.id = `certificateBenefitText${itemIndex + 1}`; label.textContent = text; item.append(icon, label); benefits.appendChild(item); });
      root.appendChild(benefits);
    }

    if (config.final.visible !== false && (config.final.title || config.final.text)) {
      const final = document.createElement('div'); final.id = 'certificateFinal'; final.dataset.lyCertificatesFinal = '1';
      if (config.final.title) { const heading = document.createElement('h3'); heading.id = 'certificateFinalHeading'; heading.textContent = config.final.title; final.appendChild(heading); }
      if (config.final.text) { const text = document.createElement('p'); text.id = 'certificateFinalText'; text.textContent = config.final.text; final.appendChild(text); }
      root.appendChild(final);
    }
    section.appendChild(root); window.dispatchEvent(new CustomEvent('certificates-rendered', { detail: config }));
  }

  function apply(data) {
    const section = document.querySelector('section[data-edit-id="section-006"]'); if (!section) return;
    render(normalize(data?.site?.certificates), section);
  }

  function autoApply(data) { if (autoInitialized) return; autoInitialized = true; apply(data || window.__SITE_CONTENT__ || {}); }

  window.LyzandraCertificates = { apply, normalize, defaults: clone(DEFAULT) };
  window.addEventListener('site-content-ready', event => autoApply(event.detail || window.__SITE_CONTENT__ || {}), { once: true });
  if (window.__SITE_CONTENT_READY__) autoApply(window.__SITE_CONTENT__ || {});
})();