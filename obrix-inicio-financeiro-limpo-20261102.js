(()=>{
'use strict';
if(window.__OBRIX_INICIO_FINANCEIRO_LIMPO_20261102)return;
window.__OBRIX_INICIO_FINANCEIRO_LIMPO_20261102=true;
const STYLE_ID='obrix-inicio-financeiro-limpo-20261102-css';
function garantirCss(){
  if(document.getElementById(STYLE_ID))return;
  const st=document.createElement('style');
  st.id=STYLE_ID;
  st.textContent=`
html[data-theme="light"] #inicio #obxNovaObra,
html[data-theme="light"] #inicio .obxNova{
  background:#000!important;
  background-color:#000!important;
  background-image:none!important;
  color:#fff!important;
  -webkit-text-fill-color:#fff!important;
  border-color:#000!important;
  box-shadow:none!important;
}
html[data-theme="light"] #inicio #obxNovaObra *,
html[data-theme="light"] #inicio .obxNova *{
  color:#fff!important;
  -webkit-text-fill-color:#fff!important;
}
#financeiroMain > .kpis,
#financeiroMain #fmResumoObras,
#financeiroMain #obmResumoObrasAprovado{
  display:none!important;
}
`;
  document.head.appendChild(st);
}
garantirCss();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',garantirCss,{once:true});
window.OBRIX_INICIO_FINANCEIRO_LIMPO={refresh:garantirCss};
})();
