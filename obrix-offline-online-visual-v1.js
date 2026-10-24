(()=>{'use strict';
if(window.__OBRIX_OFFLINE_ONLINE_VISUAL_V1)return;window.__OBRIX_OFFLINE_ONLINE_VISUAL_V1=true;
const CSS_ID='obrixOnlineVisualApprovedV1';
const CSS_HREF='./obrix-online-visual-approved-v1.css?v=20261024visual-approved1';
const GOLD_STYLE_ID='obrixButtonColorsV1';
const DARK_LOCK_STYLE_ID='obrixDarkModalButtonsLockedV1';
const DARK_LOCK_STYLE=`
html:not([data-obrix-offline-v3="1"])[data-theme="dark"] body .modalBack:not(.accountDeleteBack) .modalActions button.btn:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.excluir),
html:not([data-obrix-offline-v3="1"]) body.dark .modalBack:not(.accountDeleteBack) .modalActions button.btn:not(.danger):not(.perigo):not(.orcPerigo):not(.diarioPerigo):not(.excluir){
 background:#0F1720!important;background-color:#0F1720!important;background-image:none!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;border:1px solid #2A3948!important;box-shadow:none!important;text-shadow:none!important
}
html:not([data-obrix-offline-v3="1"])[data-theme="dark"] body #app #cfgExcluirConta,
html:not([data-obrix-offline-v3="1"]) body.dark #app #cfgExcluirConta,
html:not([data-obrix-offline-v3="1"])[data-theme="dark"] body .accountDeleteModal .modalActions button.cancelar,
html:not([data-obrix-offline-v3="1"]) body.dark .accountDeleteModal .modalActions button.cancelar,
html:not([data-obrix-offline-v3="1"])[data-theme="dark"] body .accountDeleteModal .modalActions button.excluir,
html:not([data-obrix-offline-v3="1"]) body.dark .accountDeleteModal .modalActions button.excluir{
 background:#B91C1C!important;background-color:#B91C1C!important;background-image:none!important;color:#FFFFFF!important;-webkit-text-fill-color:#FFFFFF!important;border:1px solid #991B1B!important;box-shadow:none!important;text-shadow:none!important
}`;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const offlineV3=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
let timer=0,headMo=null;
function ensureCss(){
 let l=document.getElementById(CSS_ID);
 if(!l){l=document.createElement('link');l.id=CSS_ID;l.rel='stylesheet';l.href=CSS_HREF;document.head.appendChild(l)}
 l.disabled=offlineV3();
 return l;
}
function ensureDarkLockStyle(){
 if(offlineV3()){document.getElementById(DARK_LOCK_STYLE_ID)?.remove();return}
 let s=document.getElementById(DARK_LOCK_STYLE_ID);
 if(!s){s=document.createElement('style');s.id=DARK_LOCK_STYLE_ID;document.head.appendChild(s)}
 if(s.textContent!==DARK_LOCK_STYLE)s.textContent=DARK_LOCK_STYLE;
 if(s!==document.head.lastElementChild)document.head.appendChild(s);
}
function suppressGoldStyle(){
 if(offlineV3())return;
 const s=document.getElementById(GOLD_STYLE_ID);
 if(s)s.remove();
}
function watchGoldStyle(){
 if(headMo||!document.head)return;
 headMo=new MutationObserver(ms=>{
  if(offlineV3())return;
  let found=false;
  for(const m of ms){
   for(const n of m.addedNodes||[]){
    if(n?.nodeType===1&&(n.id===GOLD_STYLE_ID||n.querySelector?.('#'+GOLD_STYLE_ID))){found=true;break}
   }
   if(found)break;
  }
  if(found)queueMicrotask(()=>{suppressGoldStyle();ensureDarkLockStyle()});
 });
 headMo.observe(document.head,{childList:true});
}
function clearOld(b){b.classList.remove('obrixApprovedGold','obrixApprovedSecondary','obrixEquipeAzulClaro');b.removeAttribute('data-obrix-approved-color')}
function markButtons(){
 if(offlineV3())return;
 document.querySelectorAll('#app button,.modalBack button').forEach(b=>{
  const t=norm(b.textContent);
  const destructive=b.id==='cfgExcluirConta'||b.classList.contains('accountDeleteBtn')||/^(excluir conta|apagar tudo|apagar (a )?(obras|equipe|financeiro))\b/.test(t)||(b.closest('.accountDeleteModal')&&b.classList.contains('excluir'));
  const exclude=/\b(excluir|remover|apagar|deletar)\b/.test(t)||b.matches('.danger,.perigo,.orcPerigo,.diarioPerigo,[data-cmd="excluir"],[data-acao="excluir"]');
  const neutral=/\bvale\b/.test(t)||/^cancelar\b/.test(t)||/^fechar\b/.test(t)||/^salvar\b/.test(t)||/^registrar\b/.test(t)||/adicionar etapa/.test(t)||(/\bpagar\b/.test(t)&&!!b.closest('#equipe'));
  if(destructive){b.classList.add('obrixDestrutivoFinal');b.classList.remove('obrixExcluirFinal','obrixAcaoOriginalFinal');clearOld(b);return}
  b.classList.remove('obrixDestrutivoFinal');
  if(exclude){b.classList.add('obrixExcluirFinal');b.classList.remove('obrixAcaoOriginalFinal');clearOld(b);return}
  b.classList.remove('obrixExcluirFinal');
  if(neutral){b.classList.add('obrixAcaoOriginalFinal');clearOld(b)}else b.classList.remove('obrixAcaoOriginalFinal');
 });
}
function mark(el,cls){if(!el)return;el.classList.remove('obrixValorReceita','obrixValorDespesa','obrixValorResultado');el.classList.add(cls)}
function valueNear(label){const box=label.closest('.kpi,.mini,.obrix-resumo-grid>div,.card,[data-fin-card]')||label.parentElement;if(!box)return null;const a=[...box.querySelectorAll('strong,b')].filter(x=>x!==label);return a.find(x=>/R\$|\d/.test((x.textContent||'').trim()))||a[0]||null}
function markValues(){
 if(offlineV3())return;
 mark(document.getElementById('fmRecebido'),'obrixValorReceita');mark(document.getElementById('fmDespesas'),'obrixValorDespesa');mark(document.getElementById('fmResultado'),'obrixValorResultado');
 document.querySelectorAll('[data-fin-card][data-tipo="receita"] .mini b,[data-fin-card][data-tipo="receita"] .mini strong').forEach(el=>mark(el,'obrixValorReceita'));
 document.querySelectorAll('[data-fin-card][data-tipo="despesa"] .mini b,[data-fin-card][data-tipo="despesa"] .mini strong').forEach(el=>mark(el,'obrixValorDespesa'));
 document.querySelectorAll('#app small,#app span,#app label').forEach(label=>{const t=norm(label.textContent),v=valueNear(label);if(!t||!v)return;if(/^(receita|receitas|recebido|recebidos)$/.test(t))mark(v,'obrixValorReceita');else if(/^(despesa|despesas)$/.test(t))mark(v,'obrixValorDespesa');else if(t.startsWith('resultado'))mark(v,'obrixValorResultado')});
}
function dark(){return document.documentElement.dataset.theme==='dark'||document.body?.classList.contains('dark')}
function themeLabel(){const b=document.getElementById('obrixThemeInicioFinal');if(!b)return;const d=dark();b.textContent=d?'☀️ Claro':'🌙 Escuro';b.setAttribute('aria-label',d?'Ativar modo claro':'Ativar modo escuro')}
function ensureTheme(){
 if(offlineV3()){document.getElementById('obrixThemeInicioFinal')?.remove();return}
 const inicio=document.getElementById('inicio');if(!inicio)return;
 let b=document.getElementById('obrixThemeInicioFinal');
 if(!b){b=document.createElement('button');b.id='obrixThemeInicioFinal';b.type='button';b.className='obrixThemeInicioFinal';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const next=dark()?'light':'dark';window.OBRIX_THEME?.apply?.(next);setTimeout(()=>{themeLabel();apply()},0)});inicio.insertBefore(b,inicio.firstChild)}
 themeLabel();
}
function apply(){if(offlineV3())return;suppressGoldStyle();ensureCss();ensureDarkLockStyle();ensureTheme();markButtons();markValues();ensureDarkLockStyle()}
function schedule(ms=50){clearTimeout(timer);timer=setTimeout(apply,ms)}
function start(){watchGoldStyle();suppressGoldStyle();ensureCss();ensureDarkLockStyle();schedule(0);setTimeout(apply,250);setTimeout(apply,800);setTimeout(apply,1600)}
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-changed','pageshow','focus'].forEach(n=>window.addEventListener(n,()=>schedule(40)));
document.addEventListener('click',()=>schedule(80),true);
window.addEventListener('offline',()=>{const l=document.getElementById(CSS_ID);if(l)l.disabled=true;document.getElementById(DARK_LOCK_STYLE_ID)?.remove();document.getElementById('obrixThemeInicioFinal')?.remove()});
window.addEventListener('online',()=>{suppressGoldStyle();ensureCss();ensureDarkLockStyle();schedule(100)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_OFFLINE_ONLINE_VISUAL={repaint:()=>schedule(0),apply};
})();