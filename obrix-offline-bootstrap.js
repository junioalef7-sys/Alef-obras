(()=>{'use strict';
if(window.__OBRIX_OFFLINE_BOOTSTRAP)return;window.__OBRIX_OFFLINE_BOOTSTRAP=true;
const BASE_KEY='obrix_offline_base_v3',OLD_BASE_KEY='obrix_offline_base_v2';
const read=(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d}};
function base(){const b=read(BASE_KEY,null)||read(OLD_BASE_KEY,null);return b?.profile?.empresa_id?b:null}
function sameAccount(b){const typed=(document.getElementById('email')?.value||'').trim().toLowerCase(),cached=String(b?.profile?.email||'').trim().toLowerCase();return !typed||!cached||typed===cached}
function restore(reason='offline'){
  const b=base();if(!b||!sameAccount(b))return false;
  const login=document.getElementById('login'),app=document.getElementById('app'),usuario=document.getElementById('usuario');
  window.__OBRIX_OFFLINE_BOOTSTRAP_BASE=b;window.obras=Array.isArray(b.obras)?b.obras:[];window.funcionarios=Array.isArray(b.funcionarios)?b.funcionarios:[];
  login?.classList.add('hidden');app?.classList.remove('hidden');if(usuario)usuario.textContent=b.profile.nome||b.profile.email||'';
  document.documentElement.dataset.obrixOffline='1';document.documentElement.dataset.obrixOfflineBoot=reason;
  window.dispatchEvent(new CustomEvent('obrix:offline-bootstrap',{detail:{reason,updatedAt:b.updatedAt||null,empresa_id:b.profile.empresa_id}}));
  return true;
}
function boot(){if(!navigator.onLine)restore('cold-start')}
window.addEventListener('offline',()=>restore('connection-lost'));
window.addEventListener('online',()=>{document.documentElement.removeAttribute('data-obrix-offline-boot')});
window.addEventListener('pageshow',()=>{if(!navigator.onLine)restore('pageshow')});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!navigator.onLine)restore('resume')});
document.addEventListener('click',e=>{if(e.target.closest?.('#sair,#menuSair')){try{localStorage.removeItem(BASE_KEY);localStorage.removeItem(OLD_BASE_KEY)}catch{}}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
setTimeout(()=>{if(!navigator.onLine)restore('fallback')},800);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./obrix-sw.js?v=14').catch(()=>{});
window.OBRIX_OFFLINE_BOOTSTRAP_API={restore,base,status:()=>({online:navigator.onLine,available:!!base(),active:document.documentElement.dataset.obrixOffline==='1'})};
})();
