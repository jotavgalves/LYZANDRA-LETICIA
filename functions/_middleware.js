const DEFAULT_OG_IMAGE = 'https://lycilios.com/og-image.jpg';

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

class DefaultOgHandler {
  constructor(image) {
    this.image = image;
  }

  element(head) {
    const image = escapeAttr(this.image);
    head.append(
      `<meta property="og:image" content="${image}">` +
      `<meta property="og:image:secure_url" content="${image}">` +
      `<meta property="og:image:type" content="image/jpeg">` +
      `<meta property="og:image:width" content="1200">` +
      `<meta property="og:image:height" content="630">` +
      `<meta property="og:image:alt" content="Speed Lash — curso de extensão de cílios com Lyzandra Letícia">` +
      `<meta name="twitter:image" content="${image}">` +
      `<meta name="twitter:image:alt" content="Speed Lash — curso de extensão de cílios com Lyzandra Letícia">`,
      { html: true }
    );
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

  let configuredImage = '';
  try {
    const data = await context.env.SITE_CONTENT?.get('site-content', 'json');
    configuredImage = String(data?.site?.seo?.socialImage || '').trim();
  } catch {}

  if (configuredImage) return response;

  const rewritten = new HTMLRewriter()
    .on('meta[name="twitter:card"]', new TwitterCardHandler())
    .on('head', new DefaultOgHandler(DEFAULT_OG_IMAGE))
    .transform(response);

  return new Response(rewritten.body, {
    status: rewritten.status,
    statusText: rewritten.statusText,
    headers: rewritten.headers
  });
}
