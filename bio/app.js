(() => {
  const ICONS = {
    bag:'<path d="M6 2 3 6v15h18V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    video:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="m10 8 5 2.5-5 2.5V8Z"/><path d="M8 21h8M12 17v4"/>',
    chart:'<path d="M3 20h18"/><path d="m5 16 4-5 4 3 6-8"/><path d="M17 6h2v2"/>',
    certificate:'<circle cx="12" cy="9" r="6"/><path d="m8.8 14.2-1.2 6.3L12 18l4.4 2.5-1.2-6.3"/><path d="m9.6 9.2 1.5 1.5 3.3-3.3"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 3.4-6.3 8-6.3s7.2 2.1 8 6.3"/>',
    whatsapp:'<path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.3-4A8 8 0 1 1 21 12Z"/><path d="M8.5 9.5c.8 3 3 5.2 6 6"/>',
    instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.7 5.7 3.7 9S14.5 18.3 12 21M12 3c-2.5 2.7-3.7 5.7-3.7 9S9.5 18.3 12 21"/>'
  };
  const clone = v => JSON.parse(JSON.stringify(v));
  const merge = (base, raw) => {
    if (Array.isArray(base)) return Array.isArray(raw) ? raw : clone(base);
    if (!base || typeof base !== 'object') return raw ?? base;
    const out = { ...base };
    Object.keys(base).forEach(k => { out[k] = merge(base[k], raw?.[k]); });
    if (raw && typeof raw === 'object') Object.keys(raw).forEach(k => { if (!(k in out)) out[k] = raw[k]; });
    return out;
  };
  const icon = (name, size=20) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.globe}</svg>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let config = clone(window.BIO_DEFAULT || {});
  let current = 0;
  let timer = 0;

  async function load(){
    try{
      const r = await fetch('/api/bio-content',{cache:'no-store'});
      if(r.ok) config = merge(config, await r.json());
    }catch{}
    render();
  }

  function highlightText(title, highlight){
    const full = String(title || '');
    const h = String(highlight || '').trim();
    if(!h) return esc(full);
    const i = full.toLocaleLowerCase('pt-BR').indexOf(h.toLocaleLowerCase('pt-BR'));
    if(i < 0) return esc(full);
    return esc(full.slice(0,i)) + '<em>' + esc(full.slice(i,i+h.length)) + '</em>' + esc(full.slice(i+h.length));
  }

  function applyTheme(){
    const t=config.theme||{};
    const root=document.documentElement.style;
    if(t.background) root.setProperty('--black',t.background);
    if(t.backgroundSoft) root.setProperty('--black2',t.backgroundSoft);
    if(t.primary) root.setProperty('--rose',t.primary);
    if(t.primarySoft) root.setProperty('--rose2',t.primarySoft);
    if(t.text) root.setProperty('--cream',t.text);
    if(t.muted) root.setProperty('--muted',t.muted);
  }

  function renderHero(){
    const slides=(config.carousel?.slides||[]).filter(s=>s?.visible!==false && s?.image);
    const host=document.querySelector('#slides');
    const dots=document.querySelector('#slideIndicators');
    host.innerHTML=slides.map((s,i)=>`<article class="slide ${i===0?'active':''}" data-slide="${i}"><img src="${esc(s.image)}" alt="" style="object-position:${esc(s.position||'center')}"><div class="slide-overlay"></div><div class="slide-copy"><span class="eyebrow">${esc(s.eyebrow||'')}</span><h1>${highlightText(s.title,s.highlight)}</h1><p>${esc(s.subtitle||'')}</p></div></article>`).join('');
    dots.innerHTML=slides.map((_,i)=>`<button class="indicator ${i===0?'active':''}" type="button" aria-label="Destaque ${i+1}" data-dot="${i}"></button>`).join('');
    dots.querySelectorAll('button').forEach(b=>b.onclick=()=>go(Number(b.dataset.dot)));
    current=0;
    restart(slides.length);
  }

  function go(index){
    const slides=[...document.querySelectorAll('.slide')];
    if(!slides.length) return;
    current=(index+slides.length)%slides.length;
    slides.forEach((s,i)=>s.classList.toggle('active',i===current));
    document.querySelectorAll('.indicator').forEach((d,i)=>d.classList.toggle('active',i===current));
  }
  function restart(count){
    clearInterval(timer);
    if(config.carousel?.autoplay!==false && count>1) timer=setInterval(()=>go(current+1),Math.max(2500,Number(config.carousel?.intervalMs)||4800));
  }

  function renderLinks(){
    const f=config.featured||{};
    const fa=document.querySelector('#featuredLink');
    fa.hidden=f.visible===false;
    fa.href=f.url||'#';
    document.querySelector('#featuredIcon').innerHTML=icon(f.icon||'bag',22);
    document.querySelector('#featuredTitle').textContent=f.title||'';
    document.querySelector('#featuredSubtitle').textContent=f.subtitle||'';
    fa.dataset.bioLabel=f.title||'Destaque';

    const list=document.querySelector('#linksList');
    list.innerHTML=(config.links||[]).filter(x=>x?.visible!==false).map((x,i)=>`<a class="link-card" href="${esc(x.url||'#')}" data-bio-label="${esc(x.label||'Link '+(i+1))}"><span class="link-icon">${icon(x.icon||'globe')}</span><span class="link-copy"><strong>${esc(x.label||'')}</strong><small>${esc(x.detail||'')}</small></span><span class="link-arrow">›</span></a>`).join('');
  }

  function renderSocials(){
    const s=config.socials||{};
    const entries=[['instagram',s.instagram],['whatsapp',s.whatsapp],['globe',s.website]];
    document.querySelector('#socials').innerHTML=entries.filter(([,u])=>u).map(([name,u])=>`<a class="social" href="${esc(u)}" aria-label="${name}" data-bio-label="${name}">${icon(name)}</a>`).join('');
  }

  function render(){
    applyTheme();
    const s=config.site||{};
    document.title=s.title||'Ly Cílios | Speed Lash';
    const md=document.querySelector('meta[name="description"]'); if(md) md.content=s.description||'';
    document.querySelector('#brandLogo').src=s.logo||'/bio/favicon.svg';
    document.querySelector('#brandName').textContent=s.brand||'LY CÍLIOS';
    document.querySelector('#brandSubtitle').textContent=s.brandSubtitle||'';
    document.querySelector('#bioQuote').textContent=s.quote||'';
    document.querySelector('#quoteAuthor').textContent=s.quoteAuthor||'';
    document.querySelector('#bioLocation').textContent=s.location||'';
    document.querySelector('#termsLink').href=s.termsUrl||'#';
    document.querySelector('#privacyLink').href=s.privacyUrl||'#';
    document.querySelector('#tagsTitle').textContent=config.tags?.title||'';
    document.querySelector('#tagsSection').hidden=config.tags?.visible===false;
    document.querySelector('#tagsList').innerHTML=(config.tags?.items||[]).map(x=>`<span>${esc(x)}</span>`).join('');
    renderHero(); renderLinks(); renderSocials(); setupMarketing(); bindTracking();
    window.__BIO_CONFIG__=config;
  }

  function setupMarketing(){
    const m=config.marketing||{};
    if(m.metaPixel?.enabled && m.metaPixel.id && !window.__bioMeta){
      window.__bioMeta=true;
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init',String(m.metaPixel.id).trim()); fbq('track','PageView');
    }
    if(m.ga4?.enabled && m.ga4.id && !window.__bioGA){
      window.__bioGA=true; window.dataLayer=window.dataLayer||[]; window.gtag=function(){dataLayer.push(arguments)};
      const sc=document.createElement('script'); sc.async=true; sc.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(m.ga4.id); document.head.appendChild(sc);
      gtag('js',new Date()); gtag('config',String(m.ga4.id).trim());
    }
    if(m.gtm?.enabled && m.gtm.id && !window.__bioGTM){
      window.__bioGTM=true; window.dataLayer=window.dataLayer||[]; window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
      const sc=document.createElement('script'); sc.async=true; sc.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(m.gtm.id); document.head.appendChild(sc);
    }
  }

  function bindTracking(){
    if(config.marketing?.trackClicks===false) return;
    document.querySelectorAll('[data-bio-label]').forEach(a=>{
      if(a.dataset.tracked==='1') return; a.dataset.tracked='1';
      a.addEventListener('click',()=>{
        const label=a.dataset.bioLabel||a.textContent.trim();
        try{ if(window.fbq) fbq('trackCustom','BioLinkClick',{label}); }catch{}
        try{ if(window.gtag) gtag('event','bio_link_click',{link_text:label,link_url:a.href}); }catch{}
        try{ window.dataLayer?.push({event:'bio_link_click',link_text:label,link_url:a.href}); }catch{}
      });
    });
  }

  document.querySelector('#shareBtn').onclick=async()=>{
    try{ if(navigator.share) await navigator.share({title:document.title,text:config.site?.description||'',url:location.href}); else await navigator.clipboard.writeText(location.href); }catch{}
  };
  document.addEventListener('visibilitychange',()=>document.hidden?clearInterval(timer):restart(document.querySelectorAll('.slide').length));
  load();
})();
