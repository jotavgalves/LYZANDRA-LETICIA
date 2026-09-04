(() => {
  const editor=document.querySelector('#sectorEditor');
  if(!editor)return;
  let loading=false;
  function isGeneral(){return /Configurações gerais/i.test(document.querySelector('#sectorTitle')?.textContent||'')}
  function pct(value,total){return total?Math.min(100,Math.round((value/total)*1000)/10):0}
  async function mount(){
    if(!isGeneral()||loading||document.querySelector('#scrollDepthCard'))return;
    const growth=document.querySelector('#growthSuite');if(!growth)return;
    loading=true;
    const card=document.createElement('div');card.id='scrollDepthCard';card.className='general-card';card.innerHTML='<h3 style="margin:0">Profundidade de scroll</h3><p style="margin:2px 0 8px;font-size:10px;color:#817881;line-height:1.55">Mostra até onde as visitas avançam na landing nos últimos 30 dias.</p><div data-scroll-depth-body style="font-size:10px;color:#817881">Carregando…</div>';
    growth.insertBefore(card,growth.children[1]||null);
    try{
      const r=await fetch('/api/analytics?days=30',{cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.error||'Erro ao carregar');
      const total=data.funnel?.visits||data.totals?.page_view||0;
      const rows=[[25,data.totals?.scroll_25||0],[50,data.totals?.scroll_50||0],[75,data.totals?.scroll_75||0],[100,data.totals?.scroll_100||0]];
      const body=card.querySelector('[data-scroll-depth-body]');body.innerHTML='';
      rows.forEach(([mark,value])=>{
        const rate=pct(value,total);const row=document.createElement('div');row.style.cssText='display:grid;grid-template-columns:42px 1fr 44px;gap:8px;align-items:center;margin:8px 0';
        row.innerHTML=`<strong style="font-size:10px;color:#4b4147">${mark}%</strong><div style="height:8px;border-radius:999px;background:#eee8eb;overflow:hidden"><i style="display:block;height:100%;width:${rate}%;border-radius:inherit;background:linear-gradient(90deg,#fa4a98,#f7a4ca)"></i></div><span style="text-align:right;font-size:9px;color:#817881">${rate}%</span>`;
        body.appendChild(row);
      });
    }catch(error){card.querySelector('[data-scroll-depth-body]').textContent=error.message}finally{loading=false}
  }
  new MutationObserver(mount).observe(editor,{childList:true,subtree:true});
  const title=document.querySelector('#sectorTitle');if(title)new MutationObserver(mount).observe(title,{childList:true,subtree:true,characterData:true});
  setTimeout(mount,900);
})();
