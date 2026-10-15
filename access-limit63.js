(function(){
  'use strict';
  const VERSION='63';
  const ALLOWED_PAGES=new Set(['dashboard','financeiro','funcionarios','obras']);
  let wrapped=false,lastLimited=null,refreshBusy=false,observerQueued=false;

  const q=id=>document.getElementById(id);
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const fmt=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR')};
  const daysLeft=s=>{if(!s?.trial_fim)return 0;return Math.max(0,Math.ceil((new Date(s.trial_fim).getTime()-Date.now())/86400000))};
  const trialActive=s=>!!(s&&String(s.status||'').toLowerCase()==='trial'&&s.trial_fim&&new Date(s.trial_fim).getTime()>Date.now());
  const setHtml=(el,html)=>{if(el&&el.innerHTML!==html)el.innerHTML=html};

  function verified(){return window.__edifiqSubscriptionVerifiedOnline===true}
  function fullAccess(s){
    if(!s)return true;
    if(s.acesso_liberado===true)return true;
    if(s.modo_limitado===true||s.acesso_liberado===false)return false;
    const st=String(s.status||'').toLowerCase(),now=Date.now();
    if(st==='cortesia')return true;
    if(st==='ativa')return !s.periodo_fim||new Date(s.periodo_fim).getTime()>now;
    if(st==='trial')return !!s.trial_fim&&new Date(s.trial_fim).getTime()>now;
    return false;
  }
  function limited(){
    const logged=typeof user!=='undefined'&&!!user?.id;
    const s=window.__edifiqSubscription;
    return !!(logged&&verified()&&s&&!fullAccess(s));
  }
  window.edifiqLimitedMode63=limited;

  function toastSafe(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(_){}}
  function blockedMessage(){return 'Seu teste grátis terminou. No modo gratuito ficam liberados: Financeiro, 1 obra e 1 funcionário. Assine um plano para liberar os demais recursos.'}
  function blockFeature(){toastSafe(blockedMessage());return false}

  function css63(){
    if(q('edAccess63Style'))return;
    const s=document.createElement('style');s.id='edAccess63Style';s.textContent=`
      #edTrialHome63{margin:0 0 14px;padding:14px;border:1px solid var(--line,#34445b);border-radius:15px;background:var(--card,#101827);color:var(--text,#f8fafc)}
      #edTrialHome63 .edTrial63Head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
      #edTrialHome63 .edTrial63Head strong{font-size:16px}.edTrial63Badge{display:inline-flex;padding:6px 9px;border-radius:999px;font-size:11px;font-weight:900;background:#eff8ff;color:#175cd3}
      #edTrialHome63 .edTrial63Grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      #edTrialHome63 .edTrial63Grid>div{border:1px solid var(--line,#34445b);border-radius:11px;padding:10px;background:rgba(127,127,127,.06)}
      #edTrialHome63 small{display:block;opacity:.72;margin-bottom:4px}#edTrialHome63 b{font-size:14px}
      #edTrialHome63 .edTrial63Note{margin-top:10px;font-size:12px;line-height:1.4;opacity:.82}
      body.edLimitedFree63 #edSubscriptionGate{display:none!important}
      body.edLimitedFree63 .ed63Locked{opacity:.46!important;position:relative}
      body.edLimitedFree63 .ed63Locked::after{content:' 🔒';font-size:12px;margin-left:auto}
      body.edLimitedFree63 #homeObrasList>.ed63ExtraHidden,body.edLimitedFree63 #funcList>.ed63ExtraHidden{display:none!important}
      .ed63LimitNote{margin:10px 0;padding:10px 12px;border-radius:11px;border:1px solid var(--line,#34445b);font-size:12px;line-height:1.4;background:rgba(127,127,127,.06)}
      body.edLight #edTrialHome63{background:#fff;color:#111827}
      @media(max-width:620px){#edTrialHome63 .edTrial63Grid{grid-template-columns:1fr}#edTrialHome63{padding:12px}}
    `;document.head.appendChild(s);
  }

  function renderHomeTrial(){
    const dash=q('dashboard');if(!dash)return;
    const sub=window.__edifiqSubscription;
    let box=q('edTrialHome63');
    if(!sub||(!trialActive(sub)&&!limited())){box?.remove();return}
    if(!box){box=document.createElement('div');box.id='edTrialHome63';const anchor=dash.querySelector('.edHomeHeader,.pageTitle,.pageHead,.titleRow');if(anchor)anchor.insertAdjacentElement('afterend',box);else dash.prepend(box)}
    let html='';
    if(trialActive(sub)){
      const d=daysLeft(sub);
      html=`<div class="edTrial63Head"><strong>🎁 Teste grátis de 7 dias</strong><span class="edTrial63Badge">${d} dia${d===1?'':'s'} restante${d===1?'':'s'}</span></div><div class="edTrial63Grid"><div><small>Começou em</small><b>${fmt(sub.trial_inicio)}</b></div><div><small>Dias restantes</small><b>${d}</b></div><div><small>Vence em</small><b>${fmt(sub.trial_fim)}</b></div></div><div class="edTrial63Note">Até o vencimento, todos os recursos ficam liberados. A primeira cobrança de um plano escolhido durante o teste fica para depois do fim dos 7 dias.</div>`;
    }else{
      html=`<div class="edTrial63Head"><strong>Plano gratuito limitado</strong><span class="edTrial63Badge">Teste encerrado</span></div><div class="edTrial63Grid"><div><small>Teste começou em</small><b>${fmt(sub.trial_inicio)}</b></div><div><small>Teste venceu em</small><b>${fmt(sub.trial_fim)}</b></div><div><small>Acesso gratuito</small><b>Limitado</b></div></div><div class="edTrial63Note">Liberados: Financeiro, 1 obra e 1 funcionário. Relatórios e os demais recursos ficam bloqueados até a confirmação do pagamento.</div>`;
    }
    setHtml(box,html);
  }

  function planSummary(){
    const modal=q('edPlanosModal'),sub=window.__edifiqSubscription;if(!modal||!sub)return;
    const box=q('edTrial60Summary')||q('edTrial62Summary');if(!box)return;
    let html='';
    if(trialActive(sub)){
      const d=daysLeft(sub);
      html=`<div class="financeRow"><span>🎁 Teste grátis</span><b>${d} dia${d===1?'':'s'} restante${d===1?'':'s'}</b></div><div class="financeRow"><span>Início do teste</span><b>${fmt(sub.trial_inicio)}</b></div><div class="financeRow"><span>Vencimento do teste</span><b>${fmt(sub.trial_fim)}</b></div><div class="financeRow"><span>Primeira cobrança</span><b>${fmt(sub.trial_fim)}</b></div><div class="note" style="margin-top:10px">A cobrança começa somente depois dos 7 dias grátis.</div>`;
    }else if(limited()){
      html=`<div class="financeRow"><span>Teste grátis</span><b>Encerrado</b></div><div class="financeRow"><span>Início</span><b>${fmt(sub.trial_inicio)}</b></div><div class="financeRow"><span>Venceu em</span><b>${fmt(sub.trial_fim)}</b></div><div class="note" style="margin-top:10px">Modo gratuito: Financeiro + 1 obra + 1 funcionário. Os demais recursos são liberados após a confirmação do pagamento.</div>`;
    }
    if(html)setHtml(box,html);
  }

  function markMenu(){
    const menu=q('menuPasta');if(!menu)return;
    menu.querySelectorAll('button').forEach(btn=>{
      btn.classList.remove('ed63Locked');
      if(!limited())return;
      const on=String(btn.getAttribute('onclick')||''),text=norm(btn.textContent);
      const pageMatch=on.match(/go(?:Menu)?\(['\"]([^'\"]+)/i);
      if(pageMatch&&!ALLOWED_PAGES.has(pageMatch[1]))btn.classList.add('ed63Locked');
      if(/relatorio|documento|diario de obras|checklist|analise|resumo geral|visao geral/.test(text))btn.classList.add('ed63Locked');
    });
  }

  function limitEmployeeSelects(isLimited,funcs){
    const allowed=funcs[0]?.id==null?'':String(funcs[0].id);
    const ids=new Set(funcs.map(f=>String(f.id)));
    document.querySelectorAll('select').forEach(sel=>{
      let hasEmployee=false;
      [...sel.options].forEach(opt=>{if(ids.has(String(opt.value)))hasEmployee=true});
      if(!hasEmployee)return;
      [...sel.options].forEach(opt=>{
        if(!ids.has(String(opt.value)))return;
        opt.disabled=!!(isLimited&&allowed&&String(opt.value)!==allowed);
      });
      if(isLimited&&allowed&&ids.has(String(sel.value))&&String(sel.value)!==allowed){sel.value=allowed;try{sel.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){}}
    });
  }

  function limitVisibleRecords(){
    const isLimited=limited();
    const obras=typeof D!=='undefined'&&Array.isArray(D?.obras)?D.obras:[];
    const funcs=typeof D!=='undefined'&&Array.isArray(D?.funcionarios)?D.funcionarios:[];
    const obraAllowed=obras[0]?.id==null?'':String(obras[0].id);
    const sel=q('obraSelecionada');
    if(sel){
      [...sel.options].forEach(opt=>{if(!opt.value){opt.disabled=false;return}opt.disabled=isLimited&&obraAllowed&&String(opt.value)!==obraAllowed});
      if(isLimited&&obraAllowed&&sel.value&&String(sel.value)!==obraAllowed){sel.value=obraAllowed;try{window.renderObras?.()}catch(_){}}
    }
    limitEmployeeSelects(isLimited,funcs);
    const home=q('homeObrasList');if(home){[...home.children].forEach((el,i)=>el.classList.toggle('ed63ExtraHidden',isLimited&&i>0))}
    const fl=q('funcList');if(fl){[...fl.children].forEach((el,i)=>el.classList.toggle('ed63ExtraHidden',isLimited&&i>0))}
    const obrasPage=q('obras'),funcPage=q('funcionarios');
    let on=q('ed63ObrasNote');
    if(isLimited&&obrasPage){
      if(!on){on=document.createElement('div');on.id='ed63ObrasNote';on.className='ed63LimitNote';obrasPage.querySelector('.pageTitle')?.insertAdjacentElement('afterend',on)}
      const t='Plano gratuito: somente 1 obra fica disponível. As demais permanecem salvas e voltam a ser liberadas após o pagamento.';if(on.textContent!==t)on.textContent=t;
    }else on?.remove();
    let fn=q('ed63FuncNote');
    if(isLimited&&funcPage){
      if(!fn){fn=document.createElement('div');fn.id='ed63FuncNote';fn.className='ed63LimitNote';funcPage.querySelector('.pageTitle')?.insertAdjacentElement('afterend',fn)}
      const t='Plano gratuito: somente 1 funcionário fica disponível. Os demais permanecem salvos e voltam a ser liberados após o pagamento.';if(fn.textContent!==t)fn.textContent=t;
    }else fn?.remove();
  }

  function wrapCore(){
    if(wrapped)return;wrapped=true;
    const oldGo=window.go;
    if(typeof oldGo==='function')window.go=function(page){if(limited()&&!ALLOWED_PAGES.has(String(page||''))){blockFeature();return false}return oldGo.apply(this,arguments)};
    const oldOpenObra=window.openObra;
    if(typeof oldOpenObra==='function')window.openObra=function(id=null){
      const count=(typeof D!=='undefined'&&Array.isArray(D?.obras))?D.obras.length:0;
      if(limited()&&(id==null||id==='')&&count>=1){toastSafe('No plano gratuito é permitido cadastrar somente 1 obra. Assine um plano para cadastrar outras obras.');return false}
      return oldOpenObra.apply(this,arguments);
    };
    const oldOpenFunc=window.openFunc;
    if(typeof oldOpenFunc==='function')window.openFunc=function(id=null){
      const count=(typeof D!=='undefined'&&Array.isArray(D?.funcionarios))?D.funcionarios.length:0;
      if(limited()&&(id==null||id==='')&&count>=1){toastSafe('No plano gratuito é permitido cadastrar somente 1 funcionário. Assine um plano para cadastrar outros funcionários.');return false}
      return oldOpenFunc.apply(this,arguments);
    };
  }

  function clickGuard(ev){
    if(!limited())return;
    const el=ev.target?.closest?.('button,a,[role="button"]');if(!el)return;
    if(el.id==='menuPlanosAssinaturas')return;
    const text=norm(el.textContent),on=String(el.getAttribute('onclick')||'');
    const pageMatch=on.match(/go(?:Menu)?\(['\"]([^'\"]+)/i);
    const blockedPage=pageMatch&&!ALLOWED_PAGES.has(pageMatch[1]);
    const blockedDirect=/openDocumentos|openRelatorio|relatorio|ed27Report|exportPDF|rcExportPDF/i.test(on)||/relatorio(?:s)?|salvar pdf|gerar pdf|relatorio pdf/.test(text);
    if(blockedPage||blockedDirect){ev.preventDefault();ev.stopImmediatePropagation();blockFeature()}
  }

  function applyMode(){
    css63();wrapCore();
    const isLimited=limited();
    document.body?.classList.toggle('edLimitedFree63',isLimited);
    if(isLimited)q('edSubscriptionGate')?.classList.add('hidden');
    renderHomeTrial();planSummary();markMenu();limitVisibleRecords();
    if(lastLimited!==isLimited){lastLimited=isLimited;try{window.renderAll?.()}catch(_){}}
  }

  function queueApply(){
    if(observerQueued)return;observerQueued=true;
    setTimeout(()=>{observerQueued=false;applyMode()},60);
  }

  async function refresh(){
    if(refreshBusy||typeof user==='undefined'||!user?.id)return;refreshBusy=true;
    try{
      if(typeof window.edifiqEnsureTrial63==='function')await window.edifiqEnsureTrial63(null,true);
      else if(typeof window.edifiqEnsureTrial62==='function')await window.edifiqEnsureTrial62(null,true);
      else if(typeof window.loadSubscription10==='function')await window.loadSubscription10(false);
    }catch(_){ }finally{refreshBusy=false;applyMode()}
  }

  function init(){
    css63();wrapCore();document.addEventListener('click',clickGuard,true);applyMode();
    new MutationObserver(queueApply).observe(document.documentElement,{childList:true,subtree:true});
    setInterval(applyMode,2200);setInterval(refresh,60000);setTimeout(refresh,1800);
    window.addEventListener('edifiq:subscription-updated',applyMode);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
