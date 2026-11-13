(()=>{'use strict';
if(window.__OBRIX_UI_STABILITY)return;window.__OBRIX_UI_STABILITY=true;
const THEME_KEY='obrix_theme';const MODULE_IDS=['obras','diarioMain','financeiroMain','equipe','orcamentosMain','estoqueMain','assinaturaMain'];const ALL_IDS=['inicio','obras','equipe','financeiroMain','estoqueMain','diarioMain','notasMain','documentosMain','orcamentosMain','relatoriosMain','backupMain','configMain','assinaturaMain','offlineCentralMain','offlineQuickMenu','menuMain'];const MAP={diario:'OBRIX_DIARIO',financeiro:'OBRIX_FIN',estoque:'OBRIX_EST',orcamentos:'OBRIX_ORCAMENTOS',relatorios:'OBRIX_RELATORIOS',documentos:'OBRIX_DOCUMENTOS',notas:'OBRIX_NOTAS',backup:'OBRIX_BACKUP',assinatura:'OBRIX_ASSINATURA',config:'OBRIX_CONFIG'};const GROUPS=new Set(['obras','equipe','financeiro','estoque']);const FEATURES=new Set(['diario','orcamentos','relatorios','documentos','notas','backup','assinatura','config']);let opening='',closeTarget='inicio',navigationSerial=0;
function applyEarlyTheme(){try{const saved=localStorage.getItem(THEME_KEY);const t=saved==='dark'||saved==='light'?saved:(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch{}}applyEarlyTheme();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function waitFor(fn,ms=12000){const end=Date.now()+ms;while(Date.now()<end){try{const v=fn();if(v)return v}catch{}await sleep(80)}return null}function setBottom(i){document.querySelectorAll('#app>.bottom button').forEach((b,n)=>b.classList.toggle('active',n===i))}function setCloseTarget(target='inicio'){closeTarget=target==='menu'?'menu':'inicio';document.documentElement.dataset.obrixReturn=closeTarget}function closeToHome(){ALL_IDS.forEach(id=>document.getElementById(id)?.classList.add('hidden'));document.getElementById('inicio')?.classList.remove('hidden');setBottom(0);setCloseTarget('inicio');try{window.OBRIX_OFFLINE_SAFE?.paint?.()}catch{}try{window.atualizarInicio?.()}catch{}scrollTo({top:0,behavior:'smooth'})}function closeCurrent(){if(closeTarget==='menu'&&window.OBRIX_MENU?.open){window.OBRIX_MENU.open();return true}closeToHome();return true}function showCoreGroup(k){if(k!=='obras'&&k!=='equipe')return false;ALL_IDS.forEach(id=>document.getElementById(id)?.classList.add('hidden'));const target=document.getElementById(k);if(!target)return false;target.classList.remove('hidden');setBottom(k==='equipe'?3:1);document.getElementById('bMenu')?.classList.remove('active');scrollTo({top:0,behavior:'smooth'});ensureClose();repairScroll();return true}
function makeClose(main){if(!main||main.querySelector('.obrixModuleClose'))return;const b=document.createElement('button');b.type='button';b.className='obrixModuleClose';b.textContent='Fechar';b.setAttribute('aria-label','Fechar módulo');b.onclick=closeCurrent;const hero=main.querySelector('.hero');if(hero){hero.classList.add('obrixHeroClosable');hero.appendChild(b)}else{const bar=document.createElement('div');bar.className='obrixModuleCloseBar';bar.appendChild(b);main.prepend(bar)}}function ensureClose(){
  // Não criar/remover botões durante a navegação; o visual final controla esses elementos.
}
function repairScroll(){document.documentElement.classList.add('obrixScrollFixed');document.body.classList.add('obrixScrollFixed');document.querySelectorAll('#app main:not(.hidden),#app>section:not(.hidden),[role="dialog"],.modal,.sheet,.drawer').forEach(el=>{if(el.closest?.('#login'))return;el.classList.add('obrixScrollableView')});document.querySelectorAll('.formActions,.modal-actions,.dialog-actions,.sheet-actions').forEach(el=>el.classList.add('obrixSafeActions'))}
function openingState(btn,on){if(!btn)return;if(on){btn.classList.add('obrixOpening');btn.setAttribute('aria-busy','true')}else{btn.classList.remove('obrixOpening');btn.removeAttribute('aria-busy')}}
async function loadGroup(k){const l=window.OBRIX_POS_LOGIN_LOADER;if(!l?.loadGroup)return true;try{return await Promise.race([Promise.resolve(l.loadGroup(k)),sleep(12000).then(()=>false)])}catch{return false}}async function loadFeature(k){const l=window.OBRIX_POS_LOGIN_LOADER;if(!l?.loadFeature)return false;try{return await Promise.race([Promise.resolve(l.loadFeature(k)),sleep(12000).then(()=>false)])}catch{return false}}
async function openOnline(k,btn){
  if(!navigator.onLine)return false;
  const pedido=++navigationSerial;
  const atual=()=>pedido===navigationSerial;
  opening=k;
  openingState(btn,true);
  try{
    if(k==='dashboard'){closeToHome();return true}
    if(k==='offline'){window.OBRIX_MENU?.openOffline?.();return true}
    if(k==='equipe'){
      if(!showCoreGroup('equipe'))throw new Error('Tela de Funcionários indisponível.');
      void loadGroup('equipe').then(async ok=>{
        if(!ok||!atual())return;
        try{await Promise.resolve(window.OBRIX_EQUIPE?.refresh?.())}catch(_){}
        if(!atual())return;
        try{window.renderEquipe?.()}catch(_){}
        repairScroll();
      });
      return true;
    }
    if(k==='obras'){
      // Abrir a tela imediatamente; complementar dados sem reconstruir o cabeçalho.
      if(!showCoreGroup('obras'))throw new Error('Tela de Obras indisponível.');
      try{window.OBRIX_OBRAS_FIEL?.render?.()}catch(e){console.warn('Obras: render inicial indisponível',e)}
      // O carregador atualiza Obras quando recebe complementos; não repetir a renderização.
      void loadGroup('obras').catch(e=>console.warn('Obras: complementos adiados',e));
      return true;
    }
    if(GROUPS.has(k)){
      // Financeiro e Estoque já possuem módulo principal no carregamento base.
      // Não bloquear o primeiro toque esperando filtros, relatórios e offline.
      const objName=k==='financeiro'?'OBRIX_FIN':'OBRIX_EST';
      const complemento=loadGroup(k);
      const mod=await waitFor(()=>window[objName]?.open&&window[objName],8000);
      if(!atual())return false;
      if(!mod)throw new Error('Módulo não terminou de carregar.');
      await Promise.resolve(mod.open());
      if(atual())repairScroll();
      void complemento.then(ok=>{
        if(!ok)console.warn('OBRIX: complementos do módulo indisponíveis:',k);
      }).catch(e=>console.warn('OBRIX: complementos adiados',k,e));
      return true;
    }
    if(FEATURES.has(k)){
      const carregamento=loadFeature(k);
      // O módulo principal pode abrir enquanto complementos terminam de carregar.
      // A sequência original de scripts continua no loader, sem descartar recursos.
      let mod=await Promise.race([
        waitFor(()=>window[MAP[k]]?.open&&window[MAP[k]],10000),
        carregamento.then(()=>window[MAP[k]]?.open?window[MAP[k]]:null)
      ]);
      if(!atual())return false;
      if(!mod){
        const ok=await carregamento;
        if(!atual())return false;
        if(!ok&&typeof window[MAP[k]]?.open!=='function')throw new Error('Módulo não terminou de carregar.');
        mod=await waitFor(()=>window[MAP[k]]?.open&&window[MAP[k]],9000);
      }
      if(!atual())return false;
      if(!mod)throw new Error('Módulo não terminou de carregar.');
      await Promise.resolve(mod.open());
      if(atual())repairScroll();
      return true;
    }
    return false;
  }catch(err){
    if(!atual())return false;
    console.error('OBRIX abertura em um toque:',k,err);
    alert('Não foi possível abrir este módulo agora.');
    return false;
  }finally{
    openingState(btn,false);
    if(atual())opening='';
  }
}
function interceptMenu(e){
  const btn=e.target.closest?.('#menuMain [data-go]');
  if(!btn)return;
  // A ajuda de instalação é um modal local do Android, não uma rota de módulos.
  if(btn.dataset.go==='como_instalar_android')return;
  setCloseTarget('menu');
  if(btn.dataset.go==='equipe'){
    document.documentElement.dataset.obrixEquipeOrigem='menu';
    window.OBRIX_VISUAL_PADRAO_FINAL?.refresh?.();
  }
  if(!navigator.onLine)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  void openOnline(String(btn.dataset.go||''),btn);
}function interceptConfigClose(e){const btn=e.target.closest?.('#configMain .cfgFechar');if(!btn)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();closeCurrent()}
document.addEventListener('click',interceptMenu,true);document.addEventListener('click',interceptConfigClose,true);document.addEventListener('click',e=>{if(e.target.closest?.('.obrixModuleClose'))return;const homeOrigin=e.target.closest?.('#inicio .nav button,#app>.bottom button:not(#bMenu)');
if(homeOrigin)setCloseTarget('inicio');
const rodapeEquipe=e.target.closest?.('#app>.bottom #bEquipe,#app>.bottom button:nth-child(4)');
if(rodapeEquipe){
  document.documentElement.dataset.obrixEquipeOrigem='rodape';
  window.OBRIX_VISUAL_PADRAO_FINAL?.refresh?.();
}const t=e.target.closest?.('#menuMain [data-go],#app>.bottom button,#inicio .nav button,[data-off-go]');if(t){setTimeout(repairScroll,80)}},true);['obrix:modules-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:offline-core-restaurado','obrix:offline-bootstrap','obrix:offline-data-repaired'].forEach(n=>window.addEventListener(n,()=>setTimeout(repairScroll,0)));window.addEventListener('pageshow',()=>setTimeout(repairScroll,100));
setTimeout(repairScroll,250);window.OBRIX_UI_STABILITY={ensureClose,repairScroll,closeToHome,closeCurrent,setCloseTarget,openOnline,showCoreGroup};
})();