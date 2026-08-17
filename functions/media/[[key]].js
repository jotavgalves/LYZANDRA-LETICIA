export async function onRequestGet({ params, env }) {
  if (!env.SITE_CONTENT) return new Response('KV não configurado.', { status: 500 });

  const raw = Array.isArray(params.key) ? params.key.join('/') : String(params.key || '');
  const slug = decodeURIComponent(raw);
  if (!slug || slug.includes('/') || slug.includes('..')) return new Response('Arquivo inválido.', { status: 400 });

  const { value, metadata } = await env.SITE_CONTENT.getWithMetadata(`media:${slug}`, {
    type: 'arrayBuffer',
    cacheTtl: 86400
  });

  if (!value) return new Response('Imagem não encontrada.', { status: 404 });

  return new Response(value, {
    headers: {
      'content-type': metadata?.contentType || 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff'
    }
  });
}
