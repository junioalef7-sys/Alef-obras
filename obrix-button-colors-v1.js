(()=>{'use strict';
if(window.__OBRIX_BUTTON_COLORS_V1)return;window.__OBRIX_BUTTON_COLORS_V1=true;

const PETROLEO='#176B87';
const PETROLEO_BORDER='#125970';
const WHITE='#ffffff';
const DANGER='#b91c1c';
const DANGER_BORDER='#991b1b';
const dangerRe=/(excluir|remover|apagar|estornar|deletar|exclusão|exclusao)/i;

function text(b){return String(b?.textContent||'').replace(/\s+/g,' ').trim()}
function meta(b){
  return [b?.getAttribute?.('aria-label'),b?.getAttribute?.('title'),b?.dataset?.cmd,b?.dataset?.action,b?.dataset?.acao,b?.dataset?.fin,b?.dataset?.del,b?.dataset?.tipo]
    .filter(Boolean).join(' ');
}
function danger(b){
  const c=String(b?.className||'');
  return /(^|\s)(danger|perigo|orcPerigo|diarioPerigo)(\s|$)/i.test(c)||dangerRe.test(`${text(b)} ${meta(b)}`);
}
function classify(b){
  if(!(b instanceof HTMLButtonElement))return;
  b.classList.remove('obrixApprovedGold','obrixApprovedSecondary');
  b.removeAttribute('data-obrix-approved-color');
  if(danger(b)){
    b.classList.add('obrixDangerButton');
    b.classList.remove('obrixPetroleumButton');
    b.dataset.obrixButtonTheme='danger';
    return;
  }
  b.classList.remove('obrixDangerButton');
  b.classList.add('obrixPetroleumButton');
  b.dataset.obrixButtonTheme='petroleum';
}
function scan(root=document){
  if(root instanceof HTMLButtonElement)classify(root);
  root.querySelectorAll?.('button').forEach(classify);
}

const STYLE=`
:root{
  --obrix-button-primary:${PETROLEO};
  --obrix-button-primary-border:${PETROLEO_BORDER};
  --obrix-button-primary-text:${WHITE};
  --obrix-button-danger:${DANGER};
  --obrix-button-danger-border:${DANGER_BORDER};
}
html body #app#app#app button.obrixPetroleumButton:not(.obrixDangerButton),
html body button.obrixPetroleumButton.obrixPetroleumButton:not(.obrixDangerButton){
  background:${PETROLEO}!important;
  background-color:${PETROLEO}!important;
  background-image:none!important;
  color:${WHITE}!important;
  -webkit-text-fill-color:${WHITE}!important;
  border-color:${PETROLEO_BORDER}!important;
  box-shadow:0 6px 16px rgba(23,107,135,.18)!important;
  text-shadow:none!important;
}
html body #app#app#app button.obrixPetroleumButton:not(.obrixDangerButton) span,
html body #app#app#app button.obrixPetroleumButton:not(.obrixDangerButton) strong,
html body #app#app#app button.obrixPetroleumButton:not(.obrixDangerButton) small,
html body button.obrixPetroleumButton.obrixPetroleumButton:not(.obrixDangerButton) span,
html body button.obrixPetroleumButton.obrixPetroleumButton:not(.obrixDangerButton) strong,
html body button.obrixPetroleumButton.obrixPetroleumButton:not(.obrixDangerButton) small{
  color:${WHITE}!important;
  -webkit-text-fill-color:${WHITE}!important;
}
html body #app#app#app button.obrixDangerButton,
html body button.obrixDangerButton.obrixDangerButton{
  background:${DANGER}!important;
  background-color:${DANGER}!important;
  background-image:none!important;
  color:${WHITE}!important;
  -webkit-text-fill-color:${WHITE}!important;
  border-color:${DANGER_BORDER}!important;
  box-shadow:0 6px 16px rgba(185,28,28,.14)!important;
  text-shadow:none!important;
}
html body #app#app#app button.obrixDangerButton span,
html body #app#app#app button.obrixDangerButton strong,
html body #app#app#app button.obrixDangerButton small,
html body button.obrixDangerButton.obrixDangerButton span,
html body button.obrixDangerButton.obrixDangerButton strong,
html body button.obrixDangerButton.obrixDangerButton small{
  color:${WHITE}!important;
  -webkit-text-fill-color:${WHITE}!important;
}
html[data-theme="dark"] body #app#app#app button.obrixPetroleumButton:not(.obrixDangerButton),
body.dark #app#app#app button.obrixPetroleumButton:not(.obrixDangerButton),
html[data-theme="dark"] body button.obrixPetroleumButton.obrixPetroleumButton:not(.obrixDangerButton),
body.dark button.obrixPetroleumButton.obrixPetroleumButton:not(.obrixDangerButton){
  background:${PETROLEO}!important;
  background-color:${PETROLEO}!important;
  color:${WHITE}!important;
  -webkit-text-fill-color:${WHITE}!important;
  border-color:${PETROLEO_BORDER}!important;
}
html[data-theme="dark"] body #app#app#app button.obrixDangerButton,
body.dark #app#app#app button.obrixDangerButton,
html[data-theme="dark"] body button.obrixDangerButton.obrixDangerButton,
body.dark button.obrixDangerButton.obrixDangerButton{
  background:${DANGER}!important;
  background-color:${DANGER}!important;
  color:${WHITE}!important;
  -webkit-text-fill-color:${WHITE}!important;
  border-color:${DANGER_BORDER}!important;
}
html[data-obrix-offline="1"] body #app#app#app button.obrixPetroleumButton:not(.obrixDangerButton),
html[data-obrix-offline="1"] body button.obrixPetroleumButton.obrixPetroleumButton:not(.obrixDangerButton){
  background:${PETROLEO}!important;
  background-color:${PETROLEO}!important;
  color:${WHITE}!important;
  -webkit-text-fill-color:${WHITE}!important;
  border-color:${PETROLEO_BORDER}!important;
}
html[data-obrix-offline="1"] body #app#app#app button.obrixDangerButton,
html[data-obrix-offline="1"] body button.obrixDangerButton.obrixDangerButton{
  background:${DANGER}!important;
  background-color:${DANGER}!important;
  color:${WHITE}!important;
  -webkit-text-fill-color:${WHITE}!important;
  border-color:${DANGER_BORDER}!important;
}
html body button.obrixPetroleumButton:disabled,
html body button.obrixDangerButton:disabled{
  opacity:.58!important;
  box-shadow:none!important;
}
`;

function css(){
  let s=document.getElementById('obrixButtonColorsV1');
  if(!s){s=document.createElement('style');s.id='obrixButtonColorsV1';document.head.appendChild(s)}
  if(s.textContent!==STYLE)s.textContent=STYLE;
  if(s!==document.head.lastElementChild)document.head.appendChild(s);
}
let timer=0;
function schedule(){clearTimeout(timer);timer=setTimeout(()=>{css();scan(document)},30)}
function inspectAdded(node){
  if(!(node instanceof Element))return;
  if(node.matches?.('button'))classify(node);
  node.querySelectorAll?.('button').forEach(classify);
}
function start(){
  css();scan(document);
  if(document.body){
    new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes||[])inspectAdded(n)}).observe(document.body,{subtree:true,childList:true});
  }
  ['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:offline-bootstrap','pageshow','focus','online','offline'].forEach(n=>window.addEventListener(n,schedule));
  document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b)classify(b)},true);
  setTimeout(schedule,100);setTimeout(schedule,300);setTimeout(schedule,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_BUTTON_COLORS={scan:schedule,gold:PETROLEO,primary:PETROLEO,petroleum:PETROLEO,danger:DANGER};
})();