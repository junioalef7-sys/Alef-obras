(function(){
'use strict';
if(window.__EDIFIQ_ORC_LINK79)return;window.__EDIFIQ_ORC_LINK79=true;
const byId=id=>document.getElementById(id);
function toast79(msg){try{if(typeof window.toast==='function')window.toast(msg);else alert(msg)}catch(_){}}
function limited(){try{return typeof window.edifiqLimitedMode63==='function'&&window.edifiqLimitedMode63()}catch(_){return false}}
function ensure(){
 const menu=byId('menuPasta');if(!menu)return;
 let btn=byId('menuOrcamentos79');
 if(!btn){
  const buttons=[...menu.querySelectorAll('button')],anchor=buttons.find(b=>/configurações|configuracoes/i.test(String(b.textContent||'')))||buttons.at(-1);
  btn=document.createElement('button');btn.id='menuOrcamentos79';btn.type='button';btn.className=anchor?.className||'edifiqDataRow';
  btn.innerHTML='<span>🧾</span><b>Orçamentos</b><span class="edifiqChevron">›</span>';
  btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();if(limited()){toast79('Seu teste grátis terminou. Orçamentos fica disponível após a assinatura.');return}location.assign('./orcamentos.html')});
  if(anchor)anchor.insertAdjacentElement('beforebegin',btn);else menu.appendChild(btn);
 }
 btn.classList.toggle('ed63Locked',limited());
}
function init(){ensure();[400,1200,2500,5000].forEach(ms=>setTimeout(ensure,ms));document.addEventListener('click',()=>setTimeout(ensure,20),true);window.addEventListener('edifiq:subscription-updated',ensure)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();