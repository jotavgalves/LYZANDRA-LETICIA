const DEFAULT_SEO = {
  enabled: true,
  index: true,
  siteName: 'Ly Cílios',
  title: 'Speed Lash | Curso de extensão de cílios com Lyzandra Letícia',
  description: 'Aprenda técnicas de extensão de cílios para ganhar velocidade, melhorar retenção e elevar a qualidade dos atendimentos com o método Speed Lash.',
  canonicalUrl: 'https://lycilios.com/',
  searchConsoleVerification: '',
  socialImage: '',
  organizationName: 'Ly Cílios',
  courseName: 'Speed Lash',
  courseDescription: 'Curso de extensão de cílios com foco em velocidade, retenção, segurança e técnicas avançadas.',
  instructorName: 'Lyzandra Letícia'
};

function normalizeSeo(value = {}) {
  const raw = value && typeof value === 'object' ? value : {};
  return {
    ...DEFAULT_SEO,
    ...raw,
    enabled: raw.enabled !== false,
    index: raw.index !== false,
    canonicalUrl: String(raw.canonicalUrl || DEFAULT_SEO.canonicalUrl).trim()
  };
}

function absolute(value, origin) {
  if (!value) return '';
  try { return new URL(String(value), origin).href; } catch { return ''; }
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function graphFor(seo, data, canonical, requestOrigin) {
  const identity = data?.site?.identity || {};
  const logo = absolute(identity?.logo?.src || identity?.footerLogo?.src || '', requestOrigin);
  const image = absolute(seo.socialImage || logo, requestOrigin);
  const orgId = `${canonical}#organization`;
  const personId = `${canonical}#instructor`;
  const websiteId = `${canonical}#website`;
  const courseId = `${canonical}#course`;

  const graph = [
    {
      '@type': 'WebSite', '@id': websiteId, url: canonical,
      name: seo.siteName, inLanguage: 'pt-BR', publisher: { '@id': orgId }
    },
    {
      '@type': 'Organization', '@id': orgId,
      name: seo.organizationName, url: canonical
    },
    {
      '@type': 'Person', '@id': personId,
      name: seo.instructorName
    },
    {
      '@type': 'Course', '@id': courseId, url: canonical,
      name: seo.courseName, description: seo.courseDescription,
      inLanguage: 'pt-BR', provider: { '@id': orgId }, author: { '@id': personId }
    }
  ];

  if (logo) graph[1].logo = { '@type': 'ImageObject', url: logo };
  if (image) {
    graph[0].image = image;
    graph[2].image = image;
    graph[3].image = image;
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

class HeadHandler {
  constructor({ seo, data, canonical, requestOrigin, preview }) {
    this.seo = seo;
    this.data = data;
    this.canonical = canonical;
    this.requestOrigin = requestOrigin;
    this.preview = preview;
  }

  element(head) {
    const { seo, data, canonical, requestOrigin, preview } = this;
    const title = seo.title || data?.site?.title || DEFAULT_SEO.title;
    const description = seo.description || data?.site?.description || DEFAULT_SEO.description;
    const socialImage = absolute(seo.socialImage, requestOrigin);
    const robots = preview || !seo.enabled || !seo.index
      ? 'noindex,nofollow,noarchive'
      : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

    let html = '';
    html += `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`;
    html += `<link rel="canonical" href="${escapeAttr(canonical)}">`;
    html += `<meta name="robots" content="${escapeAttr(robots)}">`;
    html += `<meta name="googlebot" content="${escapeAttr(robots)}">`;
    html += `<meta property="og:type" content="website">`;
    html += `<meta property="og:locale" content="pt_BR">`;
    html += `<meta property="og:site_name" content="${escapeAttr(seo.siteName)}">`;
    html += `<meta property="og:title" content="${escapeAttr(title)}">`;
    html += `<meta property="og:description" content="${escapeAttr(description)}">`;
    html += `<meta property="og:url" content="${escapeAttr(canonical)}">`;
    html += `<meta name="twitter:card" content="${socialImage ? 'summary_large_image' : 'summary'}">`;
    html += `<meta name="twitter:title" content="${escapeAttr(title)}">`;
    html += `<meta name="twitter:description" content="${escapeAttr(description)}">`;
    if (socialImage) {
      html += `<meta property="og:image" content="${escapeAttr(socialImage)}">`;
      html += `<meta name="twitter:image" content="${escapeAttr(socialImage)}">`;
    }
    if (seo.searchConsoleVerification) {
      html += `<meta name="google-site-verification" content="${escapeAttr(seo.searchConsoleVerification)}">`;
    }
    html += `<script type="application/ld+json" id="ly-seo-structured-data-server">${safeJson(graphFor(seo, data, canonical, requestOrigin))}</script>`;
    head.append(html, { html: true });
  }
}

class TitleHandler {
  constructor(title) { this.title = title; }
  element(el) { el.setInnerContent(this.title); }
}

class DescriptionHandler {
  constructor(description) { this.description = description; }
  element(el) { el.setAttribute('content', this.description); }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const preview = url.searchParams.has('admin-preview');

  if (!preview && url.hostname === 'www.lycilios.com') {
    const target = new URL('https://lycilios.com/');
    target.search = url.search;
    return Response.redirect(target.toString(), 301);
  }
  if (!preview && url.hostname === 'lycilios.com' && url.pathname === '/index.html') {
    const target = new URL('https://lycilios.com/');
    target.search = url.search;
    return Response.redirect(target.toString(), 301);
  }

  let data = {};
  try { data = await env.SITE_CONTENT?.get('site-content', 'json') || {}; } catch {}

  const seo = normalizeSeo(data?.site?.seo || {});
  let canonical = DEFAULT_SEO.canonicalUrl;
  if (seo.canonicalUrl) {
    try {
      const parsed = new URL(seo.canonicalUrl);
      parsed.search = '';
      parsed.hash = '';
      canonical = parsed.href;
    } catch {}
  }

  const title = seo.title || data?.site?.title || DEFAULT_SEO.title;
  const description = seo.description || data?.site?.description || DEFAULT_SEO.description;
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  const rewritten = new HTMLRewriter()
    .on('title', new TitleHandler(title))
    .on('meta[name="description"]', new DescriptionHandler(description))
    .on('head', new HeadHandler({ seo, data, canonical, requestOrigin: url.origin, preview }))
    .transform(response);

  const headers = new Headers(rewritten.headers);
  headers.set('X-Robots-Tag', preview || !seo.enabled || !seo.index ? 'noindex, nofollow, noarchive' : 'index, follow');
  return new Response(rewritten.body, { status: rewritten.status, statusText: rewritten.statusText, headers });
}
