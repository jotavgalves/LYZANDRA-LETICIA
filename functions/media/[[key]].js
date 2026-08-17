export async function onRequestGet({params,env}) {
  if (!env.MEDIA) return new Response('R2 MEDIA não configurado.',{status:404});
  const parts=Array.isArray(params.key)?params.key:[params.key];
  const key=parts.filter(Boolean).join('/');
  const obj=await env.MEDIA.get(key);
  if (!obj) return new Response('Não encontrado',{status:404});
  const h=new Headers(); obj.writeHttpMetadata(h); h.set('etag',obj.httpEtag); h.set('cache-control',h.get('cache-control')||'public, max-age=31536000, immutable');
  return new Response(obj.body,{headers:h});
}
