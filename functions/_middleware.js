import { normalizeLegal, renderLegalMain } from '../src/legal-content.js';
import { TEMPORARY_LEGAL } from '../src/legal-temporary.js';

const DEFAULT_OG_IMAGE = 'https://lycilios.com/og-image.jpg';

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

class HeadInjector {
  constructor({ image = '', publicLanding = false, admin = false }) {
    this.image = image;
    this.publicLanding = publicLanding;
    this.admin = admin;
  }

  element(head) {
    let html = '';
    if (this.publicLanding) {
      html += '<style id="ly-site-boot-style">html[data-site-booting] body{visibility:hidden}</style>';
      html += '<script id="ly-site-boot">document.documentElement.setAttribute("data-site-booting","1");setTimeout(function(){document.documentElement.removeAttribute("data-site-booting")},2200);</script>';
      html += '<link rel="preconnect" href="https://pay.kiwify.com.br" crossorigin>';
      html += '<link rel="dns-prefetch" href="//pay.kiwify.com.br">';
      html += '<link rel="stylesheet" href="/assets/conversion.css?v=2">';
      html += '<link rel="stylesheet" href="/assets/mobile-polish.css?v=2">';
      html += '<link rel="stylesheet" href="/assets/premium-experience.css?v=1">';
      html += '<link rel="stylesheet" href="/assets/user-feedback-fixes.css?v=1">';
      html += '<link rel="stylesheet" href="/assets/public-hardening.css?v=1">';
      html += '<script defer data-conversion-runtime="1" src="/assets/conversion-runtime.js?v=3"></script>';
      html += '<script defer data-identity-runtime="1" src="/assets/identity-runtime.js?v=2"></script>';
      html += '<script defer data-testimonials-runtime="1" src="/assets/testimonials-runtime.js?v=3"></script>';
      html += '<script defer data-marketing-runtime="1" src="/assets/marketing-runtime.js?v=2"></script>';
      html += '<script defer data-certificates-runtime="1" src="/assets/certificates-runtime.js?v=3"></script>';
      html += '<script defer data-seo-runtime="1" src="/assets/seo-runtime.js?v=1"></script>';
      html += '<script defer data-full-editor-runtime="1" src="/assets/full-editor-runtime.js?v=2"></script>';
      html += '<script defer data-mobile-polish="1" src="/assets/mobile-polish.js?v=2"></script>';
      html += '<script defer data-offer-anchor="1" src="/assets/offer-anchor-runtime.js?v=2"></script>';
      html += '<script defer data-premium-experience="1" src="/assets/premium-experience.js?v=1"></script>';
      html += '<script defer data-campaign-runtime="1" src="/assets/campaign-runtime.js?v=1"></script>';
      html += '<script defer data-funnel-analytics="1" src="/assets/analytics-runtime.js?v=1"></script>';
      html += '<script defer data-video-poster-guard="1" src="/assets/video-poster-guard.js?v=1"></script>';
      html += '<script defer data-public-hardening="1" src="/assets/public-hardening.js?v=2"></script>';
      if (this.image) {
        const image = escapeAttr(this.image);
        html += `<meta property="og:image" content="${image}">`;
        html += `<meta property="og:image:secure_url" content="${image}">`;
        html += '<meta property="og:image:type" content="image/jpeg">';
        html += '<meta property="og:image:width" content="1200">';
        html += '<meta property="og:image:height" content="630">';
        html += '<meta property="og:image:alt" content="Speed Lash — curso de extensão de cílios com Lyzandra Letícia">';
        html += `<meta name="twitter:image" content="${image}">`;
        html += '<meta name="twitter:image:alt" content="Speed Lash — curso de extensão de cílios com Lyzandra Letícia">';
      }
    }
    if (this.admin) html += '<script defer data-conversion-admin="1" src="/admin/conversion.js?v=3"></script>';
    if (html) head.append(html, { html: true });
  }
}

class ImagePerformanceHandler {
  constructor(hero = false) { this.hero = hero; }
  element(img) {
    img.setAttribute('decoding', 'async');
    if (this.hero) {
      img.setAttribute('loading', 'eager');
      img.setAttribute('fetchpriority', 'high');
    } else if (!img.getAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  }
}

class IframePerformanceHandler {
  element(frame) {
    if (!frame.getAttribute('loading')) frame.setAttribute('loading', 'lazy');
  }
}

class TwitterCardHandler {
  element(meta) {
    meta.setAttribute('content', 'summary_large_image');
  }
}

class LegalMainHandler {
  constructor(kind, legal) {
    this.kind = kind;
    this.legal = legal;
  }

  element(main) {
    main.setInnerContent(renderLegalMain(this.kind, this.legal), { html: true });
    main.setAttribute('data-legal-server-rendered', 'true');
  }
}

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  const url = new URL(context.request.url);
  const publicLanding = url.pathname === '/' || url.pathname === '/index.html';
  const admin = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
  const legalKind = url.pathname === '/termos.html' ? 'terms' : (url.pathname === '/privacidade.html' ? 'privacy' : '');

  let configuredImage = '';
  if (publicLanding) {
    try {
      const data = await context.env.SITE_CONTENT?.get('site-content', 'json');
      configuredImage = String(data?.site?.seo?.socialImage || '').trim();
    } catch {}
  }

  let legal = null;
  if (legalKind) {
    try {
      const stored = await context.env.SITE_CONTENT?.get('site-legal', 'json');
      legal = stored && typeof stored === 'object' ? normalizeLegal(stored) : TEMPORARY_LEGAL;
    } catch {
      legal = TEMPORARY_LEGAL;
    }
  }

  const fallbackImage = publicLanding && !configuredImage ? DEFAULT_OG_IMAGE : '';
  let rewriter = new HTMLRewriter().on('head', new HeadInjector({ image: fallbackImage, publicLanding, admin }));
  if (publicLanding) {
    rewriter = rewriter
      .on('img', new ImagePerformanceHandler(false))
      .on('section[data-edit-id="section-001"] img', new ImagePerformanceHandler(true))
      .on('iframe', new IframePerformanceHandler());
  }
  if (fallbackImage) rewriter = rewriter.on('meta[name="twitter:card"]', new TwitterCardHandler());
  if (legalKind) rewriter = rewriter.on('main#legalContent', new LegalMainHandler(legalKind, legal));
  const rewritten = rewriter.transform(response);

  const headers = new Headers(rewritten.headers);
  if (legalKind) headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  return new Response(rewritten.body, {
    status: rewritten.status,
    statusText: rewritten.statusText,
    headers
  });
}
