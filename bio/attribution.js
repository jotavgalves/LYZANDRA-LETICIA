(() => {
  if (new URLSearchParams(location.search).has('admin-preview')) return;
  const KEY='ly_bio_session_v1';
  function session(){try{let v=localStorage.getItem(KEY);if(!/^[a-zA-Z0-9_-]{8,64}$/.test(v||'')){v=(crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64);localStorage.setItem(KEY,v)}return v}catch{return `b${Date.now()}${Math.random().toString(36).slice(2,9)}`}}
  function slug(value){return String(value||'link').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'link'}
  function decorated(raw,label){
    try{
      const url=new URL(raw,location.href);
      if(!/(^|\.)lycilios\.com$/i.test(url.hostname)) return url.toString();
      if(!url.searchParams.has('utm_source')) url.searchParams.set('utm_source','instagram');
      if(!url.searchParams.has('utm_medium')) url.searchParams.set('utm_medium','bio');
      if(!url.searchParams.has('src')) url.searchParams.set('src','bio');
      if(!url.searchParams.has('sck')) url.searchParams.set('sck',slug(label));
      return url.toString();
    }catch{return raw}
  }
  function send(label){
    const payload={event:'bio_link',session:session(),page:'bio',source:'bio',campaign:'instagram-bio',label:String(label||'Link').slice(0,80)};
    try{fetch('https://lycilios.com/api/analytics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true,credentials:'omit',mode:'cors'}).catch(()=>{})}catch{}
  }
  document.addEventListener('click',event=>{
    const anchor=event.target.closest?.('a[data-bio-label]');if(!anchor)return;
    const raw=anchor.getAttribute('href')||'';if(!raw||raw==='#')return;
    const label=anchor.dataset.bioLabel||anchor.textContent.trim()||'Link';
    send(label);
    const target=decorated(raw,label);
    if(anchor.target==='_blank'){event.preventDefault();window.open(target,'_blank','noopener');return}
    event.preventDefault();location.href=target;
  },true);
})();
