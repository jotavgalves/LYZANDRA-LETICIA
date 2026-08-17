import { json } from '../../src/auth.js';

export async function onRequestGet({ env }) {
  return json({ ok: true, kv: !!env.SITE_CONTENT });
}
