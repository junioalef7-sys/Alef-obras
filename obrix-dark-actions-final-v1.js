(()=>{'use strict';
if(window.__OBRIX_DARK_ACTIONS_FINAL_V2)return;window.__OBRIX_DARK_ACTIONS_FINAL_V2=true;
const CARD='#0f1720',BORDER='#2a3948',WHITE='#ffffff',RED='#b91c1c';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const dark=()=>document.documentElement.dataset.theme==='dark'||document.body?.classList.contains('dark');
function titleOf(btn){const box=btn.closest('.modal,.modalBack');if(!box)return'';const h=box.querySelector('h1,h2,h3,.modalTitle,.titulo');return norm(h?.textContent||'')}
function important(el,p,v){el.style.setProperty(p,v,'important')}
function neutral(btn){
  important(btn,'background',CARD);important(btn,'background-color',CARD);important(btn,'background-image','none');
  important(btn,'color',WHITE);important(btn,'-webkit-text-fill-color',WHITE);important(btn,'border-color',BORDER);
  important(btn,'box-shadow','none');important(btn,'text-shadow','none');
  btn.classList.remove('obrixApprovedGold','obrixApprovedSecondary','obrixEquipeAzulClaro');
  btn.removeAttribute('data-obrix-approved-color');
}
function danger(btn){
  important(btn,'background',RED);important(btn,'background-color',RED);important(btn,'background-image','none');
  important(btn,'color',WHITE);important(btn,'-webkit-text-fill-color',WHITE);important(btn,'border-color',RED);
  important(btn,'box-shadow','none');important(btn,'text-shadow','none');
}
function isNeutral(btn,t){
  const ttl=titleOf(btn),team=!!btn.closest('#equipe,.obrix-modelo-card,.obrix-modelo-modal,.obrix-checklist-diaria-modal');
  if(t==='vale'&&team)return true;
  if(t==='adicionar etapa')return true;
  if(/^salvar( servico)? extras?$/.test(t)||t==='salvar extra'||t==='salvar extras')return true;
  if(t==='fechar'&&/(extra|adicional|servico)/.test(ttl))return true;
  if(t==='cancelar'&&/(diaria|diario|falta|vale|bonus|extra)/.test(ttl))return true;
  if(/^registrar (diaria|diario|falta|vale)$/.test(t))return true;
  if((t==='registrar'||/^registrar (bonus|extra)/.test(t))&&/(bonus|extra)/.test(ttl))return true;
  return false;
}
function scan(){
  if(!dark())return;
  document.querySelectorAll('button').forEach(btn=>{
    const t=norm(btn.textContent);
    const excluirConta=btn.id==='cfgExcluirConta'||btn.classList.contains('accountDeleteBtn')||/^excluir conta\b/.test(t)||(btn.closest('.accountDeleteModal')&&btn.classList.contains('excluir'));
    if(excluirConta){danger(btn);return}
    if(isNeutral(btn,t))neutral(btn);
  });
}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(scan,30)}
function start(){scan();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});document.addEventListener('click',()=>setTimeout(scan,0),true);['pageshow','online','offline','obrix:modules-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-changed'].forEach(n=>window.addEventListener(n,schedule));setTimeout(scan,120);setTimeout(scan,500);setTimeout(scan,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();