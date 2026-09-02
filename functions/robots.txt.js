async function canonicalOrigin(request, env) {
  let origin = new URL(request.url).origin;
  try {
    const data = await env.SITE_CONTENT?.get('site-content', 'json');
    const canonical = String(data?.site?.seo?.canonicalUrl || '').trim();
    if (canonical) origin = new URL(canonical).origin;
  } catch {}
  return origin;
}

export async function onRequestGet({ request, env }) {
  const origin = await canonicalOrigin(request, env);
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /*?admin-preview=1',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    ''
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
}
