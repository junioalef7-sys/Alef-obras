const $=id=>document.getElementById(id),money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile=null,obras=[],funcionarios=[],financeiro=[],extras=[],diarias=[],vales=[],bonus=[],carregandoCore=false;

function publicarGlobais(){window.obras=obras;window.funcionarios=funcionarios;window.financeiro=financeiro;window.extras=extras;window.diarias=diarias;window.vales=vales;window.bonus=bonus}
function atualizarInicio(){
  const total=obras.reduce((s,o)=>s+Number(o.valor_contrato||0),0)+extras.reduce((s,x)=>s+Number(x.valor||0),0),recebido=financeiro.filter(x=>x.tipo==='receita'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0);
  if($('contratado'))$('contratado').textContent=money(total);
  if($('receber'))$('receber').textContent=money(Math.max(0,total-recebido));
  if($('ativas'))$('ativas').textContent=String(obras.filter(o=>['andamento','em_andamento'].includes(String(o.status||'').toLowerCase())).length);
  if($('funcs'))$('funcs').textContent=String(funcionarios.filter(f=>f.ativo!==false).length);
}
async function carregarSecundarios(eid){
  try{
    const sb=await OBRIX_BACKEND.init(),[ex,di,va,bo]=await Promise.all([
      sb.from('servicos_extras').select('*').eq('empresa_id',eid),
      sb.from('diarias').select('*').eq('empresa_id',eid),
      sb.from('vales').select('*').eq('empresa_id',eid),
      sb.from('bonus_extras').select('*').eq('empresa_id',eid)
    ]);
    [ex,di,va,bo].forEach(r=>{if(r.error)throw r.error});
    extras=ex.data||[];diarias=di.data||[];vales=va.data||[];bonus=bo.data||[];publicarGlobais();atualizarInicio();
    if($('obras')&&!$('obras').classList.contains('hidden'))renderObras();
    if($('equipe')&&!$('equipe').classList.contains('hidden'))renderEquipe();
    window.OBRIX_DASH?.paint?.();
  }catch(e){console.warn('OBRIX: dados secundários serão sincronizados depois',e)}
}
async function carregar(){
  if(carregandoCore)return;carregandoCore=true;
  try{
    profile=await OBRIX_BACKEND.profile();
    const sb=await OBRIX_BACKEND.init(),eid=profile.empresa_id;
    const [ow,fn,fi]=await Promise.all([
      sb.from('obras').select('*').eq('empresa_id',eid).order('criado_em',{ascending:false}),
      sb.from('funcionarios').select('*').eq('empresa_id',eid).order('criado_em',{ascending:false}),
      sb.from('financeiro').select('*').eq('empresa_id',eid).order('data',{ascending:false})
    ]);
    [ow,fn,fi].forEach(r=>{if(r.error)throw r.error});
    obras=ow.data||[];funcionarios=fn.data||[];financeiro=fi.data||[];extras=[];diarias=[];vales=[];bonus=[];publicarGlobais();
    atualizarInicio();
    if($('usuario'))$('usuario').textContent=profile.nome||profile.email||'';
    renderObras();renderEquipe();
    if($('login'))$('login').classList.add('hidden');
    if($('app'))$('app').classList.remove('hidden');
    window.__OBRIX_CORE_LAST_LOAD=Date.now();
    void carregarSecundarios(eid);
  }catch(e){
    if($('erro')){$('erro').textContent=e.message||'Não foi possível entrar.';$('erro').classList.remove('hidden')}
  }finally{carregandoCore=false}
}
function abrir(id){['inicio','obras','equipe'].forEach(x=>$(x)?.classList.toggle('hidden',x!==id));$('financeiroMain')?.classList.add('hidden');$('estoqueMain')?.classList.add('hidden');$('menuMain')?.classList.add('hidden');$('bInicio')?.classList.toggle('active',id==='inicio');$('bEquipe')?.classList.toggle('active',id==='equipe');$('bMenu')?.classList.remove('active');if(id==='equipe')renderEquipe();if(id==='obras')renderObras();scrollTo({top:0,behavior:'smooth'})}
function renderObras(){const box=$('listaObras');if(!box)return;box.innerHTML=obras.length?obras.map(o=>{const ex=extras.filter(x=>String(x.obra_id)===String(o.id)).reduce((s,x)=>s+Number(x.valor||0),0),rec=financeiro.filter(x=>String(x.obra_id)===String(o.id)&&x.tipo==='receita'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0),desp=financeiro.filter(x=>String(x.obra_id)===String(o.id)&&x.tipo==='despesa'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0),tot=Number(o.valor_contrato||0)+ex;return `<div class="card item"><h3>${esc(o.nome||'Obra')}</h3><div class="muted">${esc(o.cliente||'')} • ${esc(o.status||'')}</div><div class="grid"><div class="mini"><small>Total atualizado</small><b>${money(tot)}</b></div><div class="mini"><small>Recebido</small><b>${money(rec)}</b></div><div class="mini"><small>A receber</small><b>${money(Math.max(0,tot-rec))}</b></div><div class="mini"><small>Despesas</small><b>${money(desp)}</b></div></div></div>`}).join(''):'<div class="card muted">Nenhuma obra cadastrada.</div>'}
function renderEquipe(){const box=$('listaEquipe');if(!box)return;box.innerHTML=funcionarios.length?funcionarios.map(f=>{const ds=diarias.filter(x=>String(x.funcionario_id)===String(f.id)&&!x.paga),vs=vales.filter(x=>String(x.funcionario_id)===String(f.id)&&!x.quitado),bs=bonus.filter(x=>String(x.funcionario_id)===String(f.id)&&!x.pago),vd=ds.reduce((s,x)=>s+Number(x.valor_total||0),0),vv=vs.reduce((s,x)=>s+Number(x.valor||0),0),vb=bs.reduce((s,x)=>s+Number(x.valor||0),0),liq=vd+vb-vv;return `<div class="card item"><h3>${esc(f.nome||'Funcionário')}</h3><div class="muted">${esc(f.cargo||'')} • ${f.ativo===false?'Inativo':'Ativo'}</div><div class="grid"><div class="mini"><small>Diárias em aberto</small><b>${ds.length}</b></div><div class="mini"><small>Total pendente</small><b>${money(vd)}</b></div><div class="mini"><small>Vale</small><b>${money(vv)}</b></div><div class="mini"><small>Bônus e Extras</small><b>${money(vb)}</b></div><div class="mini"><small>Líquido</small><b>${money(liq)}</b></div></div><div class="actions"><button onclick="equipeAcao('${f.id}','diaria')">Registrar diária</button><button onclick="equipeAcao('${f.id}','vale')">Vale</button><button onclick="equipeAcao('${f.id}','bonus')">Bônus e Extras</button><button onclick="equipeAcao('${f.id}','pagar')">Pagar</button></div></div>`}).join(''):'<div class="card muted">Nenhum funcionário cadastrado.</div>'}
function equipeAcao(id,tipo){alert('Carregando ação da equipe...')}
$('entrar').onclick=async()=>{const btn=$('entrar');if(btn){btn.disabled=true;btn.textContent='Entrando...'}try{const sb=await OBRIX_BACKEND.init(),r=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('senha').value});if(r.error)throw r.error;await carregar()}catch(e){if($('erro')){$('erro').textContent=e.message||'Falha no login';$('erro').classList.remove('hidden')}}finally{if(btn){btn.disabled=false;btn.textContent='Entrar'}}};
$('sair').onclick=async()=>{const sb=await OBRIX_BACKEND.init();await sb.auth.signOut();location.reload()};
(async()=>{try{const sb=await OBRIX_BACKEND.init(),{data}=await sb.auth.getSession();if(data.session)await carregar()}catch(_){}})();
