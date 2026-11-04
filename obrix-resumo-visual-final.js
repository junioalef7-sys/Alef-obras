(()=>{
'use strict';
if(window.__OBRIX_RESUMO_VISUAL_FINAL_20261102)return;
window.__OBRIX_RESUMO_VISUAL_FINAL_20261102=true;
const $=id=>document.getElementById(id);
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cor={green:'#16a34a',red:'#dc2626',orange:'#f97316',blue:'#2563eb',white:'#ffffff'};
let scheduled=false,applying=false,resumoObserver=null,resumoObservado=null;
function vis(el){return !!el&&!el.classList.contains('hidden')&&getComputedStyle(el).display!=='none'}
function setColor(el,c){if(!el||!c)return;el.style.setProperty('color',c,'important');el.style.setProperty('-webkit-text-fill-color',c,'important')}
function valorNumero(txt){const s=String(txt||'').replace(/\s/g,'').replace(/R\$/g,'').replace(/%/g,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');const n=Number(s);return Number.isFinite(n)?n:0}
function corRotulo(label,valor=0){const t=norm(label);if(t.includes('despesa')||t.includes('prejuizo'))return cor.red;if(t.includes('a receber')||t.includes('pendente'))return cor.orange;if(t.includes('recebido')||t.includes('acrescimo'))return cor.green;if(t.includes('lucro')||t.includes('resultado'))return valor<0?cor.red:cor.green;if(t.includes('margem'))return valor<0?cor.red:cor.blue;if(t.includes('contrato')||t.includes('atualizado')||t.includes('valor da etapa')||t.includes('valor etapa')||t.includes('progresso')||t.includes('percentual'))return cor.blue;return cor.blue}
function garantirSeta(){
  const resumo=$('resumoGeralMain'),ativo=vis(resumo);document.documentElement.classList.toggle('obrixResumoAtivo',ativo);if(!ativo)return false;
  const top=document.querySelector('#app>.top');if(!top)return false;let b=$('obrixHeaderVoltar');
  if(!b){b=document.createElement('button');b.id='obrixHeaderVoltar';b.type='button';b.className='btn obrixHeaderVoltar';b.setAttribute('aria-label','Voltar');b.setAttribute('title','Voltar');top.insertBefore(b,top.firstElementChild)}
  b.classList.remove('hidden');if(!b.querySelector('svg[data-obrix-back-icon]'))b.innerHTML="<svg data-obrix-back-icon=\"1\" viewBox=\"0 0 24 24\" width=\"24\" height=\"24\" fill=\"none\" aria-hidden=\"true\"><path d=\"M19 12H5m7 7-7-7 7-7\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
  b.onclick=e=>{e?.preventDefault?.();e?.stopPropagation?.();const st=window.OBRIX_RESUMO_GERAL?.status?.()||{};if(st.view==='obra'){const interno=$('rgVoltarGeral');if(interno){interno.click();return}window.OBRIX_RESUMO_GERAL?.open?.();return}resumo.classList.add('hidden');document.documentElement.classList.remove('obrixResumoAtivo');window.OBRIX_MENU?.open?.()};
  return true;
}
function statusBranco(){document.querySelectorAll('#resumoGeralMain .rgStatus').forEach(el=>{const t=norm(el.textContent);if(t.includes('andamento')){el.classList.add('andamento');el.style.setProperty('background','#22c55e','important');el.style.setProperty('background-color','#22c55e','important');el.style.setProperty('border-color','#16a34a','important')}setColor(el,cor.white);el.querySelectorAll('*').forEach(x=>setColor(x,cor.white))})}
function colorirBloco(el){const labelEl=el.querySelector(':scope>small,:scope>span');const label=labelEl?.textContent||'';const vals=[...el.querySelectorAll(':scope>b,:scope>strong')];if(!vals.length)return;vals.forEach(v=>setColor(v,corRotulo(label,valorNumero(v.textContent))))}
function colorirNumeros(){const r=$('resumoGeralMain');if(!r)return;
  r.querySelectorAll('.rgKpis>div,.rgRows>div,.rgObraGrid>div,.rgEtapaGrid>div').forEach(colorirBloco);
  r.querySelectorAll('.rgCat').forEach(el=>{el.querySelectorAll(':scope>b,:scope>small').forEach(v=>setColor(v,cor.red))});
  r.querySelectorAll('.rgObraFoot>span').forEach(el=>{const v=el.querySelector('b,strong');if(v)setColor(v,corRotulo(el.textContent,valorNumero(v.textContent)))});
  r.querySelectorAll('.rgProg b').forEach(v=>setColor(v,cor.blue));
  r.querySelectorAll('.rgDestaque').forEach(el=>{const n=valorNumero(el.querySelector('strong')?.textContent);const c=el.classList.contains('neg')||n<0?cor.red:el.classList.contains('pos')?cor.green:cor.blue;setColor(el.querySelector('strong'),c);setColor(el.querySelector('span'),c)});
  r.querySelectorAll('.rgPosTxt b,.rgPosTxt strong,.pos b,.pos strong').forEach(v=>setColor(v,cor.green));
  r.querySelectorAll('.rgNegTxt b,.rgNegTxt strong,.neg b,.neg strong').forEach(v=>setColor(v,cor.red));
}
function aplicar(){if(applying)return;applying=true;try{if(garantirSeta()){statusBranco();colorirNumeros()}}finally{applying=false}}
function agenda(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;aplicar()})}
function ligarResumoObserver(){const r=$('resumoGeralMain');if(!r||r===resumoObservado)return;if(resumoObserver)resumoObserver.disconnect();resumoObservado=r;resumoObserver=new MutationObserver(agenda);resumoObserver.observe(r,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});agenda()}
const css=document.createElement('style');css.id='obrix-resumo-visual-final-20261102';css.textContent=`html.obrixResumoAtivo #obrixHeaderVoltar{display:inline-flex!important;visibility:visible!important;opacity:1!important}#resumoGeralMain .rgStatus,#resumoGeralMain .rgStatus.andamento{color:#fff!important;-webkit-text-fill-color:#fff!important}html[data-theme="light"] #resumoGeralMain .rgStatus.andamento{background:#22c55e!important;background-color:#22c55e!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#16a34a!important}html[data-theme="light"] #inicio #obxNovaObra,html[data-theme="light"] #inicio .obxNova{background:#000!important;background-color:#000!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#000!important}html[data-theme="light"] #inicio #obxNovaObra *,html[data-theme="light"] #inicio .obxNova *{color:#fff!important;-webkit-text-fill-color:#fff!important}`;document.head.appendChild(css);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ligarResumoObserver();agenda()},{once:true});else{ligarResumoObserver();agenda()}
const app=document.getElementById('app');if(app)new MutationObserver(()=>ligarResumoObserver()).observe(app,{childList:true,subtree:false});new MutationObserver(()=>agenda()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});window.addEventListener('pageshow',()=>{ligarResumoObserver();agenda()});window.addEventListener('focus',()=>{if(vis($('resumoGeralMain')))agenda()});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(x=>window.addEventListener(x,()=>{ligarResumoObserver();if(vis($('resumoGeralMain')))agenda()}));setTimeout(ligarResumoObserver,250);setTimeout(ligarResumoObserver,900);window.OBRIX_RESUMO_VISUAL_FINAL={refresh:()=>{ligarResumoObserver();agenda()}};
})();
(()=>{if(window.__OBRIX_INICIO_FINANCEIRO_LIMPO_LOADER)return;window.__OBRIX_INICIO_FINANCEIRO_LIMPO_LOADER=true;const s=document.createElement('script');s.src='./obrix-inicio-financeiro-limpo-20261102.js?v=20261102-1';s.defer=true;document.head.appendChild(s)})();
