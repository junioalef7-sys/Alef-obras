(()=>{'use strict';
if(window.__OBRIX_AJUSTES_VISUAIS_PONTUAIS_3110)return;
window.__OBRIX_AJUSTES_VISUAIS_PONTUAIS_3110=true;
const CSS_ID='obrix-ajustes-visuais-pontuais-3110';
const vistos=new WeakSet();
const logosVistos=new WeakSet();
const novosVistos=new WeakSet();
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
#app>.top .obrixMarkHome{
  background:transparent!important;
  background-color:transparent!important;
  background-image:none!important;
  box-shadow:none!important;
}
html[data-theme="light"] #equipe .obrix-equipe-controles [data-cmd="novo"],
html:not([data-theme="dark"]) #equipe .obrix-equipe-controles [data-cmd="novo"]{
  background:#fff!important;
  background-color:#fff!important;
  background-image:none!important;
  color:#a66f00!important;
  -webkit-text-fill-color:#a66f00!important;
  border-color:#c48b18!important;
  opacity:1!important;
  visibility:visible!important;
  animation:none!important;
  transition:none!important;
  transform:none!important;
}
`;document.head.appendChild(s)
}
function logoSvg(){return `<svg data-obrix-logo-transparente="1" viewBox="0 0 120 120" role="img" aria-label="OBRIX" style="display:block;width:100%;height:100%;background:transparent"><path fill="#ff5a00" d="M13 82V47L61 8v24L31 56v26H13Z"/><path fill="#ff5a00" d="M69 29l38 26v27H90V64L69 50V29Z"/><path fill="currentColor" d="M39 82V59l11-8v31H39Zm17 0V36l12-8v54H56Zm20 0V57l10 7v18H76Z"/></svg>`}
function logoSemFundo(){
  const mark=document.querySelector('#app>.top .obrixMarkHome');
  if(!mark)return;
  mark.style.setProperty('background','transparent','important');
  mark.style.setProperty('background-color','transparent','important');
  mark.style.setProperty('background-image','none','important');
  mark.style.setProperty('box-shadow','none','important');
  if(mark.querySelector('img')||!mark.querySelector('svg[data-obrix-logo-transparente="1"]'))mark.innerHTML=logoSvg();
  const root=mark.closest('.brand');
  if(root&&!logosVistos.has(root)){
    logosVistos.add(root);
    new MutationObserver(()=>logoSemFundo()).observe(root,{childList:true,subtree:true})
  }
}
function novoClaroOk(b){return b&&b.dataset.obrixNovoLightFix==='1'&&b.style.getPropertyValue('background-color')==='#fff'&&b.style.getPropertyValue('animation')==='none'&&b.style.getPropertyValue('transition')==='none'}
function fixarNovoClaro(b){
  if(!b)return;
  const dark=document.documentElement.dataset.theme==='dark'||document.body.classList.contains('dark');
  if(dark){
    if(b.dataset.obrixNovoLightFix==='1'){
      delete b.dataset.obrixNovoLightFix;
      ['background','background-color','background-image','color','-webkit-text-fill-color','border-color','opacity','visibility','animation','transition','transform'].forEach(p=>b.style.removeProperty(p))
    }
    return
  }
  if(novoClaroOk(b))return;
  b.dataset.obrixNovoLightFix='1';
  b.style.setProperty('background','#fff','important');
  b.style.setProperty('background-color','#fff','important');
  b.style.setProperty('background-image','none','important');
  b.style.setProperty('color','#a66f00','important');
  b.style.setProperty('-webkit-text-fill-color','#a66f00','important');
  b.style.setProperty('border-color','#c48b18','important');
  b.style.setProperty('opacity','1','important');
  b.style.setProperty('visibility','visible','important');
  b.style.setProperty('animation','none','important');
  b.style.setProperty('transition','none','important');
  b.style.setProperty('transform','none','important')
}
function estabilizarNovoFuncionario(){
  const b=document.querySelector('#equipe .obrix-equipe-controles [data-cmd="novo"]');
  if(!b)return;
  fixarNovoClaro(b);
  if(novosVistos.has(b))return;
  novosVistos.add(b);
  new MutationObserver(()=>fixarNovoClaro(b)).observe(b,{attributes:true,attributeFilter:['style','class']})
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
function aplicar(){instalarCss();logoSemFundo();estabilizarNovoFuncionario();aplicarConfig()}
function reaplicar(){aplicar();setTimeout(aplicar,140)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar,{once:true});else aplicar();
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-applied','pageshow'].forEach(n=>window.addEventListener(n,reaplicar));
document.addEventListener('click',e=>{if(e.target.closest?.('[data-go="config"],#cfgExcluirConta,#configMain,.accountDeleteModal,#equipe'))reaplicar()},true)
})();