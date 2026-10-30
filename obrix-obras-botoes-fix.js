(()=>{
'use strict';
if(window.__OBRIX_OBRAS_BOTOES_FIX)return;window.__OBRIX_OBRAS_BOTOES_FIX=true;
let abrindo=false;
const obraId=b=>b?.closest?.('[data-obra-id]')?.dataset?.obraId||'';
async function garantirObras(){try{await window.OBRIX_POS_LOGIN_LOADER?.loadGroup?.('obras')}catch(_){} }
async function abrirChecklist(id){if(!id||abrindo)return;abrindo=true;try{await garantirObras();if(window.OBRIX_CHECKLIST?.abrir)return await window.OBRIX_CHECKLIST.abrir(id);if(window.OBRIX_OBRAS?.abrirChecklist)return await window.OBRIX_OBRAS.abrirChecklist(id);alert('Checklist indisponível no momento.')}finally{abrindo=false}}
async function abrirPagamentos(id){if(!id||abrindo)return;abrindo=true;try{await garantirObras();if(window.OBRIX_OBRAS_PAGAMENTOS?.abrir)return await window.OBRIX_OBRAS_PAGAMENTOS.abrir(id);if(window.OBRIX_OBRAS?.abrirPagamentos)return await window.OBRIX_OBRAS.abrirPagamentos(id);alert('Pagamentos recebidos indisponíveis no momento.')}finally{abrindo=false}}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('#listaObras .obxFotoAcoes button,#listaObras .obxAtalhos button');if(!b)return;
 const txt=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase(),id=obraId(b);if(!id)return;
 if(txt.includes('checklist')){e.preventDefault();e.stopImmediatePropagation();abrirChecklist(id);return}
 if(txt.includes('pagamentos')&&txt.includes('recebidos')){e.preventDefault();e.stopImmediatePropagation();abrirPagamentos(id)}
},true);
window.OBRIX_OBRAS_BOTOES_FIX={abrirChecklist,abrirPagamentos};
})();