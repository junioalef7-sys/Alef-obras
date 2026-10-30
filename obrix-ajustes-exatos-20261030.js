(()=>{
'use strict';
if(window.__OBRIX_AJUSTES_EXATOS_20261030)return;
window.__OBRIX_AJUSTES_EXATOS_20261030=true;
const imp=(el,p,v)=>el?.style?.setProperty(p,v,'important');
const norm=v=>String(v||'').replace(/\s+/g,' ').trim().toLowerCase();

function configClaro(){
  if(document.documentElement.dataset.theme!=='light')return;
  const root=document.getElementById('configMain');
  if(!root)return;
  root.querySelectorAll('.cfgDeleteGrid button').forEach(b=>{
    const del=String(b.dataset.del||'');
    const vermelho=del==='equipe'||del==='financeiro';
    b.classList.toggle('obrixConfigPerigo',vermelho);
    imp(b,'background','var(--ob-surface-2)');
    imp(b,'background-color','var(--ob-surface-2)');
    imp(b,'background-image','none');
    imp(b,'color',vermelho?'#dc2626':'var(--ob-text)');
    imp(b,'-webkit-text-fill-color',vermelho?'#dc2626':'var(--ob-text)');
    imp(b,'border',vermelho?'2px solid #dc2626':'1px solid var(--ob-border)');
    imp(b,'box-shadow','none');
  });
}

function valeOriginal(){
  const root=document.getElementById('equipe');
  if(!root)return;
  root.querySelectorAll('button[data-acao="vale"],.obrix-cmd[data-acao="vale"],button[data-cmd="vale"],.obrix-cmd[data-cmd="vale"]').forEach(b=>{
    const dark=document.documentElement.dataset.theme==='dark';
    imp(b,'background',dark?'#181d23':'var(--ob-surface)');
    imp(b,'background-color',dark?'#181d23':'var(--ob-surface)');
    imp(b,'background-image','none');
    imp(b,'color','var(--ob-text)');
    imp(b,'-webkit-text-fill-color','var(--ob-text)');
    imp(b,'border','1px solid var(--ob-border)');
    imp(b,'box-shadow','none');
  });
}

function umaSetaFinanceiro(){
  const root=document.getElementById('financeiroMain');
  if(!root)return;
  const hero=root.querySelector(':scope > .hero');
  if(!hero)return;
  const candidatos=[...hero.querySelectorAll('button,.btn,[role="button"],a')].filter(b=>{
    const t=norm(b.textContent).replace(/\s/g,'');
    const a=norm(b.getAttribute('aria-label'));
    const ti=norm(b.getAttribute('title'));
    return b.classList.contains('obrixModuleClose')||b.classList.contains('obrixFinSeta')||t==='←'||t==='‹'||t==='⬅'||t==='↩'||a.includes('voltar')||ti.includes('voltar');
  });
  if(candidatos.length<=1)return;
  candidatos.slice(1).forEach(b=>b.remove());
}

function aplicar(){configClaro();valeOriginal();umaSetaFinanceiro()}
function depois(){setTimeout(aplicar,0);setTimeout(aplicar,120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',depois,{once:true});else depois();
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-applied','pageshow'].forEach(n=>window.addEventListener(n,depois));
document.addEventListener('click',e=>{if(e.target.closest?.('#configMain,#equipe,#financeiroMain,[data-go="config"],[data-go="financeiro"],#bEquipe'))depois()},true);
window.OBRIX_AJUSTES_EXATOS_20261030={refresh:aplicar};
})();