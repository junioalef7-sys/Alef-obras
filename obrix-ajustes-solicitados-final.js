(()=>{'use strict';if(window.__OBRIX_AJUSTES_SOLICITADOS_REAL)return;window.__OBRIX_AJUSTES_SOLICITADOS_REAL=true;
const $=id=>document.getElementById(id),norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase(),money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const st=document.createElement('style');st.id='obrix-ajustes-solicitados-real-css';st.textContent=`
#financeiroMain>.hero,#equipe>.hero,#diarioMain>.hero,#orcamentosMain>.hero{min-height:72px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;text-align:center!important;padding:12px 14px!important}
#financeiroMain>.hero h1,#equipe>.hero h1,#diarioMain>.hero h1,#orcamentosMain>.hero h1{width:100%!important;margin:0!important;text-align:center!important;line-height:1.15!important;display:block!important}
#financeiroMain>.hero p,#equipe>.hero p,#diarioMain>.hero p,#orcamentosMain>.hero p{display:none!important}
#orcamentosMain .orcStatus.rascunho{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important}
#obrixFinResumosReal{display:grid;grid-template-columns:1fr;gap:10px;margin:12px 0 14px}
#obrixFinResumosReal .obxResumo{border:1px solid var(--ob-border);border-radius:12px;background:var(--ob-surface);padding:12px;color:var(--ob-text)}
#obrixFinResumosReal h3{margin:0 0 8px;font-size:15px}#obrixFinResumosReal .linha{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid var(--ob-border);font-size:13px}#obrixFinResumosReal .linha:first-of-type{border-top:0}#obrixFinResumosReal .linha b{text-align:right;white-space:nowrap}
.obrixStatusAndamentoDireita{margin-left:auto!important;margin-right:0!important;font-size:105%!important;text-align:right!important;display:block!important;width:max-content!important}
`;
document.head.appendChild(st);
function removerFechar(){
 ['financeiroMain','equipe','diarioMain'].forEach(id=>{const root=$(id);if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{if(norm(b.textContent)==='fechar'&&!b.closest('.modal,.modalBack,[role="dialog"]'))b.remove()})});
 const orc=$('orcamentosMain');if(orc){const b=$('orcCancelar');if(b&&norm(b.textContent)==='fechar')b.remove()}
}
function andamento(){document.querySelectorAll('#inicio .status,#inicio [class*="status"],#inicio [class*="Status"],#inicio em,#inicio span,#inicio small').forEach(e=>{if(norm(e.textContent)==='em andamento'||norm(e.textContent)==='andamento')e.classList.add('obrixStatusAndamentoDireita')})}
function dedupeObras(){document.querySelectorAll('#listaObras .card,#listaObras [class*="obra"],#listaObras [class*="Obra"]').forEach(card=>{const seen=new Set();card.querySelectorAll('button,[role="button"]').forEach(b=>{const t=norm(b.textContent);let k='';if(t.includes('relatorio fotografico'))k='foto';else if(t==='checklist'||t.includes(' checklist'))k='check';else if(t.includes('pagamentos recebidos'))k='pag';if(!k)return;if(seen.has(k))b.remove();else seen.add(k)})})}
function seta(){const b=$('obrixHeaderVoltar');if(!b)return;const diario=$('diarioMain'),sup=$('suporteMain');const ativo=e=>e&&!e.classList.contains('hidden')&&getComputedStyle(e).display!=='none';if(ativo(diario)||ativo(sup))b.classList.remove('hidden')}
function resumo(){const main=$('financeiroMain');if(!main)return;let host=$('obrixFinResumosReal');if(!host){host=document.createElement('div');host.id='obrixFinResumosReal';const lista=$('fmLista');(lista?.parentNode||main).insertBefore(host,lista||null)}
 const rows=(window.financeiro||[]).filter(x=>!x.status_lancamento||x.status_lancamento==='ativo'),obras=window.obras||[];
 const po=new Map();rows.forEach(x=>{const o=obras.find(z=>String(z.id)===String(x.obra_id)),k=o?.nome||'Sem obra',g=po.get(k)||{r:0,d:0};if(x.tipo==='receita')g.r+=Number(x.valor||0);if(x.tipo==='despesa')g.d+=Number(x.valor||0);po.set(k,g)});
 const pc=new Map();rows.forEach(x=>{const vals=x.checklist_valores&&typeof x.checklist_valores==='object'?x.checklist_valores:{};Object.entries(vals).forEach(([id,v])=>{const n=Number(v||0);if(!n)return;const opt=document.querySelector(`#fmChecklist option[value="${CSS.escape(String(id))}"]`),k=opt?.textContent?.trim()||'Checklist',g=pc.get(k)||{r:0,d:0};if(x.tipo==='receita')g.r+=n;if(x.tipo==='despesa')g.d+=n;pc.set(k,g)})});
 const linhas=m=>m.size?[...m].map(([k,v])=>`<div class="linha"><span>${k}</span><b>${money(v.r)} / ${money(v.d)}</b></div>`).join(''):'<div class="linha"><span>Nenhum lançamento</span><b>—</b></div>';
 const html=`<div class="obxResumo"><h3>Resumo por obra</h3>${linhas(po)}</div><div class="obxResumo"><h3>Resumo por checklist</h3>${linhas(pc)}</div>`;if(host.innerHTML!==html)host.innerHTML=html}
function run(){removerFechar();andamento();dedupeObras();seta();resumo()}
let pend=false;function agenda(){if(pend)return;pend=true;requestAnimationFrame(()=>{pend=false;run()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(agenda,500),{once:true});else setTimeout(agenda,500);
new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'&&m.addedNodes.length))agenda()}).observe(document.getElementById('app')||document.body,{subtree:true,childList:true});
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(e=>window.addEventListener(e,agenda));window.addEventListener('pageshow',agenda);window.OBRIX_AJUSTES_SOLICITADOS_REAL={refresh:agenda};})();