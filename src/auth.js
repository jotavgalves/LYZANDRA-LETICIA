const COOKIE = 'ly_admin';
const enc = new TextEncoder();

function b64url(bytes) {
  let s=''; bytes.forEach(b => s += String.fromCharCode(b));
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function b64urlText(text) { return b64url(enc.encode(text)); }
function fromB64url(s) {
  s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='=';
  return atob(s);
}
async function sign(secret, value) {
  const key=await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig=new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value)));
  return b64url(sig);
}
function cookies(req) {
  return Object.fromEntries((req.headers.get('Cookie')||'').split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('='); return i<0?[v,'']:[v.slice(0,i),v.slice(i+1)]}));
}
export async function createSession(secret) {
  const payload = JSON.stringify({ exp: Date.now() + 7*24*60*60*1000, nonce: crypto.randomUUID() });
  const body=b64urlText(payload); const sig=await sign(secret, body);
  return `${body}.${sig}`;
}
export async function isAuthed(request, env) {
  const secret=env.SESSION_SECRET; if (!secret) return false;
  const token=cookies(request)[COOKIE]; if (!token || !token.includes('.')) return false;
  const [body,sig]=token.split('.',2); const expected=await sign(secret, body);
  if (sig !== expected) return false;
  try { const p=JSON.parse(fromB64url(body)); return Number(p.exp) > Date.now(); } catch { return false; }
}
export function sessionCookie(token) { return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`; }
export function clearSessionCookie() { return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`; }
export function json(data,status=200,headers={}) { return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}}); }
