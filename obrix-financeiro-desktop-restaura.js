(()=>{'use strict';
if(!matchMedia('(min-width:621px)').matches)return;
if(window.__OBRIX_FIN_DESKTOP_RESTAURA_V2)return;window.__OBRIX_FIN_DESKTOP_RESTAURA_V2=true;
let carregando=false,reparado=false;
const visivel=()=>{const m=document.getElementById('financeiroMain');return !!(m&&!m.classList.contains('hidden'))};
function resumoJaLigado(){
  const fn=window.OBRIX_FIN?.open;if(typeof fn!=='function')return false;
  try{return Function.prototype.toString.call(fn).includes('setTimeout(render,50)')}catch(_){return false}
}
function carregarResumoAprovado(){
  if(reparado||carregando||resumoJaLigado()){reparado=resumoJaLigado()||reparado;return}
  if(!window.OBRIX_FIN||typeof window.OBRIX_FIN.open!=='function')return;
  carregando=true;
  window.__OBX_FIN_APROVADO=0;
  const s=document.createElement('script');
  s.src='./obrix-financeiro-dashboard-aprovado.js?v=20261031approved-desktop2';
  s.async=false;
  s.onload=()=>{
    carregando=false;
    reparado=resumoJaLigado();
    if(reparado&&visivel()){
      try{window.OBRIX_FIN.open()}catch(e){console.warn('Financeiro desktop: não foi possível reabrir o resumo aprovado',e)}
    }
  };
  s.onerror=()=>{carregando=false;console.warn('Financeiro desktop: não foi possível carregar o resumo aprovado')};
  document.head.appendChild(s);
}
function conferir(){
  if(resumoJaLigado()){reparado=true;return}
  carregarResumoAprovado();
}
window.addEventListener('click',e=>{
  const b=e.target.closest?.('button');if(!b)return;
  const t=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(t==='financeiro'||t.startsWith('financeiro '))setTimeout(conferir,80);
},true);
window.addEventListener('obrix:modules-ready',()=>setTimeout(conferir,120));
window.addEventListener('obrix:modules-online-ready',()=>setTimeout(conferir,120));
window.addEventListener('obrix:grupo-pronto',e=>{if(e.detail?.name==='financeiro')setTimeout(conferir,80)});
window.addEventListener('pageshow',()=>setTimeout(conferir,180));
setTimeout(conferir,1200);
window.OBRIX_FIN_DESKTOP_RESTAURA={refresh:conferir,status:()=>({reparado,carregando,resumoLigado:resumoJaLigado()})};
})();