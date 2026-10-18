(()=>{'use strict';
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const isWelcome=t=>/^(ola\b|bem[- ]?vind[oa]s?\b|boas[- ]?vindas?\b|seja bem[- ]?vind[oa]\b)/.test(normalize(t));

  function isProtected(el){
    return !el||el.id==='inicio'||el.classList?.contains('hero')||el.classList?.contains('kpis')||el.classList?.contains('nav')||el.matches?.('.kpi,.nav button');
  }

  function removeWholeCard(el,inicio){
    if(!el||!inicio.contains(el))return;

    let card=el.closest('section,article,.card,[class*="card"],.welcome,.welcome-message,.greeting,.saudacao,.boas-vindas,[data-welcome],[class*="welcome"],[class*="greet"],[class*="hello"]');
    if(card&&inicio.contains(card)&&!isProtected(card)&&!card.querySelector('.kpis,.nav')){
      card.remove();
      return;
    }

    let top=el;
    while(top.parentElement&&top.parentElement!==inicio)top=top.parentElement;
    if(top&&top.parentElement===inicio&&!isProtected(top)&&!top.querySelector('.kpis,.nav,.hero')){
      top.remove();
      return;
    }

    let parent=el.parentElement;
    while(parent&&parent!==inicio){
      if(!isProtected(parent)&&!parent.querySelector('.kpis,.nav,.hero')){
        const txt=normalize(parent.textContent);
        if(txt.startsWith('ola')||txt.startsWith('bem-vind')||txt.startsWith('bem vind')){parent.remove();return;}
      }
      parent=parent.parentElement;
    }
  }

  function clean(){
    const inicio=document.getElementById('inicio');
    if(!inicio)return;

    inicio.querySelectorAll('.welcome,.welcome-message,.greeting,.saudacao,.boas-vindas,[data-welcome],[class*="welcome"],[class*="greet"],[class*="hello"]').forEach(el=>{
      if(!el.closest('.kpis,.nav,.hero'))removeWholeCard(el,inicio);
    });

    inicio.querySelectorAll('h1,h2,h3,h4,p,span,strong,b,div').forEach(el=>{
      if(!inicio.contains(el)||el.closest('.kpis,.nav,.hero'))return;
      const text=(el.textContent||'').trim();
      if(text&&isWelcome(text))removeWholeCard(el,inicio);
    });
  }

  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clean()})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(clean,120));else setTimeout(clean,120);
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.OBRIX_HOME_CLEAN={clean};
})();