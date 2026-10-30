(()=>{'use strict';
if(window.__OBRIX_AJUSTES_PONTUAIS_20261030)return;window.__OBRIX_AJUSTES_PONTUAIS_20261030=true;
const imp=(el,p,v)=>el&&el.style.setProperty(p,v,'important');
function aplicar(){
  document.querySelectorAll('#configMain [data-del="equipe"],#configMain [data-del="financeiro"]').forEach(b=>{imp(b,'background','transparent');imp(b,'background-color','transparent');imp(b,'background-image','none');imp(b,'color','#dc2626');imp(b,'-webkit-text-fill-color','#dc2626');imp(b,'border','2px solid #dc2626');imp(b,'box-shadow','none')});
  document.querySelectorAll('#equipe [data-acao="vale"]').forEach(b=>{imp(b,'background','transparent');imp(b,'background-color','transparent');imp(b,'background-image','none');imp(b,'box-shadow','none')});
  const fin=document.getElementById('financeiroMain');if(fin){const setas=[...fin.querySelectorAll('button,.btn,[role="button"],a')].filter(b=>{const t=String(b.textContent||'').replace(/\s+/g,'').trim(),a=String(b.getAttribute('aria-label')||'').toLowerCase(),ti=String(b.getAttribute('title')||'').toLowerCase();return t==='←'||t==='‹'||t==='⬅'||t==='↩'||a.includes('voltar')||ti.includes('voltar')});setas.slice(1).forEach(b=>b.remove())}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicar,0),{once:true});else setTimeout(aplicar,0);
['obrix:modules-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-applied','pageshow'].forEach(n=>window.addEventListener(n,()=>setTimeout(aplicar,0)));
document.addEventListener('click',()=>setTimeout(aplicar,0),true);
window.OBRIX_AJUSTES_PONTUAIS_20261030={refresh:aplicar};
})();