(()=>{'use strict';if(window.__OBRIX_CORRECAO_DUP_TIT99)return;window.__OBRIX_CORRECAO_DUP_TIT99=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const css=document.createElement('style');css.id='obrix-correcao-dup-tit99-css';css.textContent=`
/* Somente títulos: +2% sobre o teste anterior (97% -> 99%), mantendo posição e largura */
#financeiroMain>.hero,#equipe>.hero,#diarioMain>.hero,#orcamentosMain>.hero,#obras>.hero{width:100%!important;max-width:none!important;box-sizing:border-box!important}
#financeiroMain>.hero h1,#equipe>.hero h1,#diarioMain>.hero h1,#orcamentosMain>.hero h1,#obras>.hero h1{font-size:99%!important;text-align:left!important;justify-content:flex-start!important;margin-left:0!important}
`;document.head.appendChild(css);
function chave(el){const t=norm(el?.textContent);if(t.includes('relatorio fotografico'))return'foto';if(t.includes('pagamentos recebidos'))return'pagamentos';return''}
function dedupe(root){if(!root)return;['foto','pagamentos'].forEach(key=>{const matches=[...root.querySelectorAll('button,.btn,a,[role="button"],[onclick]')].filter(el=>chave(el)===key);matches.slice(1).forEach(el=>el.remove())})}
function run(){const obras=document.getElementById('obras');const lista=document.getElementById('listaObras');dedupe(obras);dedupe(lista);document.querySelectorAll('#listaObras .obxObraCard,#listaObras>.card.item,#obras .obxObraCard').forEach(dedupe)}
let pending=false;function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;run()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,400),{once:true});else setTimeout(schedule,400);
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(e=>window.addEventListener(e,schedule));window.addEventListener('pageshow',schedule);document.addEventListener('click',()=>setTimeout(schedule,120),true);
const obs=new MutationObserver(schedule);setTimeout(()=>{const r=document.getElementById('obras')||document.body;obs.observe(r,{childList:true,subtree:true})},500);
})();