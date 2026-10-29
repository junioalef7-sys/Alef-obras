(()=>{
'use strict';
if(window.__OBRIX_AJUSTES_SOLICITADOS_TESTE)return;
window.__OBRIX_AJUSTES_SOLICITADOS_TESTE=true;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const css=document.createElement('style');
css.id='obrix-ajustes-solicitados-teste-css';
css.textContent=`
#financeiroMain>.hero,#equipe>.hero,#diarioMain>.hero,#orcamentosMain>.hero{text-align:left!important;justify-content:flex-start!important}
#financeiroMain>.hero h1,#equipe>.hero h1,#diarioMain>.hero h1,#orcamentosMain>.hero h1{text-align:left!important;justify-content:flex-start!important;margin-left:0!important;margin-right:auto!important}
#inicio .obrixAndamentoCongelado{margin-left:auto!important;margin-right:0!important;text-align:right!important;font-size:95%!important}
html[data-theme="light"] #configMain .obrixApagarCongelado{background:#fff!important;background-color:#fff!important;background-image:none!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border-color:#dc2626!important;box-shadow:none!important}
`;
document.head.appendChild(css);
function marcarAndamento(){const root=document.getElementById('inicio');if(!root)return;root.querySelectorAll('span,strong,small,div,button').forEach(el=>{const t=norm(el.textContent);if(t==='em andamento'||t==='andamento')el.classList.add('obrixAndamentoCongelado')})}
function removerFechar(id){const root=document.getElementById(id);if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{if(norm(b.textContent)==='fechar'&&!b.closest('.modal,.modalBack,[role="dialog"]'))b.style.display='none'})}
function removerVoltarAjuda(){const root=document.getElementById('suporteMain');if(!root)return;root.querySelectorAll('.hero button,.card button,.hero .btn,.card .btn').forEach(b=>{if(norm(b.textContent)==='voltar')b.style.display='none'})}
function configPerigo(){const root=document.getElementById('configMain');if(!root)return;root.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{const t=norm(b.textContent);if(t==='apagar equipe'||t==='apagar financeiro')b.classList.add('obrixApagarCongelado')})}
function run(){marcarAndamento();removerFechar('financeiroMain');removerFechar('equipe');removerFechar('diarioMain');removerVoltarAjuda();configPerigo();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,400),{once:true});else setTimeout(run,400);
window.addEventListener('pageshow',()=>setTimeout(run,150));
window.OBRIX_AJUSTES_SOLICITADOS_TESTE={refresh:run};
})();