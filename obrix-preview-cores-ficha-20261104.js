/* OBRIX — Correção pontual dos cinco botões coloridos na versão de teste. */
(()=>{
'use strict';
if(window.__OBRIX_PREVIEW_CORES_FICHA_V2)return;
window.__OBRIX_PREVIEW_CORES_FICHA_V2=true;
const palette=[
  {name:'diaria',selector:'.obp-person-actions .obp-diaria,.obrix-modelo-acoes [data-acao="diaria"]',bg:'#1169d8',fg:'#ffffff'},
  {name:'falta',selector:'.obp-person-actions .obp-falta,.obrix-modelo-acoes [data-acao="falta"]',bg:'#e53935',fg:'#ffffff'},
  {name:'registros',selector:'.obp-person-actions .obp-registros,.obrix-modelo-acoes [data-acao="registros"]',bg:'#8126b5',fg:'#ffffff'},
  {name:'vale',selector:'.obp-person-actions .obp-vale,.obrix-modelo-acoes [data-acao="vale"]',bg:'#139e37',fg:'#ffffff'},
  {name:'bonus',selector:'.obp-person-actions .obp-bonus,.obrix-modelo-acoes [data-acao="bonus"]',bg:'#eba200',fg:'#172331'}
];
function paint(){
  const area=document.getElementById('equipe');if(!area)return;
  palette.forEach(({selector,bg,fg})=>{
    area.querySelectorAll(selector).forEach(btn=>{
      // Inline !important prevails even over the old global button reset CSS.
      const rules={
        'background':bg,'background-color':bg,'background-image':'none',
        'color':fg,'-webkit-text-fill-color':fg,
        'border-color':bg,'box-shadow':'none',
        'opacity':'1','filter':'none'
      };
      for(const [prop,value] of Object.entries(rules)){
        if(btn.style.getPropertyValue(prop)!==value||btn.style.getPropertyPriority(prop)!=='important'){
          btn.style.setProperty(prop,value,'important');
        }
      }
      btn.querySelectorAll('span,small,strong,b,i').forEach(child=>{
        if(child.style.getPropertyValue('color')!==fg){
          child.style.setProperty('color',fg,'important');
          child.style.setProperty('-webkit-text-fill-color',fg,'important');
        }
      });
    });
  });
}
let queued=false;
function schedule(){
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;paint()});
}
function start(){
  paint();
  const team=document.getElementById('equipe');
  if(team)new MutationObserver(schedule).observe(team,{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class']});
  window.addEventListener('obrix:theme-applied',schedule);
  window.addEventListener('pageshow',schedule);
  window.addEventListener('obrix:grupo-pronto',schedule);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();