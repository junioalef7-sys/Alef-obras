(()=>{'use strict';
if(window.__OBRIX_BUTTON_COLORS_V1)return;window.__OBRIX_BUTTON_COLORS_V1=true;
const GOLD='#f2b84b',DARK='#15191f';
const dangerRe=/(excluir|remover|apagar|estornar|deletar|exclusão|exclusao)/i;
const secondaryRe=/^(fechar|cancelar|voltar|sair|limpar|dispensar|agora não|agora nao)$/i;
function text(b){return String(b?.textContent||'').replace(/\s+/g,' ').trim()}
function danger(b){const c=String(b.className||'');return /(^|\s)(danger|perigo|orcPerigo|diarioPerigo)(\s|$)/i.test(c)||dangerRe.test(text(b))}
function secondary(b){const c=String(b.className||'');return /(^|\s)(secondary|cancelar)(\s|$)/i.test(c)||secondaryRe.test(text(b))||['sair','obrixTheme','docViewerClose'].includes(b.id)}
function navigation(b){return !!b.closest?.('.nav,.opmSide nav,.opmGrid,#docViewerModal')}
function rgb(s){const m=String(s||'').match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)(?:\D+([\d.]+))?/i);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null}
function nearBlack(b){const x=rgb(getComputedStyle(b).backgroundColor);return !!x&&x[3]>.55&&x[0]<=48&&x[1]<=58&&x[2]<=72}
function classify(b){if(!(b instanceof HTMLButtonElement)||!b.closest('#app'))return;
 if(danger(b)){b.classList.remove('obrixApprovedGold','obrixApprovedSecondary');return}
 if(b.closest('.bottom')){b.classList.remove('obrixApprovedGold','obrixApprovedSecondary');return}
 if(secondary(b)){b.classList.remove('obrixApprovedGold');if(nearBlack(b))b.classList.add('obrixApprovedSecondary');return}
 if(navigation(b))return;
 if(b.classList.contains('btn')||nearBlack(b)||b.dataset.obrixApprovedColor==='gold'){
   b.dataset.obrixApprovedColor='gold';b.classList.add('obrixApprovedGold');b.classList.remove('obrixApprovedSecondary');
 }
}
function scan(root=document){root.querySelectorAll?.('#app button').forEach(classify)}
function css(){let s=document.getElementById('obrixButtonColorsV1');if(!s){s=document.createElement('style');s.id='obrixButtonColorsV1';document.head.appendChild(s)}
 s.textContent=`:root{--obrix-approved-gold:${GOLD};--obrix-approved-gold-text:${DARK}}
#app .btn:not(#sair):not(#obrixTheme):not(.secondary):not(.cancelar):not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo),
#app button.obrixApprovedGold{background:var(--obrix-approved-gold)!important;color:var(--obrix-approved-gold-text)!important;-webkit-text-fill-color:var(--obrix-approved-gold-text)!important;border-color:#d8a339!important;box-shadow:0 8px 20px rgba(242,184,75,.18)!important}
#app .bottom button{background:transparent!important;box-shadow:none!important}
#app .bottom button.active{background:rgba(242,184,75,.16)!important;color:#a66e00!important;-webkit-text-fill-color:#a66e00!important;box-shadow:inset 0 0 0 1px rgba(197,137,22,.20)!important}
html[data-theme="dark"] #app .bottom button.active{background:rgba(242,184,75,.14)!important;color:${GOLD}!important;-webkit-text-fill-color:${GOLD}!important;box-shadow:inset 0 0 0 1px rgba(242,184,75,.10)!important}
#app button.active:not(.bottom button):not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.nav button),
#app button.selected:not(.danger):not(.perigo),#app button.selecionado:not(.danger):not(.perigo),#app button[aria-pressed="true"]:not(.danger):not(.perigo),#app button[aria-selected="true"]:not(.danger):not(.perigo){background:rgba(242,184,75,.16)!important;color:#9a6700!important;border-color:rgba(202,145,34,.30)!important}
html[data-theme="dark"] #app button.active:not(.bottom button):not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.nav button),
html[data-theme="dark"] #app button.selected:not(.danger):not(.perigo),html[data-theme="dark"] #app button.selecionado:not(.danger):not(.perigo),html[data-theme="dark"] #app button[aria-pressed="true"]:not(.danger):not(.perigo),html[data-theme="dark"] #app button[aria-selected="true"]:not(.danger):not(.perigo){background:rgba(242,184,75,.13)!important;color:${GOLD}!important;border-color:rgba(242,184,75,.18)!important}
#app button.obrixApprovedSecondary{background:#fff!important;color:#334155!important;-webkit-text-fill-color:#334155!important;border:1px solid #cbd5e1!important;box-shadow:none!important}
html[data-theme="dark"] #app button.obrixApprovedSecondary{background:#172334!important;color:#eef2f7!important;-webkit-text-fill-color:#eef2f7!important;border-color:#334155!important}
#app .btn.danger,#app .btn.perigo,#app .btn.orcPerigo,#app .btn.diarioPerigo{background:#b91c1c!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#991b1b!important}`;
 document.head.appendChild(s)
}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(()=>{css();scan(document)},30)}
const mo=new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||m.attributeName==='class'||m.attributeName==='aria-pressed'||m.attributeName==='aria-selected'||m.attributeName==='data-theme'))schedule()});
function start(){css();scan(document);mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-pressed','aria-selected','data-theme']});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow','focus'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',()=>setTimeout(schedule,0),true);setTimeout(schedule,300);setTimeout(schedule,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_BUTTON_COLORS={scan:schedule,gold:GOLD};
})();