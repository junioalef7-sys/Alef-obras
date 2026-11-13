/* OBRIX — Prévia de revisão dos cartões e dos ícones, 12/11/2026 */
(()=>{'use strict';
if(window.__obrixPreviewCardsIcons2)return;
window.__obrixPreviewCardsIcons2=true;
document.documentElement.dataset.obrixVisualPlatform=document.currentScript?.dataset.visualPlatform||'root';
const css="\n/* OBRIX teste: recuperar os cartões informativos sem preencher seus fundos. */\nhtml[data-theme] body #app #obras :is(.obxCardFin,.obxResumoGrid)>div,\nhtml[data-theme] body #app #resumoGeralMain :is(.rgKpis,.rgObraGrid,.rgEtapaGrid)>div,\nhtml[data-theme] body #app #resumoGeralMain .rgDestaque,\nhtml[data-theme] body #app #equipe #obpEquipe .obp-indicador,\nhtml[data-theme] body #app #equipe #obpEquipe :is(.obp-person-metrics,.obp-detail-finance)>div,\nhtml[data-theme] body #app #obras .obxEmpresaStats>div,\nhtml[data-theme] body #app .kpis>.kpi:not(button):not(a):not([role=\"button\"]){\n background:transparent!important;background-color:transparent!important;background-image:none!important;\n border:1px solid var(--ob-border,#CBD5E1)!important;border-radius:12px!important;\n box-shadow:none!important;box-sizing:border-box!important;min-width:0!important;max-width:100%!important;\n}\nhtml[data-theme] body #app #resumoGeralMain .rgDestaque.pos{border-color:#86ba96!important}\nhtml[data-theme] body #app #resumoGeralMain .rgDestaque.neg{border-color:#dca3a3!important}\nhtml[data-theme] body #app #resumoGeralMain .rgDestaque.mid{border-color:#9fb9d9!important}\nhtml[data-theme] body #app #resumoGeralMain .rgCard{\n border:1px solid var(--ob-border,#CBD5E1)!important;border-radius:15px!important;box-shadow:none!important\n}\n/* Somente ícones SVG uniformes: o componente não altera nenhuma função. */\n#app .obrixApprovedIcon{display:inline-flex!important;align-items:center;justify-content:center;\n width:22px;height:22px;flex:none;vertical-align:middle;color:inherit;line-height:1;\n font-size:0!important;-webkit-text-fill-color:initial!important}\n#app .obrixApprovedIcon svg{display:block!important;width:100%!important;height:100%!important;\n fill:none!important;stroke:currentColor!important;stroke-width:2!important;\n stroke-linecap:round!important;stroke-linejoin:round!important;pointer-events:none}\n#app>.bottom>button.obrixNavSvgV2{display:inline-flex!important;align-items:center!important;\n justify-content:center!important;gap:4px!important;min-width:0!important;white-space:nowrap!important;text-indent:0!important}\n#app>.bottom>button.obrixNavSvgV2>.obrixApprovedIcon{width:19px!important;height:19px!important;margin:0!important}\n#app>.bottom>button.obrixNavSvgV2>.obrixApprovedLabel{\n font-size:clamp(11px,2.9vw,15px)!important;font-weight:800!important;line-height:1.2!important;white-space:nowrap!important}\n#app>.bottom>button.obrixNavSvgV2::before,#app>.bottom>button.obrixNavSvgV2::after{\n content:none!important;display:none!important\n}\n#app #obras :is(.obxMiniFoto,.obxCapaIcon,.obxResumoTitulo>span,.obxIcone)>.obrixApprovedIcon{\n width:23px!important;height:23px!important\n}\n#app #obras .obxCapaIcon>.obrixApprovedIcon{width:58px!important;height:58px!important}\n#app #menuMain .opmGrid h3>.obrixApprovedIcon,\n#app #resumoGeralMain .rgDestaque small>.obrixApprovedIcon{\n width:19px!important;height:19px!important;margin-right:5px!important\n}\n\n/* Ações perigosas: tema escuro, mantendo o fundo original vermelho. */\nhtml[data-theme=\"dark\"] body #app #diarioMain .diarioActions button.diarioPerigo,\nbody.dark #app #diarioMain .diarioActions button.diarioPerigo{\n background:#B91C1C!important;background-color:#B91C1C!important;\n border:1px solid #991B1B!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;\n box-shadow:none!important;\n}\n/* Android: telas-raiz não têm seta de voltar; outras telas preservam navegação. */\nhtml[data-obrix-visual-platform=\"android\"] body #app:has(> #inicio:not(.hidden))>.top #obrixHeaderVoltar,\nhtml[data-obrix-visual-platform=\"android\"] body #app:has(> #menuMain:not(.hidden))>.top #obrixHeaderVoltar{\n display:none!important;visibility:hidden!important;pointer-events:none!important\n}\n";
const st=document.createElement('style');st.id='obrixPreviewCardsIcons2';
st.textContent=css;document.head.appendChild(st);
const shapes={"house":"<path d=\"m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z\"/>","hardhat":"<path d=\"M3 17h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1 5-6.7V5h4v3.3a7 7 0 0 1 5 6.7v2\"/><path d=\"M12 5v12\"/>","wallet":"<rect x=\"3\" y=\"5\" width=\"18\" height=\"15\" rx=\"2\"/><path d=\"M3 9h18M16 13h5v4h-5a2 2 0 0 1 0-4z\"/>","users":"<path d=\"M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/>","menu":"<path d=\"M4 6h16M4 12h16M4 18h16\"/>","note":"<path d=\"M5 3h11l4 4v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM16 3v5h4M8 12h8M8 16h8\"/>","chart":"<path d=\"M4 20V11h4v9M10 20V4h4v16M16 20v-7h4v7M2 20h20\"/>","notebook":"<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"/><path d=\"M9 3v18m3-13h4m-4 4h4m-4 4h2\"/>","camera":"<path d=\"M3 7h4l2-3h6l2 3h4v13H3z\"/><circle cx=\"12\" cy=\"13\" r=\"4\"/>","files":"<path d=\"M8 3H5a2 2 0 0 0-2 2v13\"/><path d=\"M8 3h8l5 5v12a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM16 3v5h5\"/>","calculator":"<rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\"/><rect x=\"7\" y=\"5\" width=\"10\" height=\"4\" rx=\"1\"/><path d=\"M8 13h1m4 0h1m4 0h-1m-9 4h1m4 0h1m4 0h-1\"/>","checklist":"<path d=\"m3 7 2 2 4-4M12 7h9M3 17l2 2 4-4M12 17h9\"/>","history":"<path d=\"M3 12a9 9 0 1 1 3 6.7M3 5v7h7M12 7v5l3 2\"/>","boxes":"<path d=\"m3 7 5-3 5 3v6l-5 3-5-3zM8 4v6m-5-3 5 3 5-3M13 13l4-2 4 2v6l-4 2-4-2z\"/>","settings":"<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"m19 13 2 1-2 4-2-1-2 1v2H9v-2l-2-1-2 1-2-4 2-1v-2l-2-1 2-4 2 1 2-1V4h6v2l2 1 2-1 2 4-2 1z\"/>","backup":"<ellipse cx=\"12\" cy=\"5\" rx=\"8\" ry=\"3\"/><path d=\"M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3\"/>","banknote":"<rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>"};
const svg=k=>'<span class="obrixApprovedIcon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">'+(shapes[k]||shapes.house)+'</svg></span>';
const nav=[['Início','house'],['Obras','hardhat'],['Financeiro','wallet'],['Equipe','users']];
const side={inicio:'house',dashboard:'house',obras:'hardhat',financeiro:'wallet',equipe:'users',
 estoque:'boxes',diario:'notebook',orcamentos:'calculator',relatorios:'chart',documentos:'files',
 notas:'note',fotos_recuperadas:'camera',backup:'backup',offline:'history',config:'settings',assinatura:'banknote'};
function replaceContent(el,k){
 if(!el)return;
 const old=el.querySelector(':scope>.obrixApprovedIcon');
 if(old&&el.textContent.trim()==='')return;
 el.innerHTML=svg(k);
}
function rebuildNav(el,label,key){
 if(!el)return;
 if(el.querySelector(':scope>.obrixApprovedLabel')?.textContent===label &&
    el.querySelector(':scope>.obrixApprovedIcon')&&el.childNodes.length===2)return;
 // Preserve the actual button and its listeners, replace only legacy icon markup.
 el.innerHTML=svg(key)+'<span class="obrixApprovedLabel">'+label+'</span>';
 el.classList.add('obrixNavSvgV2');
}
function update(){
 const app=document.getElementById('app');if(!app)return;

 app.querySelectorAll('#inicio #obpHome .obp-shortcuts button[data-short]').forEach(b=>{
  const key={nova:'hardhat',notas:'note',relatorios:'chart',foto:'camera',diario:'notebook',equipe:'users'}[b.dataset.short]||'note';
  replaceContent(b.querySelector(':scope>span'),key);
 });
 app.querySelectorAll('#inicio #obpHome .obp-work-icon').forEach(e=>replaceContent(e,'hardhat'));
 // Restituir exatamente o ícone SVG users da versão visual aprovada.
 app.querySelectorAll('#equipe #obpEquipe .obp-avatar').forEach(e=>replaceContent(e,'users'));
 app.querySelectorAll('#equipe #obpEquipe .obp-ind-ico').forEach(e=>{
  const t=e.closest('.obp-indicador')?.textContent||'';
  const key=/vale/i.test(t)?'banknote':/di[aá]ria|falta/i.test(t)?'calendar':
   /bruto|l[ií]quido|pago|pagamento/i.test(t)?'wallet':'chart';
  replaceContent(e,key);
 });

 app.querySelectorAll(':scope>.bottom>button').forEach((b,i)=>{if(nav[i])rebuildNav(b,nav[i][0],nav[i][1])});
 app.querySelectorAll('#menuMain .opmSide nav [data-go]>i').forEach(e=>replaceContent(e,side[e.closest('[data-go]')?.dataset.go]||'files'));
 app.querySelectorAll('#menuMain .opmSide nav .obrixFotoLink>i').forEach(e=>replaceContent(e,'camera'));
 app.querySelectorAll('#menuMain .opmSide nav [data-obrix-resumo-side]>i').forEach(e=>replaceContent(e,'chart'));
 app.querySelectorAll('#menuMain .opmGrid h3').forEach(h=>{
  if(h.dataset.obrixNewIconHeading==='1')return;
  const txt=h.textContent.trim();
  const clean=txt.replace(/^[^A-Za-zÀ-ÿ]+/u,'');
  if(clean===txt)return;
  const key=/obra/i.test(clean)?'hardhat':/equipe/i.test(clean)?'users':
    /financeiro/i.test(clean)?'wallet':/conta/i.test(clean)?'settings':'files';
  for(const node of h.childNodes)if(node.nodeType===3){node.nodeValue=clean;break}
  h.insertAdjacentHTML('afterbegin',svg(key));h.dataset.obrixNewIconHeading='1';
 });
 app.querySelectorAll('#obras .obxCapaIcon:not(.obrixCapaMini)').forEach(e=>replaceContent(e,'hardhat'));
 app.querySelectorAll('#obras .obxResumoTitulo>span').forEach(e=>replaceContent(e,'wallet'));
 app.querySelectorAll('#obras .obxAcao .obxIcone').forEach(e=>{
  const t=(e.closest('button')?.querySelector('b')?.textContent||'').toLowerCase();
  const k=/checklist/.test(t)?'checklist':/di[aá]rio/.test(t)?'notebook':/equipe/.test(t)?'users':
  /despesas|pagamentos/.test(t)?'wallet':/foto/.test(t)?'camera':/documentos/.test(t)?'files':
  /editar/.test(t)?'note':/servi[cç]os/.test(t)?'calculator':'hardhat';
  replaceContent(e,k);
 });
 app.querySelectorAll('#resumoGeralMain .rgDestaque small').forEach(e=>{
  if(e.dataset.obrixIconSummary==='1')return;
  const t=e.textContent||'';
  if(!/^[^A-Za-zÀ-ÿ0-9]/u.test(t))return;
  const cleaned=t.replace(/^[^A-Za-zÀ-ÿ0-9]*/u,'');
  e.textContent=cleaned;e.insertAdjacentHTML('afterbegin',svg('chart'));
  e.dataset.obrixIconSummary='1';
 });
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update()})}
function init(){
 const app=document.getElementById('app');if(!app)return;
 update();
 new MutationObserver(records=>{
  if(records.some(r=>r.addedNodes.length||r.removedNodes.length))schedule()
 }).observe(app,{childList:true,subtree:true});
 document.addEventListener('click',()=>setTimeout(schedule,70),{passive:true});
 window.addEventListener('pageshow',schedule,{passive:true});
 window.addEventListener('obrix:modules-ready',schedule,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
