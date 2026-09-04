import { isAuthed, json } from '../../src/auth.js';

const KEY = 'bio-content';
const EMPTY = { version: 1 };

export async function onRequestGet({ env }) {
  if (!env.SITE_CONTENT) return json(EMPTY);
  const value = await env.SITE_CONTENT.get(KEY, 'json');
  return json(value || EMPTY);
}

export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Não autorizado.' }, 401);
  if (!env.SITE_CONTENT) return json({ error: 'Binding KV SITE_CONTENT não configurado.' }, 500);

  const raw = await request.text();
  if (raw.length > 750_000) return json({ error: 'Configuração da bio excede 750 KB.' }, 413);

  let data;
  try { data = JSON.parse(raw); }
  catch { return json({ error: 'JSON inválido.' }, 400); }

  if (!data || typeof data !== 'object') return json({ error: 'Estrutura inválida.' }, 400);
  data.version = 1;
  data.updatedAt = new Date().toISOString();
  await env.SITE_CONTENT.put(KEY, JSON.stringify(data));
  return json({ ok: true, savedAt: data.updatedAt });
}
