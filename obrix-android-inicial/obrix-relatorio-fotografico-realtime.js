(()=>{'use strict';if(window.__OBRIX_RF_REALTIME)return;window.__OBRIX_RF_REALTIME=true;
const RF_BUCKET='relatorio-fotografico',RF_CACHE_KEY='obrix_rf_signed_url_cache_v1',RF_THUMB_TTL=21600,RF_SAFETY_MS=60000;const rfMem=new Map(),rfPending=new Map();let rfPersist={};
try{rfPersist=JSON.parse(localStorage.getItem(RF_CACHE_KEY)||'{}')||{}}catch(_){rfPersist={}}
function rfCacheId(path,options){let t='';try{t=JSON.stringify(options?.transform||null)}catch(_){}return String(path||'')+'|'+t}
let rfWriteTimer=null;
function rfPrune(persistir=false){
  const now=Date.now();
  for(const k of Object.keys(rfPersist)){
    const x=rfPersist[k];
    if(!x?.url||Number(x.exp||0)<=now+RF_SAFETY_MS)delete rfPersist[k];
  }
  const keys=Object.keys(rfPersist);
  if(keys.length>350){
    keys.sort((a,b)=>(Number(rfPersist[a]?.exp||0)-Number(rfPersist[b]?.exp||0)));
    for(const k of keys.slice(0,keys.length-350))delete rfPersist[k];
  }
  for(const [k,x] of rfMem){
    if(!x?.url||Number(x.exp||0)<=now+RF_SAFETY_MS)rfMem.delete(k);
  }
  while(rfMem.size>350)rfMem.delete(rfMem.keys().next().value);
  if(persistir)try{localStorage.setItem(RF_CACHE_KEY,JSON.stringify(rfPersist))}catch(_){}
}
function rfFlush(){
  if(rfWriteTimer){clearTimeout(rfWriteTimer);rfWriteTimer=null}
  rfPrune(true);
}
function rfScheduleWrite(){
  if(rfWriteTimer)return;
  // Evita gravar centenas de URLs no localStorage, síncrono, ao abrir fotos.
  rfWriteTimer=setTimeout(()=>{rfWriteTimer=null;rfPrune(true)},1300);
}
function rfGet(key){
  const now=Date.now(),m=rfMem.get(key);
  if(m?.url&&m.exp>now+RF_SAFETY_MS)return m.url;
  const p=rfPersist[key];
  if(p?.url&&Number(p.exp||0)>now+RF_SAFETY_MS){rfMem.set(key,p);return p.url}
  if(p){delete rfPersist[key];rfScheduleWrite()}
  return'';
}
function rfPut(key,url,ttl){
  const item={url,exp:Date.now()+Math.max(120,Number(ttl)||900)*1000};
  rfMem.set(key,item);rfPersist[key]=item;
  if(rfMem.size>350||Object.keys(rfPersist).length>350)rfPrune();
  rfScheduleWrite();
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&rfWriteTimer)rfFlush()});
window.addEventListener('pagehide',()=>{if(rfWriteTimer)rfFlush()});
async function rfPatchStorage(){try{const client=await OBRIX_BACKEND.init(),storage=client?.storage;if(!storage?.from||storage.__obrixRfEgressCache)return;const originalFrom=storage.from.bind(storage);storage.from=function(bucket){const api=originalFrom(bucket);if(String(bucket)!==RF_BUCKET||!api)return api;if(typeof api.createSignedUrl==='function'){const sign=api.createSignedUrl.bind(api);api.createSignedUrl=async function(path,expiresIn,options){const thumb=Number(expiresIn)===900,effective=thumb?RF_THUMB_TTL:Math.max(120,Number(expiresIn)||900),key=rfCacheId(path,options),cached=rfGet(key);if(cached)return{data:{signedUrl:cached},error:null};if(rfPending.has(key))return rfPending.get(key);const job=(async()=>{const r=await sign(path,effective,options);if(!r?.error&&r?.data?.signedUrl)rfPut(key,r.data.signedUrl,effective);return r})();rfPending.set(key,job);try{return await job}finally{if(rfPending.get(key)===job)rfPending.delete(key)}}}if(typeof api.upload==='function'){const upload=api.upload.bind(api);api.upload=function(path,body,options){const next={...(options||{})},ttl=parseInt(next.cacheControl||'0',10)||0;if(ttl<RF_THUMB_TTL)next.cacheControl=String(RF_THUMB_TTL);return upload(path,body,next)}}return api};Object.defineProperty(storage,'__obrixRfEgressCache',{value:true,configurable:false});rfPrune()}catch(e){console.warn('Cache de fotos indisponível',e)}}rfPatchStorage();
let sb=null,canal=null,timer=null,obraAtual=null,assinaturaSeq=0,reconectarTimer=null;
async function atualizar(){
  const modal=document.querySelector('.obrix-rf-back');
  if(!modal||!obraAtual||document.hidden)return;
  clearTimeout(timer);
  const id=obraAtual;
  timer=setTimeout(async()=>{
    if(document.hidden||obraAtual!==id||!document.querySelector('.obrix-rf-back'))return;
    try{await window.OBRIX_REL_FOTO?.reload?.(id)}
    catch(e){console.warn('Fotos: atualização remota indisponível',e)}
  },650);
}
async function assinar(obraId){
  const id=String(obraId||'');
  if(id===obraAtual&&canal)return;
  const seq=++assinaturaSeq;
  obraAtual=id;
  clearTimeout(reconectarTimer);
  try{
    const cliente=sb||await OBRIX_BACKEND.init();
    if(seq!==assinaturaSeq)return;
    sb=cliente;
    const antigo=canal;canal=null;
    if(antigo)try{await cliente.removeChannel(antigo)}catch(_){}
    if(seq!==assinaturaSeq||!id||!navigator.onLine||document.hidden)return;
    const ch=cliente.channel('obrix-rf-obra-'+id+'-'+seq)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'relatorio_fotos',filter:'obra_id=eq.'+id},atualizar)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'relatorio_fotos',filter:'obra_id=eq.'+id},atualizar)
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'relatorio_fotos'},()=>{if(obraAtual===id)atualizar()});
    canal=ch.subscribe(status=>{
      if(canal!==ch)return;
      if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){
        canal=null;
        try{void cliente.removeChannel(ch).catch(()=>{})}catch(_){}
        clearTimeout(reconectarTimer);
        reconectarTimer=setTimeout(()=>{
          if(obraAtual===id&&document.querySelector('.obrix-rf-back')&&!document.hidden&&navigator.onLine)
            void assinar(id);
        },3000);
      }
    });
  }catch(e){console.warn('Fotos: canal indisponível',e)}
}
async function limpar(){
  ++assinaturaSeq;obraAtual=null;
  clearTimeout(timer);clearTimeout(reconectarTimer);
  const antigo=canal;canal=null;
  if(sb&&antigo)try{await sb.removeChannel(antigo)}catch(_){}
}
document.addEventListener('click',e=>{
  const b=e.target.closest?.('[data-rel-foto]');
  if(b?.dataset.relFoto){setTimeout(()=>{if(document.querySelector('.obrix-rf-back'))void assinar(b.dataset.relFoto)},80);return}
  if(e.target.closest?.('.obrix-rf-x')||e.target.classList?.contains('obrix-rf-back'))setTimeout(limpar,0);
},true);
window.addEventListener('obrix:fotos-abertas',e=>{if(e.detail?.obraId)void assinar(e.detail.obraId)});
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&obraAtual&&!canal&&document.querySelector('.obrix-rf-back'))void assinar(obraAtual);
});
window.addEventListener('online',()=>{
  if(obraAtual&&!canal&&document.querySelector('.obrix-rf-back'))void assinar(obraAtual);
});
const css=document.createElement('style');css.textContent='.obrix-rf-total{display:flex!important;align-items:center!important;justify-content:flex-end!important;min-height:0!important;margin:8px 0 12px!important;padding:0!important;border:0!important;background:transparent!important;color:inherit!important}.obrix-rf-total>span{display:none!important}.obrix-rf-contador{margin:0!important;border:1px solid currentColor!important;border-radius:999px!important;padding:7px 12px!important;background:transparent!important;color:inherit!important;font-weight:900!important;font-size:13px!important;opacity:1!important;white-space:nowrap!important}';document.head.appendChild(css);if(!window.__OBRIX_RF_DUP){const s=document.createElement('script');s.src='./obrix-relatorio-fotografico-duplicadas.js?v=20261020dup1';document.head.appendChild(s)}})();
