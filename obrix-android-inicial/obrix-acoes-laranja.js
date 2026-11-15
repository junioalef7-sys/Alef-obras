(()=>{'use strict';
if(window.__OBRIX_ACOES_LARANJA_20261115)return;
window.__OBRIX_ACOES_LARANJA_20261115=true;
const css=document.createElement('style');css.id='obrix-acoes-laranja-20261115';
css.textContent=[
'html body button.obrix-acao-laranja,',
'html body #app button.obrix-acao-laranja,',
'html body input.obrix-acao-laranja,',
'html body a.obrix-acao-laranja,',
'html body .modal button.obrix-acao-laranja {',
'background-color:#e97712!important;background-image:none!important;',
'border:1px solid #d7670b!important;color:#fff!important;',
'-webkit-text-fill-color:#fff!important;box-shadow:none!important;text-shadow:none!important}',
'html body button.obrix-acao-laranja:hover,html body #app button.obrix-acao-laranja:hover,',
'html body input.obrix-acao-laranja:hover,html body a.obrix-acao-laranja:hover {background-color:#cd6108!important}',
'html body button.obrix-acao-laranja:disabled,html body input.obrix-acao-laranja:disabled {',
'opacity:.60!important;cursor:not-allowed!important}'
].join('');
document.head.appendChild(css);
const targets='button,input[type="submit"],input[type="button"],a[role="button"]';
const accept=/^[^A-Za-zÀ-ÿ0-9]*(salvar|registrar|confirmar|adicionar)\b/i;
const reject=/\b(excluir|exclus[aã]o|apagar|remover|estornar|estorno|cancelar|desativar|encerrar)\b/i;
function mark(el){
 const valores=[el.tagName==='INPUT'?el.value:el.textContent,el.getAttribute('aria-label'),el.getAttribute('title')].filter(Boolean).map(x=>String(x).replace(/\s+/g,' ').trim());
 const positive=valores.some(x=>accept.test(x))&&!valores.some(x=>reject.test(x))&&!el.matches('[data-obrix-acao-destrutiva],.danger,.btn-danger,.destructive');
 el.classList.toggle('obrix-acao-laranja',positive);
}
function scan(root){if(root?.matches?.(targets))mark(root);root?.querySelectorAll?.(targets).forEach(mark)}
const dirty=new Set();let timer=null;
function flush(){timer=null;for(const n of dirty)scan(n);dirty.clear()}
function later(node){if(!node)return;dirty.add(node);if(timer===null)timer=setTimeout(flush,65)}
function ready(){
 scan(document.body);
 const mo=new MutationObserver(records=>{
   for(const m of records){
     if(m.type==='characterData'){
       const el=m.target?.parentElement?.closest?.(targets);if(el)later(el);
       continue;
     }
     for(const n of m.addedNodes)if(n.nodeType===1)later(n);
     const el=m.target?.closest?.(targets);if(el)later(el);
   }
 });
 mo.observe(document.body,{childList:true,subtree:true,characterData:true});
 window.addEventListener('pageshow',()=>later(document.body));
 window.addEventListener('obrix:session-shell',()=>later(document.body));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();