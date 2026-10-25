(()=>{'use strict';
if(window.__OBRIX_NO_GOLD_FINAL)return;window.__OBRIX_NO_GOLD_FINAL=true;
const imp=(el,p,v)=>{if(!el?.style)return;el.style.setProperty(p,v,'important')};
function rgbDark(v){const m=String(v||'').match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i);if(!m)return false;const r=+m[1],g=+m[2],b=+m[3];return (r*299+g*587+b*114)/1000<115}
function dark(){const de=document.documentElement,b=document.body;const mark=String(de.dataset.theme||de.getAttribute('data-theme')||b?.dataset?.theme||'').toLowerCase();if(mark==='dark')return true;if(mark==='light')return false;if(de.classList.contains('dark')||b?.classList.contains('dark'))return true;try{const saved=String(localStorage.getItem('theme')||localStorage.getItem('obrix_theme')||localStorage.getItem('obrix-theme')||'').toLowerCase();if(saved.includes('dark')||saved.includes('escuro'))return true;if(saved.includes('light')||saved.includes('claro'))return false}catch(_){}try{return rgbDark(getComputedStyle(b||de).backgroundColor)||rgbDark(getComputedStyle(de).backgroundColor)}catch(_){return false}}
function clean(b){b?.classList?.remove('obrixApprovedGold','obrixPermanentGoldText');b?.removeAttribute?.('data-obrix-approved-color')}
function neutral(b){if(!b)return;clean(b);imp(b,'background',dark()?'#101820':'#fff');imp(b,'background-color',dark()?'#101820':'#fff');imp(b,'background-image','none');imp(b,'color',dark()?'#eef2f7':'#334155');imp(b,'-webkit-text-fill-color',dark()?'#eef2f7':'#334155');imp(b,'border','1px solid #334155');imp(b,'border-color','#334155');imp(b,'box-shadow','none');imp(b,'text-shadow','none')}
function danger(b){if(!b)return;clean(b);imp(b,'background','transparent');imp(b,'background-color','transparent');imp(b,'background-image','none');imp(b,'color',dark()?'#f87171':'#b91c1c');imp(b,'-webkit-text-fill-color',dark()?'#f87171':'#b91c1c');imp(b,'border','1px solid #ef4444');imp(b,'border-color','#ef4444');imp(b,'box-shadow','none');imp(b,'text-shadow','none')}
// Covers body-mounted dialogs as well as the app; all delete actions share one style.
function gold(el){const c=getComputedStyle(el);return [c.backgroundColor,c.backgroundImage].some(v=>{const colors=v.match(/rgba?\([^)]+\)/g)||[];return colors.some(color=>{const n=color.match(/[\d.]+/g).map(Number);return (n.length<4||n[3]>0)&&n[0]>170&&n[1]>100&&n[1]<215&&n[2]<130&&n[0]>n[1]&&n[1]>n[2]*1.25})})}
function apply(){const app=document.getElementById('app');if(!app||app.classList.contains('hidden'))return;
 document.querySelectorAll('#app button,.modalBack button').forEach(b=>{
  const tx=String(b.textContent||'').replace(/\s+/g,' ').trim();
  if(/\b(apagar|excluir|remover|deletar)\b/i.test(tx)||b.matches('[data-check-del],.danger,.perigo,.orcPerigo,.diarioPerigo,.excluir,.accountDeleteBtn')){danger(b);return}
  if(b.dataset.obrixNoGold==='1'||(dark()&&(b.closest('.estOp .modalActions')||/adicionar\s+(etapa|foto)/i.test(tx)||gold(b)))){b.dataset.obrixNoGold='1';neutral(b)}
 });
 document.querySelectorAll('#app .card,#app .kpi,#app .mini,#app article,.modalBack .card,.modalBack .mini').forEach(el=>{
  if(!gold(el)&&el.dataset.obrixNoGoldCard!=='1')return;
  el.dataset.obrixNoGoldCard='1';const bg=dark()?'#0F1720':'#F5F7FA';
  imp(el,'background',bg);imp(el,'background-color',bg);imp(el,'background-image','none');
  imp(el,'color',dark()?'#eef2f7':'#111827');imp(el,'box-shadow','none');
 });
}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(apply,80)}
function start(){document.addEventListener('click',()=>{schedule();setTimeout(apply,250)},true);window.addEventListener('obrix:modules-ready',schedule);window.addEventListener('obrix:modules-online-ready',schedule);window.addEventListener('obrix:grupo-pronto',schedule);window.addEventListener('obrix:feature-pronto',schedule);window.addEventListener('pageshow',schedule);new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class']});const app=document.getElementById('app');if(app)new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});setInterval(apply,1200);schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();window.OBRIX_NO_GOLD_FINAL={apply:schedule};
})();