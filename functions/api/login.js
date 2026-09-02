import { createSession, sessionCookie, json } from '../../src/auth.js';
import { getLoginRateState, registerLoginFailure, clearLoginFailures } from '../../src/login-rate-limit.js';

function retryMessage(seconds) {
  const minutes = Math.max(1, Math.ceil(Number(seconds || 0) / 60));
  return `Muitas tentativas de acesso. Tente novamente em cerca de ${minutes} min.`;
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: 'ADMIN_PASSWORD ou SESSION_SECRET não configurado.' }, 500);
  }
  if (!env.SITE_CONTENT) {
    return json({ error: 'Proteção de acesso indisponível no momento.' }, 503);
  }

  let rate;
  try {
    rate = await getLoginRateState(request, env);
  } catch {
    return json({ error: 'Proteção de acesso indisponível no momento.' }, 503);
  }

  if (rate.limited) {
    return json(
      {
        error: retryMessage(rate.retryAfterSeconds),
        retryAfterSeconds: rate.retryAfterSeconds
      },
      429,
      { 'Retry-After': String(rate.retryAfterSeconds) }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido.' }, 400);
  }

  if (String(body.password || '') !== String(env.ADMIN_PASSWORD)) {
    let failure;
    try {
      failure = await registerLoginFailure(rate, env);
    } catch {
      return json({ error: 'Proteção de acesso indisponível no momento.' }, 503);
    }

    if (failure.limited) {
      return json(
        {
          error: retryMessage(failure.retryAfterSeconds),
          retryAfterSeconds: failure.retryAfterSeconds
        },
        429,
        { 'Retry-After': String(failure.retryAfterSeconds) }
      );
    }

    return json(
      {
        error: 'Senha inválida.',
        attemptsRemaining: failure.remaining
      },
      401
    );
  }

  try {
    await clearLoginFailures(rate, env);
  } catch {
    return json({ error: 'Proteção de acesso indisponível no momento.' }, 503);
  }

  const token = await createSession(env.SESSION_SECRET);
  return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(token) });
}
