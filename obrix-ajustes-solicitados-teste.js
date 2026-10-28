(()=>{'use strict';if(window.__OBRIX_AJUSTES_SOLICITADOS_TESTE)return;window.__OBRIX_AJUSTES_SOLICITADOS_TESTE=true;
const n=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
const css=document.createElement('style');css.id='obrix-ajustes-solicitados-teste-css';css.textContent=`
/* cabeçalhos solicitados */
#financeiroMain>.hero,#equipe>.hero,#diarioMain>.hero,#orcamentosMain>.hero{position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;min-height:72px!important}
#financeiroMain>.hero h1,#equipe>.hero h1,#diarioMain>.hero h1,#orcamentosMain>.hero h1{width:100%!important;text-align:center!important;margin:0!important}
#financeiroMain>.hero p,#equipe>.hero p,#diarioMain>.hero p,#orcamentosMain>.hero p{display:none!important}
/* status Em andamento à direita e 20% maior */
#inicio .obxStatus,#inicio [class*="status"].andamento,#inicio [class*="Status"].andamento{margin-left:auto!important;margin-right:0!important;font-size:120%!important;text-align:right!important}
/* rascunho sem fundo branco */
#orcamentosMain .orcStatus.rascunho{background:transparent!important;background-color:transparent!important;box-shadow:none!important}
/* instalação: elimina fundo branco de botões/banner sem mudar função */
#app [class*="install"] button,#app [id*="install"] button,#app [class*="Install"] button,#app [id*="Install"] button{background:var(--ob-surface-2)!important;background-color:var(--ob-surface-2)!important;color:var(--ob-text)!important;-webkit-text-fill-color:var(--ob-text)!important;border-color:var(--ob-border)!important}
/* configurações modo claro: fundo vermelho suave + letras vermelhas */
html[data-theme="light"] #configMain .cfgDeleteGrid button[data-del="equipe"],html[data-theme="light"] #configMain .cfgDeleteGrid button[data-del="financeiro"]{background:#fee2e2!important;background-color:#fee2e2!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border-color:#dc2626!important}
/* resumo financeiro restaurado */
#obrixFinResumosTeste{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px}
#obrixFinResumosTeste .card{margin:0!important;padding:14px!important}#obrixFinResumosTeste h3{margin:0 0 10px;font-size:16px}#obrixFinResumosTeste .afrRow{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-top:1px solid var(--ob-border)}#obrixFinResumosTeste .afrRow:first-of-type{border-top:0}#obrixFinResumosTeste small{color:var(--ob-muted)}
@media(max-width:620px){#obrixFinResumosTeste{grid-template-columns:1fr}}
`;document.head.appendChild(css);
function removeFechar(root){if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{if(n(b.textContent)==='fechar'&&!b.closest('.modal,.modalBack,[role="dialog"]'))b.remove()})}
function headers(){['financeiroMain','equipe','diarioMain','orcamentosMain'].forEach(id=>removeFechar(document.getElementById(id)));removeFechar(document.getElementById('configMain'));
 const p=[document.getElementById('equipe'),document.getElementById('diarioMain'),document.getElementById('orcamentosMain'),document.getElementById('configMain'),document.getElementById('suporteMain')].some(x=>x&&!x.classList.contains('hidden'));
 const b=document.getElementById('obrixHeaderVoltar');if(b&&p)b.classList.remove('hidden');
}
function dedupeObras(){document.querySelectorAll('#listaObras .obxObraCard').forEach(card=>{const seen=new Set();card.querySelectorAll('button').forEach(b=>{const t=n(b.textContent);const key=t.includes('relatório fotográfico')||t.includes('relatorio fotografico')?'foto':t.includes('checklist')?'checklist':t.includes('pagamentos recebidos')?'pagamentos':'';if(!key)return;if(seen.has(key))b.remove();else seen.add(key)})})}
function money(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
function finResumos(){const main=document.getElementById('financeiroMain');if(!main||main.classList.contains('hidden'))return;let host=document.getElementById('obrixFinResumosTeste');if(!host){host=document.createElement('div');host.id='obrixFinResumosTeste';const lista=document.getElementById('fmLista');(lista?.parentNode||main).insertBefore(host,lista||null)}const rows=(window.financeiro||[]).filter(x=>!x.status_lancamento||x.status_lancamento==='ativo'),obras=window.obras||[];
 const porObra=obras.map(o=>{const xs=rows.filter(x=>String(x.obra_id)===String(o.id)),rec=xs.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),des=xs.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0);return `<div class="afrRow"><small>${String(o.nome||'Obra').replace(/[<>]/g,'')}</small><b>${money(rec-des)}</b></div>`}).join('')||'<small>Nenhuma obra.</small>';
 const cm=new Map();rows.forEach(x=>{let ids=Array.isArray(x.checklist_ids)?x.checklist_ids:(x.checklist_id?[x.checklist_id]:[]);ids.forEach(id=>{const k=String(id),v=x.checklist_valores&&Number(x.checklist_valores[k]||0)>0?Number(x.checklist_valores[k]):Number(x.valor||0);const a=cm.get(k)||{rec:0,des:0};x.tipo==='receita'?a.rec+=v:a.des+=v;cm.set(k,a)})});const checks=window.checklistFinanceiro||[];const porCheck=[...cm].map(([id,v])=>{const c=checks.find?.(x=>String(x.id)===id),nome=c?.nome||'Checklist';return `<div class="afrRow"><small>${String(nome).replace(/[<>]/g,'')}</small><b>${money(v.rec-v.des)}</b></div>`}).join('')||'<small>Nenhum lançamento por checklist.</small>';
 host.innerHTML=`<div class="card"><h3>Resumo por obra</h3>${porObra}</div><div class="card"><h3>Resumo por checklist</h3>${porCheck}</div>`}
function run(){headers();dedupeObras();finResumos()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,300),{once:true});else setTimeout(run,300);new MutationObserver(()=>requestAnimationFrame(run)).observe(document.getElementById('app')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});['obrix:modules-ready','obrix:feature-pronto'].forEach(e=>window.addEventListener(e,run));window.OBRIX_AJUSTES_SOLICITADOS_TESTE={refresh:run};})();