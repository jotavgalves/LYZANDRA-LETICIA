import { isAuthed, json } from '../../src/auth.js';
const EMPTY={version:1,patches:{},sectionOrder:[],site:{customCss:''}};
export async function onRequestGet({env}) {
  if (!env.SITE_CONTENT) return json(EMPTY);
  const value=await env.SITE_CONTENT.get('site-content','json');
  return json(value || EMPTY);
}
export async function onRequestPut({request,env}) {
  if (!(await isAuthed(request,env))) return json({error:'Não autorizado.'},401);
  if (!env.SITE_CONTENT) return json({error:'Binding KV SITE_CONTENT não configurado.'},500);
  const raw=await request.text();
  if (raw.length > 2_000_000) return json({error:'Configuração excede 2 MB.'},413);
  let data; try { data=JSON.parse(raw); } catch { return json({error:'JSON inválido.'},400); }
  if (!data || typeof data!=='object' || typeof data.patches!=='object') return json({error:'Estrutura inválida.'},400);
  data.version=1;
  await env.SITE_CONTENT.put('site-content', JSON.stringify(data));
  return json({ok:true,savedAt:new Date().toISOString()});
}
