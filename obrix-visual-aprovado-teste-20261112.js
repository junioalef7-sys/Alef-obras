(()=>{'use strict';
if(window.__OBRIX_VISUAL_APROVADO_TESTE__)return;
window.__OBRIX_VISUAL_APROVADO_TESTE__=true;
const css="\n/* OBRIX — visual aprovado exclusivamente na prévia */\nhtml[data-theme=\"light\"] body #app{\n --ob-bg:#EEF2F6;--ob-surface:#FFFFFF;--ob-card:#FFFFFF;\n --ob-surface-2:#F8FAFC;--ob-text:#0F172A;--ob-muted:#475569;\n --ob-border:#CBD5E1;--ob-accent:#F97316\n}\nhtml[data-theme=\"dark\"] body #app{\n --ob-bg:#07111B;--ob-surface:#0D1722;--ob-card:#0D1722;\n --ob-surface-2:#111E2C;--ob-text:#F8FAFC;--ob-muted:#B8C7D9;\n --ob-border:#334155;--ob-accent:#F97316\n}\nhtml[data-theme=\"light\"] body #app :is(#inicio,#equipe){\n --obp-text:#0F172A;--obp-muted:#475569;--obp-border:#CBD5E1\n}\nhtml[data-theme=\"dark\"] body #app :is(#inicio,#equipe){\n --obp-text:#F8FAFC;--obp-muted:#B8C7D9;--obp-border:#334155\n}\n/* Indicadores apenas informativos: nunca remover fundo de botão ou item clicável. */\nhtml[data-theme] body #app .kpis>.kpi:not(button):not(a):not([role=\"button\"]),\nhtml[data-theme] body #app #equipe #obpEquipe .obp-indicador,\nhtml[data-theme] body #app #equipe #obpEquipe .obp-person-metrics>div,\nhtml[data-theme] body #app #equipe #obpEquipe .obp-detail-finance>div,\nhtml[data-theme] body #app #resumoGeralMain .rgKpis>div,\nhtml[data-theme] body #app #resumoGeralMain .rgDestaque,\nhtml[data-theme] body #app #resumoGeralMain .rgObraGrid>div,\nhtml[data-theme] body #app #obras .obxResumoGrid>div,\nhtml[data-theme] body #app #obras .obxCardFin>div,\nhtml[data-theme] body #app #obras .obxEmpresaStats>div{\n background:transparent!important;background-color:transparent!important;\n background-image:none!important;border-color:transparent!important;box-shadow:none!important\n}\n/* Financeiro: Receita/Despesa sem fundo nos dois temas, preservar dimensões. */\nhtml[data-theme] body #app #financeiroMain #fmLista [data-fin-card=\"1\"].card.item,\nhtml[data-theme] body #app #financeiroMain #fmLista [data-fin-card=\"1\"]>.grid>.mini{\n background:transparent!important;background-color:transparent!important;\n background-image:none!important;border-color:transparent!important;box-shadow:none!important\n}\nhtml[data-theme] body #app #financeiroMain #fmLista [data-fin-card=\"1\"]+[data-fin-card=\"1\"]{\n border-top:1px solid var(--ob-border)!important\n}\nhtml[data-theme=\"light\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"][data-tipo=\"receita\"] .mini>b{\n color:#15803D!important;-webkit-text-fill-color:#15803D!important\n}\nhtml[data-theme=\"light\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"][data-tipo=\"despesa\"] .mini>b{\n color:#B91C1C!important;-webkit-text-fill-color:#B91C1C!important\n}\nhtml[data-theme=\"dark\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"][data-tipo=\"receita\"] .mini>b{\n color:#4ADE80!important;-webkit-text-fill-color:#4ADE80!important\n}\nhtml[data-theme=\"dark\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"][data-tipo=\"despesa\"] .mini>b{\n color:#FF6B6B!important;-webkit-text-fill-color:#FF6B6B!important\n}\nhtml[data-theme] body #app #financeiroMain #fmLista [data-fin-card=\"1\"]>.muted{\n color:var(--ob-muted)!important;-webkit-text-fill-color:var(--ob-muted)!important\n}\n/* Botões de Editar/Apagar/Estornar preservados como ações clicáveis. */\nhtml[data-theme=\"light\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"] .actions button{\n background:#FFFFFF!important;background-color:#FFFFFF!important;border-color:#CBD5E1!important\n}\nhtml[data-theme=\"dark\"] body #app #financeiroMain #fmLista [data-fin-card=\"1\"] .actions button{\n background:#111E2C!important;background-color:#111E2C!important;border-color:#334155!important\n}\n/* SVG local. Mantém a geometria das abas, ícones com o mesmo traço. */\n#app .obrixApprovedIcon{\n display:inline-flex!important;align-items:center;justify-content:center;\n width:22px;height:22px;flex:none;vertical-align:middle;color:inherit;\n line-height:1;font-size:0!important;-webkit-text-fill-color:initial!important\n}\n#app .obrixApprovedIcon svg{width:100%;height:100%;display:block;fill:none;stroke:currentColor;\n stroke-width:2;stroke-linecap:round;stroke-linejoin:round;pointer-events:none}\n#app>.bottom button .obrixApprovedIcon{width:20px;height:20px;margin-right:3px}\n#app #inicio #obpHome .obp-shortcuts .obrixApprovedIcon{width:27px;height:27px}\n#app #inicio #obpHome .obp-work-icon .obrixApprovedIcon{width:23px;height:23px}\n#app #equipe #obpEquipe .obp-avatar .obrixApprovedIcon{width:22px;height:22px}\n#app #menuMain .opmSide nav .obrixApprovedIcon{width:21px;height:21px}\n#app #inicio #obpHome .obp-activity-ico .obrixApprovedIcon{width:20px;height:20px}\nhtml[data-theme] body #app>.bottom button.active .obrixApprovedIcon{color:#F97316!important}\n@media(prefers-reduced-motion:reduce){#app .obrixApprovedIcon{transition:none!important;animation:none!important}}\n";
const style=document.createElement('style');style.id='obrix-visual-aprovado-20261112';style.textContent=css;document.head.appendChild(style);
const shapes={
 house:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
 hardhat:'<path d="M3 17h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M5 17v-2a7 7 0 0 1 5-6.7V5h4v3.3a7 7 0 0 1 5 6.7v2"/><path d="M12 5v12"/>',
 wallet:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18"/><path d="M16 13h5v4h-5a2 2 0 0 1 0-4z"/>',
 users:'<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 boxes:'<path d="m3 7 5-3 5 3v6l-5 3-5-3zM8 4v6m-5-3 5 3 5-3M13 13l4-2 4 2v6l-4 2-4-2zM17 11v5m-4-3 4 3 4-3"/>',
 notebook:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18m3-13h4m-4 4h4m-4 4h2"/>',
 note:'<path d="M5 3h11l4 4v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M16 3v5h4M8 12h8M8 16h8"/>',
 chart:'<path d="M4 20V11h4v9M10 20V4h4v16M16 20v-7h4v7M2 20h20"/>',
 calculator:'<rect x="4" y="2" width="16" height="20" rx="2"/><rect x="7" y="5" width="10" height="4" rx="1"/><path d="M8 13h1m4 0h1m4 0h-1m-9 4h1m4 0h1m4 0h-1"/>',
 files:'<path d="M8 3H5a2 2 0 0 0-2 2v13"/><path d="M8 3h8l5 5v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M16 3v5h5"/>',
 camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
 checklist:'<path d="m3 7 2 2 4-4M12 7h9M3 17l2 2 4-4M12 17h9"/>',
 banknote:'<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M5 9h1m12 6h1"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18m-13 5 3 3 5-5"/>',
 gift:'<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M2 9h20M12 9v12M12 9H8a3 3 0 1 1 3-3l1 3zm0 0h4a3 3 0 1 0-3-3l-1 3z"/>',
 bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="m19 13 2 1-2 4-2-1-2 1v2H9v-2l-2-1-2 1-2-4 2-1v-2l-2-1 2-4 2 1 2-1V4h6v2l2 1 2-1 2-4-2-1z"/>',
 backup:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
 history:'<path d="M3 12a9 9 0 1 1 3 6.7M3 5v7h7M12 7v5l3 2"/>',
 plus:'<path d="M12 5v14m-7-7h14"/>',
 default:'<circle cx="12" cy="12" r="8"/>'
};
const svg=key=>'<span class="obrixApprovedIcon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">'+(shapes[key]||shapes.default)+'</svg></span>';
const menuMap={inicio:'house',dashboard:'house',obras:'hardhat',financeiro:'wallet',
 equipe:'users',estoque:'boxes',diario:'notebook',orcamentos:'calculator',
 relatorios:'chart',documentos:'files',notas:'note',fotos_recuperadas:'camera',
 backup:'backup',offline:'history',assinatura:'banknote',config:'settings'};
function addTo(button,key){
 if(!button||button.querySelector(':scope>.obrixApprovedIcon'))return;
 button.insertAdjacentHTML('afterbegin',svg(key));
 for(const node of button.childNodes){
  if(node.nodeType!==3)continue;
  const original=node.nodeValue||'';
  node.nodeValue=original.replace(/^\s*[⌂♟≡$▣♙]\s*/u,'');
  break;
 }
}
function fill(el,key){
 if(!el||el.dataset.obrixIconDone==='1')return;
 el.innerHTML=svg(key);el.dataset.obrixIconDone='1';
}
function update(){
 const app=document.getElementById('app');if(!app)return;
 app.querySelectorAll(':scope>.bottom>button').forEach((b,i)=>addTo(b,['house','wallet','users','menu'][i]));
 app.querySelectorAll('#inicio #obpHome .obp-shortcuts button[data-short]').forEach(b=>{
  const m={nova:'plus',notas:'note',relatorios:'chart',foto:'camera',diario:'notebook',equipe:'users'};
  fill(b.querySelector(':scope>span'),m[b.dataset.short]||'note');
 });
 app.querySelectorAll('#inicio #obpHome .obp-work-icon').forEach(e=>fill(e,'hardhat'));
 app.querySelectorAll('#equipe #obpEquipe .obp-avatar').forEach(e=>fill(e,'users'));
 app.querySelectorAll('#menuMain .opmSide nav [data-go]>i').forEach(e=>fill(e,menuMap[e.parentElement.dataset.go]||'default'));
 app.querySelectorAll('#menuMain .opmSide nav .obrixFotoLink>i').forEach(e=>fill(e,'camera'));
 // Ações dos módulos principais: apenas ícones, sem remover ouvintes de clique.
 const actions=[
  ['#financeiroMain #fmReceita','wallet'],
  ['#financeiroMain #fmDespesa','banknote'],
  ['#equipe #obpNovo','plus'],
  ['#equipe #obpPagarEquipe','banknote'],
  ['#equipe #obpHistoricoPag','history'],
  ['#obras .sectionHead button','plus']
 ];
 actions.forEach(([sel,key])=>app.querySelectorAll(sel).forEach(b=>{
  if(!b.querySelector('svg'))addTo(b,key);
 }));
 const features=[
  ['#estoqueMain','/^(?:\+?\s*)?(?:entrada|sa[ií]da)\s+(?:de\s+)?material/i','boxes'],
  ['#estoqueMain','/transfer[eê]ncia/i','boxes'],
  ['#estoqueMain','/(?:\+\s*)?local(?:\s+de\s+estoque)?$/i','plus'],
  ['#diarioMain','/novo\s+di[aá]rio/i','notebook'],
  ['#relatoriosMain','/gerar\s+relat[oó]rio/i','chart'],
  ['#documentosMain','/novo\s+documento/i','files'],
  ['#notasMain','/nova\s+nota/i','note'],
  ['#orcamentosMain','/novo\s+or[cç]amento/i','calculator']
 ];
 features.forEach(([scope,pattern,key])=>app.querySelectorAll(scope+' button').forEach(b=>{
  if(!b.querySelector('svg')&&pattern.test((b.textContent||'').trim()))addTo(b,key);
 }));
 // Em caso de estilos anteriores inline important, manter a cor aprovada
 // sem afetar o valor, a posição ou o tamanho do lançamento.
 const dark=document.documentElement.dataset.theme==='dark';
 app.querySelectorAll('#financeiroMain #fmLista [data-fin-card="1"]>.grid>.mini>b').forEach(b=>{
  const tipo=b.closest('[data-fin-card]')?.dataset.tipo;
  const color=tipo==='receita'?(dark?'#4ADE80':'#15803D'):(dark?'#FF6B6B':'#B91C1C');
  if(b.style.getPropertyValue('color')!==color)b.style.setProperty('color',color,'important');
  if(b.style.getPropertyValue('-webkit-text-fill-color')!==color)b.style.setProperty('-webkit-text-fill-color',color,'important');
 });
 app.querySelectorAll('#inicio #obpHome .obp-activity-ico').forEach(e=>{
  const t=(e.textContent||'').trim();
  const key=/foto|📷|▧/iu.test(t)?'camera':/receita|despesa|R\$|💰|💸/iu.test(t)?'wallet':/di[aá]ria|✓|✔/iu.test(t)?'calendar':'history';
  fill(e,key);
 });
}
let pending=false;
function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;update()})}
function init(){
 const app=document.getElementById('app');if(!app)return;
 schedule();
 const observer=new MutationObserver(records=>{
  if(records.some(r=>r.addedNodes.length||r.removedNodes.length))schedule();
 });
 observer.observe(app,{subtree:true,childList:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 window.addEventListener('obrix:theme-applied',schedule,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
