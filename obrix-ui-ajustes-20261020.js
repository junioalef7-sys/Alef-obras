(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
function notas(){const m=$('#notasMain');if(!m)return;$$('.notaPdf',m).forEach(b=>b.remove());const modal=$('#notaPdfModal',m);if(modal)modal.remove();}
function apply(){notas()}
const css=document.createElement('style');css.textContent=`#obrixPrivacyBtn,.obrixPrivacyBar,#notasMain .notaPdf,#notasMain #notaPdfModal{display:none!important}`;document.head.appendChild(css);
sessionStorage.removeItem('obrix-fin-hidden');
let tabBlockUntil=0;
document.addEventListener('pointerdown',e=>{const t=e.target.closest?.('#obrixObrasAprovado .detailTabs [data-tab]');if(!t||t.dataset.tab==='financeiro')return;e.preventDefault();e.stopImmediatePropagation();tabBlockUntil=Date.now()+600;const host=$('#obrixObrasAprovado');if(host)host.dataset.tab=t.dataset.tab;window.OBRIX_OBRAS_MODERNO?.render?.(t.dataset.tab)},true);
document.addEventListener('click',e=>{const t=e.target.closest?.('#obrixObrasAprovado .detailTabs [data-tab]');if(t&&t.dataset.tab!=='financeiro'&&Date.now()<tabBlockUntil){e.preventDefault();e.stopImmediatePropagation()}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,450));else setTimeout(apply,450);
})();