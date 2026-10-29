(()=>{
'use strict';
if(window.__OBRIX_AJUSTES_CONGELADOS_20261029)return;
window.__OBRIX_AJUSTES_CONGELADOS_20261029=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const css=document.createElement('style');
css.id='obrix-ajustes-congelados-20261029-css';
css.textContent=`
/* Somente títulos solicitados: alinhamento à esquerda */
#financeiroMain>.hero,#equipe>.hero,#diarioMain>.hero,#orcamentosMain>.hero{text-align:left!important;justify-content:flex-start!important}
#financeiroMain>.hero h1,#equipe>.hero h1,#diarioMain>.hero h1,#orcamentosMain>.hero h1{text-align:left!important;justify-content:flex-start!important;margin-left:0!important;margin-right:auto!important}
/* Em andamento: somente posição e redução de 5% */
#inicio .obrixAndamentoCongelado{margin-left:auto!important;margin-right:0!important;text-align:right!important;font-size:95%!important}
/* Configurações modo claro: somente os dois botões destrutivos pedidos */
html[data-theme="light"] #configMain .obrixApagarCongelado{background:#fff!important;background-color:#fff!important;background-image:none!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border-color:#dc2626!important;box-shadow:none!important}
`;
document.head.appendChild(css);
function marcarAndamento(){
 const root=document.getElementById('inicio');if(!root)return;
 root.querySelectorAll('span,strong,small,div,button').forEach(el=>{
   if(norm(el.textContent)==='em andamento' || norm(el.textContent)==='andamento') el.classList.add('obrixAndamentoCongelado');
 });
}
function removerFechar(id){
 const root=document.getElementById(id);if(!root)return;
 root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{
   if(norm(b.textContent)==='fechar'&&!b.closest('.modal,.modalBack,[role="dialog"]')) b.remove();
 });
}
function removerVoltarAjuda(){
 const root=document.getElementById('suporteMain');if(!root)return;
 root.querySelectorAll('.hero button,.card button,.hero .btn,.card .btn').forEach(b=>{
   if(norm(b.textContent)==='voltar') b.remove();
 });
}
function configPerigo(){
 const root=document.getElementById('configMain');if(!root)return;
 root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{
   const t=norm(b.textContent);
   b.classList.toggle('obrixApagarCongelado',t==='apagar equipe'||t==='apagar financeiro');
 });
}
function financeiroBusca(){
 if(document.getElementById('financeiroMain')&&!window.OBRIX_FIN_BUSCA&&window.OBRIX_POS_LOGIN_LOADER?.loadGroup){
   window.OBRIX_POS_LOGIN_LOADER.loadGroup('financeiro').then(()=>{window.OBRIX_FIN_BUSCA?.refreshOptions?.();window.OBRIX_FIN_BUSCA?.aplicar?.()}).catch(()=>{});
 }else{
   window.OBRIX_FIN_BUSCA?.refreshOptions?.();
 }
}
function aplicar(){
 marcarAndamento();
 removerFechar('financeiroMain');
 removerFechar('equipe');
 removerFechar('diarioMain');
 removerVoltarAjuda();
 configPerigo();
 financeiroBusca();
}
let timer=0;
function agenda(){clearTimeout(timer);timer=setTimeout(aplicar,60)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(aplicar,300),{once:true});else setTimeout(aplicar,300);
window.addEventListener('pageshow',agenda);
['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto','obrix:theme-applied'].forEach(e=>window.addEventListener(e,agenda));
document.addEventListener('click',()=>setTimeout(aplicar,120),true);
window.OBRIX_AJUSTES_CONGELADOS_20261029={refresh:aplicar};
})();