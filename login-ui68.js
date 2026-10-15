(function(){
  'use strict';
  if(window.__EDIFIQ_LOGIN_UI68)return;
  window.__EDIFIQ_LOGIN_UI68=true;

  const ERROR_TEXT='Senha incorreta ou dados incorretos.';

  function installStyle68(){
    if(document.getElementById('edLoginUi68Style'))return;
    const s=document.createElement('style');
    s.id='edLoginUi68Style';
    s.textContent=`
      #auth .authCommercialHint{display:none!important}
      #auth #authMsg.edLoginError68{display:block!important;margin:8px 0 2px!important;text-align:left!important;color:#f04438!important;font-weight:800!important;font-size:13px!important;line-height:1.35!important}
      body.edLight #auth #authMsg.edLoginError68{color:#b42318!important}
    `;
    document.head.appendChild(s);
  }

  function removeOldTrialHint68(){
    const auth=document.getElementById('auth');if(!auth)return;
    auth.querySelectorAll('.authCommercialHint').forEach(el=>{el.textContent='';el.hidden=true;el.style.setProperty('display','none','important')});
  }

  function placeMessage68(){
    const auth=document.getElementById('auth');
    const msg=document.getElementById('authMsg');
    const passwordWrap=auth?.querySelector('.passwordWrap');
    if(!auth||!msg||!passwordWrap)return;
    if(msg.previousElementSibling!==passwordWrap)passwordWrap.insertAdjacentElement('afterend',msg);
  }

  function normalizeLoginMessage68(text){
    const raw=String(text||'').trim();
    if(/invalid login credentials|e-?mail ou senha incorret|senha incorret|credenciais? inv[aá]lid|dados incorret/i.test(raw))return ERROR_TEXT;
    return raw;
  }

  function paint68(text){
    const msg=document.getElementById('authMsg');if(!msg)return;
    const normalized=normalizeLoginMessage68(text);
    if(msg.textContent!==normalized)msg.textContent=normalized;
    const isError=normalized===ERROR_TEXT;
    msg.classList.toggle('edLoginError68',isError);
    if(!normalized)msg.classList.remove('edLoginError68');
  }

  function wrapAuthMsg68(){
    const original=window.authMsg;
    if(typeof original!=='function'||original.__edifiqLogin68)return false;
    const wrapped=function(message){
      const normalized=normalizeLoginMessage68(message);
      const result=original.call(this,normalized);
      placeMessage68();
      paint68(normalized);
      return result;
    };
    wrapped.__edifiqLogin68=true;
    wrapped.__edifiqOriginal68=original;
    window.authMsg=wrapped;
    return true;
  }

  function install68(){
    installStyle68();
    removeOldTrialHint68();
    placeMessage68();
    wrapAuthMsg68();
    const current=document.getElementById('authMsg')?.textContent||'';
    if(current)paint68(current);
  }

  window.edifiqInstallLoginUi68=install68;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install68,{once:true});else install68();
})();