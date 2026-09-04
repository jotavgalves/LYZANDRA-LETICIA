(() => {
  const editorBox = document.querySelector('#sectorEditor');
  const preview = document.querySelector('#preview');
  if (!editorBox || !preview) return;

  const DEFAULT = {
    premiumExperience:{ enabled:true, microInteractions:true, cinematicHero:true, offerClimax:true },
    analytics:{ enabled:true },
    campaign:{ enabled:false,badge:'CONDIÇÃO ESPECIAL',title:'Condição especial por tempo limitado',message:'Confira a condição disponível nesta campanha.',startsAt:'',endsAt:'',countdownEnabled:false,ctaLabel:'Ver oferta',ctaTarget:'#oferta-card' },
    thankYou:{ title:'Compra confirmada',subtitle:'Seu próximo passo começa agora.',text:'Confira as instruções enviadas após a confirmação do pagamento. Se precisar, fale com a nossa equipe.',accessLabel:'Acessar meu curso',accessUrl:'',supportLabel:'Falar com o suporte',supportUrl:'' }
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  let state = clone(DEFAULT);
  let loaded = false;
  let timer = 0;
  let saving = false;
  let period = 30;

  async function api(url, opts={}) {
    const headers={...(opts.headers||{})};
    if(opts.body && !(opts.body instanceof FormData)) headers['content-type']='application/json';
    const r=await fetch(url,{...opts,headers,cache:'no-store'});
    let data={}; try{data=await r.json()}catch{}
    if(!r.ok) throw new Error(data.error||`Erro ${r.status}`);
    return data;
  }
  function merge(base, raw) {
    if(Array.isArray(base)) return Array.isArray(raw)?raw:clone(base);
    if(!base || typeof base!=='object') return raw ?? base;
    const out={...base};
    Object.keys(base).forEach(k=>{out[k]=merge(base[k],raw?.[k])});
    if(raw&&typeof raw==='object') Object.keys(raw).forEach(k=>{if(!(k in out)) out[k]=raw[k]});
    return out;
  }
  function toast(message){
    const box=document.querySelector('#toast'); if(!box)return;
    box.textContent=message;box.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>box.classList.add('hidden'),2500);
  }
  function isGeneral(){return /Configurações gerais/i.test(document.querySelector('#sectorTitle')?.textContent||'')}
  function field(label,type='text',value=''){
    const wrap=document.createElement('label');wrap.className='mini-field';
    const span=document.createElement('span');span.textContent=label;
    const input=document.createElement('input');input.type=type;input.value=value??'';
    wrap.append(span,input);return {wrap,input};
  }
  function textarea(label,value=''){
    const wrap=document.createElement('label');wrap.className='mini-field';
    const span=document.createElement('span');span.textContent=label;
    const input=document.createElement('textarea');input.rows=3;input.value=value??'';
    wrap.append(span,input);return {wrap,input};
  }
  function toggle(label,checked=false){
    const row=document.createElement('label');row.className='visibility-line';
    const span=document.createElement('span');span.textContent=label;
    const input=document.createElement('input');input.type='checkbox';input.checked=!!checked;
    row.append(span,input);return {row,input};
  }
  function card(title,description=''){
    const el=document.createElement('div');el.className='general-card growth-card';
    const h=document.createElement('h3');h.textContent=title;h.style.margin='0';el.appendChild(h);
    if(description){const p=document.createElement('p');p.textContent=description;p.style.cssText='margin:2px 0 6px;font-size:10px;color:#817881;line-height:1.55';el.appendChild(p)}
    return el;
  }
  function toLocal(value){
    if(!value)return'';const d=new Date(value);if(!Number.isFinite(d.getTime()))return'';
    const pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function fromLocal(value){if(!value)return'';const d=new Date(value);return Number.isFinite(d.getTime())?d.toISOString():''}

  function applyPreview(){
    const win=preview.contentWindow;if(!win)return;
    win.__SITE_CONTENT__=win.__SITE_CONTENT__||{};win.__SITE_CONTENT__.site=win.__SITE_CONTENT__.site||{};
    win.__SITE_CONTENT__.site.growth=clone(state);
    win.LyzandraPremiumExperience?.apply?.(win.__SITE_CONTENT__);
    win.LyzandraCampaign?.apply?.(win.__SITE_CONTENT__);
  }
  async function load(){
    if(loaded)return;
    const content=await api('/api/content');state=merge(DEFAULT,content?.site?.growth||{});loaded=true;applyPreview();
  }
  async function persist(showToast=false){
    if(saving)return;saving=true;
    try{
      const content=await api('/api/content');content.site={...(content.site||{}),growth:clone(state)};
      await api('/api/content',{method:'PUT',body:JSON.stringify(content)});applyPreview();if(showToast)toast('Crescimento e campanhas salvos.');
    }catch(error){toast(error.message)}finally{saving=false}
  }
  function schedule(){applyPreview();clearTimeout(timer);timer=setTimeout(()=>persist(false),700)}

  function metric(label,value,sub=''){
    const el=document.createElement('div');el.style.cssText='padding:12px;border:1px solid #eee7eb;border-radius:13px;background:#fbfafb;min-width:0';
    el.innerHTML=`<span style="display:block;font-size:9px;color:#817881;text-transform:uppercase;letter-spacing:.08em">${label}</span><strong style="display:block;margin-top:5px;font-size:22px;color:#261c22">${value}</strong>${sub?`<small style="display:block;margin-top:3px;color:#8e838a;font-size:9px">${sub}</small>`:''}`;
    return el;
  }
  async function renderMetrics(host){
    host.innerHTML='<p style="font-size:10px;color:#817881">Carregando métricas…</p>';
    try{
      const data=await api(`/api/analytics?days=${period}`);
      const f=data.funnel||{},r=data.rates||{};
      host.innerHTML='';
      const controls=document.createElement('div');controls.style.cssText='display:flex;gap:6px;align-items:center;justify-content:space-between;margin-bottom:10px';
      controls.innerHTML='<strong style="font-size:11px">Funil real</strong>';
      const select=document.createElement('select');select.innerHTML='<option value="7">7 dias</option><option value="30">30 dias</option><option value="60">60 dias</option>';select.value=String(period);select.onchange=()=>{period=Number(select.value);renderMetrics(host)};controls.appendChild(select);host.appendChild(controls);
      const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px';
      grid.append(metric('Visitas',f.visits||0),metric('Chegaram aos resultados',f.results||0,`${r.resultsFromVisits||0}% das visitas`),metric('Chegaram à oferta',f.offer||0,`${r.offerFromVisits||0}% das visitas`),metric('Cliques no checkout',f.checkout||0,`${r.checkoutFromOffer||0}% da oferta`),metric('Pós-compra',f.thankyou||0,`${r.thankyouFromCheckout||0}% dos cliques`),metric('WhatsApp',data.totals?.whatsapp_click||0));
      host.appendChild(grid);
      if(data.sources?.length){const p=document.createElement('p');p.style.cssText='margin:10px 0 0;font-size:9px;color:#817881';p.textContent='Principais origens: '+data.sources.slice(0,4).map(([k,v])=>`${k} (${v})`).join(' · ');host.appendChild(p)}
      if(data.labels?.length){const p=document.createElement('p');p.style.cssText='margin:5px 0 0;font-size:9px;color:#817881';p.textContent='Links/campanhas: '+data.labels.slice(0,4).map(([k,v])=>`${k} (${v})`).join(' · ');host.appendChild(p)}
    }catch(error){host.innerHTML=`<p style="font-size:10px;color:#a33">${error.message}</p>`}
  }

  function render(force=false){
    if(!isGeneral()||!loaded)return;
    const old=document.querySelector('#growthSuite');if(old&&!force)return;old?.remove();
    const suite=document.createElement('div');suite.id='growthSuite';suite.style.cssText='display:grid;gap:12px';

    const metrics=card('Crescimento & Funil','Mede comportamento do site sem coletar nome ou e-mail. A página pós-compra funciona como confirmação apenas quando a Kiwify redirecionar para ela.');
    const metricsHost=document.createElement('div');metrics.appendChild(metricsHost);suite.appendChild(metrics);renderMetrics(metricsHost);

    const experience=card('Experiência premium','Mantém a mesma identidade no computador e celular e controla os efeitos cinematográficos/microinterações.');
    const expOn=toggle('Ativar camada premium',state.premiumExperience.enabled);experience.appendChild(expOn.row);
    const micro=toggle('Microinterações e movimentos discretos',state.premiumExperience.microInteractions);experience.appendChild(micro.row);
    const cinematic=toggle('Hero cinematográfico e glow vivo',state.premiumExperience.cinematicHero);experience.appendChild(cinematic.row);
    const analytics=toggle('Registrar funil e profundidade de scroll',state.analytics.enabled);experience.appendChild(analytics.row);
    expOn.input.onchange=()=>{state.premiumExperience.enabled=expOn.input.checked;schedule()};micro.input.onchange=()=>{state.premiumExperience.microInteractions=micro.input.checked;schedule()};cinematic.input.onchange=()=>{state.premiumExperience.cinematicHero=cinematic.input.checked;schedule()};analytics.input.onchange=()=>{state.analytics.enabled=analytics.input.checked;schedule()};suite.appendChild(experience);

    const campaign=card('Campanha programada','Só aparece entre as datas definidas. O contador só funciona quando houver uma data final real e futura.');
    const cOn=toggle('Ativar campanha',state.campaign.enabled);campaign.appendChild(cOn.row);
    const badge=field('Selo','text',state.campaign.badge),title=field('Título','text',state.campaign.title),message=textarea('Mensagem',state.campaign.message),start=field('Início','datetime-local',toLocal(state.campaign.startsAt)),end=field('Fim','datetime-local',toLocal(state.campaign.endsAt)),countdown=toggle('Mostrar contador regressivo real',state.campaign.countdownEnabled),ctaLabel=field('Texto do botão','text',state.campaign.ctaLabel),ctaTarget=field('Destino do botão','text',state.campaign.ctaTarget);
    [badge.wrap,title.wrap,message.wrap,start.wrap,end.wrap,countdown.row,ctaLabel.wrap,ctaTarget.wrap].forEach(el=>campaign.appendChild(el));
    cOn.input.onchange=()=>{state.campaign.enabled=cOn.input.checked;schedule()};badge.input.oninput=()=>{state.campaign.badge=badge.input.value;schedule()};title.input.oninput=()=>{state.campaign.title=title.input.value;schedule()};message.input.oninput=()=>{state.campaign.message=message.input.value;schedule()};start.input.onchange=()=>{state.campaign.startsAt=fromLocal(start.input.value);schedule()};end.input.onchange=()=>{state.campaign.endsAt=fromLocal(end.input.value);schedule()};countdown.input.onchange=()=>{state.campaign.countdownEnabled=countdown.input.checked;schedule()};ctaLabel.input.oninput=()=>{state.campaign.ctaLabel=ctaLabel.input.value;schedule()};ctaTarget.input.oninput=()=>{state.campaign.ctaTarget=ctaTarget.input.value;schedule()};suite.appendChild(campaign);

    const thank=card('Página pós-compra','Página pronta em /obrigado.html. Configure esse endereço como redirecionamento pós-compra na Kiwify quando quiser usar a etapa final do funil.');
    const tyTitle=field('Título', 'text', state.thankYou.title),tySub=field('Subtítulo','text',state.thankYou.subtitle),tyText=textarea('Texto',state.thankYou.text),accessLabel=field('Texto do acesso','text',state.thankYou.accessLabel),accessUrl=field('URL de acesso ao curso','url',state.thankYou.accessUrl),supportLabel=field('Texto do suporte','text',state.thankYou.supportLabel),supportUrl=field('URL de suporte/WhatsApp','url',state.thankYou.supportUrl);
    [tyTitle.wrap,tySub.wrap,tyText.wrap,accessLabel.wrap,accessUrl.wrap,supportLabel.wrap,supportUrl.wrap].forEach(el=>thank.appendChild(el));
    [[tyTitle,'title'],[tySub,'subtitle'],[tyText,'text'],[accessLabel,'accessLabel'],[accessUrl,'accessUrl'],[supportLabel,'supportLabel'],[supportUrl,'supportUrl']].forEach(([obj,key])=>obj.input.oninput=()=>{state.thankYou[key]=obj.input.value;schedule()});
    const open=document.createElement('a');open.href='/obrigado.html';open.target='_blank';open.className='btn quiet';open.textContent='Abrir página pós-compra';open.style.marginTop='4px';thank.appendChild(open);suite.appendChild(thank);

    editorBox.prepend(suite);
  }

  const refresh=()=>{if(!loaded)load().then(()=>render(true)).catch(e=>toast(e.message));else render()};
  new MutationObserver(refresh).observe(editorBox,{childList:true,subtree:true});
  const title=document.querySelector('#sectorTitle');if(title)new MutationObserver(refresh).observe(title,{childList:true,subtree:true,characterData:true});
  preview.addEventListener('load',()=>setTimeout(applyPreview,350));
  document.querySelector('#saveBtn')?.addEventListener('click',()=>setTimeout(()=>persist(false),180));
  setTimeout(refresh,550);
})();
