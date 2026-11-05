/* OBRIX PREVIEW — stable color enforcement, no frame-by-frame painting. */
(()=>{
'use strict';
if(window.__OBRIX_PREVIEW_CORES_FICHA_V2)return;
window.__OBRIX_PREVIEW_CORES_FICHA_V2=true;
const items=[
  {sel:'.obp-person-actions .obp-diaria',bg:'#1169d8',fg:'#ffffff'},
  {sel:'.obp-person-actions .obp-falta',bg:'#e53935',fg:'#ffffff'},
  {sel:'.obp-person-actions .obp-registros',bg:'#8126b5',fg:'#ffffff'},
  {sel:'.obp-person-actions .obp-vale',bg:'#139e37',fg:'#ffffff'},
  {sel:'.obp-person-actions .obp-bonus',bg:'#eba200',fg:'#172331'}
];
function rgb(hex){
  const v=hex.replace('#','');
  return 'rgb('+[0,2,4].map(i=>parseInt(v.slice(i,i+2),16)).join(', ')+')';
}
items.forEach(x=>{x.bgComputed=rgb(x.bg);x.fgComputed=rgb(x.fg)});
function paint(){
  const team=document.getElementById('equipe');
  if(!team)return;
  for(const p of items){
    team.querySelectorAll(p.sel).forEach(b=>{
      // Compare computed colors rather than source strings (CSSOM normalizes hex
      // to rgb). Reapplying unchanged inline styles causes unnecessary mutations.
      const s=getComputedStyle(b);
      if(s.backgroundColor===p.bgComputed&&s.color===p.fgComputed&&
         s.backgroundImage==='none'&&s.opacity==='1')return;
      b.style.setProperty('background',p.bg,'important');
      b.style.setProperty('background-color',p.bg,'important');
      b.style.setProperty('background-image','none','important');
      b.style.setProperty('border-color',p.bg,'important');
      b.style.setProperty('color',p.fg,'important');
      b.style.setProperty('-webkit-text-fill-color',p.fg,'important');
      b.style.setProperty('transition','none','important');
      b.style.setProperty('animation','none','important');
      b.style.setProperty('opacity','1','important');
      b.style.setProperty('filter','none','important');
    });
  }
}
let queued=false;
function schedule(){
  if(queued)return;
  queued=true;
  // MutationObserver and microtasks run before the next browser paint.
  queueMicrotask(()=>{queued=false;paint()});
}
function relevantMutation(m){
  if(m.type==='attributes')
    return !!m.target?.matches?.('.obp-person-actions button');
  return Array.from(m.addedNodes||[]).some(n=>
    n.nodeType===1&&(
      n.matches?.('.obp-person-actions,.obp-person-actions button')||
      !!n.querySelector?.('.obp-person-actions')
    )
  );
}
function start(){
  paint();
  const team=document.getElementById('equipe');
  if(team)new MutationObserver(muts=>{
    if(muts.some(relevantMutation))schedule();
  }).observe(team,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
  new MutationObserver(schedule).observe(document.documentElement,{
    attributes:true,attributeFilter:['data-theme','class']
  });
  window.addEventListener('obrix:theme-applied',schedule);
  window.addEventListener('pageshow',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();