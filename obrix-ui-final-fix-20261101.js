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
  root.querySelectorAll('#cfgExcluirConta,.accountDeleteBtn,.accountDeleteModal .excluir').forEach(b=>{
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

/* OBRIX — Equipe: somente cores por ação; layout, textos e funções permanecem intactos. */
(()=>{
'use strict';
if(window.__OBRIX_EQUIPE_CORES_ACOES_20261101)return;
window.__OBRIX_EQUIPE_CORES_ACOES_20261101=true;
const s=document.createElement('style');
s.id='obrix-equipe-cores-acoes-20261101';
s.textContent=`
/* MODO CLARO */
html[data-theme="light"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-acao="diaria"]{background:#eff6ff!important;background-color:#eff6ff!important;color:#1d4ed8!important;-webkit-text-fill-color:#1d4ed8!important;border-color:#bfdbfe!important}
html[data-theme="light"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-equipe-extra-card="vale"]{background:#fff7ed!important;background-color:#fff7ed!important;color:#c2410c!important;-webkit-text-fill-color:#c2410c!important;border-color:#fed7aa!important}
html[data-theme="light"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-equipe-extra-card="bonus"]{background:#f0fdf4!important;background-color:#f0fdf4!important;color:#15803d!important;-webkit-text-fill-color:#15803d!important;border-color:#bbf7d0!important}
html[data-theme="light"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-acao="falta"]{background:#fff1f2!important;background-color:#fff1f2!important;color:#be123c!important;-webkit-text-fill-color:#be123c!important;border-color:#fecdd3!important}
html[data-theme="light"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-acao="registros"]{background:#f5f3ff!important;background-color:#f5f3ff!important;color:#6d28d9!important;-webkit-text-fill-color:#6d28d9!important;border-color:#ddd6fe!important}
html[data-theme="light"] body #app#app #equipe#equipe .obrix-equipe-controles .obrix-pagar-equipe-topo{background:#ecfdf5!important;background-color:#ecfdf5!important;color:#047857!important;-webkit-text-fill-color:#047857!important;border-color:#a7f3d0!important}
html[data-theme="light"] body #app#app #equipe#equipe .obrix-equipe-controles .obrix-historico-pagamentos-topo{background:#eef2ff!important;background-color:#eef2ff!important;color:#4338ca!important;-webkit-text-fill-color:#4338ca!important;border-color:#c7d2fe!important}
html[data-theme="light"] body #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="toggle"]{background:#f0fdfa!important;background-color:#f0fdfa!important;color:#0f766e!important;-webkit-text-fill-color:#0f766e!important;border-color:#99f6e4!important}
html[data-theme="light"] body #app#app #equipe#equipe .obrix-equipe-controles .obrix-filtro-equipe{background:#fffbeb!important;background-color:#fffbeb!important;color:#a16207!important;-webkit-text-fill-color:#a16207!important;border-color:#fde68a!important}
html[data-theme="light"] body #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="novo"]{background:#f0f9ff!important;background-color:#f0f9ff!important;color:#0369a1!important;-webkit-text-fill-color:#0369a1!important;border-color:#bae6fd!important}
html[data-theme="light"] body #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="lista"]{background:#ecfeff!important;background-color:#ecfeff!important;color:#0e7490!important;-webkit-text-fill-color:#0e7490!important;border-color:#a5f3fc!important}
html[data-theme="light"] body #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="excluir"]{background:#f8fafc!important;background-color:#f8fafc!important;color:#475569!important;-webkit-text-fill-color:#475569!important;border-color:#cbd5e1!important}

/* MODO ESCURO */
html[data-theme="dark"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-acao="diaria"],body.dark #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-acao="diaria"]{background:#0c2748!important;background-color:#0c2748!important;color:#bfdbfe!important;-webkit-text-fill-color:#bfdbfe!important;border-color:#1d4ed8!important}
html[data-theme="dark"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-equipe-extra-card="vale"],body.dark #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-equipe-extra-card="vale"]{background:#3a2110!important;background-color:#3a2110!important;color:#fed7aa!important;-webkit-text-fill-color:#fed7aa!important;border-color:#9a3412!important}
html[data-theme="dark"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-equipe-extra-card="bonus"],body.dark #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-equipe-extra-card="bonus"]{background:#12321e!important;background-color:#12321e!important;color:#bbf7d0!important;-webkit-text-fill-color:#bbf7d0!important;border-color:#15803d!important}
html[data-theme="dark"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-acao="falta"],body.dark #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-acao="falta"]{background:#3a1823!important;background-color:#3a1823!important;color:#fecdd3!important;-webkit-text-fill-color:#fecdd3!important;border-color:#be123c!important}
html[data-theme="dark"] body #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-acao="registros"],body.dark #app#app #equipe#equipe #listaEquipe .obrix-modelo-acoes button[data-acao="registros"]{background:#2a1f47!important;background-color:#2a1f47!important;color:#ddd6fe!important;-webkit-text-fill-color:#ddd6fe!important;border-color:#6d28d9!important}
html[data-theme="dark"] body #app#app #equipe#equipe .obrix-equipe-controles .obrix-pagar-equipe-topo,body.dark #app#app #equipe#equipe .obrix-equipe-controles .obrix-pagar-equipe-topo{background:#0f3028!important;background-color:#0f3028!important;color:#a7f3d0!important;-webkit-text-fill-color:#a7f3d0!important;border-color:#047857!important}
html[data-theme="dark"] body #app#app #equipe#equipe .obrix-equipe-controles .obrix-historico-pagamentos-topo,body.dark #app#app #equipe#equipe .obrix-equipe-controles .obrix-historico-pagamentos-topo{background:#1e2550!important;background-color:#1e2550!important;color:#c7d2fe!important;-webkit-text-fill-color:#c7d2fe!important;border-color:#4f46e5!important}
html[data-theme="dark"] body #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="toggle"],body.dark #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="toggle"]{background:#103431!important;background-color:#103431!important;color:#99f6e4!important;-webkit-text-fill-color:#99f6e4!important;border-color:#0f766e!important}
html[data-theme="dark"] body #app#app #equipe#equipe .obrix-equipe-controles .obrix-filtro-equipe,body.dark #app#app #equipe#equipe .obrix-equipe-controles .obrix-filtro-equipe{background:#372b0e!important;background-color:#372b0e!important;color:#fde68a!important;-webkit-text-fill-color:#fde68a!important;border-color:#a16207!important}
html[data-theme="dark"] body #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="novo"],body.dark #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="novo"]{background:#0d2d3e!important;background-color:#0d2d3e!important;color:#bae6fd!important;-webkit-text-fill-color:#bae6fd!important;border-color:#0369a1!important}
html[data-theme="dark"] body #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="lista"],body.dark #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="lista"]{background:#0e3038!important;background-color:#0e3038!important;color:#a5f3fc!important;-webkit-text-fill-color:#a5f3fc!important;border-color:#0e7490!important}
html[data-theme="dark"] body #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="excluir"],body.dark #app#app #equipe#equipe .obrix-equipe-controles button.obrix-cmd[data-cmd="excluir"]{background:#1e293b!important;background-color:#1e293b!important;color:#e2e8f0!important;-webkit-text-fill-color:#e2e8f0!important;border-color:#475569!important}
`;
document.head.appendChild(s);
})();