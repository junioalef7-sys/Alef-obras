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
let eventosRemotos=[],eventosAtualizados=0,buscandoEventos=false,selecionado='',filtro='todos',buscaEquipe='',aba='resumo',modalAberto=false,agendado=false,buscaEquipeTimer=0;
let posicaoEquipeAnterior={id:'',rolagem:0,topo:0};
function primeiroNome(){
  let raw='';
  try{raw=(typeof profile!=='undefined'&&profile?.nome)||''}catch(_){}
  if(!raw)raw=$('usuario')?.textContent||'';
  if(!raw)try{raw=JSON.parse(localStorage.getItem('obrix_offline_identity_v1')||'null')?.nome||''}catch(_){}
  if(!raw)try{raw=JSON.parse(localStorage.getItem('obrix_offline_base_v3')||'null')?.profile?.nome||''}catch(_){}
  const nome=String(raw||'').trim().split(/\s+/)[0];
  return nome&& !nome.includes('@')?nome:'';
}
const JANELA_ATUALIZACOES_MS=30*24*60*60*1000;
function atividades(){
  const a=[],agora=Date.now();
  const push=(key,txt,date,icon)=>{
    const t=dataHora(date);
    // Unificar registros locais e remotos, independentemente do periodo.
    if(t>0&&t<=agora+60000)a.push({key,txt,date,t,icon});
  };
  const nomes=new Map(funcs().map(f=>[String(f.id),f.nome||'Funcionário']));
  const nomesObra=new Map(obras().map(o=>[String(o.id),o.nome||'Obra']));
  obras().forEach(o=>push('obra:'+o.id,'Obra atualizada: '+(o.nome||'Obra'),o.atualizado_em||o.criado_em,'▤'));
  lista('diarias').forEach(d=>{
    const data=d.criado_em||d.created_at||d.data;
    const t=dataHora(data);
    if(t<=0||t>agora+60000)return;
    push('diaria:'+d.id,'Diária registrada: '+(nomes.get(String(d.funcionario_id))||'Funcionário')+' · '+(nomesObra.get(String(d.obra_id))||'Sem obra vinculada'),data,'◷');
  });
  eventosRemotos.forEach(e=>push(e.key,e.txt,e.date,e.icon));
  eventosLocais().forEach(e=>push(e.key,e.txt,e.date,e.icon));
  const uniq=new Map();a.sort((x,y)=>y.t-x.t).forEach(x=>{if(!uniq.has(x.key))uniq.set(x.key,x)});
  return [...uniq.values()].slice(0,500);
}
function atividadeHTML(e){
  const raw=String(e.txt||'Atualização'),colon=raw.indexOf(': '),dot=raw.indexOf(' · ');
  const split=colon>0&&colon<50?colon:dot>0&&dot<50?dot:-1;
  const title=split>0?raw.slice(0,split):raw;
  const detail=split>0?raw.slice(split+(split===colon?2:3)):'';
  return '<article class="obp-activity"><span class="obp-activity-ico" aria-hidden="true">'+esc(e.icon)+'</span><div class="obp-activity-body"><strong class="obp-activity-name">'+esc(title)+'</strong>'+(detail?'<span class="obp-activity-detail">'+esc(detail)+'</span>':'')+'<time>'+esc(formatarData(e.date))+'</time></div></article>';
}
function obrasMaisMovimentadas(){
  // Atividade real dos últimos 30 dias: quantidade de diárias + lançamentos de despesas.
  // Apenas obras em andamento podem entrar nos três atalhos.
  const hoje=Date.now(),inicio=hoje-JANELA_ATUALIZACOES_MS;
  const grupos=obras().filter(emAndamento).map(obra=>({obra,quantidade:0,ultima:0}));
  const indice=new Map(grupos.map(grupo=>[String(grupo.obra.id),grupo]));
  const registrar=linha=>{
    const grupo=indice.get(String(linha?.obra_id||''));
    if(!grupo)return;
    const data=dataHora(linha?.data||linha?.criado_em||linha?.created_at);
    if(data<inicio||data>hoje+60000)return;
    grupo.quantidade++;
    grupo.ultima=Math.max(grupo.ultima,data);
  };
  lista('diarias').forEach(d=>{if(!d?.cancelada&&!d?.estornada)registrar(d)});
  lista('financeiro').forEach(f=>{
    if(f?.tipo!=='despesa')return;
    if(f.status_lancamento&&f.status_lancamento!=='ativo')return;
    registrar(f);
  });
  grupos.sort((a,b)=>b.quantidade-a.quantidade||b.ultima-a.ultima
    ||dataHora(b.obra.atualizado_em||b.obra.criado_em)-dataHora(a.obra.atualizado_em||a.obra.criado_em)
    ||String(a.obra.nome||'').localeCompare(String(b.obra.nome||''),'pt-BR'));
  return grupos.map(item=>item.obra);
}
function renderInicio(){
  const root=$('inicio');if(!root)return;
  if(!$('obpHome')||$('obpHome')?.querySelectorAll('.obp-shortcuts [data-short]').length!==4){
    root.innerHTML='<div id="obpHome"><div class="obp-greeting"><h1 id="obpOla">Olá</h1><span class="obp-greeting-mark"></span></div><div class="obp-shortcuts"><button type="button" data-short="nova"><span>＋</span>Nova obra</button><button type="button" data-short="notas"><span>✎</span>Notas</button><button type="button" data-short="relatorios"><span>▤</span>Relatórios</button><button type="button" data-short="foto"><span>▧</span>Foto</button></div><div class="obp-heading"><h2>Obras</h2><button type="button" data-home-all="obras">Ver todas <span>›</span></button></div><div id="obpObras"></div><div class="obp-heading"><h2>Últimas atualizações</h2><button type="button" data-home-all="atividades">Ver todas <span>›</span></button></div><div id="obpAtividades"></div></div>';
    if(root.dataset.obpClickBound!=='1'){root.addEventListener('click',cliqueInicio);root.dataset.obpClickBound='1'}
  }
  $('obpOla').textContent='Olá'+(primeiroNome()?', '+primeiroNome():'');
  const recentes=obrasMaisMovimentadas();
  // Preserve identical markup and touch handlers across repeated sync/page events.
  const obrasHtml=recentes.length?recentes.map(o=>{const p=progresso(o);return '<button type="button" class="obp-work" data-home-obra="'+esc(o.id)+'"><span class="obp-work-icon">▥</span><span class="obp-work-main"><strong>'+esc(o.nome||'Obra')+'</strong><span class="obp-progress"><i style="width:'+(p??0)+'%"></i></span></span><span class="obp-work-pct">'+(p===null?'—':p+'%')+'</span><span class="obp-work-arrow">›</span></button>'}).join(''):'<div class="obp-empty">Nenhuma obra em andamento.</div>';
  const obrasBox=$('obpObras');
  if(obrasBox&&obrasBox.__obpMarkup!==obrasHtml){obrasBox.innerHTML=obrasHtml;obrasBox.__obpMarkup=obrasHtml}
  const at=atividades().slice(0,5);
  const atividadesHtml=at.length?at.map(atividadeHTML).join(''):'<div class="obp-empty">Sem atualizações registradas.</div>';
  const atividadesBox=$('obpAtividades');
  if(atividadesBox&&atividadesBox.__obpMarkup!==atividadesHtml){atividadesBox.innerHTML=atividadesHtml;atividadesBox.__obpMarkup=atividadesHtml}
}
async function abrirObras(id){
  // Carrega o modulo antes da navegacao: o cartao ja abre os detalhes, nao a central.
  if(id)try{await window.OBRIX_POS_LOGIN_LOADER?.loadGroup?.('obras')}catch(e){console.warn('Obras: carregamento pendente',e)}
  if(typeof window.abrir==='function')window.abrir('obras');
  if(!id){window.OBRIX_OBRAS_FIEL?.list?.();return}
  const abrirDetalhe=()=>{
    if(window.OBRIX_OBRAS_FIEL?.open?.(id))return true;
    const btn=[...document.querySelectorAll('#listaObras [data-abrir]')]
      .find(b=>String(b.dataset.abrir)===String(id));
    if(btn){btn.click();return true}
    return false;
  };
  if(abrirDetalhe())return;
  // Fallback unico quando outro modulo ainda termina de montar a lista.
  requestAnimationFrame(()=>{
    if(!abrirDetalhe())console.warn('OBRIX: obra nao encontrada para abrir',id)
  });
}
async function abrirFotoAtalho(){
  // Relatorio fotografico exige uma obra; o atalho nao deve abrir um relatorio vazio.
  document.querySelector('.obp-foto-atalho')?.remove();
  const todas=obras().slice().sort((a,b)=>Number(emAndamento(b))-Number(emAndamento(a))||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
  if(!todas.length){
    if(window.OBRIX_AVISO)await window.OBRIX_AVISO('Cadastre uma obra para adicionar ou consultar fotos.','Fotos das obras');
    else abrirObras();
    return;
  }
  const back=document.createElement('div');
  back.className='modalBack obp-foto-atalho';
  back.innerHTML='<div class="modal obp-modal" role="dialog" aria-modal="true" aria-labelledby="obpFotoTitulo">'+
    '<div class="obp-modal-head"><h2 id="obpFotoTitulo">Foto</h2><button type="button" aria-label="Fechar" data-obp-foto-fechar>×</button></div>'+
    '<div class="obp-modal-body" style="display:grid;gap:12px;padding:15px">'+
    '<label for="obpFotoObra" style="font-weight:750">Selecione a obra</label>'+
    '<select id="obpFotoObra" style="box-sizing:border-box;width:100%;min-height:48px;padding:10px;border-radius:10px;border:1px solid var(--ob-border,#cbd5df);background:var(--ob-surface,#fff);color:var(--ob-text,#111827);font:inherit">'+
    todas.map(o=>'<option value="'+esc(o.id)+'">'+esc(o.nome||'Obra sem nome')+'</option>').join('')+
    '</select><button type="button" class="btn" data-obp-foto-abrir style="min-height:48px">Abrir fotos da obra</button></div></div>';
  document.body.appendChild(back);
  const fechar=()=>{document.removeEventListener('keydown',escaparFoto);back.remove()};
  const escaparFoto=e=>{if(e.key==='Escape')fechar()};
  document.addEventListener('keydown',escaparFoto);
  back.querySelector('[data-obp-foto-fechar]').onclick=fechar;
  back.addEventListener('click',e=>{if(e.target===back)fechar()});
  back.querySelector('[data-obp-foto-abrir]').onclick=async e=>{
    const id=back.querySelector('#obpFotoObra').value;
    const btn=e.currentTarget;
    btn.disabled=true;btn.textContent='Abrindo fotos...';
    try{
      if(!window.OBRIX_REL_FOTO?.open)await window.OBRIX_POS_LOGIN_LOADER?.loadGroup?.('obras');
      if(!window.OBRIX_REL_FOTO?.open)throw new Error('O relatório fotográfico não está disponível no momento.');
      fechar();
      await window.OBRIX_REL_FOTO.open(id);
    }catch(err){
      console.warn('Atalho Foto:',err);
      btn.disabled=false;btn.textContent='Abrir fotos da obra';
      if(window.OBRIX_AVISO)await window.OBRIX_AVISO(err?.message||'Não foi possível abrir as fotos.','Foto');
      else alert(err?.message||'Não foi possível abrir as fotos.');
    }
  };
}
async function acaoRapida(tipo){
  if(tipo==='foto'){await abrirFotoAtalho();return}
  if(tipo==='nova'){abrirObras();try{await window.OBRIX_POS_LOGIN_LOADER?.loadGroup?.('obras')}catch(_){}setTimeout(()=>window.OBRIX_OBRAS?.nova?.(),150);return}
  if(['notas','relatorios','diario'].includes(tipo)){
    // Use the same lazy-loading route as the app menu; opening a shortcut
    // must actually open the intended module, not just navigate to Obras.
    if(window.OBRIX_MENU?.go){await window.OBRIX_MENU.go(tipo);return}
    try{await window.OBRIX_POS_LOGIN_LOADER?.loadFeature?.(tipo);
      const key={notas:'OBRIX_NOTAS',relatorios:'OBRIX_RELATORIOS',diario:'OBRIX_DIARIO'}[tipo];
      if(window[key]?.open){await window[key].open();return}
    }catch(e){console.warn('Atalho OBRIX:',tipo,e)}
    window.OBRIX_MENU?.open?.();
  }
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
  const a=atividades().filter(item=>item.t>=Date.now()-JANELA_ATUALIZACOES_MS),back=document.createElement('div');back.className='modalBack obp-activities-modal';
  back.innerHTML='<div class="modal obp-modal"><div class="obp-modal-head"><h2>Últimas atualizações</h2><button type="button" aria-label="Fechar" data-close>×</button></div><div class="obp-modal-body">'+(a.length?a.map(atividadeHTML).join(''):'<p>Sem atualizações registradas.</p>')+'</div></div>';
  document.body.appendChild(back);back.querySelector('[data-close]').onclick=()=>back.remove();
  back.addEventListener('click',e=>{if(e.target===back)back.remove()});
  // Ver todas consulta o histórico completo somente sob demanda.
  // Não aumentar consultas do início em segundo plano.
  void (async()=>{
    try{
      const [sb,p]=await Promise.all([window.OBRIX_BACKEND?.init?.(),window.OBRIX_BACKEND?.profile?.()]);
      if(!sb||!p?.empresa_id||!back.isConnected)return;
      const r=await sb.rpc('obrix_feed_geral',{p_limite:300});
      if(r.error)throw r.error;
      const remotos=(r.data||[]).map(e=>({
        key:String(e.chave||''),txt:String(e.texto||'Atualização do aplicativo'),
        date:e.data_evento,icon:e.icone||'▤'
      })).map(e=>({...e,key:e.key.startsWith('obras:')?'obra:'+e.key.slice(6):
        e.key.startsWith('diarias:')?'diaria:'+e.key.slice(8):e.key}));
      if(!back.isConnected)return;
      const anteriores=eventosRemotos;
      eventosRemotos=remotos;
      const historico=atividades().filter(item=>item.t>=Date.now()-JANELA_ATUALIZACOES_MS);
      eventosRemotos=anteriores;
      const corpo=back.querySelector('.obp-modal-body');
      if(corpo)corpo.innerHTML=historico.length?historico.map(atividadeHTML).join(''):'<p>Sem atualizações nos últimos 30 dias.</p>';
    }catch(e){console.warn('Histórico dos últimos 30 dias indisponível; exibindo registros carregados',e)}
  })();
}
const ATIVIDADES_LOCAL_PREFIX='obrix_atividades_locais_v1_';
let feedTimer=0;
function eventosLocais(){
  try{
    const eid=(JSON.parse(localStorage.getItem('obrix_offline_identity_v1')||'null')||{}).empresa_id||'';
    if(!eid)return[];
    const arr=JSON.parse(localStorage.getItem(ATIVIDADES_LOCAL_PREFIX+eid)||'[]');
    return Array.isArray(arr)?arr.slice(0,30):[];
  }catch(_){return[]}
}
function registrarAtividadeLocal(texto,tipo='backup',empresa=''){
  try{
    const eid=empresa||JSON.parse(localStorage.getItem('obrix_offline_identity_v1')||'null')?.empresa_id;
    if(!eid)return false;
    const chave=ATIVIDADES_LOCAL_PREFIX+eid;
    const arr=JSON.parse(localStorage.getItem(chave)||'[]');
    const ev={key:'local:'+Date.now()+':'+Math.random().toString(36).slice(2,7),
      txt:String(texto||'Atividade do aplicativo').slice(0,180),
      date:new Date().toISOString(),icon:tipo==='backup'?'▣':'▤'};
    localStorage.setItem(chave,JSON.stringify([ev,...(Array.isArray(arr)?arr:[])].slice(0,30)));
    if(secaoVisivel('inicio'))renderInicio();
    return true;
  }catch(e){console.warn('Atividade local nao salva',e);return false}
}
window.OBRIX_ATIVIDADES_LOCAL={registrar:registrarAtividadeLocal};
async function buscarEventos(force=false){
  if(buscandoEventos||document.hidden||!navigator.onLine||!$('app')||$('app').classList.contains('hidden'))return;
  const minimo=force?8000:60000;
  if(Date.now()-eventosAtualizados<minimo)return;
  buscandoEventos=true;
  const agora=Date.now();
  try{
    const sb=await window.OBRIX_BACKEND?.init?.();
    const p=await window.OBRIX_BACKEND?.profile?.();
    if(!sb||!p?.empresa_id)return;
    const r=await sb.rpc('obrix_feed_geral',{p_limite:40});
    if(r.error)throw r.error;
    eventosRemotos=(r.data||[]).map(e=>({
      key:String(e.chave||''),
      txt:String(e.texto||'Atualizacao do aplicativo'),
      date:e.data_evento,icon:e.icone||'▤'
    })).map(e=>({...e,key:e.key.startsWith('obras:')?'obra:'+e.key.slice(6):
        e.key.startsWith('diarias:')?'diaria:'+e.key.slice(8):e.key}));
    eventosAtualizados=agora;
    if(secaoVisivel('inicio'))renderInicio();
  }catch(e){
    console.warn('Historico geral: consulta adiada',e);
    // Nao apagar eventos ja obtidos em caso de falha temporaria.
    eventosAtualizados=agora-50000;
  }finally{buscandoEventos=false}
}
function arrEquipe(tipo,id){return lista(tipo).filter(x=>String(x.funcionario_id)===String(id))}

const obpFaltasCache=new Map();
async function obpBuscarFaltas(id,force=false){
  const chave=String(id),cache=obpFaltasCache.get(chave);
  if(cache?.promise)return cache.promise;
  if(!force&&cache?.updated&&Date.now()-cache.updated<12000){
    if(cache.error)throw cache.error;
    return cache.rows||[];
  }
  const promise=(async()=>{
    if(!navigator.onLine)throw Error('Sem conexão para consultar as faltas.');
    const backend=window.OBRIX_BACKEND;
    if(!backend)throw Error('Conexão indisponível.');
    const p=await backend.profile(),sb=await backend.init();
    if(!p?.empresa_id)throw Error('Conta não identificada.');
    const r=await sb.from('faltas').select('id,obra_id,data,justificada,motivo,observacoes,criado_em')
      .eq('empresa_id',p.empresa_id).eq('funcionario_id',chave).order('data',{ascending:false});
    if(r.error)throw r.error;
    return r.data||[];
  })();
  obpFaltasCache.set(chave,{...cache,promise,updated:Date.now()});
  try{
    const rows=await promise;
    if(obpFaltasCache.get(chave)?.promise===promise)obpFaltasCache.set(chave,{rows,updated:Date.now()});
    return rows;
  }catch(error){
    if(obpFaltasCache.get(chave)?.promise===promise)obpFaltasCache.set(chave,{rows:cache?.rows,error,updated:Date.now()});
    throw error;
  }
}
// Faltas não são liquidadas no banco: o histórico conserva todas as linhas.
// Somente o contador considera o ciclo aberto, encerrado pelo último pagamento.
const obpUltimoPagamentoCache=new Map();
const obpDiariasAbertasCache=new Map();
let obpFaltasVisualSeq=0;
async function obpUltimoPagamento(id,force=false){
  const chave=String(id),cache=obpUltimoPagamentoCache.get(chave);
  if(cache?.promise)return cache.promise;
  if(!force&&cache&&Date.now()-cache.updated<20000){
    if(cache.error)throw cache.error;
    return cache.item;
  }
  const promise=(async()=>{
    if(!navigator.onLine)throw Error('Sem conexão para consultar pagamentos.');
    const backend=window.OBRIX_BACKEND;
    if(!backend)throw Error('Conexão com o banco indisponível.');
    const p=await backend.profile(),sb=await backend.init();
    if(!p?.empresa_id)throw Error('Conta não identificada.');
    const r=await sb.from('pagamentos_equipe')
      .select('id,data_pagamento,criado_em')
      .eq('empresa_id',p.empresa_id).eq('funcionario_id',chave)
      .is('estornado_em',null).order('criado_em',{ascending:false}).limit(1);
    if(r.error)throw r.error;
    return r.data?.[0]||null;
  })();
  obpUltimoPagamentoCache.set(chave,{item:cache?.item,promise,updated:Date.now()});
  try{
    const item=await promise;
    if(obpUltimoPagamentoCache.get(chave)?.promise===promise)obpUltimoPagamentoCache.set(chave,{item,updated:Date.now()});
    return item;
  }catch(error){
    if(obpUltimoPagamentoCache.get(chave)?.promise===promise)obpUltimoPagamentoCache.set(chave,{error,updated:Date.now()});
    throw error;
  }
}
// As faltas do ciclo atual começam após o último pagamento não estornado.
// A data civil do pagamento pode estar um dia à frente do registro local
// quando o sistema antigo gravou dates usando toISOString() em UTC.
// Preferir a ordem dos eventos de gravação (criado_em) evita descartar a falta
// registrada no mesmo dia local após a baixa da equipe.
function obpContarFaltasPeriodo(id,faltas,pagamento){
  const tPagamento=Date.parse(pagamento?.criado_em||'');
  const temPagamento=!!pagamento;
  const dataPagamento=String(pagamento?.data_pagamento||'').slice(0,10);
  return (faltas||[]).filter(f=>{
    const data=String(f.data||'').slice(0,10);
    if(!data)return false;
    if(!temPagamento)return true;
    const tFalta=Date.parse(f.criado_em||'');
    if(Number.isFinite(tPagamento)&&Number.isFinite(tFalta)){
      // Registro criado antes de pagar pertence ao histórico já encerrado;
      // registros novos formam um novo ciclo mesmo sem diárias lançadas.
      return tFalta>tPagamento;
    }
    // Compatibilidade com registros antigos que não têm timestamps.
    return !!dataPagamento&&data>dataPagamento;
  }).length;
}
async function obpFaltasPeriodo(id,linhas){
  const pagamento=await obpUltimoPagamento(id);
  return obpContarFaltasPeriodo(id,linhas,pagamento);
}
function obpAtualizarFaltas(id){
  const chave=String(id),el=document.getElementById('obpFaltasTotal');
  if(!el||chave!==String(selecionado))return;
  // A lista de diárias não é pré-condição: é possível registrar uma falta
  // antes de lançar a próxima diária do novo ciclo.
  const abertas=arrEquipe('diarias',id).filter(d=>!d.paga)
    .map(d=>String(d.id)).sort().join('|');
  const anterior=obpDiariasAbertasCache.get(chave);
  if(anterior!==abertas){
    obpDiariasAbertasCache.set(chave,abertas);
    // Mudança de folha exige recarregar a referência de último pagamento.
    obpUltimoPagamentoCache.delete(chave);
    obpFaltasCache.delete(chave);
  }
  const atualizarNumero=valor=>{if(el.textContent!==valor)el.textContent=valor};
  const cache=obpFaltasCache.get(chave),pagCache=obpUltimoPagamentoCache.get(chave);
  if(cache?.rows&&pagCache&&!pagCache.error&&!pagCache.promise)
    atualizarNumero(String(obpContarFaltasPeriodo(id,cache.rows,pagCache.item)));
  void Promise.all([obpBuscarFaltas(id),obpUltimoPagamento(id)])
    .then(([faltas,pagamento])=>{
      const atual=document.getElementById('obpFaltasTotal');
      if(atual&&chave===String(selecionado)){
        const valor=String(obpContarFaltasPeriodo(id,faltas,pagamento));
        if(atual.textContent!==valor)atual.textContent=valor;
      }
    }).catch(error=>{
      const atual=document.getElementById('obpFaltasTotal');
      if(atual&&chave===String(selecionado)){
        if(!atual.textContent.trim())atual.textContent='—';
        console.warn('Faltas do período: consulta indisponível',error);
      }
    });
}

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
let modoExclusaoLista=false,modoAtivacaoLista=false;
function renderEquipe(){
  const sec=$('equipe');if(!sec)return;
  // O botão de cadastro fica dentro da Equipe Premium, fora do cartão de título.
  let box=$('obpEquipe');
  if(!box){
    box=document.createElement('div');box.id='obpEquipe';
    box.innerHTML='<div id="obpTeamDirectory"><label class="obp-team-search"><span>⌕</span><input type="search" id="obpBuscarFunc" placeholder="Buscar funcionário..." autocomplete="off"></label><nav id="obpFiltros" class="obp-filters" aria-label="Filtrar funcionários"></nav><section class="obp-group-summary"><h2>Gestão da equipe</h2><div id="obpIndicadores" class="obp-indicadores obp-indicadores-principais"></div><button type="button" id="obpExpandir" aria-expanded="false" aria-controls="obpResumoExtras">Ver resumo ▾</button><div id="obpResumoExtras" class="obp-indicadores obp-indicadores-extras" hidden></div></section><div class="obp-group-actions"><button type="button" id="obpPagarEquipe">▤ Pagar equipe</button><button type="button" id="obpHistoricoPag">▣ Histórico</button></div><div class="obp-list-header"><h2 id="obpTotalPessoas">Funcionários</h2><button id="obpGerenciar" type="button" aria-expanded="false">⚙ Gerenciar⌄</button></div><div id="obpGerenciarMenu" class="obp-manager-menu" hidden><button type="button" data-manager="toggle">Ativo / Inativo</button><button type="button" data-manager="excluir">Excluir funcionário</button><button type="button" data-manager="lista">Funcionários</button></div><div id="obpFuncionarios" class="obp-team-list"></div></div><div id="obpDetalhe" class="obp-team-detail" hidden></div>';
    sec.insertBefore(box,sec.querySelector('#listaEquipe')||null);
    box.addEventListener('click',cliqueEquipe);
    $('obpBuscarFunc').addEventListener('input',e=>{buscaEquipe=e.target.value;clearTimeout(buscaEquipeTimer);buscaEquipeTimer=setTimeout(renderEquipe,140)});
  }
  if(!box.querySelector('#obpNovo')){
    const novo=document.createElement('button');
    novo.type='button';novo.id='obpNovo';novo.className='obp-novo-superior';
    novo.textContent='+ Novo funcionário';novo.setAttribute('aria-label','Novo funcionário');
    // O click já é atendido por cliqueEquipe no contêiner; evita acionamento duplicado.
    box.insertBefore(novo,box.firstChild);
  }
  const fs=funcs(),q=buscaEquipe.trim().toLocaleLowerCase('pt-BR');
  const filtrados=fs.filter(f=>(filtro==='todos'||(filtro==='ativos'&&f.ativo!==false)||(filtro==='inativos'&&f.ativo===false))&&(!q||String(f.nome||'').toLocaleLowerCase('pt-BR').includes(q)||String(f.cargo||f.funcao||'').toLocaleLowerCase('pt-BR').includes(q)));
  const total=resumoTotal();
  const filtrosHtml=[['todos','Todos',fs.length],['ativos','Ativos',fs.filter(f=>f.ativo!==false).length],['inativos','Inativos',fs.filter(f=>f.ativo===false).length]]
    .map(a=>'<button type="button" data-team-filter="'+a[0]+'" class="'+(filtro===a[0]?'active':'')+'">'+a[1]+' ('+a[2]+')</button>').join('');
  const filtrosEl=$('obpFiltros');
  if(filtrosEl.__obpMarkup!==filtrosHtml){filtrosEl.innerHTML=filtrosHtml;filtrosEl.__obpMarkup=filtrosHtml}
  const kpiHtml=indicador('Bruto da folha',dinheiro(total.bruto),'obp-bruto','▤')+indicador('Líquido a pagar',dinheiro(total.liquido),'obp-liquido','✓');
  const kpiEl=$('obpIndicadores');
  if(kpiEl.__obpMarkup!==kpiHtml){kpiEl.innerHTML=kpiHtml;kpiEl.__obpMarkup=kpiHtml}
  const extras=$('obpResumoExtras');
  if(extras.hidden===resumoExpandido)extras.hidden=!resumoExpandido;
  const extrasHtml=resumoExpandido?indicador('Funcionários ativos',total.ativos,'obp-ativos','♟')+indicador('Diárias em aberto',dinheiro(total.diarias),'obp-diarias','▣')+indicador('Vales em aberto',dinheiro(total.vales),'obp-vales','▰')+indicador('Bônus e extras',dinheiro(total.bonus),'obp-bonus','✦')+indicador('Total pago (histórico)',dinheiro(total.pago),'obp-pago','✓'):'';
  if(extras.__obpMarkup!==extrasHtml){extras.innerHTML=extrasHtml;extras.__obpMarkup=extrasHtml}
  const btnExpandir=$('obpExpandir'),expandirLabel=resumoExpandido?'Ocultar resumo ▴':'Ver resumo ▾';
  if(btnExpandir.textContent!==expandirLabel)btnExpandir.textContent=expandirLabel;
  if(btnExpandir.getAttribute('aria-expanded')!==String(resumoExpandido))btnExpandir.setAttribute('aria-expanded',String(resumoExpandido));
  const totalPessoas=$('obpTotalPessoas'),pessoasLabel='Funcionários ('+filtrados.length+')';
  if(totalPessoas.textContent!==pessoasLabel)totalPessoas.textContent=pessoasLabel;
  const menuGestao=$('obpGerenciarMenu');
  if(menuGestao.hidden===gerenciarAberto)menuGestao.hidden=!gerenciarAberto;
  const btnGerenciar=$('obpGerenciar');
  if(btnGerenciar.getAttribute('aria-expanded')!==String(gerenciarAberto))btnGerenciar.setAttribute('aria-expanded',String(gerenciarAberto));
  const funcionariosHtml=filtrados.length?filtrados.map(f=>{
    const ficha='<button type="button" class="obp-person" data-team-id="'+esc(f.id)+'"><span class="obp-avatar">♟</span><span class="obp-person-text"><strong>'+esc(f.nome||'Funcionário')+'</strong><small>'+esc(f.cargo||f.funcao||'Função não informada')+'</small></span><span class="obp-chevron">›</span></button>';
    // O controle Ativo/Inativo do menu Gerenciar habilita a edição de status.
    // A lista normal não mostra botões Ativar/Desativar permanentes.
    if(modoExclusaoLista)return '<div class="obp-excluir-linha">'+ficha+'<button type="button" class="obp-excluir-da-lista" data-team-delete="'+esc(f.id)+'">Excluir</button></div>';
    if(modoAtivacaoLista)return '<div class="obp-excluir-linha">'+ficha+'<button type="button" class="obp-estado-da-lista" data-team-toggle="'+esc(f.id)+'">'+(f.ativo===false?'Ativar':'Desativar')+'</button></div>';
    return ficha;
  }).join(''):'<div class="obp-empty">Nenhum funcionário encontrado.</div>';
  const listaFuncionarios=$('obpFuncionarios');
  if(listaFuncionarios.__obpUltimoHtml!==funcionariosHtml){listaFuncionarios.innerHTML=funcionariosHtml;listaFuncionarios.__obpUltimoHtml=funcionariosHtml}
  const f=acharFunc(selecionado);
  const detalhe=$('obpDetalhe'),diretorio=$('obpTeamDirectory');
  if(!f){diretorio.hidden=false;detalhe.hidden=true;detalhe.innerHTML='';sec.classList.remove('obp-team-selected');return}
  diretorio.hidden=true;detalhe.hidden=false;sec.classList.add('obp-team-selected');
  const r=resumoEquipe(f);
  const base=String(f.tipo_pagamento)==='mes'?Number(f.salario_mensal||0):Number(f.valor_diaria||0);
  const totalPago=window.OBRIX_EQUIPE_TOTAL_PAGO?.get?.(f.id);
  const equivalentes=String(r.completas+r.meias/2).replace('.',',');
  const detalheHtml='<div class="obp-detail-bar"><button type="button" data-team-back aria-label="Voltar à lista">‹</button><span>'+esc(f.nome||'Funcionário')+'</span><button type="button" data-team-action="editar" aria-label="Editar funcionário">✎</button></div>'+
    '<div class="obp-perfil-topo"><span class="obp-perfil-avatar" aria-hidden="true">♟</span><div class="obp-perfil-texto"><h2 class="obp-full-name">'+esc(f.nome||'Funcionário')+'</h2><div class="obp-role">'+esc(f.cargo||f.funcao||'Função não informada')+'</div></div><span class="obp-perfil-situacao">'+(f.ativo===false?'Inativo':'Ativo')+'</span></div>'+
    '<div class="obp-perfil-pagamento"><small>'+esc(tipoPagamento(f))+' · '+esc(nomeObra(f.obra_id))+'</small><strong>'+esc(dinheiro(base))+'</strong></div>'+
    '<div class="obp-person-metrics obp-detail-finance">'+
      '<div><small>Total bruto</small><b>'+esc(dinheiro(r.bruto))+'</b></div>'+
      '<div><small>Vale em aberto</small><b>'+esc(dinheiro(r.vale))+'</b></div>'+
      '<div><small>Líquido a pagar</small><b>'+esc(dinheiro(r.liquido))+'</b></div>'+
      '<div><small>Total pago</small><b>'+esc(totalPago==null?'—':dinheiro(totalPago))+'</b></div>'+
      '<div><small>Bônus / Extras em aberto</small><b>'+esc(dinheiro(r.bonus))+'</b></div>'+
      '<div><small>Diárias em aberto</small><b>'+esc(equivalentes)+'</b></div>'+
    '</div>'+
    '<div class="obp-attendance-cards">'+
      '<div class="obp-attendance-card"><span aria-hidden="true">▣</span><div><small>Diárias em aberto</small><strong>Inteiras: '+r.completas+'</strong><strong>Meias: '+r.meias+'</strong></div></div>'+
      '<div class="obp-attendance-card obp-attendance-absence"><span aria-hidden="true">⊗</span><div><small>Faltas</small><strong>Total: <b id="obpFaltasTotal">—</b></strong></div></div>'+
    '</div>'+
    '<button type="button" class="obp-registros-principal" data-team-action="historico" style="background:#103e7b!important;background-color:#103e7b!important;background-image:none!important;border-color:#103e7b!important;color:#fff!important;-webkit-text-fill-color:#fff!important;opacity:1!important;filter:none!important">☷ <span>Ver registros (Histórico)</span><b>›</b></button>'+
    '<div class="obp-person-actions">'+
      botaoAcaoEquipe('obp-diaria','diaria','Registrar diária','#1169d8')+
      botaoAcaoEquipe('obp-falta','falta','Registrar falta','#e53935')+
      botaoAcaoEquipe('obp-vale','vale','Registrar vale','#139e37')+
      botaoAcaoEquipe('obp-bonus','bonus','Bônus / Extras','#eba200','#172331')+
      botaoAcaoEquipe('obp-pagar','pagar','Pagar','#123c74')+'</div>';
  // Never recreate the five buttons for the same employee when monetary
  // values or the team data are refreshed. Retain their nodes and inline colors.
  if(detalhe.__obpLastHtml!==detalheHtml||!detalhe.querySelector('.obp-person-actions')){
    const mesmoFuncionario=detalhe.__obpEmployeeId===String(f.id);
    const antigos=mesmoFuncionario?detalhe.querySelector('.obp-person-actions'):null;
    const contadorAntigo=mesmoFuncionario?detalhe.querySelector('.obp-attendance-absence'):null;
    const registrosAntigo=mesmoFuncionario?detalhe.querySelector('.obp-registros-principal'):null;
    if(antigos){
      const novo=document.createElement('div');
      novo.innerHTML=detalheHtml;
      novo.querySelector('.obp-person-actions')?.replaceWith(antigos);
      // Não recriar o botão de histórico nem o cartão de faltas em cada atualização.
      if(registrosAntigo)novo.querySelector('.obp-registros-principal')?.replaceWith(registrosAntigo);
      if(contadorAntigo)novo.querySelector('.obp-attendance-absence')?.replaceWith(contadorAntigo);
      detalhe.replaceChildren(...novo.childNodes);
    }else{
      detalhe.innerHTML=detalheHtml;
    }
    detalhe.__obpEmployeeId=String(f.id);
    detalhe.__obpLastHtml=detalheHtml;
  }
  obpAtualizarFaltas(f.id);
}

/* Employee records are rendered by the premium interface itself.
   Previously the action proxied a hidden legacy card and could show a stale modal. */
async function abrirRegistrosEquipePremium(id){
  const func=acharFunc(id);
  if(!func){if(window.OBRIX_AVISO)await window.OBRIX_AVISO('Funcionário não encontrado.');return}
  document.querySelectorAll('.obp-registros-premium-modal').forEach(m=>m.remove());
  const back=document.createElement('div');back.className='modalBack obp-registros-premium-modal';
  back.innerHTML='<div class="modal obp-registros-tela" role="dialog" aria-modal="true" aria-labelledby="obpRegistroTitulo">'+
    '<header class="obp-registros-topo"><button type="button" aria-label="Voltar ao funcionário" data-obp-fechar>‹</button><h2 id="obpRegistroTitulo">Registros de '+esc(func.nome||'Funcionário')+'</h2><span aria-hidden="true"></span></header>'+
    '<nav class="obp-registros-tabs" aria-label="Filtrar registros">'+
    '<button type="button" data-obp-tab="historico" class="active">Histórico</button>'+
    '<button type="button" data-obp-tab="diarias">Diárias</button>'+
    '<button type="button" data-obp-tab="faltas">Faltas</button>'+
    '<button type="button" data-obp-tab="pagamentos">Pagamentos</button></nav>'+
    '<div class="obp-registros-busca-box"><label for="obpRegistrosBuscaPremium">Buscar registros</label><input id="obpRegistrosBuscaPremium" type="search" data-obp-busca placeholder="Data, obra, tipo, valor ou situação..." autocomplete="off"><small data-obp-busca-contador aria-live="polite"></small></div>'+
    '<div class="obp-registros-indicadores" data-obp-kpis></div>'+
    '<h3>Histórico de registros</h3><p class="obp-registros-aviso" data-obp-aviso hidden></p>'+
    '<div class="obp-registros-lista" data-obp-linhas>Carregando registros...</div>'+
    '<button type="button" class="obp-registros-mais" data-obp-mais hidden>Mostrar mais registros</button></div>';
  document.body.appendChild(back);
  const fechar=()=>back.remove();
  back.querySelector('[data-obp-fechar]').onclick=fechar;
  back.addEventListener('click',e=>{if(e.target===back)fechar()});
  const dataPtBR=valor=>{
    const partes=String(valor||'').slice(0,10).split('-');
    return partes.length===3&&partes[0].length===4?partes[2]+'/'+partes[1]+'/'+partes[0]:'Sem data';
  };
  let aba='historico',limite=60,linhas=[],termoBusca='';
  const normalizarBusca=valor=>String(valor??'').normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
  function renderizar(){
    if(!back.isConnected)return;
    const naAba=linhas.filter(x=>aba==='historico'||(aba==='diarias'&&x.tipoRegistro==='diaria')||
      (aba==='faltas'&&x.tipoRegistro==='falta')||(aba==='pagamentos'&&x.pago));
    const resultados=termoBusca?naAba.filter(x=>{
      const busca=[x.tipo,x.tipoRegistro,nomeObra(x.obra),dataPtBR(x.data),x.data,
        x.status,x.descricao,x.motivo,dinheiro(x.valor),String(x.valor??''),x.justificada?'justificada':'']
        .filter(v=>v!=null).join(' ');
      return normalizarBusca(busca).includes(termoBusca);
    }):naAba;
    const contador=back.querySelector('[data-obp-busca-contador]');
    if(contador)contador.textContent=resultados.length+' de '+naAba.length+' registro(s)';
    back.querySelector('[data-obp-linhas]').innerHTML=resultados.length?resultados.slice(0,limite).map(x=>{
      const excluir=x.tipoRegistro==='falta'||(x.tipoRegistro==='vale'&&!x.pago)||((x.tipoRegistro==='diaria'||x.tipoRegistro==='bonus')&&!x.pago);
      const icone=x.tipoRegistro==='falta'?'⊗':x.tipoRegistro==='bonus'?'✦':x.tipoRegistro==='vale'?'▰':'▣';
      return '<article class="obp-registro-linha"><span class="obp-registro-icone'+(x.tipoRegistro==='falta'?' falta':'')+'" aria-hidden="true">'+icone+'</span>'+
        '<div class="obp-registro-info"><b>'+esc(x.tipo)+'</b>'+
        '<small>'+esc(x.tipoRegistro==='falta'?(x.justificada?'Justificada':'Sem justificativa'):'Obra: '+nomeObra(x.obra))+'</small>'+
        (x.tipoRegistro==='falta'&&x.motivo?'<small>'+esc(x.motivo)+'</small>':'')+
        (x.descricao?'<small>'+esc(x.descricao)+'</small>':'')+
        '<small>'+esc(x.status||'')+'</small></div>'+
        '<div class="obp-registro-direita"><time>'+esc(dataPtBR(x.data))+'</time>'+
        (x.tipoRegistro!=='falta'?'<strong>'+esc(dinheiro(x.valor))+'</strong>':'')+
        (excluir?'<button type="button" data-obp-excluir-tipo="'+esc(x.tipoRegistro)+'" data-obp-excluir-id="'+esc(x.id)+'">Excluir</button>':'')+
        '</div></article>';
    }).join(''):'<p class="obp-registros-vazio">'+(termoBusca?'Nenhum registro encontrado para esta busca.':'Nenhum registro nesta categoria.')+'</p>';
    back.querySelector('[data-obp-mais]').hidden=resultados.length<=limite;
    back.querySelectorAll('[data-obp-tab]').forEach(b=>{
      const ativo=b.dataset.obpTab===aba;b.classList.toggle('active',ativo);
      b.setAttribute('aria-selected',String(ativo));
    });
  }
  back.querySelector('[data-obp-busca]').addEventListener('input',e=>{
    termoBusca=normalizarBusca(e.target.value);limite=60;renderizar();
  });
  back.querySelectorAll('[data-obp-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    aba=btn.dataset.obpTab;limite=60;renderizar();
  }));
  back.querySelector('[data-obp-mais]').onclick=()=>{limite+=60;renderizar()};
  const r=resumoEquipe(func),equivalentes=r.completas+r.meias/2;
  back.querySelector('[data-obp-kpis]').innerHTML=
    '<div><small>Diárias em aberto</small><strong>Inteiras: '+r.completas+'</strong><strong>Meias: '+r.meias+'</strong></div>'+
    '<div><small>Faltas</small><strong data-obp-total-faltas>—</strong></div>'+
    '<div><small>Total em aberto</small><strong>'+esc(equivalentes.toLocaleString('pt-BR'))+'</strong></div>';
  const ds=arrEquipe('diarias',id).map(x=>({
    id:x.id,tipo:Number(x.quantidade||1)<1?'Meia diária':'Diária (inteira)',tipoRegistro:'diaria',
    obra:x.obra_id,data:x.data,valor:Number(x.valor_total||0),status:x.paga?'Quitada':'Em aberto',pago:!!x.paga
  }));
  const vs=arrEquipe('vales',id).map(x=>({
    id:x.id,tipo:'Vale',tipoRegistro:'vale',obra:x.obra_id,data:x.data,
    valor:-Number(x.valor||0),status:x.quitado?'Quitado':'Em aberto',pago:!!x.quitado
  }));
  const bs=arrEquipe('bonus',id).map(x=>({
    id:x.id,tipo:x.tipo==='extra'?'Extra':'Bônus',tipoRegistro:'bonus',
    obra:x.obra_id,data:x.data,valor:Number(x.valor||0),status:x.pago?'Pago':'Em aberto',
    pago:!!x.pago,descricao:x.descricao||''
  }));
  linhas=[...ds,...vs,...bs].sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
  renderizar();
  try{
    const faltas=await obpBuscarFaltas(id,true);
    if(!back.isConnected)return;
    linhas.push(...faltas.map(x=>({
      id:x.id,tipo:'Falta',tipoRegistro:'falta',obra:x.obra_id,data:x.data,
      justificada:!!x.justificada,motivo:x.motivo||'',descricao:x.observacoes||'',
      status:x.justificada?'Justificada':'Sem justificativa',pago:false,valor:0
    })));
    linhas.sort((a,b)=>String(b.data||'').localeCompare(String(a.data||'')));
    // As linhas do histórico são todas preservadas, mesmo depois do pagamento.
    renderizar();
    const indicadorPeriodo=back.querySelector('[data-obp-total-faltas]');
    try{
      const totalEmAberto=await obpFaltasPeriodo(id,faltas);
      if(!back.isConnected)return;
      if(indicadorPeriodo)indicadorPeriodo.textContent=String(totalEmAberto);
      const indicador=document.getElementById('obpFaltasTotal');
      if(indicador&&String(selecionado)===String(id))indicador.textContent=String(totalEmAberto);
    }catch(error){
      if(indicadorPeriodo)indicadorPeriodo.textContent='—';
      console.warn('Cálculo das faltas em aberto indisponível',error);
    }
  }catch(error){
    if(!back.isConnected)return;
    const aviso=back.querySelector('[data-obp-aviso]');aviso.hidden=false;
    aviso.textContent='Faltas não carregadas: '+(error?.message||'erro de conexão')+'. Outros registros disponíveis.';
    renderizar();
  }
  const pendentesExclusao=new Set();
  back.addEventListener('click',async e=>{
    const btn=e.target.closest('[data-obp-excluir-tipo]');if(!btn||btn.disabled)return;
    const tipo=btn.dataset.obpExcluirTipo,registroId=btn.dataset.obpExcluirId;
    if(!['falta','diaria','bonus','vale'].includes(tipo))return;
    const x=linhas.find(y=>y.tipoRegistro===tipo&&String(y.id)===String(registroId));
    if(!x||(tipo!=='falta'&&x.pago))return;
    const chaveExclusao=tipo+':'+String(registroId);
    if(pendentesExclusao.has(chaveExclusao))return;
    pendentesExclusao.add(chaveExclusao);
    btn.disabled=true;
    const rotulo=tipo==='falta'?'falta':tipo==='diaria'?(x.tipo==='Meia diária'?'meia diária':'diária'):x.tipo.toLowerCase();
    if(typeof window.OBRIX_CONFIRMAR_EXCLUSAO!=='function'){
      if(window.OBRIX_AVISO)await window.OBRIX_AVISO('Confirmação segura indisponível. Recarregue o OBRIX.');
      pendentesExclusao.delete(chaveExclusao);btn.disabled=false;
      return;
    }
    let ok=false;
    try{ok=await window.OBRIX_CONFIRMAR_EXCLUSAO({
      titulo:'Excluir '+rotulo,
      mensagem:tipo==='vale'
        ?'Estornar o vale de '+func.nome+' de '+dataPtBR(x.data)+'? Ele deixará de contar nas pendências e a despesa financeira será estornada, mantendo o histórico.'
        :'Excluir '+rotulo+' de '+func.nome+' em '+dataPtBR(x.data)+'? Esta ação não pode ser desfeita.',
      confirmar:'Excluir'
    })}catch(err){
      pendentesExclusao.delete(chaveExclusao);btn.disabled=false;
      if(window.OBRIX_AVISO)await window.OBRIX_AVISO(err?.message||'Erro na confirmação.','Equipe');
      return;
    }
    if(!ok||!back.isConnected){pendentesExclusao.delete(chaveExclusao);btn.disabled=false;return}
    const texto=btn.textContent;btn.textContent='Excluindo...';
    let excluido=false;
    try{
      if(!navigator.onLine)throw Error('Conecte-se à internet para excluir com segurança.');
      const backend=window.OBRIX_BACKEND;
      if(!backend)throw Error('Conexão com o banco indisponível.');
      const p=await backend.profile(),sb=await backend.init();
      if(!p?.empresa_id)throw Error('Conta não identificada.');
      if(tipo==='diaria'||tipo==='bonus'){
        const tabela=tipo==='diaria'?'pagamento_diarias':'pagamento_bonus_extras';
        const coluna=tipo==='diaria'?'diaria_id':'bonus_extra_id';
        const r=await sb.from(tabela).select('id').eq('empresa_id',p.empresa_id)
          .eq(coluna,registroId).eq('ativo',true).limit(1);
        if(r.error)throw r.error;
        if(r.data?.length)throw Error('Lançamento já vinculado a um pagamento. Exclusão bloqueada.');
      }
      if(tipo==='vale'){
        const vinculo=await sb.from('pagamento_vales').select('id').eq('empresa_id',p.empresa_id).eq('vale_id',registroId).eq('ativo',true).limit(1);
        if(vinculo.error)throw vinculo.error;
        if(vinculo.data?.length||x.pago)throw Error('Vale quitado. Estorne primeiro o pagamento pelo Financeiro para liberar a exclusão.');
        const r=await sb.rpc('obrix_estornar_vale_equipe',{
          p_vale_id:registroId,p_motivo:'Excluído no histórico de funcionários'
        });
        if(r.error)throw r.error;
        if(r.data?.ok!==true)throw Error('O servidor não confirmou o estorno do vale.');
        excluido=true;
      }else{
        const tabela=tipo==='falta'?'faltas':tipo==='diaria'?'diarias':'bonus_extras';
        let q=sb.from(tabela).delete().eq('id',registroId).eq('empresa_id',p.empresa_id)
          .eq('funcionario_id',id);
        if(tipo==='diaria')q=q.eq('paga',false);
        if(tipo==='bonus')q=q.eq('pago',false);
        const {data,error}=await q.select('id');
        if(error)throw error;
        if(!data?.length)throw Error('Registro não encontrado, quitado ou já excluído.');
        excluido=true;
      }
      if(tipo==='falta')obpFaltasCache.delete(String(id));
      fechar();
      try{await window.OBRIX_EQUIPE?.refresh?.()}catch(err){console.warn('Atualização da equipe:',err)}
      renderEquipe();
      await abrirRegistrosEquipePremium(id);
    }catch(error){
      const mensagem=(excluido?'Registro excluído, mas a atualização falhou. ':'')+
        (error?.message||'Não foi possível excluir.');
      if(window.OBRIX_AVISO)await window.OBRIX_AVISO(mensagem,'Exclusão de registro');
      else alert(mensagem);
    }finally{pendentesExclusao.delete(chaveExclusao);if(btn.isConnected){btn.disabled=false;btn.textContent=texto}}
  });
}

async function equipeAcaoPreview(id,tipo){
  if(tipo==='editar'){
    await esperarEquipe();
    const cadastro=window.OBRIX_FUNCIONARIOS_PESSOAL;
    if(!cadastro?.open){
      if(window.OBRIX_AVISO)await window.OBRIX_AVISO('Cadastro do funcionário indisponível no momento.');
      return;
    }
    await cadastro.open();
    setTimeout(()=>{
      const row=[...document.querySelectorAll('.obrix-pessoal-item')]
        .find(x=>String(x.dataset.id)===String(id));
      row?.querySelector('.obrix-pessoal-editar-btn')?.click();
    },100);
    return;
  }
  if(tipo==='diaria'||tipo==='vale'||tipo==='bonus'||tipo==='pagar'){
    await esperarEquipe();
    if(window.equipeAcao)return window.equipeAcao(String(id),tipo);
    return alert('A função ainda está carregando. Tente novamente.');
  }
  if(tipo==='historico'){
    await esperarEquipe();
    return abrirRegistrosEquipePremium(String(id));
  }
  if(tipo==='falta'){
    await esperarEquipe();
    const acao='falta';
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
  if(t.dataset.manager){
    if(t.dataset.manager==='excluir'){modoExclusaoLista=true;modoAtivacaoLista=false;gerenciarAberto=false;selecionado='';renderEquipe();return}
    if(t.dataset.manager==='lista'){modoExclusaoLista=false;modoAtivacaoLista=false;gerenciarAberto=false;selecionado='';renderEquipe();return}
    if(t.dataset.manager==='toggle'){modoAtivacaoLista=true;modoExclusaoLista=false;gerenciarAberto=false;selecionado='';renderEquipe();return}
    const sel={'toggle':'[data-cmd="toggle"]'}[t.dataset.manager];
    gerenciarAberto=false;renderEquipe();
    if(sel)return clicarAntigo('#equipe .obrix-equipe-controles '+sel);
    return;
  }
  if(t.dataset.teamToggle){
    if(t.disabled)return;
    const id=String(t.dataset.teamToggle),f=acharFunc(id);
    if(!f)return;
    t.disabled=true;const label=t.textContent;t.textContent='Salvando...';
    try{
      if(!navigator.onLine)throw Error('Conecte-se à internet para alterar o status.');
      const sb=await window.OBRIX_BACKEND.init(),p=await window.OBRIX_BACKEND.profile();
      if(!p?.empresa_id)throw Error('Conta não identificada.');
      const novo=f.ativo===false;
      const {data,error}=await sb.from('funcionarios').update({ativo:novo,atualizado_em:new Date().toISOString()})
        .eq('id',id).eq('empresa_id',p.empresa_id).select('id,ativo');
      if(error)throw error;
      if(!data?.length)throw Error('A alteração não foi confirmada.');
      f.ativo=data[0].ativo;
      window.dispatchEvent(new Event('obrix:funcionario-status'));
      renderEquipe();
      try{
        const atualizacao=window.OBRIX_EQUIPE?.refresh?.();
        if(atualizacao&&typeof atualizacao.catch==='function')atualizacao.catch(err=>console.warn('Atualização após status:',err));
      }catch(err){console.warn('Atualização após status:',err)}
    }catch(err){
      if(window.OBRIX_AVISO)await window.OBRIX_AVISO(err.message||'Falha ao alterar funcionário.','Equipe');
      else alert(err.message||'Falha ao alterar funcionário.');
      if(t.isConnected){t.disabled=false;t.textContent=label}
    }
    return;
  }
  if(t.dataset.teamDelete){
    await esperarEquipe();
    if(typeof window.equipeAcao==='function'){
      await window.equipeAcao(String(t.dataset.teamDelete),'excluir');
      renderEquipe();
    }
    return;
  }
  if(t.dataset.teamFilter){filtro=t.dataset.teamFilter;selecionado='';gerenciarAberto=false;renderEquipe();return}
  if(t.dataset.teamId){
    const atual=t.closest('[data-team-id]');
    posicaoEquipeAnterior={
      id:String(t.dataset.teamId),
      rolagem:window.scrollY||document.documentElement.scrollTop||0,
      topo:atual?.getBoundingClientRect().top||0
    };
    selecionado=String(t.dataset.teamId);renderEquipe();
    window.scrollTo({top:0,behavior:'instant'});return;
  }
  if(t.hasAttribute('data-team-back')){
    const anterior={...posicaoEquipeAnterior};
    selecionado='';renderEquipe();
    requestAnimationFrame(()=>{
      const botoes=[...document.querySelectorAll('#obpFuncionarios [data-team-id]')];
      const mesmo=botoes.find(b=>String(b.dataset.teamId)===anterior.id);
      const destino=mesmo
        ?(window.scrollY||0)+mesmo.getBoundingClientRect().top-anterior.topo
        :anterior.rolagem;
      window.scrollTo({top:Math.max(0,destino),behavior:'instant'});
    });
    return;
  }
  if(t.dataset.teamAction&&selecionado)return equipeAcaoPreview(selecionado,t.dataset.teamAction);
}

const cssExclusao=document.createElement('style');
cssExclusao.id='obpExcluirModoListaStyle';
cssExclusao.textContent='#equipe #obpEquipe .obp-excluir-linha{display:flex;align-items:center;gap:8px}#equipe #obpEquipe .obp-excluir-linha .obp-person{flex:1;min-width:0}#equipe #obpEquipe .obp-excluir-da-lista{flex:0 0 auto;min-height:43px;padding:8px 11px;background:#fff!important;color:#b91c1c!important;-webkit-text-fill-color:#b91c1c!important;border:1px solid #b91c1c!important;border-radius:10px;font-weight:850}#equipe #obpEquipe .obp-estado-da-lista{flex:0 0 auto;min-height:43px;padding:8px 11px;background:var(--obp-panel)!important;color:var(--obp-text)!important;-webkit-text-fill-color:var(--obp-text)!important;border:1px solid var(--obp-border)!important;border-radius:10px;font-weight:800}';
document.head.appendChild(cssExclusao);
const css=document.createElement('style');css.id='obpPreviewCss';css.textContent="\n#app>.top #sair{display:none!important}\n#inicio,#equipe{--obp-page:#f8fafc;--obp-panel:#fff;--obp-panel2:#f9fafb;--obp-text:#172331;--obp-muted:#64748b;--obp-border:#dce3ec;--obp-gold:#eab72b;--obp-shade:#fff4d8;--obp-shadow:0 2px 8px rgba(13,31,48,.075);background:var(--obp-page)!important;background-color:var(--obp-page)!important;color:var(--obp-text)!important;min-height:70vh}\nhtml[data-theme=\"dark\"] #inicio,html[data-theme=\"dark\"] #equipe{--obp-page:#07131e;--obp-panel:#101f2e;--obp-panel2:#142637;--obp-text:#f6f8fa;--obp-muted:#c3ced9;--obp-border:#32465a;--obp-gold:#f0bd36;--obp-shade:#3c321d;--obp-shadow:none}\n#inicio #obpHome,#equipe #obpEquipe{max-width:900px;margin:auto;padding:17px 14px 32px;color:var(--obp-text);font-family:inherit}\n#inicio #obpHome *,#equipe #obpEquipe *{box-sizing:border-box}\n#inicio #obpHome [hidden],#equipe #obpEquipe [hidden]{display:none!important}\n#inicio #obpHome h1,#inicio #obpHome h2,#inicio #obpHome strong,#equipe #obpEquipe h1,#equipe #obpEquipe h2,#equipe #obpEquipe strong,#equipe #obpEquipe b{color:var(--obp-text)!important}\n#inicio #obpHome button,#equipe #obpEquipe button{font-family:inherit;-webkit-text-fill-color:initial!important}\n#inicio #obpHome .obp-greeting{padding:18px 5px 25px;background:transparent!important}\n#inicio #obpHome .obp-greeting h1{font-size:clamp(28px,4.5vw,36px);line-height:1.18;letter-spacing:-.03em;font-weight:850;margin:0}\n#inicio #obpHome .obp-greeting-mark{width:50px;height:4px;background:var(--obp-gold);display:block;border-radius:20px;margin-top:12px}\n#inicio #obpHome .obp-shortcuts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:0 0 25px}\n#inicio #obpHome .obp-shortcuts button{min-width:0;min-height:82px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px 4px;border:1px solid var(--obp-border)!important;background:var(--obp-panel)!important;color:var(--obp-text)!important;border-radius:15px;box-shadow:var(--obp-shadow)!important;font-weight:750;font-size:12px}\n#inicio #obpHome .obp-shortcuts button span{font-size:27px;line-height:1;color:var(--obp-gold)}\n#inicio #obpHome .obp-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:18px 0 11px}\n#inicio #obpHome .obp-heading h2{font-size:20px;line-height:1.2;margin:0!important;font-weight:850;letter-spacing:-.025em;min-width:0}\n#inicio #obpHome .obp-heading h2:before{content:\"\";display:inline-block;width:5px;height:21px;border-radius:5px;background:var(--obp-gold);margin-right:9px;vertical-align:-4px}\n#inicio #obpHome .obp-heading button{display:inline-flex;align-items:center;gap:4px;flex:none;background:transparent!important;background-image:none!important;border:0!important;box-shadow:none!important;color:var(--obp-gold)!important;-webkit-text-fill-color:var(--obp-gold)!important;font-weight:750;font-size:14px;padding:6px 0}\n#inicio #obpHome .obp-heading button span{font-size:23px}\n#inicio #obpHome .obp-work{display:flex;width:100%;text-align:left;align-items:center;gap:11px;min-height:93px;margin:0 0 9px;padding:13px 12px;border-radius:14px;border:1px solid var(--obp-border)!important;background:var(--obp-panel)!important;color:var(--obp-text)!important;box-shadow:var(--obp-shadow)!important}\n#inicio #obpHome .obp-work-icon{flex:0 0 47px;width:47px;height:50px;display:grid;place-items:center;border-radius:10px;background:var(--obp-shade);color:var(--obp-gold);font-size:24px}\n#inicio #obpHome .obp-work-main{min-width:0;flex:1;display:flex;flex-direction:column;gap:9px}\n#inicio #obpHome .obp-work-main strong{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;white-space:normal!important;line-height:1.28;min-height:37px;font-size:15.5px;font-weight:850;letter-spacing:-.01em}\n#inicio #obpHome .obp-progress{width:100%;height:6px;display:block;overflow:hidden;border-radius:20px;background:var(--obp-border)}\n#inicio #obpHome .obp-progress i{display:block;height:100%;border-radius:20px;background:var(--obp-gold)}\n#inicio #obpHome .obp-work-pct{flex:none;min-width:34px;white-space:nowrap;text-align:right;color:var(--obp-gold);font-weight:850;font-size:13px}\n#inicio #obpHome .obp-work-arrow{font-size:26px;color:var(--obp-muted);line-height:1}\n#inicio #obpHome .obp-activity{display:flex;align-items:center;gap:11px;padding:12px 7px;border-bottom:1px solid var(--obp-border);min-height:67px}\n#inicio #obpHome .obp-activity-ico{width:31px;flex:none;text-align:center;color:var(--obp-gold);font-size:23px}\n#inicio #obpHome .obp-activity-name{min-width:0;flex:1;color:var(--obp-text);font-size:14px;font-weight:650;line-height:1.42}\n#inicio #obpHome .obp-activity time{font-size:11px;font-weight:600;color:var(--obp-muted);white-space:nowrap}\n#inicio #obpHome .obp-empty,#equipe #obpEquipe .obp-empty{padding:19px 13px;background:var(--obp-panel2);color:var(--obp-muted);border:1px solid var(--obp-border);border-radius:12px;font-size:14px}\n#app #equipe>.hero,#app #equipe>.sectionHead,#app #equipe>.obrix-equipe-controles,#app #equipe #listaEquipe{display:none!important}\n#equipe #obpEquipe .obp-team-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:4px 0 19px}\n#equipe #obpEquipe .obp-team-header h1{font-size:27px;font-weight:850;margin:0}\n#equipe #obpEquipe .obp-team-header #obpNovo{padding:11px 15px;border:0!important;border-radius:12px;background:var(--obp-gold)!important;color:#182230!important;font-weight:850;font-size:14px}\n#equipe #obpEquipe .obp-team-search{border:1px solid var(--obp-border);border-radius:13px;height:49px;display:flex;align-items:center;gap:9px;padding:0 15px;background:var(--obp-panel);margin-bottom:14px}\n#equipe #obpEquipe .obp-team-search span{font-size:26px;color:var(--obp-muted)}\n#equipe #obpEquipe #obpBuscarFunc{border:0!important;box-shadow:none!important;background:transparent!important;color:var(--obp-text)!important;-webkit-text-fill-color:var(--obp-text)!important;font-size:16px;font-weight:500;width:100%;min-width:0;max-width:100%;height:100%;outline:0;margin:0}\n#equipe #obpEquipe .obp-filters{display:flex;gap:8px;overflow-x:auto;margin:0 0 20px}\n#equipe #obpEquipe .obp-filters button{min-height:39px;white-space:nowrap;flex:1;padding:8px 11px;border:1px solid var(--obp-border)!important;border-radius:12px;background:var(--obp-panel)!important;color:var(--obp-text)!important;font-size:12px;font-weight:750}\n#equipe #obpEquipe .obp-filters button.active{background:var(--obp-shade)!important;border-color:var(--obp-gold)!important;color:var(--obp-text)!important}\n#equipe #obpEquipe .obp-group-summary{background:var(--obp-panel)!important;border:1px solid var(--obp-border);border-radius:17px;padding:16px;margin-bottom:13px}\n#equipe #obpEquipe .obp-group-summary h2{font-size:19px;margin:0 0 13px;font-weight:850}\n#equipe #obpEquipe .obp-indicadores{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}\n#equipe #obpEquipe .obp-indicador{min-width:0;min-height:87px;padding:11px 9px;border-radius:12px;border:1px solid var(--obp-border);background:var(--obp-panel2)}\n#equipe #obpEquipe .obp-indicador.destaque{background:var(--obp-shade)}\n#equipe #obpEquipe .obp-indicador small{font-size:11px;display:block;line-height:1.25;margin-bottom:13px;color:var(--obp-muted)!important}\n#equipe #obpEquipe .obp-indicador b{font-weight:850;font-size:clamp(11px,2.6vw,17px);overflow-wrap:anywhere;letter-spacing:-.01em}\n#equipe #obpEquipe #obpExpandir{width:100%;border:0!important;border-top:1px solid var(--obp-border)!important;background:transparent!important;color:var(--obp-gold)!important;font-size:13px;font-weight:800;margin-top:15px;padding:14px 5px 1px}\n#equipe #obpEquipe .obp-group-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 20px}\n#equipe #obpEquipe .obp-group-actions button{border:1px solid var(--obp-border)!important;background:var(--obp-panel)!important;color:var(--obp-text)!important;padding:13px 4px;border-radius:13px;font-weight:800;font-size:13px}\n#equipe #obpEquipe .obp-list-header{display:flex;justify-content:space-between;align-items:center;margin:7px 0 11px;gap:9px}\n#equipe #obpEquipe .obp-list-header h2{font-size:19px;font-weight:850;margin:0;letter-spacing:-.02em}\n#equipe #obpEquipe #obpGerenciar{padding:8px 10px;border-radius:10px;background:var(--obp-panel)!important;border:1px solid var(--obp-border)!important;color:var(--obp-text)!important;font-size:12px;font-weight:750}\n#equipe #obpEquipe .obp-manager-menu{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:0 0 11px}\n#equipe #obpEquipe .obp-manager-menu button{border:1px solid var(--obp-border)!important;background:var(--obp-panel2)!important;color:var(--obp-text)!important;border-radius:9px;padding:11px 8px;font-size:12px;font-weight:700}\n#equipe #obpEquipe .obp-team-list{display:grid;gap:8px}\n#equipe #obpEquipe .obp-person{display:flex;gap:10px;align-items:center;padding:12px 11px;background:var(--obp-panel)!important;border:1px solid var(--obp-border)!important;border-radius:14px;width:100%;min-height:72px;text-align:left;color:var(--obp-text)!important;box-shadow:var(--obp-shadow)!important}\n#equipe #obpEquipe .obp-avatar{flex:none;width:39px;height:39px;border-radius:11px;display:grid;place-items:center;background:var(--obp-shade);color:var(--obp-gold);font-size:23px}\n#equipe #obpEquipe .obp-person-text{min-width:0;flex:1;display:grid;gap:4px}\n#equipe #obpEquipe .obp-person-text strong{font-size:14px;line-height:1.24;font-weight:850;white-space:normal;overflow-wrap:break-word}\n#equipe #obpEquipe .obp-person-text small{font-size:12px;color:var(--obp-muted)!important}\n#equipe #obpEquipe .obp-chevron{font-size:24px;color:var(--obp-muted)}\n#equipe #obpEquipe .obp-team-detail{max-width:700px;margin:0 auto}\n#equipe #obpEquipe .obp-detail-bar{display:flex;align-items:center;gap:10px;margin:0 0 24px}\n#equipe #obpEquipe .obp-detail-bar>button{border:0!important;background:transparent!important;color:var(--obp-text)!important;font-weight:850;font-size:34px;line-height:1;padding:0 9px 0 0}\n#equipe #obpEquipe .obp-detail-bar span{font-size:14px;font-weight:700;color:var(--obp-muted)}\n#equipe #obpEquipe .obp-full-name{font-size:clamp(21px,4vw,28px);letter-spacing:-.02em;line-height:1.2;font-weight:850;margin:0 0 6px;overflow-wrap:break-word}\n#equipe #obpEquipe .obp-role{font-size:15px;color:var(--obp-muted);margin-bottom:18px}\n#equipe #obpEquipe .obp-pay{background:var(--obp-panel)!important;border:1px solid var(--obp-border);border-radius:15px;display:grid;gap:6px;padding:18px 16px;margin:0 0 16px}\n#equipe #obpEquipe .obp-pay small{font-size:14px;color:var(--obp-muted)!important}\n#equipe #obpEquipe .obp-pay strong{font-size:21px;font-weight:850}\n#equipe #obpEquipe .obp-pay span{font-size:14px;color:var(--obp-muted)}\n#equipe #obpEquipe .obp-pay b{font-size:28px;font-weight:850;margin-top:14px}\n#equipe #obpEquipe .obp-pills{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:17px}\n#equipe #obpEquipe .obp-pills span{display:inline-flex;border:1px solid var(--obp-border);border-radius:999px;padding:9px 12px;font-size:13px;color:var(--obp-text);background:var(--obp-panel)}\n#equipe #obpEquipe .obp-person-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:20px}\n#equipe #obpEquipe .obp-person-metrics>div{min-height:119px;padding:14px 12px;background:var(--obp-panel)!important;border:1px solid var(--obp-border);border-radius:14px;display:flex;flex-direction:column;gap:9px;min-width:0}\n#equipe #obpEquipe .obp-person-metrics small{font-size:13px;color:var(--obp-muted)!important;line-height:1.28}\n#equipe #obpEquipe .obp-person-metrics b{font-size:clamp(18px,4vw,24px);font-weight:850;overflow-wrap:anywhere}\n#equipe #obpEquipe .obp-person-metrics span{font-size:12px;color:var(--obp-muted)}\n#equipe #obpEquipe .obp-person-actions{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}\n#equipe #obpEquipe .obp-person-actions button{min-height:49px;border-radius:12px;font-size:13px;font-weight:800;padding:11px 5px;border:1px solid var(--obp-border)!important;grid-column:span 2}\n#equipe #obpEquipe .obp-person-actions .obp-vale,#equipe #obpEquipe .obp-person-actions .obp-bonus{grid-column:span 3}\n#equipe #obpEquipe .obp-person-actions .obp-diaria{background:#142c46!important;border-color:#38658b!important;color:#d0e5ff!important}\n#equipe #obpEquipe .obp-person-actions .obp-falta{background:#3b2025!important;border-color:#984650!important;color:#fff0f1!important}\n#equipe #obpEquipe .obp-person-actions .obp-registros{background:#302444!important;border-color:#7252a1!important;color:#f1e7ff!important}\n#equipe #obpEquipe .obp-person-actions .obp-vale{background:#123e32!important;border-color:#35876b!important;color:#e6fff4!important}\n#equipe #obpEquipe .obp-person-actions .obp-bonus{background:#453516!important;border-color:#a98225!important;color:#fff1b7!important}\nhtml[data-theme=\"dark\"] #app>.top,html[data-theme=\"dark\"] #app>.bottom{background:#0e1b28!important;background-color:#0e1b28!important;border-color:#32465a!important;color:#f8fafc!important}\nhtml[data-theme=\"dark\"] #app>.top button,html[data-theme=\"dark\"] #app>.bottom button{color:#f8fafc!important}\nhtml[data-theme=\"dark\"] #equipe #obpEquipe,html[data-theme=\"dark\"] #inicio #obpHome{background:#07131e!important;color:#f6f8fa!important}\nhtml[data-theme=\"dark\"] .modalBack .modal{background:#101f2e!important;background-color:#101f2e!important;color:#f8fafc!important;border:1px solid #334a60!important}\nhtml[data-theme=\"dark\"] .modalBack .modal input,html[data-theme=\"dark\"] .modalBack .modal select,html[data-theme=\"dark\"] .modalBack .modal textarea{background:#142637!important;color:#f8fafc!important;-webkit-text-fill-color:#f8fafc!important;border-color:#365069!important}\n@media(max-width:420px){\n#inicio #obpHome,#equipe #obpEquipe{padding:13px 10px 30px}\n#inicio #obpHome .obp-work{padding:11px 8px;gap:8px}\n#inicio #obpHome .obp-work-main strong{font-size:15px}\n#inicio #obpHome .obp-work-icon{width:38px;height:44px;flex-basis:38px}\n#inicio #obpHome .obp-activity-name{font-size:13.5px}\n#inicio #obpHome .obp-activity{gap:6px}\n#inicio #obpHome .obp-activity time{font-size:10px}\n#equipe #obpEquipe .obp-indicador{padding:10px 6px;min-height:92px}\n#equipe #obpEquipe .obp-indicador b{font-size:12px}\n#equipe #obpEquipe .obp-person-metrics>div{padding:12px 10px}\n#equipe #obpEquipe .obp-person-actions button{font-size:12px}\n}\n";css.textContent+="\n/* Preview only: remove legacy duplicate, preserve compact summary. */\n#app #equipe #obrixGestaoResumo,\n#app #equipe>.obrix-gestao-resumo,\n#app #equipe>.hero,\n#app #equipe>.sectionHead{display:none!important}\n#app #sair,#app .top .obrixLogoutIcon{display:none!important;visibility:hidden!important;pointer-events:none!important}\n/* Distinct header columns eliminate collisions with 'Ver todas'. */\n#inicio #obpHome .obp-heading{display:grid!important;grid-template-columns:minmax(0,1fr) max-content!important;align-items:center!important;column-gap:10px!important;margin:22px 0 12px!important}\n#inicio #obpHome .obp-heading h2{margin:0!important;min-width:0!important;font-size:clamp(17px,4.25vw,20px)!important;line-height:1.24!important;white-space:normal!important}\n#inicio #obpHome .obp-heading button{position:static!important;display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;white-space:nowrap!important;min-width:max-content!important;font-size:13px!important;font-weight:800!important;margin:0!important;padding:6px 0!important;border:0!important;border-radius:0!important;color:var(--obp-gold)!important;-webkit-text-fill-color:var(--obp-gold)!important;background:transparent!important;background-color:transparent!important;box-shadow:none!important}\n#inicio #obpHome #obpAtividades{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:9px!important;margin-top:4px!important}\n#inicio #obpHome .obp-activity{display:flex!important;align-items:flex-start!important;gap:12px!important;min-height:77px!important;width:100%!important;margin:0!important;padding:13px 12px!important;background:var(--obp-panel)!important;background-color:var(--obp-panel)!important;border:1px solid var(--obp-border)!important;border-radius:13px!important;box-shadow:var(--obp-shadow)!important}\n#inicio #obpHome .obp-activity-ico{width:37px!important;height:40px!important;min-width:37px!important;display:grid!important;place-items:center!important;text-align:center!important;font-size:22px!important;border-radius:10px!important;background:var(--obp-shade)!important;color:var(--obp-gold)!important}\n#inicio #obpHome .obp-activity-body{display:flex!important;flex-direction:column!important;align-items:flex-start!important;min-width:0!important;flex:1!important;gap:4px!important}\n#inicio #obpHome .obp-activity-name{display:block!important;font-size:14px!important;line-height:1.25!important;font-weight:800!important;color:var(--obp-text)!important;overflow-wrap:anywhere!important}\n#inicio #obpHome .obp-activity-detail{display:block!important;font-size:13px!important;line-height:1.3!important;font-weight:500!important;color:var(--obp-text)!important;overflow-wrap:anywhere!important}\n#inicio #obpHome .obp-activity time{display:block!important;font-size:11px!important;line-height:1.3!important;font-weight:650!important;color:var(--obp-muted)!important;white-space:normal!important;margin-top:1px!important}\n.obp-activities-modal .obp-modal{width:min(94vw,680px)!important;max-height:85vh!important;overflow:auto!important;background:var(--ob-surface,#fff)!important;color:var(--ob-text,#16212c)!important;border:1px solid var(--ob-border,#ddd)!important}\n.obp-activities-modal .obp-modal-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding-bottom:12px!important;border-bottom:1px solid var(--ob-border,#ddd)!important}\n.obp-activities-modal .obp-modal-head h2{font-size:21px!important;color:inherit!important;margin:0!important}\n.obp-activities-modal .obp-modal-head button{background:transparent!important;border:0!important;color:inherit!important;font-size:27px!important}\n.obp-activities-modal .obp-activity{display:flex!important;gap:12px!important;align-items:start!important;border-bottom:1px solid var(--ob-border,#ddd)!important;padding:13px 3px!important}\n.obp-activities-modal .obp-activity-ico{font-size:23px!important;color:#d19b1f!important;min-width:31px!important;text-align:center!important}\n.obp-activities-modal .obp-activity-body{display:flex!important;flex-direction:column!important;gap:4px!important;min-width:0!important}\n.obp-activities-modal .obp-activity-name{font-size:15px!important;font-weight:800!important;color:inherit!important}\n.obp-activities-modal .obp-activity-detail{font-size:14px!important;line-height:1.4!important;color:inherit!important}\n.obp-activities-modal .obp-activity time{font-size:12px!important;color:var(--ob-muted,#6b7280)!important}\n/* Restore the five category colors and text contrast from the old employee view. */\n#app #equipe #obpEquipe .obp-person-actions .obp-diaria{background:#142c46!important;background-color:#142c46!important;border-color:#38658b!important;color:#d0e5ff!important;-webkit-text-fill-color:#d0e5ff!important}\n#app #equipe #obpEquipe .obp-person-actions .obp-falta{background:#3b2025!important;background-color:#3b2025!important;border-color:#984650!important;color:#fff0f1!important;-webkit-text-fill-color:#fff0f1!important}\n#app #equipe #obpEquipe .obp-person-actions .obp-registros{background:#302444!important;background-color:#302444!important;border-color:#7252a1!important;color:#f1e7ff!important;-webkit-text-fill-color:#f1e7ff!important}\n#app #equipe #obpEquipe .obp-person-actions .obp-vale{background:#123e32!important;background-color:#123e32!important;border-color:#35876b!important;color:#e6fff4!important;-webkit-text-fill-color:#e6fff4!important}\n#app #equipe #obpEquipe .obp-person-actions .obp-bonus{background:#453516!important;background-color:#453516!important;border-color:#a98225!important;color:#fff1b7!important;-webkit-text-fill-color:#fff1b7!important}\n@media(max-width:380px){\n#inicio #obpHome .obp-heading{column-gap:6px!important}\n#inicio #obpHome .obp-heading h2{font-size:16px!important}\n#inicio #obpHome .obp-heading button{font-size:12px!important}\n#inicio #obpHome .obp-activity-name{font-size:13.5px!important}\n#inicio #obpHome .obp-activity-detail{font-size:12.5px!important}\n}\n";

css.textContent += '\n#app #equipe #obpEquipe>#obpNovo{display:flex!important;align-items:center!important;justify-content:center!important;position:static!important;float:none!important;flex:none!important;box-sizing:border-box!important;width:100%!important;max-width:100%!important;min-width:0!important;height:54px!important;min-height:54px!important;margin:0 0 15px!important;padding:11px 14px!important;border-radius:13px!important;background:#F97316!important;border:1px solid #F97316!important;color:#fff!important;-webkit-text-fill-color:#fff!important;font-size:16px!important;font-weight:850!important;white-space:nowrap!important;}#app #equipe #obpEquipe>#obpNovo::before,#app #equipe #obpEquipe>#obpNovo::after{content:none!important;display:none!important;}';
document.head.appendChild(css);
function secaoVisivel(id){
  const app=$('app'),e=$(id);
  return !document.hidden&&!!app&&!app.classList.contains('hidden')&&!!(e&&!e.hidden&&!e.classList.contains('hidden'));
}
function atualizar(){
  if(agendado)return;
  agendado=true;
  setTimeout(()=>{
    agendado=false;
    // Do not rebuild both large pages after every unrelated change.
    if(secaoVisivel('inicio')){renderInicio();buscarEventos()}
    if(secaoVisivel('equipe'))renderEquipe();
  },160);
}
function iniciar(){
  renderInicio();renderEquipe();
  const ini=$('inicio'),team=$('equipe'),legado=$('listaEquipe'),app=$('app');
  if(ini)new MutationObserver(()=>{if(secaoVisivel('inicio')&&!ini.querySelector('#obpHome'))atualizar()}).observe(ini,{childList:true,subtree:false});
  if(legado)new MutationObserver(()=>{if(secaoVisivel('equipe'))atualizar()}).observe(legado,{childList:true});
  if(app)new MutationObserver(atualizar).observe(app,{attributes:true,attributeFilter:['class']});
  // Navigation may only change the page's own class, not #app.
  for(const section of [ini,team])if(section)new MutationObserver(atualizar).observe(section,{attributes:true,attributeFilter:['class','hidden','style']});
  ['obrix:offline-base-atualizada','obrix:offline-core-restaurado','obrix:modules-ready','obrix:modules-online-ready','obrix:grupo-pronto','obrix:progresso-atualizado'].forEach(x=>window.addEventListener(x,atualizar));
  window.addEventListener('pageshow',atualizar);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)atualizar()});
  window.addEventListener('obrix:atividade-externa',()=>{if(secaoVisivel('inicio'))void buscarEventos(true)});
  window.addEventListener('obrix:atividade-local',()=>{if(secaoVisivel('inicio'))renderInicio()});
  setTimeout(atualizar,1200);setTimeout(atualizar,3200);
  let ultimaAssinaturaInicio='';
  setInterval(()=>{
    if(!secaoVisivel('inicio'))return;
    const atual=obras().map(o=>String(o.id)+':'+String(progresso(o))).join('|')
      +' / '+obrasMaisMovimentadas().map(o=>String(o.id)).join('|');
    if(atual!==ultimaAssinaturaInicio){ultimaAssinaturaInicio=atual;renderInicio()}
  },15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
window.addEventListener('obrix:equipe-registro',event=>{
  const tipo=event?.detail?.table;
  if(tipo!=='faltas'&&tipo!=='pagamentos_equipe')return;
  const id=event.detail.funcionarioId;
  if(id){
    obpFaltasCache.delete(String(id));
    if(tipo==='pagamentos_equipe')obpUltimoPagamentoCache.delete(String(id));
  }else{
    obpFaltasCache.clear();
    if(tipo==='pagamentos_equipe')obpUltimoPagamentoCache.clear();
  }
  if(id&&String(id)===String(selecionado))obpAtualizarFaltas(id);
  if(secaoVisivel('equipe'))atualizar();
});
window.OBRIX_PREVIEW={refresh:atualizar,openActivity:abrirAtualizacoes};

const estilosRegistros=document.createElement('style');
estilosRegistros.id='obpEquipeRegistrosAprovados20261105';
estilosRegistros.textContent="\n#equipe #obpEquipe .obp-perfil-topo{display:flex!important;align-items:center;gap:12px;background:var(--obp-panel,#fff);border:1px solid var(--obp-border,#dce3ec);padding:14px;border-radius:15px;margin:10px 0 9px}\n#equipe #obpEquipe .obp-perfil-avatar{width:52px;height:52px;flex:none;border-radius:50%;border:1px solid var(--obp-border,#dce3ec);display:grid;place-items:center;background:var(--obp-panel2,#f9fafb);color:#1264c4;font-size:27px}\n#equipe #obpEquipe .obp-perfil-texto{flex:1;min-width:0}\n#equipe #obpEquipe .obp-perfil-texto h2{margin:0!important;font-size:21px!important;line-height:1.2}\n#equipe #obpEquipe .obp-perfil-texto .obp-role{margin:4px 0 0!important;font-size:14px}\n#equipe #obpEquipe .obp-perfil-situacao{padding:5px 8px;border-radius:7px;background:#10882d;color:#fff!important;font-size:12px;font-weight:800}\n#equipe #obpEquipe .obp-perfil-pagamento{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 2px 11px;color:var(--obp-muted,#64748b);font-size:13px}\n#equipe #obpEquipe .obp-perfil-pagamento small{font-size:12px}\n#equipe #obpEquipe .obp-perfil-pagamento strong{color:var(--obp-text,#172331);white-space:nowrap}\n#equipe #obpEquipe .obp-detail-finance{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;margin:5px 0 12px!important}\n#equipe #obpEquipe .obp-detail-finance>div{min-width:0;min-height:78px;display:flex;flex-direction:column;justify-content:center;border:0!important;border-radius:11px!important;padding:10px!important;box-shadow:none!important}\n#equipe #obpEquipe .obp-detail-finance>div small{font-size:12px!important;line-height:1.3!important}\n#equipe #obpEquipe .obp-detail-finance>div b{font-size:clamp(16px,4.7vw,21px)!important;line-height:1.25!important;overflow-wrap:anywhere}\n#equipe #obpEquipe .obp-detail-finance>div:nth-child(1){background:#dff9e6!important;color:#11512a!important}\n#equipe #obpEquipe .obp-detail-finance>div:nth-child(2){background:#ffe7e7!important;color:#8a1b1b!important}\n#equipe #obpEquipe .obp-detail-finance>div:nth-child(3),#equipe #obpEquipe .obp-detail-finance>div:nth-child(4){background:#e1efff!important;color:#123b72!important}\n#equipe #obpEquipe .obp-detail-finance>div:nth-child(5){background:#efe6ff!important;color:#4b267f!important}\n#equipe #obpEquipe .obp-detail-finance>div:nth-child(6){background:#fff3d7!important;color:#835718!important}\n#equipe #obpEquipe .obp-detail-finance>div small,#equipe #obpEquipe .obp-detail-finance>div b{color:inherit!important;-webkit-text-fill-color:currentColor!important}\n#equipe #obpEquipe .obp-attendance-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:13px 0}\n#equipe #obpEquipe .obp-attendance-card{border:2px solid #1667ce;border-radius:12px;padding:10px 8px;display:flex;align-items:center;gap:9px;min-height:84px;background:var(--obp-panel,#fff);color:var(--obp-text,#172331)}\n#equipe #obpEquipe .obp-attendance-card>span{font-size:27px;color:#1169d8;flex:none}\n#equipe #obpEquipe .obp-attendance-absence>span{color:#d32f2f}\n#equipe #obpEquipe .obp-attendance-card>div{display:flex;flex-direction:column;gap:3px;min-width:0}\n#equipe #obpEquipe .obp-attendance-card small{font-size:12px;font-weight:800;color:inherit;line-height:1.25}\n#equipe #obpEquipe .obp-attendance-card strong{font-size:14px;line-height:1.25;white-space:normal}\n#equipe #obpEquipe .obp-registros-principal{width:100%;min-height:51px;display:flex;align-items:center;gap:10px;background:#0e3e7c!important;color:white!important;-webkit-text-fill-color:white!important;border:0;border-radius:12px;padding:11px 14px;font-size:16px;font-weight:850;margin:10px 0}\n#equipe #obpEquipe .obp-registros-principal span{flex:1;text-align:left}\n#equipe #obpEquipe .obp-registros-principal b{font-size:25px}\n#equipe #obpEquipe .obp-person-actions{display:grid!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:8px!important}\n#equipe #obpEquipe .obp-person-actions button{grid-column:span 2;min-width:0!important;min-height:52px!important;padding:8px 4px!important}\n#equipe #obpEquipe .obp-person-actions button:nth-child(n+4){grid-column:span 3}\n.obp-registros-premium-modal{z-index:2147481000!important}\n.obp-registros-premium-modal .obp-registros-tela{width:min(95vw,590px)!important;max-width:590px!important;max-height:90dvh!important;overflow:auto!important;padding:16px!important;border-radius:17px!important;background:var(--ob-surface,#fff)!important;color:var(--ob-text,#111827)!important;box-sizing:border-box!important}\n.obp-registros-premium-modal .obp-registros-topo{display:flex;align-items:center;justify-content:space-between;gap:7px;margin-bottom:15px}\n.obp-registros-premium-modal .obp-registros-topo h2{font-size:clamp(18px,4.4vw,23px);font-weight:850;margin:0;line-height:1.25}\n.obp-registros-premium-modal [data-obp-fechar]{font-size:28px;min-width:43px;min-height:43px;border:0;background:transparent;color:inherit}\n.obp-registros-premium-modal .obp-registros-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-bottom:15px}\n.obp-registros-premium-modal .obp-registros-tabs button{border:1px solid var(--ob-border,#cbd5e1);border-radius:10px;min-width:0;padding:10px 2px;background:var(--ob-surface,#fff);color:var(--ob-text,#111827);font-size:clamp(11px,3vw,14px);font-weight:750}\n.obp-registros-premium-modal .obp-registros-tabs button.active{background:#0e3e7c!important;color:#fff!important;-webkit-text-fill-color:#fff!important;border-color:#0e3e7c!important}\n.obp-registros-premium-modal .obp-registros-indicadores{display:grid;grid-template-columns:1.25fr .75fr .9fr;gap:6px}\n.obp-registros-premium-modal .obp-registros-indicadores>div{display:flex;flex-direction:column;gap:4px;justify-content:center;min-width:0;border:1px solid var(--ob-border,#cbd5e1);border-radius:12px;padding:9px 6px;min-height:77px}\n.obp-registros-premium-modal .obp-registros-indicadores small{font-size:11px;font-weight:800;line-height:1.25;color:var(--ob-text,#111827)}\n.obp-registros-premium-modal .obp-registros-indicadores strong{font-size:15px;overflow-wrap:anywhere;color:var(--ob-text,#111827)}\n.obp-registros-premium-modal .obp-registros-tela h3{font-size:19px;margin:21px 0 12px}\n.obp-registros-premium-modal .obp-registros-aviso{padding:9px;border-radius:9px;background:#fff4df;color:#804800;font-size:12px}\n.obp-registros-premium-modal .obp-registro-linha{display:flex;align-items:center;gap:10px;padding:10px 2px;border-bottom:1px solid var(--ob-border,#cbd5e1);min-width:0}\n.obp-registros-premium-modal .obp-registro-icone{width:35px;height:35px;flex:none;display:grid;place-items:center;border-radius:50%;background:#edf5ff;color:#1264c4;font-size:22px}\n.obp-registros-premium-modal .obp-registro-icone.falta{background:#ffe7e7;color:#c41e1e}\n.obp-registros-premium-modal .obp-registro-info{min-width:0;flex:1;display:flex;flex-direction:column;gap:3px}\n.obp-registros-premium-modal .obp-registro-info b{font-size:14px;line-height:1.2;color:var(--ob-text,#111827)}\n.obp-registros-premium-modal .obp-registro-info small{font-size:11px;line-height:1.25;color:var(--ob-muted,#64748b);overflow-wrap:anywhere}\n.obp-registros-premium-modal .obp-registro-direita{flex:none;display:flex;align-items:flex-end;flex-direction:column;gap:5px}\n.obp-registros-premium-modal .obp-registro-direita time{font-size:11px;color:var(--ob-muted,#64748b)}\n.obp-registros-premium-modal .obp-registro-direita strong{font-size:14px;color:#12863d}\n.obp-registros-premium-modal .obp-registro-direita button{min-height:33px;border:1px solid #df2727!important;border-radius:8px;background:transparent!important;color:#b91c1c!important;-webkit-text-fill-color:#b91c1c!important;font-size:12px;font-weight:800;padding:5px 10px}\n.obp-registros-premium-modal .obp-registros-vazio{padding:16px;text-align:center;color:var(--ob-muted,#64748b)}\n.obp-registros-premium-modal .obp-registros-mais{width:100%;min-height:44px;background:transparent;color:inherit;border:1px solid var(--ob-border,#cbd5e1);border-radius:10px;margin-top:10px}\n@media(max-width:390px){#equipe #obpEquipe .obp-attendance-card{padding:9px 6px;gap:6px}#equipe #obpEquipe .obp-attendance-card small{font-size:11px}#equipe #obpEquipe .obp-attendance-card strong{font-size:13px}}\n";
document.head.appendChild(estilosRegistros);
})();