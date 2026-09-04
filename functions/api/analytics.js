import { isAuthed, json } from '../../src/auth.js';

const PREFIX = 'analytics:v1:';
const TTL_SECONDS = 60 * 60 * 24 * 60;
const ALLOWED_EVENTS = new Set([
  'page_view','results_view','offer_view','scroll_25','scroll_50','scroll_75','scroll_100',
  'checkout_click','whatsapp_click','bio_link','campaign_view','campaign_click','thankyou_view'
]);
const ALLOWED_PAGES = new Set(['landing','bio','thankyou']);

function clean(value, max = 80) {
  return String(value || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
}
function safeToken(value, fallback = 'na') {
  const token = clean(value, 80).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 56);
  return token || fallback;
}
function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = origin === 'https://bio.lycilios.com' || origin === 'https://lycilios.com' || origin.endsWith('.pages.dev');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://lycilios.com',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  };
}
function response(data, status, request) {
  const headers = { 'content-type': 'application/json; charset=utf-8', ...corsHeaders(request) };
  return new Response(JSON.stringify(data), { status, headers });
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function onRequestPost({ request, env }) {
  if (!env.SITE_CONTENT) return response({ ok: false }, 503, request);
  let body;
  try { body = await request.json(); } catch { return response({ error: 'JSON inválido.' }, 400, request); }

  const event = clean(body?.event, 32);
  const session = clean(body?.session, 64);
  const page = ALLOWED_PAGES.has(clean(body?.page, 20)) ? clean(body.page, 20) : 'landing';
  if (!ALLOWED_EVENTS.has(event) || !/^[a-zA-Z0-9_-]{8,64}$/.test(session)) {
    return response({ error: 'Evento inválido.' }, 400, request);
  }

  const now = new Date();
  const label = clean(body?.label, 80);
  const source = clean(body?.source, 40);
  const campaign = clean(body?.campaign, 80);
  const token = event === 'bio_link' || event === 'campaign_click' ? safeToken(label || campaign) : 'stage';
  const key = `${PREFIX}${dateKey(now)}:${page}:${event}:${safeToken(session)}:${token}`;
  const metadata = {
    event,
    page,
    label,
    source,
    campaign,
    day: dateKey(now),
    at: now.toISOString()
  };
  await env.SITE_CONTENT.put(key, '1', { expirationTtl: TTL_SECONDS, metadata });
  return response({ ok: true }, 200, request);
}

function daysAgoKey(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - Math.max(0, days - 1));
  return dateKey(d);
}
function increment(obj, key, by = 1) {
  if (!key) return;
  obj[key] = (obj[key] || 0) + by;
}
function ratio(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 1000) / 10;
}

export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env))) return response({ error: 'Não autorizado.' }, 401, request);
  if (!env.SITE_CONTENT) return response({ error: 'Binding KV SITE_CONTENT não configurado.' }, 500, request);

  const url = new URL(request.url);
  const days = Math.max(1, Math.min(60, Number(url.searchParams.get('days')) || 30));
  const from = daysAgoKey(days);
  const totals = {};
  const sources = {};
  const labels = {};
  const daily = {};
  let cursor;
  let scanned = 0;

  do {
    const page = await env.SITE_CONTENT.list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const item of page.keys || []) {
      scanned += 1;
      const meta = item.metadata || {};
      const day = clean(meta.day || item.name.split(':')[2], 8);
      if (!/^\d{8}$/.test(day) || day < from) continue;
      const event = clean(meta.event, 32);
      if (!ALLOWED_EVENTS.has(event)) continue;
      increment(totals, event);
      if (!daily[day]) daily[day] = {};
      increment(daily[day], event);
      increment(sources, clean(meta.source, 40));
      if (event === 'bio_link' || event === 'campaign_click') increment(labels, clean(meta.label || meta.campaign, 80));
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  const funnel = {
    visits: totals.page_view || 0,
    results: totals.results_view || 0,
    offer: totals.offer_view || 0,
    checkout: totals.checkout_click || 0,
    thankyou: totals.thankyou_view || 0
  };
  const rates = {
    resultsFromVisits: ratio(funnel.results, funnel.visits),
    offerFromVisits: ratio(funnel.offer, funnel.visits),
    checkoutFromOffer: ratio(funnel.checkout, funnel.offer),
    thankyouFromCheckout: ratio(funnel.thankyou, funnel.checkout)
  };

  return response({
    ok: true,
    days,
    from,
    totals,
    funnel,
    rates,
    sources: Object.entries(sources).filter(([k]) => k).sort((a,b) => b[1]-a[1]).slice(0,12),
    labels: Object.entries(labels).filter(([k]) => k).sort((a,b) => b[1]-a[1]).slice(0,12),
    daily,
    scanned
  }, 200, request);
}
