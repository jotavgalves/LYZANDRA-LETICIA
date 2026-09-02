const enc = new TextEncoder();

const MAX_FAILURES = 5;
const WINDOW_MS = 10 * 60 * 1000;
const BASE_BLOCK_MS = 15 * 60 * 1000;
const MAX_BLOCK_MS = 6 * 60 * 60 * 1000;
const STRIKE_DECAY_MS = 24 * 60 * 60 * 1000;
const STATE_TTL_SECONDS = 48 * 60 * 60;

function clientIp(request) {
  const cfIp = String(request.headers.get('CF-Connecting-IP') || '').trim();
  if (cfIp) return cfIp;
  const forwarded = String(request.headers.get('X-Forwarded-For') || '').split(',')[0].trim();
  return forwarded || 'unknown-client';
}

function hex(bytes) {
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function fingerprint(secret, request) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const value = `admin-login:${clientIp(request)}`;
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value)));
  return hex(signature).slice(0, 40);
}

function freshState(now = Date.now()) {
  return {
    attempts: 0,
    windowStartedAt: now,
    strikes: 0,
    lastFailureAt: 0,
    blockedUntil: 0
  };
}

function normalizeState(value, now = Date.now()) {
  const state = { ...freshState(now), ...(value || {}) };
  state.attempts = Math.max(0, Number(state.attempts) || 0);
  state.windowStartedAt = Number(state.windowStartedAt) || now;
  state.strikes = Math.max(0, Number(state.strikes) || 0);
  state.lastFailureAt = Number(state.lastFailureAt) || 0;
  state.blockedUntil = Number(state.blockedUntil) || 0;

  if (state.lastFailureAt && now - state.lastFailureAt >= STRIKE_DECAY_MS) {
    state.strikes = 0;
    state.attempts = 0;
    state.blockedUntil = 0;
    state.windowStartedAt = now;
  } else if (now - state.windowStartedAt >= WINDOW_MS) {
    state.attempts = 0;
    state.windowStartedAt = now;
  }

  return state;
}

async function readState(env, key, now) {
  const raw = await env.SITE_CONTENT.get(key);
  if (!raw) return freshState(now);
  try {
    return normalizeState(JSON.parse(raw), now);
  } catch {
    return freshState(now);
  }
}

async function writeState(env, key, state) {
  await env.SITE_CONTENT.put(key, JSON.stringify(state), {
    expirationTtl: STATE_TTL_SECONDS
  });
}

export async function getLoginRateState(request, env) {
  if (!env.SITE_CONTENT) throw new Error('SITE_CONTENT não configurado para proteção de login.');
  if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET não configurado para proteção de login.');

  const now = Date.now();
  const id = await fingerprint(env.SESSION_SECRET, request);
  const key = `security:admin-login:${id}`;
  const state = await readState(env, key, now);

  if (state.blockedUntil > now) {
    return {
      limited: true,
      key,
      state,
      retryAfterSeconds: Math.max(1, Math.ceil((state.blockedUntil - now) / 1000)),
      remaining: 0
    };
  }

  return {
    limited: false,
    key,
    state,
    retryAfterSeconds: 0,
    remaining: Math.max(0, MAX_FAILURES - state.attempts)
  };
}

export async function registerLoginFailure(rate, env) {
  const now = Date.now();
  const state = normalizeState(rate.state, now);
  state.attempts += 1;
  state.lastFailureAt = now;

  let retryAfterSeconds = 0;
  let limited = false;

  if (state.attempts >= MAX_FAILURES) {
    state.strikes = Math.max(1, state.strikes + 1);
    const blockMs = Math.min(BASE_BLOCK_MS * (2 ** (state.strikes - 1)), MAX_BLOCK_MS);
    state.blockedUntil = now + blockMs;
    state.attempts = 0;
    state.windowStartedAt = now;
    retryAfterSeconds = Math.ceil(blockMs / 1000);
    limited = true;
  }

  await writeState(env, rate.key, state);

  return {
    limited,
    retryAfterSeconds,
    remaining: limited ? 0 : Math.max(0, MAX_FAILURES - state.attempts)
  };
}

export async function clearLoginFailures(rate, env) {
  if (rate?.key && env.SITE_CONTENT) await env.SITE_CONTENT.delete(rate.key);
}

export const LOGIN_RATE_POLICY = Object.freeze({
  maxFailures: MAX_FAILURES,
  windowSeconds: WINDOW_MS / 1000,
  baseBlockSeconds: BASE_BLOCK_MS / 1000,
  maxBlockSeconds: MAX_BLOCK_MS / 1000
});
