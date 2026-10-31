(()=>{'use strict';if(window.__OBRIX_AJUSTES_SOLICITADOS_TESTE)return;window.__OBRIX_AJUSTES_SOLICITADOS_TESTE=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const css=document.createElement('style');css.id='obrix-ajustes-solicitados-teste-css';css.textContent=`
#financeiroMain>.hero,#equipe>.hero,#diarioMain>.hero,#orcamentosMain>.hero{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;min-height:72px!important}
#financeiroMain>.hero h1,#equipe>.hero h1,#diarioMain>.hero h1,#orcamentosMain>.hero h1{width:100%!important;text-align:center!important;margin:0!important;justify-content:center!important}
#financeiroMain>.hero p,#equipe>.hero p,#diarioMain>.hero p,#orcamentosMain>.hero p{display:none!important}
#inicio .obxStatus,#inicio [class*="status"].andamento,#inicio [class*="Status"].andamento,#inicio .status.andamento{margin-left:auto!important;margin-right:0!important;font-size:120%!important;text-align:right!important}
#orcamentosMain .orcStatus.rascunho,#orcamentosMain [class*="status"].rascunho,#orcamentosMain [class*="Status"].rascunho{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important}
#app [class*="install"] button,#app [id*="install"] button,#app [class*="Install"] button,#app [id*="Install"] button{background:transparent!important;background-color:transparent!important;background-image:none!important;color:var(--ob-text)!important;-webkit-text-fill-color:var(--ob-text)!important;box-shadow:none!important}
html[data-theme="light"] #configMain .obrixApagarEquipeTeste,html[data-theme="light"] #configMain .obrixApagarFinanceiroTeste{background:#fee2e2!important;background-color:#fee2e2!important;background-image:none!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border:2px solid #dc2626!important;box-shadow:none!important}
`;
document.head.appendChild(css);
function tela(id){const e=document.getElementById(id);return e&&!e.classList.contains('hidden')}
function removeFechar(root){if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{if(norm(b.textContent)==='fechar'&&!b.closest('.modal,.modalBack,[role="dialog"]'))b.remove()})}
function headers(){['financeiroMain','equipe','diarioMain','orcamentosMain'].forEach(id=>removeFechar(document.getElementById(id)))}
function seta(){const b=document.getElementById('obrixHeaderVoltar');if(!b)return;if(tela('assinaturaMain')){b.classList.add('hidden');return}const precisa=['equipe','diarioMain','orcamentosMain','configMain','suporteMain'].some(tela);if(precisa)b.classList.remove('hidden')}
function dedupeObras(){document.querySelectorAll('#listaObras .obxObraCard,#listaObras>.card.item').forEach(card=>{const seen=new Set();card.querySelectorAll('button').forEach(b=>{const t=norm(b.textContent);let key='';if(t.includes('relatorio fotografico'))key='foto';else if(t.includes('checklist'))key='checklist';else if(t.includes('pagamentos recebidos'))key='pagamentos';if(!key)return;if(seen.has(key))b.remove();else seen.add(key)})})}
function configPerigo(){const root=document.getElementById('configMain');if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{const t=norm(b.textContent);b.classList.toggle('obrixApagarEquipeTeste',t==='apagar equipe');b.classList.toggle('obrixApagarFinanceiroTeste',t==='apagar financeiro')})}
function run(){headers();seta();dedupeObras();configPerigo();window.OBRIX_FIN_RESUMO_OBRAS?.refresh?.()}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;run()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,350),{once:true});else setTimeout(schedule,350);
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-applied'].forEach(e=>window.addEventListener(e,schedule));
window.addEventListener('pageshow',schedule);document.addEventListener('click',()=>setTimeout(schedule,80),true);
window.OBRIX_AJUSTES_SOLICITADOS_TESTE={refresh:schedule};})();