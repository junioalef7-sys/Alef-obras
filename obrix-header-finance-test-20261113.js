/* OBRIX — Prévia: cabeçalhos sem cortes, sem caixas e financeiro Android fiel. */
(()=>{'use strict';
const platform=document.currentScript?.dataset.screen||'root';
if(window.__obrixHeaderFinanceFix20261113)return;
window.__obrixHeaderFinanceFix20261113=true;
document.documentElement.dataset.obrixScreen=platform;
const style=document.createElement('style');
style.id='obrix-header-finance-fix-20261113';
style.textContent="\n/* OBRIX PREVIEW 2026-11-13 — titulo completo no cabeçalho; cartões de título removidos */\n#app>.top{min-width:0!important;gap:8px!important}\n#app>.top>div:first-child{min-width:0!important;flex:1 1 auto!important}\n#app>.top .brand{display:flex!important;align-items:center!important;gap:clamp(5px,1.6vw,12px)!important;\n width:100%!important;max-width:100%!important;min-width:0!important;flex-wrap:nowrap!important}\n#app>.top .brand .obrixBrandCompact{flex:0 0 auto!important;white-space:nowrap!important}\n#app>.top .brand .obrixTitleDivider{flex:0 0 1px!important;align-self:stretch!important;min-height:25px!important;\n margin:0!important}\n#app>.top .brand .obrixTitleSection{\n display:block!important;flex:1 1 auto!important;min-width:0!important;\n white-space:normal!important;overflow:visible!important;text-overflow:clip!important;\n word-break:normal!important;overflow-wrap:normal!important;hyphens:none!important;\n line-height:1.14!important;font-weight:850!important;letter-spacing:-.035em!important;\n font-size:clamp(14px,3.3vw,22px)!important;\n}\n@media(max-width:440px){\n #app>.top .brand .obrixTitleSection{font-size:clamp(13px,3.6vw,17px)!important}\n #app>.top .brand{gap:6px!important}\n}\n/* Nunca remover botões ou controles no cartão de cabeçalho. */\n#app>main:not(#inicio)>.hero,\n#app>section:not(#inicio)>.hero,\n#app #resumoGeralMain>.rgHead.rgTitleCard{\n background:transparent!important;background-color:transparent!important;background-image:none!important;\n border:0!important;border-color:transparent!important;box-shadow:none!important;\n padding:0!important;min-height:0!important;margin:0 0 6px!important;\n}\n#app>main:not(#inicio)>.hero>:is(h1,h2),\n#app>section:not(#inicio)>.hero>:is(h1,h2),\n#app #resumoGeralMain>.rgHead.rgTitleCard h1{\n display:none!important\n}\n/* Se só continha título e legenda, eliminar o cartão por inteiro. */\n#app>main:not(#inicio)>.hero:not(:has(button,a,input,select,textarea,[role=\"button\"])),\n#app>section:not(#inicio)>.hero:not(:has(button,a,input,select,textarea,[role=\"button\"])){\n display:none!important;margin:0!important;padding:0!important\n}\n/* Resumo por obra pode ter uma seta funcional; preservar ações. */\n#app #resumoGeralMain>.rgHead.rgTitleCard button,\n#app>main:not(#inicio)>.hero button,\n#app>section:not(#inicio)>.hero button{visibility:visible!important}\n/* Android: aplicar dimensões e faixas conforme foto, sem afetar iPhone e PC. */\n@media(max-width:760px){\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"].card.item{\n  box-sizing:border-box!important;width:100%!important;max-width:100%!important;\n  padding:15px!important;margin:0 0 12px!important;\n  border-radius:18px!important;border:1px solid var(--ob-border,#CBD5E1)!important;\n  background:var(--ob-surface,#F8FAFC)!important;background-color:var(--ob-surface,#F8FAFC)!important;\n  background-image:none!important;box-shadow:none!important\n }\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>h3{\n  font-size:18px!important;line-height:1.28!important;margin:0 0 5px!important;\n  font-weight:850!important;overflow-wrap:break-word!important\n }\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.muted{\n  font-size:14px!important;line-height:1.38!important;margin:0 0 9px!important\n }\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid{\n  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;\n  width:100%!important;max-width:100%!important;min-width:0!important;\n  gap:8px!important;margin:8px 0 0!important\n }\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini{\n  grid-column:1!important;grid-row:auto!important;width:100%!important;max-width:100%!important;\n  min-width:0!important;box-sizing:border-box!important;\n  display:flex!important;flex-direction:column!important;align-items:flex-start!important;\n  justify-content:center!important;min-height:62px!important;\n  padding:10px 8px 10px 45px!important;\n  border:1px solid var(--ob-border,#CBD5E1)!important;border-radius:12px!important;\n  background:transparent!important;background-color:transparent!important;\n  background-image:none!important;box-shadow:none!important;\n }\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini>small{\n  display:block!important;align-self:flex-start!important;\n  font-size:14px!important;font-weight:700!important;line-height:1.18!important;\n  margin:0!important;white-space:nowrap!important;text-align:left!important\n }\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini>b{\n  display:block!important;position:static!important;align-self:flex-start!important;\n  font-size:clamp(14px,3.8vw,18px)!important;font-weight:900!important;\n  line-height:1.26!important;margin:2px 0 0!important;white-space:nowrap!important;text-align:left!important;\n }\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.actions{\n  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;\n  width:100%!important;gap:9px!important;margin:10px 0 0!important\n }\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.actions>button{\n  grid-column:auto!important;box-sizing:border-box!important;\n  width:100%!important;min-width:0!important;min-height:42px!important;\n  font-size:16px!important;font-weight:800!important;\n  border:1px solid var(--ob-border,#CBD5E1)!important;border-radius:12px!important;\n  background:var(--ob-surface-2,#FFF)!important\n }\n html[data-obrix-screen=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.actions>button:only-child{\n  grid-column:1/-1!important\n }\n}\n";
document.head.appendChild(style);
const app=()=>document.getElementById('app');
const pages={
 inicio:'Início',obras:'Obras',financeiroMain:'Financeiro',equipe:'Equipe',
 estoqueMain:'Estoque',diarioMain:'Diário de obras',notasMain:'Notas',
 relatoriosMain:'Relatórios',orcamentosMain:'Orçamentos',documentosMain:'Documentos',
 resumoGeralMain:'Resumo geral',menuMain:'Menu',configMain:'Configurações',
 backupMain:'Backup',assinaturaMain:'Assinatura',offlineCentralMain:'Offline',
 checklistMain:'Checklist',fotoMain:'Fotografias',relatorioFotograficoMain:'Relatório fotográfico',
 cadastroMain:'Cadastro',centralMain:'Central',ajudaMain:'Ajuda'
};
function header(){
 const root=app();if(!root)return;
 const brand=root.querySelector(':scope>.top .brand');if(!brand)return;
 let divider=brand.querySelector(':scope>.obrixTitleDivider');
 let title=brand.querySelector(':scope>.obrixTitleSection');
 if(!divider){divider=document.createElement('span');divider.className='obrixTitleDivider';divider.setAttribute('aria-hidden','true');brand.appendChild(divider)}
 if(!title){title=document.createElement('span');title.className='obrixTitleSection';brand.appendChild(title)}
 const active=[...root.children].find(e=>e.id&&Object.prototype.hasOwnProperty.call(pages,e.id)&&
  !e.classList.contains('hidden')&&getComputedStyle(e).display!=='none');
 let name=active?pages[active.id]:'Início';
 if(active?.id==='resumoGeralMain'&&active.querySelector('.rgHead h1')?.textContent.includes('Resumo da Obra'))name='Resumo da obra';
 if(title.textContent!==name)title.textContent=name;
}
function important(el,property,value){
 if(!el)return;
 if(el.style.getPropertyValue(property)!==value||el.style.getPropertyPriority(property)!=='important')
  el.style.setProperty(property,value,'important');
}
function financeCards(){
 if(platform!=='android'||!matchMedia('(max-width:760px)').matches)return;
 const cards=document.querySelectorAll('#app #financeiroMain #fmLista>[data-fin-card="1"].card.item');
 for(const card of cards){
  important(card,'border','1px solid var(--ob-border,#CBD5E1)');
  important(card,'background-color','var(--ob-surface,#F8FAFC)');
  important(card,'padding','15px');
  important(card,'border-radius','18px');
  important(card,'margin-bottom','12px');
  const heading=card.querySelector(':scope>h3'),muted=card.querySelector(':scope>.muted');
  important(heading,'font-size','18px');important(heading,'line-height','1.28');
  important(muted,'font-size','14px');important(muted,'line-height','1.38');
  const grid=card.querySelector(':scope>.grid'),mini=grid?.querySelector(':scope>.mini');
  important(grid,'display','grid');important(grid,'grid-template-columns','repeat(2,minmax(0,1fr))');
  important(grid,'gap','8px');important(grid,'width','100%');
  important(mini,'grid-column','1');important(mini,'width','100%');important(mini,'max-width','100%');
  important(mini,'border','1px solid var(--ob-border,#CBD5E1)');
  important(mini,'border-radius','12px');important(mini,'background-color','transparent');
  important(mini,'display','flex');important(mini,'flex-direction','column');
  important(mini,'align-items','flex-start');important(mini,'justify-content','center');
  important(mini,'padding','10px 8px 10px 45px');important(mini,'min-height','62px');
  const label=mini?.querySelector(':scope>small'),val=mini?.querySelector(':scope>b');
  important(label,'font-size','14px');important(label,'text-align','left');
  important(val,'font-size','clamp(14px,3.8vw,18px)');
  important(val,'display','block');important(val,'position','static');
  important(val,'align-self','flex-start');important(val,'text-align','left');
  important(val,'white-space','nowrap');important(val,'margin','2px 0 0');
  const actions=card.querySelector(':scope>.actions');
  important(actions,'display','grid');
  important(actions,'grid-template-columns','repeat(2,minmax(0,1fr))');
  important(actions,'gap','9px');
  if(actions){
   const buttons=actions.querySelectorAll(':scope>button');
   buttons.forEach(b=>{important(b,'grid-column',buttons.length===1?'1/-1':'auto');
    important(b,'min-width','0');important(b,'width','100%');important(b,'min-height','42px')});
  }
 }
}
let pending=false;
function schedule(){
 if(pending)return;pending=true;
 requestAnimationFrame(()=>{pending=false;header();financeCards()});
}
function install(){
 const root=app();if(!root)return;
 header();financeCards();
 const top=root.querySelector(':scope>.top');
 const obs=new MutationObserver(()=>schedule());
 if(top)obs.observe(top,{childList:true,subtree:false});
 const pageObserver=new MutationObserver(()=>schedule());
 const bind=()=>{
  for(const section of root.children){
   if(section.id&&pages[section.id]&&!section.__obrixHeaderWatch20261113){
    section.__obrixHeaderWatch20261113=true;
    pageObserver.observe(section,{attributes:true,attributeFilter:['class']});
   }
  }
 };
 bind();
 const fo=new MutationObserver(()=>schedule()),current=document.getElementById('fmLista');
 if(current)fo.observe(current,{childList:true,subtree:false});
 const rootObs=new MutationObserver(()=>{bind();schedule()});
 rootObs.observe(root,{childList:true,subtree:false});
 document.addEventListener('click',()=>setTimeout(schedule,80),{passive:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 window.addEventListener('obrix:theme-applied',schedule,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();