(()=>{'use strict';
if(window.__OBRIX_DIARIO_OFFLINE_SAFE)return;window.__OBRIX_DIARIO_OFFLINE_SAFE=true;
const QUEUE='obrix_diario_offline_v4',CACHE='obrix_diario_cache_v3:',BASE='obrix_offline_base_v3';
const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}},write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
function base(){try{return window.OBRIX_OFFLINE_BOOTSTRAP_API?.base?.()||read(BASE,null)}catch{return read(BASE,null)}}
function empresa(){return base()?.profile?.empresa_id||null}
function cacheKey(){const e=empresa();return e?CACHE+e:null}
function cache(){const k=cacheKey();if(!k)return[];const v=read(k,[]);return Array.isArray(v)?v:[]}
function saveCache(rows){const k=cacheKey();return k?write(k,Array.isArray(rows)?rows:[]):false}
function allQueue(){const q=read(QUEUE,[]);return Array.isArray(q)?q:[]}
function mine(){const e=empresa();return e?allQueue().filter(x=>String(x?.payload?.empresa_id||'')===String(e)):[]}
function pendingRows(){return mine().map(x=>({...x.payload,id:x.localId,__offline:true,__conflict:!!x.conflict}))}
function same(a,b){return String(a?.obra_id||'')===String(b?.obra_id||'')&&String(a?.data||'')===String(b?.data||'')}
function merge(rows){const map=new Map((Array.isArray(rows)?rows:[]).map(r=>[String(r.obra_id)+'|'+String(r.data),{...r}]));pendingRows().forEach(r=>map.set(String(r.obra_id)+'|'+String(r.data),r));return [...map.values()]}
function rows(){return merge(cache())}
function add(payload,localId){const e=empresa();if(!e)throw new Error('Conta offline não identificada.');const q=allQueue(),id=localId&&String(localId).startsWith('offline-')?localId:'offline-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),full={...payload,empresa_id:e};let i=q.findIndex(x=>x.localId===id);if(i<0)i=q.findIndex(x=>same(x?.payload,full)&&String(x?.payload?.empresa_id||'')===String(e));const old=i>=0?q[i]:null,item={localId:old?.localId||id,payload:full,createdAt:old?.createdAt||new Date().toISOString(),base_atualizado_em:old?.base_atualizado_em||null,conflict:!!old?.conflict,conflict_remote_at:old?.conflict_remote_at||null,conflict_message:old?.conflict_message||''};if(i>=0)q[i]=item;else q.push(item);write(QUEUE,q);window.dispatchEvent(new CustomEvent('obrix:diario-offline-atualizado'));return item.localId}
function removePending(id){write(QUEUE,allQueue().filter(x=>x.localId!==id));window.dispatchEvent(new CustomEvent('obrix:diario-offline-atualizado'));return true}
function captureBase(){const b=base();if(!b?.profile?.empresa_id)return false;const next={...b,profile:{...b.profile},obras:Array.isArray(window.obras)&&window.obras.length?window.obras:(Array.isArray(b.obras)?b.obras:[]),funcionarios:Array.isArray(window.funcionarios)&&window.funcionarios.length?window.funcionarios:(Array.isArray(b.funcionarios)?b.funcionarios:[]),updatedAt:b.updatedAt||new Date().toISOString()};return write(BASE,next)}
function restoreBase(){const b=base();if(!b?.profile?.empresa_id)return false;try{profile=b.profile}catch{};window.obras=Array.isArray(b.obras)?b.obras:[];window.funcionarios=Array.isArray(b.funcionarios)?b.funcionarios:[];document.getElementById('login')?.classList.add('hidden');document.getElementById('app')?.classList.remove('hidden');document.documentElement.dataset.obrixOffline='1';return true}
function conflicts(){return mine().filter(x=>x?.conflict)}
async function sync(){return false}
function status(){return{online:navigator.onLine,syncing:false,pendentes:mine().length,conflitos:conflicts().length,erro:''}}
window.OBRIX_OFFLINE_DIARIO={add,pendingRows,removePending,cache,saveCache,merge,rows,sync,captureBase,restoreBase,conflicts,status,isOffline:()=>!navigator.onLine};
})();