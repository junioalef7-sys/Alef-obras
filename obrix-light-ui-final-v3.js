(()=>{'use strict';
if(window.__OBRIX_LIGHT_UI_FINAL_V3)return;window.__OBRIX_LIGHT_UI_FINAL_V3=true;
const RED='#E0002A',BLUE='#0057FF',GREEN='#00A63E',GRAY='#E2E8F0',BLACK='#111111',GOLD='#F2B84B',WHITE='#FFFFFF';
const offlineV3=()=>!navigator.onLine||window.__OBRIX_FORCE_OFFLINE===true||document.documentElement.dataset.obrixOfflineV3==='1';
const light=()=>!offlineV3()&&document.documentElement.dataset.theme!=='dark'&&!document.body?.classList.contains('dark');
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const PROPS=['background','background-color','background-image','color','-webkit-text-fill-color','border','box-shadow','text-shadow','font-weight'];
function imp(el,p,v){if(el)el.style.setProperty(p,v,'important')}
function clearProps(el,props=PROPS){if(!el)return;props.forEach(p=>el.style.removeProperty(p))}
function valueOf(box){return box?.querySelector?.('b,strong,[data-value],.value')||null}
function labelOf(box){return norm(box?.querySelector?.('small,label,.label,span')?.textContent)}
function paintValue(el,color){if(!el)return;el.dataset.obrixLightV3Value='1';imp(el,'color',color);imp(el,'-webkit-text-fill-color',color);imp(el,'font-weight','950')}
function paintObras(){
 if(!light())return;
 document.querySelectorAll('#listaObras .mini,#listaObras .kpi').forEach(box=>{
  const label=labelOf(box),v=valueOf(box);if(!label||!v)return;
  if(label.includes('despesa'))paintValue(v,RED);
  else if(label.includes('recebido'))paintValue(v,GREEN);
  else if(label.includes('resultado')||label.includes('lucro'))paintValue(v,BLUE);
 });
}
function paintFinanceResumo(){
 if(!light())return;
 document.querySelectorAll('#fmResumoObras .forKpi,#financeiroMain .forKpi').forEach(box=>{
  const label=labelOf(box),v=valueOf(box);if(label.includes('saldo financeiro'))paintValue(v,BLUE);
 });
}
function appearance(){
 if(!light())return;
 const darkBtn=document.getElementById('cfgEscuro');
 if(darkBtn){
  darkBtn.dataset.obrixLightV3Appearance='1';
  const txt=norm(darkBtn.textContent);
  if(!darkBtn.querySelector('.obrixMoonGold')||!txt.includes('modo escuro'))darkBtn.innerHTML='<span class="obrixMoonGold" aria-hidden="true">☾</span><span>Modo escuro</span>';
  imp(darkBtn,'background',BLACK);imp(darkBtn,'background-color',BLACK);imp(darkBtn,'background-image','none');imp(darkBtn,'color',WHITE);imp(darkBtn,'-webkit-text-fill-color',WHITE);imp(darkBtn,'border','2px solid '+GOLD);imp(darkBtn,'box-shadow','none');
  const moon=darkBtn.querySelector('.obrixMoonGold');if(moon){moon.dataset.obrixLightV3Moon='1';imp(moon,'color',GOLD);imp(moon,'-webkit-text-fill-color',GOLD)}
 }
 const del=document.getElementById('cfgExcluirConta');
 if(del){del.dataset.obrixLightV3Delete='1';del.classList.add('danger');imp(del,'background','#D6001C');imp(del,'background-color','#D6001C');imp(del,'background-image','none');imp(del,'color',WHITE);imp(del,'-webkit-text-fill-color',WHITE);imp(del,'border','1px solid #B80018');imp(del,'box-shadow','none')}
}
function paymentButtons(){
 if(!light())return;
 const root=document.getElementById('assinaturaMain')||document.getElementById('assPlanos');if(!root)return;
 root.querySelectorAll('button').forEach(b=>{
  const t=norm(b.textContent);
  if(t==='pagar com pix'||t==='pagar com boleto'||t==='pagar com cartao'){
   b.dataset.obrixLightV3Pay='1';b.classList.add('obrixPermanentNeutral','obrixPayMethod');b.dataset.obrixPermanentNeutral='1';
   imp(b,'background',GRAY);imp(b,'background-color',GRAY);imp(b,'background-image','none');imp(b,'color',BLACK);imp(b,'-webkit-text-fill-color',BLACK);imp(b,'border','1px solid #CBD5E1');imp(b,'box-shadow','none');imp(b,'text-shadow','none');
  }
 });
}
function cleanupDark(){
 if(offlineV3())return;
 document.querySelectorAll('[data-obrix-light-v3-value="1"]').forEach(el=>{clearProps(el,['color','-webkit-text-fill-color','font-weight']);delete el.dataset.obrixLightV3Value});
 document.querySelectorAll('[data-obrix-light-v3-pay="1"]').forEach(el=>{clearProps(el);delete el.dataset.obrixLightV3Pay});
 const darkBtn=document.querySelector('[data-obrix-light-v3-appearance="1"]');if(darkBtn){clearProps(darkBtn);delete darkBtn.dataset.obrixLightV3Appearance}
 document.querySelectorAll('[data-obrix-light-v3-moon="1"]').forEach(el=>{clearProps(el,['color','-webkit-text-fill-color']);delete el.dataset.obrixLightV3Moon});
 const del=document.querySelector('[data-obrix-light-v3-delete="1"]');if(del){clearProps(del);del.classList.remove('danger');delete del.dataset.obrixLightV3Delete}
}
function apply(){if(offlineV3())return;if(!light()){cleanupDark();return}paintObras();paintFinanceResumo();appearance();paymentButtons()}
function pulse(){[0,60,180,450,900,1800,3500].forEach(ms=>setTimeout(apply,ms))}
['obrix:grupo-pronto','obrix:feature-pronto','obrix:modules-ready','obrix:modules-online-ready','pageshow','focus'].forEach(n=>window.addEventListener(n,pulse));
document.addEventListener('click',pulse,true);window.addEventListener('online',pulse);
new MutationObserver(()=>apply()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pulse,{once:true});else pulse();
window.OBRIX_LIGHT_UI_FINAL_V3={apply,pulse,cleanupDark};
})();
