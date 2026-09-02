(() => {
  const DEFAULT = {
    enabled: true,
    index: true,
    siteName: 'Ly Cílios',
    title: 'Speed Lash | Curso de extensão de cílios com Lyzandra Letícia',
    description: 'Aprenda técnicas de extensão de cílios para ganhar velocidade, melhorar retenção e elevar a qualidade dos atendimentos com o método Speed Lash.',
    canonicalUrl: '',
    searchConsoleVerification: '',
    socialImage: '',
    organizationName: 'Ly Cílios',
    courseName: 'Speed Lash',
    courseDescription: 'Curso de extensão de cílios com foco em velocidade, retenção, segurança e técnicas avançadas.',
    instructorName: 'Lyzandra Letícia'
  };

  const clone = value => JSON.parse(JSON.stringify(value));

  function normalize(value) {
    const raw = value && typeof value === 'object' ? value : {};
    return {
      ...clone(DEFAULT),
      ...raw,
      enabled: raw.enabled !== false,
      index: raw.index !== false,
      siteName: String(raw.siteName || DEFAULT.siteName),
      title: String(raw.title || DEFAULT.title),
      description: String(raw.description || DEFAULT.description),
      canonicalUrl: String(raw.canonicalUrl || '').trim(),
      searchConsoleVerification: String(raw.searchConsoleVerification || '').trim(),
      socialImage: String(raw.socialImage || '').trim(),
      organizationName: String(raw.organizationName || DEFAULT.organizationName),
      courseName: String(raw.courseName || DEFAULT.courseName),
      courseDescription: String(raw.courseDescription || DEFAULT.courseDescription),
      instructorName: String(raw.instructorName || DEFAULT.instructorName)
    };
  }

  function absolute(value, base = location.origin) {
    if (!value) return '';
    try { return new URL(value, base).href; } catch { return ''; }
  }

  function canonicalFor(config) {
    const explicit = absolute(config.canonicalUrl);
    if (explicit) return explicit.replace(/[?#].*$/, '');
    return `${location.origin}/`;
  }

  function upsertMeta(selector, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, String(value)));
    return el;
  }

  function upsertLink(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
    return el;
  }

  function remove(selector) {
    document.head.querySelectorAll(selector).forEach(el => el.remove());
  }

  function buildJsonLd(config, data, canonical) {
    const identity = data?.site?.identity || {};
    const logo = absolute(identity?.logo?.src || identity?.footerLogo?.src || '');
    const image = absolute(config.socialImage || logo);
    const orgId = `${canonical}#organization`;
    const personId = `${canonical}#instructor`;
    const websiteId = `${canonical}#website`;
    const courseId = `${canonical}#course`;

    const graph = [
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: canonical,
        name: config.siteName,
        inLanguage: 'pt-BR',
        publisher: { '@id': orgId }
      },
      {
        '@type': 'Organization',
        '@id': orgId,
        name: config.organizationName,
        url: canonical
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: config.instructorName
      },
      {
        '@type': 'Course',
        '@id': courseId,
        url: canonical,
        name: config.courseName,
        description: config.courseDescription,
        inLanguage: 'pt-BR',
        provider: { '@id': orgId },
        author: { '@id': personId }
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

  function apply(data = {}) {
    const config = normalize(data?.site?.seo);
    const preview = new URLSearchParams(location.search).has('admin-preview');
    const canonical = canonicalFor(config);
    const title = config.title || data?.site?.title || document.title;
    const description = config.description || data?.site?.description || '';
    const socialImage = absolute(config.socialImage);

    document.documentElement.lang = 'pt-BR';
    document.title = title;

    upsertMeta('meta[name="description"]', { name: 'description', content: description });
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: preview || !config.enabled || !config.index
        ? 'noindex,nofollow,noarchive'
        : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    });
    upsertMeta('meta[name="googlebot"]', {
      name: 'googlebot',
      content: preview || !config.enabled || !config.index
        ? 'noindex,nofollow,noarchive'
        : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
    });

    upsertLink('canonical', canonical);

    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'pt_BR' });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: config.siteName });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: socialImage ? 'summary_large_image' : 'summary' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });

    if (socialImage) {
      upsertMeta('meta[property="og:image"]', { property: 'og:image', content: socialImage });
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: socialImage });
    } else {
      remove('meta[property="og:image"],meta[name="twitter:image"]');
    }

    if (config.searchConsoleVerification) {
      upsertMeta('meta[name="google-site-verification"]', {
        name: 'google-site-verification',
        content: config.searchConsoleVerification
      });
    } else {
      remove('meta[name="google-site-verification"]');
    }

    let jsonLd = document.head.querySelector('#ly-seo-structured-data, #ly-seo-structured-data-server');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      document.head.appendChild(jsonLd);
    }
    jsonLd.id = 'ly-seo-structured-data';
    jsonLd.type = 'application/ld+json';
    jsonLd.textContent = JSON.stringify(buildJsonLd(config, data, canonical));
  }

  window.LyzandraSEO = { apply, normalize, defaults: clone(DEFAULT) };
  window.addEventListener('site-content-ready', event => apply(event.detail || window.__SITE_CONTENT__ || {}));
  if (window.__SITE_CONTENT__) apply(window.__SITE_CONTENT__);
})();
