function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function canonicalHome(request, env) {
  let url = `${new URL(request.url).origin}/`;
  try {
    const data = await env.SITE_CONTENT?.get('site-content', 'json');
    const canonical = String(data?.site?.seo?.canonicalUrl || '').trim();
    if (canonical) {
      const parsed = new URL(canonical);
      parsed.search = '';
      parsed.hash = '';
      url = parsed.href;
    }
  } catch {}
  return url;
}

export async function onRequestGet({ request, env }) {
  const home = await canonicalHome(request, env);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${escapeXml(home)}</loc>\n  </url>\n</urlset>\n`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}
