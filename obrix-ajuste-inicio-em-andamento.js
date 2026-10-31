/* Ajuste isolado — Início / Em andamento — 2026-10-29 */
(function(){
  'use strict';
  var STYLE_ID='obrix-ajuste-inicio-em-andamento-style';
  var CLS='obrix-em-andamento-ajustado';
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function style(){if(document.getElementById(STYLE_ID))return;var st=document.createElement('style');st.id=STYLE_ID;st.textContent='\n#inicio .'+CLS+'{margin-left:auto!important;margin-right:0!important;align-self:center!important;justify-self:end!important;width:auto!important;max-width:max-content!important;padding:0!important;font-size:95%!important;line-height:1.05!important;background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border:0!important;border-color:transparent!important;border-radius:0!important;}\n#inicio .'+CLS+'::before,#inicio .'+CLS+'::after{background:transparent!important;background-color:transparent!important;background-image:none!important;box-shadow:none!important;border:0!important;}\n';document.head.appendChild(st);}
  function candidatos(inicio){return Array.prototype.filter.call(inicio.querySelectorAll('button,span,strong,small,div,p'),function(el){if(norm(el.textContent)!=='em andamento')return false;if(el.children.length&&el.tagName!=='BUTTON')return false;return true;});}
  function aplicar(){var inicio=document.getElementById('inicio');if(!inicio)return;style();candidatos(inicio).forEach(function(el){el.classList.add(CLS);el.style.setProperty('background','transparent','important');el.style.setProperty('background-color','transparent','important');el.style.setProperty('background-image','none','important');el.style.setProperty('box-shadow','none','important');el.style.setProperty('border','0','important');el.style.setProperty('border-color','transparent','important');el.style.setProperty('border-radius','0','important');el.style.setProperty('padding','0','important');el.style.setProperty('margin-left','auto','important');el.style.setProperty('margin-right','0','important');el.style.setProperty('font-size','95%','important');var parent=el.parentElement;if(parent){parent.style.setProperty('display','flex','important');parent.style.setProperty('align-items','center','important');parent.style.setProperty('justify-content','space-between','important');}});}
  var scheduled=false;function agenda(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;aplicar();});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',agenda,{once:true});else agenda();var inicio=document.getElementById('inicio');if(inicio)new MutationObserver(agenda).observe(inicio,{childList:true,subtree:true});window.addEventListener('obrix:modules-ready',agenda);window.addEventListener('obrix:feature-pronto',agenda);window.addEventListener('pageshow',agenda);
})();

/* Ajuste solicitado — títulos realmente +2%; volta do Financeiro no cabeçalho; preserva ações das Obras */
(()=>{'use strict';
if(window.__OBRIX_TITULOS_COMPACTOS_REAIS)return;window.__OBRIX_TITULOS_COMPACTOS_REAIS=true;
const nomes=['obras','diário de obras','diario de obras','financeiro','equipe','funcionários','funcionarios','materiais / estoque','materiais/estoque','estoque','orçamentos','orcamentos','relatórios','relatorios','documentos','notas','backup','central offline','planos e assinaturas','ajuda e feedback','configurações','configuracoes'];
const n=s=>String(s||'').replace(/\s+/g,' ').trim().toLowerCase();
const ehTitulo=e=>{const t=n(e.textContent);return nomes.some(x=>t===x||t.startsWith(x+' '));};
function cabecalhos(){document.querySelectorAll('#app h1,#app h2,#app .sectionHead>strong').forEach(t=>{if(!ehTitulo(t))return;const cab=t.closest('.hero,.sectionHead,header');if(!cab||cab.closest('.modal,.modalBack,[role="dialog"]'))return;cab.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{const tx=n(b.textContent);if(tx==='fechar'||tx==='voltar')b.remove();});[['width','100%'],['max-width','100%'],['min-width','0'],['min-height','0'],['height','auto'],['padding','7px 12px'],['margin-left','0'],['margin-right','0'],['display','flex'],['align-items','center'],['justify-content','flex-start'],['box-sizing','border-box']].forEach(([p,v])=>cab.style.setProperty(p,v,'important'));t.style.setProperty('margin','0','important');t.style.setProperty('text-align','left','important');t.style.setProperty('width','auto','important');if(!t.dataset.obrixTituloBasePx){const px=parseFloat(getComputedStyle(t).fontSize)||16;t.dataset.obrixTituloBasePx=String(px);t.style.setProperty('font-size',(px*1.02)+'px','important');}t.style.setProperty('line-height','1.05','important');});}
function voltarFinanceiro(){const main=document.getElementById('financeiroMain');const top=document.querySelector('#app>.top');if(!top)return;let b=top.querySelector('.obrix-voltar-financeiro');if(!main||main.classList.contains('hidden')){if(b)b.remove();return;}if(b)return;b=document.createElement('button');b.type='button';b.className='btn obrix-voltar-financeiro';b.setAttribute('aria-label','Voltar');b.setAttribute('title','Voltar');b.textContent='←';b.style.cssText='order:-1;margin:0 6px 0 0;padding:0;width:44px;height:44px;min-width:44px;font-size:25px;line-height:1;display:inline-flex;align-items:center;justify-content:center;';b.onclick=()=>{if(typeof window.abrir==='function')window.abrir('inicio');};top.insertBefore(b,top.firstChild);}
function removerDuplicadosObras(){const root=document.getElementById('obras');if(!root)return;root.querySelectorAll('.card.item[data-obra-id]').forEach(card=>{['relatório fotográfico','relatorio fotografico','pagamentos recebidos'].forEach(rotulo=>{const iguais=[...card.querySelectorAll('button,.btn,[role="button"],a')].filter(b=>n(b.textContent).includes(rotulo));iguais.slice(1).forEach(b=>b.remove());});});}
function fundoEscuro(){if(document.documentElement.dataset.theme!=='dark')return;[...document.querySelectorAll('body *')].filter(e=>n(e.textContent)==='instalar obrix').forEach(t=>{let box=t.parentElement;for(let i=0;i<4&&box&&box.parentElement;i++){if(box.querySelectorAll('button').length)break;box=box.parentElement;}if(!box)return;box.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{[['background','#111e2c'],['background-color','#111e2c'],['background-image','none'],['color','#f8fafc'],['-webkit-text-fill-color','#f8fafc'],['border-color','#293b4d'],['box-shadow','none']].forEach(([p,v])=>b.style.setProperty(p,v,'important'));});});}
let q=false;function run(){q=false;cabecalhos();voltarFinanceiro();removerDuplicadosObras();fundoEscuro();}function ag(){if(q)return;q=true;requestAnimationFrame(run);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();new MutationObserver(m=>{if(m.some(x=>x.type==='childList'||x.attributeName==='class'))ag();}).observe(document.getElementById('app')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});new MutationObserver(ag).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(x=>window.addEventListener(x,ag));
})();

/* Financeiro mobile — cartões 2x2 maiores e cores somente nos números */
(()=>{'use strict';
if(window.__OBRIX_FIN_MOBILE_NUMEROS_3110)return;window.__OBRIX_FIN_MOBILE_NUMEROS_3110=true;
const mobile=()=>matchMedia('(max-width:620px)').matches;
function aplicar(){
  if(!mobile())return;
  const root=document.querySelector('#financeiroMain .obxMobileCompactView');if(!root)return;
  const topo=root.querySelector('.obmTopo');
  if(topo){
    topo.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');
    topo.style.setProperty('gap','8px','important');
  }
  root.querySelectorAll('.obmK').forEach(k=>{
    k.style.setProperty('padding','14px 12px','important');
    k.style.setProperty('min-height','82px','important');
    k.style.setProperty('border-radius','12px','important');
    const s=k.querySelector('small'),b=k.querySelector('b');
    if(s){s.style.setProperty('font-size','11px','important');s.style.setProperty('font-weight','900','important');s.style.setProperty('color','var(--ob-text,#0f172a)','important');s.style.setProperty('-webkit-text-fill-color','var(--ob-text,#0f172a)','important');}
    if(b){b.style.setProperty('font-size','18px','important');b.style.setProperty('font-weight','900','important');}
  });
  root.querySelectorAll('.obmK.rec b,.obmResumoBloco.recebido b').forEach(b=>{b.style.setProperty('color','#0aa950','important');b.style.setProperty('-webkit-text-fill-color','#0aa950','important');});
  root.querySelectorAll('.obmK.des b,.obmResumoBloco.despesas b').forEach(b=>{b.style.setProperty('color','#ef332b','important');b.style.setProperty('-webkit-text-fill-color','#ef332b','important');});
  root.querySelectorAll('.obmK.res b,.obmResumoBloco.lucro b,.obmResumoBloco.prejuizo b').forEach(b=>{b.style.setProperty('color','#1688ff','important');b.style.setProperty('-webkit-text-fill-color','#1688ff','important');});
  root.querySelectorAll('.obmK.mar b,.obmResumoBloco.servico b').forEach(b=>{b.style.setProperty('color','var(--ob-text,#0f172a)','important');b.style.setProperty('-webkit-text-fill-color','var(--ob-text,#0f172a)','important');});
}
let q=false;function ag(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;aplicar()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ag();setTimeout(ag,300);setTimeout(ag,900)},{once:true});else{ag();setTimeout(ag,300);setTimeout(ag,900)}
new MutationObserver(m=>{if(m.some(x=>[...x.addedNodes].some(n=>n.nodeType===1&&(n.matches?.('.obxMobileCompactView,.obmTopo,.obmK,.obmResumoBloco')||n.querySelector?.('.obxMobileCompactView,.obmTopo,.obmK,.obmResumoBloco')))))ag();}).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
window.addEventListener('resize',ag);window.addEventListener('pageshow',ag);['obrix:modules-ready','obrix:feature-pronto','obrix:theme-applied'].forEach(x=>window.addEventListener(x,ag));
})();