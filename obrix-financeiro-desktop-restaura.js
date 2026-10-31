(()=>{'use strict';
if(window.__OBRIX_FIN_DESKTOP_RESTAURA)return;window.__OBRIX_FIN_DESKTOP_RESTAURA=true;
const desktop=()=>matchMedia('(min-width:621px)').matches;
let tentando=false;
function visivel(){const m=document.getElementById('financeiroMain');return !!(m&&!m.classList.contains('hidden'))}
function restaurar(){
  if(!desktop()||!visivel())return;
  const main=document.getElementById('financeiroMain');
  if(!main||main.querySelector('.obxDash')||tentando)return;
  const api=window.OBRIX_FIN;if(!api||typeof api.open!=='function')return;
  tentando=true;
  try{api.open()}catch(e){console.warn('Financeiro desktop: resumo aprovado indisponível',e)}
  finally{setTimeout(()=>{tentando=false},80)}
}
function conferir(){[40,140,320,650,1100].forEach(ms=>setTimeout(restaurar,ms))}
document.addEventListener('click',e=>{
  if(!desktop())return;
  const b=e.target.closest?.('button');if(!b)return;
  const t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(t==='financeiro'||t.startsWith('financeiro '))conferir();
},true);
function observar(){
  const main=document.getElementById('financeiroMain');
  if(main&&!main.__obrixDesktopResumoObs){
    main.__obrixDesktopResumoObs=true;
    new MutationObserver(()=>{if(visivel())conferir()}).observe(main,{attributes:true,attributeFilter:['class']});
  }
}
window.addEventListener('pageshow',()=>{observar();if(visivel())conferir()});
window.addEventListener('obrix:modules-ready',()=>{observar();if(visivel())conferir()});
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='financeiro'){observar();if(visivel())conferir()}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observar,{once:true});else observar();
setTimeout(observar,250);setTimeout(observar,900);
window.OBRIX_FIN_DESKTOP_RESTAURA={refresh:conferir};
})();