(()=>{
'use strict';
if(window.__OBRIX_UI_FINAL_FIX_20261101)return;
window.__OBRIX_UI_FINAL_FIX_20261101=true;

const style=document.createElement('style');
style.id='obrix-ui-final-fix-20261101-style';
style.textContent=`
@media (min-width:681px){
  .obxOnboarding{
    z-index:2147483000!important;
    padding:12px 18px 84px!important;
    align-items:center!important;
    justify-content:center!important;
    overflow:hidden!important;
  }
  .obxOnboardCard{
    width:min(860px,calc(100vw - 36px))!important;
    height:calc(100dvh - 108px)!important;
    max-height:calc(100dvh - 108px)!important;
    min-height:0!important;
    display:flex!important;
    flex-direction:column!important;
    overflow:hidden!important;
  }
  #obxOnboardBody{
    flex:1 1 auto!important;
    min-height:0!important;
    overflow:auto!important;
    overscroll-behavior:contain!important;
    padding-bottom:12px!important;
  }
  .obxOnboardFooter{
    display:flex!important;
    flex:0 0 auto!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:12px!important;
    min-height:66px!important;
    padding:11px 18px!important;
    position:relative!important;
    z-index:10!important;
    background:#fff!important;
    border-top:1px solid #e2e8f0!important;
  }
  .obxOnboardButtons{
    display:flex!important;
    align-items:center!important;
    gap:10px!important;
    flex:0 0 auto!important;
  }
  #obxOnboardPrev,#obxOnboardNext{
    display:inline-flex!important;
    align-items:center!important;
    justify-content:center!important;
    min-width:110px!important;
    min-height:44px!important;
    padding:10px 16px!important;
    visibility:visible!important;
    opacity:1!important;
    white-space:nowrap!important;
  }
}
@media (min-width:681px) and (max-height:760px){
  #obxOnboardBody{padding:12px 20px 8px!important}
  .obxSlideHead{grid-template-columns:52px minmax(0,1fr)!important;gap:11px!important;margin-bottom:8px!important}
  .obxSlideIcon{width:52px!important;height:52px!important;font-size:26px!important}
  .obxSlideHead h1{font-size:22px!important;margin-bottom:3px!important}
  .obxSlideHead p{font-size:12px!important}
  .obxFeatureGrid{gap:6px!important}
  .obxFeature{min-height:64px!important;padding:8px 10px!important}
  .obxFeature b{font-size:12px!important;margin-bottom:2px!important}
  .obxFeature span{font-size:11px!important;line-height:1.25!important}
  .obxOnboardFooter{min-height:60px!important;padding:8px 16px!important}
}
html[data-theme="dark"] .obxOnboardFooter{
  background:#0b1524!important;
  border-top-color:#334155!important;
}
`;
document.head.appendChild(style);

function corVermelha(valor){
  const m=String(valor||'').match(/rgba?\((\d+)\D+(\d+)\D+(\d+)/i);
  if(!m)return false;
  const r=Number(m[1]),g=Number(m[2]),b=Number(m[3]);
  return r>150&&r>g*1.25&&r>b*1.2;
}

function neutralizarExcluirConta(){
  if(document.documentElement.dataset.theme!=='light')return;
  const root=document.getElementById('configMain')||document;
  root.querySelectorAll('.accountDeleteModal .excluir').forEach(b=>{
    b.style.setProperty('background','var(--ob-surface-2,#e5eaf0)','important');
    b.style.setProperty('background-color','var(--ob-surface-2,#e5eaf0)','important');
    b.style.setProperty('background-image','none','important');
    b.style.setProperty('color','#0f172a','important');
    b.style.setProperty('-webkit-text-fill-color','#0f172a','important');
    b.style.setProperty('border','0','important');
    b.style.setProperty('outline','0','important');
    b.style.setProperty('box-shadow','none','important');
    b.style.setProperty('filter','none','important');

    let p=b.parentElement;
    let nivel=0;
    while(p&&p!==root&&nivel<4){
      const cs=getComputedStyle(p);
      const classe=String(p.className||'').toLowerCase();
      const ehAreaPerigo=/danger|dangerous|perigo|delete|excluir/.test(classe);
      if(ehAreaPerigo||corVermelha(cs.backgroundColor)||corVermelha(cs.borderTopColor)||corVermelha(cs.borderColor)){
        p.style.setProperty('background','var(--ob-surface,#f8fafc)','important');
        p.style.setProperty('background-color','var(--ob-surface,#f8fafc)','important');
        p.style.setProperty('background-image','none','important');
        p.style.setProperty('border-color','transparent','important');
        p.style.setProperty('box-shadow','none','important');
      }
      p=p.parentElement;
      nivel++;
    }
  });
}

function aplicar(){neutralizarExcluirConta()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar,{once:true});else aplicar();
window.addEventListener('pageshow',aplicar);
window.addEventListener('obrix:theme-applied',()=>setTimeout(aplicar,0));
document.addEventListener('click',()=>{
  if(!document.getElementById('configMain')&&!document.querySelector('.accountDeleteModal'))return;
  setTimeout(aplicar,0);
  setTimeout(aplicar,180);
});
})();
(()=>{'use strict';
const carregar=(src,id)=>{
  if(document.getElementById(id))return;
  const s=document.createElement('script');
  s.id=id;
  s.src=src;
  s.async=false;
  document.body.appendChild(s);
};
carregar('./obrix-refresh-direto-20261101.js?v=20261101-direto1','obrix-refresh-direto-20261101-loader');
carregar('./obrix-equipe-bonus.js?v=20261101-direto1','obrix-equipe-bonus-direto-loader');
carregar('./obrix-financeiro-lucro-estavel.js?v=20261102-lucro1','obrix-financeiro-lucro-estavel-loader');
// Sync Realtime é carregado uma única vez pela página, após a sessão.
})();