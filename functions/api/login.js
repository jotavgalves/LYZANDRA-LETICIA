import { createSession, sessionCookie, json } from '../../src/auth.js';
export async function onRequestPost({request, env}) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({error:'ADMIN_PASSWORD ou SESSION_SECRET não configurado.'},500);
  let body; try { body=await request.json(); } catch { return json({error:'JSON inválido.'},400); }
  if (String(body.password||'') !== String(env.ADMIN_PASSWORD)) return json({error:'Senha inválida.'},401);
  const token=await createSession(env.SESSION_SECRET);
  return json({ok:true},200,{'Set-Cookie':sessionCookie(token)});
}
