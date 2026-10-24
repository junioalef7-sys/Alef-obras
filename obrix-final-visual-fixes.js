(()=>{'use strict';
if(window.__OBRIX_FINAL_VISUAL_FIXES)return;window.__OBRIX_FINAL_VISUAL_FIXES=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const dark=()=>document.documentElement.dataset.theme==='dark'||document.body?.classList?.contains('dark');
function force(el,p,v){try{el.style.setProperty(p,v,'important')}catch(_){}}
function fixHistory(){const main=document.getElementById('diarioMain');if(!main)return;const cards=[...main.children].filter(el=>el.classList?.contains('card')&&!el.classList.contains('diarioForm'));const card=cards.find(el=>norm(el.querySelector('.sectionHead strong')?.textContent)==='historico da obra');if(!card)return;if(dark()){
 ['background','background-color','color','border-color','box-shadow'].forEach(p=>card.style.removeProperty(p));
 return;
 }
 force(card,'background','#ffffff');force(card,'background-color','#ffffff');force(card,'color','#0f172a');force(card,'border-color','#e2e8f0');force(card,'box-shadow','none');
}
function fixLogout(){const b=document.getElementById('cfgSair');if(!b)return;force(b,'background','#e2e8f0');force(b,'background-color','#e2e8f0');force(b,'background-image','none');force(b,'color','#334155');force(b,'-webkit-text-fill-color','#334155');force(b,'border-color','#cbd5e1');force(b,'box-shadow','none');force(b,'text-shadow','none')}
function fixPay(root=document){const buttons=[];if(root instanceof HTMLButtonElement)buttons.push(root);root.querySelectorAll?.('button').forEach(b=>buttons.push(b));for(const b of buttons){const t=norm(b.textContent);const team=b.closest?.('#equipe,.obrix-equipe-controles');if(!team||!(t==='pagar'||t==='pagar equipe'||t.startsWith('pagar ')))continue;force(b,'background','transparent');force(b,'background-color','transparent');force(b,'background-image','none');force(b,'border-color','transparent');force(b,'box-shadow','none');force(b,'text-shadow','none');const c=dark()?'#eef2f7':'#334155';force(b,'color',c);force(b,'-webkit-text-fill-color',c)} }
function apply(root=document){fixHistory();fixLogout();fixPay(root)}
let timer=0;function schedule(ms=16){clearTimeout(timer);timer=setTimeout(()=>apply(document),ms)}
function start(){apply(document);new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes||[])if(n instanceof Element)fixPay(n);schedule(24)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});document.addEventListener('click',()=>schedule(12),true);['pageshow','focus','obrix:modules-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(n=>window.addEventListener(n,()=>schedule(20)));setTimeout(()=>apply(document),120);setTimeout(()=>apply(document),500);setTimeout(()=>apply(document),1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_FINAL_VISUAL_FIXES={apply};
})();
