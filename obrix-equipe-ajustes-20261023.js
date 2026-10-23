(()=>{'use strict';
if(window.__OBRIX_EQUIPE_AJUSTES_20261023)return;window.__OBRIX_EQUIPE_AJUSTES_20261023=true;
function dados(){const pick=(xs,ks)=>(Array.isArray(xs)?xs:[]).map(x=>{const o={};ks.forEach(k=>o[k]=x?.[k]);return o});return JSON.stringify({f:pick(window.funcionarios,['id','nome','ativo','tipo_pagamento','valor_diaria','salario_mensal','dia_pagamento','obra_id']),o:pick(window.obras,['id','nome','status']),d:pick(window.diarias,['id','funcionario_id','obra_id','quantidade','valor_total','paga']),v:pick(window.vales,['id','funcionario_id','obra_id','valor','quitado']),b:pick(window.bonus,['id','funcionario_id','obra_id','valor','pago'])})}
function marcar(){const box=document.getElementById('listaEquipe');if(box)box.dataset.obrixValoresSig=dados()}
function envolver(obj,chave){const fn=obj?.[chave];if(typeof fn!=='function'||fn.__obrixValoresEstaveis)return;const w=function(){const box=document.getElementById('listaEquipe'),sig=dados();if(box?.dataset?.obrixValoresSig===sig&&box.children.length)return;const r=fn.apply(this,arguments);requestAnimationFrame(marcar);return r};w.__obrixValoresEstaveis=true;w.__obrixOriginal=fn;obj[chave]=w}
function patch(){envolver(window,'renderEquipe');if(window.OBRIX_EQUIPE_MODELO){envolver(window.OBRIX_EQUIPE_MODELO,'render');const rf=window.OBRIX_EQUIPE_MODELO.refresh;if(typeof rf==='function'&&!rf.__obrixMarcaSig){const w=async function(){const r=await rf.apply(this,arguments);marcar();return r};w.__obrixMarcaSig=true;window.OBRIX_EQUIPE_MODELO.refresh=w}}requestAnimationFrame(marcar)}
function prepararChecklist(modal){if(!modal||modal.__obrixSemChecklist)return;modal.__obrixSemChecklist=true;const check=modal.querySelector('.check');if(!check)return;const aplicar=()=>{let vazio=[...check.options].find(o=>o.value==='');if(!vazio){vazio=document.createElement('option');vazio.value='';check.insertBefore(vazio,check.firstChild)}vazio.textContent='Sem checklist';check.dataset.count='0'};aplicar();const obs=new MutationObserver(aplicar);obs.observe(check,{childList:true});modal.__obrixCheckObs=obs;modal.querySelector('.salvar')?.addEventListener('click',aplicar,true)}
function observarModais(){if(!document.body||document.body.__obrixChecklistOpcionalObs)return;document.body.__obrixChecklistOpcionalObs=true;const obs=new MutationObserver(ms=>ms.forEach(m=>{m.addedNodes.forEach(n=>{if(!(n instanceof Element))return;if(n.matches?.('.obrix-checklist-diaria-modal'))prepararChecklist(n);n.querySelectorAll?.('.obrix-checklist-diaria-modal').forEach(prepararChecklist)});m.removedNodes.forEach(n=>{if(n instanceof Element&&n.__obrixCheckObs)n.__obrixCheckObs.disconnect()})}));obs.observe(document.body,{childList:true})}
const css=document.createElement('style');css.id='obrixEquipeAjustes20261023Css';css.textContent=`
#equipe .obrix-modelo-metrica{animation:none!important;transition:none!important;transform:none!important}
#equipe .obrix-modelo-metrica.azul small{font-size:0!important}
#equipe .obrix-modelo-metrica.azul small::after{content:'Total bruto em aberto';font-size:15px!important}
@media(max-width:700px){#equipe .obrix-modelo-metrica.azul small::after{font-size:15px!important}}
`;document.head.appendChild(css);
function start(){observarModais();patch();setTimeout(patch,350);setTimeout(patch,1000);setTimeout(patch,2200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='equipe'){setTimeout(patch,30);setTimeout(patch,500);setTimeout(patch,1200)}});
window.addEventListener('obrix:modules-ready',()=>setTimeout(patch,150));
window.OBRIX_EQUIPE_AJUSTES_20261023={apply:patch,checklist:prepararChecklist};
})();