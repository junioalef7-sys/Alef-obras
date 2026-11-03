(()=>{
'use strict';
if(window.__OBRIX_BUSCA_FOTOS_OFICIAL)return;window.__OBRIX_BUSCA_FOTOS_OFICIAL=true;
const BUCKET='relatorio-fotografico',PAGE=24,esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const dateBR=x=>{const p=String(x||'').slice(0,10).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:'—'};
const states=new WeakMap();
async function thumbnails(st){
 const boxes=[...st.results.querySelectorAll('.obrix-rf-img:not([data-rf-loaded])')];
 const load=async box=>{if(box.dataset.rfLoaded)return;box.dataset.rfLoaded='1';try{const sb=await OBRIX_BACKEND.init(),r=await sb.storage.from(BUCKET).createSignedUrl(box.dataset.path,900,{transform:{width:420,height:315,resize:'contain'}});if(r.error)throw r.error;if(box.isConnected)box.innerHTML='<img alt="Foto da obra" loading="lazy" decoding="async" src="'+esc(r.data.signedUrl)+'">'}catch(_){if(box.isConnected)box.textContent='Imagem indisponível'}};
 if(!('IntersectionObserver' in window)){boxes.forEach(load);return}
 const io=new IntersectionObserver(xs=>xs.forEach(x=>{if(x.isIntersecting){io.unobserve(x.target);load(x.target)}}),{rootMargin:'250px'});
 boxes.forEach(b=>io.observe(b));
}
async function search(st,page=0,append=false){
 const texto=st.panel.querySelector('.obrix-rf-busca')?.value.trim()||'';
 const etapa=st.panel.querySelector('.obrix-rf-busca-etapa')?.value||'';
 const data=st.panel.querySelector('.obrix-rf-busca-data')?.value||'';
 const enabled=!!(texto||etapa||data),seq=++st.seq;
 st.original.style.display=enabled?'none':'';
 if(st.originalMore)st.originalMore.style.display=enabled?'none':'';
 st.results.style.display=enabled?'grid':'none';st.more.style.display=enabled?'':'none';
 const counter=st.panel.querySelector('.obrix-rf-busca-contador');
 if(!enabled){st.more.hidden=true;st.results.innerHTML='';if(counter)counter.textContent='';return}
 if(!append)st.results.innerHTML='<p class="muted">Buscando fotos...</p>';
 st.more.disabled=true;
 try{
  const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();
  let q=sb.from('relatorio_fotos').select('id,storage_path,descricao,nome_arquivo,data_foto,criado_em',{count:'exact'}).eq('empresa_id',p.empresa_id).eq('obra_id',st.obraId);
  const term=texto.replace(/[*,().%"\\]/g,' ').replace(/\s+/g,' ').slice(0,100);
  if(term)q=q.or('descricao.ilike.*'+term+'*,nome_arquivo.ilike.*'+term+'*');
  if(data)q=q.eq('data_foto',data);
  if(etapa==='sem')q=q.is('checklist_id',null);
  else if(/^[a-f0-9-]{36}$/i.test(etapa))q=q.eq('checklist_id',etapa);
  const r=await q.order('data_foto',{ascending:false}).order('criado_em',{ascending:false}).range(page*PAGE,(page+1)*PAGE-1);
  if(r.error)throw r.error;if(!st.back.isConnected||st.seq!==seq)return;
  const rows=r.data||[],total=r.count||0;
  const html=rows.map(x=>'<article class="obrix-rf-card" data-path="'+esc(x.storage_path)+'"><div class="obrix-rf-img" data-path="'+esc(x.storage_path)+'">Carregando...</div><div><b>'+dateBR(x.data_foto)+'</b><p>'+esc(x.descricao||x.nome_arquivo||'Sem descrição')+'</p><button type="button" class="obrix-rf-abrir">Abrir foto</button></div></article>').join('');
  if(append)st.results.insertAdjacentHTML('beforeend',html);else st.results.innerHTML=html||'<div class="obrix-rf-vazio">Nenhuma foto encontrada.</div>';
  st.page=page;if(counter)counter.textContent=total+' resultado'+(total===1?'':'s');
  st.more.hidden=(page+1)*PAGE>=total;st.more.disabled=false;
  thumbnails(st);
 }catch(e){if(!st.back.isConnected||st.seq!==seq)return;if(!append)st.results.innerHTML='<div class="status">'+esc(e.message||'Erro ao pesquisar fotos.')+'</div>';st.more.hidden=true;st.more.disabled=false}
}
async function loadStages(st){
 try{const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile();const r=await sb.from('checklist_itens').select('id,nome,ordem').eq('empresa_id',p.empresa_id).eq('obra_id',st.obraId).order('ordem');if(r.error||!st.back.isConnected)return;st.panel.querySelector('.obrix-rf-busca-etapa').insertAdjacentHTML('beforeend',(r.data||[]).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.nome||'Etapa')+'</option>').join(''))}catch(_){}}
function install(back){
 if(!back||back.dataset.buscaFotosOficial||!back.dataset.obraId||back.querySelector('.obrix-rf-filtros')||back.querySelector('.obrix-rf-busca'))return;
 const area=back.querySelector('.obrix-rf-lista'),title=[...back.querySelectorAll('h3')].find(x=>(x.textContent||'').toLowerCase().includes('fotos da obra'));
 if(!area||!title)return;
 back.dataset.buscaFotosOficial='1';
 const panel=document.createElement('div');panel.className='obrix-rf-busca-painel';
 panel.innerHTML='<input class="obrix-rf-busca" type="search" placeholder="Buscar por descrição ou nome da foto" aria-label="Buscar fotos" autocomplete="off"><div class="obrix-rf-busca-linha"><select class="obrix-rf-busca-etapa" aria-label="Filtrar por etapa"><option value="">Todas as etapas</option><option value="sem">Sem etapa</option></select><label>Data<input class="obrix-rf-busca-data" type="date" aria-label="Data da foto"></label><button type="button" class="obrix-rf-busca-limpar">Limpar</button></div><small class="obrix-rf-busca-contador"></small>';
 title.insertAdjacentElement('afterend',panel);
 const results=document.createElement('div');results.className='obrix-rf-lista obrix-rf-resultados';results.style.display='none';area.insertAdjacentElement('afterend',results);
 const more=document.createElement('button');more.type='button';more.className='btn obrix-rf-busca-mais';more.textContent='Carregar mais resultados';more.hidden=true;more.style.display='none';results.insertAdjacentElement('afterend',more);
 const st={back,obraId:String(back.dataset.obraId),original:area,originalMore:back.querySelector('.obrix-rf-mais'),panel,results,more,page:0,seq:0};states.set(back,st);
 let debounce;
 panel.querySelector('.obrix-rf-busca').addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(()=>search(st),300)});
 panel.querySelector('.obrix-rf-busca-data').addEventListener('change',()=>search(st));
 panel.querySelector('.obrix-rf-busca-etapa').addEventListener('change',()=>search(st));
 panel.querySelector('.obrix-rf-busca-limpar').addEventListener('click',()=>{clearTimeout(debounce);panel.querySelector('.obrix-rf-busca').value='';panel.querySelector('.obrix-rf-busca-data').value='';panel.querySelector('.obrix-rf-busca-etapa').value='';search(st)});
 more.addEventListener('click',()=>search(st,st.page+1,true));
 results.addEventListener('click',async e=>{const b=e.target.closest('.obrix-rf-abrir'),card=b?.closest('.obrix-rf-card');if(!card)return;try{const sb=await OBRIX_BACKEND.init(),r=await sb.storage.from(BUCKET).createSignedUrl(card.dataset.path,300);if(r.error)throw r.error;window.open(r.data.signedUrl,'_blank')}catch(err){alert(err.message||'Erro ao abrir foto.')}});
 loadStages(st);
}
const observer=new MutationObserver(()=>{const back=document.querySelector('.obrix-rf-back');if(back&&!back.dataset.buscaFotosOficial)install(back)});
if(document.body)observer.observe(document.body,{childList:true,subtree:true});
const already=document.querySelector('.obrix-rf-back');if(already)install(already);
const style=document.createElement('style');style.textContent='.obrix-rf-busca-painel{display:grid;gap:8px;margin:0 0 12px}.obrix-rf-busca-painel input,.obrix-rf-busca-painel select{box-sizing:border-box;min-width:0;width:100%;padding:10px;border:1px solid #64748b;border-radius:10px;background:transparent;color:inherit;font:inherit}.obrix-rf-busca-linha{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:8px;align-items:end}.obrix-rf-busca-linha label{display:grid;gap:2px;font-size:12px;font-weight:700}.obrix-rf-busca-limpar{padding:10px;border:1px solid #64748b;border-radius:10px;background:transparent;color:inherit;font-weight:800}.obrix-rf-busca-contador{opacity:.75}.obrix-rf-busca-mais{width:100%;margin-top:12px}@media(max-width:560px){.obrix-rf-busca-linha{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.obrix-rf-busca-limpar{grid-column:1/-1}}';document.head.appendChild(style);
})();