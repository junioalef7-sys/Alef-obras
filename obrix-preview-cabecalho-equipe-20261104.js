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
  return !!(e&&!e.classList.contains('hidden')&&!$('#app')?.classList.contains('hidden'));
}
function ensureHeader(){
  // O título e o botão de cadastro pertencem ao cartão dentro da tela Equipe,
  // não ao cabeçalho global do aplicativo.
  document.getElementById('obrixPreviewTeamTop')?.remove();
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
  const home=$('#inicio');
  document.documentElement.classList.toggle('obrix-preview-home-active',!!(home&&!home.classList.contains('hidden')));
  document.documentElement.classList.toggle('obrix-preview-team-detail',team&&!!$('#equipe')?.classList.contains('obp-team-selected'));
  document.querySelectorAll('#app main,#app section[id$="Main"]').forEach(uniquePageTitles);
}
function queue(){
  if(scheduled)return;
  scheduled=true;
  // Dentro da Equipe, a troca de classes deve ocorrer antes do próximo paint:
  // o atraso anterior de 65 ms deixava o cabeçalho em estados diferentes.
  const equipeEmTransicao=visibleTeam()||document.documentElement.classList.contains('obrix-preview-team-active');
  const executar=()=>{scheduled=false;apply()};
  if(equipeEmTransicao)queueMicrotask(executar);
  else setTimeout(executar,65);
}
function cabecalhoEquipeEstavel(){
  if(document.getElementById('obrixCabecalhoEquipeEstavel20261118'))return;
  const style=document.createElement('style');
  style.id='obrixCabecalhoEquipeEstavel20261118';
  // A seta global já fica oculta na Equipe. Outras regras ainda alternavam
  // a classe "hidden" desse botão e o seletor :has ocultava o MENU,
  // fazendo piscar o cabeçalho inteiro.
  style.textContent=`
    html body #app:has(> #equipe:not(.hidden)) > .top{
      display:flex!important;align-items:center!important;
      justify-content:space-between!important;gap:8px!important;
      opacity:1!important;visibility:visible!important;
      animation:none!important;transition:none!important
    }
    html body #app:has(> #equipe:not(.hidden)) > .top > #bMenu,
    html body #app:has(> #equipe:not(.hidden)) > .top:has(> #obrixHeaderVoltar:not(.hidden)) > #bMenu{
      display:inline-flex!important;visibility:visible!important;
      opacity:1!important;animation:none!important;transition:none!important
    }
    html body #app:has(> #equipe:not(.hidden)) > .top > #obrixHeaderVoltar{
      display:none!important;visibility:hidden!important;pointer-events:none!important
    }
  `;
  document.head.appendChild(style);
}
function boot(){
  cabecalhoEquipeEstavel();
  apply();
  const app=$('#app'),team=$('#equipe'),top=$('#app>.top');
  if(app)new MutationObserver(queue).observe(app,{attributes:true,attributeFilter:['class']});
  if(team)new MutationObserver(queue).observe(team,{attributes:true,attributeFilter:['class']});
  // O cabeçalho global não deve recriar o título da Equipe.
  document.addEventListener('click',e=>{
    // Não redesenhar o cabeçalho ao clicar em filtros, fichas ou ações.
    if(e.target.closest('#app>.bottom button,#menuMain [data-go],#app>.top #obrixHeaderVoltar'))queue();
  },true);
  ['pageshow','obrix:modules-ready','obrix:grupo-pronto','obrix:theme-applied'].forEach(ev=>window.addEventListener(ev,queue));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();