(()=>{
'use strict';
if(window.__OBRIX_OBRAS_BOTOES_FIX)return;window.__OBRIX_OBRAS_BOTOES_FIX=true;
let abrindo=false;
const obraId=b=>b?.closest?.('[data-obra-id]')?.dataset?.obraId||'';
async function garantirObras(){try{await window.OBRIX_POS_LOGIN_LOADER?.loadGroup?.('obras')}catch(_){} }
async function esperar(fn,ms=3000){const ini=Date.now();while(Date.now()-ini<ms){const f=fn();if(typeof f==='function')return f;await new Promise(r=>setTimeout(r,50))}return null}
async function abrirChecklist(id){if(!id||abrindo)return;abrindo=true;try{await garantirObras();const fn=await esperar(()=>window.OBRIX_CHECKLIST?.open||window.OBRIX_CHECKLIST?.abrir||window.OBRIX_OBRAS?.abrirChecklist||window.abrirChecklist);if(fn)return await fn.call(window.OBRIX_CHECKLIST||window.OBRIX_OBRAS||window,id);alert('Checklist indisponível no momento.')}finally{abrindo=false}}
async function abrirPagamentos(id){if(!id||abrindo)return;abrindo=true;try{await garantirObras();const fn=await esperar(()=>window.OBRIX_OBRAS_PAGAMENTOS?.open||window.OBRIX_OBRAS_PAGAMENTOS?.abrir||window.OBRIX_OBRAS?.abrirPagamentos||window.abrirPagamentosObra);if(fn)return await fn.call(window.OBRIX_OBRAS_PAGAMENTOS||window.OBRIX_OBRAS||window,id);alert('Pagamentos recebidos indisponíveis no momento.')}finally{abrindo=false}}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('#listaObras .obxFotoAcoes button,#listaObras .obxAtalhos button');if(!b)return;
 const txt=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase(),id=obraId(b);if(!id)return;
 if(txt.includes('checklist')){e.preventDefault();e.stopImmediatePropagation();abrirChecklist(id);return}
 if(txt.includes('pagamentos')&&txt.includes('recebidos')){e.preventDefault();e.stopImmediatePropagation();abrirPagamentos(id)}
},true);
window.OBRIX_OBRAS_BOTOES_FIX={abrirChecklist,abrirPagamentos};
})();