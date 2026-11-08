(()=>{
'use strict';
if(window.__OBRIX_FOTOS_MENU_CLICKFIX_20261108)return;
window.__OBRIX_FOTOS_MENU_CLICKFIX_20261108=true;
const REQUIRED_VERSION='lab-sha256-20261108-clickfix';
const MODULE_PATH='./obrix-fotos-recuperadas-menu-20261107.js?v=20261108-clickfix3';
let loading=null,opening=false;
function ensureModule(){
 const current=window.OBRIX_FOTOS_RECUPERADAS;
 if(current?.version===REQUIRED_VERSION&&typeof current.open==='function')return Promise.resolve(current);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src=MODULE_PATH;script.async=false;
  script.dataset.obrixFotosOpenFix='1';
  let finished=false;
  const fail=(reason)=>{
   if(finished)return;finished=true;clearTimeout(timer);reject(new Error(reason));
  };
  const success=()=>{
   if(finished)return;finished=true;clearTimeout(timer);
   const feature=window.OBRIX_FOTOS_RECUPERADAS;
   if(feature?.version===REQUIRED_VERSION&&typeof feature.open==='function')resolve(feature);
   else reject(new Error('O módulo de fotografias não iniciou corretamente.'));
  };
  script.onload=success;
  script.onerror=()=>fail('O arquivo do módulo de fotografias não carregou.');
  const timer=setTimeout(()=>fail('A abertura excedeu o limite de tempo de 12 segundos.'),12000);
  document.body.append(script);
 }).finally(()=>{loading=null});
 return loading;
}
async function openPhotos(button){
 if(opening)return;
 opening=true;
 const previousLabel=button?.innerHTML;
 if(button){button.disabled=true;button.dataset.obrixFotosOpening='1'}
 try{
  const app=document.getElementById('app');
  if(!app||app.classList.contains('hidden'))throw new Error('É necessário entrar no OBRIX antes de abrir as fotografias.');
  const module=await ensureModule();
  const result=module.open();
  if(result===false)throw new Error('A galeria não conseguiu abrir a tela.');
  const root=document.getElementById('obrFrRoot');
  if(!root||root.hidden)throw new Error('A galeria foi carregada, mas a tela não ficou visível.');
 }catch(error){
  const text=error?.message||String(error);
  console.error('OBRIX fotos recuperadas — abertura:',error);
  alert('Fotografias recuperadas: '+text+'\n\nNenhuma fotografia ou dado foi alterado.');
 }finally{
  opening=false;
  if(button){button.disabled=false;delete button.dataset.obrixFotosOpening;if(previousLabel!==undefined)button.innerHTML=previousLabel}
 }
}
document.addEventListener('click',event=>{
 const target=event.target;
 const button=target?.closest?.('#menuMain [data-go="fotos_recuperadas"]');
 if(!button)return;
 event.preventDefault();
 event.stopPropagation();
 event.stopImmediatePropagation();
 void openPhotos(button);
},true);
})();