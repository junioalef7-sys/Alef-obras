(()=>{
  'use strict';
  if(window.__OBRIX_POS_LOGIN_LOADER)return;
  window.__OBRIX_POS_LOGIN_LOADER=true;

  const scripts=[
    './obrix-financeiro-main.js?v=20261019checkval1',
    './obrix-financeiro-resumo-obras.js?v=20261020resumo1',
    './obrix-financeiro-resumo-geral.js?v=20261019perf1',
    './obrix-financeiro-protecao-estoque.js?v=357',
    './obrix-financeiro-busca.js?v=20261019filtros3',
    './obrix-financeiro-filtros-layout.js?v=20261019layout3',
    './obrix-financeiro-grafico-receitas.js?v=20261019grafico1',
    './obrix-estoque-main.js?v=b777d66c',
    './obrix-equipe-main.js?v=d8d02827',
    './obrix-equipe-total-pago.js?v=20261019fix4',
    './obrix-equipe-pagamento-seguro.js?v=20261018dados1',
    './obrix-equipe-lista-vertical.js?v=20261019modelo1',
    './obrix-equipe-diretorio-pessoal.js?v=20261019pessoal1',
    './obrix-equipe-folha-install.js?v=20261019folha2',
    './obrix-equipe-pagar-selecao.js?v=20261019checkpay2',
    './obrix-obras-main.js?v=20261021restauraclassico1',
    './obrix-obras-busca.js?v=20261021semTodas1',
    './obrix-obras-pagamentos.js?v=20261019pagobra1',
    './obrix-relatorio-fotografico.js?v=20261019foto2',
    './obrix-relatorio-fotografico-realtime.js?v=20261020rt2',
    './obrix-checklist-v2.js?v=20261019checkval1',
    './obrix-estoque-saida-obra.js?v=349',
    './obrix-estoque-operacoes-main.js?v=340',
    './obrix-estoque-estorno-final.js?v=350',
    './obrix-assinaturas-main.js?v=408',
    './obrix-relatorios-v2.js?v=20261018equipe1',
    './obrix-relatorios-mobile-fix.js?v=20261018mobile6',
    './obrix-backup-v2.js?v=20261019obrix1',
    './obrix-backup-import-run.js?v=20261018restore1',
    './obrix-config-main.js?v=20261018cfg3',
    './obrix-account-delete.js?v=20261018conta1',
    './obrix-offline-diario.js?v=20261021offline4',
    './obrix-diario-main.js?v=20261021offline2',
    './obrix-diario-equipe.js?v=20261021offline3',
    './obrix-orcamentos-main.js?v=20261019orc1',
    './obrix-orcamentos-itens-topo.js?v=20261019topo1',
    './obrix-orcamentos-rascunho-print.js?v=20261019draftprint1',
    './obrix-menu-main.js?v=20261021menu10pct1',
    './obrix-nav-active.js?v=20261019docs1',
    './obrix-dashboard-sync.js?v=20261019perf2',
    './obrix-sync-fast.js?v=20261019perf2',
    './obrix-home-clean.js?v=20261018obrixorg1',
    './obrix-blindagem-financeiro.js?v=2864a637',
    './obrix-theme-main.js?v=91d02863',
    './obrix-light-polish.js?v=20261020login2',
    './obrix-brand-main.js?v=20261020brandfix4',
    './obrix-password-eye.js?v=20261022loginrescue2',
    './obrix-notas-offline.js?v=20261021offline2',
    './obrix-documentos-main.js?v=20261019docdireto1',
    './obrix-documentos-direto.js?v=20261020viewer1',
    './obrix-ajustes-ui-final.js?v=20261021ui3',
    './obrix-offline-preparo.js?v=20261021prep4'
  ];

  let started=false,done=false,index=0;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const appOpen=()=>{const app=document.getElementById('app'),login=document.getElementById('login');return !!(app&&!app.classList.contains('hidden')&&(!login||login.classList.contains('hidden')))};

  function installEquipeCompat(){
    function g(){
      const s=document.querySelector('#equipe .obrix-equipe-secundario');
      if(!s||s.querySelector('.obrix-atualizar-equipe'))return;
      const a=document.createElement('button');a.type='button';a.className='obrix-atualizar-equipe hidden';a.hidden=true;a.setAttribute('aria-hidden','true');s.appendChild(a);
    }
    g();
    new MutationObserver(g).observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(g,250);setTimeout(g,650);setTimeout(g,1200);
  }

  function loadOne(src){
    return new Promise(resolve=>{
      if([...document.scripts].some(s=>s.src&&new URL(s.src,location.href).pathname===new URL(src,location.href).pathname))return resolve(true);
      const s=document.createElement('script');s.src=src;s.async=false;s.dataset.obrixPosLogin='1';
      s.onload=()=>resolve(true);
      s.onerror=()=>{console.warn('OBRIX: módulo pós-login não carregou',src);resolve(false)};
      document.body.appendChild(s);
    });
  }

  async function start(reason='app-open'){
    if(started||!appOpen())return false;
    started=true;
    document.documentElement.dataset.obrixBoot='modules';
    await sleep(80);
    for(;index<scripts.length;index++){
      await loadOne(scripts[index]);
      if(index===14)installEquipeCompat();
      await sleep(index<8?12:20);
    }
    done=true;
    document.documentElement.dataset.obrixBoot='ready';
    window.dispatchEvent(new CustomEvent('obrix:modules-ready',{detail:{reason,count:scripts.length}}));
    return true;
  }

  function watch(){if(appOpen())start('watch')}
  const app=document.getElementById('app');
  if(app)new MutationObserver(watch).observe(app,{attributes:true,attributeFilter:['class']});
  window.addEventListener('obrix:offline-bootstrap',()=>setTimeout(()=>start('offline-bootstrap'),0));
  window.addEventListener('pageshow',()=>setTimeout(watch,0));
  setTimeout(watch,100);setTimeout(watch,700);setTimeout(watch,1800);
  window.OBRIX_POS_LOGIN_LOADER={start,status:()=>({started,done,index,total:scripts.length,appOpen:appOpen()})};
})();