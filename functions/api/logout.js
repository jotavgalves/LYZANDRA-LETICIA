import { clearSessionCookie, json } from '../../src/auth.js';
export async function onRequestPost() { return json({ok:true},200,{'Set-Cookie':clearSessionCookie()}); }
