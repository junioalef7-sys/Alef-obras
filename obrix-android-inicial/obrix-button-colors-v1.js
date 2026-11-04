(()=>{'use strict';
if(window.__OBRIX_BUTTON_COLORS_V1)return;window.__OBRIX_BUTTON_COLORS_V1=true;
const ID='obrix-button-colors-v1-style';
const css=`
#app button,#app [role="button"],.modalBack button{transition:none!important;animation:none!important;text-shadow:none!important}
html[data-theme="light"] #app button,html[data-theme="light"] #app [role="button"],html[data-theme="light"] .modalBack button{background-image:none!important;box-shadow:none!important}
html[data-theme="light"] #app #equipe button:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo),html[data-theme="light"] #app #equipe [role="button"]{background:#fff!important;background-color:#fff!important;color:#334155!important;-webkit-text-fill-color:#334155!important;border-color:#cbd5e1!important}
html[data-theme="light"] #app #equipe button.active:not(.danger):not(.perigo),html[data-theme="light"] #app #equipe button.selected:not(.danger):not(.perigo),html[data-theme="light"] #app #equipe button[aria-pressed="true"]:not(.danger):not(.perigo),html[data-theme="light"] #app #equipe button[aria-selected="true"]:not(.danger):not(.perigo){background:#f1f5f9!important;background-color:#f1f5f9!important;color:#0f172a!important;-webkit-text-fill-color:#0f172a!important;border-color:#cbd5e1!important}
html[data-theme="dark"] #app button,html[data-theme="dark"] #app [role="button"],html[data-theme="dark"] .modalBack button,body.dark #app button{background-image:none!important;box-shadow:none!important}
html[data-theme="dark"] #app #equipe button:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo),body.dark #app #equipe button:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo){background:#0d1722!important;background-color:#0d1722!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#293b4d!important}
html[data-theme="dark"] #app #equipe button.active:not(.danger):not(.perigo),html[data-theme="dark"] #app #equipe button.selected:not(.danger):not(.perigo),html[data-theme="dark"] #app #equipe button[aria-pressed="true"]:not(.danger):not(.perigo),html[data-theme="dark"] #app #equipe button[aria-selected="true"]:not(.danger):not(.perigo){background:#17212b!important;background-color:#17212b!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#334155!important}
html[data-theme="dark"] #app .bottom button,html[data-theme="dark"] #app .bottom button.active{background:#0d1722!important;background-color:#0d1722!important;color:#fff!important;-webkit-text-fill-color:#fff!important;box-shadow:none!important}
`;
function install(){let s=document.getElementById(ID);if(!s){s=document.createElement('style');s.id=ID;s.textContent=css;(document.head||document.documentElement).appendChild(s)}}
function cleanup(root=document){root.querySelectorAll?.('#app button').forEach(b=>{b.classList.remove('obrixApprovedGold','obrixApprovedSecondary','obrixPermanentGoldText');b.removeAttribute('data-obrix-approved-color')})}
function apply(){install();cleanup()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
window.addEventListener('obrix:modules-ready',apply);window.addEventListener('obrix:modules-online-ready',apply);window.addEventListener('pageshow',apply);
window.OBRIX_BUTTON_COLORS_V1={apply};
})();