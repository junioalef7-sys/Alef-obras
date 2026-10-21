(()=>{'use strict';
const KEY='obrix_diario_offline_v1',CACHE='obrix_diario_cache_v1';
const read=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}},write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function queue(){return read(KEY,[])}
function cache(){return read(CACHE,[])}
function saveCache(rows){write(CACHE,Array.isArray(rows)?rows:[])}
function add(payload){const q=queue(),localId='offline-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);q.push({localId,payload:{...payload},createdAt:new Date().toISOString()});write(KEY,q);return localId}
function pendingRows(){return queue().map(x=>({...x.payload,id:x.localId,__offline:true}))}
async function sync(){if(!navigator.onLine||!window.OBRIX_BACKEND||!window.profile)return false;const q=queue();if(!q.length)return true;const sb=await OBRIX_BACKEND.init();const rest=[];for(const item of q){try{const p={...item.payload};delete p.id;const {error}=await sb.from('diarios_obra').upsert(p,{onConflict:'empresa_id,obra_id,data'});if(error)throw error}catch(e){rest.push(item)}}write(KEY,rest);if(!rest.length)window.OBRIX_DIARIO?.load?.().catch(()=>{});return !rest.length}
function installSW(){if('serviceWorker'in navigator)navigator.serviceWorker.register('./obrix-sw.js?v=1').catch(()=>{})}
window.addEventListener('online',()=>sync().catch(()=>{}));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installSW);else installSW();
window.OBRIX_OFFLINE_DIARIO={add,queue,pendingRows,cache,saveCache,sync,isOffline:()=>!navigator.onLine};
})();