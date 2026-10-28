(()=>{'use strict';
if(window.__OBRIX_ACTIONS_CLEAN_V1)return;window.__OBRIX_ACTIONS_CLEAN_V1=true;
function clean(){
  document.querySelectorAll('#obras .actions button,#orcamentosMain .orcActions button').forEach(b=>{if(/^enviar$/i.test(String(b.textContent||'').trim()))b.remove()});
  document.querySelectorAll('#diarioMain .diarioItem,#orcamentosMain .orcCard').forEach(card=>{
    const actions=card.querySelector('.diarioActions,.orcActions');if(!actions)return;
    const old=actions.querySelector('.excluir');if(!old)return;
    old.textContent='Apagar';
    old.classList.remove('excluir','danger','perigo','orcPerigo','diarioPerigo','obrixNoGoldDanger','obrixDarkDanger');
    old.classList.add('obrixApagarRegistro');
  });
}
function ajudaGelo(){
  if(!document.getElementById('obrix-ajuda-gelo-style')){
    const s=document.createElement('style');s.id='obrix-ajuda-gelo-style';s.textContent=`html[data-theme="light"] #suporteMain,html[data-theme="light"] #suporteMain .hero,html[data-theme="light"] #suporteMain .card,html[data-theme="light"] #suporteMain .sectionHead,html[data-theme="light"] #suporteMain .supResumo>div,html[data-theme="light"] #suporteMain .supTicket,html[data-theme="light"] #suporteMain .supMsg,html[data-theme="light"] #suporteMain .supAdminActions button,html[data-theme="light"] #suporteMain .supTabs button,html[data-theme="light"] #suporteMain input,html[data-theme="light"] #suporteMain select,html[data-theme="light"] #suporteMain textarea{background:#eef2f6!important;background-color:#eef2f6!important;background-image:none!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5df!important;box-shadow:none!important}html[data-theme="light"] #suporteMain .supTabs button.active{background:#e5eaf0!important;background-color:#e5eaf0!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5df!important}#suporteMain #supVoltar{display:none!important}`;document.head.appendChild(s);
  }
  document.getElementById('supVoltar')?.remove();
}
function configPerigo(){
  if(!document.getElementById('obrix-config-perigo-style')){
    const s=document.createElement('style');s.id='obrix-config-perigo-style';s.textContent=`
#configMain .obrixConfigPerigo,.obrixConfigPerigo{background:var(--ob-surface-2)!important;background-color:var(--ob-surface-2)!important;background-image:none!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border:2px solid #dc2626!important;box-shadow:none!important}
html[data-theme="dark"] #configMain .obrixConfigModoClaro,html[data-theme="dark"] .obrixConfigModoClaro{background:#f8fafc!important;background-color:#f8fafc!important;background-image:none!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5df!important;box-shadow:none!important}
html[data-theme="dark"] #configMain .obrixConfigModoClaro *,html[data-theme="dark"] .obrixConfigModoClaro *{color:#0f172a!important;-webkit-text-fill-color:#0f172a!important}
html[data-theme="dark"] #configMain .obrixConfigModoClaro .obrixSol,html[data-theme="dark"] .obrixConfigModoClaro .obrixSol{color:#d4a017!important;-webkit-text-fill-color:#d4a017!important}
`;
    document.head.appendChild(s);
  }
  const perigos=new Set(['apagar equipe','apagar obras','apagar financeiro','apagar tudo','excluir conta','excluir conta definitivamente']);
  document.querySelectorAll('#configMain button,#configMain .btn,#configMain [role="button"],.modalBack button,.modal button,[role="dialog"] button').forEach(b=>{
    const t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    b.classList.toggle('obrixConfigPerigo',perigos.has(t));
    const modoClaro=t==='modo claro'||t.includes('modo claro');
    b.classList.toggle('obrixConfigModoClaro',modoClaro);
    if(modoClaro){
      const sol=[...b.querySelectorAll('span,i,svg')].find(e=>/☀|sol|sun/i.test(String(e.textContent||'')+' '+String(e.className?.baseVal||e.className||'')+' '+String(e.getAttribute?.('aria-label')||'')));
      if(sol)sol.classList.add('obrixSol');
    }
  });
}
function apply(){clean();ajudaGelo();configPerigo()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow'].forEach(n=>window.addEventListener(n,()=>setTimeout(apply,0)));
document.addEventListener('click',e=>{const h=e.target.closest?.('#diarioMain .diarioItemHead,#orcamentosMain .orcCardHead');if(h)setTimeout(clean,0);setTimeout(()=>{ajudaGelo();configPerigo()},0)},true);
new MutationObserver(()=>{ajudaGelo();configPerigo()}).observe(document.body,{childList:true,subtree:true});
new MutationObserver(()=>configPerigo()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
window.OBRIX_ACTIONS_CLEAN_V1={apply};
})();