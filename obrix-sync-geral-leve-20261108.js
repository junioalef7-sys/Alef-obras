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
  estoque:'estoqueMain',diario:'diarioMain',relatorios:'relatoriosMain',equipe:'equipe'};
let canal=null,canalCliente=null,empresa='',iniciando=false,tentativa=0,retryTimer=0,atividadeTimer=0;
const timers=new Map(),emCarga=new Set(),pendente=new Set(),ultimaConsulta=new Map();
const secao=mod=>document.getElementById(ELEMENTOS[mod]||'');
const ativo=()=>navigator.onLine&&!document.hidden&&!!document.getElementById('app')&&
  !document.getElementById('app').classList.contains('hidden');
function estaVisivel(mod){const el=secao(mod);return !!el&&!el.classList.contains('hidden')&&ativo()}
function edicao(mod){const el=secao(mod),f=document.activeElement;
  return !!el&&!!f&&el.contains(f)&&/^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName);
}
function atualizarAtividades(){
  clearTimeout(atividadeTimer);
  atividadeTimer=setTimeout(()=>{
    if(!ativo())return;
    window.dispatchEvent(new CustomEvent('obrix:atividade-externa'));
  },850);
}
async function atualizar(mod){
  if(!estaVisivel(mod)||edicao(mod))return;
  if(emCarga.has(mod)){pendente.add(mod);return}
  emCarga.add(mod);
  try{
    if(mod==='orcamentos')await window.OBRIX_ORCAMENTOS?.load?.();
    if(mod==='notas')await window.OBRIX_NOTAS?.load?.();
    if(mod==='documentos')await window.OBRIX_DOCUMENTOS?.load?.();
    if(mod==='estoque')await window.OBRIX_EST?.refresh?.();
    if(mod==='diario')await window.OBRIX_DIARIO?.load?.();
    if(mod==='equipe')await window.OBRIX_EQUIPE?.refresh?.();
    if(mod==='fotos')window.dispatchEvent(new Event('obrix:fotografias-atualizadas'));
    // Relatorios gerados nao devem ser recalculados automaticamente (PDF pesado).
    if(mod==='relatorios')window.dispatchEvent(new CustomEvent('obrix:relatorios-atualizados'));
    ultimaConsulta.set(mod,Date.now());
  }catch(e){console.warn('Sincronizacao do modulo '+mod+' indisponivel',e)}
  finally{
    emCarga.delete(mod);
    if(pendente.delete(mod))agendar(mod,650);
  }
}
function agendar(mod,delay=240){
  clearTimeout(timers.get(mod));
  timers.set(mod,setTimeout(()=>{timers.delete(mod);void atualizar(mod)},delay));
}
function onChange(tab,payload){
  atualizarAtividades();
  const mod=MODULOS[tab];if(mod&&estaVisivel(mod))agendar(mod,300);
  window.dispatchEvent(new CustomEvent('obrix:modulo-remoto-alterado',{
    detail:{modulo:mod,tabela:tab,tipo:payload?.eventType||'UPDATE'}
  }));
}
function desligar(){
  clearTimeout(retryTimer);retryTimer=0;
  const antigo=canal,cliente=canalCliente;
  canal=null;canalCliente=null;empresa='';
  if(antigo)try{
    if(cliente?.removeChannel)void cliente.removeChannel(antigo).catch?.(()=>{});
    else antigo.unsubscribe?.();
  }catch(_){try{antigo.unsubscribe?.()}catch(__){}}
}
async function iniciar(){
  if(iniciando||!ativo()||!window.OBRIX_BACKEND)return;
  iniciando=true;
  try{
    const p=await window.OBRIX_BACKEND.profile(),sb=await window.OBRIX_BACKEND.init();
    if(!p?.empresa_id){retryTimer=setTimeout(iniciar,1800);return}
    if(canal&&empresa===p.empresa_id)return;
    if(canal)desligar();
    empresa=p.empresa_id;
    const filtro='empresa_id=eq.'+empresa;
    let ch=sb.channel('obrix-modulos-leves-'+empresa);
    Object.keys(MODULOS).forEach(tab=>{
      ch=ch.on('postgres_changes',{event:'*',schema:'public',table:tab,filter:filtro},
        payload=>onChange(tab,payload));
    });
    canalCliente=sb;
    canal=ch.subscribe(status=>{
      if(canal!==ch)return;
      if(status==='SUBSCRIBED'){tentativa=0;atualizarAtividades();}
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
  for(const mod of Object.keys(ELEMENTOS))
    if(estaVisivel(mod)&&Date.now()-(ultimaConsulta.get(mod)||0)>30000)agendar(mod,500);
}
window.addEventListener('online',()=>{desligar();void iniciar();reconciliarVisivel()});
window.addEventListener('focus',()=>{void iniciar();reconciliarVisivel()});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){for(const t of timers.values())clearTimeout(t);timers.clear();return}
  void iniciar();reconciliarVisivel();
});
['obrix:modules-ready','obrix:modules-online-ready','obrix:session-shell','obrix:grupo-pronto']
  .forEach(ev=>window.addEventListener(ev,()=>{void iniciar();reconciliarVisivel()}));
setInterval(()=>{if(ativo()){void iniciar();reconciliarVisivel()}},30000);
setTimeout(()=>{void iniciar();reconciliarVisivel()},700);
window.OBRIX_SYNC_GERAL={status:()=>({conectado:!!canal,empresa:!!empresa,modulos:Object.keys(ELEMENTOS)}),
  refresh:reconciliarVisivel,start:iniciar};
})();
