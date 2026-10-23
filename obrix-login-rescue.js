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
function recoveryStyle(){
  if(document.getElementById('obrixRecoveryScreenStyle'))return;
  const s=document.createElement('style');s.id='obrixRecoveryScreenStyle';s.textContent=`
  .obrixRecoveryScreen{position:fixed!important;inset:0!important;z-index:2147483600!important;background:#f4f6f8!important;color:#0f172a!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;overflow-y:auto!important;padding:max(20px,env(safe-area-inset-top)) 14px max(20px,env(safe-area-inset-bottom))!important}
  .obrixRecoveryCard{width:min(440px,100%)!important;margin:28px auto!important;background:#fff!important;border:1px solid #e2e8f0!important;border-radius:20px!important;padding:22px!important;box-shadow:0 18px 50px rgba(15,23,42,.14)!important}
  .obrixRecoveryCard h2{margin:0 0 8px!important;font-size:24px!important}.obrixRecoveryCard p{color:#64748b!important;font-size:14px!important;line-height:1.45!important;margin:0 0 18px!important}.obrixRecoveryCard label{display:block!important;font-weight:800!important;margin-bottom:5px!important}.obrixRecoveryCard input{width:100%!important;padding:13px!important;border:1px solid #cbd5e1!important;border-radius:11px!important;font-size:16px!important;margin:0 0 12px!important;background:#fff!important;color:#0f172a!important}.obrixRecoveryActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:9px!important;margin-top:10px!important}.obrixRecoveryActions button{min-height:46px!important;border-radius:11px!important;padding:11px!important;font-weight:900!important}.obrixRecoveryBack{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}.obrixRecoverySend{border:0!important;background:#0f172a!important;color:#fff!important}.obrixRecoveryError{display:none;margin:10px 0 0;padding:11px;border:1px solid #fecaca;border-radius:11px;background:#fff1f2;color:#991b1b;font-weight:800;font-size:13px}.obrixRecoveryError.show{display:block}.obrixRecoverySuccess{padding:13px;border-radius:12px;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-weight:800;line-height:1.4;margin:12px 0}
  .modalBack.obrixAuthScreen,.modalBack.obrixRecoveryUpgraded{position:fixed!important;inset:0!important;z-index:2147483500!important;background:#f4f6f8!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;overflow-y:auto!important;padding:max(20px,env(safe-area-inset-top)) 14px max(20px,env(safe-area-inset-bottom))!important}.modalBack.obrixRecoveryUpgraded>.modal{position:relative!important;inset:auto!important;transform:none!important;width:min(460px,100%)!important;margin:18px auto!important;max-height:none!important;background:#fff!important;border-radius:20px!important;padding:22px!important;box-shadow:0 18px 50px rgba(15,23,42,.14)!important}
  html[data-theme="dark"] .obrixRecoveryScreen,body.dark .obrixRecoveryScreen,html[data-theme="dark"] .modalBack.obrixRecoveryUpgraded,body.dark .modalBack.obrixRecoveryUpgraded{background:#080d13!important;color:#f8fafc!important}.obrixRecoveryCard{transition:none}html[data-theme="dark"] .obrixRecoveryCard,body.dark .obrixRecoveryCard,html[data-theme="dark"] .modalBack.obrixRecoveryUpgraded>.modal,body.dark .modalBack.obrixRecoveryUpgraded>.modal{background:#101820!important;color:#f8fafc!important;border-color:#263647!important}.obrixRecoveryCard p{transition:none}html[data-theme="dark"] .obrixRecoveryCard p,body.dark .obrixRecoveryCard p{color:#94a3b8!important}html[data-theme="dark"] .obrixRecoveryCard input,body.dark .obrixRecoveryCard input{background:#0b1118!important;color:#f8fafc!important;border-color:#334155!important}html[data-theme="dark"] .obrixRecoveryBack,body.dark .obrixRecoveryBack{background:#161d25!important;color:#eef2f7!important;border-color:#334155!important}html[data-theme="dark"] .obrixRecoverySend,body.dark .obrixRecoverySend{background:#e2e8f0!important;color:#0f172a!important}
  @media(max-width:520px){.obrixRecoveryCard{margin:8px auto!important;padding:20px 17px!important}.obrixRecoveryActions{grid-template-columns:1fr!important}}
  `;document.head.appendChild(s);
}
function closeRecovery(){document.getElementById('obrixRecoveryScreen')?.remove()}
function recoveryMessage(e){const s=String(e?.message||e||'Não foi possível enviar o link.');if(/network|fetch|internet|offline/i.test(s))return'Não foi possível conectar agora. Verifique sua internet e tente novamente.';if(/email|invalid/i.test(s))return'Informe um endereço de e-mail válido.';return s}
function openRecoveryScreen(){
  recoveryStyle();closeRecovery();
  const screen=document.createElement('div');screen.id='obrixRecoveryScreen';screen.className='obrixRecoveryScreen';
  const prefill=String(document.getElementById('email')?.value||'').trim();
  screen.innerHTML=`<div class="obrixRecoveryCard"><h2>Recuperar senha</h2><p>Digite o e-mail da sua conta. Você receberá um link para criar uma nova senha.</p><label>E-mail</label><input class="email" type="email" autocomplete="email" placeholder="seu@email.com"><div class="obrixRecoveryError"></div><div class="obrixRecoveryActions"><button type="button" class="obrixRecoveryBack">Voltar</button><button type="button" class="obrixRecoverySend">Enviar link</button></div></div>`;
  document.body.appendChild(screen);screen.querySelector('.email').value=prefill;
  screen.querySelector('.obrixRecoveryBack').onclick=closeRecovery;
  screen.querySelector('.obrixRecoverySend').onclick=async()=>{
    const input=screen.querySelector('.email'),box=screen.querySelector('.obrixRecoveryError'),btn=screen.querySelector('.obrixRecoverySend'),email=input.value.trim();box.classList.remove('show');
    if(!email){box.textContent='Digite o seu e-mail.';box.classList.add('show');return}
    btn.disabled=true;btn.textContent='Enviando...';
    try{
      const sb=await OBRIX_BACKEND.init(),{error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:'https://obrix.junioalef7.workers.dev/obrix.html'});if(error)throw error;
      screen.querySelector('.obrixRecoveryCard').innerHTML=`<h2>Verifique seu e-mail</h2><div class="obrixRecoverySuccess">Se esse e-mail estiver cadastrado, enviamos o link para criar uma nova senha.</div><div class="obrixRecoveryActions" style="grid-template-columns:1fr"><button type="button" class="obrixRecoveryBack">Voltar para entrar</button></div>`;
      screen.querySelector('.obrixRecoveryBack').onclick=closeRecovery;
    }catch(e){btn.disabled=false;btn.textContent='Enviar link';box.textContent=recoveryMessage(e);box.classList.add('show')}
  };
  setTimeout(()=>screen.querySelector('.email')?.focus(),40);
}
function upgradeAuthScreens(){
  recoveryStyle();
  document.querySelectorAll('.modalBack').forEach(back=>{
    const h=back.querySelector('.authModal h2,.modal h2');if(!h)return;
    const t=String(h.textContent||'').trim().toLowerCase();
    if(t==='criar nova senha'||t==='recuperar senha'||t==='criar conta'){
      back.classList.add('obrixRecoveryUpgraded');
      const cancel=back.querySelector('.cancelar');if(cancel&&/cancelar/i.test(cancel.textContent||''))cancel.textContent='Voltar';
    }
  });
}
function captureAuthButtons(e){
  const b=e.target?.closest?.('#obrixAuthAux .esqueci');if(!b)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openRecoveryScreen();
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
function boot(){recoveryStyle();bindButton();installAuthListener();document.addEventListener('click',captureAuthButtons,true);if(document.body)new MutationObserver(()=>{bindButton();upgradeAuthScreens()}).observe(document.body,{childList:true,subtree:true});upgradeAuthScreens();setTimeout(()=>recover('startup'),250);setTimeout(()=>recover('startup-2'),1200)}
window.addEventListener('pageshow',()=>{bindButton();upgradeAuthScreens();setTimeout(()=>recover('pageshow'),150)});window.addEventListener('online',()=>setTimeout(()=>recover('online'),200));
setInterval(()=>{if(loginVisible())recover('watchdog')},4000);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.OBRIX_LOGIN_RESCUE={recover,showShell,openRecoveryScreen,status:()=>({running,lastAttempt,active:loginVisible(),listener:!!unsub,sessionReady:document.documentElement.dataset.obrixSessionReady==='1'})};
})();