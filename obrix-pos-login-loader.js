(()=>{
  'use strict';
  if(window.__OBRIX_POS_LOGIN_LOADER)return;
  window.__OBRIX_POS_LOGIN_LOADER=true;

  const BASE=[
    './obrix-financeiro-main.js?v=20261019checkval1',
    './obrix-estoque-main.js?v=b777d66c',
    './obrix-equipe-main.js?v=d8d02827',
    './obrix-obras-main.js?v=20261021restauraclassico1',
    './obrix-menu-main.js?v=20261022menuroute1',
    './obrix-nav-active.js?v=20261019docs1',
    './obrix-home-clean.js?v=20261018obrixorg1',
    './obrix-theme-main.js?v=91d02863',
    './obrix-light-polish.js?v=20261020login2',
    './obrix-brand-main.js?v=20261020brandfix4',
    './obrix-ajustes-ui-final.js?v=20261021ui3'
  ];

  const GROUPS={
    financeiro:[
      './obrix-financeiro-offline-basefix.js?v=20261022offlinefix1',
      './obrix-financeiro-offline.js?v=20261022offlinefix1',
      './obrix-financeiro-resumo-obras.js?v=20261020resumo1',
      './obrix-financeiro-resumo-geral.js?v=20261019perf1',
      './obrix-financeiro-protecao-estoque.js?v=357',
      './obrix-financeiro-busca.js?v=20261019filtros3',
      './obrix-financeiro-filtros-layout.js?v=20261019layout3',
      './obrix-financeiro-grafico-receitas.js?v=20261019grafico1',
      './obrix-blindagem-financeiro.js?v=2864a637'
    ],
    equipe:[
      './obrix-equipe-offline.js?v=20261022offlinefix1',
      './obrix-equipe-total-pago.js?v=20261019fix4',
      './obrix-equipe-pagamento-seguro.js?v=20261018dados1',
      './obrix-equipe-lista-vertical.js?v=20261019modelo1',
      './obrix-equipe-diretorio-pessoal.js?v=20261019pessoal1',
      './obrix-equipe-folha-install.js?v=20261019folha2',
      './obrix-equipe-pagar-selecao.js?v=20261019checkpay2'
    ],
    estoque:[
      './obrix-estoque-offline.js?v=20261022offlinefix1',
      './obrix-estoque-saida-obra.js?v=349',
      './obrix-estoque-operacoes-main.js?v=340',
      './obrix-estoque-estorno-final.js?v=350'
    ],
    obras:[
      './obrix-obras-offline.js?v=20261022offlinefix1',
      './obrix-checklist-offline.js?v=20261022offlinefix1',
      './obrix-obras-busca.js?v=20261021semTodas1',
      './obrix-obras-pagamentos.js?v=20261019pagobra1',
      './obrix-relatorio-fotografico.js?v=20261019foto2',
      './obrix-relatorio-fotografico-realtime.js?v=20261020rt2',
      './obrix-checklist-v2.js?v=20261019checkval1'
    ]
  };

  const FEATURES={
    diario:[
      './obrix-offline-diario.js?v=20261022menuroute1',
      './obrix-diario-main.js?v=20261021offline2',
      './obrix-diario-equipe.js?v=20261022loopfix1'
    ],
    orcamentos:[
      './obrix-orcamentos-main.js?v=20261019orc1',
      './obrix-orcamentos-itens-topo.js?v=20261019topo1',
      './obrix-orcamentos-rascunho-print.js?v=20261019draftprint1'
    ],
    relatorios:[
      './obrix-relatorios-v2.js?v=20261018equipe1',
      './obrix-relatorios-mobile-fix.js?v=20261018mobile6',
      './obrix-relatorios-complementos.js?v=20261022menuroute1'
    ],
    documentos:[
      './obrix-documentos-main.js?v=20261019docdireto1',
      './obrix-documentos-direto.js?v=20261020viewer1'
    ],
    notas:[
      './obrix-notas-main.js?v=20261020notas3',
      './obrix-notas-offline.js?v=20261021offline2'
    ],
    backup:[
      './obrix-backup-v2.js?v=20261019obrix1',
      './obrix-backup-import-run.js?v=20261018restore1',
      './obrix-backup-completo.js?v=20261020full2'
    ],
    assinatura:[
      './obrix-assinaturas-main.js?v=408'
    ],
    config:[
      './obrix-config-main.js?v=20261018cfg3',
      './obrix-account-delete.js?v=20261018conta1'
    ],
    offline:[
      './obrix-offline-central-lite.js?v=20261022central-lite1'
    ],
    offlineSync:[
      './obrix-offline-diario.js?v=20261022menuroute1',
      './obrix-notas-offline.js?v=20261021offline2',
      './obrix-checklist-offline.js?v=20261022offlinefix1',
      './obrix-obras-offline.js?v=20261022offlinefix1',
      './obrix-equipe-offline.js?v=20261022offlinefix1',
      './obrix-estoque-offline.js?v=20261022offlinefix1',
      './obrix-offline-conflicts.js?v=20261021resolve1'
    ],
    offlineTools:[
      './obrix-financeiro-offline-basefix.js?v=20261022offlinefix1',
      './obrix-financeiro-offline.js?v=20261022offlinefix1',
      './obrix-home-offline.js?v=20261021offlinehome1',
      './obrix-offline-diagnostico.js?v=20261022diag9',
      './obrix-offline-preparo.js?v=20261022prep7',
      './obrix-offline-retomada-sync.js?v=20261022resume1',
      './obrix-offline-teste.js?v=20261021test4',
      './obrix-offline-acoes-teste.js?v=20261021actions2',
      './obrix-offline-pos-sync.js?v=20261021postsync1',
      './obrix-offline-recuperacao.js?v=20261021recovery1',
      './obrix-offline-historico.js?v=20261021history2',
      './obrix-offline-integridade.js?v=20261022integrity1',
      './obrix-offline-reparo.js?v=20261022repair1',
      './obrix-offline-armazenamento.js?v=20261022storage1',
      './obrix-offline-backup-emergencia.js?v=20261022emergency1',
      './obrix-offline-restaurar-backup.js?v=20261022restore2',
      './obrix-offline-restaurar-previa.js?v=20261022restorepreview2',
      './obrix-offline-restaurar-pos.js?v=20261022restorepost1',
      './obrix-offline-restaurar-auditoria.js?v=20261022restoreaudit1',
      './obrix-offline-aprovacao.js?v=20261022approval7',
      './obrix-offline-certificado.js?v=20261022cert2',
      './obrix-offline-suporte.js?v=20261022support1',
      './obrix-offline-suporte-validar.js?v=20261022supportvalidate1',
      './obrix-offline-homologacao.js?v=20261022homolog1'
    ]
  };

  const groupPromises=new Map(),groupDone=new Set(),featurePromises=new Map(),featureDone=new Set();
  let started=false,baseDone=false,index=0;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const appOpen=()=>{const app=document.getElementById('app'),login=document.getElementById('login');return !!(app&&!app.classList.contains('hidden')&&(!login||login.classList.contains('hidden')))};
  const pathOf=src=>{try{return new URL(src,location.href).pathname}catch(_){return src}};

  function loaded(src){const p=pathOf(src);return [...document.scripts].some(s=>s.src&&pathOf(s.src)===p)}
  function loadOne(src,scope='base'){
    return new Promise(resolve=>{
      if(loaded(src))return resolve(true);
      try{localStorage.setItem('obrix_boot_ultimo_modulo_v2',JSON.stringify({scope,src,at:new Date().toISOString(),state:'loading'}))}catch(_){}
      const s=document.createElement('script');s.src=src;s.async=false;s.dataset.obrixPosLogin=scope;
      s.onload=()=>{try{localStorage.setItem('obrix_boot_ultimo_modulo_v2',JSON.stringify({scope,src,at:new Date().toISOString(),state:'loaded'}))}catch(_){}resolve(true)};
      s.onerror=()=>{console.warn('OBRIX: módulo não carregou',src);try{localStorage.setItem('obrix_boot_ultimo_modulo_v2',JSON.stringify({scope,src,at:new Date().toISOString(),state:'error'}))}catch(_){}resolve(false)};
      document.body.appendChild(s);
    });
  }
  async function yieldUI(){await sleep(30);await new Promise(r=>requestAnimationFrame(()=>r()))}

  async function loadList(list,scope){
    let ok=true;
    for(const src of list){const loadedOk=await loadOne(src,scope);if(!loadedOk)ok=false;await yieldUI()}
    return ok;
  }

  async function loadGroup(name){
    if(groupDone.has(name))return true;
    if(groupPromises.has(name))return groupPromises.get(name);
    const list=GROUPS[name];if(!list)return false;
    const p=(async()=>{
      document.documentElement.dataset.obrixGroup=name;
      const ok=await loadList(list,name);
      if(ok)groupDone.add(name);
      document.documentElement.removeAttribute('data-obrix-group');
      window.dispatchEvent(new CustomEvent('obrix:grupo-pronto',{detail:{name,count:list.length,ok}}));
      return ok;
    })();
    groupPromises.set(name,p);
    try{return await p}finally{groupPromises.delete(name)}
  }

  async function loadFeature(name){
    if(featureDone.has(name))return true;
    if(featurePromises.has(name))return featurePromises.get(name);
    const list=FEATURES[name];if(!list)return false;
    const p=(async()=>{
      document.documentElement.dataset.obrixFeature=name;
      const ok=await loadList(list,'feature:'+name);
      if(ok)featureDone.add(name);
      document.documentElement.removeAttribute('data-obrix-feature');
      window.dispatchEvent(new CustomEvent('obrix:feature-pronto',{detail:{name,count:list.length,ok}}));
      return ok;
    })();
    featurePromises.set(name,p);
    try{return await p}finally{featurePromises.delete(name)}
  }

  function instalarLazyHooks(){
    if(window.__OBRIX_LAZY_HOOKS)return;window.__OBRIX_LAZY_HOOKS=true;
    const oldAbrir=window.abrir;
    if(typeof oldAbrir==='function'){
      window.abrir=function(id){const r=oldAbrir.apply(this,arguments);if(id==='equipe'||id==='obras')setTimeout(()=>loadGroup(id),40);return r};
    }
    const hookOpen=(objName,group)=>{
      const obj=window[objName];if(!obj||typeof obj.open!=='function'||obj.open.__obrixLazy)return;
      const old=obj.open;const fn=function(){const r=old.apply(this,arguments);setTimeout(()=>loadGroup(group),40);return r};fn.__obrixLazy=true;obj.open=fn;
    };
    hookOpen('OBRIX_FIN','financeiro');hookOpen('OBRIX_EST','estoque');
    document.addEventListener('click',e=>{
      const el=e.target.closest?.('button,a,[role="button"],[data-go]');if(!el)return;
      const t=(el.textContent||'').trim().toLowerCase(),go=String(el.dataset?.go||'').toLowerCase();
      let g=null;
      if(t.includes('financeiro')||go==='financeiro')g='financeiro';
      else if(t.includes('equipe')||go==='equipe')g='equipe';
      else if(t.includes('estoque')||go==='estoque')g='estoque';
      else if(t.includes('obra')||go==='obras')g='obras';
      if(g)setTimeout(()=>loadGroup(g),60);
    },true);
  }

  async function start(reason='app-open'){
    if(started||!appOpen())return false;
    started=true;document.documentElement.dataset.obrixBoot='base';
    await sleep(60);
    for(;index<BASE.length;index++){await loadOne(BASE[index],'base');await yieldUI()}
    instalarLazyHooks();baseDone=true;document.documentElement.dataset.obrixBoot='ready';
    window.dispatchEvent(new CustomEvent('obrix:modules-ready',{detail:{reason,count:BASE.length,lazy:true}}));
    return true;
  }

  function watch(){if(appOpen())start('watch')}
  const app=document.getElementById('app');
  if(app)new MutationObserver(watch).observe(app,{attributes:true,attributeFilter:['class']});
  window.addEventListener('obrix:offline-bootstrap',()=>setTimeout(()=>start('offline-bootstrap'),0));
  window.addEventListener('pageshow',()=>setTimeout(watch,0));
  setTimeout(watch,100);setTimeout(watch,700);setTimeout(watch,1800);
  window.OBRIX_POS_LOGIN_LOADER={start,loadGroup,loadFeature,status:()=>({started,baseDone,index,total:BASE.length,groups:[...groupDone],features:[...featureDone],appOpen:appOpen()})};
})();
