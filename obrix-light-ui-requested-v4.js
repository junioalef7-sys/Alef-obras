(()=>{'use strict';
if(window.__OBRIX_LIGHT_UI_REQUESTED_V4)return;window.__OBRIX_LIGHT_UI_REQUESTED_V4=true;
const GRAY='#F5F7FA',TEXT='#111827',GREEN='#15803D',BORDER='#D7DEE8';
const offline=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
const light=()=>!offline()&&document.documentElement.dataset.theme!=='dark'&&!document.body?.classList.contains('dark');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const PROPS=['background','background-color','background-image','color','-webkit-text-fill-color','border-color','box-shadow','text-shadow'];
const imp=(e,p,v)=>e?.style?.setProperty(p,v,'important');
function gray(e){if(!e)return;e.dataset.obrixLightV4='1';imp(e,'background',GRAY);imp(e,'background-color',GRAY);imp(e,'background-image','none');imp(e,'box-shadow','none');}
function grayButton(b){gray(b);imp(b,'color',TEXT);imp(b,'-webkit-text-fill-color',TEXT);imp(b,'border-color',BORDER);imp(b,'text-shadow','none')}
function textButtons(){
 const wanted=/^(marcar diaria|falta|ver registro|vale|bonus e extras|bonus|extras|excluir|ativar|desativar|historico de pagamento|historico de pagamentos|funcionario|funcionarios|novo funcionario|\+ funcionario|trocar e-mail|trocar email|trocar senha|sair da conta|apagar obra|apagar equipe|apagar financeiro|pagar com pix|pagar com boleto|pagar com cartao)$/;
 document.querySelectorAll('#app button').forEach(b=>{if(wanted.test(norm(b.textContent)))grayButton(b)});
}
function bottomBlock(){
 const bottom=document.querySelector('#app .bottom');if(!bottom)return;gray(bottom);bottom.querySelectorAll('button').forEach(grayButton);
}
function statuses(){
 document.querySelectorAll('#app *').forEach(e=>{if(e.children.length===0&&norm(e.textContent)==='em andamento'){e.dataset.obrixLightV4='1';imp(e,'color',GREEN);imp(e,'-webkit-text-fill-color',GREEN)}});
}
function cleanup(){document.querySelectorAll('[data-obrix-light-v4="1"]').forEach(e=>{PROPS.forEach(p=>e.style.removeProperty(p));delete e.dataset.obrixLightV4})}
function apply(){if(offline())return;if(!light()){cleanup();return}bottomBlock();textButtons();statuses()}
function pulse(){[0,60,180,450,900,1800].forEach(ms=>setTimeout(apply,ms))}
['obrix:grupo-pronto','obrix:feature-pronto','obrix:modules-ready','obrix:modules-online-ready','pageshow','focus'].forEach(n=>window.addEventListener(n,pulse));
document.addEventListener('click',pulse,true);window.addEventListener('online',pulse);
new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pulse,{once:true});else pulse();
window.OBRIX_LIGHT_UI_REQUESTED_V4={apply,pulse,cleanup};
})();