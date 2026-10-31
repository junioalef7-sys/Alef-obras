(()=>{'use strict';
if(window.__OBRIX_LAZY_EXTRAS_PERF)return;window.__OBRIX_LAZY_EXTRAS_PERF=true;
const done=new Set(),promises=new Map();
const GROUP_EXTRAS={
  equipe:['./obrix-equipe-estoque-fix-v1.js?v=20261022eqest1','./obrix-equipe-realtime-sync.js?v=20261023eqsync2','./obrix-equipe-registros-faltas.js?v=20261031bonusfix1','./obrix-equipe-ajustes-20261023.js?v=20261023equipeajustes2'],
  estoque:['./obrix-equipe-estoque-fix-v1.js?v=20261022eqest1'],
  obras:['./obrix-relatorio-multifoto.js?v=20261019multi1','./obrix-relatorio-grade-miniaturas.js?v=20261019grade1']
};
const FEATURE_EXTRAS={
  orcamentos:['./obrix-orcamentos-ui-v8.js?v=20261022orc-v8single1','./obrix-orcamentos-ux-v10.js?v=20261022orc-ux10','./obrix-orcamentos-obs-edit-v11.js?v=20261022orc-obs11'],
  diario:['./obrix-diario-fotos.js?v=20261019diariofoto1','./obrix-relatorio-diario.js?v=20261024pdf2'],
  offlineSync:['./obrix-offline-prefetch.js?v=20261022audit1']
};
const pathOf=s=>{try{return new URL(s,location.href).pathname}catch{return s}};
function loaded(src){const p=pathOf(src);return [...document.scripts].some(s=>s.src&&pathOf(s.src)===p)}
function loadOne(src){if(loaded(src))return Promise.resolve(true);return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.async=false;s.dataset.obrixLazyExtra='1';let ended=false;const end=ok=>{if(ended)return;ended=true;resolve(ok)};s.onload=()=>end(true);s.onerror=()=>end(false);document.body.appendChild(s);setTimeout(()=>end(false),7000)})}
async function loadList(key,list){if(!list?.length||done.has(key))return true;if(promises.has(key))return promises.get(key);const p=(async()=>{let ok=true;for(const src of list)if(!loaded(src)&&!await loadOne(src))ok=false;if(ok)done.add(key);return ok})();promises.set(key,p);try{return await p}finally{promises.delete(key)}}
async function afterGroup(name){const ok=await loadList('g:'+name,GROUP_EXTRAS[name]);if(name==='equipe'&&ok){window.OBRIX_EQUIPE_REALTIME_SYNC?.start?.();window.OBRIX_EQUIPE_REGISTROS_FALTAS?.refreshButtons?.();window.OBRIX_EQUIPE_AJUSTES_20261023?.apply?.()}return ok}
async function afterFeature(name){return loadList('f:'+name,FEATURE_EXTRAS[name])}
function patch(){const api=window.OBRIX_POS_LOGIN_LOADER;if(!api||api.__obrixLazyExtrasPatched)return false;api.__obrixLazyExtrasPatched=true;const oldGroup=api.loadGroup?.bind(api),oldFeature=api.loadFeature?.bind(api);if(oldGroup)api.loadGroup=async name=>{const ok=await oldGroup(name);if(ok)await afterGroup(name);return ok};if(oldFeature)api.loadFeature=async name=>{const ok=await oldFeature(name);if(ok)await afterFeature(name);return ok};return true}
if(!patch()){let tries=0;const t=setInterval(()=>{if(patch()||++tries>40)clearInterval(t)},100)}
window.addEventListener('obrix:modules-ready',patch);
window.OBRIX_LAZY_EXTRAS={loadGroup:afterGroup,loadFeature:afterFeature,status:()=>({done:[...done]})};
})();