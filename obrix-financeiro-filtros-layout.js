(()=>{
  'use strict';
  if(window.__OBRIX_FIN_FILTROS_LAYOUT)return;
  window.__OBRIX_FIN_FILTROS_LAYOUT=true;
  const style=document.createElement('style');
  style.textContent=`
    #fmFiltrosPanel{max-width:100%!important;overflow:hidden!important;box-sizing:border-box!important}
    #fmFiltrosPanel .fmFiltrosGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;align-items:end;width:100%!important;max-width:100%!important}
    #fmFiltrosPanel .fmFiltrosGrid label{min-width:0!important;max-width:100%!important;overflow:hidden!important;box-sizing:border-box!important}
    #fmFiltrosPanel .fmFiltrosGrid label:last-child{grid-column:auto!important}
    #fmFiltrosPanel .fmFiltrosGrid select,
    #fmFiltrosPanel .fmFiltrosGrid input[type="date"]{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
    #fmFiltroDataInicio,#fmFiltroDataFim{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;inline-size:100%!important;max-inline-size:100%!important;min-inline-size:0!important;box-sizing:border-box!important;overflow:hidden!important}
    #fmFiltroDataInicio::-webkit-date-and-time-value,#fmFiltroDataFim::-webkit-date-and-time-value{min-width:0!important;width:100%!important;text-align:left!important}
    #fmFiltroDataInicio::-webkit-datetime-edit,#fmFiltroDataFim::-webkit-datetime-edit{min-width:0!important;max-width:100%!important}
    @media(max-width:760px){
      #fmFiltrosPanel .fmFiltrosGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;width:100%!important;max-width:100%!important;overflow:hidden!important}
      #fmFiltrosPanel .fmFiltrosHead{display:flex!important;align-items:flex-start!important}
      #fmFiltrosPanel .fmFiltrosHead button{width:auto!important;margin-top:0!important}
      #fmFiltroDataInicio,#fmFiltroDataFim{font-size:13px!important;padding-left:6px!important;padding-right:6px!important}
    }
    @media(max-width:390px){
      #fmFiltrosPanel{padding:12px!important}
      #fmFiltrosPanel .fmFiltrosGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
      #fmFiltrosPanel .fmFiltrosGrid label{font-size:11px!important}
      #fmFiltrosPanel .fmFiltrosGrid select,
      #fmFiltrosPanel .fmFiltrosGrid input[type="date"]{font-size:12px!important;padding-left:5px!important;padding-right:5px!important;min-height:43px!important}
      #fmFiltrosPanel .fmFiltrosHead{display:block!important}
      #fmFiltrosPanel .fmFiltrosHead button{width:100%!important;margin-top:8px!important}
    }
  `;
  document.head.appendChild(style);
})();
