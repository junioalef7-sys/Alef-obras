(()=>{'use strict';
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();

  function isGreetingBlock(el){
    if(!el)return false;
    const text=normalize(el.textContent);
    const hasHello=/\bola\b/.test(text);
    const hasWelcome=/bem[- ]?vind[oa]/.test(text)||text.includes('bem vindo');
    const hasKnownPhrase=text.includes('acompanhe suas obras')||text.includes('de volta');
    return hasHello&&(hasWelcome||hasKnownPhrase);
  }

  function clean(){
    const inicio=document.getElementById('inicio');
    if(!inicio)return;

    // Remove o cartão inteiro de boas-vindas quando ele é inserido como bloco da tela Início.
    [...inicio.children].forEach(child=>{
      if(child.classList?.contains('kpis')||child.classList?.contains('nav'))return;
      if(isGreetingBlock(child))child.remove();
    });

    // Fallback para qualquer versão do card criada dentro de wrappers extras.
    inicio.querySelectorAll('section,article,.card,.hero,[class*="card"],[class*="welcome"],[class*="greet"],[class*="hello"],[data-welcome]').forEach(el=>{
      if(!inicio.contains(el)||el.closest('.kpis,.nav'))return;
      if(isGreetingBlock(el)){
        let target=el;
        while(target.parentElement&&target.parentElement!==inicio&&isGreetingBlock(target.parentElement))target=target.parentElement;
        target.remove();
      }
    });
  }

  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clean()})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(clean,0));else setTimeout(clean,0);
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.addEventListener('pageshow',clean);
  window.addEventListener('focus',clean);
  window.OBRIX_HOME_CLEAN={clean};
})();