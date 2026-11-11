(()=>{
'use strict';
if(window.__OBRIX_REL_FOTO)return;window.__OBRIX_REL_FOTO=true;
const BUCKET='relatorio-fotografico',PAGE=24,esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const dataBR=v=>{if(!v)return'—';const p=String(v).slice(0,10).split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v};
function obras(){try{return window.obras||[]}catch(_){return[]}}
function modal(html){const b=document.createElement('div');b.className='modalBack obrix-rf-back';b.innerHTML=`<div class="modal obrix-rf-modal"><div class="obrix-rf-head"><h2>Relatório fotográfico</h2><button class="obrix-rf-x">×</button></div>${html}</div>`;document.body.appendChild(b);const fechar=()=>{b.querySelector('.obrix-rf-lista')?.__obrixThumbObserver?.disconnect?.();b.remove()};b.querySelector('.obrix-rf-x').onclick=fechar;b.onclick=e=>{if(e.target===b)fechar()};return b}
async function comprimir(file){if(file.size<=1800000)return file;return new Promise((ok,fail)=>{const img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{try{const max=1920,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(blob=>{URL.revokeObjectURL(u);blob?ok(new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'})):fail(new Error('Falha ao comprimir foto.'))},'image/jpeg',.82)}catch(e){URL.revokeObjectURL(u);fail(e)}};img.onerror=()=>{URL.revokeObjectURL(u);fail(new Error('Foto inválida.'))};img.src=u})}
async function listar(obraId,page=0,filtros={}){
 const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),ini=page*PAGE,fim=ini+PAGE;
 let q=sb.from('relatorio_fotos').select('id,obra_id,checklist_id,storage_path,nome_arquivo,descricao,data_foto,tamanho_bytes,criado_em',{count:'exact'}).eq('empresa_id',p.empresa_id).eq('obra_id',obraId);
 const termo=String(filtros.texto||'').trim().replace(/[*,().%"\\]/g,' ').replace(/\s+/g,' ').slice(0,100);
 if(termo)q=q.or('descricao.ilike.*'+termo+'*,nome_arquivo.ilike.*'+termo+'*');
 if(filtros.data)q=q.eq('data_foto',filtros.data);
 if(filtros.etapa==='sem')q=q.is('checklist_id',null);
 else if(/^[0-9a-f-]{36}$/i.test(String(filtros.etapa||'')))q=q.eq('checklist_id',filtros.etapa);
 const r=await q.order('data_foto',{ascending:false}).order('criado_em',{ascending:false}).range(ini,fim);
 if(r.error)throw r.error;
 const rows=r.data||[];
 return{rows,hasMore:rows.length>PAGE,total:r.count||0}
}
async function checklists(obraId){const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),r=await sb.from('checklist_itens').select('id,nome,ordem').eq('empresa_id',p.empresa_id).eq('obra_id',obraId).order('ordem');if(r.error)throw r.error;return r.data||[]}
async function thumb(path){const sb=await OBRIX_BACKEND.init(),r=await sb.storage.from(BUCKET).createSignedUrl(path,900,{transform:{width:420,height:315,resize:'contain'}});if(r.error)throw r.error;return r.data.signedUrl}
// No máximo quatro URLs assinadas simultaneamente, preservando a rolagem.
const filaMiniaturas=[];let miniaturasAtivas=0;
function drenarMiniaturas(){
  while(miniaturasAtivas<4&&filaMiniaturas.length){
    const item=filaMiniaturas.shift();
    if(!item.box.isConnected){item.reject(new Error('Miniatura fechada'));continue}
    miniaturasAtivas++;
    void thumb(item.path).then(item.resolve,item.reject).finally(()=>{
      miniaturasAtivas--;drenarMiniaturas();
    });
  }
}
function thumbLimitada(path,box){
  return new Promise((resolve,reject)=>{
    filaMiniaturas.push({path,box,resolve,reject});
    drenarMiniaturas();
  });
}
function ativarThumbs(area){
  const carregar=async box=>{
    if(box.dataset.loaded||!box.isConnected)return;
    box.dataset.loaded='1';
    try{
      const url=await thumbLimitada(box.dataset.path,box);
      if(box.isConnected&&area.contains(box))
        box.innerHTML=`<img loading="lazy" decoding="async" src="${esc(url)}" alt="Foto da obra">`;
    }catch(_){if(box.isConnected&&area.contains(box))box.textContent='Imagem indisponível'}
  };
  if(!('IntersectionObserver'in window)){
    area.querySelectorAll('.obrix-rf-img:not([data-loaded])').forEach(carregar);
    return;
  }
  let io=area.__obrixThumbObserver;
  if(!io){
    io=new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting){io.unobserve(e.target);carregar(e.target)}
    }),{rootMargin:'120px'});
    area.__obrixThumbObserver=io;
  }
  area.querySelectorAll('.obrix-rf-img:not([data-loaded])').forEach(box=>io.observe(box));
}
function ligarCards(back,obraId,area){area.querySelectorAll('.obrix-rf-card').forEach(card=>{const a=card.querySelector('.obrix-rf-abrir'),d=card.querySelector('.obrix-rf-excluir');if(a&&!a.dataset.on){a.dataset.on='1';a.onclick=async()=>{const sb=await OBRIX_BACKEND.init(),r=await sb.storage.from(BUCKET).createSignedUrl(card.dataset.path,300);if(r.error)return alert(r.error.message);window.open(r.data.signedUrl,'_blank')}}if(d&&!d.dataset.on){d.dataset.on='1';d.onclick=()=>excluir(back,obraId,card.dataset.id,card.dataset.path)}})}
function htmlCards(rows){return rows.map(x=>`<article class="obrix-rf-card" data-id="${x.id}" data-path="${esc(x.storage_path)}"><div class="obrix-rf-img" data-path="${esc(x.storage_path)}">Carregando...</div><div><b>${dataBR(x.data_foto)}</b><p>${esc(x.descricao||'Sem descrição')}</p><button type="button" class="obrix-rf-abrir">Abrir foto</button><button type="button" class="obrix-rf-excluir">Excluir</button></div></article>`).join('')}
async function renderLista(back,obraId,page=0,append=false){
 const area=back.querySelector('.obrix-rf-lista'),mais=back.querySelector('.obrix-rf-mais'),contador=back.querySelector('.obrix-rf-contador');
 const seq=String(Number(back.dataset.rfBuscaSeq||0)+1);back.dataset.rfBuscaSeq=seq;
 const filtros={texto:back.querySelector('.obrix-rf-busca')?.value||'',data:back.querySelector('.obrix-rf-filtro-data')?.value||'',etapa:back.querySelector('.obrix-rf-filtro-etapa')?.value||''};
 const ativo=()=>back.isConnected&&back.dataset.rfBuscaSeq===seq;
 if(!append){area.__obrixThumbObserver?.disconnect?.();area.__obrixThumbObserver=null;area.innerHTML='<p class="muted">Carregando fotos...</p>'}
 if(mais)mais.disabled=true;
 try{
  const{rows,hasMore,total}=await listar(obraId,page,filtros);
  if(!ativo())return;
  const vis=rows.slice(0,PAGE);
  if(contador)contador.textContent='📷 '+total+' foto'+(total===1?'':'s');
  if(!append&&!vis.length){
   area.innerHTML='<div class="obrix-rf-vazio">'+(filtros.texto||filtros.data||filtros.etapa?'Nenhuma foto encontrada para estes filtros.':'Nenhuma foto nesta obra.')+'</div>';
   area.dataset.page='0';if(mais)mais.hidden=true;return
  }
  if(append)area.insertAdjacentHTML('beforeend',htmlCards(vis));else area.innerHTML=htmlCards(vis);
  area.dataset.page=String(page);
  ligarCards(back,obraId,area);ativarThumbs(area);
  if(mais){mais.hidden=!hasMore;mais.disabled=false;mais.textContent='Carregar mais fotos'}
 }catch(e){
  if(!ativo())return;
  if(contador)contador.textContent='📷 — fotos';
  if(!append)area.innerHTML='<div class="status">'+esc(e.message||'Erro ao carregar fotos.')+'</div>';
  if(mais)mais.disabled=false
 }
}
async function excluir(back,obraId,id,path){if(!await window.OBRIX_CONFIRMAR_EXCLUSAO({titulo:'Excluir foto',mensagem:'Excluir esta foto do relatório?',confirmar:'Excluir'}))return;try{const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),r=await sb.from('relatorio_fotos').delete().eq('id',id).eq('empresa_id',p.empresa_id);if(r.error)throw r.error;const s=await sb.storage.from(BUCKET).remove([path]);if(s.error)console.warn(s.error);await renderLista(back,obraId)}catch(e){alert(e.message||'Não foi possível excluir a foto.')}}
async function abrir(obraId){const obra=obras().find(o=>String(o.id)===String(obraId));if(!obra)return alert('Obra não encontrada.');const back=modal(`<p class="muted"><b>${esc(obra.nome||'Obra')}</b></p><div class="obrix-rf-total"><span>Fotos desta obra</span><strong class="obrix-rf-contador">📷 carregando...</strong></div><div class="obrix-rf-form"><label>Adicionar foto</label><div class="obrix-rf-fontes"><button type="button" class="obrix-rf-fonte obrix-rf-camera">📷 Tirar foto</button><button type="button" class="obrix-rf-fonte obrix-rf-galeria">🖼️ Fotos / Google Fotos / Arquivos</button></div><input class="obrix-rf-camera-input" type="file" accept="image/*" capture="environment" hidden><input class="obrix-rf-file" type="file" accept="image/*" hidden><div class="obrix-rf-selecionada muted">Nenhuma foto selecionada.</div><label>Checklist / etapa</label><select class="obrix-rf-check"><option value="">Sem checklist</option></select><label>Data</label><input class="obrix-rf-data" type="date" value="${new Date().toISOString().slice(0,10)}"><label>Descrição</label><input class="obrix-rf-desc" placeholder="Ex.: Alvenaria concluída"><button class="btn obrix-rf-enviar">Adicionar foto</button><div class="obrix-rf-progresso muted"></div></div><h3>Fotos da obra</h3><div class="obrix-rf-filtros"><input type="search" class="obrix-rf-busca" placeholder="Buscar pela descrição ou nome da foto" aria-label="Buscar fotos por descrição ou nome do arquivo" autocomplete="off"><div class="obrix-rf-filtros-linha"><select class="obrix-rf-filtro-etapa" aria-label="Filtrar fotos pela etapa"><option value="">Todas as etapas</option><option value="sem">Sem etapa</option></select><label class="obrix-rf-filtro-dia">Data <input type="date" class="obrix-rf-filtro-data" aria-label="Filtrar fotos pela data"></label><button type="button" class="obrix-rf-limpar">Limpar</button></div></div><div class="obrix-rf-lista"></div><button type="button" class="btn obrix-rf-mais" hidden>Carregar mais fotos</button>`);back.dataset.obraId=String(obraId);window.dispatchEvent(new CustomEvent('obrix:fotos-abertas',{detail:{obraId:String(obraId)}}));try{const cs=await checklists(obraId),sel=back.querySelector('.obrix-rf-check');const opcoes=cs.map(x=>`<option value="${x.id}">${esc(x.nome||'Etapa')}</option>`).join('');sel.innerHTML+=opcoes;back.querySelector('.obrix-rf-filtro-etapa').innerHTML+=opcoes}catch(_){}const cameraInput=back.querySelector('.obrix-rf-camera-input'),fileInput=back.querySelector('.obrix-rf-file'),selecionada=back.querySelector('.obrix-rf-selecionada');back.querySelector('.obrix-rf-camera').onclick=()=>cameraInput.click();back.querySelector('.obrix-rf-galeria').onclick=()=>fileInput.click();let timerBusca=0;const buscarAgora=()=>{clearTimeout(timerBusca);renderLista(back,obraId,0,false)};
back.querySelector('.obrix-rf-busca').addEventListener('input',()=>{clearTimeout(timerBusca);timerBusca=setTimeout(()=>{if(back.isConnected)renderLista(back,obraId,0,false)},300)});
back.querySelector('.obrix-rf-filtro-data').addEventListener('change',buscarAgora);
back.querySelector('.obrix-rf-filtro-etapa').addEventListener('change',buscarAgora);
back.querySelector('.obrix-rf-limpar').onclick=()=>{back.querySelector('.obrix-rf-busca').value='';back.querySelector('.obrix-rf-filtro-data').value='';back.querySelector('.obrix-rf-filtro-etapa').value='';buscarAgora()};
back.querySelector('.obrix-rf-mais').onclick=()=>{const area=back.querySelector('.obrix-rf-lista'),p=Number(area.dataset.page||0)+1;renderLista(back,obraId,p,true)};const marcou=input=>{const f=input.files?.[0];if(f)selecionada.textContent=`Selecionada: ${f.name||'foto'}`};cameraInput.onchange=()=>marcou(cameraInput);fileInput.onchange=()=>marcou(fileInput);back.querySelector('.obrix-rf-enviar').onclick=async()=>{const input=fileInput.files?.[0]?fileInput:cameraInput,file=input.files?.[0];if(!file)return alert('Selecione uma foto ou tire uma foto.');if(!String(file.type||'').startsWith('image/'))return alert('Selecione um arquivo de imagem.');const btn=back.querySelector('.obrix-rf-enviar'),prog=back.querySelector('.obrix-rf-progresso');btn.disabled=true;prog.textContent='Preparando foto...';let path='';try{const f=await comprimir(file);if(f.size>8388608)throw new Error('A foto ficou maior que 8 MB.');const sb=await OBRIX_BACKEND.init(),p=await OBRIX_BACKEND.profile(),ext=f.type==='image/webp'?'webp':f.type==='image/png'?'png':'jpg';path=`${p.empresa_id}/${obraId}/${crypto.randomUUID()}.${ext}`;prog.textContent='Enviando foto...';const up=await sb.storage.from(BUCKET).upload(path,f,{contentType:f.type,cacheControl:'3600',upsert:false});if(up.error)throw up.error;prog.textContent='Salvando no relatório...';const ins=await sb.from('relatorio_fotos').insert({empresa_id:p.empresa_id,obra_id:obraId,checklist_id:back.querySelector('.obrix-rf-check').value||null,storage_path:path,nome_arquivo:f.name,descricao:back.querySelector('.obrix-rf-desc').value.trim()||null,data_foto:back.querySelector('.obrix-rf-data').value,tamanho_bytes:f.size});if(ins.error){await sb.storage.from(BUCKET).remove([path]);throw ins.error}cameraInput.value='';fileInput.value='';selecionada.textContent='Nenhuma foto selecionada.';back.querySelector('.obrix-rf-desc').value='';prog.textContent='Foto adicionada.';await renderLista(back,obraId)}catch(e){prog.textContent='';alert(e.message||'Erro ao enviar foto.')}finally{btn.disabled=false}};renderLista(back,obraId)}
async function recarregar(obraId){const back=document.querySelector(`.obrix-rf-back[data-obra-id="${CSS.escape(String(obraId))}"]`);if(back?.isConnected)await renderLista(back,obraId,0,false)}
function instalar(){document.querySelectorAll('#listaObras .card.item[data-obra-id]').forEach(card=>{if(card.classList.contains('obxModeloFoto'))return;const a=card.querySelector('.actions'),id=card.dataset.obraId;if(!a||!id||a.querySelector('[data-rel-foto]'))return;const b=document.createElement('button');b.type='button';b.dataset.relFoto=id;b.textContent='Relatório fotográfico';a.insertBefore(b,a.firstChild)})}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-rel-foto]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();abrir(b.dataset.relFoto)},true);function init(){const l=document.getElementById('listaObras');if(!l)return setTimeout(init,250);new MutationObserver(()=>requestAnimationFrame(instalar)).observe(l,{childList:true});instalar()}const css=document.createElement('style');css.textContent=`.obrix-rf-modal{width:min(760px,100%);max-height:90vh;overflow:auto}.obrix-rf-head{display:flex;justify-content:space-between;align-items:center}.obrix-rf-head h2{margin:0}.obrix-rf-x{border:0;background:transparent;color:inherit;font-size:30px}.obrix-rf-total{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:12px 0;padding:11px 13px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc;color:#0f172a}.obrix-rf-contador{display:inline-flex;align-items:center;border-radius:999px;padding:7px 11px;background:#0f172a;color:#fff;font-weight:900;white-space:nowrap}.obrix-rf-form{display:grid;gap:6px;padding:12px 0 18px;border-bottom:1px solid #e2e8f0}.obrix-rf-form input,.obrix-rf-form select{width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:10px;background:inherit;color:inherit}.obrix-rf-fontes{display:grid;grid-template-columns:1fr 1fr;gap:8px}.obrix-rf-fonte{border:1px solid #cbd5e1;background:transparent;color:inherit;border-radius:10px;padding:12px 8px;font-weight:800}.obrix-rf-selecionada{font-size:12px;margin:1px 0 5px}.obrix-rf-filtros{display:grid;gap:8px;margin:0 0 12px}.obrix-rf-filtros input,.obrix-rf-filtros select{width:100%;min-width:0;padding:10px;border:1px solid var(--ob-border,#cbd5e1);border-radius:10px;background:var(--ob-surface,#f8fafc);color:var(--ob-text,#0f172a);font:inherit}.obrix-rf-filtros-linha{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:8px;align-items:end}.obrix-rf-filtro-dia{display:grid;gap:2px;font-size:12px;font-weight:700}.obrix-rf-limpar{padding:11px 12px;border:1px solid var(--ob-border,#cbd5e1);border-radius:10px;background:transparent;color:inherit;font-weight:800}.obrix-rf-lista{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.obrix-rf-card{border:1px solid #e2e8f0;border-radius:13px;overflow:hidden}.obrix-rf-img{aspect-ratio:4/3;background:#e2e8f0;display:grid;place-items:center}.obrix-rf-img img{width:100%;height:100%;object-fit:cover}.obrix-rf-card>div:last-child{padding:10px}.obrix-rf-card p{margin:5px 0 10px}.obrix-rf-card button{margin-right:6px;border:1px solid #cbd5e1;background:transparent;color:inherit;border-radius:8px;padding:7px;font-weight:800}.obrix-rf-excluir{color:#b91c1c!important}.obrix-rf-vazio{grid-column:1/-1;padding:20px;text-align:center;border:1px dashed #cbd5e1;border-radius:12px;color:#64748b}.obrix-rf-mais{width:100%;margin-top:12px}@media(max-width:560px){.obrix-rf-filtros-linha{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.obrix-rf-limpar{grid-column:1/-1}.obrix-rf-lista{grid-template-columns:1fr}.obrix-rf-fontes{grid-template-columns:1fr}}`;document.head.appendChild(css);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();window.OBRIX_REL_FOTO={open:abrir,refresh:instalar,reload:recarregar};})();