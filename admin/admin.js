(() => {
  let state={version:1,patches:{},sectionOrder:[],site:{customCss:''}};
  let selected=null, dirty=false;
  const $=s=>document.querySelector(s); const $$=s=>[...document.querySelectorAll(s)];
  const preview=$('#preview');
  const toast=(msg)=>{const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2600)};
  const setDirty=(v=true)=>{dirty=v;const s=$('#saveStatus');s.textContent=v?'Alterações não salvas':'Salvo';s.className='status '+(v?'dirty':'saved'); syncRaw();};
  const clone=o=>JSON.parse(JSON.stringify(o));

  async function api(url,opts={}) { const r=await fetch(url,{...opts,headers:{...(opts.body && !(opts.body instanceof FormData)?{'content-type':'application/json'}:{}),...(opts.headers||{})}}); let d={}; try{d=await r.json()}catch{} if(!r.ok) throw new Error(d.error||`Erro ${r.status}`); return d; }
  async function checkSession(){try{const s=await api('/api/session'); if(s.authenticated) showApp();}catch{}}
  async function showApp(){ $('#loginView').classList.add('hidden'); $('#appView').classList.remove('hidden'); try{state=await api('/api/content');}catch{state={version:1,patches:{},sectionOrder:[],site:{customCss:''}};} syncSiteFields(); preview.src='/?admin-preview=1&t='+Date.now(); }

  $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();$('#loginError').textContent='';try{await api('/api/login',{method:'POST',body:JSON.stringify({password:$('#password').value})});showApp();}catch(err){$('#loginError').textContent=err.message;}});
  $('#logoutBtn').addEventListener('click',async()=>{await api('/api/logout',{method:'POST'}).catch(()=>{});location.reload();});
  $('#saveBtn').addEventListener('click',save);
  $('#reloadBtn').addEventListener('click',()=>preview.src='/?admin-preview=1&t='+Date.now());
  $$('[data-device]').forEach(b=>b.addEventListener('click',()=>{$('#previewShell').className='preview-shell '+b.dataset.device;}));
  $$('.tab').forEach(b=>b.addEventListener('click',()=>{$$('.tab').forEach(x=>x.classList.toggle('active',x===b));$$('.tabpane').forEach(p=>p.classList.toggle('active',p.dataset.pane===b.dataset.tab));}));

  async function save(){try{$('#saveBtn').disabled=true;await api('/api/content',{method:'PUT',body:JSON.stringify(state)});setDirty(false);toast('Alterações salvas.');}catch(e){toast(e.message)}finally{$('#saveBtn').disabled=false}}

  preview.addEventListener('load',()=>{setTimeout(bindPreview,250)});
  function doc(){return preview.contentDocument;}
  function bindPreview(){const d=doc();if(!d)return; injectEditorCss(d); applyStateToPreview(); d.addEventListener('click',e=>{const el=e.target.closest && e.target.closest('[data-edit-id]'); if(!el)return; e.preventDefault();e.stopPropagation();select(el);},true); d.addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();},true); renderSections(); setDirty(dirty);}
  function injectEditorCss(d){let s=d.getElementById('__adminOverlay');if(!s){s=d.createElement('style');s.id='__adminOverlay';s.textContent='[data-edit-id]{cursor:pointer!important}[data-edit-id]:hover{outline:1px dashed #fa4a98!important;outline-offset:2px}.__selectedEditor{outline:3px solid #22d3ee!important;outline-offset:3px!important}';d.head.appendChild(s)}}

  function applyStateToPreview(){const d=doc(); if(!d)return; Object.entries(state.patches||{}).forEach(([id,p])=>applyPatch(d.querySelector(`[data-edit-id="${CSS.escape(id)}"]`),p)); const main=d.querySelector('main'); if(main && state.sectionOrder?.length){const m=new Map([...main.querySelectorAll(':scope > section[data-edit-id]')].map(x=>[x.dataset.editId,x]));state.sectionOrder.forEach(id=>m.get(id)&&main.appendChild(m.get(id)));} let css=d.getElementById('site-custom-css');if(!css){css=d.createElement('style');css.id='site-custom-css';d.head.appendChild(css)}css.textContent=state.site?.customCss||''; if(state.site?.title)d.title=state.site.title;}
  function applyPatch(el,p){if(!el||!p)return;if(typeof p.html==='string')el.innerHTML=p.html;if(typeof p.text==='string')el.textContent=p.text;if(typeof p.className==='string')el.className=p.className;if(typeof p.styleText==='string')el.setAttribute('style',p.styleText);if(p.attrs)Object.entries(p.attrs).forEach(([k,v])=>{if(v===null||v===undefined||v==='')el.removeAttribute(k);else el.setAttribute(k,String(v))});if(p.hidden===true)el.dataset.editorHidden='true';else if(p.hidden===false)delete el.dataset.editorHidden;}

  function select(el){const d=doc();d.querySelectorAll('.__selectedEditor').forEach(x=>x.classList.remove('__selectedEditor'));el.classList.add('__selectedEditor');selected=el;$('#noSelection').classList.add('hidden');$('#inspector').classList.remove('hidden');refreshInspector();}
  function rgbToHex(s){if(!s)return '#000000'; if(s.startsWith('#'))return s.slice(0,7);const m=s.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);if(!m)return '#000000';return '#'+[m[1],m[2],m[3]].map(n=>(+n).toString(16).padStart(2,'0')).join('')}
  function directText(el){return [...el.childNodes].every(n=>n.nodeType===3 || (n.nodeType===1 && n.tagName==='BR'));}
  function refreshInspector(){if(!selected)return;const cs=preview.contentWindow.getComputedStyle(selected);const tag=selected.tagName.toLowerCase();$('#selection').textContent=`${tag} · ${selected.dataset.editId}`;const simple=directText(selected);$('#textField').classList.toggle('hidden',!simple);$('#htmlField').classList.toggle('hidden',simple); if(simple)$('#elText').value=selected.textContent||''; else $('#elHtml').value=selected.innerHTML||'';$('#hrefField').classList.toggle('hidden',tag!=='a');if(tag==='a')$('#elHref').value=selected.getAttribute('href')||'';$('#srcField').classList.toggle('hidden',tag!=='img');$('#altField').classList.toggle('hidden',tag!=='img');if(tag==='img'){ $('#elSrc').value=selected.getAttribute('src')||'';$('#elAlt').value=selected.getAttribute('alt')||'';}$('#elColor').value=cs.color;$('#elColorPicker').value=rgbToHex(cs.color);$('#elBg').value=cs.backgroundColor;$('#elBgPicker').value=rgbToHex(cs.backgroundColor);$('#elFontSize').value=cs.fontSize;$('#elFontWeight').value=cs.fontWeight;$('#elAlign').value=['left','center','right','justify'].includes(cs.textAlign)?cs.textAlign:'';$('#elRadius').value=cs.borderRadius;$('#elVisible').checked=selected.dataset.editorHidden!=='true' && cs.display!=='none';$('#elClasses').value=(selected.className||'').replace(/\b__selectedEditor\b/g,'').replace(/\s+/g,' ').trim();$('#elStyle').value=selected.getAttribute('style')||'';}
  function patchSelected(mutator){if(!selected)return;const id=selected.dataset.editId;state.patches[id]=state.patches[id]||{};mutator(state.patches[id],selected);setDirty(true);}
  $('#elText').addEventListener('input',e=>patchSelected((p,el)=>{el.textContent=e.target.value;p.text=e.target.value;delete p.html;}));
  $('#elHtml').addEventListener('input',e=>patchSelected((p,el)=>{el.innerHTML=e.target.value;p.html=e.target.value;delete p.text;}));
  $('#elHref').addEventListener('input',e=>patchSelected((p,el)=>{el.setAttribute('href',e.target.value);p.attrs={...(p.attrs||{}),href:e.target.value}}));
  $('#elSrc').addEventListener('input',e=>patchSelected((p,el)=>{el.setAttribute('src',e.target.value);p.attrs={...(p.attrs||{}),src:e.target.value}}));
  $('#elAlt').addEventListener('input',e=>patchSelected((p,el)=>{el.setAttribute('alt',e.target.value);p.attrs={...(p.attrs||{}),alt:e.target.value}}));
  function styleInput(sel,prop){$(sel).addEventListener('input',e=>patchSelected((p,el)=>{el.style[prop]=e.target.value;p.styleText=el.getAttribute('style')||'';$('#elStyle').value=p.styleText;}));}
  styleInput('#elColor','color');styleInput('#elBg','backgroundColor');styleInput('#elFontSize','fontSize');styleInput('#elFontWeight','fontWeight');styleInput('#elAlign','textAlign');styleInput('#elRadius','borderRadius');
  $('#elColorPicker').addEventListener('input',e=>{$('#elColor').value=e.target.value;$('#elColor').dispatchEvent(new Event('input'))});
  $('#elBgPicker').addEventListener('input',e=>{$('#elBg').value=e.target.value;$('#elBg').dispatchEvent(new Event('input'))});
  $('#elVisible').addEventListener('change',e=>patchSelected((p,el)=>{p.hidden=!e.target.checked;if(p.hidden)el.dataset.editorHidden='true';else delete el.dataset.editorHidden;renderSections();}));
  $('#elClasses').addEventListener('input',e=>patchSelected((p,el)=>{const clean=e.target.value.replace(/\b__selectedEditor\b/g,'').replace(/\s+/g,' ').trim();el.className=clean+' __selectedEditor';p.className=clean;}));
  $('#elStyle').addEventListener('input',e=>patchSelected((p,el)=>{el.setAttribute('style',e.target.value);p.styleText=e.target.value;}));
  $('#clearElementBtn').addEventListener('click',()=>{if(!selected)return;const id=selected.dataset.editId;delete state.patches[id];setDirty(true);preview.src='/?admin-preview=1&t='+Date.now();});

  $('#uploadBtn').addEventListener('click',async()=>{const file=$('#uploadFile').files[0];if(!file)return toast('Selecione uma imagem.');const fd=new FormData();fd.append('file',file);try{$('#uploadBtn').disabled=true;const d=await api('/api/upload',{method:'POST',body:fd});$('#elSrc').value=d.url;$('#elSrc').dispatchEvent(new Event('input'));toast('Imagem enviada.');}catch(e){toast(e.message)}finally{$('#uploadBtn').disabled=false}});

  function renderSections(){const d=doc();if(!d)return;const box=$('#sections');box.innerHTML='';const secs=[...d.querySelectorAll('main > section[data-edit-id]')];if(!state.sectionOrder?.length)state.sectionOrder=secs.map(s=>s.dataset.editId);secs.forEach((s,i)=>{const title=(s.querySelector('h1,h2,h3')?.textContent||`Seção ${i+1}`).trim().replace(/\s+/g,' ');const row=document.createElement('div');row.className='section-item';row.innerHTML=`<strong title="${title.replace(/"/g,'&quot;')}">${i+1}. ${title}</strong><div class="section-actions"><button class="btn small ghost" data-act="up">↑</button><button class="btn small ghost" data-act="down">↓</button><button class="btn small ghost" data-act="eye">${s.dataset.editorHidden==='true'?'○':'●'}</button></div>`;row.querySelector('strong').addEventListener('click',()=>select(s));row.querySelector('[data-act=up]').onclick=()=>moveSection(s,-1);row.querySelector('[data-act=down]').onclick=()=>moveSection(s,1);row.querySelector('[data-act=eye]').onclick=()=>{select(s);$('#elVisible').checked=s.dataset.editorHidden==='true';$('#elVisible').dispatchEvent(new Event('change'));};box.appendChild(row);});}
  function moveSection(sec,delta){const main=sec.parentElement;const arr=[...main.children].filter(x=>x.matches?.('section[data-edit-id]'));const i=arr.indexOf(sec),j=i+delta;if(i<0||j<0||j>=arr.length)return;if(delta<0)main.insertBefore(sec,arr[j]);else main.insertBefore(arr[j],sec);state.sectionOrder=[...main.querySelectorAll(':scope > section[data-edit-id]')].map(x=>x.dataset.editId);setDirty(true);renderSections();}

  function syncSiteFields(){const s=state.site||{};$('#siteTitle').value=s.title||'';$('#siteDescription').value=s.description||'';$('#customCss').value=s.customCss||'';syncRaw();}
  $('#siteTitle').addEventListener('input',e=>{state.site=state.site||{};state.site.title=e.target.value;const d=doc();if(d)d.title=e.target.value;setDirty(true)});
  $('#siteDescription').addEventListener('input',e=>{state.site=state.site||{};state.site.description=e.target.value;setDirty(true)});
  $('#customCss').addEventListener('input',e=>{state.site=state.site||{};state.site.customCss=e.target.value;const d=doc();if(d){let s=d.getElementById('site-custom-css');if(!s){s=d.createElement('style');s.id='site-custom-css';d.head.appendChild(s)}s.textContent=e.target.value}setDirty(true)});
  function syncRaw(){const r=$('#rawJson');if(document.activeElement!==r)r.value=JSON.stringify(state,null,2)}
  $('#applyJsonBtn').addEventListener('click',()=>{try{state=JSON.parse($('#rawJson').value);setDirty(true);syncSiteFields();preview.src='/?admin-preview=1&t='+Date.now();toast('JSON aplicado.');}catch(e){toast('JSON inválido: '+e.message)}});
  $('#resetAllBtn').addEventListener('click',()=>{if(!confirm('Restaurar todas as personalizações?'))return;state={version:1,patches:{},sectionOrder:[],site:{customCss:''}};setDirty(true);syncSiteFields();preview.src='/?admin-preview=1&t='+Date.now();});
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
  checkSession();
})();
