(()=>{'use strict';
if(window.__OBRIX_EQUIPE_ESTOQUE_FIX_V1)return;window.__OBRIX_EQUIPE_ESTOQUE_FIX_V1=true;
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
function ativo(f){const v=f?.ativo;if(v===false||v===0||v==='0')return false;const s=norm(v);if(['false','inativo','inativa','nao','não'].includes(s))return false;return true}
function funcs(){try{return typeof funcionarios!=='undefined'&&Array.isArray(funcionarios)?funcionarios:[]}catch(_){return[]}}
function filtroAtual(){const s=document.querySelector('#equipe .obrix-filtro-equipe');return s?.value||'todos'}
function idsPermitidos(){const f=filtroAtual();return new Set(funcs().filter(x=>f==='todos'||(f==='ativos'&&ativo(x))||(f==='inativos'&&!ativo(x))).map(x=>String(x.id)))}
function aplicarFiltro(){const box=document.getElementById('listaEquipe');if(!box)return;const f=filtroAtual();if(f==='todos'){box.querySelectorAll('[data-id]').forEach(c=>c.style.removeProperty('display'));return}const ok=idsPermitidos();box.querySelectorAll('[data-id]').forEach(c=>{const id=String(c.dataset.id||'');if(!id)return;c.style.setProperty('display',ok.has(id)?'':'none','important')})}
function neutralEquipe(){document.querySelectorAll('#equipe button,.obrix-equipe-controles button').forEach(b=>{const t=norm(b.textContent).replace(/^[^a-zà-ú]+/i,'').trim();if(t==='funcionario'||t==='funcionarios'||t==='pagamento'||t==='pagamentos'){b.classList.add('obrixPermanentNeutral','obrixEquipeNeutral');b.dataset.obrixPermanentNeutral='1';b.classList.remove('obrixApprovedGold','obrixPermanentGoldText');b.removeAttribute('data-obrix-approved-color')}})}
function fecharSaidaFantasma(){document.querySelectorAll('.modalBack.estOp').forEach(m=>{const h=norm(m.querySelector('h2')?.textContent);if(h==='saida de estoque'&&!m.dataset.obrixUserOpened)m.remove()})}
let userEstoqueClick=false;
document.addEventListener('pointerdown',e=>{if(e.target.closest?.('[data-est]'))userEstoqueClick=true},true);
document.addEventListener('click',e=>{const x=e.target.closest?.('[data-est]');if(x){userEstoqueClick=true;setTimeout(()=>{document.querySelectorAll('.modalBack.estOp').forEach(m=>m.dataset.obrixUserOpened='1');userEstoqueClick=false},0)}const s=e.target.closest?.('#equipe .obrix-filtro-equipe');if(s)setTimeout(aplicarFiltro,0)},true);
document.addEventListener('change',e=>{if(e.target.matches?.('#equipe .obrix-filtro-equipe')){setTimeout(aplicarFiltro,0);setTimeout(aplicarFiltro,80)}},true);
const mo=new MutationObserver(ms=>{let est=false;for(const m of ms){for(const n of m.addedNodes||[]){if(n.nodeType!==1)continue;if(n.matches?.('.modalBack.estOp')||n.querySelector?.('.modalBack.estOp'))est=true}}setTimeout(()=>{aplicarFiltro();neutralEquipe();if(est&&!userEstoqueClick)fecharSaidaFantasma()},0)});
function start(){if(document.body)mo.observe(document.body,{childList:true,subtree:true});aplicarFiltro();neutralEquipe();setTimeout(aplicarFiltro,250);setTimeout(aplicarFiltro,900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_EQUIPE_ESTOQUE_FIX={apply:()=>{aplicarFiltro();neutralEquipe()}};
})();