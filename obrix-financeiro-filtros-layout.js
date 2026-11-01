(()=>{
  'use strict';
  if(window.__OBRIX_FIN_FILTROS_LAYOUT)return;
  window.__OBRIX_FIN_FILTROS_LAYOUT=true;
  const style=document.createElement('style');
  style.textContent=`
    #fmFiltrosPanel .fmFiltrosGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;align-items:end}
    #fmFiltrosPanel .fmFiltrosGrid label{min-width:0!important}
    #fmFiltrosPanel .fmFiltrosGrid label:last-child{grid-column:auto!important}
    #fmFiltrosPanel .fmFiltrosGrid select,
    #fmFiltrosPanel .fmFiltrosGrid input[type="date"]{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
    #fmFiltroDataInicio,#fmFiltroDataFim{display:block!important;inline-size:100%!important;max-inline-size:100%!important;min-inline-size:0!important}
    @media(max-width:760px){
      #fmFiltrosPanel .fmFiltrosGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;max-width:100%!important;overflow:hidden!important}
      #fmFiltrosPanel .fmFiltrosHead{display:flex!important;align-items:flex-start!important}
      #fmFiltrosPanel .fmFiltrosHead button{width:auto!important;margin-top:0!important}
      #fmFiltroDataInicio,#fmFiltroDataFim{font-size:13px!important;padding-left:7px!important;padding-right:7px!important}
    }
    @media(max-width:390px){
      #fmFiltrosPanel{padding:12px!important}
      #fmFiltrosPanel .fmFiltrosGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
      #fmFiltrosPanel .fmFiltrosGrid label{font-size:11px!important}
      #fmFiltrosPanel .fmFiltrosGrid select,
      #fmFiltrosPanel .fmFiltrosGrid input[type="date"]{font-size:12px!important;padding:0 6px!important;min-height:43px!important}
      #fmFiltrosPanel .fmFiltrosHead{display:block!important}
      #fmFiltrosPanel .fmFiltrosHead button{width:100%!important;margin-top:8px!important}
    }
  `;
  document.head.appendChild(style);
})();
