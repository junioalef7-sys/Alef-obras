(()=>{'use strict';
if(window.__OBRIX_LIGHT_UI_REQUESTED_V4)return;window.__OBRIX_LIGHT_UI_REQUESTED_V4=true;
const GRAY='#F5F7FA',TEXT='#050505',GREEN='#15803D',BORDER='#D7DEE8',WHITE='#FFFFFF';
const offline=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
const light=()=>!offline()&&document.documentElement.dataset.theme!=='dark'&&!document.body?.classList.contains('dark');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const PROPS=['background','background-color','background-image','color','-webkit-text-fill-color','border-color','box-shadow','text-shadow','font-weight','filter'];
const imp=(e,p,v)=>e?.style?.setProperty(p,v,'important');
function gray(e){if(!e)return;e.dataset.obrixLightV4='1';imp(e,'background',GRAY);imp(e,'background-color',GRAY);imp(e,'background-image','none');imp(e,'box-shadow','none');}
function darkText(e){if(!e)return;e.dataset.obrixLightV4='1';imp(e,'color',TEXT);imp(e,'-webkit-text-fill-color',TEXT);imp(e,'font-weight','800');imp(e,'text-shadow','none')}
function grayControl(e){gray(e);darkText(e);imp(e,'border-color',BORDER)}
function isBlack(e){const s=getComputedStyle(e),c=s.backgroundColor;const m=c.match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/);if(!m)return false;const [r,g,b]=m.slice(1).map(Number);return r<45&&g<55&&b<65}
function generalSurfaces(){
 const sel='#app .card,#app .kpi,#app .mini,#app input,#app select,#app textarea,#app .actions button,#app .form button,#app [role="button"]';
 document.querySelectorAll(sel).forEach(e=>{if(!isBlack(e))grayControl(e);else{e.dataset.obrixLightV4='1';imp(e,'color',WHITE);imp(e,'-webkit-text-fill-color',WHITE);imp(e,'font-weight','800')}});
}
function namedControls(){
 const wanted=/(apagar obra|modo claro|funcionario|historico de pagamento|todos|ativar|desativar|excluir|ver registro|pagar com pix|pagar com boleto|pagar com cartao|registros|finalizado|rascunhos|obra|data|clima|temperatura|status|servico executado|ocorrencias|materiais utilizados|equipamentos utilizados|observacoes|titulo|anotacao|categoria|prioridade|todas as obras|todas as categorias|buscar documento|trocar e-mail|trocar email|trocar senha|sair da conta|marcar diaria|falta|vale|bonus|extras|apagar equipe|apagar financeiro)/;
 document.querySelectorAll('#app button,#app input,#app select,#app textarea,#app label,#app [role="button"]').forEach(e=>{const t=norm(e.textContent||e.placeholder||e.getAttribute('aria-label'));if(t&&wanted.test(t)&&!isBlack(e))grayControl(e)});
}
function bottomBlock(){const bottom=document.querySelector('#app .bottom');if(!bottom)return;gray(bottom);bottom.querySelectorAll('button').forEach(grayControl)}
function statuses(){document.querySelectorAll('#app *').forEach(e=>{if(e.children.length===0&&norm(e.textContent)==='em andamento'){e.dataset.obrixLightV4='1';imp(e,'color',GREEN);imp(e,'-webkit-text-fill-color',GREEN);imp(e,'font-weight','900')}})}
function contrast(){document.querySelectorAll('#app button,#app .card,#app .kpi,#app .mini,#app input,#app select,#app textarea').forEach(e=>{if(isBlack(e)){e.dataset.obrixLightV4='1';imp(e,'color',WHITE);imp(e,'-webkit-text-fill-color',WHITE);imp(e,'font-weight','800')}else if(getComputedStyle(e).backgroundColor!=='rgba(0, 0, 0, 0)'){darkText(e)}})}
function cleanup(){document.querySelectorAll('[data-obrix-light-v4="1"]').forEach(e=>{PROPS.forEach(p=>e.style.removeProperty(p));delete e.dataset.obrixLightV4})}
function apply(){if(offline())return;if(!light()){cleanup();return}generalSurfaces();namedControls();bottomBlock();statuses();contrast()}
function pulse(){[0,60,180,450,900,1800].forEach(ms=>setTimeout(apply,ms))}
['obrix:grupo-pronto','obrix:feature-pronto','obrix:modules-ready','obrix:modules-online-ready','pageshow','focus'].forEach(n=>window.addEventListener(n,pulse));document.addEventListener('click',pulse,true);window.addEventListener('online',pulse);new MutationObserver(apply).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pulse,{once:true});else pulse();window.OBRIX_LIGHT_UI_REQUESTED_V4={apply,pulse,cleanup};
})();