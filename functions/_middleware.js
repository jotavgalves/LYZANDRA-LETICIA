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
      html += '<link rel="stylesheet" href="/assets/conversion.css?v=1">';
      html += '<script defer src="/assets/conversion-runtime.js?v=1"></script>';
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
    if (this.admin) html += '<script defer src="/admin/conversion.js?v=1"></script>';
    if (html) head.append(html, { html: true });
  }
}

class TwitterCardHandler {
  element(meta) {
    meta.setAttribute('content', 'summary_large_image');
  }
}

export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  const url = new URL(context.request.url);
  const publicLanding = url.pathname === '/' || url.pathname === '/index.html';
  const admin = url.pathname === '/admin' || url.pathname.startsWith('/admin/');

  let configuredImage = '';
  if (publicLanding) {
    try {
      const data = await context.env.SITE_CONTENT?.get('site-content', 'json');
      configuredImage = String(data?.site?.seo?.socialImage || '').trim();
    } catch {}
  }

  const fallbackImage = publicLanding && !configuredImage ? DEFAULT_OG_IMAGE : '';
  let rewriter = new HTMLRewriter().on('head', new HeadInjector({ image: fallbackImage, publicLanding, admin }));
  if (fallbackImage) rewriter = rewriter.on('meta[name="twitter:card"]', new TwitterCardHandler());
  const rewritten = rewriter.transform(response);

  return new Response(rewritten.body, {
    status: rewritten.status,
    statusText: rewritten.statusText,
    headers: rewritten.headers
  });
}
