(() => {
  const clone=v=>JSON.parse(JSON.stringify(v));
  const merge=(base,raw)=>{if(Array.isArray(base))return Array.isArray(raw)?raw:clone(base);if(!base||typeof base!=='object')return raw??base;const out={...base};Object.keys(base).forEach(k=>out[k]=merge(base[k],raw?.[k]));if(raw&&typeof raw==='object')Object.keys(raw).forEach(k=>{if(!(k in out))out[k]=raw[k]});return out};
  const loginView=document.querySelector('#loginView'), adminApp=document.querySelector('#adminApp'), editor=document.querySelector('#editor'), status=document.querySelector('#saveStatus'), preview=document.querySelector('#previewFrame');
  let config=clone(window.BIO_DEFAULT||{}), active='geral', dirty=false;

  async function api(url,opts={}){const headers={...(opts.headers||{})};if(opts.body&&!(opts.body instanceof FormData))headers['content-type']='application/json';const r=await fetch(url,{...opts,headers});let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.error||`Erro ${r.status}`);return data}
  function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.add('hidden'),2500)}
  function mark(){dirty=true;status.textContent='Alterações não salvas';status.className='status dirty';refreshPreview()}
  function field(label,input,hint=''){const w=document.createElement('div');w.className='field';const l=document.createElement('label');l.textContent=label;w.appendChild(l);if(hint){const s=document.createElement('small');s.textContent=hint;w.appendChild(s)}w.appendChild(input);return w}
  function input(value,onInput,type='text'){const el=document.createElement('input');el.type=type;el.value=value??'';el.oninput=()=>{onInput(type==='checkbox'?el.checked:el.value);mark()};return el}
  function textarea(value,onInput){const el=document.createElement('textarea');el.value=value??'';el.oninput=()=>{onInput(el.value);mark()};return el}
  function select(value,options,onChange){const el=document.createElement('select');options.forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;o.selected=v===value;el.appendChild(o)});el.onchange=()=>{onChange(el.value);mark()};return el}
  function check(label,checked,onChange){const row=document.createElement('label');row.className='check';const s=document.createElement('span');s.textContent=label;const el=document.createElement('input');el.type='checkbox';el.checked=!!checked;el.onchange=()=>{onChange(el.checked);mark();render()};row.append(s,el);return row}
  function section(title,desc=''){const s=document.createElement('section');s.className='section';s.innerHTML=`<h2>${title}</h2>${desc?`<p>${desc}</p>`:''}`;return s}
  function row(...els){const r=document.createElement('div');r.className='row';els.forEach(x=>r.appendChild(x));return r}
  function miniButton(label,fn,cls=''){const b=document.createElement('button');b.type='button';b.className=`mini ${cls}`;b.textContent=label;b.onclick=fn;return b}

  async function uploadInto(target,key){const pick=document.createElement('input');pick.type='file';pick.accept='image/*';pick.onchange=async()=>{const file=pick.files?.[0];if(!file)return;const fd=new FormData();fd.append('file',file);try{toast('Enviando imagem…');const r=await api('/api/upload',{method:'POST',body:fd});target[key]=r.url;mark();render();toast('Imagem enviada.')}catch(e){toast(e.message)}};pick.click()}
  function imageField(label,obj,key,hint=''){const wrap=document.createElement('div');wrap.className='field';const l=document.createElement('label');l.textContent=label;wrap.appendChild(l);if(hint){const s=document.createElement('small');s.textContent=hint;wrap.appendChild(s)}const line=document.createElement('div');line.className='upload-line';const i=input(obj[key]||'',v=>obj[key]=v);const b=document.createElement('button');b.type='button';b.textContent='Upload';b.onclick=()=>uploadInto(obj,key);line.append(i,b);wrap.appendChild(line);return wrap}

  function renderGeneral(){
    const s=config.site, sec=section('Identidade da bio','A logo padrão é exatamente a mesma arte usada no favicon principal.');
    sec.append(imageField('Logo',s,'logo','Pode usar /bio/favicon.svg ou enviar outra imagem.'),row(field('Marca',input(s.brand,v=>s.brand=v)),field('Subtítulo da marca',input(s.brandSubtitle,v=>s.brandSubtitle=v))),field('Título da página',input(s.title,v=>s.title=v)),field('Descrição / SEO',textarea(s.description,v=>s.description=v)),field('Frase da Lyzandra',textarea(s.quote,v=>s.quote=v)),row(field('Autor da frase',input(s.quoteAuthor,v=>s.quoteAuthor=v)),field('Linha inferior',input(s.location,v=>s.location=v))),row(field('Termos',input(s.termsUrl,v=>s.termsUrl=v)),field('Privacidade',input(s.privacyUrl,v=>s.privacyUrl=v))));editor.appendChild(sec);
    const tag=section('Chips da formação','Uma linha por item.');tag.append(check('Mostrar chips',config.tags.visible!==false,v=>config.tags.visible=v),field('Título',input(config.tags.title,v=>config.tags.title=v)),field('Itens',textarea((config.tags.items||[]).join('\n'),v=>config.tags.items=v.split(/\r?\n/).map(x=>x.trim()).filter(Boolean))));editor.appendChild(tag);
    const q=section('Redes sociais');q.append(field('Instagram',input(config.socials.instagram,v=>config.socials.instagram=v)),field('WhatsApp',input(config.socials.whatsapp,v=>config.socials.whatsapp=v),'Use o link completo wa.me.'),field('Site',input(config.socials.website,v=>config.socials.website=v)));editor.appendChild(q)
  }

  function renderImages(){
    const sec=section('Carrossel de imagens','Cada slide tem imagem própria, posição de enquadramento e texto. Imagens podem ser enviadas direto para o KV.');
    sec.append(check('Autoplay',config.carousel.autoplay!==false,v=>config.carousel.autoplay=v),field('Intervalo (ms)',input(config.carousel.intervalMs,v=>config.carousel.intervalMs=Math.max(2500,Number(v)||4800),'number')));
    (config.carousel.slides||[]).forEach((item,index)=>{
      const card=document.createElement('div');card.className='item';const head=document.createElement('div');head.className='item-head';head.innerHTML=`<strong>Imagem ${index+1}</strong>`;const acts=document.createElement('div');acts.className='mini-actions';acts.append(miniButton('↑',()=>{if(index){[config.carousel.slides[index-1],config.carousel.slides[index]]=[config.carousel.slides[index],config.carousel.slides[index-1]];mark();render()}}),miniButton('↓',()=>{if(index<config.carousel.slides.length-1){[config.carousel.slides[index+1],config.carousel.slides[index]]=[config.carousel.slides[index],config.carousel.slides[index+1]];mark();render()}}),miniButton('Excluir',()=>{config.carousel.slides.splice(index,1);mark();render()},'danger'));head.appendChild(acts);card.append(head,check('Mostrar slide',item.visible!==false,v=>item.visible=v),imageField('Imagem',item,'image'),field('Posição / enquadramento',input(item.position||'center',v=>item.position=v),'Ex.: center, center 25%, 40% 20%.'),field('Selo',input(item.eyebrow,v=>item.eyebrow=v)),field('Título',input(item.title,v=>item.title=v)),field('Palavra destacada',input(item.highlight,v=>item.highlight=v)),field('Subtítulo',textarea(item.subtitle,v=>item.subtitle=v)));sec.appendChild(card)
    });
    const add=document.createElement('button');add.type='button';add.className='btn soft';add.textContent='+ Adicionar imagem';add.onclick=()=>{config.carousel.slides.push({visible:true,image:'',position:'center',eyebrow:'',title:'',highlight:'',subtitle:''});mark();render()};sec.appendChild(add);editor.appendChild(sec)
  }

  const iconOptions=[['bag','Compra'],['video','Vídeo / curso'],['chart','Resultados'],['certificate','Certificado'],['user','Pessoa'],['whatsapp','WhatsApp'],['instagram','Instagram'],['globe','Site']];
  function renderLinks(){
    const f=config.featured, top=section('CTA principal');top.append(check('Mostrar CTA principal',f.visible!==false,v=>f.visible=v),row(field('Ícone',select(f.icon||'bag',iconOptions,v=>f.icon=v)),field('Título',input(f.title,v=>f.title=v))),field('Subtítulo',input(f.subtitle,v=>f.subtitle=v)),field('URL',input(f.url,v=>f.url=v)));editor.appendChild(top);
    const sec=section('Lista de acessos','Edite, reorganize ou crie quantos botões quiser.');
    (config.links||[]).forEach((item,index)=>{const card=document.createElement('div');card.className='item';const h=document.createElement('div');h.className='item-head';h.innerHTML=`<strong>Botão ${index+1}</strong>`;const a=document.createElement('div');a.className='mini-actions';a.append(miniButton('↑',()=>{if(index){[config.links[index-1],config.links[index]]=[config.links[index],config.links[index-1]];mark();render()}}),miniButton('↓',()=>{if(index<config.links.length-1){[config.links[index+1],config.links[index]]=[config.links[index],config.links[index+1]];mark();render()}}),miniButton('Excluir',()=>{config.links.splice(index,1);mark();render()},'danger'));h.appendChild(a);card.append(h,check('Mostrar',item.visible!==false,v=>item.visible=v),row(field('Ícone',select(item.icon||'globe',iconOptions,v=>item.icon=v)),field('Título',input(item.label,v=>item.label=v))),field('Descrição',input(item.detail,v=>item.detail=v)),field('URL',input(item.url,v=>item.url=v)));sec.appendChild(card)});
    const add=document.createElement('button');add.type='button';add.className='btn soft';add.textContent='+ Adicionar botão';add.onclick=()=>{config.links.push({visible:true,icon:'globe',label:'Novo acesso',detail:'',url:''});mark();render()};sec.appendChild(add);editor.appendChild(sec)
  }

  function renderMarketing(){
    const sec=section('Meta Pixel','Fica desligado até o ID ser preenchido e a opção ativada.');sec.append(check('Ativar Meta Pixel',config.marketing.metaPixel.enabled===true,v=>config.marketing.metaPixel.enabled=v),field('Pixel ID',input(config.marketing.metaPixel.id,v=>config.marketing.metaPixel.id=v),'Ex.: 123456789012345'));editor.appendChild(sec);
    const ga=section('Google Analytics 4');ga.append(check('Ativar GA4',config.marketing.ga4.enabled===true,v=>config.marketing.ga4.enabled=v),field('Measurement ID',input(config.marketing.ga4.id,v=>config.marketing.ga4.id=v),'Ex.: G-XXXXXXXXXX'));editor.appendChild(ga);
    const gtm=section('Google Tag Manager');gtm.append(check('Ativar GTM',config.marketing.gtm.enabled===true,v=>config.marketing.gtm.enabled=v),field('Container ID',input(config.marketing.gtm.id,v=>config.marketing.gtm.id=v),'Ex.: GTM-XXXXXXX'));editor.appendChild(gtm);
    const tr=section('Eventos');tr.append(check('Rastrear cliques dos botões',config.marketing.trackClicks!==false,v=>config.marketing.trackClicks=v));editor.appendChild(tr)
  }

  function renderVisual(){const t=config.theme,sec=section('Cores','O painel altera apenas a bio, sem interferir no site principal.');sec.append(row(field('Fundo',input(t.background,v=>t.background=v,'color')),field('Fundo secundário',input(t.backgroundSoft,v=>t.backgroundSoft=v,'color'))),row(field('Rosa principal',input(t.primary,v=>t.primary=v,'color')),field('Rosa claro',input(t.primarySoft,v=>t.primarySoft=v,'color'))),row(field('Texto',input(t.text,v=>t.text=v,'color')),field('Texto secundário',input(t.muted,v=>t.muted=v,'color'))));editor.appendChild(sec)}

  function render(){editor.innerHTML='';document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===active));({geral:renderGeneral,imagens:renderImages,links:renderLinks,marketing:renderMarketing,visual:renderVisual}[active]||renderGeneral)()}
  function refreshPreview(){clearTimeout(refreshPreview.t);refreshPreview.t=setTimeout(()=>{try{preview.contentWindow.BIO_ADMIN_PREVIEW=clone(config);preview.contentWindow.location.reload()}catch{}},650)}

  async function load(){const session=await api('/api/session');if(!session.authenticated){loginView.classList.remove('hidden');return}loginView.classList.add('hidden');adminApp.classList.remove('hidden');const data=await api('/api/bio-content');config=merge(config,data);dirty=false;status.textContent='Carregado';status.className='status saved';render()}
  async function save(){try{document.querySelector('#saveBtn').disabled=true;await api('/api/bio-content',{method:'PUT',body:JSON.stringify(config)});dirty=false;status.textContent='Salvo';status.className='status saved';toast('Bio salva.');preview.src='../?admin-preview=1&t='+Date.now()}catch(e){toast(e.message)}finally{document.querySelector('#saveBtn').disabled=false}}

  document.querySelector('#loginForm').onsubmit=async e=>{e.preventDefault();const err=document.querySelector('#loginError');err.textContent='';try{await api('/api/login',{method:'POST',body:JSON.stringify({password:document.querySelector('#password').value})});await load()}catch(x){err.textContent=x.message}};
  document.querySelector('#tabs').onclick=e=>{const b=e.target.closest('[data-tab]');if(!b)return;active=b.dataset.tab;render()};
  document.querySelector('#saveBtn').onclick=save;
  document.querySelector('#openBio').onclick=()=>window.open('../','_blank','noopener');
  window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save()}});
  load().catch(e=>{document.querySelector('#loginError').textContent=e.message});
})();
