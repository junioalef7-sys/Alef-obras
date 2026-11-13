(()=>{'use strict';
if(window.__OBRIX_ANDROID_VISUAL_FIEL_20261112__)return;
window.__OBRIX_ANDROID_VISUAL_FIEL_20261112__=true;
const css="\n/* Android — correções finais da proposta aprovada.\n   Não se aplicam à versão iPhone ou desktop. */\n@media(max-width:760px){\n /* A primeira tela e o Menu são páginas-raiz, não possuem ação Voltar. */\n html body #app:has(> #inicio:not(.hidden)) > .top :is(#obrixHeaderVoltar,.obrixHeaderVoltar,button[aria-label=\"Voltar\"],button[title=\"Voltar\"],button.obrixBackNormalized),\n html body #app:has(> #menuMain:not(.hidden)) > .top :is(#obrixHeaderVoltar,.obrixHeaderVoltar,button[aria-label=\"Voltar\"],button[title=\"Voltar\"],button.obrixBackNormalized),\n html body #app:has(> #offlineMenuFallbackMain:not(.hidden)) > .top :is(#obrixHeaderVoltar,.obrixHeaderVoltar,button[aria-label=\"Voltar\"],button[title=\"Voltar\"],button.obrixBackNormalized),\n html body #app #menuMain :is(.opmBack,.opmVoltar,button[aria-label=\"Voltar\"],button[title=\"Voltar\"]){\n   display:none!important;visibility:hidden!important;opacity:0!important;\n   pointer-events:none!important;width:0!important;height:0!important;\n   min-width:0!important;margin:0!important;padding:0!important;border:0!important;\n }\n /* Os quatro botões inferiores mantêm o tamanho e o clique, agora só com SVG. */\n html body #app > .bottom > button{\n   display:flex!important;align-items:center!important;justify-content:center!important;\n   gap:3px!important;min-width:0!important;text-indent:0!important;\n   white-space:nowrap!important;\n }\n html body #app > .bottom > button > .obrixApprovedIcon{\n   width:19px!important;height:19px!important;flex:0 0 19px!important;margin:0!important;\n }\n html body #app > .bottom > button > .obrixApprovedLabel{\n   display:inline!important;font-size:clamp(11px,3vw,14px)!important;\n   font-weight:800!important;line-height:1.2!important;white-space:nowrap!important;\n }\n html body #app > .bottom > button::before,\n html body #app > .bottom > button::after{content:none!important;display:none!important}\n /* Cartões externos do Financeiro com superfície e contorno da foto aprovada.\n    A faixa interna Receita/Despesa NÃO possui preenchimento em nenhum tema. */\n html[data-theme=\"light\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"].card.item{\n   background:#F8FAFC!important;background-color:#F8FAFC!important;\n   background-image:none!important;border:1px solid #CBD5E1!important;\n   box-shadow:none!important;\n }\n html[data-theme=\"dark\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"].card.item{\n   background:#0D1722!important;background-color:#0D1722!important;\n   background-image:none!important;border:1px solid #334155!important;\n   box-shadow:none!important;\n }\n html[data-theme] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini{\n   background:transparent!important;background-color:transparent!important;\n   background-image:none!important;\n   border:1px solid var(--ob-border)!important;\n   box-shadow:none!important;\n }\n /* Valores abaixo do título, sem alterar a largura que já foi corrigida. */\n html[data-theme] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini{\n   display:flex!important;flex-direction:column!important;\n   align-items:flex-start!important;justify-content:center!important;\n }\n html[data-theme] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini>small{\n   display:block!important;align-self:flex-start!important;\n   text-align:left!important;line-height:1.25!important;\n   margin:0!important;color:var(--ob-muted)!important;-webkit-text-fill-color:var(--ob-muted)!important;\n }\n html[data-theme] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"]>.grid>.mini>b{\n   display:block!important;align-self:flex-start!important;\n   position:static!important;width:auto!important;max-width:100%!important;\n   text-align:left!important;margin:2px 0 0!important;white-space:nowrap!important;\n }\n html[data-theme=\"light\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"][data-tipo=\"receita\"] .mini>b{\n   color:#15803D!important;-webkit-text-fill-color:#15803D!important\n }\n html[data-theme=\"light\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"][data-tipo=\"despesa\"] .mini>b{\n   color:#B91C1C!important;-webkit-text-fill-color:#B91C1C!important\n }\n html[data-theme=\"dark\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"][data-tipo=\"receita\"] .mini>b{\n   color:#4ADE80!important;-webkit-text-fill-color:#4ADE80!important\n }\n html[data-theme=\"dark\"] body #app #financeiroMain #fmLista>[data-fin-card=\"1\"][data-tipo=\"despesa\"] .mini>b{\n   color:#FF6B6B!important;-webkit-text-fill-color:#FF6B6B!important\n }\n /* Indicadores de leitura: sem superfície nos dois temas. */\n html[data-theme] body #app #equipe #obpEquipe .obp-indicador,\n html[data-theme] body #app #equipe #obpEquipe .obp-person-metrics>div,\n html[data-theme] body #app #obras .obxResumoGrid>div,\n html[data-theme] body #app #resumoGeralMain .rgKpis>div{\n   background:transparent!important;background-color:transparent!important;\n   background-image:none!important;border-color:transparent!important;box-shadow:none!important;\n }\n /* Não esconder os ícones SVG aprovados com regras legadas de fonte. */\n html body #app .obrixApprovedIcon svg{\n   display:block!important;visibility:visible!important;\n   fill:none!important;stroke:currentColor!important;\n   stroke-width:2!important\n }\n}\n";
const style=document.createElement('style');
style.id='obrix-android-visual-fiel-aprovado';
style.textContent=css;document.head.appendChild(style);
const shapes={"house":"<path d=\"m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z\"/>","hardhat":"<path d=\"M3 17h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"/><path d=\"M5 17v-2a7 7 0 0 1 5-6.7V5h4v3.3a7 7 0 0 1 5 6.7v2\"/><path d=\"M12 5v12\"/>","wallet":"<rect x=\"3\" y=\"5\" width=\"18\" height=\"15\" rx=\"2\"/><path d=\"M3 9h18\"/><path d=\"M16 13h5v4h-5a2 2 0 0 1 0-4z\"/>","users":"<path d=\"M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/>","menu":"<path d=\"M4 6h16M4 12h16M4 18h16\"/>","boxes":"<path d=\"m3 7 5-3 5 3v6l-5 3-5-3zM8 4v6m-5-3 5 3 5-3M13 13l4-2 4 2v6l-4 2-4-2zM17 11v5m-4-3 4 3 4-3\"/>","notebook":"<rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"/><path d=\"M9 3v18m3-13h4m-4 4h4m-4 4h2\"/>","note":"<path d=\"M5 3h11l4 4v14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z\"/><path d=\"M16 3v5h4M8 12h8M8 16h8\"/>","chart":"<path d=\"M4 20V11h4v9M10 20V4h4v16M16 20v-7h4v7M2 20h20\"/>","calculator":"<rect x=\"4\" y=\"2\" width=\"16\" height=\"20\" rx=\"2\"/><rect x=\"7\" y=\"5\" width=\"10\" height=\"4\" rx=\"1\"/><path d=\"M8 13h1m4 0h1m4 0h-1m-9 4h1m4 0h1m4 0h-1\"/>","files":"<path d=\"M8 3H5a2 2 0 0 0-2 2v13\"/><path d=\"M8 3h8l5 5v12a2 2 0 0 1-2 2H9a2 2 0 0 1 2-2z\"/><path d=\"M16 3v5h5\"/>","camera":"<path d=\"M3 7h4l2-3h6l2 3h4v13H3z\"/><circle cx=\"12\" cy=\"13\" r=\"4\"/>","calendar":"<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 3v4m10-4v4M3 10h18m-13 5 3 3 5-5\"/>","calendarx":"<rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M7 3v4m10-4v4M3 10h18m6 4 6 6m0-6-6 6\"/>","gift":"<rect x=\"3\" y=\"9\" width=\"18\" height=\"12\" rx=\"1\"/><path d=\"M2 9h20M12 9v12M12 9H8a3 3 0 1 1 3-3l1 3zm0 0h4a3 3 0 1 0-3-3l-1 3z\"/>","banknote":"<rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M5 9h1m12 6h1\"/>","history":"<path d=\"M3 12a9 9 0 1 1 3 6.7M3 5v7h7M12 7v5l3 2\"/>","backup":"<ellipse cx=\"12\" cy=\"5\" rx=\"8\" ry=\"3\"/><path d=\"M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3\"/>","settings":"<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"m19 13 2 1-2 4-2-1-2 1v2H9v-2l-2-1-2 1-2-4 2-1v-2l-2-1 2-4 2 1 2-1V4h6v2l2 1 2-4-2-1z\"/>","plus":"<path d=\"M12 5v14m-7-7h14\"/>"};
const icon=(key)=>'<span class="obrixApprovedIcon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">'+(shapes[key]||shapes.house)+'</svg></span>';
const navItems=[['Início','house'],['Financeiro','wallet'],['Equipe','users'],['Menu','menu']];
const menuMap={dashboard:'house',inicio:'house',obras:'hardhat',equipe:'users',
 financeiro:'wallet',estoque:'boxes',diario:'notebook',orcamentos:'calculator',
 relatorios:'chart',documentos:'files',fotos_recuperadas:'camera',notas:'note',
 backup:'backup',offline:'history',assinatura:'banknote',config:'settings',
 como_instalar_android:'plus'};
function canonicalNav(button,label,key){
 if(!button)return;
 const svgs=button.querySelectorAll(':scope>.obrixApprovedIcon');
 const labels=button.querySelectorAll(':scope>.obrixApprovedLabel');
 if(svgs.length===1&&labels.length===1&&button.textContent.trim()===label)return;
 // A substituição só altera filhos do botão, nunca o elemento nem seu onclick.
 button.innerHTML=icon(key)+'<span class="obrixApprovedLabel">'+label+'</span>';
}
function fill(el,key){
 if(!el)return;
 if(el.querySelector(':scope>.obrixApprovedIcon')&&el.textContent.trim()==='')return;
 el.innerHTML=icon(key);
 el.dataset.obrixIconDone='1';
}
function replaceHeading(h,key){
 if(!h||h.dataset.obrixApprovedHeading==='1')return;
 for(const node of h.childNodes){
  if(node.nodeType!==3)continue;
  const text=node.nodeValue||'';
  const cleaned=text.replace(/^[\s🏗👥💰📁⚙📦📋📷📝📊]+/u,'').trimStart();
  if(cleaned===text)continue;
  node.nodeValue=' '+cleaned;
  h.insertAdjacentHTML('afterbegin',icon(key));
  h.dataset.obrixApprovedHeading='1';
  break;
 }
}
function update(){
 const app=document.getElementById('app');if(!app)return;
 app.querySelectorAll(':scope>.bottom>button').forEach((b,i)=>{
  if(navItems[i])canonicalNav(b,navItems[i][0],navItems[i][1]);
 });
 app.querySelectorAll('#menuMain .opmSide nav [data-go]>i').forEach(e=>{
  fill(e,menuMap[e.closest('[data-go]')?.dataset.go]||'house');
 });
 app.querySelectorAll('#menuMain .opmSide nav .obrixFotoLink>i').forEach(e=>fill(e,'camera'));
 const sections={
  'Gestão de Obras':'hardhat','Equipe e Materiais':'users',
  'Financeiro':'wallet','Documentos e Dados':'files','Conta':'settings'
 };
 app.querySelectorAll('#menuMain .opmGrid h3').forEach(h=>{
  const name=h.textContent.replace(/^[^A-Za-zÀ-ÿ]*/u,'').trim();
  replaceHeading(h,sections[name]||'files');
 });
 app.querySelectorAll('#inicio #obpHome .obp-shortcuts button[data-short]').forEach(b=>{
  const map={nova:'plus',notas:'note',relatorios:'chart',foto:'camera',diario:'notebook',equipe:'users'};
  fill(b.querySelector(':scope>span'),map[b.dataset.short]||'note');
 });
 app.querySelectorAll('#inicio #obpHome .obp-work-icon').forEach(e=>fill(e,'hardhat'));
 app.querySelectorAll('#equipe #obpEquipe .obp-avatar').forEach(e=>fill(e,'users'));
 app.querySelectorAll('#equipe #obpEquipe .obp-ind-ico').forEach(e=>{
  const text=e.closest('.obp-indicador')?.textContent||'';
  const key=/vale/i.test(text)?'banknote':/falta/i.test(text)?'calendarx':
    /b[oô]nus/i.test(text)?'gift':/di[aá]ria/i.test(text)?'calendar':
    /pag|bruto|l[ií]quido/i.test(text)?'wallet':'chart';
  fill(e,key);
 });
 app.querySelectorAll('#inicio #obpHome .obp-activity-ico').forEach(e=>{
  const content=e.textContent||'';
  const key=/foto|📷|▧/u.test(content)?'camera':/di[aá]ria|✓|✔/iu.test(content)?'calendar':
    /R\$|receita|despesa|💰|💸/iu.test(content)?'wallet':'history';
  fill(e,key);
 });
 // Botões com ícone antigo em texto. Preserva-se o próprio botão e seus listeners.
 [['#equipe #obpPagarEquipe','Pagar equipe','wallet'],
  ['#equipe #obpHistoricoPag','Histórico','history'],
  ['#equipe #obpNovo','Novo','plus']].forEach(([selector,label,key])=>{
  const b=app.querySelector(selector);
  if(!b||b.dataset.obrixActionIcon==='1')return;
  b.innerHTML=icon(key)+' '+label;
  b.dataset.obrixActionIcon='1';
 });
}
let queued=false;
function queue(){
 if(queued)return;queued=true;
 requestAnimationFrame(()=>{queued=false;update()});
}
function start(){
 const app=document.getElementById('app');if(!app)return;
 update();
 // Observa somente adições/remoções de elementos, sem realinhar estilos em polling.
 new MutationObserver(changes=>{
  if(changes.some(x=>x.addedNodes.length||x.removedNodes.length))queue();
 }).observe(app,{subtree:true,childList:true});
 window.addEventListener('pageshow',queue,{passive:true});
 window.addEventListener('obrix:theme-applied',queue,{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
