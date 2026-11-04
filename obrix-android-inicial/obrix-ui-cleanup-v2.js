(()=>{'use strict';
if(window.__OBRIX_UI_CLEANUP_V2)return;window.__OBRIX_UI_CLEANUP_V2=true;
const GOLD='#f2b84b';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const inside=(el,sel)=>!!el.closest?.(sel);
function neutral(el,goldText=false){
 if(!(el instanceof HTMLElement))return;
 el.classList.add('obrixUiNeutral');
 el.classList.toggle('obrixBonusGoldText',!!goldText);
 el.classList.remove('obrixApprovedGold');
 el.removeAttribute('data-obrix-approved-color');
}
function classify(el){
 const t=norm(el.textContent),plain=t.replace(/^[+＋]\s*/,'');if(!t)return;
 if(inside(el,'#obras')){
  if(t==='checklist'||t.includes('relatorio fotografico')||(t.includes('pagamentos')&&t.includes('recebidos'))||/^servicos? extras?$/.test(t)||t==='editar')return neutral(el);
 }
 if(inside(el,'#financeiroMain')&&t==='editar')return neutral(el);
 if(inside(el,'#equipe')){
  if(t.includes('bonus e extras'))return neutral(el,true);
  if(plain==='funcionario'||plain==='funcionarios'||t==='ativar'||t==='desativar'||t==='vale'||t==='pagamentos'||t.includes('vale e pagamento'))return neutral(el);
 }
 if(inside(el,'#orcamentosMain')&&(t==='editar'||t==='imprimir'||(t.includes('visualizar')&&t.includes('imprimir'))))return neutral(el);
 if(inside(el,'#relatoriosMain')){
  if(el.id==='relTipoFinanceiro'||el.id==='relTipoEquipe'||t.includes('relatorio financeiro')||t.includes('equipe / trabalhador')||t.includes('equipe trabalhador')||t==='diario de obras')return neutral(el);
 }
 if(inside(el,'#documentosMain,#docViewerModal,.docViewerModal')){
  if(t==='fechar'||t==='abrir arquivo'||t==='imprimir'||t==='salvar'||(t.includes('imprimir')&&t.includes('salvar')))return neutral(el);
 }
 if(inside(el,'#notasMain')&&(t==='salvar nota'||t==='editar'||t==='enviar'||t==='excluir'))return neutral(el);
 if(inside(el,'#configMain,.cfgModalBack,.cfgModal')){
  if(t==='trocar e-mail'||t==='trocar email'||t==='trocar senha'||t.includes('modo claro')||t.includes('modo escuro')||t==='apagar equipe'||t==='apagar obras'||t==='apagar financeiro'||t==='sair da conta'||t==='excluir conta')return neutral(el);
 }
 if(t==='excluir conta'||t==='sair da conta')return neutral(el);
}
function scan(root=document){root.querySelectorAll?.('button,[role="button"]').forEach(classify)}
const STYLE=`
#obras .hero p,#diarioMain .hero p,#financeiroMain .hero p,#equipe .hero p,#estoqueMain .hero p,#orcamentosMain .hero p,#relatoriosMain .hero p,#notasMain .hero p,#backupMain .hero p,#configMain .hero p{display:none!important}
#obras .hero h1,#diarioMain .hero h1,#financeiroMain .hero h1,#equipe .hero h1,#estoqueMain .hero h1,#orcamentosMain .hero h1,#relatoriosMain .hero h1,#notasMain .hero h1,#backupMain .hero h1,#configMain .hero h1{margin-bottom:0!important}
#menuUsuario{display:none!important}
#orcamentosMain .orcStatus.rascunho{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;color:#64748b!important}
html[data-theme="dark"] #orcamentosMain .orcStatus.rascunho{color:#a9b5c5!important}
html[data-theme="light"] body #app button.obrixUiNeutral,
html[data-theme="light"] body #docViewerModal button.obrixUiNeutral,
html[data-theme="light"] body button.obrixUiNeutral{background:#fff!important;background-image:none!important;color:#334155!important;-webkit-text-fill-color:#334155!important;border:1px solid #cbd5e1!important;box-shadow:none!important}
html[data-theme="dark"] body #app button.obrixUiNeutral,
html[data-theme="dark"] body #docViewerModal button.obrixUiNeutral,
html[data-theme="dark"] body button.obrixUiNeutral{background:#101820!important;background-image:none!important;color:#eef2f7!important;-webkit-text-fill-color:#eef2f7!important;border:1px solid #2a3948!important;box-shadow:none!important}
html[data-theme="light"] body #app button.obrixUiNeutral.obrixBonusGoldText,
html[data-theme="dark"] body #app button.obrixUiNeutral.obrixBonusGoldText{color:${GOLD}!important;-webkit-text-fill-color:${GOLD}!important}
`;
function css(){let s=document.getElementById('obrixUiCleanupV2');if(!s){s=document.createElement('style');s.id='obrixUiCleanupV2';document.head.appendChild(s)}if(s.textContent!==STYLE)s.textContent=STYLE}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(()=>{css();scan(document)},25)}
function start(){css();scan(document);if(document.body)new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'))schedule()}).observe(document.body,{subtree:true,childList:true});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow','focus'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',()=>setTimeout(schedule,0),true);setTimeout(schedule,250);setTimeout(schedule,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_UI_CLEANUP_V2={scan:schedule};
})();