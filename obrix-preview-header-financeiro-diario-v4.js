/* OBRIX — Prévia aprovada: cabeçalhos, botões +, Diário escuro e cartões Android. */
(()=>{'use strict';
if(window.__obrixTestPolish20261112v4)return;window.__obrixTestPolish20261112v4=true;
const platform=document.currentScript?.dataset.obrixPlatform||'root';
document.documentElement.dataset.obrixV4=platform;
const sty=document.createElement('style');sty.id='obrix-preview-polish-20261112-v4';
sty.textContent="\n/* OBRIX Visual Preview — cabeçalho superior como esboço aprovado, sem mudanças estruturais. */\nhtml body #app>.top .brand{display:inline-flex!important;align-items:center!important;gap:clamp(9px,2.1vw,15px)!important;white-space:nowrap!important;min-width:0!important}\nhtml body #app>.top .brand .obrixTitleDivider{\n display:inline-block!important;align-self:stretch!important;flex:0 0 1px!important;\n background:var(--ob-border,#CBD5E1)!important;min-height:29px!important;\n margin:0 1px!important\n}\nhtml body #app>.top .brand .obrixTitleSection{\n display:inline-block!important;color:var(--ob-text,#0F172A)!important;\n -webkit-text-fill-color:var(--ob-text,#0F172A)!important;\n font-size:clamp(16px,4.3vw,26px)!important;font-weight:850!important;\n line-height:1.2!important;letter-spacing:-.025em!important;\n overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important\n}\n@media(max-width:380px){\n html body #app>.top .brand{gap:7px!important}\n html body #app>.top .brand .obrixTitleSection{font-size:clamp(14px,4vw,17px)!important}\n}\n/* Evitar dois sinais de + quando os SVG aprovados são usados nas ações de cadastro. */\nhtml body #app :is(#obpNovo,#obxNovaObra,#obras .sectionHead button):has(>.obrixApprovedIcon)::before,\nhtml body #app :is(#obpNovo,#obxNovaObra,#obras .sectionHead button):has(>.obrixApprovedIcon)::after{\n content:none!important;display:none!important\n}\n/* Diário de obras — devolver ao botão de exclusão a cor original no tema escuro. */\nhtml[data-theme=\"dark\"] body #app #diarioMain .diarioItem .diarioActions button.btn.diarioPerigo.excluir,\nhtml[data-theme=\"dark\"] body #app #diarioMain .diarioActions button.diarioPerigo,\nbody.dark #app #diarioMain .diarioActions button.btn.diarioPerigo.excluir{\n background:#B91C1C!important;background-color:#B91C1C!important;\n background-image:none!important;color:#FFFFFF!important;\n -webkit-text-fill-color:#FFFFFF!important;\n border:1px solid #991B1B!important;box-shadow:none!important;\n opacity:1!important\n}\n/* Financeiro: aplicar o cartão Android exatamente no componente, não no iPhone/PC. */\n@media(max-width:760px){\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"].card.item{\n  box-sizing:border-box!important;min-width:0!important;max-width:100%!important;\n  border-radius:18px!important;border:1px solid var(--ob-border,#CBD5E1)!important;\n  background:var(--ob-surface,#F8FAFC)!important;\n  background-color:var(--ob-surface,#F8FAFC)!important;background-image:none!important;\n  padding:15px!important;margin-bottom:12px!important;box-shadow:none!important\n }\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>h3{\n  font-size:18px!important;line-height:1.3!important;\n  margin:0 0 5px!important;overflow-wrap:break-word!important\n }\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.muted{\n  font-size:14px!important;line-height:1.38!important;margin:0 0 9px!important\n }\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid{\n  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;\n  gap:8px!important;width:100%!important;max-width:100%!important;\n  margin:8px 0 0!important\n }\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini{\n  grid-column:1!important;grid-row:auto!important;\n  width:100%!important;min-width:0!important;max-width:100%!important;\n  box-sizing:border-box!important;border:1px solid var(--ob-border,#CBD5E1)!important;\n  border-radius:12px!important;\n  background:transparent!important;background-color:transparent!important;\n  background-image:none!important;box-shadow:none!important;\n  display:flex!important;flex-direction:column!important;\n  align-items:flex-start!important;justify-content:center!important;\n  padding:10px 9px 10px 45px!important;min-height:61px!important\n }\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini>small{\n  font-size:14px!important;font-weight:700!important;\n  line-height:1.2!important;margin:0!important;padding:0!important;\n  text-align:left!important;white-space:nowrap!important\n }\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini>b{\n  font-size:clamp(14px,3.9vw,18px)!important;font-weight:900!important;\n  line-height:1.25!important;position:static!important;align-self:flex-start!important;\n  margin:2px 0 0!important;text-align:left!important;white-space:nowrap!important\n }\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.actions{\n  display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;\n  width:100%!important;gap:9px!important;margin:10px 0 0!important\n }\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.actions>button{\n  box-sizing:border-box!important;width:100%!important;max-width:100%!important;\n  min-width:0!important;min-height:42px!important;grid-column:auto!important;\n  border-radius:12px!important;padding:8px 10px!important;\n  font-size:16px!important;font-weight:800!important;\n  background:var(--ob-surface-2,#FFFFFF)!important;\n  border:1px solid var(--ob-border,#CBD5E1)!important\n }\n html[data-obrix-v4=\"android\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.actions>button:only-child{\n  grid-column:1/-1!important\n }\n}\n";document.head.appendChild(sty);
const pages={
 inicio:'Início',obras:'Obras',financeiroMain:'Financeiro',equipe:'Equipe',
 estoqueMain:'Estoque',diarioMain:'Diário de obras',notasMain:'Notas',
 relatoriosMain:'Relatórios',orcamentosMain:'Orçamentos',documentosMain:'Documentos',
 resumoGeralMain:'Resumo geral',menuMain:'Menu',configMain:'Configurações',
 backupMain:'Backup',assinaturaMain:'Assinatura',offlineCentralMain:'Offline',
 checklistMain:'Checklist',fotoMain:'Fotografias',relatorioFotograficoMain:'Relatório fotográfico',
 cadastroMain:'Cadastro',centralMain:'Central',ajudaMain:'Ajuda'
};
const root=()=>document.getElementById('app');
const visible=e=>e&&!e.classList.contains('hidden')&&getComputedStyle(e).display!=='none';
function header(){
 const app=root();if(!app)return;
 const brand=app.querySelector(':scope>.top .brand');if(!brand)return;
 let sep=brand.querySelector(':scope>.obrixTitleDivider'),label=brand.querySelector(':scope>.obrixTitleSection');
 if(!sep){sep=document.createElement('span');sep.className='obrixTitleDivider';sep.setAttribute('aria-hidden','true');brand.appendChild(sep)}
 if(!label){label=document.createElement('span');label.className='obrixTitleSection';brand.appendChild(label)}
 let active=[...app.children].find(e=>e.id&&Object.prototype.hasOwnProperty.call(pages,e.id)&&visible(e));
 let name=active?pages[active.id]:'Início';
 if(active?.id==='resumoGeralMain'&&active.querySelector('.rgHead h1')?.textContent.includes('Resumo da Obra'))name='Resumo da obra';
 if(label.textContent!==name)label.textContent=name;
}
function singlePlus(){
 const app=root();if(!app)return;
 app.querySelectorAll('#obpNovo,#obxNovaObra,#obras .sectionHead button').forEach(b=>{
  const approvedIcon=b.querySelector(':scope>.obrixApprovedIcon');
  if(!approvedIcon)return;
  // O SVG já representa o sinal +; remover apenas o sinal duplicado textual.
  for(const node of b.childNodes){
   if(node.nodeType!==3)continue;
   const old=node.nodeValue||'';
   const cleaned=old.replace(/^\s*[+＋﹢✚⊕]\s*/u,' ');
   if(cleaned!==old)node.nodeValue=cleaned;
  }
 });
}
const IMPORTANT='important';
function set(el,key,val){
 if(!el)return;
 if(el.style.getPropertyValue(key)!==val||el.style.getPropertyPriority(key)!==IMPORTANT)
  el.style.setProperty(key,val,IMPORTANT);
}
function androidCards(){
 if(platform!=='android'||!matchMedia('(max-width:760px)').matches)return;
 const cards=document.querySelectorAll('#financeiroMain #fmLista>[data-fin-card="1"].card.item');
 for(const c of cards){
  set(c,'background-color','var(--ob-surface,#F8FAFC)');
  set(c,'border','1px solid var(--ob-border,#CBD5E1)');
  set(c,'border-radius','18px');
  set(c,'padding','15px');
  set(c,'margin-bottom','12px');
  const g=c.querySelector(':scope>.grid'),m=g?.querySelector(':scope>.mini');
  set(g,'display','grid');set(g,'grid-template-columns','repeat(2,minmax(0,1fr))');
  set(g,'width','100%');set(g,'max-width','100%');
  set(m,'grid-column','1');set(m,'width','100%');set(m,'max-width','100%');
  set(m,'background-color','transparent');set(m,'border','1px solid var(--ob-border,#CBD5E1)');
  set(m,'display','flex');set(m,'flex-direction','column');
  set(m,'align-items','flex-start');set(m,'justify-content','center');
  set(m,'padding','10px 9px 10px 45px');
  const sm=m?.querySelector(':scope>small'),val=m?.querySelector(':scope>b');
  set(sm,'display','block');set(val,'display','block');
  set(sm,'align-self','flex-start');set(val,'align-self','flex-start');
  set(val,'position','static');set(val,'text-align','left');
  const actions=c.querySelector(':scope>.actions');
  set(actions,'display','grid');set(actions,'grid-template-columns','repeat(2,minmax(0,1fr))');
  if(actions)for(const btn of actions.children)if(btn.tagName==='BUTTON'){
   set(btn,'min-width','0');set(btn,'width','100%');
   set(btn,'grid-column',actions.querySelectorAll(':scope>button').length===1?'1/-1':'auto');
  }
 }
}
let queued=false;
function schedule(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;header();singlePlus();androidCards()});
}
function init(){
 const app=root();if(!app)return;header();singlePlus();androidCards();
 // Notificar apenas alterações relevantes de páginas, novas listas e botões.
 const obs=new MutationObserver(records=>{
  if(records.some(r=>r.type==='childList'||(r.type==='attributes'&&r.attributeName==='class')))schedule();
 });
 obs.observe(app,{childList:true,subtree:false});
 const observePage=e=>{
  if(!e||e.__obrixV4Obs)return;
  e.__obrixV4Obs=true;
  obs.observe(e,{attributes:true,attributeFilter:['class'],childList:false});
 };
 const pagesNodes=[...app.children].filter(n=>n.id&&pages[n.id]);
 pagesNodes.forEach(observePage);
 const fmObserver=new MutationObserver(()=>schedule());
 let fmList;
 function bindFinance(){
  const el=document.getElementById('fmLista');
  if(!el||el===fmList)return;
  fmList=el;fmObserver.observe(el,{childList:true,subtree:false});
 }
 bindFinance();
 const scopeObserver=new MutationObserver(records=>{
  if(records.some(r=>r.addedNodes.length)){
   [...app.children].filter(n=>n.id&&pages[n.id]).forEach(observePage);
   bindFinance();schedule();
  }
 });
 scopeObserver.observe(app,{childList:true,subtree:false});
 document.addEventListener('click',()=>{
  schedule();
  setTimeout(()=>{bindFinance();schedule()},90);
 },{passive:true,capture:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 window.addEventListener('obrix:theme-applied',schedule,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();