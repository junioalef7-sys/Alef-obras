/* OBRIX Android — centraliza e padroniza todas as setas reais de voltar.
   Uma única forma SVG, preservando os handlers existentes dos botões. */
(()=>{'use strict';
  if(window.__obrixVoltarUnificado)return;
  window.__obrixVoltarUnificado=true;
  const ICON='<svg data-obrix-back-icon="normalized-v2" viewBox="0 0 24 24" width="27" height="27" fill="none" aria-hidden="true"><path d="M19 12H5m7 7-7-7 7-7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function norm(b){
    if(!b||!b.isConnected)return;
    const role=String(b.getAttribute('aria-label')||'')+' '+String(b.getAttribute('title')||'');
    const glyph=String(b.textContent||'').trim();
    const back=b.id==='obrixHeaderVoltar'||b.id==='obxVoltarObras'||
      b.classList.contains('obrixHeaderVoltar')||b.classList.contains('obxVoltar')||
      b.classList.contains('obrixFinanceStandardBack')||
      /\bvoltar\b/i.test(role)||/^(?:←|‹|⬅|❮|↩)$/.test(glyph);
    if(!back)return;
    if(!b.querySelector('svg[data-obrix-back-icon="normalized-v2"]')){
      b.innerHTML=ICON;
    }
    b.classList.add('obrixBackNormalized');
    b.setAttribute('aria-label','Voltar');
    b.setAttribute('title','Voltar');
  }
  function update(){
    if(!document.getElementById('app'))return;
    document.querySelectorAll('#app button').forEach(norm);
  }
  let queued=false;
  function schedule(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;update()});
  }
  const css=document.createElement('style');css.id='obrixBackNormalizedStyle';
  css.textContent=`
    #app button.obrixBackNormalized:not(.hidden){
      box-sizing:border-box!important;
      width:44px!important;min-width:44px!important;max-width:44px!important;
      height:44px!important;min-height:44px!important;max-height:44px!important;
      flex:0 0 44px!important;display:inline-flex!important;
      align-items:center!important;justify-content:center!important;
      padding:0!important;margin:0!important;
      border-radius:11px!important;line-height:0!important;font-size:0!important;
      text-indent:0!important;vertical-align:middle!important;
    }
    #app button.obrixBackNormalized.hidden{display:none!important}
    #app button.obrixBackNormalized::before,
    #app button.obrixBackNormalized::after{display:none!important;content:none!important}
    #app button.obrixBackNormalized svg[data-obrix-back-icon]{
      display:block!important;box-sizing:border-box!important;
      width:27px!important;height:27px!important;max-width:none!important;
      min-width:27px!important;flex:0 0 27px!important;
      margin:auto!important;padding:0!important;
      position:static!important;transform:none!important;
      opacity:1!important;visibility:visible!important;color:inherit!important;
      stroke:none!important;fill:none!important;
    }
    #app button.obrixBackNormalized svg[data-obrix-back-icon] path{
      stroke:currentColor!important;stroke-width:3!important;
      stroke-linecap:round!important;stroke-linejoin:round!important;fill:none!important;
    }
  `;
  document.head.appendChild(css);
  function start(){
    update();
    const top=document.querySelector('#app>.top');
    if(top)new MutationObserver(schedule).observe(top,{childList:true,subtree:true});
    const works=document.getElementById('listaObras');
    if(works)new MutationObserver(schedule).observe(works,{childList:true,subtree:true});
    document.addEventListener('click',()=>{schedule();setTimeout(schedule,100)},true);
    window.addEventListener('pageshow',schedule);
    ['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto'].forEach(x=>window.addEventListener(x,schedule));
    setTimeout(schedule,300);setTimeout(schedule,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();