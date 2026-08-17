import { isAuthed, json } from '../../src/auth.js';
function safeName(name='arquivo') { return name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(-100); }
export async function onRequestPost({request,env}) {
  if (!(await isAuthed(request,env))) return json({error:'Não autorizado.'},401);
  if (!env.MEDIA) return json({error:'Binding R2 MEDIA não configurado.'},500);
  const form=await request.formData();
  const file=form.get('file');
  if (!(file instanceof File)) return json({error:'Arquivo não enviado.'},400);
  if (file.size > 15*1024*1024) return json({error:'Arquivo maior que 15 MB.'},413);
  if (!String(file.type||'').startsWith('image/')) return json({error:'Envie uma imagem.'},415);
  const key=`${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName(file.name)}`;
  await env.MEDIA.put(key, file.stream(), {httpMetadata:{contentType:file.type, cacheControl:'public, max-age=31536000, immutable'}});
  return json({ok:true,key,url:`/media/${key}`});
}
