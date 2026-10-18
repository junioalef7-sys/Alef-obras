(()=>{'use strict';
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const isWelcome=t=>/^(bem[- ]?vind[oa]s?\b|boas[- ]?vindas?\b|seja bem[- ]?vind[oa]\b|ola[,! ]+.*bem[- ]?vind)/.test(normalize(t));
  function clean(){
    const inicio=document.getElementById('inicio');
    if(!inicio)return;
    inicio.querySelectorAll('.welcome,.welcome-message,.greeting,.saudacao,.boas-vindas,[data-welcome]').forEach(el=>el.remove());
    inicio.querySelectorAll('p,span,h1,h2,h3,h4,div').forEach(el=>{
      if(el.id==='inicio'||el.classList.contains('hero')||el.classList.contains('kpis')||el.classList.contains('nav'))return;
      if(el.children.length>1)return;
      const text=(el.textContent||'').trim();
      if(text&&isWelcome(text))el.remove();
    });
  }
  let queued=false;
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;clean()})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(clean,200));else setTimeout(clean,200);
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.OBRIX_HOME_CLEAN={clean};
})();