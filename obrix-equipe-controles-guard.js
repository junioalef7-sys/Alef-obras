(()=>{'use strict';
if(window.__OBRIX_EQUIPE_CONTROLES_GUARD)return;window.__OBRIX_EQUIPE_CONTROLES_GUARD=true;
function ensure(){
  const sec=document.getElementById('equipe');if(!sec)return;
  const box=sec.querySelector('.obrix-equipe-controles');if(!box)return;
  let area=box.querySelector('.obrix-equipe-secundario');
  if(!area){area=document.createElement('div');area.className='obrix-equipe-secundario';box.appendChild(area)}
  if(!box.querySelector('.obrix-atualizar-equipe')){
    const b=document.createElement('button');
    b.className='obrix-cmd obrix-atualizar-equipe';b.type='button';b.textContent='↻ Atualizar';
    b.addEventListener('click',async()=>{b.disabled=true;try{await window.OBRIX_EQUIPE?.refresh?.()}catch(e){console.warn('OBRIX equipe refresh',e)}finally{b.disabled=false}});
    area.appendChild(b);
  }
}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(ensure,0)}
function start(){ensure();if(document.body)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','pageshow','focus','online','offline'].forEach(n=>window.addEventListener(n,schedule));setInterval(ensure,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_EQUIPE_CONTROLES_GUARD={ensure};
})();