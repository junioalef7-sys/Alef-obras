(()=>{'use strict';if(window.__OBRIX_AJUSTES_SOLICITADOS_FINAL)return;window.__OBRIX_AJUSTES_SOLICITADOS_FINAL=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const css=document.createElement('style');css.id='obrix-ajustes-solicitados-final-css';css.textContent=`
#financeiroMain>.hero,#equipe>.hero,#diarioMain>.hero,#orcamentosMain>.hero{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;min-height:72px!important}
#financeiroMain>.hero h1,#equipe>.hero h1,#diarioMain>.hero h1,#orcamentosMain>.hero h1{width:100%!important;text-align:center!important;margin:0!important;justify-content:center!important}
#financeiroMain>.hero p,#equipe>.hero p,#diarioMain>.hero p,#orcamentosMain>.hero p{display:none!important}
#inicio .obxStatus,#inicio [class*="status"].andamento,#inicio [class*="Status"].andamento,#inicio .status.andamento{margin-left:auto!important;margin-right:0!important;font-size:105%!important;text-align:right!important}
#orcamentosMain .orcStatus.rascunho,#orcamentosMain [class*="status"].rascunho,#orcamentosMain [class*="Status"].rascunho{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important}
#obrixFinResumosFinal{display:grid;grid-template-columns:1fr;gap:10px;margin:10px 0 14px}
#obrixFinResumosFinal .obxFinResumoBox{border:1px solid var(--ob-border);border-radius:12px;background:var(--ob-surface);padding:12px;color:var(--ob-text)}
#obrixFinResumosFinal h3{margin:0 0 9px;font-size:15px}
#obrixFinResumosFinal .obxFinResumoLinha{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid var(--ob-border);font-size:13px}
#obrixFinResumosFinal .obxFinResumoLinha:first-of-type{border-top:0}
#obrixFinResumosFinal .obxFinResumoLinha span:last-child{text-align:right;white-space:nowrap;font-weight:800}
`;
document.head.appendChild(css);
function visible(id){const e=document.getElementById(id);return !!(e&&!e.classList.contains('hidden'))}
function removeFechar(root){if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{if(norm(b.textContent)==='fechar'&&!b.closest('.modal,.modalBack,[role="dialog"]'))b.remove()})}
function headers(){['financeiroMain','equipe','diarioMain','orcamentosMain'].forEach(id=>removeFechar(document.getElementById(id)))}
function seta(){const b=document.getElementById('obrixHeaderVoltar');if(!b)return;const precisa=['diarioMain','suporteMain'].some(visible);if(precisa)b.classList.remove('hidden')}
function dedupeObras(){document.querySelectorAll('#listaObras .obxObraCard,#listaObras>.card.item').forEach(card=>{const seen=new Set();card.querySelectorAll('button').forEach(b=>{const t=norm(b.textContent);let key='';if(t.includes('relatorio fotografico'))key='foto';else if(t.includes('checklist'))key='checklist';else if(t.includes('pagamentos recebidos'))key='pagamentos';if(!key)return;if(seen.has(key))b.remove();else seen.add(key)})})}
function resumoFinanceiro(){const main=document.getElementById('financeiroMain');if(!main)return;let host=document.getElementById('obrixFinResumosFinal');if(!host){host=document.createElement('div');host.id='obrixFinResumosFinal';const lista=document.getElementById('fmLista');(lista?.parentNode||main).insertBefore(host,lista||null)}
 const rows=(window.financeiro||[]).filter(x=>!x.status_lancamento||x.status_lancamento==='ativo'),obras=window.obras||[];
 const porObra=new Map();rows.forEach(x=>{const id=String(x.obra_id||''),o=obras.find(z=>String(z.id)===id),k=o?.nome||'Sem obra',g=porObra.get(k)||{rec:0,des:0};if(x.tipo==='receita')g.rec+=Number(x.valor||0);else if(x.tipo==='despesa')g.des+=Number(x.valor||0);porObra.set(k,g)});
 const nomes=new Map();document.querySelectorAll('#fmChecklist option').forEach(o=>{if(o.value)nomes.set(String(o.value),o.textContent.trim())});const porCheck=new Map();rows.forEach(x=>{const vals=x.checklist_valores&&typeof x.checklist_valores==='object'?x.checklist_valores:{};Object.entries(vals).forEach(([id,v])=>{const n=Number(v||0);if(n<=0)return;const k=nomes.get(String(id))||'Checklist';const g=porCheck.get(k)||{rec:0,des:0};if(x.tipo==='receita')g.rec+=n;else if(x.tipo==='despesa')g.des+=n;porCheck.set(k,g)})});
 const linhas=m=>m.size?[...m.entries()].map(([k,v])=>`<div class="obxFinResumoLinha"><span>${k}</span><span>${money(v.rec)} / ${money(v.des)}</span></div>`).join(''):'<div class="obxFinResumoLinha"><span>Nenhum lançamento</span><span>—</span></div>';
 host.innerHTML=`<div class="obxFinResumoBox"><h3>Resumo por obra</h3>${linhas(porObra)}</div><div class="obxFinResumoBox"><h3>Resumo por checklist</h3>${linhas(porCheck)}</div>`}
function run(){headers();seta();dedupeObras();resumoFinanceiro()}
let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;run()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,350),{once:true});else setTimeout(schedule,350);
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(e=>window.addEventListener(e,schedule));window.addEventListener('pageshow',schedule);document.addEventListener('click',()=>setTimeout(schedule,100),true);
window.OBRIX_AJUSTES_SOLICITADOS_FINAL={refresh:schedule};})();