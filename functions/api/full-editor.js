import { isAuthed, json } from '../../src/auth.js';

const KEY = 'site-full-editor';
const EMPTY = { version: 1, patches: {} };

export async function onRequestGet({ env }) {
  if (!env.SITE_CONTENT) return json(EMPTY);
  const value = await env.SITE_CONTENT.get(KEY, 'json');
  return json(value && typeof value === 'object' ? value : EMPTY);
}

export async function onRequestPut({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ error: 'Não autorizado.' }, 401);
  if (!env.SITE_CONTENT) return json({ error: 'Binding KV SITE_CONTENT não configurado.' }, 500);

  const raw = await request.text();
  if (raw.length > 1_500_000) return json({ error: 'Configuração do editor completo excede 1,5 MB.' }, 413);

  let data;
  try { data = JSON.parse(raw); }
  catch { return json({ error: 'JSON inválido.' }, 400); }

  if (!data || typeof data !== 'object' || !data.patches || typeof data.patches !== 'object' || Array.isArray(data.patches)) {
    return json({ error: 'Estrutura inválida.' }, 400);
  }

  const clean = { version: 1, patches: data.patches };
  await env.SITE_CONTENT.put(KEY, JSON.stringify(clean));
  return json({ ok: true, savedAt: new Date().toISOString() });
}
