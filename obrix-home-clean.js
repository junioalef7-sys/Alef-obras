(()=>{'use strict';
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const isWelcome=t=>/^(ola\b|bem[- ]?vind[oa]s?\b|boas[- ]?vindas?\b|seja bem[- ]?vind[oa]\b)/.test(normalize(t));

  function removeWelcome(el,inicio){
    if(!el||!inicio.contains(el))return;
    const card=el.closest('.card,.welcome,.welcome-message,.greeting,.saudacao,.boas-vindas,[data-welcome],[class*="welcome"],[class*="greet"]');
    if(card&&inicio.contains(card)&&!card.classList.contains('kpi')&&!card.classList.contains('hero')&&!card.classList.contains('nav')){
      card.remove();
      return;
    }
    el.remove();
  }

  function clean(){
    const inicio=document.getElementById('inicio');
    if(!inicio)return;

    inicio.querySelectorAll('.welcome,.welcome-message,.greeting,.saudacao,.boas-vindas,[data-welcome],[class*="welcome"],[class*="greet"]').forEach(el=>{
      if(!el.closest('.kpis,.nav'))removeWelcome(el,inicio);
    });

    inicio.querySelectorAll('h1,h2,h3,h4,p,span,strong,b,div').forEach(el=>{
      if(!inicio.contains(el))return;
      if(el.id==='inicio'||el.closest('.kpis,.nav'))return;
      if(el.classList.contains('hero'))return;
      const text=(el.textContent||'').trim();
      if(text&&isWelcome(text))removeWelcome(el,inicio);
    });
  }

  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clean()})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(clean,200));else setTimeout(clean,200);
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.OBRIX_HOME_CLEAN={clean};
})();