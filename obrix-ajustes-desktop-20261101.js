(()=>{
'use strict';
if(window.__OBRIX_AJUSTES_DESKTOP_20261101)return;
window.__OBRIX_AJUSTES_DESKTOP_20261101=true;

const desktop=()=>window.matchMedia?window.matchMedia('(min-width:621px)').matches:window.innerWidth>620;

function aplicar(){
  if(document.getElementById('obrix-ajustes-desktop-20261101-style'))return;
  const s=document.createElement('style');
  s.id='obrix-ajustes-desktop-20261101-style';
  s.textContent=`
@media (min-width:621px){
  .obxOnboarding{padding:10px 18px!important;overflow:hidden!important;align-items:center!important;justify-content:center!important}
  .obxOnboardCard{width:min(860px,calc(100vw - 36px))!important;height:calc(100dvh - 20px)!important;max-height:calc(100dvh - 20px)!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
  #obxOnboardBody{flex:1 1 auto!important;min-height:0!important;overflow:auto!important;overscroll-behavior:contain!important;padding-bottom:12px!important}
  .obxOnboardFooter{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;flex:0 0 auto!important;position:sticky!important;bottom:0!important;z-index:50!important;min-height:68px!important;padding:12px 18px!important;background:#fff!important;border-top:1px solid #e2e8f0!important}
  .obxOnboardButtons{display:flex!important;align-items:center!important;gap:10px!important;flex:0 0 auto!important}
  #obxOnboardPrev,#obxOnboardNext{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:44px!important;min-width:110px!important;padding:10px 16px!important;visibility:visible!important;opacity:1!important;white-space:nowrap!important}

  .obrixSetaVoltar,
  #app button[aria-label="Voltar"],
  #app a[aria-label="Voltar"]{font-size:0!important;position:relative!important}
  .obrixSetaVoltar::before,
  #app button[aria-label="Voltar"]::before,
  #app a[aria-label="Voltar"]::before{
    content:""!important;
    width:29px!important;height:29px!important;display:block!important;flex:0 0 29px!important;
    background:currentColor!important;
    -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M19%207%2010%2016l9%209M10%2016h13' fill='none' stroke='black' stroke-width='3.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat!important;
    mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M19%207%2010%2016l9%209M10%2016h13' fill='none' stroke='black' stroke-width='3.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/contain no-repeat!important;
  }
}
@media (min-width:621px) and (max-height:760px){
  #obxOnboardBody{padding:14px 22px 8px!important}
  .obxSlideHead{grid-template-columns:56px minmax(0,1fr)!important;gap:12px!important;margin-bottom:9px!important}
  .obxSlideIcon{width:56px!important;height:56px!important;font-size:28px!important}
  .obxSlideHead h1{font-size:23px!important;margin-bottom:4px!important}
  .obxSlideHead p{font-size:13px!important}
  .obxFeatureGrid{gap:7px!important}
  .obxFeature{min-height:70px!important;padding:9px 11px!important}
  .obxFeature b{font-size:13px!important;margin-bottom:3px!important}
  .obxFeature span{font-size:12px!important;line-height:1.3!important}
  .obxOnboardFooter{min-height:62px!important;padding:9px 18px!important}
}
html[data-theme="dark"] .obxOnboardFooter{background:#0d1722!important;border-top-color:#293b4d!important}

#orcamentosMain .orcPerigo,
#orcamentosMain .obrixApagarRegistro,
#diarioMain .diarioPerigo,
#diarioMain .obrixApagarRegistro{
  background:var(--ob-surface-2,#e5eaf0)!important;
  background-color:var(--ob-surface-2,#e5eaf0)!important;
  background-image:none!important;
  color:var(--ob-text,#0f172a)!important;
  -webkit-text-fill-color:var(--ob-text,#0f172a)!important;
  border:1px solid var(--ob-border,#cbd5df)!important;
  box-shadow:none!important;
}

html[data-theme="light"] #cfgExcluirConta,
html[data-theme="light"] button#cfgExcluirConta,
html[data-theme="light"] .accountDeleteBtn,
html[data-theme="light"] .accountDeleteModal .excluir{
  background:var(--ob-surface-2,#e5eaf0)!important;
  background-color:var(--ob-surface-2,#e5eaf0)!important;
  background-image:none!important;
  color:var(--ob-text,#0f172a)!important;
  -webkit-text-fill-color:var(--ob-text,#0f172a)!important;
  border:0!important;
  outline:0!important;
  box-shadow:none!important;
  filter:none!important;
}
html[data-theme="light"] #cfgExcluirConta:is(:hover,:focus,:active),
html[data-theme="light"] button#cfgExcluirConta:is(:hover,:focus,:active),
html[data-theme="light"] .accountDeleteBtn:is(:hover,:focus,:active),
html[data-theme="light"] .accountDeleteModal .excluir:is(:hover,:focus,:active){
  background:var(--ob-surface-2,#e5eaf0)!important;
  background-color:var(--ob-surface-2,#e5eaf0)!important;
  background-image:none!important;
  color:var(--ob-text,#0f172a)!important;
  -webkit-text-fill-color:var(--ob-text,#0f172a)!important;
  border:0!important;
  outline:0!important;
  box-shadow:none!important;
}
`;
  s.textContent+=`
/* Rodapé do computador: retirar apenas o painel de fundo,
   preservando os quatro botões e toda a navegação aprovada. */
@media (min-width:761px){
  html:not([data-obrix-offline-v3="1"]) body #app > .bottom:not(#obrixOfflineV3Bottom){
    background:transparent!important;
    background-color:transparent!important;
    background-image:none!important;
    border-top:0!important;
    border-bottom:0!important;
    box-shadow:none!important;
    backdrop-filter:none!important;
    -webkit-backdrop-filter:none!important;
  }
}
@media (min-width:621px){
  #app button[aria-label="Voltar"],#app a[aria-label="Voltar"],
  #app #obrixHeaderVoltar,.obrixSetaVoltar{
    transition:none!important;animation:none!important;
  }
  #app button[aria-label="Voltar"]:has(svg)::before,
  #app a[aria-label="Voltar"]:has(svg)::before{
    content:none!important;display:none!important;
  }
  #app>.top #obrixHeaderVoltar::before,
  #app>.top #obrixHeaderVoltar::after{content:none!important;display:none!important}
  #app>.top #obrixHeaderVoltar svg[data-obrix-back-icon]{display:block!important;visibility:visible!important}
  #app>.top:has(#obrixHeaderVoltar:not(.hidden)) button[aria-label="Voltar"]:not(#obrixHeaderVoltar){display:none!important}
}
`;
  document.head.appendChild(s);
}

let finPromise=null;
function carregarResumoFinanceiroDesktop(){
  if(!desktop())return Promise.resolve(false);
  const loader=window.OBRIX_POS_LOGIN_LOADER;
  if(!loader?.loadGroup)return Promise.resolve(false);
  if(finPromise)return finPromise;
  finPromise=Promise.resolve(loader.loadGroup('financeiro')).then(ok=>{
    if(ok!==false)window.dispatchEvent(new Event('obrix-financeiro-atualizado'));
    return ok;
  }).catch(()=>false).finally(()=>{finPromise=null});
  return finPromise;
}

function ligarFinanceiro(){
  const api=window.OBRIX_FIN;
  if(!api?.open||api.open.__obrixResumoDesktop)return false;
  const original=api.open.bind(api);
  const fn=function(){
    const r=original(...arguments);
    if(desktop())setTimeout(carregarResumoFinanceiroDesktop,0);
    return r;
  };
  fn.__obrixResumoDesktop=true;
  api.open=fn;
  return true;
}

function preparar(){aplicar();ligarFinanceiro()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',preparar,{once:true});
else preparar();

['pageshow','obrix:modules-ready','obrix:modules-online-ready'].forEach(n=>window.addEventListener(n,()=>setTimeout(ligarFinanceiro,0)));
[250,700,1400,2800].forEach(ms=>setTimeout(ligarFinanceiro,ms));

document.addEventListener('click',e=>{
  if(!desktop())return;
  const b=e.target?.closest?.('button,a');if(!b)return;
  const code=b.getAttribute?.('onclick')||'';
  const texto=String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(code.includes('OBRIX_FIN')||texto==='financeiro'){
    ligarFinanceiro();
    setTimeout(carregarResumoFinanceiroDesktop,0);
  }
},true);
})();