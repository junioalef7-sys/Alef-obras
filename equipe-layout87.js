(()=>{
  'use strict';
  if(window.__EDIFIQ_EQUIPE_LAYOUT87)return;
  window.__EDIFIQ_EQUIPE_LAYOUT87=true;

  function aplicar(){
    const page=document.getElementById('funcionarios');
    if(!page)return;

    const overview=page.querySelector('.equipeOverview');
    if(overview){overview.hidden=true;overview.setAttribute('aria-hidden','true')}

    const extra=document.getElementById('ed27TeamFilters');
    if(extra){extra.hidden=true;extra.setAttribute('aria-hidden','true')}

    const periodo=document.getElementById('edEquipePeriod');
    if(periodo){periodo.hidden=true;periodo.setAttribute('aria-hidden','true')}

    const top=page.querySelector('.edEquipeTopActions');
    const secondary=page.querySelector('.edEquipeSecondary');
    const list=document.getElementById('funcList');
    if(top&&secondary&&list){
      if(top.nextElementSibling!==secondary)top.insertAdjacentElement('afterend',secondary);
      if(secondary.nextElementSibling!==list)secondary.insertAdjacentElement('afterend',list);
    }
  }

  const css=document.createElement('style');
  css.id='edifiq-equipe-layout87';
  css.textContent=`
    #funcionarios .equipeOverview,
    #funcionarios #ed27TeamFilters,
    #funcionarios #edEquipePeriod{display:none!important}

    #funcionarios .edEquipeTopActions{
      display:grid!important;
      grid-template-columns:repeat(2,minmax(0,1fr))!important;
      gap:10px!important;
      margin:0 0 10px!important;
    }
    #funcionarios .edEquipeTopActions .edEqCmd{
      width:100%!important;
      min-height:68px!important;
      margin:0!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      gap:9px!important;
      border-radius:16px!important;
      font-weight:900!important;
      font-size:16px!important;
      text-align:center!important;
    }

    #funcionarios .edEquipeSecondary{
      display:grid!important;
      grid-template-columns:1fr 1fr!important;
      gap:10px!important;
      margin:0 0 16px!important;
      align-items:stretch!important;
    }
    #funcionarios .edEquipeSecondary select,
    #funcionarios .edEquipeSecondary .btn{
      width:100%!important;
      min-height:54px!important;
      margin:0!important;
      border-radius:14px!important;
    }

    #funcionarios #funcList{
      display:flex!important;
      flex-direction:column!important;
      gap:12px!important;
      margin:0!important;
      width:100%!important;
    }
    #funcionarios #funcList>.edEquipeCard,
    #funcionarios #funcList>.card{
      width:100%!important;
      margin:0!important;
    }
    #funcionarios .edEquipeCard .ed27Actions{
      display:grid!important;
      grid-template-columns:1fr 1fr!important;
      gap:9px!important;
    }
    #funcionarios .edEquipeCard .ed27Actions .btn{
      width:100%!important;
      min-width:0!important;
      min-height:50px!important;
      margin:0!important;
    }

    @media(max-width:520px){
      #funcionarios .edEquipeTopActions{gap:8px!important}
      #funcionarios .edEquipeTopActions .edEqCmd{min-height:64px!important;font-size:15px!important;padding:10px 8px!important}
      #funcionarios .edEquipeSecondary{gap:8px!important;margin-bottom:12px!important}
      #funcionarios .edEquipeSecondary select,#funcionarios .edEquipeSecondary .btn{min-height:50px!important}
      #funcionarios #funcList{gap:10px!important}
    }
  `;
  document.head.appendChild(css);

  function instalar(){
    aplicar();
    const page=document.getElementById('funcionarios');
    if(!page)return setTimeout(instalar,250);
    let agendado=false;
    new MutationObserver(()=>{
      if(agendado)return;
      agendado=true;
      requestAnimationFrame(()=>{agendado=false;aplicar()});
    }).observe(page,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar,{once:true});
  else instalar();
})();
