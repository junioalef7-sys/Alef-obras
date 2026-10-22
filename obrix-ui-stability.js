(()=>{'use strict';
if(window.__OBRIX_UI_STABILITY)return;window.__OBRIX_UI_STABILITY=true;
const THEME_KEY='obrix_theme';
const MODULE_IDS=['obras','diarioMain','financeiroMain','equipe','orcamentosMain','estoqueMain','assinaturaMain'];
const ALL_IDS=['inicio','obras','equipe','financeiroMain','estoqueMain','diarioMain','notasMain','documentosMain','orcamentosMain','relatoriosMain','backupMain','configMain','assinaturaMain','offlineCentralMain','offlineQuickMenu','menuMain'];
const MAP={diario:'OBRIX_DIARIO',financeiro:'OBRIX_FIN',estoque:'OBRIX_EST',orcamentos:'OBRIX_ORCAMENTOS',relatorios:'OBRIX_RELATORIOS',documentos:'OBRIX_DOCUMENTOS',notas:'OBRIX_NOTAS',backup:'OBRIX_BACKUP',assinatura:'OBRIX_ASSINATURA',config:'OBRIX_CONFIG'};
const GROUPS=new Set(['obras','equipe','financeiro','estoque']);
const FEATURES=new Set(['diario','orcamentos','relatorios','documentos','notas','backup','assinatura','config']);
let opening='',closeTarget='inicio';
function applyEarlyTheme(){try{const saved=localStorage.getItem(THEME_KEY);const t=saved==='dark'||saved==='light'?saved:(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch{}}
applyEarlyTheme();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitFor(fn,ms=12000){const end=Date.now()+ms;while(Date.now()<end){try{const v=fn();if(v)return v}catch{}await sleep(80)}return null}
function setBottom(i){document.querySelectorAll('#app>.bottom button').forEach((b,n)=>b.classList.toggle('active',n===i))}
function setCloseTarget(target='inicio'){closeTarget=target==='menu'?'menu':'inicio';document.documentElement.dataset.obrixReturn=closeTarget}
function closeToHome(){ALL_IDS.forEach(id=>document.getElementById(id)?.classList.add('hidden'));document.getElementById('inicio')?.classList.remove('hidden');setBottom(0);setCloseTarget('inicio');try{window.OBRIX_OFFLINE_SAFE?.paint?.()}catch{}try{window.atualizarInicio?.()}catch{}scrollTo({top:0,behavior:'smooth'})}
function closeCurrent(){if(closeTarget==='menu'&&window.OBRIX_MENU?.open){window.OBRIX_MENU.open();return true}closeToHome();return true}
function showCoreGroup(k){
  if(k!=='obras'&&k!=='equipe')return false;
  ALL_IDS.forEach(id=>document.getElementById(id)?.classList.add('hidden'));
  const target=document.getElementById(k);if(!target)return false;
  target.classList.remove('hidden');
  setBottom(k==='equipe'?2:-1);
  document.getElementById('bMenu')?.classList.remove('active');
  scrollTo({top:0,behavior:'smooth'});
  ensureClose();
  return true
}
function makeClose(main){if(!main||main.querySelector('.obrixModuleClose'))return;const b=document.createElement('button');b.type='button';b.className='obrixModuleClose';b.textContent='Fechar';b.setAttribute('aria-label','Fechar módulo');b.onclick=closeCurrent;const hero=main.querySelector('.hero');if(hero){hero.classList.add('obrixHeroClosable');hero.appendChild(b)}else{const bar=document.createElement('div');bar.className='obrixModuleCloseBar';bar.appendChild(b);main.prepend(bar)}}
function ensureClose(){MODULE_IDS.forEach(id=>makeClose(document.getElementById(id)))}
function openingState(btn,on){if(!btn)return;if(on){btn.classList.add('obrixOpening');btn.setAttribute('aria-busy','true');if(btn.dataset.obrixOldHtml==null)btn.dataset.obrixOldHtml=btn.innerHTML;const label=btn.querySelector('b')||btn.querySelector('span');if(label)label.textContent='Abrindo...'}else{btn.classList.remove('obrixOpening');btn.removeAttribute('aria-busy');if(btn.dataset.obrixOldHtml!=null){btn.innerHTML=btn.dataset.obrixOldHtml;delete btn.dataset.obrixOldHtml}}}
async function loadGroup(k){const l=window.OBRIX_POS_LOGIN_LOADER;if(!l?.loadGroup)return true;try{return await Promise.race([Promise.resolve(l.loadGroup(k)),sleep(12000).then(()=>false)])}catch{return false}}
async function loadFeature(k){const l=window.OBRIX_POS_LOGIN_LOADER;if(!l?.loadFeature)return false;try{return await Promise.race([Promise.resolve(l.loadFeature(k)),sleep(12000).then(()=>false)])}catch{return false}}
async function openOnline(k,btn){if(!navigator.onLine)return false;if(opening)return true;opening=k;openingState(btn,true);try{
  if(k==='dashboard'){closeToHome();return true}
  if(k==='offline'){window.OBRIX_MENU?.openOffline?.();return true}
  if(k==='equipe'){
    if(!showCoreGroup('equipe'))throw new Error('Tela de Funcionários indisponível.');
    void loadGroup('equipe').then(async ok=>{
      if(!ok){console.warn('OBRIX: complementos da Equipe não carregaram; mantendo tela básica.');return}
      try{await Promise.resolve(window.OBRIX_EQUIPE?.refresh?.())}catch(e){console.warn('Equipe: atualização complementar indisponível',e)}
      try{window.renderEquipe?.()}catch(e){console.warn('Equipe: render complementar indisponível',e)}
      setTimeout(ensureClose,0);
    });
    return true
  }
  if(GROUPS.has(k)){
    const ok=await loadGroup(k);
    if(!ok&&k!=='obras')throw new Error('Complementos do módulo não terminaram de carregar.');
    if(k==='obras'){
      const fn=await waitFor(()=>typeof window.abrir==='function'&&window.abrir,5000);
      if(fn){try{fn(k)}catch(e){if(!showCoreGroup(k))throw e}}
      else if(!showCoreGroup(k))throw new Error('Navegação indisponível.');
      ensureClose();return true
    }
    const objName=k==='financeiro'?'OBRIX_FIN':'OBRIX_EST';const mod=await waitFor(()=>window[objName]?.open&&window[objName],8000);if(!mod)throw new Error('Módulo não terminou de carregar.');await Promise.resolve(mod.open());ensureClose();return true
  }
  if(FEATURES.has(k)){
    const ok=await loadFeature(k);if(!ok)throw new Error('Módulo não terminou de carregar.');
    const mod=await waitFor(()=>window[MAP[k]]?.open&&window[MAP[k]],9000);if(!mod)throw new Error('Módulo não terminou de carregar.');await Promise.resolve(mod.open());ensureClose();return true
  }
  return false
}catch(err){console.error('OBRIX abertura em um toque:',k,err);alert('Não foi possível abrir este módulo agora.');return false}finally{openingState(btn,false);opening=''}}
function interceptMenu(e){const btn=e.target.closest?.('#menuMain [data-go]');if(!btn)return;setCloseTarget('menu');if(!navigator.onLine)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openOnline(String(btn.dataset.go||''),btn)}
function interceptConfigClose(e){const btn=e.target.closest?.('#configMain .cfgFechar');if(!btn)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();closeCurrent()}
document.addEventListener('click',interceptMenu,true);
document.addEventListener('click',interceptConfigClose,true);
document.addEventListener('click',e=>{if(e.target.closest?.('.obrixModuleClose'))return;const homeOrigin=e.target.closest?.('#inicio .nav button,#app>.bottom button:not(#bMenu)');if(homeOrigin)setCloseTarget('inicio');const t=e.target.closest?.('[data-go],[data-off-go],#bInicio,#bEquipe,#bMenu,.bottom button');if(t){setTimeout(ensureClose,0);setTimeout(ensureClose,350);setTimeout(ensureClose,1200)}},true);
['obrix:modules-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:offline-core-restaurado','obrix:offline-bootstrap','obrix:offline-data-repaired'].forEach(n=>window.addEventListener(n,()=>setTimeout(ensureClose,0)));
window.addEventListener('pageshow',()=>setTimeout(ensureClose,100));
const css=document.createElement('style');css.id='obrixUiStabilityCss';css.textContent=`
.obrixHeroClosable{position:relative!important;padding-right:105px!important}.obrixModuleClose{position:absolute;right:14px;top:14px;border:1px solid rgba(255,255,255,.34);background:rgba(255,255,255,.12);color:#fff;border-radius:11px;padding:9px 13px;font-weight:900;z-index:4}.obrixModuleCloseBar{display:flex;justify-content:flex-end;margin:0 0 10px}.obrixModuleCloseBar .obrixModuleClose{position:static;background:#0f172a;color:#fff;border:0}.obrixOpening{pointer-events:none!important;opacity:.92!important}
html[data-theme="dark"] body{background:#070d14!important;color:#f8fafc!important}html[data-theme="dark"] .card,html[data-theme="dark"] .kpi,html[data-theme="dark"] .mini,html[data-theme="dark"] .modal{background:#0d1722!important;color:#f8fafc!important;border-color:#2a3a4d!important}html[data-theme="dark"] .muted,html[data-theme="dark"] small{color:#aeb9c8!important}html[data-theme="dark"] #menuMain,html[data-theme="dark"] .opmShell,html[data-theme="dark"] .opmSide,html[data-theme="dark"] .opmContent{background:#07111f!important;color:#f8fafc!important;border-color:#26384d!important}html[data-theme="dark"] .opmSide nav button,html[data-theme="dark"] .opmSide nav button i,html[data-theme="dark"] .opmSide nav button span{background:transparent!important;color:#e7edf5!important}html[data-theme="dark"] .opmSide nav button.active{background:#17263a!important;color:#f3bd55!important}html[data-theme="dark"] .opmSide nav button.active i,html[data-theme="dark"] .opmSide nav button.active span{color:#f3bd55!important}html[data-theme="dark"] .opmVersion,html[data-theme="dark"] .opmProfile,html[data-theme="dark"] .opmGrid article,html[data-theme="dark"] .opmGrid .account{background:#0d1928!important;color:#f8fafc!important;border-color:#2a3a4d!important}html[data-theme="dark"] .opmGrid article button,html[data-theme="dark"] .opmGrid article button b{background:transparent!important;color:#f8fafc!important;border-color:#2a3a4d!important}html[data-theme="dark"] .opmGrid article button small{color:#aeb9c8!important}html[data-theme="dark"] #menuMain .opmFoot #menuSair{background:#0d1928!important;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important;border:1px solid #2a3a4d!important;box-shadow:none!important}html[data-theme="dark"] #menuMain .opmFoot #menuSair:active{background:#132235!important;color:#fff!important;-webkit-text-fill-color:#fff!important}html[data-theme="dark"] .opmLoading,html[data-theme="dark"] .obrixOpening,html[data-theme="dark"] #menuMain button:disabled{background:#152337!important;color:#e9eef5!important;opacity:.94!important;-webkit-text-fill-color:#e9eef5!important}html[data-theme="dark"] input,html[data-theme="dark"] select,html[data-theme="dark"] textarea{background:#0b141e!important;color:#f8fafc!important;border-color:#2a3a4d!important}html[data-theme="dark"] .bottom{background:rgba(7,13,20,.96)!important;border-color:#2a3a4d!important}html[data-theme="dark"] .bottom button{color:#aeb9c8!important}html[data-theme="dark"] .bottom button.active{color:#f3bd55!important;background:rgba(243,189,85,.14)!important}.obrixModuleClose:active{transform:scale(.98)}@media(max-width:520px){.obrixHeroClosable{padding-right:92px!important}.obrixModuleClose{right:10px;top:10px;padding:8px 11px;font-size:13px}}
`;document.head.appendChild(css);
setTimeout(ensureClose,250);setTimeout(ensureClose,1200);setTimeout(ensureClose,3500);
window.OBRIX_UI_STABILITY={ensureClose,closeToHome,closeCurrent,setCloseTarget,openOnline,showCoreGroup};
})();