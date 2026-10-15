(function(){
  'use strict';
  if(window.__EDIFIQ_UI_FIX67)return;
  window.__EDIFIQ_UI_FIX67=true;

  const VERSION='71';
  const byId=id=>document.getElementById(id);

  function toast67(msg){try{if(typeof window.toast==='function')window.toast(msg);else console.warn(msg)}catch(_){}}

  /* ---------- Tela inicial: mantém o cartão Primeiros passos removido. ---------- */
  function suppressOnboardingBanner69(){
    let style=byId('edifiqHome69Style');
    if(!style){
      style=document.createElement('style');
      style.id='edifiqHome69Style';
      style.textContent='#edOnboardingBanner12{display:none!important}';
      document.head.appendChild(style);
    }
    byId('edOnboardingBanner12')?.remove();
    const original=window.renderBanner12;
    if(typeof original==='function'&&!original.__edifiqHidden69){
      const hidden=function(){byId('edOnboardingBanner12')?.remove();return null};
      hidden.__edifiqHidden69=true;
      hidden.__edifiqOriginal69=original;
      window.renderBanner12=hidden;
    }
  }
  window.edifiqSuppressOnboardingBanner69=suppressOnboardingBanner69;

  /* ---------- Configurações: planos ficam SOMENTE no Menu. ---------- */
  function installConfigStyle71(){
    if(byId('edifiqConfig71Style'))return;
    const style=document.createElement('style');
    style.id='edifiqConfig71Style';
    style.textContent='#edConfiguracoesModal #edSubConfig10,#edConfiguracoesModal #edSubscriptionConfigCard,#edConfiguracoesModal #edBillingConfig11{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}';
    document.head.appendChild(style);
  }

  function suppressConfigPlans71(){
    installConfigStyle71();
    ['edSubConfig10','edSubscriptionConfigCard','edBillingConfig11'].forEach(id=>byId(id)?.remove());
  }
  window.edifiqSuppressConfigPlans71=suppressConfigPlans71;

  function wrapConfig71(){
    const original=window.openConfiguracoes;
    if(typeof original!=='function'||original.__edifiqUi71)return;
    const wrapped=async function(){
      suppressConfigPlans71();
      const result=await original.apply(this,arguments);
      suppressConfigPlans71();
      requestAnimationFrame(suppressConfigPlans71);
      return result;
    };
    wrapped.__edifiqUi71=true;
    wrapped.__edifiqOriginal71=original;
    window.openConfiguracoes=wrapped;
  }

  function wrapNoConfigPlan71(name){
    const original=window[name];
    if(typeof original!=='function'||original.__edifiqNoConfig71)return;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      suppressConfigPlans71();
      return result;
    };
    wrapped.__edifiqNoConfig71=true;
    wrapped.__edifiqOriginal71=original;
    window[name]=wrapped;
  }

  function ensurePlansMenu71(){
    const menu=byId('menuPasta');if(!menu)return;
    let btn=byId('menuPlanosAssinaturas');
    if(!btn){
      const config=[...menu.querySelectorAll('button')].find(b=>/configurações|configuracoes/i.test(String(b.textContent||'')));
      if(!config)return;
      btn=document.createElement('button');
      btn.id='menuPlanosAssinaturas';btn.type='button';btn.className=config.className||'edifiqDataRow';
      btn.innerHTML='<span>💳</span><b>Planos e assinaturas</b><span class="edifiqChevron">›</span>';
      btn.addEventListener('click',ev=>{
        ev.preventDefault();ev.stopPropagation();
        menu.classList.remove('open');byId('menuPastaBackdrop')?.classList.remove('open');
        const open=()=>{const fn=window.openPlanosEdifiq11||window.openPlanosEdifiq10||window.openBilling14;if(typeof fn==='function')fn()};
        if(typeof window.edifiqEnsureTrial63==='function')Promise.resolve(window.edifiqEnsureTrial63(null,true)).finally(open);else open();
      });
      config.insertAdjacentElement('afterend',btn);
    }
    btn.hidden=false;btn.style.removeProperty('display');
  }

  /* ---------- Planos: garante o resumo do teste dentro de Planos e assinaturas. ---------- */
  function refreshPlan67(){
    try{
      const modal=byId('edPlanosModal');
      if(!modal||!modal.classList.contains('open'))return;
      if(typeof window.edifiqRenderPlanInfo66==='function')window.edifiqRenderPlanInfo66(window.__edifiqSubscription||null);
      const info=byId('edPlanTrial66');
      if(info){
        info.setAttribute('data-edifiq-ui','71');
        const box=modal.querySelector('.modalBox');
        const head=modal.querySelector('.modalHead');
        if(box&&head&&info.parentElement!==box)head.insertAdjacentElement('afterend',info);
      }
    }catch(e){console.warn('EDIFIQ planos UI71:',e)}
  }

  function wrapPlan67(name){
    const original=window[name];
    if(typeof original!=='function'||original.__edifiqUi67)return;
    const wrapped=async function(){
      const result=await original.apply(this,arguments);
      refreshPlan67();
      return result;
    };
    wrapped.__edifiqUi67=true;
    wrapped.__edifiqOriginal67=original;
    window[name]=wrapped;
  }

  /* ---------- Visão geral: botão Fechar sempre presente. ---------- */
  function closeOverview67(){
    try{
      if(typeof window.go==='function'){window.go('dashboard');return}
      const home=document.querySelector('[data-p="dashboard"]');
      if(home){home.click();return}
      byId('resumoGeral')?.classList.remove('active');
      byId('dashboard')?.classList.add('active');
    }catch(e){console.warn('EDIFIQ fechar visão geral:',e)}
  }
  window.edifiqCloseOverview67=closeOverview67;

  function ensureOverviewClose67(){
    const page=byId('resumoGeral');if(!page)return;
    const heading=page.querySelector('.ed29Heading');if(!heading)return;
    let actions=heading.querySelector('.ed29Actions');
    if(!actions){actions=document.createElement('div');actions.className='ed29Actions';heading.appendChild(actions)}
    if(actions.querySelector('[data-ed-close-overview="67"]'))return;
    const button=document.createElement('button');
    button.type='button';button.className='ed29Button secondary';button.setAttribute('data-ed-close-overview','67');button.setAttribute('aria-label','Fechar visão geral e voltar ao início');button.textContent='✕ Fechar';button.addEventListener('click',closeOverview67);actions.prepend(button);
  }

  function wrapOverview67(name){
    const original=window[name];if(typeof original!=='function'||original.__edifiqUi67)return;
    const wrapped=function(){const result=original.apply(this,arguments);ensureOverviewClose67();return result};
    wrapped.__edifiqUi67=true;wrapped.__edifiqOriginal67=original;window[name]=wrapped;
  }

  /* ---------- Impressão ---------- */
  function ensurePrintStyle67(){
    let style=byId('edifiqPrint67Style');if(style)return style;
    style=document.createElement('style');style.id='edifiqPrint67Style';
    style.textContent=`#edifiqPrint67{display:none}@media print{body.edifiqPrint67Active>*:not(#edifiqPrint67){display:none!important}body.edifiqPrint67Active>#edifiqPrint67{display:block!important;position:static!important;background:#fff!important;color:#111!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important}body.edifiqPrint67Active>#edifiqPrint67 *{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:auto;margin:10mm}}`;
    document.head.appendChild(style);return style;
  }

  function printHtml67(html,styles=''){
    if(!String(html||'').trim()){toast67('Não há conteúdo para imprimir.');return false}
    ensurePrintStyle67();let host=byId('edifiqPrint67');if(!host){host=document.createElement('div');host.id='edifiqPrint67';document.body.appendChild(host)}
    host.innerHTML=(styles?'<style>'+styles+'</style>':'')+String(html);document.body.classList.add('edifiqPrint67Active');
    let cleaned=false;const cleanup=()=>{if(cleaned)return;cleaned=true;document.body.classList.remove('edifiqPrint67Active');setTimeout(()=>{if(host)host.innerHTML=''},50)};
    window.addEventListener('afterprint',cleanup,{once:true});
    try{window.focus();window.print();setTimeout(cleanup,2500);return true}catch(e){cleanup();console.error('EDIFIQ impressão UI71:',e);toast67('Não foi possível abrir a impressão. Tente novamente pelo botão Imprimir.');return false}
  }
  window.edifiqPrintHtml67=printHtml67;

  function installReportPrint67(){
    const old=window.edifiqReportPrint;
    if(typeof old==='function'&&!old.__edifiqUi67){
      const fixed=function(){const frame=byId('edifiqReportFrame'),doc=frame?.contentDocument;if(!doc?.body){toast67('Abra um relatório primeiro.');return false}const styles=[...doc.querySelectorAll('style')].map(s=>s.textContent||'').join('\n');return printHtml67(doc.body.innerHTML,styles)};
      fixed.__edifiqUi67=true;fixed.__edifiqOriginal67=old;window.edifiqReportPrint=fixed;
    }
    const old27=window.ed27PrintReport;
    if(typeof old27==='function'&&!old27.__edifiqUi67){
      const fixed27=function(){const source=byId('ed27Print');if(!source?.innerHTML){toast67('Abra um relatório primeiro.');return false}return printHtml67(source.innerHTML,'')};
      fixed27.__edifiqUi67=true;fixed27.__edifiqOriginal67=old27;window.ed27PrintReport=fixed27;
    }
  }

  function install67(){
    suppressOnboardingBanner69();
    installConfigStyle71();
    suppressConfigPlans71();
    ensurePlansMenu71();
    wrapConfig71();
    wrapNoConfigPlan71('renderCommercial10');
    wrapNoConfigPlan71('renderBilling11');
    wrapPlan67('openPlanosEdifiq11');
    wrapPlan67('openPlanosEdifiq10');
    wrapOverview67('renderResumoGeral');
    const select=window.ed29SelectScope;
    if(typeof select==='function'&&!select.__edifiqUi67){const fixed=function(){const r=select.apply(this,arguments);ensureOverviewClose67();return r};fixed.__edifiqUi67=true;fixed.__edifiqOriginal67=select;window.ed29SelectScope=fixed}
    ensureOverviewClose67();installReportPrint67();refreshPlan67();
  }

  window.edifiqInstallUiFix67=install67;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install67,{once:true});else install67();
})();