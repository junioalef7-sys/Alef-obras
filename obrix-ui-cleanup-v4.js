(()=>{'use strict';
if(window.__OBRIX_UI_CLEANUP_V4)return;window.__OBRIX_UI_CLEANUP_V4=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const inside=(el,sel)=>!!el.closest?.(sel);
function alvo(b){
 const t=norm(b.textContent);
 if(!t)return false;
 if(inside(b,'#equipe')&&(t==='vale'||t==='pagamentos'||t==='vale e pagamento'||t==='vale e pagamentos'))return true;
 if(inside(b,'#relatoriosMain')){
   if(b.id==='relTipoFinanceiro'||b.id==='relTipoEquipe')return true;
   if(t==='financeiro'||t==='relatorio financeiro'||t==='equipe / trabalhador'||t==='equipe/trabalhador'||t==='equipe trabalhador'||t==='diario de obras'||t==='relatorio diario de obras')return true;
 }
 if(inside(b,'#documentosMain,#docViewerModal,.docViewerModal')&&(b.id==='docFechar'||t==='fechar'))return true;
 if(inside(b,'#notasMain')&&(b.id==='notaSalvar'||t==='salvar nota'))return true;
 if(inside(b,'#configMain,.cfgModalBack,.cfgModal')&&(b.id==='cfgTrocarEmail'||b.id==='cfgTrocarSenha'||b.id==='cfgSair'||t==='trocar e-mail'||t==='trocar email'||t==='trocar senha'||t==='sair da conta'||t==='excluir conta'))return true;
 if(t==='excluir conta')return true;
 return false;
}
function neutro(b){
 if(!(b instanceof HTMLElement)||!alvo(b))return;
 const dark=document.documentElement.dataset.theme==='dark';
 b.classList.remove('obrixApprovedGold');
 b.removeAttribute('data-obrix-approved-color');
 b.dataset.obrixNeutralV4='1';
 b.style.setProperty('background',dark?'#101820':'#ffffff','important');
 b.style.setProperty('background-image','none','important');
 b.style.setProperty('color',dark?'#eef2f7':'#334155','important');
 b.style.setProperty('-webkit-text-fill-color',dark?'#eef2f7':'#334155','important');
 b.style.setProperty('border',dark?'1px solid #2a3948':'1px solid #cbd5e1','important');
 b.style.setProperty('box-shadow','none','important');
 b.style.setProperty('text-shadow','none','important');
}
function scan(root=document){root.querySelectorAll?.('button,[role="button"]').forEach(neutro)}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(()=>scan(document),15)}
function start(){scan(document);if(document.body)new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||m.type==='characterData'||m.attributeName==='class'))schedule()}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow','focus'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',()=>setTimeout(schedule,0),true);setTimeout(schedule,250);setTimeout(schedule,1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_UI_CLEANUP_V4={scan:schedule};
})();