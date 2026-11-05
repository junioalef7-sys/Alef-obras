/* OBRIX preview only: integrated team heading and duplicate heading cleanup. */
(()=>{
'use strict';
if(window.__OBRIX_PREVIEW_COMPACT_HEADER_20261104)return;
window.__OBRIX_PREVIEW_COMPACT_HEADER_20261104=true;
const $=s=>document.querySelector(s);
const label=x=>String(x?.textContent||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
let scheduled=false;
function visibleTeam(){
  const e=$('#equipe');
  return !!(e&&!e.classList.contains('hidden')&&getComputedStyle(e).display!=='none');
}
function ensureHeader(){
  const top=$('#app>.top');
  if(!top||$('#obrixPreviewTeamTop'))return;
  const bar=document.createElement('div');
  bar.id='obrixPreviewTeamTop';
  bar.innerHTML='<span class="obx-inline-title">Equipe</span><button type="button" class="obx-inline-new" aria-label="Novo funcionário">＋ Novo</button>';
  bar.querySelector('button').addEventListener('click',async()=>{
    const target='#equipe .obrix-equipe-controles [data-cmd="novo"]';
    let b=$(target);
    if(!b&&window.OBRIX_POS_LOGIN_LOADER?.loadGroup){
      try{await window.OBRIX_POS_LOGIN_LOADER.loadGroup('equipe')}catch(_){}
    }
    b=$(target);
    if(b)b.click();
    else alert('Não foi possível abrir o cadastro. Atualize a página e tente novamente.');
  });
  const actions=top.querySelector('.obrixTopActions');
  if(actions)top.insertBefore(bar,actions);
  else top.appendChild(bar);
}
function uniquePageTitles(section){
  if(!section||section.classList.contains('hidden'))return;
  const candidates=section.querySelectorAll(':scope > h1,:scope > h2,:scope > .hero h1,:scope > .hero h2,:scope > .sectionHead > strong,:scope > .sectionHead > h2,:scope > header h1,:scope > header h2,:scope > .rgHead h1,:scope > .rgHead h2');
  const seen=new Set();
  candidates.forEach(h=>{
    let t=label(h);
    if(!t)return;
    if(t==='suas obras'||t==='minhas obras')t='obras';
    const duplicated=seen.has(t);
    if(duplicated){
      if(h.dataset.obrixDuplicateHeading!=='1')h.dataset.obrixDuplicateHeading='1';
    }else{
      seen.add(t);
      if(h.dataset.obrixDuplicateHeading)delete h.dataset.obrixDuplicateHeading;
    }
  });
}
function apply(){
  if(!$('#app'))return;
  ensureHeader();
  const team=visibleTeam();
  document.documentElement.classList.toggle('obrix-preview-team-active',team);
  document.documentElement.classList.toggle('obrix-preview-team-detail',team&&!!$('#equipe')?.classList.contains('obp-team-selected'));
  const top=$('#obrixPreviewTeamTop');
  if(top)top.hidden=!team;
  document.querySelectorAll('#app main,#app section[id$="Main"]').forEach(uniquePageTitles);
}
function queue(){
  if(scheduled)return;
  scheduled=true;
  setTimeout(()=>{scheduled=false;apply()},65);
}
function boot(){
  apply();
  const app=$('#app'),team=$('#equipe'),top=$('#app>.top');
  if(app)new MutationObserver(queue).observe(app,{attributes:true,attributeFilter:['class']});
  if(team)new MutationObserver(queue).observe(team,{attributes:true,attributeFilter:['class']});
  if(top)new MutationObserver(()=>{if(!$('#obrixPreviewTeamTop'))queue()}).observe(top,{childList:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('button,a,[data-go],[data-page]')){
      queue();setTimeout(queue,200);
    }
  },true);
  ['pageshow','focus','obrix:modules-ready','obrix:grupo-pronto','obrix:theme-applied'].forEach(ev=>window.addEventListener(ev,queue));
  setInterval(queue,4500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();