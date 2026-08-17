import { isAuthed, json } from '../../src/auth.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeName(name = 'imagem') {
  const clean = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(-100);
  return clean || 'imagem';
}

export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Não autorizado.' }, 401);
  if (!env.SITE_CONTENT) return json({ error: 'Binding KV SITE_CONTENT não configurado.' }, 500);

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: 'Arquivo não enviado.' }, 400);
  if (!String(file.type || '').startsWith('image/')) return json({ error: 'Envie uma imagem.' }, 415);
  if (file.size > MAX_FILE_SIZE) return json({ error: 'Arquivo maior que 10 MB.' }, 413);

  const slug = `${crypto.randomUUID()}-${safeName(file.name)}`;
  const key = `media:${slug}`;
  const contentType = String(file.type || 'application/octet-stream');

  await env.SITE_CONTENT.put(key, await file.arrayBuffer(), {
    metadata: {
      contentType,
      originalName: file.name,
      uploadedAt: new Date().toISOString()
    }
  });

  return json({ ok: true, key, url: `/media/${encodeURIComponent(slug)}` });
}
