(()=>{'use strict';if(window.__OBRIX_VISUAL_PADRAO_FINAL)return;window.__OBRIX_VISUAL_PADRAO_FINAL=true;
const st=document.createElement('style');st.id='obrix-visual-padrao-final';st.textContent=`
/* Setas superiores disponíveis somente nos acessos originados pelo Menu. */
html[data-obrix-financeiro-origem="rodape"] #app:has(#financeiroMain:not(.hidden)) > .top #obrixHeaderVoltar,
html[data-obrix-financeiro-origem="rodape"] #app:has(#financeiroMain:not(.hidden)) > .top button[aria-label="Voltar"]{
 display:none!important;visibility:hidden!important;
}
html[data-theme="light"] #app>.top #obrixTheme{
 animation:none!important;transition:none!important;opacity:1!important;visibility:visible!important;
}
/* A seta superior só existe para Equipe quando a navegação veio do Menu. */
html[data-obrix-equipe-origem="rodape"] #app:has(#equipe:not(.hidden)) > .top #obrixHeaderVoltar,
html[data-obrix-equipe-origem="rodape"] #app:has(#equipe:not(.hidden)) > .top button[aria-label="Voltar"]{
  display:none!important;visibility:hidden!important;
}
:root{--ob-bg:#eef2f6;--ob-surface:#f8fafc;--ob-card:#f8fafc;--ob-surface-2:#e5eaf0;--ob-text:#0f172a;--ob-muted:#526173;--ob-border:#cbd5df;color-scheme:light}html[data-theme="dark"]{--ob-bg:#07111b;--ob-surface:#0d1722;--ob-card:#0d1722;--ob-surface-2:#111e2c;--ob-text:#f8fafc;--ob-muted:#c3ceda;--ob-border:#293b4d;color-scheme:dark}html,body,body>.wrap,#app{background:var(--ob-bg)!important;color:var(--ob-text)!important}#app :is(.card,.hero,.panel,.box,.sheet,.drawer,.kpi,.item){background:var(--ob-surface)!important;color:var(--ob-text)!important;border-color:var(--ob-border)!important;box-shadow:none!important}#app :is(.mini,.status,input,select,textarea,button,.btn,.bottom button,.nav button){background:var(--ob-surface-2)!important;color:var(--ob-text)!important;-webkit-text-fill-color:var(--ob-text)!important;border-color:var(--ob-border)!important;box-shadow:none!important}#app button,#app .btn,#app input[type="button"],#app input[type="submit"],#app input[type="reset"],#app [role="button"],.modalBack button,.modalBack .btn,.modal button,.modal .btn,[role="dialog"] button,[role="dialog"] .btn{background:var(--ob-surface-2)!important;background-color:var(--ob-surface-2)!important;background-image:none!important;color:var(--ob-text)!important;-webkit-text-fill-color:var(--ob-text)!important;border-color:var(--ob-border)!important;box-shadow:none!important}
#financeiroMain>.hero{min-height:72px!important;display:flex!important;align-items:center!important;padding-top:12px!important;padding-bottom:12px!important}#financeiroMain>.hero h1{margin:0!important;line-height:1.15!important;display:flex!important;align-items:center!important}.obrixFinReceita{background:#16a34a!important;background-color:#16a34a!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#16a34a!important}.obrixFinDespesa{background:#dc2626!important;background-color:#dc2626!important;background-image:none!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#dc2626!important}
.obrixConfigPerigo{background:var(--ob-surface-2)!important;background-color:var(--ob-surface-2)!important;background-image:none!important;color:#dc2626!important;-webkit-text-fill-color:#dc2626!important;border:2px solid #dc2626!important;box-shadow:none!important}
.obrixHeaderVoltar{width:42px!important;height:42px!important;padding:0!important;flex:0 0 42px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:12px!important;font-size:26px!important;line-height:1!important;order:-2!important}.obrixHeaderVoltar svg[data-obrix-back-icon]{display:block!important;width:24px!important;height:24px!important;flex:none!important;color:inherit!important}#app:has(#financeiroMain:not(.hidden)) #obrixHeaderVoltar::before,#app:has(#resumoGeralMain:not(.hidden)) #obrixHeaderVoltar::before{content:none!important;display:none!important}html.obrixFinanceAndroidVisible #app>.top #obrixHeaderVoltar.obrixFinanceStandardBack{width:42px!important;height:42px!important;border-radius:12px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;font-size:0!important;line-height:0!important;text-indent:0!important}
html.obrixFinanceAndroidVisible #app>.top #obrixHeaderVoltar.obrixFinanceStandardBack::before,
html.obrixFinanceAndroidVisible #app>.top #obrixHeaderVoltar.obrixFinanceStandardBack::after{content:none!important;display:none!important;width:0!important;height:0!important;-webkit-mask:none!important;mask:none!important}
html.obrixFinanceAndroidVisible #app>.top #obrixHeaderVoltar.obrixFinanceStandardBack svg[data-obrix-back-icon]{display:block!important;width:29px!important;height:29px!important;flex:0 0 29px!important;opacity:1!important;visibility:visible!important;transform:none!important;fill:none!important;stroke:none!important;color:inherit!important}
.obrixHeaderVoltar.hidden{display:none!important}#app>.top:has(.obrixHeaderVoltar:not(.hidden)){justify-content:flex-start!important}#app>.top:has(.obrixHeaderVoltar:not(.hidden))>div:first-of-type{margin-right:auto!important}#diarioMain .diarioAtualizar{display:none!important}#diarioNovoDiario{width:100%!important;min-height:56px!important;display:flex!important;align-items:center!important;justify-content:center!important;margin:0 0 14px!important;border:1px solid var(--ob-border)!important;border-radius:14px!important;background:var(--ob-surface-2)!important;color:var(--ob-text)!important;font-weight:700!important;font-size:16px!important;box-sizing:border-box!important}#diarioMain input[type="date"]{color:#000!important;-webkit-text-fill-color:#000!important}.obrixDocNovo{width:100%!important;min-height:56px!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:16px!important;font-weight:800!important;background:var(--ob-surface-2)!important;color:var(--ob-text)!important;border:1px solid var(--ob-border)!important}.obrixDocExcluir{background:#dc2626!important;background-color:#dc2626!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#dc2626!important}
/* Apenas seta de voltar dentro da obra no Android em tema claro. */
html[data-theme="light"] #app #obxVoltarObras.obxVoltarAndroid{
 background:#17364e!important;background-color:#17364e!important;
 color:#fff!important;-webkit-text-fill-color:#fff!important;
 border-color:#17364e!important;opacity:1!important;
 filter:none!important;text-shadow:none!important;
}
html[data-theme="light"] #app #obxVoltarObras.obxVoltarAndroid svg[data-obrix-back-icon]{
 color:#fff!important;opacity:1!important;filter:none!important;
}
html[data-theme="light"] #app #obxVoltarObras.obxVoltarAndroid svg[data-obrix-back-icon] path{
 stroke:#fff!important;stroke-width:3!important;
}

/* Evita cartões pequenos/grandes excederem a tela sem alterar os layouts aprovados. */
#app :is(.card,.item,.panel,.box,.kpi,.mini,.metric,.metrica,.obxValor,.obxAcao,.obp-work,.obp-detail-finance>div,.obxCardFin>div,.obxResumoGrid>div):not(#financeiroMain *){
 box-sizing:border-box;min-width:0;max-width:100%;
}
#app :is(.card,.item,.panel,.box,.kpi,.mini,.obxValor,.obxCardFin>div):not(#financeiroMain *) :is(b,strong){
 max-width:100%;overflow-wrap:anywhere;
}
/* Os cartões de valores das obras não tinham superfície própria em alguns temas. */
html[data-theme="light"] #app .obxCardFin>div{
 background-color:var(--ob-surface-2,#e5eaf0);
 border:1px solid var(--ob-border,#cbd5df);
 border-radius:10px;min-width:0;
}
html[data-theme="dark"] #app .obxCardFin>div{
 background-color:var(--ob-surface-2,#111e2c);
 border:1px solid var(--ob-border,#293b4d);
 border-radius:10px;min-width:0;
}
`;document.head.appendChild(st);

/* Ajuste de cartões exclusivamente para Android: o iPhone não recebe CSS novo. */
if(/Android/i.test(navigator.userAgent||'')){
 const stAndroid=document.createElement('style');stAndroid.id='obrix-financeiro-android-proporcoes';
 stAndroid.textContent=[
 '@media(max-width:760px){',
 '#financeiroMain #fmLista [data-fin-card="1"] > .grid{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:0!important;margin:7px 0 0!important;}',
 '#financeiroMain #fmLista [data-fin-card="1"] > .grid > .mini{box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;height:56px!important;min-height:56px!important;max-height:56px!important;padding:8px 12px!important;margin:0!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;overflow:hidden!important;}',
 '#financeiroMain #fmLista [data-fin-card="1"] > .grid > .mini small{font-size:13px!important;line-height:20px!important;margin:0!important;}',
 '#financeiroMain #fmLista [data-fin-card="1"] > .grid > .mini b{font-size:16px!important;line-height:20px!important;margin:0 0 0 auto!important;white-space:nowrap!important;max-width:55%!important;}',
 '#financeiroMain #fmLista [data-fin-card="1"] > .actions{display:flex!important;align-items:stretch!important;gap:8px!important;width:100%!important;max-width:100%!important;margin-top:9px!important;}',
 '#financeiroMain #fmLista [data-fin-card="1"] > .actions button{box-sizing:border-box!important;flex:1 1 0!important;width:auto!important;min-width:0!important;min-height:42px!important;height:42px!important;max-height:42px!important;padding:7px 9px!important;border-radius:10px!important;line-height:20px!important;}',
 '}'
 ].join('\n');document.head.appendChild(stAndroid);
}
const statusObras=document.createElement('style');statusObras.id='obrix-status-obras-contraste';
statusObras.textContent=[
 '#app #obras :is(.obxStatus.andamento,.obxStatus.em_andamento,.obxStatus.obxStatus-andamento,.obxStatus.obxStatus-em_andamento,button[data-filtro="andamento"],button[data-status="andamento"]){color:#fff!important;-webkit-text-fill-color:#fff!important;opacity:1!important;visibility:visible!important;filter:none!important;text-shadow:none!important;animation:none!important;transition:none!important;}',
 '#app #obras :is(.obxStatus.andamento,.obxStatus.em_andamento,.obxStatus.obxStatus-andamento,.obxStatus.obxStatus-em_andamento){background-color:#05b94f!important;}',
 'html[data-theme="light"] #app #obras button[data-filtro="andamento"].ativo{background:#557ca8!important;border-color:#557ca8!important;}',
 'html[data-theme="light"] #app #obras button[data-filtro="andamento"]:not(.ativo){background:#0b2535!important;border-color:#496273!important;}'
].join('\n');document.head.appendChild(statusObras);

function textoBuscaGarantida(v){
 return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('pt-BR').trim();
}
/* Instala o campo na janela exibida, mesmo com um módulo antigo no cache PWA. */
function garantirBuscaNoHistorico(back){
 if(!back||back.nodeType!==1||back.dataset.obrixBuscaGarantida==='1')return;
 const dialog=back.querySelector?.('.modal');if(!dialog)return;
 const titulo=textoBuscaGarantida(dialog.querySelector('h2')?.textContent);
 const estoque=back.classList.contains('estOp')&&/historico/.test(titulo)&&/(estoque|movimentac)/.test(titulo);
 const equipe=/registros do funcionario/.test(titulo);
 if(!estoque&&!equipe)return;
 const raiz=estoque?dialog.querySelector('.estHistLista,.estHist'):
  dialog.querySelector('.obrix-registros-corpo,.obrix-registros-lista');
 if(!raiz)return;
 back.dataset.obrixBuscaGarantida='1';
 const classe=estoque?'estHistBusca':'obrix-registros-busca';
 let input=dialog.querySelector('.'+classe);
 if(!input){
   const area=document.createElement('div');area.className='obrix-busca-garantida';
   area.style.cssText='display:block;width:100%;margin:10px 0;min-width:0;';
   const label=document.createElement('label');label.textContent=estoque?'Buscar movimentações':'Buscar registros';
   const id=estoque?'estHistBuscaGarantida':'obrixRegistrosBuscaGarantida';
   label.setAttribute('for',id);label.style.cssText='display:block;font-weight:800;margin-bottom:6px;';
   input=document.createElement('input');input.type='search';input.id=id;input.className=classe;
   input.autocomplete='off';
   input.placeholder=estoque?'Material, local, tipo ou data...':'Data, obra, tipo ou valor...';
   input.style.cssText='box-sizing:border-box;display:block;width:100%;min-height:44px;min-width:0;font-size:16px;padding:10px 12px;border:1px solid var(--ob-border,#cbd5df);border-radius:10px;background:var(--ob-surface-2,#f8fafc);color:var(--ob-text,#0f172a);';
   area.appendChild(label);area.appendChild(input);raiz.parentElement?.insertBefore(area,raiz);
 }
 // A PWA pode recuperar estilos antigos: tornar a busca existente realmente visível.
 input.style?.setProperty?.('display','block','important');
 input.style?.setProperty?.('visibility','visible','important');
 input.style?.setProperty?.('opacity','1','important');
 input.style?.setProperty?.('min-height','44px','important');
 input.style?.setProperty?.('width','100%','important');
 const seletor=estoque?'.item':'.obrix-registro-linha';
 const aplicar=()=>{
   if(!back.isConnected)return;
   const termo=textoBuscaGarantida(input.value),linhas=[...raiz.querySelectorAll(seletor)];
   let encontrados=0;
   for(const linha of linhas){
     const exibir=!termo||textoBuscaGarantida(linha.textContent).includes(termo);
     linha.classList.toggle('hidden',!exibir);
     if(exibir)encontrados++;
   }
   let contador=dialog.querySelector('.obrix-busca-garantida-contador');
   if(!contador){
     contador=document.createElement('div');contador.className='obrix-busca-garantida-contador';
     contador.style.cssText='font-size:12px;margin:2px 0 8px;color:var(--ob-muted,#64748b);';
     input.parentElement?.insertAdjacentElement('afterend',contador);
   }
   if(contador){
     const texto=linhas.length?encontrados+' de '+linhas.length+' registro(s)':'';
     if(contador.textContent!==texto)contador.textContent=texto;
   }
 };
 input.addEventListener('input',aplicar);
 new MutationObserver(aplicar).observe(raiz,{childList:true,subtree:true});
 aplicar();
}
function instalarGarantiaBusca(){
 const verificar=node=>{
   if(node?.nodeType!==1)return;
   if(node.matches?.('.modalBack,.estOp'))garantirBuscaNoHistorico(node);
   node.querySelectorAll?.('.modalBack,.estOp').forEach(garantirBuscaNoHistorico);
 };
 document.querySelectorAll('.modalBack,.estOp').forEach(garantirBuscaNoHistorico);
 new MutationObserver(muts=>{
   for(const m of muts)for(const node of m.addedNodes)verificar(node);
 }).observe(document.body,{childList:true,subtree:false});
}
if(document.body)instalarGarantiaBusca();
else document.addEventListener('DOMContentLoaded',instalarGarantiaBusca,{once:true});

const TIT=['obras','diário de obras','diario de obras','financeiro','equipe','funcionários','funcionarios','materiais / estoque','materiais/estoque','material estoque','materiais de estoque','estoque','orçamentos','orcamentos','orçamento','orcamento','relatórios','relatorios','documentos','notas','backup','backups','central offline','central clim','planos e assinaturas','planos de assinatura','ajuda e feedback','configurações','configuracoes','resumo geral','resumo da obra'];const n=s=>(s||'').replace(/\s+/g,' ').trim().toLowerCase(),vis=e=>!!e&&!e.classList.contains('hidden')&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden',modal=e=>!!e.closest('.modal,.modalBack,[role="dialog"],.estOp,[class*="modal"],[class*="dialog"]');
function neutro(b){
 if(!b||b.id==='obrixTheme'||b.id==='obxVoltarObras'||b.closest?.('#app>.bottom')||b.matches?.('#obras .obxFiltros button[data-filtro="andamento"]'))return;
 // Botões de confirmação/gravação não podem receber fundo neutro inline,
 // pois isso vence a regra laranja nos temas claro e escuro.
 if(b.matches?.('.salvar,.registrar,.btn.confirmar:not(.danger),[id$="Salvar" i],[id^="salvar" i],#fmSalvar,#diarioSalvar,#docSalvar,#notaSalvar,#orcSalvar,#emSalvar,#extraSalvar,#relGerar,#relEqGerar,#relDiarioGerar'))return;
// Na prévia, não neutralizar novamente as cinco ações do funcionário nem o botão Novo.
// Estilos inline !important causavam oscilação entre a cor aprovada e o cinza.
if(b.matches?.('#equipe #obpEquipe .obp-person-actions button,#equipe #obpEquipe .obp-registros-principal,#equipe #obpEquipe .obp-excluir-da-lista,#equipe #obpNovo,#inicio #obpHome .obp-shortcuts button'))return;
// Idempotent: avoid repeated inline writes that trigger DOM observers and reflows.
const st=b.style;
if(st.getPropertyValue('background')==='var(--ob-surface-2)'&&
   st.getPropertyPriority('background')==='important'&&
   st.getPropertyValue('color')==='var(--ob-text)'&&
   st.getPropertyValue('-webkit-text-fill-color')==='var(--ob-text)'&&
   st.getPropertyValue('border-color')==='var(--ob-border)'&&
   st.getPropertyValue('background-image')==='none')return;
b.style.setProperty('background','var(--ob-surface-2)','important');b.style.setProperty('background-color','var(--ob-surface-2)','important');b.style.setProperty('background-image','none','important');b.style.setProperty('color','var(--ob-text)','important');b.style.setProperty('-webkit-text-fill-color','var(--ob-text)','important');b.style.setProperty('border-color','var(--ob-border)','important');b.style.setProperty('box-shadow','none','important')}function titulo(root){const h=root?.querySelector(':scope>h1,:scope>h2,:scope>.hero h1,:scope>.hero h2,:scope>.sectionHead strong,:scope header h1,:scope header h2,:scope>.rgHead h1,:scope>.rgHead h2');const t=n(h?.textContent);return !!t&&TIT.some(x=>t===x||t.startsWith(x))}function telaAtual(){return [...document.querySelectorAll('#app main,#app section,#app .panel,#app .card')].filter(vis).find(titulo)||null}
function diario(){const main=document.getElementById('diarioMain');if(!main)return;main.querySelectorAll('.diarioAtualizar').forEach(b=>b.remove());main.querySelectorAll('.diarioPerigo,.diarioPerigo.excluir,button.danger,button.delete,button.apagar,button[data-acao="apagar"],button[data-action="delete"]').forEach(neutro);neutro(document.getElementById('diarioSalvar'));const velho=document.getElementById('diarioNovoOrcamento');if(velho)velho.remove();let b=document.getElementById('diarioNovoDiario');if(!b){const form=main.querySelector('.diarioForm');if(!form)return;b=document.createElement('button');b.id='diarioNovoDiario';b.type='button';b.className='btn card';b.onclick=()=>{try{form.reset?.();form.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){}};form.parentNode.insertBefore(b,form)}b.textContent='+ Novo diário'}
function botoesNeutros(){document.querySelectorAll('#app button,#app .btn,#app input[type="button"],#app input[type="submit"],#app input[type="reset"],#app [role="button"],.modalBack button,.modalBack .btn,.modal button,.modal .btn,[role="dialog"] button,[role="dialog"] .btn').forEach(b=>{if(b.classList.contains('obrixConfigPerigo'))return;neutro(b)})}
function especiais(){document.querySelectorAll('#app button,#app .btn,#app [role="button"],.modalBack button,.modalBack .btn,.modal button,.modal .btn,[role="dialog"] button,[role="dialog"] .btn').forEach(b=>{const t=n(b.textContent),area=n((b.closest('main,section,.panel,.modal,.modalBack,[role="dialog"]')?.textContent||'').slice(0,500));b.classList.remove('obrixDocNovo','obrixDocExcluir','obrixFinReceita','obrixFinDespesa');if((t==='+ documentos'||t==='+ documento'||t==='+ novo documento'||t==='novo documento')&&area.includes('document'))b.classList.add('obrixDocNovo');if((t==='excluir'||t==='apagar')&&area.includes('document'))b.classList.add('obrixDocExcluir');if((t.includes('receita')||t==='+ receita')&&area.includes('finance'))b.classList.add('obrixFinReceita');if((t.includes('despesa')||t==='+ despesa')&&area.includes('finance'))b.classList.add('obrixFinDespesa')})}
function fecharPrincipais(){document.querySelectorAll('#app main,#app section,#app .panel,#app .card').forEach(root=>{if(!titulo(root))return;const h=root.querySelector(':scope>h1,:scope>h2,:scope>.hero h1,:scope>.hero h2,:scope>.sectionHead strong,:scope header h1,:scope header h2,:scope>.rgHead h1,:scope>.rgHead h2');if(!h)return;const cab=h.closest('.hero,.sectionHead,header,.rgHead')||h.parentElement;if(!cab)return;cab.querySelectorAll('button,.btn,[role="button"]').forEach(b=>{if(n(b.textContent)==='fechar'&&!modal(b))b.remove()})})}
function limpar(){document.querySelectorAll('#app main,#app section,#app .panel,#app .card').forEach(root=>{if(!titulo(root))return;root.querySelectorAll(':scope>.hero p,:scope>.hero small,:scope>.hero .subtitle,:scope>.hero .subtitulo,:scope>p.subtitle,:scope>p.subtitulo,:scope>.sectionHead p').forEach(e=>e.remove())});fecharPrincipais();botoesNeutros();especiais()}
function seta(){const top=document.querySelector('#app>.top');if(!top)return;let b=document.getElementById('obrixHeaderVoltar');if(!b){b=document.createElement('button');b.id='obrixHeaderVoltar';b.type='button';b.className='btn obrixHeaderVoltar hidden';b.setAttribute('aria-label','Voltar');b.setAttribute('title','Voltar');top.insertBefore(b,top.firstElementChild)}if(!b.querySelector('svg[data-obrix-back-icon]'))b.innerHTML='<svg data-obrix-back-icon="1" viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M19 12H5m7 7-7-7 7-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';const fin=document.getElementById('financeiroMain'),isAndroidFinance=/Android/i.test(navigator.userAgent||'')&&!!fin&&vis(fin);document.documentElement.classList.toggle('obrixFinanceAndroidVisible',isAndroidFinance);b.classList.toggle('obrixFinanceStandardBack',isAndroidFinance);
const iconNow=b.querySelector('svg[data-obrix-back-icon]');
if(isAndroidFinance){
 const standardFinanceIcon='<svg data-obrix-back-icon="1" data-obrix-arrow="android-finance" viewBox="0 0 32 32" width="29" height="29" fill="none" aria-hidden="true"><path d="M19 7 10 16l9 9M10 16h13" stroke="currentColor" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 if(!iconNow||iconNow.getAttribute('data-obrix-arrow')!=='android-finance')b.innerHTML=standardFinanceIcon;
 const active=b.querySelector('svg[data-obrix-back-icon]');
 if(active){active.style.setProperty('width','29px','important');active.style.setProperty('height','29px','important');active.style.setProperty('display','block','important')}
}else if(iconNow?.getAttribute('data-obrix-arrow')==='android-finance'){
 b.innerHTML='<svg data-obrix-back-icon="1" viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true"><path d="M19 12H5m7 7-7-7 7-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}const inicio=document.getElementById('inicio'),menu=document.getElementById('menuMain')||document.getElementById('menu'),resumo=document.getElementById('resumoGeralMain'),noInicio=!!inicio&&vis(inicio),noMenu=!!menu&&vis(menu),noResumo=!!resumo&&vis(resumo),p=telaAtual();const paginaEstavel=['obras','equipe','financeiroMain','estoqueMain','resumoGeralMain','configMain','backupMain','diarioMain','notasMain','orcamentosMain','relatoriosMain','assinaturaMain','documentosMain'].some(id=>vis(document.getElementById(id)));const equipeVisivel=vis(document.getElementById('equipe'));
const equipeViaRodape=equipeVisivel&&document.documentElement.dataset.obrixEquipeOrigem!=='menu';
const financeiroVisivel=vis(document.getElementById('financeiroMain'));
const financeiroViaRodape=financeiroVisivel&&document.documentElement.dataset.obrixFinanceiroOrigem==='rodape';
b.classList.toggle('hidden',noInicio||noMenu||equipeViaRodape||financeiroViaRodape||(!p&&!noResumo&&!paginaEstavel));b.onclick=()=>{if(noResumo){const rs=window.OBRIX_RESUMO_GERAL?.status?.()||{};if(rs.view==='obra'){window.OBRIX_RESUMO_GERAL?.open?.();return}resumo.classList.add('hidden');if(window.OBRIX_MENU?.open){window.OBRIX_MENU.open();return}}if(window.OBRIX_MENU?.open){window.OBRIX_MENU.open();return}if(typeof window.abrir==='function')window.abrir('inicio')}}
let applying=false,scheduled=false,lastSignature='';
function signature(){const t=document.documentElement.dataset.theme||'';const visible=[...document.querySelectorAll('#app>main:not(.hidden),#app>section:not(.hidden),#app .modalBack:not(.hidden),#app .modal:not(.hidden),#app [role="dialog"]:not(.hidden)')].map(x=>x.id||x.className||x.tagName).join('|');return t+'::'+visible}
function aplicar(force=false){
 if(applying)return;
 const sig=signature();
 if(!force&&sig===lastSignature)return;
 applying=true;
 try{
   // Navegar não pode reformatar todos os cartões, buttons e cabeçalhos:
   // a verificação completa acontece só ao montar módulo ou trocar o tema.
   if(force){
     diario();limpar();
     window.OBRIX_EQUIPE_VISUAL_FINAL?.refresh?.();
     if(!document.getElementById('obrixTheme'))window.OBRIX_THEME?.refresh?.();
     window.OBRIX_ACTIONS_CLEAN_V1?.apply?.();
   }
   seta();
   lastSignature=signature();
 }finally{applying=false}
}
function agenda(force=false){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;aplicar(force)})}
// Capturar a origem antes dos interceptores de Menu/rodapé, que podem
// interromper a propagação do clique e impedir o controle tradicional.
window.addEventListener('click',event=>{
  const target=event.target;
  const viaRodape=target?.closest?.('#app>.bottom #bEquipe,#app>.bottom button:nth-child(3)');
  const viaMenu=target?.closest?.('#menuMain [data-go="equipe"]');
  const financeiroRodape=target?.closest?.('#app>.bottom>button:nth-child(2)');
  const financeiroMenu=target?.closest?.('#menuMain [data-go="financeiro"]');
  if(financeiroRodape||financeiroMenu){
    const fOrigem=financeiroRodape?'rodape':'menu';
    if(document.documentElement.dataset.obrixFinanceiroOrigem!==fOrigem){
      document.documentElement.dataset.obrixFinanceiroOrigem=fOrigem;
      requestAnimationFrame(()=>window.OBRIX_VISUAL_PADRAO_FINAL?.refresh?.());
    }
  }
  if(!viaRodape&&!viaMenu)return;
  const origem=viaRodape?'rodape':'menu';
  if(document.documentElement.dataset.obrixEquipeOrigem!==origem){
    document.documentElement.dataset.obrixEquipeOrigem=origem;
    requestAnimationFrame(()=>window.OBRIX_VISUAL_PADRAO_FINAL?.refresh?.());
  }
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>aplicar(true),{once:true});else aplicar(true);
// Observadores limitados aos containers de navegacao: evita percorrer cada
// alteração de texto, cartão ou formulário durante uma sessão longa no desktop.
const appRaiz=document.getElementById('app')||document.body;
const observados=new WeakSet();
const paginasObserver=new MutationObserver(muts=>{
  if(!document.hidden&&muts.some(m=>m.attributeName==='class'||m.attributeName==='hidden'))
    agenda(false);
});
function conectarPaginas(){
  const pages=appRaiz.querySelectorAll(':scope > main,:scope > section,#financeiroMain,#resumoGeralMain,[id$="Main"]');
  for(const page of pages){
    if(observados.has(page))continue;
    observados.add(page);
    paginasObserver.observe(page,{attributes:true,attributeFilter:['class','hidden']});
  }
}
const estruturaObserver=new MutationObserver(muts=>{
  if(!muts.some(m=>m.addedNodes.length||m.removedNodes.length))return;
  conectarPaginas();
  if(!document.hidden)agenda(false);
});
estruturaObserver.observe(appRaiz,{childList:true,subtree:false});
conectarPaginas();
new MutationObserver(()=>agenda(true)).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});['obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:feature-pronto'].forEach(x=>window.addEventListener(x,()=>{conectarPaginas();agenda(true)}));window.addEventListener('pageshow',()=>agenda(true));window.OBRIX_VISUAL_PADRAO_FINAL={refresh:()=>agenda(true)};})();