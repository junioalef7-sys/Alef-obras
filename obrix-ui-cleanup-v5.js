(()=>{'use strict';
if(window.__OBRIX_UI_CLEANUP_V5)return;window.__OBRIX_UI_CLEANUP_V5=true;
const GOLD='#f2b84b';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const inside=(el,sel)=>!!el.closest?.(sel);
function mark(b,goldText=false){
 if(!(b instanceof HTMLElement))return;
 b.classList.add('obrixPermanentNeutral');
 b.classList.toggle('obrixPermanentGoldText',!!goldText);
 b.classList.remove('obrixApprovedGold','obrixUiNeutral','obrixUiNeutralV3');
 b.removeAttribute('data-obrix-approved-color');
 b.dataset.obrixPermanentNeutral='1';
 applyOne(b,goldText);
}
function applyOne(b,goldText=b.classList.contains('obrixPermanentGoldText')){
 const dark=document.documentElement.dataset.theme==='dark';
 b.style.setProperty('background',dark?'#101820':'#ffffff','important');
 b.style.setProperty('background-image','none','important');
 b.style.setProperty('color',goldText?GOLD:(dark?'#eef2f7':'#334155'),'important');
 b.style.setProperty('-webkit-text-fill-color',goldText?GOLD:(dark?'#eef2f7':'#334155'),'important');
 b.style.setProperty('border',dark?'1px solid #2a3948':'1px solid #cbd5e1','important');
 b.style.setProperty('box-shadow','none','important');
 b.style.setProperty('text-shadow','none','important');
}
function classify(b){
 if(!(b instanceof HTMLElement))return;const t=norm(b.textContent),plain=t.replace(/^[+＋]\s*/,'');if(!t)return;
 if(inside(b,'#obras')){
  if(t==='checklist'||t.includes('relatorio fotografico')||(t.includes('pagamentos')&&t.includes('recebidos'))||/^servicos? extras?$/.test(t)||t==='editar')return mark(b);
 }
 if(inside(b,'#financeiroMain')&&t==='editar')return mark(b);
 if(inside(b,'#diarioMain')&&(t==='salvar'||t==='salvar diario'||t.includes('salvar diario')))return mark(b);
 if(inside(b,'#equipe')){
  if(t.includes('bonus e extras'))return mark(b,true);
  if(plain==='funcionario'||plain==='funcionarios'||t==='ativar'||t==='desativar'||t.includes('ativar / desativar')||t==='vale'||t==='pagamentos'||t==='vale e pagamento'||t==='vale e pagamentos'||t.includes('marcar diario')||t.includes('marcar diaria')||t==='falta'||t.includes('historico de faltas')||t.includes('ver registro')||t.includes('editar cadastro'))return mark(b);
 }
 if(inside(b,'#orcamentosMain')&&(t==='editar'||t==='visualizar'||t==='imprimir'||t.includes('visualizar / imprimir')||t.includes('visualizar e imprimir')||(t.includes('visualizar')&&t.includes('imprimir'))))return mark(b);
 if(inside(b,'#relatoriosMain')){
  if(b.id==='relTipoFinanceiro'||b.id==='relTipoEquipe'||t==='financeiro'||t==='relatorio financeiro'||t==='equipe'||t==='trabalhador'||t==='equipe / trabalhador'||t==='equipe/trabalhador'||t==='equipe trabalhador'||t==='diario de obras'||t==='relatorio diario de obras')return mark(b);
 }
 if(inside(b,'#documentosMain,#docViewerModal,.docViewerModal')&&(t==='fechar'||t==='abrir arquivo'||t==='imprimir'||t==='salvar'||(t.includes('imprimir')&&t.includes('salvar'))))return mark(b);
 if(inside(b,'#notasMain')&&(t==='salvar nota'||t==='editar'||t==='enviar'||t==='excluir'))return mark(b);
 if(inside(b,'#offlineCentralMain')&&(t==='tudo sincronizado'||t.includes('ferramentas avancadas')))return mark(b);
 if(inside(b,'#configMain,.cfgModalBack,.cfgModal')&&(t==='trocar e-mail'||t==='trocar email'||t==='trocar senha'||t.includes('modo claro')||t.includes('modo escuro')||t==='apagar equipe'||t==='apagar obras'||t==='apagar financeiro'||t==='sair da conta'||t==='excluir conta'))return mark(b);
 if(t==='excluir conta'||t==='sair da conta')return mark(b);
 if(b.dataset.obrixPermanentNeutral==='1')applyOne(b);
}
function scan(root=document){root.querySelectorAll?.('button,[role="button"]').forEach(classify);document.querySelectorAll('.obrixPermanentNeutral').forEach(b=>applyOne(b))}
const STYLE=`
#obras .hero p,#diarioMain .hero p,#financeiroMain .hero p,#equipe .hero p,#estoqueMain .hero p,#orcamentosMain .hero p,#relatoriosMain .hero p,#documentosMain .hero p,#notasMain .hero p,#backupMain .hero p,#configMain .hero p{display:none!important}
#obras .hero h1,#diarioMain .hero h1,#financeiroMain .hero h1,#equipe .hero h1,#estoqueMain .hero h1,#orcamentosMain .hero h1,#relatoriosMain .hero h1,#documentosMain .hero h1,#notasMain .hero h1,#backupMain .hero h1,#configMain .hero h1{margin-bottom:0!important}
#menuUsuario{display:none!important}
#orcamentosMain .orcStatus.rascunho{background:transparent!important;background-image:none!important;border:0!important;box-shadow:none!important;padding:0!important;color:#64748b!important}
html[data-theme="dark"] #orcamentosMain .orcStatus.rascunho{color:#a9b5c5!important}
`;
function css(){let s=document.getElementById('obrixUiCleanupV5');if(!s){s=document.createElement('style');s.id='obrixUiCleanupV5';document.head.appendChild(s)}if(s.textContent!==STYLE)s.textContent=STYLE;if(s!==document.head.lastElementChild)document.head.appendChild(s)}
let timer=0;function schedule(){clearTimeout(timer);timer=setTimeout(()=>{css();scan(document)},15)}
function start(){css();scan(document);if(document.body)new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||m.type==='characterData'||m.attributeName==='class'||m.attributeName==='style'))schedule()}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style']});new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','pageshow','focus','online','offline'].forEach(n=>window.addEventListener(n,schedule));document.addEventListener('click',()=>setTimeout(schedule,0),true);setTimeout(schedule,150);setTimeout(schedule,500);setTimeout(schedule,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.OBRIX_UI_CLEANUP_V5={scan:schedule};
})();