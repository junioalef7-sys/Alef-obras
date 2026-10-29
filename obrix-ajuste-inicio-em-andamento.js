/* Ajuste isolado — Início / Em andamento — 2026-10-29 */
(function(){
  'use strict';
  var STYLE_ID='obrix-ajuste-inicio-em-andamento-style';
  function aplicar(){
    var inicio=document.getElementById('inicio');
    if(!inicio) return;

    if(!document.getElementById(STYLE_ID)){
      var st=document.createElement('style');
      st.id=STYLE_ID;
      st.textContent='\n#inicio .obrix-em-andamento-ajustado{margin-left:auto!important;transform:scale(.95)!important;transform-origin:right center!important;background:transparent!important;background-color:transparent!important;box-shadow:none!important;}\n#inicio .obrix-em-andamento-ajustado::before,#inicio .obrix-em-andamento-ajustado::after{background:transparent!important;}\n';
      document.head.appendChild(st);
    }

    var els=inicio.querySelectorAll('button,span,strong,div');
    for(var i=0;i<els.length;i++){
      var el=els[i];
      if(el.children.length>0 && el.tagName!=='BUTTON') continue;
      var txt=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(txt==='em andamento'){
        el.classList.add('obrix-em-andamento-ajustado');
        var parent=el.parentElement;
        if(parent){
          var cs=getComputedStyle(parent);
          if(cs.display!=='flex' && cs.display!=='grid') parent.style.display='flex';
          parent.style.alignItems='center';
        }
      }
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(aplicar,0);});
  else setTimeout(aplicar,0);
  window.addEventListener('load',function(){setTimeout(aplicar,200);},{once:true});
})();
