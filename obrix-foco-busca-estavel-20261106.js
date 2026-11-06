/* OBRIX: estabilizacao horizontal somente enquanto um campo de texto esta em foco.
 * Nao interfere no eixo vertical, na navegacao, no zoom manual ou na gravacao de dados.
 */
(function(){
  'use strict';
  if(window.__OBRIX_FOCO_BUSCA_ESTAVEL__)return;
  window.__OBRIX_FOCO_BUSCA_ESTAVEL__=true;

  var mobile=window.matchMedia('(max-width: 1024px)');
  var focused=null;
  var pending=false;
  var timers=[];
  var viewport=window.visualViewport;

  function campoDigitavel(el){
    if(!el||!el.matches)return false;
    return el.matches('textarea, [contenteditable="true"], input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"])');
  }
  // Ajustar antes do foco (pointerdown/touchstart) impede o autozoom do WebKit.
  // Guardar e repor qualquer fonte inline original para preservar o visual.
  var fontesOriginais=new WeakMap();
  function protegerFonte(el){
    if(!mobile.matches||!campoDigitavel(el)||!window.getComputedStyle||!el.style)return;
    if(fontesOriginais.has(el))return;
    var px=parseFloat(window.getComputedStyle(el).fontSize)||0;
    if(px>=16)return;
    fontesOriginais.set(el,{
      valor:el.style.getPropertyValue('font-size'),
      prioridade:el.style.getPropertyPriority('font-size')
    });
    el.style.setProperty('font-size','16px','important');
  }
  function restaurarFonte(el){
    var original=el&&fontesOriginais.get(el);
    if(!original)return;
    if(original.valor)el.style.setProperty('font-size',original.valor,original.prioridade);
    else el.style.removeProperty('font-size');
    fontesOriginais.delete(el);
  }
  document.addEventListener('pointerdown',function(e){protegerFonte(e.target)},true);
  document.addEventListener('touchstart',function(e){protegerFonte(e.target)},{capture:true,passive:true});
  function restaurarEixoX(){
    pending=false;
    if(!mobile.matches||!focused||!focused.isConnected||document.activeElement!==focused)return;
    // Nunca desfazer ampliacao voluntaria por pinca.
    if(viewport&&viewport.scale>1.05)return;
    var y=window.scrollY;
    var pagina=document.scrollingElement||document.documentElement;
    if(pagina.scrollLeft!==0)pagina.scrollLeft=0;
    if(document.body&&document.body.scrollLeft!==0)document.body.scrollLeft=0;
    if(window.scrollX>0.5)window.scrollTo(0,y);
  }
  function agendar(){
    if(pending)return;
    pending=true;
    requestAnimationFrame(restaurarEixoX);
  }
  function cancelarTempos(){
    for(var i=0;i<timers.length;i++)clearTimeout(timers[i]);
    timers.length=0;
  }
  document.addEventListener('focusin',function(e){
    if(!mobile.matches||!campoDigitavel(e.target))return;
    protegerFonte(e.target);
    focused=e.target;
    cancelarTempos();
    agendar();
    // Cobre a abertura tardia do teclado virtual, sem loops de scroll.
    timers.push(setTimeout(agendar,160));
    timers.push(setTimeout(agendar,420));
  },true);
  document.addEventListener('focusout',function(e){
    if(e.target!==focused)return;
    focused=null;
    restaurarFonte(e.target);
    cancelarTempos();
  },true);
  document.addEventListener('input',function(e){
    if(e.target===focused)agendar();
  },true);
  if(viewport){
    viewport.addEventListener('resize',agendar,{passive:true});
    viewport.addEventListener('scroll',agendar,{passive:true});
  }
  window.addEventListener('resize',agendar,{passive:true});
})();