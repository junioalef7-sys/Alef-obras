(()=>{'use strict';
if(window.__OBRIX_AJUSTES_VISUAIS_PONTUAIS_3110)return;
window.__OBRIX_AJUSTES_VISUAIS_PONTUAIS_3110=true;
const CSS_ID='obrix-ajustes-visuais-pontuais-3110';
const vistos=new WeakSet();
function instalarCss(){
  if(document.getElementById(CSS_ID))return;
  const s=document.createElement('style');s.id=CSS_ID;s.textContent=`
#configMain .cfgDeleteGrid button,
#configMain #cfgExcluirConta,
.accountDeleteModal button.excluir{
  background:var(--ob-surface-2)!important;
  background-color:var(--ob-surface-2)!important;
  background-image:none!important;
  color:var(--ob-text)!important;
  -webkit-text-fill-color:var(--ob-text)!important;
  border:1px solid var(--ob-border)!important;
  box-shadow:none!important;
  text-shadow:none!important;
}
.diarioPdfActions .fechar{display:none!important}
`;document.head.appendChild(s)
}
function logoSemFundo(){
  const mark=document.querySelector('#app>.top .obrixMarkHome');
  if(!mark||mark.dataset.obrixSemFundo==='1')return;
  mark.dataset.obrixSemFundo='1';
  mark.style.setProperty('background','transparent','important');
  mark.style.setProperty('background-color','transparent','important');
  mark.innerHTML=`<svg viewBox="0 0 120 120" role="img" aria-label="OBRIX" style="display:block;width:100%;height:100%"><path fill="#ff5a00" d="M13 82V47L61 8v24L31 56v26H13Z"/><path fill="#ff5a00" d="M69 29l38 26v27H90V64L69 50V29Z"/><path fill="currentColor" d="M39 82V59l11-8v31H39Zm17 0V36l12-8v54H56Zm20 0V57l10 7v18H76Z"/></svg>`
}
function estaNeutro(b){return b&&!b.classList.contains('obrixConfigPerigo')&&b.style.getPropertyValue('color')==='var(--ob-text)'&&b.style.getPropertyValue('border-color')==='var(--ob-border)'}
function neutralizar(b){
  if(!b)return;
  b.classList.remove('obrixConfigPerigo');
  b.style.setProperty('background','var(--ob-surface-2)','important');
  b.style.setProperty('background-color','var(--ob-surface-2)','important');
  b.style.setProperty('background-image','none','important');
  b.style.setProperty('color','var(--ob-text)','important');
  b.style.setProperty('-webkit-text-fill-color','var(--ob-text)','important');
  b.style.setProperty('border','1px solid var(--ob-border)','important');
  b.style.setProperty('border-color','var(--ob-border)','important');
  b.style.setProperty('box-shadow','none','important');
  b.style.setProperty('text-shadow','none','important')
}
function vigiar(b){
  if(!b)return;neutralizar(b);if(vistos.has(b))return;vistos.add(b);
  new MutationObserver(()=>{if(!estaNeutro(b))neutralizar(b)}).observe(b,{attributes:true,attributeFilter:['style','class']})
}
function aplicarConfig(){
  const root=document.getElementById('configMain');
  if(root){
    root.querySelectorAll('[data-del="equipe"],[data-del="financeiro"],[data-del="obras"],[data-del="tudo"],#cfgExcluirConta').forEach(vigiar);
    if(root.dataset.obrixNeutrosObs!=='1'){
      root.dataset.obrixNeutrosObs='1';
      new MutationObserver(()=>root.querySelectorAll('[data-del="equipe"],[data-del="financeiro"],[data-del="obras"],[data-del="tudo"],#cfgExcluirConta').forEach(vigiar)).observe(root,{childList:true,subtree:true})
    }
  }
  document.querySelectorAll('.accountDeleteModal button.excluir').forEach(vigiar)
}
function aplicar(){instalarCss();logoSemFundo();aplicarConfig()}
function reaplicar(){aplicar();setTimeout(aplicar,140)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar,{once:true});else aplicar();
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-applied','pageshow'].forEach(n=>window.addEventListener(n,reaplicar));
document.addEventListener('click',e=>{if(e.target.closest?.('[data-go="config"],#cfgExcluirConta,#configMain,.accountDeleteModal'))reaplicar()},true)
})();