(() => {
  const DEFAULT={title:'Compra confirmada',subtitle:'Seu próximo passo começa agora.',text:'Confira as instruções enviadas após a confirmação do pagamento. Se precisar, fale com a nossa equipe.',accessLabel:'Acessar meu curso',accessUrl:'',supportLabel:'Falar com o suporte',supportUrl:''};
  const SESSION_KEY='ly_funnel_session_v1';
  function session(){try{let v=localStorage.getItem(SESSION_KEY);if(!/^[a-zA-Z0-9_-]{8,64}$/.test(v||'')){v=(crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64);localStorage.setItem(SESSION_KEY,v)}return v}catch{return `s${Date.now()}${Math.random().toString(36).slice(2,10)}`}}
  async function load(){
    let cfg={...DEFAULT};
    try{const r=await fetch('/api/content',{cache:'no-store'});if(r.ok){const data=await r.json();cfg={...cfg,...(data?.site?.growth?.thankYou||{})}}}catch{}
    document.querySelector('#tyTitle').textContent=cfg.title||DEFAULT.title;
    document.querySelector('#tySubtitle').textContent=cfg.subtitle||DEFAULT.subtitle;
    document.querySelector('#tyText').textContent=cfg.text||DEFAULT.text;
    const access=document.querySelector('#tyAccess'),support=document.querySelector('#tySupport');
    if(cfg.accessUrl){access.href=cfg.accessUrl;access.textContent=cfg.accessLabel||DEFAULT.accessLabel;access.hidden=false}
    if(cfg.supportUrl){support.href=cfg.supportUrl;support.textContent=cfg.supportLabel||DEFAULT.supportLabel;support.hidden=false}
  }
  function track(){
    const params=new URLSearchParams(location.search);
    const payload={event:'thankyou_view',session:session(),page:'thankyou',source:params.get('src')||params.get('utm_source')||'',campaign:params.get('utm_campaign')||params.get('sck')||'',label:''};
    try{fetch('/api/analytics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true,credentials:'omit'}).catch(()=>{})}catch{}
  }
  load();track();
})();
