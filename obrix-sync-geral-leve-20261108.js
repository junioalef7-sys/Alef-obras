/* OBRIX – Realtime dos módulos que antes eram atualizados apenas ao abrir a tela.
   Canal único por empresa, renderização condicionada à tela ativa e sem recarregar o aplicativo. */
(()=>{'use strict';
if(window.__OBRIX_SYNC_GERAL_LEVE_20261108)return;
window.__OBRIX_SYNC_GERAL_LEVE_20261108=true;
const MODULOS={
  orcamentos:'orcamentos',orcamento_itens:'orcamentos',clientes:'orcamentos',
  notas:'notas',documentos:'documentos',
  materiais:'estoque',estoques:'estoque',estoque_saldos:'estoque',
  estoque_movimentacoes:'estoque',compras:'estoque',compra_itens:'estoque',
  fornecedores:'estoque',diario_atividades:'diario',diario_equipe:'diario',
  diarios_obra:'diario',fotos_obra:'fotos',relatorio_fotos:'fotos',
  relatorios_fotograficos:'fotos',pagamento_diarias:'equipe',
  relatorios:'relatorios'
};
const ELEMENTOS={orcamentos:'orcamentosMain',notas:'notasMain',documentos:'documentosMain',
  estoque:'estoqueMain',diario:'diarioMain',relatorios:'relatoriosMain',equipe:'equipe',
  obras:'obras',financeiro:'financeiroMain'};
let canal=null,canalCliente=null,empresa='',iniciando=false,tentativa=0,retryTimer=0,atividadeTimer=0,ultimaVerificacaoIdentidade=0;
let conectado=false,canalCriadoEm=0;
const timers=new Map(),emCarga=new Set(),pendente=new Set(),ultimaConsulta=new Map(),ultimaTentativa=new Map(),suspensoAte=new Map(),aguardandoFimEdicao=new Set(),modulosSujos=new Set();
const secao=mod=>document.getElementById(ELEMENTOS[mod]||'');
const ativo=()=>navigator.onLine&&!document.hidden&&!!document.getElementById('app')&&
  !document.getElementById('app').classList.contains('hidden');
function estaVisivel(mod){const el=secao(mod);return !!el&&!el.classList.contains('hidden')&&ativo()}
function edicao(mod){
  const el=secao(mod),f=document.activeElement;
  if(!el||!f||!el.contains(f)||!/^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName))return false;
  // Busca e filtros podem continuar em foco enquanto registros remotos chegam.
  // Tratá-los como edição bloqueava todos os próximos registros até sair do campo.
  if(f.type==='search'||/busca|buscar|filtro|pesquisa/i.test(f.id||'')||
    f.closest?.('.docFiltros,.orcFiltros,.notaFiltros,.filtros'))return false;
  // Não substituir formulários com alterações ainda não salvas.
  return true;
}
function atualizarAtividades(){
  clearTimeout(atividadeTimer);
  atividadeTimer=setTimeout(()=>{
    if(!ativo())return;
    window.dispatchEvent(new CustomEvent('obrix:atividade-externa'));
  },850);
}
async function atualizar(mod){
  if(!estaVisivel(mod))return;
  // O carregamento lazy da tela pode ainda não estar pronto.
  const disponivel={
    orcamentos:()=>!!window.OBRIX_ORCAMENTOS?.load,
    notas:()=>!!window.OBRIX_NOTAS?.load,
    documentos:()=>!!window.OBRIX_DOCUMENTOS?.load,
    diario:()=>!!window.OBRIX_DIARIO?.load,
    equipe:()=>!!window.OBRIX_EQUIPE?.refresh,
    obras:()=>typeof window.OBRIX_CORE_OBRAS_SYNC==='function'||!!window.OBRIX_OBRAS_DADOS?.sync,
    financeiro:()=>!!window.OBRIX_FIN?.render
  }[mod];
  if(disponivel&&!disponivel())return;
  const formularioFinanceiro=document.getElementById('fmForm');
  if((mod==='financeiro'&&formularioFinanceiro&&!formularioFinanceiro.classList.contains('hidden'))||edicao(mod)){
    aguardandoFimEdicao.add(mod);return;
  }
  aguardandoFimEdicao.delete(mod);
  if(emCarga.has(mod)){pendente.add(mod);return}
  emCarga.add(mod);
  ultimaTentativa.set(mod,Date.now());
  try{
    if(mod==='orcamentos')await window.OBRIX_ORCAMENTOS?.load?.();
    if(mod==='notas')await window.OBRIX_NOTAS?.load?.();
    if(mod==='documentos')await window.OBRIX_DOCUMENTOS?.load?.();
    if(mod==='estoque')await window.OBRIX_EST?.refresh?.();
    if(mod==='diario')await window.OBRIX_DIARIO?.load?.();
    if(mod==='equipe')await window.OBRIX_EQUIPE?.refresh?.();
    if(mod==='obras'){
      if(typeof window.OBRIX_CORE_OBRAS_SYNC==='function')await window.OBRIX_CORE_OBRAS_SYNC();
      else await window.OBRIX_OBRAS_DADOS?.sync?.();
    }
    if(mod==='financeiro'&&document.getElementById('fmForm')?.classList.contains('hidden'))
      await window.OBRIX_FIN?.render?.(true);
    if(mod==='fotos')window.dispatchEvent(new Event('obrix:fotografias-atualizadas'));
    // Relatorios gerados nao devem ser recalculados automaticamente (PDF pesado).
    if(mod==='relatorios')window.dispatchEvent(new CustomEvent('obrix:relatorios-atualizados'));
    ultimaConsulta.set(mod,Date.now());
    modulosSujos.delete(mod);
    suspensoAte.delete(mod);
  }catch(e){
    // Em indisponibilidade não repetir consultas a cada evento.
    suspensoAte.set(mod,Date.now()+3000);
    console.warn('Sincronizacao do modulo '+mod+' indisponivel',e)
  }
  finally{
    emCarga.delete(mod);
    if(pendente.delete(mod))agendar(mod,650);
  }
}
function agendar(mod,delay=240){
  // Coalescência: uma enxurrada de eventos não deve reiniciar o timer
  // indefinidamente, nem criar várias consultas concorrentes.
  if(timers.has(mod))return;
  const agora=Date.now(),intervalo=mod==='diario'?450:700;
  const espera=Math.max(delay,
    intervalo-(agora-(ultimaTentativa.get(mod)||0)),
    (suspensoAte.get(mod)||0)-agora);
  timers.set(mod,setTimeout(()=>{timers.delete(mod);void atualizar(mod)},Math.max(0,espera)));
}
function onChange(tab,payload){
  atualizarAtividades();
  const mod=MODULOS[tab];
  if(mod){modulosSujos.add(mod);if(estaVisivel(mod))agendar(mod,mod==='diario'?160:230);}
  window.dispatchEvent(new CustomEvent('obrix:modulo-remoto-alterado',{
    detail:{modulo:mod,tabela:tab,tipo:payload?.eventType||'UPDATE'}
  }));
}
function desligar(){
  clearTimeout(retryTimer);retryTimer=0;
  const antigo=canal,cliente=canalCliente;
  canal=null;canalCliente=null;empresa='';ultimaVerificacaoIdentidade=0;
  conectado=false;canalCriadoEm=0;
  if(antigo)try{
    if(cliente?.removeChannel)void cliente.removeChannel(antigo).catch?.(()=>{});
    else antigo.unsubscribe?.();
  }catch(_){try{antigo.unsubscribe?.()}catch(__){}}
}
async function iniciar(){
  if(iniciando||!ativo()||!window.OBRIX_BACKEND)return;
  // Não consultar perfil e sessão a cada ciclo de reconciliação no computador.
  if(canal&&!conectado&&canalCriadoEm&&Date.now()-canalCriadoEm>10000)desligar();
  if(canal&&empresa&&conectado&&Date.now()-ultimaVerificacaoIdentidade<60000)return;
  iniciando=true;
  try{
    const p=await window.OBRIX_BACKEND.profile(),sb=await window.OBRIX_BACKEND.init();
    ultimaVerificacaoIdentidade=Date.now();
    if(!p?.empresa_id){retryTimer=setTimeout(iniciar,1800);return}
    if(canal&&empresa===p.empresa_id&&conectado)return;
    if(canal&&!conectado&&Date.now()-canalCriadoEm<10000)return;
    if(canal)desligar();
    empresa=p.empresa_id;
    const filtro='empresa_id=eq.'+empresa;
    let ch=sb.channel('obrix-modulos-leves-'+empresa);
    Object.keys(MODULOS).forEach(tab=>{
      ch=ch.on('postgres_changes',{event:'*',schema:'public',table:tab,filter:filtro},
        payload=>onChange(tab,payload));
    });
    canalCliente=sb;
    canalCriadoEm=Date.now();
    canal=ch.subscribe(status=>{
      if(canal!==ch)return;
      if(status==='SUBSCRIBED'){conectado=true;tentativa=0;atualizarAtividades();reconciliarVisivel();if(estaVisivel('diario'))agendar('diario',200);}
      if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status)){
        desligar();tentativa=Math.min(5,tentativa+1);
        retryTimer=setTimeout(iniciar,Math.min(15000,1000*2**tentativa));
      }
    });
  }catch(e){
    console.warn('Realtime geral indisponivel',e);
    desligar();
    retryTimer=setTimeout(iniciar,3000);
  }finally{iniciando=false}
}
function reconciliarVisivel(){
  if(!ativo())return;
  for(const mod of Object.keys(ELEMENTOS)){
    const vencido=Date.now()-(ultimaConsulta.get(mod)||0)>12000;
    if(estaVisivel(mod)&&!edicao(mod)&&(modulosSujos.has(mod)||vencido))
      agendar(mod,modulosSujos.has(mod)?200:450);
  }
}
// Realtime atualiza por evento; reconciliação de uma tela visível a cada ~16-24s
// protege contra pausa de WebSocket e eventos perdidos, sem consultar telas ocultas.
window.addEventListener('obrix:atividade-local',()=>reconciliarVisivel());
document.addEventListener('click',e=>{
  if(e.target?.closest?.('#menuMain [data-go],.bottom button,#bInicio,#bEquipe,#bObras'))
    setTimeout(reconciliarVisivel,180);
  const b=e.target?.closest?.('#notaSalvar,#orcSalvar,#docSalvar,#diarioSalvar,#fmSalvar,#salvarObraBtn');
  if(!b)return;
  // Esta conferência é pós-clique (a gravação ainda pode estar em andamento).
  setTimeout(reconciliarVisivel,1400);
},true);
document.addEventListener('focusout',ev=>{
  for(const mod of Object.keys(ELEMENTOS)){
    const sec=secao(mod);
    if(sec?.contains(ev.target)&&aguardandoFimEdicao.has(mod))setTimeout(()=>{
      if(estaVisivel(mod)&&!edicao(mod)){aguardandoFimEdicao.delete(mod);agendar(mod,650)}
    },350);
  }
},true);
window.addEventListener('online',()=>{desligar();void iniciar();reconciliarVisivel()});
window.addEventListener('focus',()=>{void iniciar();reconciliarVisivel()});
window.addEventListener('pageshow',()=>{void iniciar();reconciliarVisivel()});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){for(const t of timers.values())clearTimeout(t);timers.clear();return}
  void iniciar();reconciliarVisivel();
});
['obrix:modules-ready','obrix:modules-online-ready','obrix:session-shell','obrix:grupo-pronto']
  .forEach(ev=>window.addEventListener(ev,()=>{if(ev==='obrix:session-shell')ultimaVerificacaoIdentidade=0;void iniciar();reconciliarVisivel()}));
setInterval(()=>{if(ativo()){void iniciar();reconciliarVisivel()}},8000);
setTimeout(()=>{void iniciar();reconciliarVisivel()},700);
window.OBRIX_SYNC_GERAL={status:()=>({conectado,empresa:!!empresa,modulos:Object.keys(ELEMENTOS),pendentes:[...modulosSujos]}),
  refresh:reconciliarVisivel,start:iniciar};
})();
