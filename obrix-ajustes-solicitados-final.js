(()=>{'use strict';if(window.__OBRIX_AJUSTES_SOLICITADOS_REAL)return;window.__OBRIX_AJUSTES_SOLICITADOS_REAL=true;
const $=id=>document.getElementById(id),norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const st=document.createElement('style');st.id='obrix-ajustes-solicitados-real-css';st.textContent=`
/* Cabecalhos compactos, alinhados a esquerda e ajustados ao texto */
#financeiroMain>.hero,#equipe>.hero,#orcamentosMain>.hero{min-height:0!important;width:max-content!important;max-width:100%!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;text-align:left!important;padding:9px 12px!important;margin-right:auto!important}
#financeiroMain>.hero h1,#equipe>.hero h1,#orcamentosMain>.hero h1{width:auto!important;margin:0!important;text-align:left!important;line-height:1.08!important;display:block!important;white-space:nowrap!important}
#financeiroMain>.hero h1{font-size:95%!important}
#financeiroMain>.hero p,#equipe>.hero p,#orcamentosMain>.hero p{display:none!important}
/* Diario ainda menor */
#diarioMain>.hero{min-height:0!important;width:max-content!important;max-width:100%!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;text-align:left!important;padding:7px 10px!important;margin-right:auto!important}
#diarioMain>.hero h1{width:auto!important;margin:0!important;text-align:left!important;line-height:1.05!important;font-size:90%!important;white-space:nowrap!important}
#diarioMain>.hero p{display:none!important}
/* Remove os dois resumos do Financeiro */
#obrixFinResumosReal,#fmResumoObras{display:none!important}
/* Rascunho transparente */
#orcamentosMain .orcStatus.rascunho{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important}
/* Em andamento 5% menor que o tamanho atual */
.obrixStatusAndamentoDireita{margin-left:auto!important;margin-right:0!important;font-size:99.75%!important;text-align:right!important;display:block!important;width:max-content!important}
/* Botoes destrutivos no modo claro */
html[data-theme="light"] #configMain .obrixApagarEquipeSolicitado,html[data-theme="light"] #configMain .obrixApagarFinanceiroSolicitado{color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border-color:#dc2626!important;border-width:2px!important;background:var(--ob-surface)!important;background-image:none!important}
`;
document.head.appendChild(st);
function removerFechar(){
 ['financeiroMain','equipe','diarioMain'].forEach(id=>{const root=$(id);if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{if(norm(b.textContent)==='fechar'&&!b.closest('.modal,.modalBack,[role="dialog"]'))b.remove()})});
 const orc=$('orcamentosMain');if(orc)orc.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{if(norm(b.textContent)==='fechar'&&!b.closest('.modal,.modalBack,[role="dialog"]'))b.remove()});
}
function removerResumos(){[$('obrixFinResumosReal'),$('fmResumoObras')].forEach(e=>e&&e.remove())}
function andamento(){document.querySelectorAll('#inicio .status,#inicio [class*="status"],#inicio [class*="Status"],#inicio em,#inicio span,#inicio small').forEach(e=>{if(norm(e.textContent)==='em andamento'||norm(e.textContent)==='andamento')e.classList.add('obrixStatusAndamentoDireita')})}
function configPerigo(){const root=$('configMain');if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{const t=norm(b.textContent);b.classList.toggle('obrixApagarEquipeSolicitado',t==='apagar equipe');b.classList.toggle('obrixApagarFinanceiroSolicitado',t==='apagar financeiro')})}
function dedupeObras(){document.querySelectorAll('#listaObras .card,#listaObras [class*="obra"],#listaObras [class*="Obra"]').forEach(card=>{const seen=new Set();card.querySelectorAll('button,[role="button"]').forEach(b=>{const t=norm(b.textContent);let k='';if(t.includes('relatorio fotografico'))k='foto';else if(t==='checklist'||t.includes(' checklist'))k='check';else if(t.includes('pagamentos recebidos'))k='pag';if(!k)return;if(seen.has(k))b.remove();else seen.add(k)})})}
function seta(){const b=$('obrixHeaderVoltar');if(!b)return;const ativo=id=>{const e=$(id);return e&&!e.classList.contains('hidden')&&getComputedStyle(e).display!=='none'};if(['diarioMain','orcamentosMain','equipe','configMain','suporteMain'].some(ativo))b.classList.remove('hidden')}
function run(){removerFechar();removerResumos();andamento();configPerigo();dedupeObras();seta()}
let pend=false;function agenda(){if(pend)return;pend=true;requestAnimationFrame(()=>{pend=false;run()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(agenda,500),{once:true});else setTimeout(agenda,500);
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))agenda()}).observe(document.getElementById('app')||document.body,{subtree:true,childList:true});
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-applied'].forEach(e=>window.addEventListener(e,agenda));window.addEventListener('pageshow',agenda);window.OBRIX_AJUSTES_SOLICITADOS_REAL={refresh:agenda};})();