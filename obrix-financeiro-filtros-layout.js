(()=>{
  'use strict';
  if(window.__OBRIX_FIN_FILTROS_LAYOUT)return;
  window.__OBRIX_FIN_FILTROS_LAYOUT=true;

  const style=document.createElement('style');
  style.id='obrix-financeiro-filtros-layout-style';
  style.textContent=`
    #fmFiltrosPanel .fmFiltrosGrid{
      display:grid!important;
      grid-template-columns:repeat(3,minmax(0,1fr))!important;
      gap:10px!important;
      align-items:end!important;
      width:100%!important;
      max-width:100%!important;
    }
    #fmFiltrosPanel .fmFiltrosGrid>label{
      min-width:0!important;
      max-width:100%!important;
    }
    #fmFiltrosPanel .fmFiltrosGrid select,
    #fmFiltrosPanel .fmFiltrosGrid input[type="date"]{
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      box-sizing:border-box!important;
    }
    #fmFiltroDataInicio,#fmFiltroDataFim{
      display:block!important;
      width:100%!important;
      max-width:100%!important;
      min-width:0!important;
      inline-size:100%!important;
      max-inline-size:100%!important;
      min-inline-size:0!important;
      box-sizing:border-box!important;
    }

    @media(max-width:760px){
      #fmFiltrosPanel .fmFiltrosGrid{
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        overflow:visible!important;
      }
      #fmFiltrosPanel .fmFiltrosHead{
        display:flex!important;
        align-items:flex-start!important;
      }
      #fmFiltrosPanel .fmFiltrosHead button{
        width:auto!important;
        margin-top:0!important;
      }
    }

    @media(max-width:620px){
      #fmFiltrosPanel .fmFiltrosGrid{
        grid-template-columns:1fr!important;
        gap:8px!important;
      }
      #fmFiltrosPanel .fmDateRow{
        display:grid!important;
        grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;
        gap:8px!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        grid-column:1/-1!important;
        align-items:end!important;
      }
      #fmFiltrosPanel .fmDateRow>label{
        display:block!important;
        width:100%!important;
        max-width:100%!important;
        min-width:0!important;
        margin:0!important;
        overflow:hidden!important;
        font-size:12px!important;
        font-weight:800!important;
      }
      #fmFiltroDataInicio,#fmFiltroDataFim{
        height:38px!important;
        min-height:38px!important;
        max-height:38px!important;
        line-height:38px!important;
        margin:5px 0 0!important;
        padding:0 5px!important;
        border-radius:9px!important;
        font-size:12px!important;
        letter-spacing:-.2px!important;
        overflow:hidden!important;
        -webkit-appearance:auto!important;
        appearance:auto!important;
      }
      #fmFiltroDataInicio::-webkit-date-and-time-value,
      #fmFiltroDataFim::-webkit-date-and-time-value{
        margin:0!important;
        padding:0!important;
        text-align:left!important;
      }
      #fmFiltroDataInicio::-webkit-calendar-picker-indicator,
      #fmFiltroDataFim::-webkit-calendar-picker-indicator{
        width:16px!important;
        height:16px!important;
        margin:0!important;
        padding:0!important;
      }
    }

    @media(max-width:390px){
      #fmFiltrosPanel{padding:12px!important}
      #fmFiltrosPanel .fmDateRow{gap:6px!important}
      #fmFiltroDataInicio,#fmFiltroDataFim{
        height:36px!important;
        min-height:36px!important;
        max-height:36px!important;
        line-height:36px!important;
        font-size:11px!important;
        padding:0 3px!important;
      }
      #fmFiltrosPanel .fmFiltrosHead{display:block!important}
      #fmFiltrosPanel .fmFiltrosHead button{width:100%!important;margin-top:8px!important}
    }
  `;
  document.head.appendChild(style);

  function organizarDatas(){
    const grid=document.querySelector('#fmFiltrosPanel .fmFiltrosGrid');
    const inicio=document.getElementById('fmFiltroDataInicio');
    const fim=document.getElementById('fmFiltroDataFim');
    if(!grid||!inicio||!fim)return false;
    const li=inicio.closest('label');
    const lf=fim.closest('label');
    if(!li||!lf)return false;
    let row=grid.querySelector(':scope > .fmDateRow');
    if(!row){
      row=document.createElement('div');
      row.className='fmDateRow';
      grid.insertBefore(row,li);
    }
    if(li.parentElement!==row)row.appendChild(li);
    if(lf.parentElement!==row)row.appendChild(lf);
    return true;
  }

  const obs=new MutationObserver(()=>requestAnimationFrame(organizarDatas));
  obs.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',organizarDatas);
  window.addEventListener('resize',organizarDatas);
  window.addEventListener('focus',organizarDatas);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)organizarDatas()});
  setTimeout(organizarDatas,50);
  setTimeout(organizarDatas,250);
  setTimeout(organizarDatas,800);

  window.OBRIX_FIN_FILTROS_LAYOUT={refresh:organizarDatas};
})();
