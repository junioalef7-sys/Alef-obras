/* Ajuste isolado — Início / Em andamento — 2026-10-29 */
(function(){
  'use strict';
  var STYLE_ID='obrix-ajuste-inicio-em-andamento-style';
  var CLS='obrix-em-andamento-ajustado';

  function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();}

  function style(){
    if(document.getElementById(STYLE_ID)) return;
    var st=document.createElement('style');
    st.id=STYLE_ID;
    st.textContent='\n#inicio .'+CLS+'{margin-left:auto!important;margin-right:0!important;align-self:center!important;justify-self:end!important;width:auto!important;max-width:max-content!important;padding:9.5px 11.4px!important;font-size:95%!important;line-height:1.05!important;background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border-color:transparent!important;}\n#inicio .'+CLS+'::before,#inicio .'+CLS+'::after{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;}\n';
    document.head.appendChild(st);
  }

  function candidato(inicio){
    var all=inicio.querySelectorAll('button,span,strong,small,div,p');
    for(var i=0;i<all.length;i++){
      var el=all[i];
      if(norm(el.textContent)!=='em andamento') continue;
      if(el.children.length && el.tagName!=='BUTTON') continue;
      return el;
    }
    return null;
  }

  function aplicar(){
    var inicio=document.getElementById('inicio');
    if(!inicio) return;
    style();
    var el=candidato(inicio);
    if(!el) return;
    el.classList.add(CLS);
    el.style.setProperty('background','transparent','important');
    el.style.setProperty('background-color','transparent','important');
    el.style.setProperty('background-image','none','important');
    el.style.setProperty('box-shadow','none','important');
    el.style.setProperty('margin-left','auto','important');
    el.style.setProperty('margin-right','0','important');
    el.style.setProperty('font-size','95%','important');
    var parent=el.parentElement;
    if(parent){
      parent.style.setProperty('display','flex','important');
      parent.style.setProperty('align-items','center','important');
      parent.style.setProperty('justify-content','space-between','important');
    }
  }

  var scheduled=false;
  function agenda(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;aplicar();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',agenda,{once:true});
  else agenda();
  var inicio=document.getElementById('inicio');
  if(inicio) new MutationObserver(agenda).observe(inicio,{childList:true,subtree:true});
  window.addEventListener('obrix:modules-ready',agenda);
  window.addEventListener('obrix:feature-pronto',agenda);
  window.addEventListener('pageshow',agenda);
})();