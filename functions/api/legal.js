import { isAuthed, json } from '../../src/auth.js';
import { DEFAULT_LEGAL, normalizeLegal } from '../../src/legal-content.js';

const KEY = 'site-legal';

export async function onRequestGet({ env }) {
  if (!env.SITE_CONTENT) return json(DEFAULT_LEGAL);
  const value = await env.SITE_CONTENT.get(KEY, 'json');
  return json(normalizeLegal(value || {}));
}

export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Não autorizado.' }, 401);
  if (!env.SITE_CONTENT) return json({ error: 'Binding KV SITE_CONTENT não configurado.' }, 500);

  const raw = await request.text();
  if (raw.length > 750_000) return json({ error: 'Conteúdo jurídico excede 750 KB.' }, 413);

  let data;
  try { data = JSON.parse(raw); }
  catch { return json({ error: 'JSON inválido.' }, 400); }

  if (!data || typeof data !== 'object') return json({ error: 'Estrutura inválida.' }, 400);
  const clean = normalizeLegal(data);
  await env.SITE_CONTENT.put(KEY, JSON.stringify(clean));
  return json({ ok: true, savedAt: new Date().toISOString() });
}
