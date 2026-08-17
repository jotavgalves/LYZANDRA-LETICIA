import { isAuthed, json } from '../../src/auth.js';

const DEFAULT_REPO = 'jotavgalves/LYZANDRA-LETICIA';
const DEFAULT_BRANCH = 'media';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeName(name = 'imagem') {
  const clean = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(-100);
  return clean || 'imagem';
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function encodePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

export async function onRequestPost({ request, env }) {
  if (!(await isAuthed(request, env))) {
    return json({ error: 'Não autorizado.' }, 401);
  }

  const token = env.GITHUB_TOKEN;
  if (!token) {
    return json({ error: 'Secret GITHUB_TOKEN não configurado no Cloudflare Pages.' }, 500);
  }

  const repository = env.GITHUB_REPO || DEFAULT_REPO;
  const branch = env.GITHUB_MEDIA_BRANCH || DEFAULT_BRANCH;
  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    return json({ error: 'GITHUB_REPO inválido. Use owner/repositorio.' }, 500);
  }

  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return json({ error: 'Arquivo não enviado.' }, 400);
  }
  if (!String(file.type || '').startsWith('image/')) {
    return json({ error: 'Envie uma imagem.' }, 415);
  }
  if (file.size > MAX_FILE_SIZE) {
    return json({ error: 'Arquivo maior que 10 MB.' }, 413);
  }

  const date = new Date().toISOString().slice(0, 10);
  const filename = `${crypto.randomUUID()}-${safeName(file.name)}`;
  const path = `uploads/${date}/${filename}`;
  const content = bufferToBase64(await file.arrayBuffer());

  const githubResponse = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(path)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'lyzandra-leticia-cloudflare-admin',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `media: upload ${filename}`,
        content,
        branch
      })
    }
  );

  let githubData = {};
  try {
    githubData = await githubResponse.json();
  } catch {}

  if (!githubResponse.ok) {
    const detail = githubData?.message ? ` ${githubData.message}` : '';
    return json({ error: `Falha ao enviar imagem ao GitHub.${detail}` }, githubResponse.status);
  }

  const rawPath = path.split('/').map(encodeURIComponent).join('/');
  const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch)}/${rawPath}`;

  return json({
    ok: true,
    key: path,
    path,
    branch,
    url: rawUrl,
    commit: githubData?.commit?.sha || null
  });
}
