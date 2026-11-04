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
function atividadeHTML(e){return '<div class="obp-activity"><span class="obp-activity-ico" aria-hidden="true">'+esc(e.icon)+'</span><span class="obp-activity-name">'+esc(e.txt)+'</span><time>'+esc(formatarData(e.date))+'</time></div>'}
function renderInicio(){
  const root=$('inicio');if(!root)return;
  if(!$('obpHome')){
    root.innerHTML='<div id="obpHome"><div class="obp-greeting"><h1 id="obpOla">Olá</h1><span class="obp-greeting-mark"></span></div><div class="obp-shortcuts"><button type="button" data-short="nova"><span>＋</span>Nova obra</button><button type="button" data-short="equipe"><span>♙</span>Equipe</button><button type="button" data-short="checklist"><span>☑</span>Checklist</button><button type="button" data-short="foto"><span>▧</span>Foto</button></div><div class="obp-heading"><h2>Obras em andamento</h2><button type="button" data-home-all="obras">Ver todas <span>›</span></button></div><div id="obpObras"></div><div class="obp-heading"><h2>Últimas atualizações</h2><button type="button" data-home-all="atividades">Ver todas <span>›</span></button></div><div id="obpAtividades"></div></div>';
    root.addEventListener('click',cliqueInicio);
  }
  $('obpOla').textContent='Olá'+(primeiroNome()?', '+primeiroNome():'');
  const recentes=obras().filter(emAndamento).slice().sort((a,b)=>dataHora(b.atualizado_em||b.criado_em)-dataHora(a.atualizado_em||a.criado_em)).slice(0,3);
  $('obpObras').innerHTML=recentes.length?recentes.map(o=>{const p=progresso(o);return '<button type="button" class="obp-work" data-home-obra="'+esc(o.id)+'"><span class="obp-work-icon">▥</span><span class="obp-work-main"><strong>'+esc(o.nome||'Obra')+'</strong><span class="obp-work-status">Em andamento</span><span class="obp-progress"><i style="width:'+(p??0)+'%"></i></span></span><span class="obp-work-pct">'+(p===null?'—':p+'%')+'</span><span class="obp-work-arrow">›</span></button>'}).join(''):'<div class="obp-empty">Nenhuma obra em andamento.</div>';
  const at=atividades().slice(0,4);
  $('obpAtividades').innerHTML=at.length?at.map(atividadeHTML).join(''):'<div class="obp-empty">As atualizações das suas obras aparecerão aqui.</div>';
}
function abrirObras(id){
  if(typeof window.abrir==='function')window.abrir('obras');
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
    const fontes=[['relatorio_fotos','Foto adicionada','▧'],['diarios_obra','Diário de obra atualizado','▤'],['checklist_itens','Checklist atualizado','☑']];
    const rows=await Promise.all(fontes.map(async ([t,titulo,icon])=>{
      try{const r=await sb.from(t).select('*').eq('empresa_id',p.empresa_id).limit(20);if(r.error)return[];return (r.data||[]).map(x=>({key:t+':'+x.id,txt:titulo+' · '+nomeObra(x.obra_id),date:x.atualizado_em||x.criado_em||x.created_at||x.data,icon}))}catch(_){return[]}
    }));
    eventosRemotos=rows.flat();renderInicio();
  }catch(_){}finally{buscandoEventos=false}
}
function arrEquipe(tipo,id){return lista(tipo).filter(x=>String(x.funcionario_id)===String(id))}
function resumoEquipe(f){
  const ds=arrEquipe('diarias',f.id).filter(x=>!x.paga),vs=arrEquipe('vales',f.id).filter(x=>!x.quitado),bs=arrEquipe('bonus',f.id).filter(x=>!x.pago);
  const valorD=ds.reduce((s,x)=>s+Number(x.valor_total||0),0),valorV=vs.reduce((s,x)=>s+Number(x.valor||0),0),valorB=bs.reduce((s,x)=>s+Number(x.valor||0),0);
  const totalPago=window.OBRIX_EQUIPE_TOTAL_PAGO?.get?.(f.id);
  return {ds,vs,bs,bruto:valorD+valorB,vale:valorV,liquido:valorD+valorB-valorV,pago:totalPago,bonus:arrEquipe('bonus',f.id).reduce((s,x)=>s+Number(x.valor||0),0),quantidade:ds.reduce((s,x)=>s+Number(x.quantidade??1),0)};
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
function renderEquipe(){
  const sec=$('equipe');if(!sec)return;
  if(!$('obpEquipe')){
    const box=document.createElement('div');box.id='obpEquipe';
    box.innerHTML='<header class="obp-team-header"><h1>Equipe</h1><button type="button" id="obpNovo">＋ Novo</button></header><label class="obp-team-search"><span>⌕</span><input type="search" id="obpBuscarFunc" placeholder="Buscar funcionário..." autocomplete="off"></label><nav id="obpFiltros" class="obp-filters" aria-label="Filtrar funcionários"></nav><div class="obp-team-layout"><div id="obpFuncionarios" class="obp-team-list"></div><div id="obpDetalhe" class="obp-team-detail"></div></div>';
    sec.insertBefore(box,sec.querySelector('#listaEquipe')||null);
    box.addEventListener('click',cliqueEquipe);
    $('obpBuscarFunc').addEventListener('input',e=>{buscaEquipe=e.target.value;renderEquipe()});
  }
  const fs=funcs(),q=buscaEquipe.trim().toLocaleLowerCase('pt-BR'),filtrados=fs.filter(f=>(filtro==='todos'||(filtro==='ativos'&&f.ativo!==false)||(filtro==='inativos'&&f.ativo===false))&&(!q||String(f.nome||'').toLocaleLowerCase('pt-BR').includes(q)||String(f.cargo||f.funcao||'').toLocaleLowerCase('pt-BR').includes(q)));
  $('obpFiltros').innerHTML=[['todos','Todos',fs.length],['ativos','Ativos',fs.filter(f=>f.ativo!==false).length],['inativos','Inativos',fs.filter(f=>f.ativo===false).length]].map(a=>'<button type="button" data-team-filter="'+a[0]+'" class="'+(filtro===a[0]?'active':'')+'">'+a[1]+' ('+a[2]+')</button>').join('');
  $('obpFuncionarios').innerHTML=filtrados.length?filtrados.map(f=>'<button type="button" class="obp-person'+(String(selecionado)===String(f.id)?' selected':'')+'" data-team-id="'+esc(f.id)+'"><span class="obp-avatar">'+esc(String(f.nome||'?').trim().slice(0,1).toUpperCase())+'</span><span class="obp-person-text"><strong>'+esc(f.nome||'Funcionário')+'</strong><small>'+esc(f.cargo||f.funcao||'Função não informada')+' · '+esc(nomeObra(f.obra_id))+'</small></span><span class="obp-pill'+(f.ativo===false?' off':'')+'">'+(f.ativo===false?'Inativo':'Ativo')+'</span><span class="obp-chevron">›</span></button>').join(''):'<div class="obp-empty">Nenhum funcionário encontrado.</div>';
  if(selecionado&&!acharFunc(selecionado))selecionado='';
  if(!selecionado&&window.innerWidth>720&&filtrados.length)selecionado=String(filtrados[0].id);
  const f=acharFunc(selecionado);
  const detalhe=$('obpDetalhe');
  if(!f){detalhe.innerHTML='<div class="obp-empty obp-select-help">Selecione um funcionário para visualizar os detalhes.</div>';sec.classList.remove('obp-team-selected');return}
  sec.classList.add('obp-team-selected');
  const r=resumoEquipe(f),abas=[['resumo','Resumo'],['diarias','Diárias'],['vales','Vales'],['bonus','Bônus'],['pagamentos','Pagamentos'],['historico','Histórico']];
  detalhe.innerHTML='<button type="button" class="obp-back" data-team-back>‹ Funcionários</button><div class="obp-detail-top"><span class="obp-avatar large">'+esc(String(f.nome||'?').trim().slice(0,1).toUpperCase())+'</span><div><h2>'+esc(f.nome||'Funcionário')+'</h2><p>'+esc(f.cargo||f.funcao||'Função não informada')+' · '+esc(nomeObra(f.obra_id))+'</p></div><span class="obp-pill'+(f.ativo===false?' off':'')+'">'+(f.ativo===false?'Inativo':'Ativo')+'</span></div><div class="obp-tabs">'+abas.map(x=>'<button type="button" data-team-tab="'+x[0]+'" class="'+(aba===x[0]?'active':'')+'">'+x[1]+'</button>').join('')+'</div><div id="obpConteudoAba">'+conteudoAba(f,r)+'</div><div class="obp-team-actions"><button type="button" data-team-action="diaria">Registrar diária</button><button type="button" data-team-action="vale">Vale</button><button type="button" data-team-action="bonus">Bônus</button><button type="button" data-team-action="pagar">Pagar</button></div><div class="obp-team-footer"><button type="button" data-team-action="editar">Editar cadastro</button><button type="button" data-team-action="status">Ativar / Desativar</button><button type="button" data-team-action="excluir">Excluir</button></div>';
}
async function equipeAcaoPreview(id,tipo){
  if(!window.equipeAcao&&window.OBRIX_POS_LOGIN_LOADER?.loadGroup)try{await window.OBRIX_POS_LOGIN_LOADER.loadGroup('equipe')}catch(_){}
  if(tipo==='diaria'||tipo==='vale'||tipo==='bonus'||tipo==='pagar'){window.equipeAcao?.(id,tipo);return}
  if(tipo==='historico'){
    const target=[...document.querySelectorAll('#listaEquipe [data-acao="registros"]')].find(x=>String(x.dataset.id)===String(id));
    if(target)target.click();else window.OBRIX_FUNCIONARIOS_PESSOAL?.openDetail?.(acharFunc(id));return;
  }
  if(tipo==='editar'){if(window.OBRIX_FUNCIONARIOS_PESSOAL?.edit)window.OBRIX_FUNCIONARIOS_PESSOAL.edit(acharFunc(id));else window.OBRIX_FUNCIONARIOS_PESSOAL?.open?.();return}
  if(tipo==='status'||tipo==='excluir'){const cmd=tipo==='status'?'toggle':'excluir';document.querySelector('#equipe .obrix-equipe-controles [data-cmd="'+cmd+'"]')?.click()}
}
function cliqueEquipe(e){
  const t=e.target.closest('button');if(!t)return;
  if(t.id==='obpNovo'){const abrir=()=>document.querySelector('#equipe .obrix-equipe-controles [data-cmd="novo"]')?.click();if(document.querySelector('#equipe .obrix-equipe-controles [data-cmd="novo"]'))abrir();else window.OBRIX_POS_LOGIN_LOADER?.loadGroup?.('equipe').then(abrir);return}
  if(t.dataset.teamFilter){filtro=t.dataset.teamFilter;selecionado='';renderEquipe();return}
  if(t.dataset.teamId){selecionado=t.dataset.teamId;aba='resumo';renderEquipe();return}
  if(t.hasAttribute('data-team-back')){selecionado='';renderEquipe();return}
  if(t.dataset.teamTab){aba=t.dataset.teamTab;renderEquipe();return}
  if(t.dataset.teamAction&&selecionado)equipeAcaoPreview(selecionado,t.dataset.teamAction);
}
const css=document.createElement('style');css.id='obpPreviewCss';
css.textContent=[
'#inicio,#equipe{background:#fff!important;color:#16212c!important;}',
'#inicio #obpHome,#equipe #obpEquipe{max-width:1150px;margin:0 auto;padding:18px 16px 38px;color:#16212c;font-family:inherit;}',
'#inicio #obpHome *,#equipe #obpEquipe *{box-sizing:border-box;}',
'#inicio .obp-greeting{padding:17px 4px 28px;background:#fff;}',
'#inicio .obp-greeting h1{font-size:clamp(26px,4vw,36px);letter-spacing:-.035em;margin:0;font-weight:800;color:#17202b;}',
'#inicio .obp-greeting-mark{display:block;width:46px;height:3px;border-radius:8px;background:#e5ab21;margin-top:11px;}',
'#inicio .obp-shortcuts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:6px 0 28px;}',
'#inicio .obp-shortcuts button{background:#fff!important;color:#202a34!important;border:1px solid #e9edf2!important;border-radius:16px;padding:15px 6px;min-height:83px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;font-size:12px;font-weight:700;box-shadow:0 2px 8px #1824320c!important;}',
'#inicio .obp-shortcuts button span{font-size:27px;line-height:1;color:#d39b16;}',
'#inicio .obp-heading{display:flex;align-items:center;justify-content:space-between;gap:9px;margin:19px 0 10px;}',
'#inicio .obp-heading h2{font-size:19px;line-height:1.22;margin:0!important;color:#18212b;font-weight:800;letter-spacing:-.02em;}',
'#inicio .obp-heading button{background:none!important;border:none!important;box-shadow:none!important;color:#9c720f!important;font-size:13px;font-weight:700;white-space:nowrap;padding:6px 0;}',
'#inicio .obp-heading button span{font-size:21px;vertical-align:-1px;}',
'#inicio .obp-work{width:100%;display:flex;gap:13px;align-items:center;text-align:left;margin-bottom:8px;background:#fff!important;color:#152331!important;padding:12px 14px;border:1px solid #e9edf2!important;border-radius:15px;box-shadow:0 2px 8px #18243209!important;}',
'#inicio .obp-work-icon{width:46px;height:46px;min-width:46px;display:grid;place-items:center;border-radius:11px;background:#f6f1e5;color:#c28c12;font-size:25px;}',
'#inicio .obp-work-main{flex:1;min-width:0;display:grid;gap:4px;}',
'#inicio .obp-work-main strong{font-size:14px;color:#152331;overflow:hidden;text-overflow:ellipsis;}',
'#inicio .obp-work-status{font-size:11px;color:#687788;}',
'#inicio .obp-progress{height:5px;width:100%;background:#e9edf2;border-radius:100px;display:block;overflow:hidden;}',
'#inicio .obp-progress i{display:block;background:#e5a923;height:100%;border-radius:100px;}',
'#inicio .obp-work-pct{font-size:12px;font-weight:800;color:#9b720f;min-width:32px;text-align:right;}',
'#inicio .obp-work-arrow{font-size:24px;color:#778391;}',
'#inicio .obp-activity,.obp-modal .obp-activity{display:flex;align-items:center;gap:11px;padding:13px 9px;border-bottom:1px solid #eef0f3;min-height:58px;}',
'.obp-activity-ico{font-size:21px;width:28px;min-width:28px;text-align:center;color:#bd8910;}',
'.obp-activity-name{font-size:13px;line-height:1.4;flex:1;font-weight:600;color:#253444;}',
'.obp-activity time{font-size:11px;color:#7c8793;white-space:nowrap;}',
'.obp-empty{color:#7e8995;padding:22px 14px;background:#f9fafb;border:1px solid #ebedf0;border-radius:14px;font-size:14px;}',
'.obp-modal{max-width:650px!important;width:min(94vw,650px)!important;max-height:85vh!important;overflow:hidden;background:#fff!important;color:#142333!important;}',
'.obp-modal-head{display:flex;align-items:center;justify-content:space-between;padding:5px 2px 12px;}',
'.obp-modal-head h2{margin:0!important;font-size:21px;}',
'.obp-modal-head button{background:transparent!important;border:0!important;color:#182331!important;font-size:30px;}',
'.obp-modal-body{max-height:62vh;overflow-y:auto;}',
'#equipe>.hero,#equipe>.sectionHead,#equipe>.obrix-equipe-controles,#equipe #listaEquipe{display:none!important;}',
'#equipe .obp-team-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:17px;}',
'#equipe .obp-team-header h1{font-weight:800;font-size:28px;letter-spacing:-.04em;margin:0;color:#152331;}',
'#equipe #obpNovo{border:0!important;background:#eab72a!important;color:#202020!important;font-size:14px;font-weight:800;border-radius:12px;padding:12px 15px;}',
'#equipe .obp-team-search{display:flex;align-items:center;gap:10px;padding:0 15px;margin:0 0 15px;border:1px solid #dbe2ea;border-radius:13px;height:48px;background:#fff;}',
'#equipe .obp-team-search span{font-size:27px;color:#768797;}',
'#equipe #obpBuscarFunc{width:100%;background:transparent!important;border:0!important;outline:0!important;color:#122233!important;font-size:14px;margin:0;padding:0;}',
'#equipe .obp-filters{display:flex;gap:7px;overflow-x:auto;margin-bottom:20px;}',
'#equipe .obp-filters button{white-space:nowrap;border:1px solid #e2e7ed!important;background:#fff!important;color:#556272!important;border-radius:999px;padding:9px 15px;font-size:12px;font-weight:800;}',
'#equipe .obp-filters button.active{border-color:#e9b72c!important;background:#fff6dc!important;color:#75550d!important;}',
'#equipe .obp-team-layout{display:grid;grid-template-columns:minmax(235px,.82fr) minmax(0,1.3fr);gap:18px;align-items:start;}',
'#equipe .obp-team-list{display:flex;flex-direction:column;gap:8px;}',
'#equipe .obp-person{display:flex;align-items:center;gap:10px;min-width:0;width:100%;text-align:left;padding:12px;background:#fff!important;border:1px solid #e9edf2!important;border-radius:14px;box-shadow:0 1px 5px #17202b0b!important;color:#162331!important;}',
'#equipe .obp-person.selected{border-color:#e6b737!important;background:#fffcf4!important;}',
'#equipe .obp-avatar{width:42px;height:42px;min-width:42px;display:grid;place-items:center;border-radius:13px;background:#fcf3dc;color:#b4871a;font-size:18px;font-weight:800;}',
'#equipe .obp-avatar.large{width:54px;height:54px;min-width:54px;font-size:24px;}',
'#equipe .obp-person-text{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;}',
'#equipe .obp-person-text strong{font-size:14px;color:#192b3a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
'#equipe .obp-person-text small{font-size:11px;color:#74818f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
'#equipe .obp-pill{font-size:10px;border-radius:999px;background:#e6f8ec;color:#237544;padding:5px 9px;font-weight:800;}',
'#equipe .obp-pill.off{background:#f0f2f5;color:#6b7280;}',
'#equipe .obp-chevron{font-size:21px;color:#9aa5b0;}',
'#equipe .obp-team-detail{min-height:330px;background:#fff;border:1px solid #e9edf2;border-radius:17px;padding:20px;box-shadow:0 2px 10px #17202b0b;}',
'#equipe .obp-back{display:none;border:0!important;background:none!important;color:#926e18!important;font-weight:800;margin-bottom:15px;}',
'#equipe .obp-detail-top{display:flex;align-items:center;gap:12px;padding-bottom:16px;border-bottom:1px solid #eef0f3;}',
'#equipe .obp-detail-top>div{flex:1;min-width:0;}',
'#equipe .obp-detail-top h2{font-size:21px;font-weight:800;color:#192633;margin:0 0 4px;}',
'#equipe .obp-detail-top p{font-size:12px;color:#71808d;margin:0;}',
'#equipe .obp-tabs{display:flex;gap:5px;overflow-x:auto;padding:13px 0;border-bottom:1px solid #eef0f3;}',
'#equipe .obp-tabs button{white-space:nowrap;font-size:11px;padding:9px 10px;border:0!important;border-radius:8px;background:transparent!important;color:#667584!important;font-weight:800;}',
'#equipe .obp-tabs button.active{background:#fff2c9!important;color:#806016!important;}',
'#equipe .obp-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:16px 0 18px;}',
'#equipe .obp-metric{border:1px solid #eef0f3;background:#fbfcfd;border-radius:12px;padding:12px;min-width:0;}',
'#equipe .obp-metric.highlight{background:#fff8e7;border-color:#f4dfac;}',
'#equipe .obp-metric small{display:block;color:#74808b;font-size:11px;line-height:1.3;margin-bottom:6px;}',
'#equipe .obp-metric strong{font-size:17px;color:#152331;overflow-wrap:anywhere;}',
'#equipe .obp-team-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:18px 0 0;}',
'#equipe .obp-team-actions button{border:1px solid #eadcae!important;background:#fff8e5!important;color:#765b14!important;border-radius:10px;padding:11px 5px;font-weight:800;font-size:11px;}',
'#equipe .obp-team-actions button:first-child{background:#eab72a!important;color:#202020!important;}',
'#equipe .obp-team-footer{display:flex;gap:12px;flex-wrap:wrap;padding-top:15px;margin-top:17px;border-top:1px solid #eef0f3;}',
'#equipe .obp-team-footer button,#equipe .obp-secondary{border:0!important;background:none!important;color:#876919!important;font-size:12px;font-weight:800;padding:8px 0;}',
'#equipe .obp-records{padding:7px 0 12px;}',
'#equipe .obp-records>div{display:flex;justify-content:space-between;gap:10px;padding:11px 0;border-bottom:1px solid #eef0f3;}',
'#equipe .obp-records b{font-size:13px;}',
'#equipe .obp-records small{display:block;color:#74808b;font-size:11px;margin-top:4px;}',
'#equipe .obp-records strong{font-size:13px;white-space:nowrap;}',
'#equipe .obp-history p{font-size:13px;color:#7c8793;}',
'@media(max-width:720px){#inicio #obpHome,#equipe #obpEquipe{padding:12px 10px 28px;}#inicio .obp-shortcuts{gap:7px;}#inicio .obp-shortcuts button{min-height:75px;font-size:11px;padding:10px 2px;}#inicio .obp-heading h2{font-size:17px;}#equipe .obp-team-layout{display:block;}#equipe .obp-team-detail{display:none;}#equipe.obp-team-selected #obpEquipe>.obp-team-header,#equipe.obp-team-selected #obpEquipe>.obp-team-search,#equipe.obp-team-selected #obpEquipe>.obp-filters,#equipe.obp-team-selected #obpFuncionarios{display:none!important;}#equipe.obp-team-selected #obpDetalhe{display:block;}#equipe .obp-back{display:inline-flex;}#equipe .obp-team-detail{padding:14px;}#equipe .obp-team-actions{grid-template-columns:repeat(2,minmax(0,1fr));}#inicio .obp-work-icon{width:38px;height:38px;min-width:38px;}#inicio .obp-activity time{font-size:10px;}}'
].join('\n');
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
  setTimeout(atualizar,1200);setTimeout(atualizar,3200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
window.OBRIX_PREVIEW={refresh:atualizar,openActivity:abrirAtualizacoes};
})();