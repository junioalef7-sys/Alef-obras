(()=>{
'use strict';
if(window.__OBRIX_FIN_MOBILE_RESUMO_OBRA)return;
if(!window.matchMedia('(max-width:620px)').matches)return;
window.__OBRIX_FIN_MOBILE_RESUMO_OBRA=1;

const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ativos=()=>Array.isArray(window.financeiro)?window.financeiro.filter(x=>!x.status_lancamento||x.status_lancamento==='ativo'):[];
const vals=x=>x?.checklist_valores&&typeof x.checklist_valores==='object'&&!Array.isArray(x.checklist_valores)?x.checklist_valores:{};
const ids=x=>{const v=vals(x),a=Object.keys(v).filter(k=>Number(v[k]||0)>0);if(a.length)return a;if(Array.isArray(x?.checklist_ids)&&x.checklist_ids.length)return x.checklist_ids.map(String);return x?.checklist_id?[String(x.checklist_id)]:[]};
const parte=(x,id)=>{const v=vals(x);if(Object.prototype.hasOwnProperty.call(v,id))return Number(v[id]||0);const a=ids(x);return a.length===1&&a[0]===String(id)?Number(x.valor||0):0};
let obraAberta='',checkAberto='',ctxPromise=null,extrasCache=null,checksCache=null,carregando=false;

const css=document.createElement('style');
css.id='obrix-fin-mobile-resumo-obra-css';
css.textContent=`@media(max-width:620px){
#financeiroMain #fmResumoObras{display:none!important}
#financeiroMain .obmResumoObrasAprovado{margin:12px 0;border:1px solid var(--ob-border,#d7e5f2);border-radius:11px;background:var(--ob-surface,#fff);overflow:hidden}
#financeiroMain .obmResumoObrasHead{min-height:39px;padding:8px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid var(--ob-border,#d7e5f2)}
#financeiroMain .obmResumoObrasHead strong{font-size:14px;display:flex;gap:7px;align-items:center}
#financeiroMain .obmResumoItem,#financeiroMain .obmCheckItem{border-bottom:1px solid var(--ob-border,#e6edf4)}
#financeiroMain .obmResumoItem:last-child,#financeiroMain .obmCheckItem:last-child{border-bottom:0}
#financeiroMain .obmResumoLinha{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px}
#financeiroMain .obmResumoLinha>b{font-size:13px;min-width:0;overflow:hidden;text-overflow:ellipsis}
#financeiroMain .obmObraToggle,#financeiroMain .obmCheckToggle{flex:0 0 auto;border:1px solid var(--ob-border,#d7e5f2);border-radius:8px;background:var(--ob-surface-2,#f4f7fa);color:var(--ob-text,#0f172a);padding:6px 9px;font-size:11px;font-weight:900}
#financeiroMain .obmResumoGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:0 10px 10px}
#financeiroMain .obmResumoBloco{min-width:0;border:1px solid var(--ob-border,#e4ebf2);border-radius:9px;padding:8px;background:var(--ob-surface-2,#f8fafc)}
#financeiroMain .obmResumoBloco small{display:block;font-size:9px;font-weight:800;color:var(--ob-muted,#64748b)}
#financeiroMain .obmResumoBloco b{display:block;margin-top:4px;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#financeiroMain .obmResumoBloco.recebido b{color:#0aa950!important;-webkit-text-fill-color:#0aa950!important}
#financeiroMain .obmResumoBloco.despesas b{color:#ef332b!important;-webkit-text-fill-color:#ef332b!important}
#financeiroMain .obmResumoBloco.lucro b{color:#1688ff!important;-webkit-text-fill-color:#1688ff!important}
#financeiroMain .obmResumoBloco.prejuizo b{color:#ef332b!important;-webkit-text-fill-color:#ef332b!important}
#financeiroMain .obmChecklistDentro{margin:0 10px 10px;border:1px solid var(--ob-border,#d7e5f2);border-radius:9px;overflow:hidden}
#financeiroMain .obmChecklistTitulo{padding:8px 9px;font-size:11px;font-weight:900;background:var(--ob-surface-2,#f8fafc);border-bottom:1px solid var(--ob-border,#d7e5f2)}
#financeiroMain .obmVazio{padding:12px;color:var(--ob-muted,#64748b);font-size:11px}
}`;
document.head.appendChild(css);

function bloco(label,valor,cls=''){return `<div class="obmResumoBloco ${cls}"><small>${label}</small><b>${esc(valor)}</b></div>`}
async function ctx(){if(!ctxPromise)ctxPromise=(async()=>{const p=await OBRIX_BACKEND.profile();return{sb:await OBRIX_BACKEND.init(),eid:p.empresa_id}})();return ctxPromise}
async function dadosAux(){if(extrasCache&&checksCache)return;const {sb,eid}=await ctx();const [er,cr]=await Promise.all([sb.from('servicos_extras').select('obra_id,valor').eq('empresa_id',eid),sb.from('checklist_itens').select('id,obra_id,nome,ordem,valor').eq('empresa_id',eid).order('ordem',{ascending:true})]);if(er.error)throw er.error;if(cr.error)throw cr.error;extrasCache=er.data||[];checksCache=cr.data||[]}
function calcObra(o){const r=ativos().filter(x=>String(x.obra_id||'')===String(o.id)),recebido=r.filter(x=>x.tipo==='receita').reduce((s,x)=>s+Number(x.valor||0),0),despesas=r.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+Number(x.valor||0),0),extras=(extrasCache||[]).filter(x=>String(x.obra_id)===String(o.id)).reduce((s,x)=>s+Number(x.valor||0),0),servico=Number(o.valor_contrato||0)+extras,lucro=recebido-despesas;return{r,recebido,despesas,servico,lucro}}
function renderChecklist(o,t){const checks=(checksCache||[]).filter(c=>String(c.obra_id)===String(o.id));const usados=new Set(t.r.flatMap(ids));const etapas=checks.filter(c=>usados.has(String(c.id)));if(!etapas.length)return '<div class="obmVazio">Nenhum lançamento vinculado a checklist nesta obra.</div>';return `<div class="obmChecklistDentro"><div class="obmChecklistTitulo">☑ Resumo por checklist</div>${etapas.map(c=>{const key=`${o.id}:${c.id}`,aberto=checkAberto===key,rr=t.r.filter(x=>ids(x).includes(String(c.id))),rec=rr.filter(x=>x.tipo==='receita').reduce((s,x)=>s+parte(x,String(c.id)),0),des=rr.filter(x=>x.tipo==='despesa').reduce((s,x)=>s+parte(x,String(c.id)),0),total=Number(c.valor||0),lucro=rec-des;return `<article class="obmCheckItem"><div class="obmResumoLinha"><b>${esc(c.nome||'Etapa')}</b><button type="button" class="obmCheckToggle" data-obra="${esc(o.id)}" data-check="${esc(c.id)}">${aberto?'Ocultar resumo':'Ver resumo'}</button></div>${aberto?`<div class="obmResumoGrid">${bloco('Total serviço',money(total),'servico')}${bloco('Total recebido',money(rec),'recebido')}${bloco('Total despesas',money(des),'despesas')}${bloco('Lucro líquido',money(lucro),lucro>=0?'lucro':'prejuizo')}</div>`:''}</article>`}).join('')}</div>`}
function ligar(box){box.querySelectorAll('.obmObraToggle').forEach(b=>b.onclick=()=>{const id=String(b.dataset.obra);obraAberta=obraAberta===id?'':id;checkAberto='';render()});box.querySelectorAll('.obmCheckToggle').forEach(b=>b.onclick=()=>{const key=`${b.dataset.obra}:${b.dataset.check}`;checkAberto=checkAberto===key?'':key;render()})}
function montar(){const main=document.getElementById('financeiroMain');if(!main||main.classList.contains('hidden'))return;const obras=Array.isArray(window.obras)?window.obras:[];let box=document.getElementById('obmResumoObrasAprovado');if(!box){box=document.createElement('section');box.id='obmResumoObrasAprovado';box.className='obmResumoObrasAprovado';const lista=document.getElementById('fmLista');(lista?.parentNode||main).insertBefore(box,lista||null)}box.innerHTML=`<div class="obmResumoObrasHead"><strong><span>🏗️</span>Resumo por obra</strong></div><div>${obras.length?obras.map(o=>{const t=calcObra(o),aberto=obraAberta===String(o.id);return `<article class="obmResumoItem"><div class="obmResumoLinha"><b>${esc(o.nome||'Obra')}</b><button type="button" class="obmObraToggle" data-obra="${esc(o.id)}">${aberto?'Ocultar resumo':'Ver resumo'}</button></div>${aberto?`<div class="obmResumoGrid">${bloco('Total serviço',money(t.servico),'servico')}${bloco('Total recebido',money(t.recebido),'recebido')}${bloco('Total despesas',money(t.despesas),'despesas')}${bloco('Lucro líquido',money(t.lucro),t.lucro>=0?'lucro':'prejuizo')}</div>${renderChecklist(o,t)}`:''}</article>`}).join(''):'<div class="obmVazio">Nenhuma obra encontrada.</div>'}</div>`;ligar(box)}
async function render(){if(!window.matchMedia('(max-width:620px)').matches)return;const main=document.getElementById('financeiroMain');if(!main||main.classList.contains('hidden'))return;if(carregando)return;carregando=true;try{await dadosAux();montar()}catch(e){console.warn('Resumo por obra mobile',e)}finally{carregando=false}}
function invalidar(){extrasCache=null;checksCache=null;render()}
window.addEventListener('obrix-financeiro-atualizado',invalidar);
window.addEventListener('pageshow',()=>setTimeout(render,120));
document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(!b)return;if((b.textContent||'').trim()==='Financeiro')setTimeout(render,180)},true);
setTimeout(render,220);
window.OBRIX_FIN_MOBILE_RESUMO_OBRA={refresh:render,invalidar};
})();