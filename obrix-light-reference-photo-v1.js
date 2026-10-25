(()=>{'use strict';
if(window.__OBRIX_LIGHT_REFERENCE_PHOTO_V1)return;window.__OBRIX_LIGHT_REFERENCE_PHOTO_V1=true;
const BG='#EEF2F6',CARD='#FFFFFF',TEXT='#111827',MUTED='#64748B',BORDER='#D7DEE8';
const offline=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
const light=()=>!offline()&&document.documentElement.dataset.theme!=='dark'&&!document.body?.classList.contains('dark');
const imp=(e,p,v)=>e?.style?.setProperty(p,v,'important');
const rgb=s=>{const m=String(s||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);return m?[+m[1],+m[2],+m[3]]:null};
const isDark=e=>{const c=rgb(getComputedStyle(e).backgroundColor);return !!c&&c[0]<55&&c[1]<60&&c[2]<70};
function mark(e){if(e)e.dataset.obrixLightPhoto='1'}
function set(e,p,v){mark(e);imp(e,p,v)}
function apply(){if(!light())return cleanup();const app=document.getElementById('app');if(!app)return;
 set(document.documentElement,'background-color',BG);set(document.body,'background-color',BG);set(app,'background-color',BG);
 app.querySelectorAll('.card,.kpi,.mini,.panel,.box,.section,.bloco').forEach(e=>{if(isDark(e)){set(e,'color','#FFFFFF');set(e,'-webkit-text-fill-color','#FFFFFF');return}set(e,'background-color',CARD);set(e,'background-image','none');set(e,'border-color',BORDER);set(e,'color',TEXT)});
 app.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b,.title,.titulo').forEach(e=>{if(isDark(e)||e.closest('[style*="background"]')&&isDark(e.parentElement))return;set(e,'color',TEXT);set(e,'-webkit-text-fill-color',TEXT);set(e,'font-weight','700')});
 app.querySelectorAll('p,small,.muted,.sub,.subtitle,.descricao,.description').forEach(e=>{if(e.closest('.card,.kpi,.mini,.panel,.box,.section,.bloco')&&isDark(e.closest('.card,.kpi,.mini,.panel,.box,.section,.bloco'))){set(e,'color','#FFFFFF');set(e,'-webkit-text-fill-color','#FFFFFF');return}set(e,'color',MUTED);set(e,'-webkit-text-fill-color',MUTED)});
 const dark=document.getElementById('cfgEscuro');if(dark){set(dark,'background-color','#111111');set(dark,'background-image','none');set(dark,'color','#FFFFFF');set(dark,'-webkit-text-fill-color','#FFFFFF');set(dark,'border','1px solid #F2B84B');dark.querySelectorAll('svg,i,.icon,.ico').forEach(x=>{set(x,'color','#F2B84B');set(x,'-webkit-text-fill-color','#F2B84B')})}
 const del=document.getElementById('cfgExcluirConta');if(del){set(del,'color','#FFFFFF');set(del,'-webkit-text-fill-color','#FFFFFF');del.querySelectorAll('*').forEach(x=>{set(x,'color','#FFFFFF');set(x,'-webkit-text-fill-color','#FFFFFF')})}
}
function cleanup(){document.querySelectorAll('[data-obrix-light-photo="1"]').forEach(e=>{['background','background-color','background-image','color','-webkit-text-fill-color','border','border-color','font-weight'].forEach(p=>e.style.removeProperty(p));delete e.dataset.obrixLightPhoto})}
function pulse(){[0,80,250,700,1500].forEach(ms=>setTimeout(apply,ms))}
['obrix:grupo-pronto','obrix:feature-pronto','obrix:modules-ready','obrix:modules-online-ready','pageshow','focus'].forEach(n=>window.addEventListener(n,pulse));document.addEventListener('click',pulse,true);new MutationObserver(()=>{if(!light())cleanup();else pulse()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pulse,{once:true});else pulse();
})();