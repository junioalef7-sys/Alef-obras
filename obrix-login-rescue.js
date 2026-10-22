(()=>{'use strict';
if(window.__OBRIX_LOGIN_RESCUE_V2)return;window.__OBRIX_LOGIN_RESCUE_V2=true;
const $=id=>document.getElementById(id);let running=false,lastAttempt=0,unsub=null;
function loginVisible(){const l=$('login');return !!(l&&!l.classList.contains('hidden'))}
function timeout(p,ms,msg){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error(msg||'Tempo esgotado.')),ms))])}
function showShell(reason='session'){
  const l=$('login'),a=$('app'),e=$('erro');
  l?.classList.add('hidden');a?.classList.remove('hidden');e?.classList.add('hidden');
  document.documentElement.dataset.obrixSessionReady='1';
  document.documentElement.dataset.obrixSessionReason=reason;
  window.dispatchEvent(new CustomEvent('obrix:session-shell',{detail:{reason,at:new Date().toISOString()}}));
  return !!a;
}
async function startCoreLoad(reason){
  try{
    if(typeof window.carregar==='function'){
      const r=await timeout(Promise.resolve(window.carregar()),22000,'Dados principais demoraram para carregar.');
      return r!==false;
    }
  }catch(e){console.warn('OBRIX login rescue: carga posterior',reason,e)}
  return false;
}
async function recover(reason='watchdog'){
  if(running||!loginVisible()||!navigator.onLine||!window.OBRIX_BACKEND)return false;
  const now=Date.now();if(now-lastAttempt<1000)return false;lastAttempt=now;running=true;
  try{
    const sb=await timeout(window.OBRIX_BACKEND.init(),8000,'Não foi possível iniciar a conexão.');
    const {data,error}=await timeout(sb.auth.getSession(),8000,'Não foi possível conferir sua sessão.');
    if(error)throw error;
    if(!data?.session)return false;
    showShell(reason+'-session');
    void startCoreLoad(reason);
    return true;
  }catch(e){console.warn('OBRIX login rescue',reason,e);return false}
  finally{running=false}
}
async function installAuthListener(){
  try{
    const sb=await timeout(window.OBRIX_BACKEND.init(),8000);
    const sub=sb.auth.onAuthStateChange((event,session)=>{
      if(session&&['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event)){
        showShell('auth-'+event);
        setTimeout(()=>startCoreLoad('auth-'+event),0);
      }
    });
    unsub=sub?.data?.subscription||null;
  }catch(e){console.warn('OBRIX login listener indisponível',e)}
}
function bindButton(){const btn=$('entrar');if(!btn||btn.dataset.obrixRescueV2==='1')return;btn.dataset.obrixRescueV2='1';btn.addEventListener('click',()=>setTimeout(()=>recover('after-click'),350),false)}
function boot(){bindButton();installAuthListener();setTimeout(()=>recover('startup'),250);setTimeout(()=>recover('startup-2'),1200)}
new MutationObserver(()=>bindButton()).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',()=>{bindButton();setTimeout(()=>recover('pageshow'),150)});window.addEventListener('online',()=>setTimeout(()=>recover('online'),200));
setInterval(()=>{if(loginVisible())recover('watchdog')},4000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.OBRIX_LOGIN_RESCUE={recover,showShell,status:()=>({running,lastAttempt,active:loginVisible(),listener:!!unsub,sessionReady:document.documentElement.dataset.obrixSessionReady==='1'})};
})();