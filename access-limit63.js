(function(){
  'use strict';
  const VERSION='64';
  const ALLOWED_PAGES=new Set(['dashboard','financeiro','funcionarios','obras']);
  let wrapped=false,lastLimited=null,refreshBusy=false;
  const q=id=>document.getElementById(id);
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

  function verified(){return window.__edifiqSubscriptionVerifiedOnline===true}
  function fullAccess(s){
    if(!s)return true;if(s.acesso_liberado===true)return true;if(s.modo_limitado===true||s.acesso_liberado===false)return false;
    const st=String(s.status||'').toLowerCase(),now=Date.now();
    if(st==='cortesia')return true;if(st==='ativa')return !s.periodo_fim||new Date(s.periodo_fim).getTime()>now;if(st==='trial')return !!s.trial_fim&&new Date(s.trial_fim).getTime()>now;return false;
  }
  function limited(){const logged=typeof user!=='undefined'&&!!user?.id;const s=window.__edifiqSubscription;return !!(logged&&verified()&&s&&!fullAccess(s))}
  window.edifiqLimitedMode63=limited;
  function toastSafe(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(_){}}
  function blockFeature(){toastSafe('Seu teste grátis terminou. No modo gratuito ficam liberados: Financeiro, 1 obra e 1 funcionário. Assine um plano para liberar os demais recursos.');return false}

  function css64(){
    if(q('edAccess64Style'))return;
    const s=document.createElement('style');s.id='edAccess64Style';s.textContent=`
      #edTrialHome63{display:none!important}
      body.edLimitedFree63 #edSubscriptionGate{display:none!important}
      body.edLimitedFree63 .ed63Locked{opacity:.46!important;position:relative}
      body.edLimitedFree63 .ed63Locked::after{content:' 🔒';font-size:12px;margin-left:auto}
      body.edLimitedFree63 #homeObrasList>.ed63ExtraHidden,body.edLimitedFree63 #funcList>.ed63ExtraHidden{display:none!important}
      .ed63LimitNote{margin:10px 0;padding:10px 12px;border-radius:11px;border:1px solid var(--line,#34445b);font-size:12px;line-height:1.4;background:rgba(127,127,127,.06)}
    `;document.head.appendChild(s);
    q('edTrialHome63')?.remove();
  }

  function markMenu(){
    const menu=q('menuPasta');if(!menu)return;
    menu.querySelectorAll('button').forEach(btn=>{
      btn.classList.remove('ed63Locked');if(!limited())return;
      const on=String(btn.getAttribute('onclick')||''),text=norm(btn.textContent),m=on.match(/go(?:Menu)?\(['\"]([^'\"]+)/i);
      if(m&&!ALLOWED_PAGES.has(m[1]))btn.classList.add('ed63Locked');
      if(/relatorio|documento|diario de obras|checklist|analise|resumo geral|visao geral/.test(text))btn.classList.add('ed63Locked');
    });
  }

  function limitEmployeeSelects(isLimited,funcs){
    const allowed=funcs[0]?.id==null?'':String(funcs[0].id),ids=new Set(funcs.map(f=>String(f.id)));
    document.querySelectorAll('select').forEach(sel=>{
      let has=false;[...sel.options].forEach(o=>{if(ids.has(String(o.value)))has=true});if(!has)return;
      [...sel.options].forEach(o=>{if(ids.has(String(o.value)))o.disabled=!!(isLimited&&allowed&&String(o.value)!==allowed)});
      if(isLimited&&allowed&&ids.has(String(sel.value))&&String(sel.value)!==allowed)sel.value=allowed;
    });
  }

  function limitVisibleRecords(){
    const isLimited=limited(),obras=typeof D!=='undefined'&&Array.isArray(D?.obras)?D.obras:[],funcs=typeof D!=='undefined'&&Array.isArray(D?.funcionarios)?D.funcionarios:[];
    const obraAllowed=obras[0]?.id==null?'':String(obras[0].id),sel=q('obraSelecionada');
    if(sel){[...sel.options].forEach(opt=>{if(!opt.value){opt.disabled=false;return}opt.disabled=!!(isLimited&&obraAllowed&&String(opt.value)!==obraAllowed)});if(isLimited&&obraAllowed&&sel.value&&String(sel.value)!==obraAllowed)sel.value=obraAllowed}
    limitEmployeeSelects(isLimited,funcs);
    const home=q('homeObrasList');if(home)[...home.children].forEach((el,i)=>el.classList.toggle('ed63ExtraHidden',isLimited&&i>0));
    const fl=q('funcList');if(fl)[...fl.children].forEach((el,i)=>el.classList.toggle('ed63ExtraHidden',isLimited&&i>0));
    const obrasPage=q('obras'),funcPage=q('funcionarios');
    let on=q('ed63ObrasNote');if(isLimited&&obrasPage){if(!on){on=document.createElement('div');on.id='ed63ObrasNote';on.className='ed63LimitNote';obrasPage.querySelector('.pageTitle')?.insertAdjacentElement('afterend',on)}on.textContent='Plano gratuito: somente 1 obra fica disponível. As demais permanecem salvas e voltam a ser liberadas após o pagamento.'}else on?.remove();
    let fn=q('ed63FuncNote');if(isLimited&&funcPage){if(!fn){fn=document.createElement('div');fn.id='ed63FuncNote';fn.className='ed63LimitNote';funcPage.querySelector('.pageTitle')?.insertAdjacentElement('afterend',fn)}fn.textContent='Plano gratuito: somente 1 funcionário fica disponível. Os demais permanecem salvos e voltam a ser liberados após o pagamento.'}else fn?.remove();
  }

  function wrapCore(){
    if(wrapped)return;wrapped=true;
    const oldGo=window.go;if(typeof oldGo==='function')window.go=function(page){if(limited()&&!ALLOWED_PAGES.has(String(page||''))){blockFeature();return false}return oldGo.apply(this,arguments)};
    const oldOpenObra=window.openObra;if(typeof oldOpenObra==='function')window.openObra=function(id=null){const n=typeof D!=='undefined'&&Array.isArray(D?.obras)?D.obras.length:0;if(limited()&&(id==null||id==='')&&n>=1){toastSafe('No plano gratuito é permitido cadastrar somente 1 obra. Assine um plano para cadastrar outras obras.');return false}return oldOpenObra.apply(this,arguments)};
    const oldOpenFunc=window.openFunc;if(typeof oldOpenFunc==='function')window.openFunc=function(id=null){const n=typeof D!=='undefined'&&Array.isArray(D?.funcionarios)?D.funcionarios.length:0;if(limited()&&(id==null||id==='')&&n>=1){toastSafe('No plano gratuito é permitido cadastrar somente 1 funcionário. Assine um plano para cadastrar outros funcionários.');return false}return oldOpenFunc.apply(this,arguments)};
  }

  function clickGuard(ev){
    if(!limited())return;const el=ev.target?.closest?.('button,a,[role="button"]');if(!el||el.id==='menuPlanosAssinaturas')return;
    const text=norm(el.textContent),on=String(el.getAttribute('onclick')||''),m=on.match(/go(?:Menu)?\(['\"]([^'\"]+)/i);
    const blockedPage=m&&!ALLOWED_PAGES.has(m[1]);
    const blockedDirect=/openDocumentos|openRelatorio|relatorio|ed27Report|exportPDF|rcExportPDF/i.test(on)||/relatorio(?:s)?|salvar pdf|gerar pdf|relatorio pdf/.test(text);
    if(blockedPage||blockedDirect){ev.preventDefault();ev.stopImmediatePropagation();blockFeature()}
  }

  function applyMode(){
    css64();q('edTrialHome63')?.remove();wrapCore();const isLimited=limited();document.body?.classList.toggle('edLimitedFree63',isLimited);if(isLimited)q('edSubscriptionGate')?.classList.add('hidden');markMenu();limitVisibleRecords();
    if(lastLimited!==isLimited){lastLimited=isLimited;try{window.renderAll?.()}catch(_){}}
  }
  async function refresh(){
    if(refreshBusy||typeof user==='undefined'||!user?.id)return;refreshBusy=true;
    try{if(typeof window.edifiqEnsureTrial63==='function')await window.edifiqEnsureTrial63(null,true);else if(typeof window.edifiqEnsureTrial62==='function')await window.edifiqEnsureTrial62(null,true);else if(typeof window.loadSubscription10==='function')await window.loadSubscription10(false)}catch(_){ }finally{refreshBusy=false;applyMode()}
  }
  function init(){css64();wrapCore();document.addEventListener('click',clickGuard,true);applyMode();setInterval(applyMode,5000);setInterval(refresh,60000);setTimeout(refresh,1800);window.addEventListener('edifiq:subscription-updated',applyMode)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();