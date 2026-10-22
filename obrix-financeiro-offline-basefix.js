(()=>{
'use strict';
if(window.__OBRIX_FIN_OFFLINE_BASEFIX)return;window.__OBRIX_FIN_OFFLINE_BASEFIX=true;
const BASE_KEY='obrix_offline_base_v3',PREFIX='obrix_financeiro_cache_v1:';
const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const ts=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:0};
function sync(){
  const b=read(BASE_KEY,null),eid=b?.profile?.empresa_id;if(!eid)return false;
  const k=PREFIX+eid,c=read(k,{financeiro:[],extras:[],checklists:[],savedAt:null});
  const baseAt=ts(b.updatedAt),cacheAt=ts(c?.savedAt);
  const temFinanceiro=Array.isArray(b.financeiro),temExtras=Array.isArray(b.extras);
  if(!temFinanceiro&&!temExtras)return false;
  if(cacheAt>baseAt&&Array.isArray(c?.financeiro)&&c.financeiro.length)return false;
  const next={
    financeiro:temFinanceiro?b.financeiro:(Array.isArray(c?.financeiro)?c.financeiro:[]),
    extras:temExtras?b.extras:(Array.isArray(c?.extras)?c.extras:[]),
    checklists:Array.isArray(c?.checklists)?c.checklists:[],
    savedAt:b.updatedAt||new Date().toISOString()
  };
  const ok=write(k,next);
  if(ok)window.dispatchEvent(new CustomEvent('obrix:financeiro-offline-atualizado',{detail:{source:'base'}}));
  return ok;
}
window.addEventListener('obrix:offline-base-atualizada',()=>setTimeout(sync,0));
window.addEventListener('obrix:offline-core-restaurado',()=>setTimeout(sync,0));
window.addEventListener('pageshow',()=>setTimeout(sync,50));
setTimeout(sync,50);
window.OBRIX_FIN_OFFLINE_BASEFIX={sync};
})();
