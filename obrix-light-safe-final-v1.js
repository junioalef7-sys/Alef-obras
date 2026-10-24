(()=>{'use strict';
if(window.__OBRIX_LIGHT_SAFE_FINAL_V1)return;window.__OBRIX_LIGHT_SAFE_FINAL_V1=true;
const STYLE_ID='obrixLightSafeFinalV1';
const CSS=`
html[data-theme="light"],html:not([data-theme="dark"]){--surface:#F5F7FA!important;--surface2:#F5F7FA!important}

/* Pagar da Equipe: fundo escolhido no modo claro. */
html[data-theme="light"] body #app #equipe .obrix-equipe-secundario button.obrix-cmd.obrix-pagar-equipe-topo,
html:not([data-theme="dark"]) body:not(.dark) #app #equipe .obrix-equipe-secundario button.obrix-cmd.obrix-pagar-equipe-topo{
  background:#F5F7FA!important;
  background-color:#F5F7FA!important;
  background-image:none!important;
  color:#111827!important;
  -webkit-text-fill-color:#111827!important;
  border:1px solid #D9E0E8!important;
  box-shadow:none!important;
  text-shadow:none!important;
}

/* Excluir conta: vermelho cheio com letras brancas no modo claro. */
html[data-theme="light"] body #app #configMain #cfgExcluirConta.accountDeleteBtn,
html:not([data-theme="dark"]) body:not(.dark) #app #configMain #cfgExcluirConta.accountDeleteBtn,
html[data-theme="light"] body .accountDeleteModal button.excluir,
html:not([data-theme="dark"]) body:not(.dark) .accountDeleteModal button.excluir{
  background:#B91C1C!important;
  background-color:#B91C1C!important;
  background-image:none!important;
  color:#FFFFFF!important;
  -webkit-text-fill-color:#FFFFFF!important;
  border:1px solid #991B1B!important;
  box-shadow:none!important;
  text-shadow:none!important;
}

/* Botão pequeno de Claro/Escuro dentro da tela inicial. */
#inicio #obrixThemeInicioSafe{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  min-height:40px;
  margin:0 0 12px auto;
  padding:9px 12px;
  border-radius:11px;
  font-weight:850;
  border:1px solid #D9E0E8;
  background:#F5F7FA;
  color:#111827;
  box-shadow:none;
}
html[data-theme="dark"] #inicio #obrixThemeInicioSafe,body.dark #inicio #obrixThemeInicioSafe{
  background:#0F1720;
  color:#FFFFFF;
  border-color:#2A3948;
}
`;
function installStyle(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;s.textContent=CSS;document.head.appendChild(s)}else if(s.textContent!==CSS)s.textContent=CSS}
function label(){const b=document.getElementById('obrixThemeInicioSafe');if(!b)return;const dark=document.documentElement.dataset.theme==='dark'||document.body?.classList.contains('dark');b.textContent=dark?'☀️ Claro':'🌙 Escuro';b.setAttribute('aria-label',dark?'Ativar modo claro':'Ativar modo escuro')}
function installButton(){const inicio=document.getElementById('inicio');if(!inicio)return false;let b=document.getElementById('obrixThemeInicioSafe');if(!b){b=document.createElement('button');b.id='obrixThemeInicioSafe';b.type='button';b.onclick=()=>{const dark=document.documentElement.dataset.theme==='dark'||document.body?.classList.contains('dark');const next=dark?'light':'dark';if(window.OBRIX_THEME?.apply)window.OBRIX_THEME.apply(next);else{document.documentElement.dataset.theme=next;try{localStorage.setItem('obrix_theme',next)}catch(_){}}setTimeout(label,0)};inicio.insertBefore(b,inicio.firstChild)}label();return true}
function apply(){installStyle();installButton();window.OBRIX_LIGHT_CARDS_FINAL?.scan?.()}
installStyle();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,350),{once:true});else setTimeout(apply,350);
['pageshow','obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(n=>window.addEventListener(n,()=>setTimeout(apply,40)));
document.addEventListener('click',e=>{if(e.target.closest?.('#bInicio,#inicio,.bottom button'))setTimeout(apply,120)},true);
setTimeout(apply,900);setTimeout(apply,2200);
window.OBRIX_LIGHT_SAFE_FINAL={apply};
})();