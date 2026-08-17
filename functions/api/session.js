import { isAuthed, json } from '../../src/auth.js';
export async function onRequestGet({request,env}) { return json({authenticated: await isAuthed(request,env)}); }
