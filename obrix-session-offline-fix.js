(()=>{'use strict';
if(window.__OBRIX_SESSION_OFFLINE_FIX)return;window.__OBRIX_SESSION_OFFLINE_FIX=true;

const LOCK_KEY='obrix_logout_lock_v1';
const BASE_KEY='obrix_offline_base_v3';
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const limit=(p,ms,msg='Tempo limite de conexão.')=>Promise.race([Promise.resolve(p),sleep(ms).then(()=>{throw new Error(msg)})]);

let nativeDesc=null,nativeInitial=true;
try{
  nativeInitial=!!navigator.onLine;
  let p=navigator;
  while(p&&!nativeDesc){nativeDesc=Object.getOwnPropertyDescriptor(p,'onLine');p=Object.getPrototypeOf(p)}
}catch(_){nativeInitial=true}
const nativeOnline=()=>{try{return nativeDesc?.get?!!nativeDesc.get.call(navigator):nativeInitial}catch(_){return nativeInitial}};
const locked=()=>{try{return localStorage.getItem(LOCK_KEY)==='1'}catch(_){return false}};
const lock=()=>{try{localStorage.setItem(LOCK_KEY,'1')}catch(_){}};
const unlock=()=>{try{localStorage.removeItem(LOCK_KEY)}catch(_){}};
const base=()=>{try{return window.OBRIX_OFFLINE_BOOTSTRAP_API?.base?.()||JSON.parse(localStorage.getItem(BASE_KEY)||'null')}catch(_){return null}};
const netErr=e=>/network|failed to fetch|fetch failed|load failed|networkerror|internet|timeout|tempo.*conex|conex[aã]o.*demor|conectar agora/i.test(String(e?.message||e||''));

function setOnlineOverride(getter){try{Object.defineProperty(navigator,'onLine',{configurable:true,get:getter});return true}catch(_){return false}}
function clearOnlineOverride(){try{delete navigator.onLine}catch(_){}}
function forceOffline(){
  window.__OBRIX_FORCE_OFFLINE=true;
  setOnlineOverride(()=>false);
  try{window.dispatchEvent(new Event('offline'))}catch(_){}
}
function releaseOffline(){
  window.__OBRIX_FORCE_OFFLINE=false;
  clearOnlineOverride();
  try{window.OBRIX_OFFLINE_V2?.deactivate?.()}catch(_){}
}
function holdLoggedOut(){
  if(!locked())return;
  window.__OBRIX_FORCE_OFFLINE=false;
  try{window.OBRIX_OFFLINE_V2?.deactivate?.()}catch(_){}
  setOnlineOverride(()=>true);
  const login=$('login'),app=$('app');
  app?.classList.add('hidden');login?.classList.remove('hidden');
  document.getElementById('menuMain')?.classList.add('hidden');
  document.documentElement.removeAttribute('data-obrix-offline');
  document.documentElement.removeAttribute('data-obrix-offline-boot');
  document.documentElement.removeAttribute('data-obrix-offline-v2');
}
function showError(e){const b=$('erro');if(!b)return;b.textContent=window.OBRIX_PT_ERROR?.(e)||e?.message||String(e||'Não foi possível entrar.');b.classList.remove('hidden')}
function hideError(){$('erro')?.classList.add('hidden')}

async function loadOfflineRoute(){try{await limit(Promise.resolve(window.OBRIX_STARTUP_ROUTER?.offline?.()),9000,'Modo offline demorou para carregar.')}catch(_){}}
async function restoreOffline(reason){
  unlock();forceOffline();
  try{window.OBRIX_OFFLINE_V2?.activate?.()}catch(_){}
  await loadOfflineRoute();
  let ok=false;
  try{ok=!!window.restaurarOfflineCore?.(reason)}catch(_){}
  if(!ok)try{ok=!!window.OBRIX_OFFLINE_BOOTSTRAP_API?.restore?.(reason)}catch(_){}
  if(ok){
    document.documentElement.dataset.obrixOffline='1';
    document.documentElement.dataset.obrixOfflineV2='1';
    setTimeout(()=>{try{window.OBRIX_OFFLINE_V2_LOADER?.start?.(reason)}catch(_){}},0);
  }
  return ok;
}
async function login(){
  const btn=$('entrar');if(!btn||btn.dataset.obrixSessionBusy==='1')return;
  btn.dataset.obrixSessionBusy='1';btn.disabled=true;btn.textContent='Entrando...';hideError();unlock();
  try{
    releaseOffline();
    const b=base(),typed=($('email')?.value||'').trim().toLowerCase(),cached=String(b?.profile?.email||'').trim().toLowerCase();
    if(!nativeOnline()){
      if(!b?.profile?.empresa_id)throw new Error('Modo offline ainda não preparado neste aparelho. Entre uma vez com internet para salvar os dados locais.');
      if(typed&&cached&&typed!==cached)throw new Error('Sem internet, este aparelho só pode abrir a conta salva localmente.');
      if(!await restoreOffline('login-offline-v2'))throw new Error('Não foi possível abrir a base offline salva neste aparelho.');
      return;
    }
    const sb=await limit(window.OBRIX_BACKEND.init(),8000,'Não foi possível iniciar a conexão.');
    const r=await limit(sb.auth.signInWithPassword({email:($('email')?.value||'').trim(),password:$('senha')?.value||''}),12000,'A conexão demorou demais.');
    if(r?.error)throw r.error;
    releaseOffline();unlock();
    const ok=await limit(Promise.resolve(window.carregar?.()),17000,'A conexão demorou demais ao carregar o aplicativo.');
    if(ok===false)throw new Error(($('erro')?.textContent||'Não foi possível carregar o aplicativo.').trim());
    setTimeout(()=>window.OBRIX_OFFLINE_V2?.prepare?.(true),1200);
  }catch(e){
    const b=base();
    if(netErr(e)&&b?.profile?.empresa_id){
      const typed=($('email')?.value||'').trim().toLowerCase(),cached=String(b?.profile?.email||'').trim().toLowerCase();
      if(!typed||!cached||typed===cached){if(await restoreOffline('login-network-fallback-v2'))return}
    }
    showError(e);
  }finally{
    btn.dataset.obrixSessionBusy='0';btn.disabled=false;btn.textContent='Entrar';
  }
}

let leaving=false;
async function logout(){
  if(leaving)return;leaving=true;lock();holdLoggedOut();
  const senha=$('senha');if(senha)senha.value='';
  try{
    const sb=await limit(window.OBRIX_BACKEND?.init?.(),1200);
    await limit(sb?.auth?.signOut?.({scope:'local'}),1800);
  }catch(_){}
  location.reload();
}

function capture(e){
  const target=e.target?.closest?.('#sair,#menuSair,#entrar');if(!target)return;
  if(target.id==='sair'||target.id==='menuSair'){
    e.preventDefault();e.stopImmediatePropagation();logout();return;
  }
  if(target.id==='entrar'){
    e.preventDefault();e.stopImmediatePropagation();login();
  }
}

if(locked())holdLoggedOut();
window.addEventListener('click',capture,true);
window.addEventListener('online',()=>{
  if(window.__OBRIX_FORCE_OFFLINE){
    setOnlineOverride(()=>false);
    try{window.OBRIX_STARTUP_ROUTER?.offline?.()}catch(_){}
    try{window.OBRIX_OFFLINE_V2?.sync?.()}catch(_){}
    return;
  }
});
window.addEventListener('pageshow',()=>{if(locked())holdLoggedOut();else if(window.__OBRIX_FORCE_OFFLINE)setOnlineOverride(()=>false)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(locked())holdLoggedOut();else if(window.__OBRIX_FORCE_OFFLINE)setOnlineOverride(()=>false)}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(locked())holdLoggedOut();else if(window.__OBRIX_FORCE_OFFLINE)setOnlineOverride(()=>false)},{once:true});
else if(locked())holdLoggedOut();

window.OBRIX_LOGOUT=logout;
window.OBRIX_SESSION_OFFLINE_FIX={login,logout,restoreOffline,forceOffline,releaseOffline,locked,nativeOnline};
})();
