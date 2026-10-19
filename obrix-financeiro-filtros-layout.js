(()=>{
  'use strict';
  if(window.__OBRIX_FIN_FILTROS_LAYOUT)return;
  window.__OBRIX_FIN_FILTROS_LAYOUT=true;
  const style=document.createElement('style');
  style.textContent=`
    #fmFiltrosPanel .fmFiltrosGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;align-items:end}
    #fmFiltrosPanel .fmFiltrosGrid label{min-width:0!important}
    #fmFiltrosPanel .fmFiltrosGrid label:last-child{grid-column:auto!important}
    #fmFiltrosPanel .fmFiltrosGrid select{width:100%!important;min-width:0!important}
    @media(max-width:760px){
      #fmFiltrosPanel .fmFiltrosGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      #fmFiltrosPanel .fmFiltrosHead{display:flex!important;align-items:flex-start!important}
      #fmFiltrosPanel .fmFiltrosHead button{width:auto!important;margin-top:0!important}
    }
    @media(max-width:390px){
      #fmFiltrosPanel{padding:12px!important}
      #fmFiltrosPanel .fmFiltrosGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
      #fmFiltrosPanel .fmFiltrosGrid label{font-size:11px!important}
      #fmFiltrosPanel .fmFiltrosGrid select{font-size:12px!important;padding:0 7px!important;min-height:43px!important}
      #fmFiltrosPanel .fmFiltrosHead{display:block!important}
      #fmFiltrosPanel .fmFiltrosHead button{width:100%!important;margin-top:8px!important}
    }
  `;
  document.head.appendChild(style);
})();
