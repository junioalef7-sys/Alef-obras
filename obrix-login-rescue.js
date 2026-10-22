(()=>{'use strict';
if(window.__OBRIX_LOGIN_RESCUE)return;window.__OBRIX_LOGIN_RESCUE=true;
const $=id=>document.getElementById(id);let running=false,lastAttempt=0,unsub=null;
function visible(){const l=$('login'),a=$('app');return !!(l&&!l.classList.contains('hidden')&&a?.classList.contains('hidden'))}
function timeout(p,ms,msg){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error(msg||'Tempo esgotado.')),ms))])}
function info(text){const box=$('erro');if(!box||!text)return;box.textContent=text;box.classList.remove('hidden')}
async function recover(reason='watchdog'){
  if(running||!visible()||!navigator.onLine||!window.OBRIX_BACKEND)return false;
  const now=Date.now();if(now-lastAttempt<1200)return false;lastAttempt=now;running=true;
  try{
    const sb=await timeout(window.OBRIX_BACKEND.init(),8000,'Não foi possível iniciar a conexão.');
    const {data,error}=await timeout(sb.auth.getSession(),8000,'Não foi possível conferir sua sessão.');
    if(error)throw error;
    if(!data?.session)return false;
    const box=$('erro');if(box){box.textContent='Sessão reconhecida. Carregando o OBRIX...';box.classList.remove('hidden')}
    if(typeof window.carregar==='function'){
      const ok=await timeout(Promise.resolve(window.carregar()),20000,'A sessão entrou, mas os dados demoraram para carregar.');
      if(ok||!visible()){box?.classList.add('hidden');return true}
    }
    if(!visible())return true;
    return false;
  }catch(e){console.warn('OBRIX login rescue',reason,e);return false}
  finally{running=false}
}
async function installAuthListener(){
  try{
    const sb=await timeout(window.OBRIX_BACKEND.init(),8000);
    const sub=sb.auth.onAuthStateChange((event,session)=>{
      if(session&&['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event))setTimeout(()=>recover('auth-'+event),30);
    });
    unsub=sub?.data?.subscription||null;
  }catch(e){console.warn('OBRIX login listener indisponível',e)}
}
function bindButton(){const btn=$('entrar');if(!btn||btn.dataset.obrixRescue==='1')return;btn.dataset.obrixRescue='1';btn.addEventListener('click',()=>setTimeout(()=>recover('after-click'),700),false)}
function boot(){bindButton();installAuthListener();setTimeout(()=>recover('startup'),450);setTimeout(()=>recover('startup-2'),1800)}
new MutationObserver(()=>bindButton()).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',()=>{bindButton();setTimeout(()=>recover('pageshow'),250)});window.addEventListener('online',()=>setTimeout(()=>recover('online'),300));
setInterval(()=>{if(visible())recover('watchdog')},3500);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.OBRIX_LOGIN_RESCUE={recover,status:()=>({running,lastAttempt,active:visible(),listener:!!unsub})};
})();