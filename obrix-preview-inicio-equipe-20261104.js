/* OBRIX preview 04/11/2026 — Início minimalista e Equipe Premium. Somente interface. */
(function(){
'use strict';
if(window.__OBRIX_PREVIEW_INICIO_EQUIPE_20261104)return;
window.__OBRIX_PREVIEW_INICIO_EQUIPE_20261104=true;
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dinheiro=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const lista=(k)=>Array.isArray(window[k])?window[k]:[];
const obras=()=>lista('obras'),funcs=()=>lista('funcionarios');
const acharObra=id=>obras().find(o=>String(o.id)===String(id));
const acharFunc=id=>funcs().find(f=>String(f.id)===String(id));
const nomeObra=id=>acharObra(id)?.nome||'Sem obra vinculada';
const nomeFunc=id=>acharFunc(id)?.nome||'Funcionário';
const dataHora=v=>{if(!v)return 0;let t=Date.parse(v);if(!Number.isFinite(t)&&/^\d{4}-\d{2}-\d{2}$/.test(String(v)))t=Date.parse(v+'T12:00:00');return Number.isFinite(t)?t:0};
const formatarData=v=>{const t=dataHora(v);return t?new Date(t).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Sem data'};
const statusObra=o=>String(o.status||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s-]+/g,'_');
const emAndamento=o=>['andamento','em_andamento','em_execucao'].includes(statusObra(o));
const progresso=o=>{const p=window.OBRIX_PROGRESS_CORE?.status?.().medias?.[String(o.id)];const v=Number(p??o.progresso??o.percentual??o.percentual_conclusao);return Number.isFinite(v)?Math.max(0,Math.min(100,Math.round(v))):null};
let eventosRemotos=[],eventosAtualizados=0,buscandoEventos=false,selecionado='',filtro='todos',buscaEquipe='',aba='resumo',modalAberto=false,agendado=false;
function primeiroNome(){
  let raw='';
  try{raw=(typeof profile!=='undefined'&&profile?.nome)||''}catch(_){}
  if(!raw)raw=$('usuario')?.textContent||'';
  if(!raw)try{raw=JSON.parse(localStorage.getItem('obrix_offline_identity_v1')||'null')?.nome||''}catch(_){}
  if(!raw)try{raw=JSON.parse(localStorage.getItem('obrix_offline_base_v3')||'null')?.profile?.nome||''}catch(_){}
  const nome=String(raw||'').trim().split(/\s+/)[0];
  return nome&& !nome.includes('@')?nome:'';
}
function atividades(){
  const a=[];
  const push=(key,txt,date,icon)=>{const t=dataHora(date);if(t)a.push({key,txt,date,t,icon})};
  obras().forEach(o=>push('obra:'+o.id,'Obra atualizada: '+(o.nome||'Obra'),o.atualizado_em||o.criado_em,'▤'));
  lista('diarias').forEach(d=>push('diaria:'+d.id,'Diária registrada: '+nomeFunc(d.funcionario_id)+' · '+nomeObra(d.obra_id),d.criado_em||d.created_at||d.data,'◷'));
  eventosRemotos.forEach(e=>push(e.key,e.txt,e.date,e.icon));
  const uniq=new Map();a.sort((x,y)=>y.t-x.t).forEach(x=>{if(!uniq.has(x.key))uniq.set(x.key,x)});
  return [...uniq.values()].slice(0,80);
}
function atividadeHTML(e){
  const raw=String(e.txt||'Atualização'),colon=raw.indexOf(': '),dot=raw.indexOf(' · ');
  const split=colon>0&&colon<50?colon:dot>0&&dot<50?dot:-1;
  const title=split>0?raw.slice(0,split):raw;
  const detail=split>0?raw.slice(split+(split===colon?2:3)):'';
  return '<article class="obp-activity"><span class="obp-activity-ico" aria-hidden="true">'+esc(e.icon)+'</span><div class="obp-activity-body"><strong class="obp-activity-name">'+esc(title)+'</strong>'+(detail?'<span class="obp-activity-detail">'+esc(detail)+'</span>':'')+'<time>'+esc(formatarData(e.date))+'</time></div></article>';
}
function renderInicio(){
  const root=$('inicio');if(!root)return;
  if(!$('obpHome')){
    root.innerHTML='<div id="obpHome"><div class="obp-greeting"><h1 id="obpOla">Olá</h1><span class="obp-greeting-mark"></span></div><div class="obp-shortcuts"><button type="button" data-short="nova"><span>＋</span>Nova obra</button><button type="button" data-short="equipe"><span>♙</span>Equipe</button><button type="button" data-short="checklist"><span>☑</span>Checklist</button><button type="button" data-short="foto"><span>▧</span>Foto</button></div><div class="obp-heading"><h2>Obras</h2><button type="button" data-home-all="obras">Ver todas <span>›</span></button></div><div id="obpObras"></div><div class="obp-heading"><h2>Últimas atualizações</h2><button type="button" data-home-all="atividades">Ver todas <span>›</span></button></div><div id="obpAtividades"></div></div>';
    if(root.dataset.obpClickBound!=='1'){root.addEventListener('click',cliqueInicio);root.dataset.obpClickBound='1'}
  }
  $('obpOla').textContent='Olá'+(primeiroNome()?', '+primeiroNome():'');
  const recentes=obras().filter(emAndamento).slice().sort((a,b)=>dataHora(b.atualizado_em||b.criado_em)-dataHora(a.atualizado_em||a.criado_em)).slice(0,3);
  $('obpObras').innerHTML=recentes.length?recentes.map(o=>{const p=progresso(o);return '<button type="button" class="obp-work" data-home-obra="'+esc(o.id)+'"><span class="obp-work-icon">▥</span><span class="obp-work-main"><strong>'+esc(o.nome||'Obra')+'</strong><span class="obp-progress"><i style="width:'+(p??0)+'%"></i></span></span><span class="obp-work-pct">'+(p===null?'—':p+'%')+'</span><span class="obp-work-arrow">›</span></button>'}).join(''):'<div class="obp-empty">Nenhuma obra em andamento.</div>';
  const at=atividades().slice(0,4);
  $('obpAtividades').innerHTML=at.length?at.map(atividadeHTML).join(''):'<div class="obp-empty">As atualizações das suas obras aparecerão aqui.</div>';
}
function abrirObras(id){
  if(typeof window.abrir==='function')window.abrir('obras');if(id)window.OBRIX_POS_LOGIN_LOADER?.loadGroup?.('obras').catch?.(()=>{});
  if(!id){setTimeout(()=>$('obxVoltarObras')?.click(),200);return}
  let tentativas=0;
  const ir=()=>{
    const voltar=$('obxVoltarObras');if(voltar)voltar.click();
    const btn=[...document.querySelectorAll('#listaObras [data-abrir]')].find(b=>String(b.dataset.abrir)===String(id));
    if(btn){btn.click();return}
    if(tentativas++<35)setTimeout(ir,150);
  };
  setTimeout(ir,110);
}
async function acaoRapida(tipo){
  if(tipo==='equipe'){window.abrir?.('equipe');return}
  if(tipo==='nova'){abrirObras();try{await window.OBRIX_POS_LOGIN_LOADER?.loadGroup?.('obras')}catch(_){}setTimeout(()=>window.OBRIX_OBRAS?.nova?.(),150);return}
  if(tipo==='checklist'||tipo==='foto')abrirObras();
}
function cliqueInicio(e){
  const obra=e.target.closest('[data-home-obra]');
  if(obra){abrirObras(obra.dataset.homeObra);return}
  const todas=e.target.closest('[data-home-all]');
  if(todas){todas.dataset.homeAll==='obras'?abrirObras():abrirAtualizacoes();return}
  const atalho=e.target.closest('[data-short]');
  if(atalho)acaoRapida(atalho.dataset.short);
}
function abrirAtualizacoes(){
  document.querySelector('.obp-activities-modal')?.remove();
  const a=atividades(),back=document.createElement('div');back.className='modalBack obp-activities-modal';
  back.innerHTML='<div class="modal obp-modal"><div class="obp-modal-head"><h2>Últimas atualizações</h2><button type="button" aria-label="Fechar" data-close>×</button></div><div class="obp-modal-body">'+(a.length?a.map(atividadeHTML).join(''):'<p>Não há atualizações disponíveis.</p>')+'</div></div>';
  document.body.appendChild(back);back.querySelector('[data-close]').onclick=()=>back.remove();
  back.addEventListener('click',e=>{if(e.target===back)back.remove()});
}
async function buscarEventos(){
  if(buscandoEventos||!navigator.onLine||Date.now()-eventosAtualizados<60000||!$('app')||$('app').classList.contains('hidden'))return;
  buscandoEventos=true;eventosAtualizados=Date.now();
  try{
    const sb=await window.OBRIX_BACKEND?.init?.();const p=await window.OBRIX_BACKEND?.profile?.();if(!sb||!p?.empresa_id)return;
    const fontes=[['relatorio_fotos','Foto adicionada','▧','id,obra_id,criado_em','criado_em'],['diarios_obra','Diário de obra atualizado','▤','id,obra_id,data','data'],['checklist_itens','Checklist atualizado','☑','id,obra_id,atualizado_em','atualizado_em']];
    const rows=await Promise.all(fontes.map(async ([t,titulo,icon,campos,ordem])=>{
      try{const r=await sb.from(t).select(campos).eq('empresa_id',p.empresa_id).order(ordem,{ascending:false}).limit(20);if(r.error)return[];return (r.data||[]).map(x=>({key:t+':'+x.id,txt:titulo+' · '+nomeObra(x.obra_id),date:x.atualizado_em||x.criado_em||x.created_at||x.data,icon}))}catch(_){return[]}
    }));
    eventosRemotos=rows.flat();renderInicio();
  }catch(_){}finally{buscandoEventos=false}
}
function arrEquipe(tipo,id){return lista(tipo).filter(x=>String(x.funcionario_id)===String(id))}
function resumoEquipe(f){
  const ds=arrEquipe('diarias',f.id).filter(x=>!x.paga);
  const vs=arrEquipe('vales',f.id).filter(x=>!x.quitado);
  const bs=arrEquipe('bonus',f.id).filter(x=>!x.pago);
  const diariasValor=ds.reduce((s,x)=>s+Number(x.valor_total||0),0);
  const vale=vs.reduce((s,x)=>s+Number(x.valor||0),0);
  const bonus=bs.reduce((s,x)=>s+Number(x.valor||0),0);
  const bruto=diariasValor+bonus,abate=Math.min(vale,Math.max(0,bruto));
  return {ds,vs,bs,diariasValor,vale,bonus,bruto,abate,liquido:Math.max(0,bruto-abate),
    completas:ds.filter(x=>Number(x.quantidade||1)>=1).length,
    meias:ds.filter(x=>Number(x.quantidade||0)>0&&Number(x.quantidade||0)<1).length};
}
function tipoPagamento(f){
  return ({diaria:'Por diária',semana:'Por semana',quinzena:'Por quinzena',mes:'Por mês'})[String(f.tipo_pagamento||'diaria')]||'Por diária';
}
function resumoTotal(){
  const fs=funcs(),totais=fs.map(resumoEquipe);
  return {ativos:fs.filter(f=>f.ativo!==false).length,diarias:totais.reduce((s,r)=>s+r.diariasValor,0),
    bruto:totais.reduce((s,r)=>s+r.bruto,0),vales:totais.reduce((s,r)=>s+r.vale,0),
    bonus:totais.reduce((s,r)=>s+r.bonus,0),liquido:totais.reduce((s,r)=>s+r.liquido,0),
    pago:fs.reduce((s,f)=>s+Number(window.OBRIX_EQUIPE_TOTAL_PAGO?.get?.(f.id)||0),0)};
}
function indicador(t,v,classe='',ico=''){return '<div class="obp-indicador '+classe+'">'+(ico?'<span class="obp-ind-ico" aria-hidden="true">'+esc(ico)+'</span>':'')+'<span class="obp-ind-text"><small>'+esc(t)+'</small><b>'+esc(v)+'</b></span></div>';}
let resumoExpandido=false,gerenciarAberto=false;
function antigo(caminho){return document.querySelector(caminho)}
async function esperarEquipe(){
  if(antigo('#equipe .obrix-equipe-controles [data-cmd="novo"]'))return true;
  try{await window.OBRIX_POS_LOGIN_LOADER?.loadGroup?.('equipe')}catch(_){}
  return !!antigo('#equipe .obrix-equipe-controles');
}
async function clicarAntigo(selector){
  await esperarEquipe();
  const el=antigo(selector);
  if(el){el.click();return true}
  return false;
}

function metrica(t,v,highlight){return '<div class="obp-metric'+(highlight?' highlight':'')+'"><small>'+esc(t)+'</small><strong>'+esc(v)+'</strong></div>'}
function listaRegistros(rows,titulo,valor){
  if(!rows.length)return '<div class="obp-empty">Nenhum registro em aberto.</div>';
  return '<div class="obp-records">'+rows.slice().sort((a,b)=>dataHora(b.data||b.criado_em)-dataHora(a.data||a.criado_em)).slice(0,40).map(x=>'<div><span><b>'+esc(titulo)+'</b><small>'+esc(nomeObra(x.obra_id))+' · '+esc(formatarData(x.data||x.criado_em))+'</small></span><strong>'+esc(valor(x))+'</strong></div>').join('')+'</div>';
}
function conteudoAba(f,r){
  if(aba==='resumo')return '<div class="obp-metrics">'+metrica('Total bruto em aberto',dinheiro(r.bruto))+metrica('Vales em aberto',dinheiro(r.vale))+metrica('Líquido a pagar',dinheiro(r.liquido),true)+metrica('Total pago',r.pago==null?'—':dinheiro(r.pago))+metrica('Bônus/Extras acumulados',dinheiro(r.bonus))+metrica('Diárias em aberto',String(r.quantidade).replace('.',','))+'</div>';
  if(aba==='diarias')return listaRegistros(r.ds,'Diária',x=>dinheiro(x.valor_total));
  if(aba==='vales')return listaRegistros(r.vs,'Vale',x=>dinheiro(x.valor));
  if(aba==='bonus')return listaRegistros(r.bs,'Bônus / Extra',x=>dinheiro(x.valor));
  if(aba==='pagamentos')return '<div class="obp-metrics">'+metrica('Total pago',r.pago==null?'—':dinheiro(r.pago))+metrica('Líquido a pagar',dinheiro(r.liquido),true)+'</div><button type="button" class="obp-secondary" data-team-action="pagar">Abrir pagamento</button>';
  return '<div class="obp-history"><p>Consulte o histórico de diárias, faltas e outros registros deste funcionário.</p><button type="button" class="obp-secondary" data-team-action="historico">Ver registros</button></div>';
}
/* The action buttons are born with their final colors, before first paint.
   Delegated click handlers are maintained by the surrounding team component. */
function botaoAcaoEquipe(tipo,acao,rotulo,fundo,texto='#ffffff'){
  const estilo='background:'+fundo+' !important;background-color:'+fundo+' !important;'+
    'background-image:none !important;border-color:'+fundo+' !important;'+
    'color:'+texto+' !important;-webkit-text-fill-color:'+texto+' !important;'+
    'opacity:1 !important;filter:none !important;transition:none !important;animation:none !important';
  return '<button type="button" class="'+tipo+'" data-team-action="'+acao+'" style="'+estilo+'">'+esc(rotulo)+'</button>';
}
function renderEquipe(){
  const sec=$('equipe');if(!sec)return;
  // O título da tela já existe no cartão superior original.
  // O botão de cadastro é posicionado ali, sem criar outro cartão Equipe.
  const tituloSuperior=sec.querySelector(':scope > .hero');
  if(tituloSuperior&&!tituloSuperior.querySelector('#obpNovo')){
    const novo=document.createElement('button');
    novo.type='button';novo.id='obpNovo';novo.className='obp-novo-superior';
    novo.textContent='＋ Novo';novo.setAttribute('aria-label','Novo funcionário');
    novo.addEventListener('click',()=>clicarAntigo('#equipe .obrix-equipe-controles [data-cmd="novo"]'));
    tituloSuperior.appendChild(novo);
  }
  let box=$('obpEquipe');
  if(!box){
    box=document.createElement('div');box.id='obpEquipe';
    box.innerHTML='<div id="obpTeamDirectory"><label class="obp-team-search"><span>⌕</span><input type="search" id="obpBuscarFunc" placeholder="Buscar funcionário..." autocomplete="off"></label><nav id="obpFiltros" class="obp-filters" aria-label="Filtrar funcionários"></nav><section class="obp-group-summary"><h2>Gestão da equipe</h2><div id="obpIndicadores" class="obp-indicadores obp-indicadores-principais"></div><button type="button" id="obpExpandir" aria-expanded="false" aria-controls="obpResumoExtras">Ver resumo ▾</button><div id="obpResumoExtras" class="obp-indicadores obp-indicadores-extras" hidden></div></section><div class="obp-group-actions"><button type="button" id="obpPagarEquipe">▤ Pagar equipe</button><button type="button" id="obpHistoricoPag">▣ Histórico</button></div><div class="obp-list-header"><h2 id="obpTotalPessoas">Funcionários</h2><button id="obpGerenciar" type="button" aria-expanded="false">⚙ Gerenciar⌄</button></div><div id="obpGerenciarMenu" class="obp-manager-menu" hidden><button type="button" data-manager="toggle">Ativar / Desativar</button><button type="button" data-manager="excluir">Excluir funcionário</button><button type="button" data-manager="lista">Funcionários</button></div><div id="obpFuncionarios" class="obp-team-list"></div></div><div id="obpDetalhe" class="obp-team-detail" hidden></div>';
    sec.insertBefore(box,sec.querySelector('#listaEquipe')||null);
    box.addEventListener('click',cliqueEquipe);
    $('obpBuscarFunc').addEventListener('input',e=>{buscaEquipe=e.target.value;renderEquipe()});
  }
  const fs=funcs(),q=buscaEquipe.trim().toLocaleLowerCase('pt-BR');
  const filtrados=fs.filter(f=>(filtro==='todos'||(filtro==='ativos'&&f.ativo!==false)||(filtro==='inativos'&&f.ativo===false))&&(!q||String(f.nome||'').toLocaleLowerCase('pt-BR').includes(q)||String(f.cargo||f.funcao||'').toLocaleLowerCase('pt-BR').includes(q)));
  const total=resumoTotal();
  $('obpFiltros').innerHTML=[['todos','Todos',fs.length],['ativos','Ativos',fs.filter(f=>f.ativo!==false).length],['inativos','Inativos',fs.filter(f=>f.ativo===false).length]]
    .map(a=>'<button type="button" data-team-filter="'+a[0]+'" class="'+(filtro===a[0]?'active':'')+'">'+a[1]+' ('+a[2]+')</button>').join('');
  $('obpIndicadores').innerHTML=indicador('Bruto da folha',dinheiro(total.bruto),'obp-bruto','▤')+indicador('Líquido a pagar',dinheiro(total.liquido),'obp-liquido','✓');
  const extras=$('obpResumoExtras');
  extras.hidden=!resumoExpandido;
  extras.innerHTML=resumoExpandido?indicador('Funcionários ativos',total.ativos,'obp-ativos','♟')+indicador('Diárias em aberto',dinheiro(total.diarias),'obp-diarias','▣')+indicador('Vales em aberto',dinheiro(total.vales),'obp-vales','▰')+indicador('Bônus e extras',dinheiro(total.bonus),'obp-bonus','✦')+indicador('Total pago (histórico)',dinheiro(total.pago),'obp-pago','✓'):'';
  $('obpExpandir').textContent=resumoExpandido?'Ocultar resumo ▴':'Ver resumo ▾';
  $('obpExpandir').setAttribute('aria-expanded',String(resumoExpandido));
  $('obpTotalPessoas').textContent='Funcionários ('+filtrados.length+')';
  $('obpGerenciarMenu').hidden=!gerenciarAberto;
  $('obpGerenciar').setAttribute('aria-expanded',String(gerenciarAberto));
  $('obpFuncionarios').innerHTML=filtrados.length?filtrados.map(f=>'<button type="button" class="obp-person" data-team-id="'+esc(f.id)+'"><span class="obp-avatar">♟</span><span class="obp-person-text"><strong>'+esc(f.nome||'Funcionário')+'</strong><small>'+esc(f.cargo||f.funcao||'Função não informada')+'</small></span><span class="obp-chevron">›</span></button>').join(''):'<div class="obp-empty">Nenhum funcionário encontrado.</div>';
  const f=acharFunc(selecionado);
  const detalhe=$('obpDetalhe'),diretorio=$('obpTeamDirectory');
  if(!f){diretorio.hidden=false;detalhe.hidden=true;detalhe.innerHTML='';sec.classList.remove('obp-team-selected');return}
  diretorio.hidden=true;detalhe.hidden=false;sec.classList.add('obp-team-selected');
  const r=resumoEquipe(f);
  const base=String(f.tipo_pagamento)==='mes'?Number(f.salario_mensal||0):Number(f.valor_diaria||0);
  const detalheHtml='<div class="obp-detail-bar"><button type="button" data-team-back aria-label="Voltar à lista">‹</button><span>Funcionário</span></div>'+
    '<h2 class="obp-full-name">'+esc(f.nome||'Funcionário')+'</h2><div class="obp-role">'+esc(f.cargo||f.funcao||'Função não informada')+'</div>'+
    '<div class="obp-pay"><small>Forma de pagamento</small><strong>'+esc(tipoPagamento(f))+'</strong><span>'+esc(nomeObra(f.obra_id))+'</span><b>'+esc(dinheiro(base))+'</b></div>'+
    '<div class="obp-pills"><span>'+r.completas+' diária'+(r.completas===1?'':'s')+' completa'+(r.completas===1?'':'s')+' em aberto</span><span>'+r.meias+' meia'+(r.meias===1?'':'s')+' diária'+(r.meias===1?'':'s')+' em aberto</span></div>'+
    '<div class="obp-person-metrics">'+
      '<div><small>Total bruto em aberto</small><b>'+esc(dinheiro(r.bruto))+'</b></div>'+
      '<div><small>Vales em aberto</small><b>'+esc(dinheiro(r.vale))+'</b><span>Abate nesta folha: '+esc(dinheiro(r.abate))+'</span></div>'+
      '<div><small>Bônus e extras em aberto</small><b>'+esc(dinheiro(r.bonus))+'</b></div>'+
      '<div><small>Líquido a pagar</small><b>'+esc(dinheiro(r.liquido))+'</b></div>'+
    '</div><div class="obp-person-actions">'+
      botaoAcaoEquipe('obp-diaria','diaria','Marcar diária','#1169d8')+
      botaoAcaoEquipe('obp-falta','falta','Falta','#e53935')+
      botaoAcaoEquipe('obp-registros','historico','Ver registros','#8126b5')+
      botaoAcaoEquipe('obp-vale','vale','Vale','#139e37')+
      botaoAcaoEquipe('obp-bonus','bonus','Bônus e Extras','#eba200','#172331')+'</div>';
  // Never recreate the five buttons for the same employee when monetary
  // values or the team data are refreshed. Retain their nodes and inline colors.
  if(detalhe.__obpLastHtml!==detalheHtml||!detalhe.querySelector('.obp-person-actions')){
    const antigos=detalhe.__obpEmployeeId===String(f.id)?detalhe.querySelector('.obp-person-actions'):null;
    if(antigos){
      const novo=document.createElement('div');
      novo.innerHTML=detalheHtml;
      novo.querySelector('.obp-person-actions')?.replaceWith(antigos);
      detalhe.replaceChildren(...novo.childNodes);
    }else{
      detalhe.innerHTML=detalheHtml;
    }
    detalhe.__obpEmployeeId=String(f.id);
    detalhe.__obpLastHtml=detalheHtml;
  }
}

async function equipeAcaoPreview(id,tipo){
  if(tipo==='diaria'||tipo==='vale'||tipo==='bonus'||tipo==='pagar'){
    await esperarEquipe();
    if(window.equipeAcao)return window.equipeAcao(String(id),tipo);
    return alert('A função ainda está carregando. Tente novamente.');
  }
  if(tipo==='falta'||tipo==='historico'){
    await esperarEquipe();
    const acao=tipo==='falta'?'falta':'registros';
    const btn=[...document.querySelectorAll('#listaEquipe [data-acao="'+acao+'"]')].find(b=>String(b.dataset.id)===String(id));
    if(btn)return btn.click();
    return alert('O registro ainda está carregando. Tente novamente.');
  }
}

async function cliqueEquipe(e){
  const t=e.target.closest('button');if(!t)return;
  if(t.id==='obpNovo')return clicarAntigo('#equipe .obrix-equipe-controles [data-cmd="novo"]');
  if(t.id==='obpExpandir'){resumoExpandido=!resumoExpandido;renderEquipe();return}
  if(t.id==='obpPagarEquipe')return clicarAntigo('#equipe .obrix-pagar-equipe-topo');
  if(t.id==='obpHistoricoPag')return clicarAntigo('#equipe .obrix-historico-pagamentos-topo');
  if(t.id==='obpGerenciar'){gerenciarAberto=!gerenciarAberto;renderEquipe();return}
  if(t.dataset.manager){const sel={'toggle':'[data-cmd="toggle"]','excluir':'[data-cmd="excluir"]','lista':'[data-cmd="lista"]'}[t.dataset.manager];gerenciarAberto=false;renderEquipe();if(sel)return clicarAntigo('#equipe .obrix-equipe-controles '+sel);return}
  if(t.dataset.teamFilter){filtro=t.dataset.teamFilter;selecionado='';gerenciarAberto=false;renderEquipe();return}
  if(t.dataset.teamId){selecionado=t.dataset.teamId;renderEquipe();scrollTo({top:0,behavior:'smooth'});return}
  if(t.hasAttribute('data-team-back')){selecionado='';renderEquipe();scrollTo({top:0,behavior:'smooth'});return}
  if(t.dataset.teamAction&&selecionado)return equipeAcaoPreview(selecionado,t.dataset.teamAction);
}

const css=document.createElement('style');css.id='obpPreviewCss';css.textContent="\n#app>.top #sair,#app>.top #obrixTheme{display:none!important}\n#inicio,#equipe{--obp-page:#f8fafc;--obp-panel:#fff;--obp-panel2:#f9fafb;--obp-text:#172331;--obp-muted:#64748b;--obp-border:#dce3ec;--obp-gold:#eab72b;--obp-shade:#fff4d8;--obp-shadow:0 2px 8px rgba(13,31,48,.075);background:var(--obp-page)!important;background-color:var(--obp-page)!important;color:var(--obp-text)!important;min-height:70vh}\nhtml[data-theme=\"dark\"] #inicio,html[data-theme=\"dark\"] #equipe{--obp-page:#07131e;--obp-panel:#101f2e;--obp-panel2:#142637;--obp-text:#f6f8fa;--obp-muted:#c3ced9;--obp-border:#32465a;--obp-gold:#f0bd36;--obp-shade:#3c321d;--obp-shadow:none}\n#inicio #obpHome,#equipe #obpEquipe{max-width:900px;margin:auto;padding:17px 14px 32px;color:var(--obp-text);font-family:inherit}\n#inicio #obpHome *,#equipe #obpEquipe *{box-sizing:border-box}\n#inicio #obpHome [hidden],#equipe #obpEquipe [hidden]{display:none!important}\n#inicio #obpHome h1,#inicio #obpHome h2,#inicio #obpHome strong,#equipe #obpEquipe h1,#equipe #obpEquipe h2,#equipe #obpEquipe strong,#equipe #obpEquipe b{color:var(--obp-text)!important}\n#inicio #obpHome button,#equipe #obpEquipe button{font-family:inherit;-webkit-text-fill-color:initial!important}\n#inicio #obpHome .obp-greeting{padding:18px 5px 25px;background:transparent!important}\n#inicio #obpHome .obp-greeting h1{font-size:clamp(28px,4.5vw,36px);line-height:1.18;letter-spacing:-.03em;font-weight:850;margin:0}\n#inicio #obpHome .obp-greeting-mark{width:50px;height:4px;background:var(--obp-gold);display:block;border-radius:20px;margin-top:12px}\n#inicio #obpHome .obp-shortcuts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:0 0 25px}\n#inicio #obpHome .obp-shortcuts button{min-width:0;min-height:82px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px 4px;border:1px solid var(--obp-border)!important;background:var(--obp-panel)!important;color:var(--obp-text)!important;border-radius:15px;box-shadow:var(--obp-shadow)!important;font-weight:750;font-size:12px}\n#inicio #obpHome .obp-shortcuts button span{font-size:27px;line-height:1;color:var(--obp-gold)}\n#inicio #obpHome .obp-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:18px 0 11px}\n#inicio #obpHome .obp-heading h2{font-size:20px;line-height:1.2;margin:0!important;font-weight:850;letter-spacing:-.025em;min-width:0}\n#inicio #obpHome .obp-heading h2:before{content:\"\";display:inline-block;width:5px;height:21px;border-radius:5px;background:var(--obp-gold);margin-right:9px;vertical-align:-4px}\n#inicio #obpHome .obp-heading button{display:inline-flex;align-items:center;gap:4px;flex:none;background:transparent!important;background-image:none!important;border:0!important;box-shadow:none!important;color:var(--obp-gold)!important;-webkit-text-fill-color:var(--obp-gold)!important;font-weight:750;font-size:14px;padding:6px 0}\n#inicio #obpHome .obp-heading button span{font-size:23px}\n#inicio #obpHome .obp-work{display:flex;width:100%;text-align:left;align-items:center;gap:11px;min-height:93px;margin:0 0 9px;padding:13px 12px;border-radius:14px;border:1px solid var(--obp-border)!important;background:var(--obp-panel)!important;color:var(--obp-text)!important;box-shadow:var(--obp-shadow)!important}\n#inicio #obpHome .obp-work-icon{flex:0 0 47px;width:47px;height:50px;display:grid;place-items:center;border-radius:10px;background:var(--obp-shade);color:var(--obp-gold);font-size:24px}\n#inicio #obpHome .obp-work-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:9px}\n#inicio #obpHome .obp-work-main strong{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;white-space:normal!important;line-height:1.28;min-height:37px;font-size:15.5px;font-weight:850;letter-spacing:-.01em}\n#inicio #obpHome .obp-progress{width:100%;height:6px;display:block;overflow:hidden;border-radius:20px;background:var(--obp-border)}\n#inicio #obpHome .obp-progress i{display:block;height:100%;border-radius:20px;background:var(--obp-gold)}\n#inicio #obpHome .obp-work-pct{flex:none;min-width:34px;white-space:nowrap;text-align:right;color:var(--obp-gold);font-weight:850;font-size:13px}\n#inicio #obpHome .obp-work-arrow{font-size:26px;color:var(--obp-muted);line-height:1}\n#inicio #obpHome .obp-activity{display:flex;align-items:center;gap:11px;padding:12px 7px;border-bottom:1px solid var(--obp-border);min-height:67px}\n#inicio #obpHome .obp-activity-ico{width:31px;flex:none;text-align:center;color:var(--obp-gold);font-size:23px}\n#inicio #obpHome .obp-activity-name{min-width:0;flex:1;color:var(--obp-text);font-size:14px;font-weight:650;line-height:1.42}\n#inicio #obpHome .obp-activity time{font-size:11px;font-weight:600;color:var(--obp-muted);white-space:nowrap}\n#inicio #obpHome .obp-empty,#equipe #obpEquipe .obp-empty{padding:19px 13px;background:var(--obp-panel2);color:var(--obp-muted);border:1px solid var(--obp-border);border-radius:12px;font-size:14px}\n#app #equipe>.hero,#app #equipe>.sectionHead,#app #equipe>.obrix-equipe-controles,#app #equipe #listaEquipe{display:none!important}\n#equipe #obpEquipe .obp-team-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 19px}\n#equipe #obpEquipe .obp-team-header h1{font-size:27px;font-weight:850;margin:0}\n#equipe #obpEquipe .obp-team-header #obpNovo{padding:11px 15px;border:0!important;border-radius:12px;background:var(--obp-gold)!important;color:#182230!important;font-weight:850;font-size:14px}\n#equipe #obpEquipe .obp-team-search{border:1px solid var(--obp-border);border-radius:13px;height:49px;display:flex;align-items:center;gap:9px;padding:0 15px;background:var(--obp-panel);margin-bottom:14px}\n#equipe #obpEquipe .obp-team-search span{font-size:26px;color:var(--obp-muted)}\n#equipe #obpEquipe #obpBuscarFunc{border:0!important;box-shadow:none!important;background:transparent!important;color:var(--obp-text)!important;-webkit-text-fill-color:var(--obp-text)!important;font-size:15px;font-weight:500;width:100%;height:100%;outline:0;margin:0}\n#equipe #obpEquipe .obp-filters{display:flex;gap:8px;overflow-x:auto;margin:0 0 20px}\n#equipe #obpEquipe .obp-filters button{min-height:39px;white-space:nowrap;flex:1;padding:8px 11px;border:1px solid var(--obp-border)!important;border-radius:12px;background:var(--obp-panel)!important;color:var(--obp-text)!important;font-size:12px;font-weight:750}\n#equipe #obpEquipe .obp-filters button.active{background:var(--obp-shade)!important;border-color:var(--obp-gold)!important;color:var(--obp-text)!important}\n#equipe #obpEquipe .obp-group-summary{background:var(--obp-panel)!important;border:1px solid var(--obp-border);border-radius:17px;padding:16px;margin-bottom:13px}\n#equipe #obpEquipe .obp-group-summary h2{font-size:19px;margin:0 0 13px;font-weight:850}\n#equipe #obpEquipe .obp-indicadores{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}\n#equipe #obpEquipe .obp-indicador{min-width:0;min-height:87px;padding:11px 9px;border-radius:12px;border:1px solid var(--obp-border);background:var(--obp-panel2)}\n#equipe #obpEquipe .obp-indicador.destaque{background:var(--obp-shade)}\n#equipe #obpEquipe .obp-indicador small{font-size:11px;display:block;line-height:1.25;margin-bottom:13px;color:var(--obp-muted)!important}\n#equipe #obpEquipe .obp-indicador b{font-weight:850;font-size:clamp(11px,2.6vw,17px);overflow-wrap:anywhere;letter-spacing:-.01em}\n#equipe #obpEquipe #obpExpandir{width:100%;border:0!important;border-top:1px solid var(--obp-border)!important;background:transparent!important;color:var(--obp-gold)!important;font-size:13px;font-weight:800;margin-top:15px;padding:14px 5px 1px}\n#equipe #obpEquipe .obp-group-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 20px}\n#equipe #obpEquipe .obp-group-actions button{border:1px solid var(--obp-border)!important;background:var(--obp-panel)!important;color:var(--obp-text)!important;padding:13px 4px;border-radius:13px;font-weight:800;font-size:13px}\n#equipe #obpEquipe .obp-list-header{display:flex;justify-content:space-between;align-items:center;margin:7px 0 11px;gap:9px}\n#equipe #obpEquipe .obp-list-header h2{font-size:19px;font-weight:850;margin:0;letter-spacing:-.02em}\n#equipe #obpEquipe #obpGerenciar{padding:8px 10px;border-radius:10px;background:var(--obp-panel)!important;border:1px solid var(--obp-border)!important;color:var(--obp-text)!important;font-size:12px;font-weight:750}\n#equipe #obpEquipe .obp-manager-menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 11px}\n#equipe #obpEquipe .obp-manager-menu button{border:1px solid var(--obp-border)!important;background:var(--obp-panel2)!important;color:var(--obp-text)!important;border-radius:9px;padding:11px 8px;font-size:12px;font-weight:700}\n#equipe #obpEquipe .obp-team-list{display:grid;gap:8px}\n#equipe #obpEquipe .obp-person{display:flex;gap:10px;align-items:center;padding:12px 11px;background:var(--obp-panel)!important;border:1px solid var(--obp-border)!important;border-radius:14px;width:100%;min-height:72px;text-align:left;color:var(--obp-text)!important;box-shadow:var(--obp-shadow)!important}\n#equipe #obpEquipe .obp-avatar{flex:none;width:39px;height:39px;border-radius:11px;display:grid;place-items:center;background:var(--obp-shade);color:var(--obp-gold);font-size:23px}\n#equipe #obpEquipe .obp-person-text{min-width:0;flex:1;display:grid;gap:4px}\n#equipe #obpEquipe .obp-person-text strong{font-size:14px;line-height:1.24;font-weight:850;white-space:normal;overflow-wrap:break-word}\n#equipe #obpEquipe .obp-person-text small{font-size:12px;color:var(--obp-muted)!important}\n#equipe #obpEquipe .obp-chevron{font-size:24px;color:var(--obp-muted)}\n#equipe #obpEquipe .obp-team-detail{max-width:700px;margin:0 auto}\n#equipe #obpEquipe .obp-detail-bar{display:flex;align-items:center;gap:10px;margin:0 0 24px}\n#equipe #obpEquipe .obp-detail-bar>button{border:0!important;background:transparent!important;color:var(--obp-text)!important;font-weight:850;font-size:34px;line-height:1;padding:0 9px 0 0}\n#equipe #obpEquipe .obp-detail-bar span{font-size:14px;font-weight:700;color:var(--obp-muted)}\n#equipe #obpEquipe .obp-full-name{font-size:clamp(21px,4vw,28px);letter-spacing:-.02em;line-height:1.2;font-weight:850;margin:0 0 6px;overflow-wrap:break-word}\n#equipe #obpEquipe .obp-role{font-size:15px;color:var(--obp-muted);margin-bottom:18px}\n#equipe #obpEquipe .obp-pay{background:var(--obp-panel)!important;border:1px solid var(--obp-border);border-radius:15px;display:grid;gap:6px;padding:18px 16px;margin:0 0 16px}\n#equipe #obpEquipe .obp-pay small{font-size:14px;color:var(--obp-muted)!important}\n#equipe #obpEquipe .obp-pay strong{font-size:21px;font-weight:850}\n#equipe #obpEquipe .obp-pay span{font-size:14px;color:var(--obp-muted)}\n#equipe #obpEquipe .obp-pay b{font-size:28px;font-weight:850;margin-top:14px}\n#equipe #obpEquipe .obp-pills{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:17px}\n#equipe #obpEquipe .obp-pills span{display:inline-flex;border:1px solid var(--obp-border);border-radius:999px;padding:9px 12px;font-size:13px;color:var(--obp-text);background:var(--obp-panel)}\n#equipe #obpEquipe .obp-person-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:20px}\n#equipe #obpEquipe .obp-person-metrics>div{min-height:119px;padding:14px 12px;background:var(--obp-panel)!important;border:1px solid var(--obp-border);border-radius:14px;display:flex;flex-direction:column;gap:9px;min-width:0}\n#equipe #obpEquipe .obp-person-metrics small{font-size:13px;color:var(--obp-muted)!important;line-height:1.28}\n#equipe #obpEquipe .obp-person-metrics b{font-size:clamp(18px,4vw,24px);font-weight:850;overflow-wrap:anywhere}\n#equipe #obpEquipe .obp-person-metrics span{font-size:12px;color:var(--obp-muted)}\n#equipe #obpEquipe .obp-person-actions{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}\n#equipe #obpEquipe .obp-person-actions button{min-height:49px;border-radius:12px;font-size:13px;font-weight:800;padding:11px 5px;border:1px solid var(--obp-border)!important;grid-column:span 2}\n#equipe #obpEquipe .obp-person-actions .obp-vale,#equipe #obpEquipe .obp-person-actions .obp-bonus{grid-column:span 3}\n#equipe #obpEquipe .obp-person-actions .obp-diaria{background:#142c46!important;border-color:#38658b!important;color:#d0e5ff!important}\n#equipe #obpEquipe .obp-person-actions .obp-falta{background:#3b2025!important;border-color:#984650!important;color:#fff0f1!important}\n#equipe #obpEquipe .obp-person-actions .obp-registros{background:#302444!important;border-color:#7252a1!important;color:#f1e7ff!important}\n#equipe #obpEquipe .obp-person-actions .obp-vale{background:#123e32!important;border-color:#35876b!important;color:#e6fff4!important}\n#equipe #obpEquipe .obp-person-actions .obp-bonus{background:#453516!important;border-color:#a98225!important;color:#fff1b7!important}\nhtml[data-theme=\"dark\"] #app>.top,html[data-theme=\"dark\"] #app>.bottom{background:#0e1b28!important;background-color:#0e1b28!important;border-color:#32465a!important;color:#f8fafc!important}\nhtml[data-theme=\"dark\"] #app>.top button,html[data-theme=\"dark\"] #app>.bottom button{color:#f8fafc!important}\nhtml[data-theme=\"dark\"] #equipe #obpEquipe,html[data-theme=\"dark\"] #inicio #obpHome{background:#07131e!important;color:#f6f8fa!important}\nhtml[data-theme=\"dark\"] .modalBack .modal{background:#101f2e!important;background-color:#101f2e!important;color:#f8fafc!important;border:1px solid #334a60!important}\nhtml[data-theme=\"dark\"] .modalBack .modal input,html[data-theme=\"dark\"] .modalBack .modal select,html[data-theme=\"dark\"] .modalBack .modal textarea{background:#142637!important;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important;border-color:#365069!important}\n@media(max-width:420px){\n#inicio #obpHome,#equipe #obpEquipe{padding:13px 10px 30px}\n#inicio #obpHome .obp-work{padding:11px 8px;gap:8px}\n#inicio #obpHome .obp-work-main strong{font-size:15px}\n#inicio #obpHome .obp-work-icon{width:38px;height:44px;flex-basis:38px}\n#inicio #obpHome .obp-activity-name{font-size:13.5px}\n#inicio #obpHome .obp-activity{gap:6px}\n#inicio #obpHome .obp-activity time{font-size:10px}\n#equipe #obpEquipe .obp-indicador{padding:10px 6px;min-height:92px}\n#equipe #obpEquipe .obp-indicador b{font-size:12px}\n#equipe #obpEquipe .obp-person-metrics>div{padding:12px 10px}\n#equipe #obpEquipe .obp-person-actions button{font-size:12px}\n}\n";css.textContent+="\n/* Preview only: remove legacy duplicate, preserve compact summary. */\n#app #equipe #obrixGestaoResumo,\n#app #equipe>.obrix-gestao-resumo,\n#app #equipe>.hero,\n#app #equipe>.sectionHead{display:none!important}\n#app #sair,#app .top .obrixLogoutIcon,\n#app #obrixTheme{display:none!important;visibility:hidden!important;pointer-events:none!important}\n/* Distinct header columns eliminate collisions with 'Ver todas'. */\n#inicio #obpHome .obp-heading{display:grid!important;grid-template-columns:minmax(0,1fr) max-content!important;align-items:center!important;column-gap:10px!important;margin:22px 0 12px!important}\n#inicio #obpHome .obp-heading h2{margin:0!important;min-width:0!important;font-size:clamp(17px,4.25vw,20px)!important;line-height:1.24!important;white-space:normal!important}\n#inicio #obpHome .obp-heading button{position:static!important;display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;white-space:nowrap!important;min-width:max-content!important;font-size:13px!important;font-weight:800!important;margin:0!important;padding:6px 0!important;border:0!important;border-radius:0!important;color:var(--obp-gold)!important;-webkit-text-fill-color:var(--obp-gold)!important;background:transparent!important;background-color:transparent!important;box-shadow:none!important}\n#inicio #obpHome #obpAtividades{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:9px!important;margin-top:4px!important}\n#inicio #obpHome .obp-activity{display:flex!important;align-items:flex-start!important;gap:12px!important;min-height:77px!important;width:100%!important;margin:0!important;padding:13px 12px!important;background:var(--obp-panel)!important;background-color:var(--obp-panel)!important;border:1px solid var(--obp-border)!important;border-radius:13px!important;box-shadow:var(--obp-shadow)!important}\n#inicio #obpHome .obp-activity-ico{width:37px!important;height:40px!important;min-width:37px!important;display:grid!important;place-items:center!important;text-align:center!important;font-size:22px!important;border-radius:10px!important;background:var(--obp-shade)!important;color:var(--obp-gold)!important}\n#inicio #obpHome .obp-activity-body{display:flex!important;flex-direction:column!important;align-items:flex-start!important;min-width:0!important;flex:1!important;gap:4px!important}\n#inicio #obpHome .obp-activity-name{display:block!important;font-size:14px!important;line-height:1.25!important;font-weight:800!important;color:var(--obp-text)!important;overflow-wrap:anywhere!important}\n#inicio #obpHome .obp-activity-detail{display:block!important;font-size:13px!important;line-height:1.3!important;font-weight:500!important;color:var(--obp-text)!important;overflow-wrap:anywhere!important}\n#inicio #obpHome .obp-activity time{display:block!important;font-size:11px!important;line-height:1.3!important;font-weight:650!important;color:var(--obp-muted)!important;white-space:normal!important;margin-top:1px!important}\n.obp-activities-modal .obp-modal{width:min(94vw,680px)!important;max-height:85vh!important;overflow:auto!important;background:var(--ob-surface,#fff)!important;color:var(--ob-text,#16212c)!important;border:1px solid var(--ob-border,#ddd)!important}\n.obp-activities-modal .obp-modal-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding-bottom:12px!important;border-bottom:1px solid var(--ob-border,#ddd)!important}\n.obp-activities-modal .obp-modal-head h2{font-size:21px!important;color:inherit!important;margin:0!important}\n.obp-activities-modal .obp-modal-head button{background:transparent!important;border:0!important;color:inherit!important;font-size:27px!important}\n.obp-activities-modal .obp-activity{display:flex!important;gap:12px!important;align-items:start!important;border-bottom:1px solid var(--ob-border,#ddd)!important;padding:13px 3px!important}\n.obp-activities-modal .obp-activity-ico{font-size:23px!important;color:#d19b1f!important;min-width:31px!important;text-align:center!important}\n.obp-activities-modal .obp-activity-body{display:flex!important;flex-direction:column!important;gap:4px!important;min-width:0!important}\n.obp-activities-modal .obp-activity-name{font-size:15px!important;font-weight:800!important;color:inherit!important}\n.obp-activities-modal .obp-activity-detail{font-size:14px!important;line-height:1.4!important;color:inherit!important}\n.obp-activities-modal .obp-activity time{font-size:12px!important;color:var(--ob-muted,#6b7280)!important}\n/* Restore the five category colors and text contrast from the old employee view. */\n#app #equipe #obpEquipe .obp-person-actions .obp-diaria{background:#142c46!important;background-color:#142c46!important;border-color:#38658b!important;color:#d0e5ff!important;-webkit-text-fill-color:#d0e5ff!important}\n#app #equipe #obpEquipe .obp-person-actions .obp-falta{background:#3b2025!important;background-color:#3b2025!important;border-color:#984650!important;color:#fff0f1!important;-webkit-text-fill-color:#fff0f1!important}\n#app #equipe #obpEquipe .obp-person-actions .obp-registros{background:#302444!important;background-color:#302444!important;border-color:#7252a1!important;color:#f1e7ff!important;-webkit-text-fill-color:#f1e7ff!important}\n#app #equipe #obpEquipe .obp-person-actions .obp-vale{background:#123e32!important;background-color:#123e32!important;border-color:#35876b!important;color:#e6fff4!important;-webkit-text-fill-color:#e6fff4!important}\n#app #equipe #obpEquipe .obp-person-actions .obp-bonus{background:#453516!important;background-color:#453516!important;border-color:#a98225!important;color:#fff1b7!important;-webkit-text-fill-color:#fff1b7!important}\n@media(max-width:380px){\n#inicio #obpHome .obp-heading{column-gap:6px!important}\n#inicio #obpHome .obp-heading h2{font-size:16px!important}\n#inicio #obpHome .obp-heading button{font-size:12px!important}\n#inicio #obpHome .obp-activity-name{font-size:13.5px!important}\n#inicio #obpHome .obp-activity-detail{font-size:12.5px!important}\n}\n";
document.head.appendChild(css);
function atualizar(){if(agendado)return;agendado=true;setTimeout(()=>{agendado=false;renderInicio();renderEquipe();if($('inicio')&&!$('inicio').classList.contains('hidden'))buscarEventos()},90)}
function iniciar(){
  renderInicio();renderEquipe();
  const ini=$('inicio'),legado=$('listaEquipe'),app=$('app');
  if(ini)new MutationObserver(m=>{if(!ini.querySelector('#obpHome'))atualizar()}).observe(ini,{childList:true,subtree:false});
  if(legado)new MutationObserver(atualizar).observe(legado,{childList:true});
  if(app)new MutationObserver(atualizar).observe(app,{attributes:true,attributeFilter:['class']});
  ['obrix:offline-base-atualizada','obrix:offline-core-restaurado','obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto'].forEach(x=>window.addEventListener(x,atualizar));
  window.addEventListener('pageshow',atualizar);
  setTimeout(atualizar,1200);setTimeout(atualizar,3200);let ultimoProgresso='';setInterval(()=>{const home=$('inicio');if(!home||home.classList.contains('hidden'))return;const atual=obras().map(o=>String(o.id)+':'+String(progresso(o))).join('|');if(atual!==ultimoProgresso){ultimoProgresso=atual;renderInicio()}},5000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
window.OBRIX_PREVIEW={refresh:atualizar,openActivity:abrirAtualizacoes};
})();