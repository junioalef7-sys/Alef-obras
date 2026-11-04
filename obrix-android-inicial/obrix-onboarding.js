(()=>{
'use strict';
if(window.__OBRIX_ONBOARDING)return;window.__OBRIX_ONBOARDING=true;

const VERSION='v1';
const $=id=>document.getElementById(id);
let overlay=null,index=0,currentUser=null,opening=false,menuObserver=null;

const slides=[
  {
    icon:'🏗️',
    title:'Bem-vindo ao OBRIX',
    subtitle:'Tudo para organizar e acompanhar suas obras em um só lugar.',
    items:[
      ['Visão completa','Obras, equipe, financeiro, materiais e documentos integrados.'],
      ['Controle no celular e computador','Acompanhe sua operação de onde estiver.'],
      ['Dados organizados por empresa','Cada conta trabalha com seus próprios registros.'],
      ['Modo claro e escuro','Use o visual que preferir em cada aparelho.']
    ]
  },
  {
    icon:'🏢',
    title:'Dashboard e Obras',
    subtitle:'Comece cadastrando suas obras e acompanhe os principais números.',
    items:[
      ['Dashboard','Veja total contratado, valores a receber e atalhos para as áreas principais.'],
      ['Cadastro de obras','Organize projetos, contratos, situação e informações da obra.'],
      ['Resumo financeiro','Acompanhe valores e movimentações ligados a cada obra.'],
      ['Busca e acompanhamento','Localize obras e consulte rapidamente seus dados.'],
      ['Etapas e checklist','Vincule etapas aos registros financeiros, diários e fotos quando necessário.']
    ]
  },
  {
    icon:'📋',
    title:'Diário de Obras',
    subtitle:'Registre o que aconteceu em cada dia da obra.',
    items:[
      ['Rotina da obra','Informe data, clima, temperatura, serviços executados e ocorrências.'],
      ['Materiais e equipamentos','Registre o que foi utilizado durante o dia.'],
      ['Equipe do dia','Selecione os funcionários que trabalharam no registro.'],
      ['Fotos e observações','Documente o andamento com informações complementares.'],
      ['Rascunho, finalização e PDF','Edite o histórico e gere o diário para visualização ou impressão.'],
      ['Uso offline','Salve registros no aparelho e sincronize quando a internet voltar.']
    ]
  },
  {
    icon:'👷',
    title:'Funcionários e Equipe',
    subtitle:'Controle pessoas, jornadas e pagamentos da equipe.',
    items:[
      ['Cadastro completo','Cargo, forma de pagamento, diária, salário, obra vinculada e situação do funcionário.'],
      ['Diárias e meias diárias','Registre os dias trabalhados por obra.'],
      ['Faltas, vales, bônus e extras','Mantenha todos os ajustes de cada funcionário organizados.'],
      ['Pagamentos','Calcule diárias + bônus/extras − vales e registre pagamentos.'],
      ['Pagamentos em lote e histórico','Controle quitações, histórico e estornos quando necessário.'],
      ['Integração financeira','Pagamentos da equipe são refletidos no Financeiro.']
    ]
  },
  {
    icon:'💰',
    title:'Financeiro',
    subtitle:'Saiba quanto entrou, quanto saiu e qual é o resultado das obras.',
    items:[
      ['Receitas e despesas','Lance entradas e gastos manualmente quando necessário.'],
      ['Categorias completas','Materiais, mão de obra, terceiros, equipamentos, locação, transporte, combustível e outros.'],
      ['Resultado por obra','Compare contrato atualizado, recebido, despesas e resultado.'],
      ['Etapas / checklist','Distribua valores entre etapas da obra para acompanhar onde o dinheiro foi aplicado.'],
      ['Busca, filtros, resumos e gráficos','Encontre lançamentos e acompanhe os números com mais clareza.'],
      ['Integrações automáticas','Equipe e estoque podem alimentar o Financeiro sem duplicar lançamentos.']
    ]
  },
  {
    icon:'📦',
    title:'Materiais e Estoque',
    subtitle:'Controle materiais, compras, saldos e movimentações.',
    items:[
      ['Cadastro de materiais','Unidade, categoria, estoque mínimo e custo médio.'],
      ['Entradas e saídas','Registre o que chegou e o que foi utilizado.'],
      ['Transferências e ajustes','Mova materiais entre locais e faça inventários.'],
      ['Reposição e compras','Monte necessidades de compra, receba e pague pedidos.'],
      ['Alertas de estoque mínimo','Saiba quando um material precisa ser reposto.'],
      ['Histórico e cancelamentos','Consulte movimentações e faça estornos seguros quando aplicável.']
    ]
  },
  {
    icon:'🧾',
    title:'Orçamentos',
    subtitle:'Crie propostas profissionais e acompanhe sua aprovação.',
    items:[
      ['Cliente e obra','Cadastre contato, endereço e dados da proposta.'],
      ['Serviços e itens','Informe descrição, quantidade, unidade, valor unitário e observações.'],
      ['Condições comerciais','Defina materiais, pagamento, prazo, previsão de início e validade.'],
      ['Descontos e acréscimos','O OBRIX calcula subtotal e valor final.'],
      ['Status da proposta','Rascunho, enviado, aprovado, recusado ou cancelado.'],
      ['Visualização e impressão','Prepare o orçamento para apresentar ao cliente.']
    ]
  },
  {
    icon:'📊',
    title:'Relatórios',
    subtitle:'Transforme os registros do dia a dia em informações para conferência.',
    items:[
      ['Relatório financeiro','Filtre por obra e período e veja contrato, recebido, despesas, resultado e margem.'],
      ['Relatório diário','Organize os registros do Diário de Obras para apresentação.'],
      ['Relatórios por obra','Acompanhe informações financeiras e operacionais separadamente.'],
      ['Imprimir / Salvar PDF','Gere documentos para conferência, arquivo ou envio.']
    ]
  },
  {
    icon:'📷',
    title:'Relatório Fotográfico',
    subtitle:'Documente visualmente a evolução das obras.',
    items:[
      ['Fotos por obra','Mantenha cada imagem vinculada à obra correta.'],
      ['Câmera ou galeria','Tire a foto na hora ou selecione Fotos, Google Fotos ou Arquivos.'],
      ['Etapa, data e descrição','Organize as imagens por checklist/etapa e contexto.'],
      ['Miniaturas e histórico','Navegue pelas fotos sem carregar tudo de uma vez.'],
      ['Abrir e excluir','Consulte a imagem original e gerencie o acervo.'],
      ['Relatórios profissionais','Use as fotos nos relatórios e registros da obra.']
    ]
  },
  {
    icon:'📁',
    title:'Documentos e Notas',
    subtitle:'Centralize arquivos e informações importantes das obras.',
    items:[
      ['Documentos','Guarde projetos, contratos, medições, notas fiscais, comprovantes, orçamentos, ART/RRT, alvarás, laudos, plantas e outros.'],
      ['Filtros e pesquisa','Encontre arquivos por obra, categoria, título ou descrição.'],
      ['Abrir e imprimir','Visualize documentos e prepare para impressão ou salvamento.'],
      ['Notas organizadas','Crie anotações de obra, compras, equipe, financeiro e lembretes.'],
      ['Prioridade e fixação','Marque notas importantes, concluídas e mantenha itens no topo.'],
      ['Compartilhar e PDF','Envie notas ou gere uma versão para impressão.']
    ]
  },
  {
    icon:'⇄',
    title:'Offline e Backup',
    subtitle:'Continue trabalhando com mais segurança mesmo quando a conexão falhar.',
    items:[
      ['Central Offline','Veja registros pendentes e o estado de sincronização do aparelho.'],
      ['Trabalho sem internet','Áreas compatíveis guardam alterações localmente para sincronizar depois.'],
      ['Conflitos e diagnóstico','A Central ajuda a identificar pendências antes da sincronização.'],
      ['Ferramentas de recuperação','Recursos avançados auxiliam diagnóstico e restauração segura quando necessário.'],
      ['Backup completo','Exporte seus dados e confira contagens e totais antes de salvar.'],
      ['Validação de backup','Verifique um arquivo antes de qualquer tentativa de restauração.']
    ]
  },
  {
    icon:'🔔',
    title:'Planos, Pagamentos e Notificações',
    subtitle:'Gerencie sua assinatura e receba os avisos importantes do OBRIX.',
    items:[
      ['7 dias de teste grátis','Conheça o aplicativo antes da cobrança.'],
      ['Plano mensal ou anual','Escolha a opção que combina com sua operação; o anual economiza 17%.'],
      ['Pix, boleto e cartão','Pague usando os meios disponíveis na área de assinatura.'],
      ['Pagamento seguro','Cartão e boleto utilizam a página segura da Efí; boleto só libera após confirmação do pagamento.'],
      ['Central de notificações','Receba respostas do suporte, confirmação de pagamento, aviso de teste e vencimento.'],
      ['Avisos da OBRIX','Comunicados importantes também aparecem no sino de notificações.']
    ]
  },
  {
    icon:'💬',
    title:'Ajuda, Feedback e Configurações',
    subtitle:'O OBRIX também tem canais para suporte e personalização da sua conta.',
    items:[
      ['Dúvidas','Abra um atendimento e acompanhe as respostas dentro do aplicativo.'],
      ['Sugestões e críticas','Envie ideias e pontos que podem melhorar o OBRIX.'],
      ['Avaliações','Dê sua nota de 1 a 5 estrelas e deixe seu comentário.'],
      ['Histórico de atendimento','Continue a conversa no mesmo chamado quando precisar.'],
      ['Conta e segurança','Altere e-mail ou senha e gerencie suas preferências.'],
      ['Aparência','Escolha entre modo claro e modo escuro.']
    ]
  }
];

function appReady(){const a=$('app'),l=$('login');return !!(a&&!a.classList.contains('hidden')&&(!l||l.classList.contains('hidden')))}
function storageKey(uid){return `obrix_onboarding_complete_${VERSION}_${uid}`}
function done(uid){try{return localStorage.getItem(storageKey(uid))==='1'}catch{return false}}
function markDone(){if(!currentUser?.id)return;try{localStorage.setItem(storageKey(currentUser.id),'1')}catch{}}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function ensure(){
  if(overlay)return overlay;
  overlay=document.createElement('div');
  overlay.id='obrixOnboarding';overlay.className='obxOnboarding hidden';
  overlay.innerHTML=`
    <section class="obxOnboardCard" role="dialog" aria-modal="true" aria-label="Conheça o OBRIX">
      <header class="obxOnboardTop">
        <div class="obxOnboardBrand"><span>OBRI</span><b>X</b><small>GESTÃO DE OBRAS</small></div>
        <button type="button" id="obxOnboardSkip">Pular</button>
      </header>
      <div class="obxOnboardProgress"><div id="obxOnboardProgressBar"></div></div>
      <div id="obxOnboardBody"></div>
      <footer class="obxOnboardFooter">
        <div class="obxOnboardStep" id="obxOnboardStep"></div>
        <div class="obxOnboardButtons">
          <button type="button" id="obxOnboardPrev" class="secondary">Anterior</button>
          <button type="button" id="obxOnboardNext">Próximo</button>
        </div>
      </footer>
    </section>`;
  document.body.appendChild(overlay);
  $('obxOnboardSkip').onclick=()=>close(true);
  $('obxOnboardPrev').onclick=prev;
  $('obxOnboardNext').onclick=next;
  overlay.addEventListener('keydown',e=>{if(e.key==='Escape')close(false);if(e.key==='ArrowRight')next();if(e.key==='ArrowLeft')prev()});
  const style=document.createElement('style');style.id='obrixOnboardingStyle';style.textContent=`
    .obxOnboarding{position:fixed;inset:0;z-index:15000;background:rgba(2,6,23,.72);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(5px)}
    .obxOnboardCard{width:min(860px,100%);max-height:min(94vh,920px);background:#f8fafc;color:#0f172a;border-radius:24px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.38);display:flex;flex-direction:column}
    .obxOnboardTop{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px 14px;background:#0f172a;color:#fff}.obxOnboardBrand{display:flex;align-items:baseline;font-size:24px;font-weight:950;letter-spacing:-1.5px}.obxOnboardBrand>b{color:#ff5a00}.obxOnboardBrand small{font-size:8px;letter-spacing:2px;margin-left:12px;color:#cbd5e1}.obxOnboardTop>button{border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.09);color:#fff;border-radius:10px;padding:9px 13px;font-weight:850}
    .obxOnboardProgress{height:5px;background:#e2e8f0}.obxOnboardProgress>div{height:100%;background:#ff5a00;transition:width .24s ease}
    #obxOnboardBody{padding:25px 28px 20px;overflow:auto}.obxSlideHead{display:grid;grid-template-columns:70px minmax(0,1fr);gap:16px;align-items:center;margin-bottom:18px}.obxSlideIcon{width:70px;height:70px;border-radius:20px;background:#eaf2ff;display:grid;place-items:center;font-size:35px}.obxSlideHead h1{font-size:28px;line-height:1.1;margin:0 0 7px}.obxSlideHead p{margin:0;color:#64748b;font-size:15px;line-height:1.45}
    .obxFeatureGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.obxFeature{background:#fff;border:1px solid #dbe2ea;border-radius:14px;padding:13px 14px;min-height:92px}.obxFeature b{display:block;margin-bottom:5px;font-size:14px}.obxFeature span{display:block;color:#475569;font-size:13px;line-height:1.4}
    .obxOnboardFooter{display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #e2e8f0;padding:14px 20px;background:#fff}.obxOnboardStep{font-size:12px;color:#64748b;font-weight:800}.obxOnboardButtons{display:flex;gap:8px}.obxOnboardButtons button{border:0;border-radius:11px;padding:11px 16px;background:#0f172a;color:#fff;font-weight:900;min-width:100px}.obxOnboardButtons button.secondary{background:#e2e8f0;color:#334155}.obxOnboardButtons button:disabled{opacity:.4}.obxOnboardButtons button.finish{background:#ff5a00;color:#fff}
    html[data-theme="dark"] .obxOnboardCard,html[data-theme="dark"] #obxOnboardBody{background:#07111f;color:#f8fafc}html[data-theme="dark"] .obxSlideIcon{background:#172554}html[data-theme="dark"] .obxFeature{background:#0f172a;border-color:#334155}html[data-theme="dark"] .obxFeature span,html[data-theme="dark"] .obxSlideHead p,html[data-theme="dark"] .obxOnboardStep{color:#cbd5e1}html[data-theme="dark"] .obxOnboardFooter{background:#0b1524;border-color:#334155}html[data-theme="dark"] .obxOnboardButtons button.secondary{background:#26384d;color:#f8fafc}
    .obxReplay{margin-top:8px!important;border-top:1px solid #e2e8f0!important}.obxReplay b,.obxReplay small{display:block}.obxReplay small{margin-top:3px}
    @media(max-width:680px){.obxOnboarding{padding:0;align-items:stretch}.obxOnboardCard{max-height:none;height:100%;border-radius:0}.obxOnboardTop{padding:max(15px,env(safe-area-inset-top)) 15px 12px}.obxOnboardBrand small{display:none}#obxOnboardBody{padding:20px 15px 15px}.obxSlideHead{grid-template-columns:54px minmax(0,1fr);gap:12px}.obxSlideIcon{width:54px;height:54px;border-radius:16px;font-size:27px}.obxSlideHead h1{font-size:23px}.obxFeatureGrid{grid-template-columns:1fr}.obxFeature{min-height:0}.obxOnboardFooter{padding:12px 14px max(12px,env(safe-area-inset-bottom));align-items:flex-end}.obxOnboardStep{max-width:82px}.obxOnboardButtons button{min-width:auto;padding:11px 13px}}
  `;document.head.appendChild(style);
  return overlay;
}

function render(){
  ensure();const s=slides[index];if(!s)return;
  const body=$('obxOnboardBody');body.innerHTML=`<div class="obxSlideHead"><div class="obxSlideIcon" aria-hidden="true">${s.icon}</div><div><h1>${esc(s.title)}</h1><p>${esc(s.subtitle)}</p></div></div><div class="obxFeatureGrid">${s.items.map(([t,d])=>`<article class="obxFeature"><b>${esc(t)}</b><span>${esc(d)}</span></article>`).join('')}</div>`;
  $('obxOnboardStep').textContent=`Etapa ${index+1} de ${slides.length}`;
  $('obxOnboardProgressBar').style.width=`${((index+1)/slides.length)*100}%`;
  const prevBtn=$('obxOnboardPrev'),nextBtn=$('obxOnboardNext');prevBtn.disabled=index===0;
  const last=index===slides.length-1;nextBtn.textContent=last?'Criar minha primeira obra':'Próximo';nextBtn.classList.toggle('finish',last);
  body.scrollTop=0;
}

async function user(){
  if(currentUser?.id)return currentUser;
  try{currentUser=await window.OBRIX_BACKEND?.currentUser?.();return currentUser}catch{return null}
}

async function open(force=false){
  if(opening)return;opening=true;
  try{
    if(!appReady()&&!force)return false;
    const u=await user();if(!u?.id)return false;
    if(!force&&done(u.id))return false;
    ensure();index=0;render();overlay.classList.remove('hidden');document.body.style.overflow='hidden';overlay.tabIndex=-1;overlay.focus({preventScroll:true});return true;
  }finally{opening=false}
}

function close(complete=false){
  if(complete)markDone();overlay?.classList.add('hidden');document.body.style.overflow='';
}
function prev(){if(index<=0)return;index--;render()}
function next(){
  if(index<slides.length-1){index++;render();return}
  markDone();close(false);goCreateObra();
}
function goCreateObra(){
  try{window.abrir?.('obras')}catch{}
  setTimeout(()=>{const b=document.querySelector('#obras .sectionHead .btn');if(b&&!b.disabled)b.click()},350);
}

function injectMenu(){
  const m=$('menuMain');if(!m)return false;
  if(m.querySelector('[data-onboarding-replay]'))return true;
  const account=m.querySelector('.opmGrid .account')||m.querySelector('.opmGrid article:last-child');if(!account)return false;
  const b=document.createElement('button');b.type='button';b.dataset.onboardingReplay='1';b.className='obxReplay';b.innerHTML='<b>Conheça o OBRIX</b><small>Veja tudo que o aplicativo oferece</small>';b.onclick=()=>open(true);account.appendChild(b);return true;
}
function watchMenu(){
  if(injectMenu())return;
  if(menuObserver)return;menuObserver=new MutationObserver(()=>injectMenu());menuObserver.observe(document.body,{childList:true,subtree:true});
}
async function auto(){if(!appReady())return;watchMenu();await open(false)}

const app=$('app');if(app)new MutationObserver(()=>{if(appReady())setTimeout(auto,500)}).observe(app,{attributes:true,attributeFilter:['class']});
window.addEventListener('pageshow',()=>setTimeout(auto,700));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>{watchMenu();if(appReady())open(false)},700)});
setTimeout(()=>{watchMenu();auto()},900);setTimeout(()=>{watchMenu();auto()},2200);

window.OBRIX_ONBOARDING={open,close,next,prev,status:()=>({version:VERSION,index,total:slides.length,user:currentUser?.id||null,complete:currentUser?.id?done(currentUser.id):false})};
})();
