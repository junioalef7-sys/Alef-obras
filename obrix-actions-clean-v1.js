(()=>{'use strict';
if(window.__OBRIX_ACTIONS_CLEAN_V1)return;window.__OBRIX_ACTIONS_CLEAN_V1=true;
function clean(){
  document.querySelectorAll('#obras .actions button,#orcamentosMain .orcActions button').forEach(b=>{if(/^enviar$/i.test(String(b.textContent||'').trim()))b.remove()});
  document.querySelectorAll('#diarioMain .diarioItem,#orcamentosMain .orcCard').forEach(card=>{const actions=card.querySelector('.diarioActions,.orcActions');if(!actions)return;const old=actions.querySelector('.excluir');if(!old)return;old.textContent='Apagar';old.classList.remove('excluir','danger','perigo','orcPerigo','diarioPerigo','obrixNoGoldDanger','obrixDarkDanger');old.classList.add('obrixApagarRegistro')});
}
function ajudaGelo(){if(!document.getElementById('obrix-ajuda-gelo-style')){const s=document.createElement('style');s.id='obrix-ajuda-gelo-style';s.textContent=`html[data-theme="light"] #suporteMain,html[data-theme="light"] #suporteMain .hero,html[data-theme="light"] #suporteMain .card,html[data-theme="light"] #suporteMain .sectionHead,html[data-theme="light"] #suporteMain .supResumo>div,html[data-theme="light"] #suporteMain .supTicket,html[data-theme="light"] #suporteMain .supMsg,html[data-theme="light"] #suporteMain .supAdminActions button,html[data-theme="light"] #suporteMain .supTabs button,html[data-theme="light"] #suporteMain input,html[data-theme="light"] #suporteMain select,html[data-theme="light"] #suporteMain textarea{background:#eef2f6!important;background-color:#eef2f6!important;background-image:none!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5df!important;box-shadow:none!important}html[data-theme="light"] #suporteMain .supTabs button.active{background:#e5eaf0!important;background-color:#e5eaf0!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5df!important}#suporteMain #supVoltar{display:none!important}`;document.head.appendChild(s)}document.getElementById('supVoltar')?.remove()}
function imp(el,p,v){el.style.setProperty(p,v,'important')}
function configPerigo(){
  const perigos=new Set(['apagar equipe','apagar obras','apagar financeiro','apagar tudo','excluir conta','excluir conta definitivamente']);
  document.querySelectorAll('#configMain button,#configMain .btn,#configMain [role="button"],.modalBack button,.modal button,[role="dialog"] button').forEach(b=>{
    const t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    if(perigos.has(t)){
      b.classList.add('obrixConfigPerigo');
      imp(b,'background','var(--ob-surface-2)');imp(b,'background-color','var(--ob-surface-2)');imp(b,'background-image','none');imp(b,'color','#dc2626');imp(b,'-webkit-text-fill-color','#dc2626');imp(b,'border','2px solid #dc2626');imp(b,'box-shadow','none');
    }
  });
}
function financeiroCores(){const root=document.getElementById('financeiroMain');if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{const t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(t.includes('receita')){b.classList.add('obrixFinReceita');imp(b,'background','#16a34a');imp(b,'background-color','#16a34a');imp(b,'background-image','none');imp(b,'color','#fff');imp(b,'-webkit-text-fill-color','#fff');imp(b,'border-color','#16a34a')}else if(t.includes('despesa')){b.classList.add('obrixFinDespesa');imp(b,'background','#dc2626');imp(b,'background-color','#dc2626');imp(b,'background-image','none');imp(b,'color','#fff');imp(b,'-webkit-text-fill-color','#fff');imp(b,'border-color','#dc2626')}})}
function apply(){clean();ajudaGelo();configPerigo();financeiroCores()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow','obrix:theme-applied'].forEach(n=>window.addEventListener(n,()=>setTimeout(apply,0)));
document.addEventListener('click',e=>{const h=e.target.closest?.('#diarioMain .diarioItemHead,#orcamentosMain .orcCardHead');if(h)setTimeout(clean,0);setTimeout(()=>{ajudaGelo();configPerigo();financeiroCores()},0);setTimeout(()=>{configPerigo();financeiroCores()},150)},true);
new MutationObserver(()=>{ajudaGelo();configPerigo();financeiroCores()}).observe(document.body,{childList:true,subtree:true});new MutationObserver(()=>setTimeout(()=>{configPerigo();financeiroCores()},0)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});window.OBRIX_ACTIONS_CLEAN_V1={apply};
})();