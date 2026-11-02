(()=>{
'use strict';
if(window.__OBRIX_RELATORIOS_PERIODO)return;window.__OBRIX_RELATORIOS_PERIODO=true;
const $=id=>document.getElementById(id);
const hoje=()=>{const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dia=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${dia}`};
const iso=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),dia=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${dia}`};
function faixa(tipo){const h=new Date();h.setHours(12,0,0,0);let i='',f=hoje();if(tipo==='hoje')i=f;else if(tipo==='semana'){const d=new Date(h),n=(d.getDay()+6)%7;d.setDate(d.getDate()-n);i=iso(d)}else if(tipo==='mes'){i=`${f.slice(0,7)}-01`}else if(tipo==='30dias'){const d=new Date(h);d.setDate(d.getDate()-29);i=iso(d)}else if(tipo==='todos'){i='';f=''}return[i,f]}
const configs=[
  {card:'relFinFiltros',inicio:'relInicio',fim:'relFim',id:'relPeriodo',label:'Período do relatório'},
  {card:'relEqFiltros',inicio:'relEqInicio',fim:'relEqFim',id:'relEqPeriodo',label:'Período do relatório'},
  {card:'relDiarioFiltros',inicio:'relDiarioInicio',fim:'relDiarioFim',id:'relDiarioPeriodo',label:'Período do relatório'}
];
function instalarUm(c){const card=$(c.card),ini=$(c.inicio),fim=$(c.fim);if(!card||!ini||!fim||$(c.id))return false;const grid=ini.closest('.relGrid')||card;const box=document.createElement('div');box.className='relPeriodoBox';box.innerHTML=`<label for="${c.id}">${c.label}</label><select id="${c.id}"><option value="todos">Todo o período</option><option value="hoje">Hoje</option><option value="semana">Esta semana</option><option value="mes">Este mês</option><option value="30dias">Últimos 30 dias</option><option value="personalizado">Personalizado</option></select></div>`;grid.insertBefore(box,ini);const wrapIni=document.createElement('div'),wrapFim=document.createElement('div');wrapIni.className='relDataBox';wrapFim.className='relDataBox';ini.parentNode.insertBefore(wrapIni,ini);wrapIni.appendChild(ini);fim.parentNode.insertBefore(wrapFim,fim);wrapFim.appendChild(fim);wrapIni.insertAdjacentHTML('afterbegin','<label>Data inicial</label>');wrapFim.insertAdjacentHTML('afterbegin','<label>Data final</label>');const sel=$(c.id);function aplicar(){if(sel.value==='personalizado')return;const [a,b]=faixa(sel.value);ini.value=a;fim.value=b}sel.addEventListener('change',aplicar);[ini,fim].forEach(el=>el.addEventListener('change',()=>{sel.value='personalizado'}));aplicar();return true}
function scan(){configs.forEach(instalarUm)}
const css=document.createElement('style');css.id='obrixRelPeriodoStyle';css.textContent=`.relPeriodoBox,.relDataBox{display:flex;flex-direction:column;gap:5px;min-width:0}.relPeriodoBox label,.relDataBox label{font-size:12px;font-weight:900;color:var(--ob-muted,#64748b)}.relPeriodoBox select,.relDataBox input{width:100%;min-height:44px;border:1px solid var(--ob-border,#cbd5df);border-radius:10px;background:var(--ob-surface-2,#e5eaf0);color:var(--ob-text,#0f172a);padding:9px 11px;font:inherit}@media(max-width:620px){.relGrid{display:grid!important;grid-template-columns:1fr!important}.relPeriodoBox,.relDataBox{width:100%}}`;document.head.appendChild(css);
new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});scan();
})();
