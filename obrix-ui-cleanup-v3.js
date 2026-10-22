(()=>{'use strict';
if(window.__OBRIX_UI_CLEANUP_V3)return;window.__OBRIX_UI_CLEANUP_V3=true;
const GOLD='#f2b84b';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const inside=(el,sel)=>!!el.closest?.(sel);
function neutral(el,goldText=false){
 if(!(el instanceof HTMLElement))return;
 el.classList.add('obrixUiNeutralV3');
 el.classList.toggle('obrixBonusGoldTextV3',!!goldText);
 el.classList.remove('obrixApprovedGold');
 el.removeAttribute('data-obrix-approved-color');
}
function classify(el){
 const t=norm(el.textContent),plain=t.replace(/^[+＋]\s*/,'');if(!t)return;
 if(inside(el,'#diarioMain')){
  if(t==='salvar diario'||t==='salvar'||t.includes('salvar diario'))return neutral(el);
 }
 if(inside(el,'#equipe')){
  if(t.includes('bonus e extras'))return neutral(el,true);
  if(plain==='funcionario'||plain==='funcionarios'||t==='ativar'||t==='desativar'||t.includes('ativar / desativar')||t==='vale'||t==='pagamentos'||t.includes('vale e pagamento')||t.includes('marcar diario')||t.includes('marcar diaria')||t==='falta'||t.includes('historico de faltas')||t.includes('ver registro')||t.includes('ver registros')||t.includes('editar cadastro'))return neutral(el);
 }
 if(inside(el,'#orcamentosMain')){
  if(t==='editar'||t==='visualizar'||t==='imprimir'||t.includes('visualizar / imprimir')||t.includes('visualizar e imprimir')||(t.includes('visualizar')&&t.includes('imprimir')))return neutral(el);
 }
 if(inside(el,'#relatoriosMain')){
  if(el.id==='relTipoFinanceiro'||el.id==='relTipoEquipe'||t==='financeiro'||t==='equipe'||t==='trabalhador'||t.includes('relatorio financeiro')||t.includes('equipe / trabalhador')||t.includes('equipe trabalhador')||t==='diario de obras'||t.includes('relatorio diario de obras'))return neutral(el);
 }
 if(inside(el,'#documentosMain,#docViewerModal,.docViewerModal')){
  if(t==='fechar'||t==='abrir arquivo'||t==='imprimir'||t==='salvar'||(t.includes('imprimir')&&t.includes('salvar')))return neutral(el);
 }
 if(inside(el,'#notasMain')){
  if(t==='salvar nota'||t==='editar'||t==='enviar'||t==='excluir')return neutral(el);
 }
 if(inside(el,'#offlineCentralMain')){
  if(t==='tudo sincronizado'||t.includes('ferramentas avancadas'))return neutral(el);
 }
 if(inside(el,'#configMain,.cfgModalBack,.cfgModal')){
  if(t==='trocar e-mail'||t==='trocar email'||t==='trocar senha'||t.includes('modo claro')||t.includes('modo escuro')||t==='apagar equipe'||t==='apagar obras'||t==='apagar financeiro'||t==='sair da conta'||t==='excluir conta')return neutral(el);
 }
 if(t==='excluir conta'||t==='sair da conta')return neutral(el);
}
function scan(root=document){root.querySelectorAll?.('button,[role="button"]').forEach(classify)}
const STYLE=`
#documentosMain .hero p{display:none!important}
#documentosMain .hero h1{margin-bottom:0!important}
html[data-theme="light"] body #app button.obrixUiNeutralV3,
html[data-theme="light"] body #docViewerModal button.obrixUiNeutralV3,
html[data-theme="light"] body button.obrixUiNeutralV3{background:#fff!important;background-image:none!important;color:#334155!important;-webkit-text-fill-color:#334155!important;border:1px solid #cbd5e1!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] body #app button.obrixUiNeutralV3,
html[data-theme="dark"] body #docViewerModal button.obrixUiNeutralV3,
html[data-theme="dark"] body button.obrixUiNeutralV3{background:#101820!important;background-image:none!important;color:#eef2f7!important;-webkit-text-fill-color:#eef2f7!important;border:1px solid #2a3948!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="light"] body #app button.obrixUiNeutralV3.obrixBonusGoldTextV3,
html[data-theme="dark"] body #app button.obrixUiNeutralV3.obrixBonusGoldTextV3{color:${GOLD}!important;-webkit-text-fill-color:${GOLD}!important}
`;
function css(){let s=document.getElementById('obrixUiCleanupV3');if(!s){s=document.createElement('style');s.id='obrixUiCleanupV3';document.head.appendChild(s)}if(s.textContent!==STYLE)s.textContent=STYLE;if(s!==document.head.lastElementChild)document.head.appendChild(s)}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(()=>{css();scan(document)},25)}
function start(){css();scan(document);if(document.body)new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||m.type==='characterData'))schedule()}).observe(document.body,{subtree:true,childList:true,characterData:true});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow','focus'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',()=>setTimeout(schedule,0),true);setTimeout(schedule,250);setTimeout(schedule,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_UI_CLEANUP_V3={scan:schedule};
})();