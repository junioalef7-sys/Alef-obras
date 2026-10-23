(()=>{'use strict';
if(window.__OBRIX_OFFLINE_BOOTSTRAP)return;window.__OBRIX_OFFLINE_BOOTSTRAP=true;
const BASE_KEY='obrix_offline_base_v3',OLD_BASE_KEY='obrix_offline_base_v2',IDENTITY_KEY='obrix_offline_identity_v1';
const OBRAS_PREFIX='obrix_obras_cache_v1:',EQUIPE_PREFIX='obrix_equipe_cache_v1:',FIN_PREFIX='obrix_financeiro_cache_v1:';
const NOTAS_PREFIX='obrix_notas_cache_v1:',DIARIO_PREFIX='obrix_diario_cache_v3:',CHECK_PREFIX='obrix_checklist_cache_v1:';
const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
function localSessionIdentity(){
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||'';if(!/^sb-.+-auth-token$/i.test(k))continue;
      const raw=read(k,null);if(!raw)continue;
      const session=raw?.currentSession||raw?.session||raw;
      const user=session?.user||raw?.user||null;
      const email=String(user?.email||'').trim();
      let empresa_id=user?.user_metadata?.empresa_id||user?.app_metadata?.empresa_id||null;
      if(!empresa_id&&session?.access_token){
        try{const p=JSON.parse(atob(String(session.access_token).split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));empresa_id=p?.empresa_id||p?.app_metadata?.empresa_id||p?.user_metadata?.empresa_id||null}catch(_){ }
      }
      if(email||empresa_id)return{email,empresa_id:empresa_id?String(empresa_id):null};
    }
  }catch(_){ }
  return null;
}
function discoverIdentity(){
  try{
    const typed=(document.getElementById('email')?.value||'').trim(),session=localSessionIdentity();
    if(session?.email&&typed&&session.email.toLowerCase()!==typed.toLowerCase())return null;
    if(session?.empresa_id)return{empresa_id:session.empresa_id,email:session.email||typed,nome:session.email||typed,papel:'',updatedAt:new Date().toISOString(),discovered:true,fromSession:true};
    const prefixes=[EQUIPE_PREFIX,OBRAS_PREFIX,FIN_PREFIX,NOTAS_PREFIX,DIARIO_PREFIX,CHECK_PREFIX],ids=new Set();
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||'';
      for(const p of prefixes)if(k.startsWith(p)&&k.length>p.length)ids.add(k.slice(p.length));
    }
    if(ids.size!==1)return null;
    const empresa_id=[...ids][0],email=session?.email||typed;
    return{empresa_id,email,nome:email,papel:'',updatedAt:new Date().toISOString(),discovered:true,fromSession:!!session?.email};
  }catch{return null}
}
function hydrate(raw){
  const b=raw&&typeof raw==='object'?{...raw}:null,eid=b?.profile?.empresa_id;if(!eid)return b;
  const oc=read(OBRAS_PREFIX+eid,[]),ec=read(EQUIPE_PREFIX+eid,{funcionarios:[],diarias:[],faltas:[]}),fc=read(FIN_PREFIX+eid,{financeiro:[],extras:[],checklists:[],savedAt:null});
  const pick=(baseRows,cacheRows)=>Array.isArray(baseRows)&&baseRows.length?baseRows:(Array.isArray(cacheRows)?cacheRows:[]);
  const next={...b,
    obras:pick(b.obras,oc),
    funcionarios:pick(b.funcionarios,ec?.funcionarios),
    financeiro:pick(b.financeiro,fc?.financeiro),
    extras:pick(b.extras,fc?.extras),
    diarias:pick(b.diarias,ec?.diarias),
    vales:Array.isArray(b.vales)?b.vales:[],
    bonus:Array.isArray(b.bonus)?b.bonus:[],
    updatedAt:b.updatedAt||ec?.savedAt||fc?.savedAt||null
  };
  const recovered=(next.obras.length||next.funcionarios.length||next.financeiro.length||next.extras.length||next.diarias.length)>0;
  if(recovered){next.cacheRecovered=true;write(BASE_KEY,next)}
  return next;
}
function base(){
  const saved=read(BASE_KEY,null)||read(OLD_BASE_KEY,null);if(saved?.profile?.empresa_id)return hydrate(saved);
  let i=read(IDENTITY_KEY,null);if(!i?.empresa_id){i=discoverIdentity();if(i?.empresa_id)write(IDENTITY_KEY,i)}
  if(i?.empresa_id){
    const rebuilt=hydrate({profile:{empresa_id:i.empresa_id,nome:i.nome||'',email:i.email||'',papel:i.papel||''},obras:[],funcionarios:[],financeiro:[],extras:[],diarias:[],vales:[],bonus:[],updatedAt:i.updatedAt||null,identityFallback:true,identityDiscovered:!!i.discovered,identityFromSession:!!i.fromSession});
    if(rebuilt?.profile?.empresa_id)write(BASE_KEY,rebuilt);
    return rebuilt;
  }
  return null;
}
function sameAccount(b){const typed=(document.getElementById('email')?.value||'').trim().toLowerCase(),cached=String(b?.profile?.email||'').trim().toLowerCase();return !typed||!cached||typed===cached}
function restore(reason='offline'){
  const b=base();if(!b||!sameAccount(b))return false;
  const login=document.getElementById('login'),app=document.getElementById('app'),usuario=document.getElementById('usuario');
  window.__OBRIX_OFFLINE_BOOTSTRAP_BASE=b;window.obras=Array.isArray(b.obras)?b.obras:[];window.funcionarios=Array.isArray(b.funcionarios)?b.funcionarios:[];window.financeiro=Array.isArray(b.financeiro)?b.financeiro:[];window.extras=Array.isArray(b.extras)?b.extras:[];window.diarias=Array.isArray(b.diarias)?b.diarias:[];window.vales=Array.isArray(b.vales)?b.vales:[];window.bonus=Array.isArray(b.bonus)?b.bonus:[];
  login?.classList.add('hidden');app?.classList.remove('hidden');if(usuario)usuario.textContent=b.profile.nome||b.profile.email||'';
  document.documentElement.dataset.obrixOffline='1';document.documentElement.dataset.obrixOfflineBoot=reason;if(b.identityFallback)document.documentElement.dataset.obrixOfflineIdentityFallback='1';else document.documentElement.removeAttribute('data-obrix-offline-identity-fallback');
  window.dispatchEvent(new CustomEvent('obrix:offline-bootstrap',{detail:{reason,updatedAt:b.updatedAt||null,empresa_id:b.profile.empresa_id,identityFallback:!!b.identityFallback,identityDiscovered:!!b.identityDiscovered,cacheRecovered:!!b.cacheRecovered}}));
  return true;
}
function boot(){if(!navigator.onLine)restore('cold-start')}
window.addEventListener('offline',()=>restore('connection-lost'));
window.addEventListener('online',()=>{document.documentElement.removeAttribute('data-obrix-offline-boot')});
window.addEventListener('pageshow',()=>{if(!navigator.onLine)restore('pageshow')});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!navigator.onLine)restore('resume')});
document.addEventListener('click',e=>{if(e.target.closest?.('#sair,#menuSair')){try{localStorage.removeItem(BASE_KEY);localStorage.removeItem(OLD_BASE_KEY);localStorage.removeItem(IDENTITY_KEY)}catch{}}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
setTimeout(()=>{if(!navigator.onLine)restore('fallback')},800);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./obrix-sw.js?v=20261022-ui-offline-stable3',{updateViaCache:'none'}).then(r=>r.update?.()).catch(()=>{});
window.OBRIX_OFFLINE_BOOTSTRAP_API={restore,base,hydrate,discoverIdentity,status:()=>{const b=base();return{online:navigator.onLine,available:!!b,active:document.documentElement.dataset.obrixOffline==='1',identityFallback:document.documentElement.dataset.obrixOfflineIdentityFallback==='1',obras:b?.obras?.length||0,funcionarios:b?.funcionarios?.length||0,financeiro:b?.financeiro?.length||0}}};
})();