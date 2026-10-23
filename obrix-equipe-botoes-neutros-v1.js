(()=>{'use strict';
if(window.__OBRIX_EQUIPE_BOTOES_NEUTROS_V1)return;window.__OBRIX_EQUIPE_BOTOES_NEUTROS_V1=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const rotulo=b=>norm(b?.textContent).replace(/^[^a-z]+/,'').trim();
function nomes(){
 const hist=document.querySelector('#equipe .obrix-historico-pagamentos-topo');
 if(hist&&norm(hist.textContent)!=='historico de pagamentos')hist.textContent='🧾 Histórico de pagamentos';
 document.querySelectorAll('#equipe #listaEquipe .obrix-modelo-metrica small').forEach(el=>{if(norm(el.textContent)==='bruto em aberto no filtro')el.textContent='Total bruto em aberto'});
}
function marcar(b){
 if(!(b instanceof HTMLElement))return;
 const t=rotulo(b),equipe=!!b.closest?.('#equipe,.obrix-modelo-modal,.obrix-equipe-controles');
 if(!equipe)return;
 if(t==='vale'||t==='pagar'||b.matches?.('[data-extra="vale"]')){
   b.classList.add('obrixEquipeAzulClaro');
   b.classList.remove('obrixPermanentNeutral','obrixEquipeNeutral','obrixApprovedGold','obrixApprovedSecondary','obrixPermanentGoldText');
   b.removeAttribute('data-obrix-permanent-neutral');
   b.removeAttribute('data-obrix-approved-color');
   return;
 }
 if(/\bfuncionarios?\b/.test(t)||/historico de pagamentos/.test(t)||/^pagamentos?$/.test(t)){
   b.classList.add('obrixPermanentNeutral','obrixEquipeNeutral');
   b.classList.remove('obrixEquipeAzulClaro','obrixApprovedGold','obrixApprovedSecondary','obrixPermanentGoldText');
   b.dataset.obrixPermanentNeutral='1';
   b.removeAttribute('data-obrix-approved-color');
 }
}
function scan(root=document){nomes();root.querySelectorAll?.('#equipe button,.obrix-modelo-modal button,.obrix-equipe-controles button,[data-extra="vale"]').forEach(marcar)}
const CSS=`
#equipe button.obrixEquipeNeutral,.obrix-modelo-modal button.obrixEquipeNeutral,.obrix-equipe-controles button.obrixEquipeNeutral,#app button.obrixEquipeNeutral{background:#fff!important;background-color:#fff!important;background-image:none!important;color:#334155!important;-webkit-text-fill-color:#334155!important;border:1px solid #cbd5e1!important;box-shadow:none!important;text-shadow:none!important}
html[data-theme="dark"] #equipe button.obrixEquipeNeutral,body.dark #equipe button.obrixEquipeNeutral,html[data-theme="dark"] .obrix-modelo-modal button.obrixEquipeNeutral,body.dark .obrix-modelo-modal button.obrixEquipeNeutral,html[data-theme="dark"] .obrix-equipe-controles button.obrixEquipeNeutral,body.dark .obrix-equipe-controles button.obrixEquipeNeutral,html[data-theme="dark"] #app button.obrixEquipeNeutral,body.dark #app button.obrixEquipeNeutral{background:#101820!important;background-color:#101820!important;color:#eef2f7!important;-webkit-text-fill-color:#eef2f7!important;border-color:#2a3948!important;box-shadow:none!important;text-shadow:none!important}
#app #equipe button.obrixEquipeAzulClaro,#equipe button.obrixEquipeAzulClaro,.obrix-modelo-modal button.obrixEquipeAzulClaro{background:#60a5fa!important;background-color:#60a5fa!important;background-image:none!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border:1px solid #3b82f6!important;box-shadow:none!important;text-shadow:none!important;animation:none!important;transition:none!important;transform:none!important}
html[data-theme="dark"] #app #equipe button.obrixEquipeAzulClaro,body.dark #app #equipe button.obrixEquipeAzulClaro,html[data-theme="dark"] #equipe button.obrixEquipeAzulClaro,body.dark #equipe button.obrixEquipeAzulClaro,html[data-theme="dark"] .obrix-modelo-modal button.obrixEquipeAzulClaro,body.dark .obrix-modelo-modal button.obrixEquipeAzulClaro{background:#60a5fa!important;background-color:#60a5fa!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#3b82f6!important;animation:none!important;transition:none!important}
html[data-theme="dark"] #app #equipe [data-cmd="excluir"],body.dark #app #equipe [data-cmd="excluir"]{background:#101820!important;background-color:#101820!important;color:#ef4444!important;-webkit-text-fill-color:#ef4444!important;border:1px solid #ef4444!important;box-shadow:none!important}
html[data-theme="dark"] #app #equipe [data-acao="bonus"],body.dark #app #equipe [data-acao="bonus"],html[data-theme="dark"] #app #equipe [data-obrix-card-extra="bonus"],body.dark #app #equipe [data-obrix-card-extra="bonus"]{border:1px solid #f2b84b!important;box-shadow:none!important}
`;
function css(){let s=document.getElementById('obrixEquipeBotoesNeutrosV1');if(!s){s=document.createElement('style');s.id='obrixEquipeBotoesNeutrosV1';document.head.appendChild(s)}if(s.textContent!==CSS)s.textContent=CSS}
let tm=0;function run(root=document){clearTimeout(tm);tm=setTimeout(()=>{css();scan(root)},20)}
function start(){css();scan();if(document.body)new MutationObserver(ms=>{if(ms.some(m=>m.addedNodes?.length||m.type==='characterData'))run()}).observe(document.body,{subtree:true,childList:true,characterData:true});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:offline-bootstrap','pageshow','online','offline'].forEach(e=>window.addEventListener(e,()=>run()));document.addEventListener('click',()=>setTimeout(()=>run(),0),true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_EQUIPE_BOTOES_NEUTROS={scan:()=>run()};
})();