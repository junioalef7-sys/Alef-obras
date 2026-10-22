const $=id=>document.getElementById(id),money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const OFFLINE_BASE_KEY='obrix_offline_base_v3',OFFLINE_IDENTITY_KEY='obrix_offline_identity_v1';
let profile=null,obras=[],funcionarios=[],financeiro=[],extras=[],diarias=[],vales=[],bonus=[],carregandoCore=false;

function publicarGlobais(){window.obras=obras;window.funcionarios=funcionarios;window.financeiro=financeiro;window.extras=extras;window.diarias=diarias;window.vales=vales;window.bonus=bonus}
function salvarIdentidadeOffline(p=profile){if(!p?.empresa_id)return false;try{localStorage.setItem(OFFLINE_IDENTITY_KEY,JSON.stringify({empresa_id:p.empresa_id,nome:p.nome||'',email:p.email||'',papel:p.papel||'',updatedAt:new Date().toISOString()}));return true}catch(_){return false}}
function salvarBaseOffline(){
  if(!profile?.empresa_id)return false;
  salvarIdentidadeOffline(profile);
  try{
    localStorage.setItem(OFFLINE_BASE_KEY,JSON.stringify({
      profile:{empresa_id:profile.empresa_id,nome:profile.nome||'',email:profile.email||'',papel:profile.papel||''},
      obras:Array.isArray(obras)?obras:[],funcionarios:Array.isArray(funcionarios)?funcionarios:[],financeiro:Array.isArray(financeiro)?financeiro:[],extras:Array.isArray(extras)?extras:[],diarias:Array.isArray(diarias)?diarias:[],vales:Array.isArray(vales)?vales:[],bonus:Array.isArray(bonus)?bonus:[],updatedAt:new Date().toISOString()
    }));
    window.dispatchEvent(new CustomEvent('obrix:offline-base-atualizada'));
    return true;
  }catch(_){return false}
}
function lerBaseOffline(){try{const b=JSON.parse(localStorage.getItem(OFFLINE_BASE_KEY)||'null');if(b?.profile?.empresa_id)return b;const i=JSON.parse(localStorage.getItem(OFFLINE_IDENTITY_KEY)||'null');if(i?.empresa_id)return{profile:{empresa_id:i.empresa_id,nome:i.nome||'',email:i.email||'',papel:i.papel||''},obras:[],funcionarios:[],financeiro:[],extras:[],diarias:[],vales:[],bonus:[],updatedAt:i.updatedAt||null,identityFallback:true}}catch(_){}return null}
function atualizarInicio(){const total=obras.reduce((s,o)=>s+Number(o.valor_contrato||0),0)+extras.reduce((s,x)=>s+Number(x.valor||0),0),recebido=financeiro.filter(x=>x.tipo==='receita'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0);if($('contratado'))$('contratado').textContent=money(total);if($('receber'))$('receber').textContent=money(Math.max(0,total-recebido));if($('ativas'))$('ativas').textContent=String(obras.filter(o=>['andamento','em_andamento'].includes(String(o.status||'').toLowerCase())).length);if($('funcs'))$('funcs').textContent=String(funcionarios.filter(f=>f.ativo!==false).length)}
function timeout(p,ms,msg){return Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(new Error(msg||'Tempo de conexão esgotado.')),ms))])}
function mostrarApp(){if($('login'))$('login').classList.add('hidden');if($('app'))$('app').classList.remove('hidden')}
function mostrarErro(e){if($('erro')){$('erro').textContent=e?.message||'Não foi possível entrar.';$('erro').classList.remove('hidden')}}
function restaurarOfflineCore(reason='core'){
  if(navigator.onLine)return false;
  let ok=window.OBRIX_OFFLINE_EARLY?.restore?.(reason)||window.OBRIX_OFFLINE_DIARIO?.restoreBase?.()||window.OBRIX_OFFLINE_BOOTSTRAP_API?.restore?.(reason);
  const b=window.OBRIX_OFFLINE_EARLY?.base?.()||window.__OBRIX_OFFLINE_BOOTSTRAP_BASE||lerBaseOffline();
  if(!ok&&b?.profile?.empresa_id){ok=true;window.__OBRIX_OFFLINE_BOOTSTRAP_BASE=b}
  if(!ok)return false;
  try{
    if(b?.profile){
      profile=b.profile;obras=Array.isArray(b.obras)?b.obras:[];funcionarios=Array.isArray(b.funcionarios)?b.funcionarios:[];financeiro=Array.isArray(b.financeiro)?b.financeiro:[];extras=Array.isArray(b.extras)?b.extras:[];diarias=Array.isArray(b.diarias)?b.diarias:[];vales=Array.isArray(b.vales)?b.vales:[];bonus=Array.isArray(b.bonus)?b.bonus:[];
      publicarGlobais();atualizarInicio();renderObras();renderEquipe();mostrarApp();
      document.documentElement.dataset.obrixOffline='1';if(b.identityFallback)document.documentElement.dataset.obrixOfflineIdentityFallback='1';
      window.dispatchEvent(new CustomEvent('obrix:offline-core-restaurado',{detail:{reason,empresa_id:b.profile.empresa_id,identityFallback:!!b.identityFallback}}));
    }
  }catch(_){}
  return true
}
async function carregarSecundarios(eid){try{const sb=await OBRIX_BACKEND.init(),[ex,di,va,bo]=await Promise.all([sb.from('servicos_extras').select('*').eq('empresa_id',eid),sb.from('diarias').select('*').eq('empresa_id',eid),sb.from('vales').select('*').eq('empresa_id',eid),sb.from('bonus_extras').select('*').eq('empresa_id',eid)]);[ex,di,va,bo].forEach(r=>{if(r.error)throw r.error});extras=ex.data||[];diarias=di.data||[];vales=va.data||[];bonus=bo.data||[];publicarGlobais();salvarBaseOffline();atualizarInicio();if($('obras')&&!$('obras').classList.contains('hidden'))renderObras();if($('equipe')&&!$('equipe').classList.contains('hidden'))renderEquipe();window.OBRIX_DASH?.paint?.()}catch(e){console.warn('OBRIX: dados secundários serão sincronizados depois',e)}}
async function carregar(){if(restaurarOfflineCore('core-carregar'))return true;if(carregandoCore)return;carregandoCore=true;try{profile=await timeout(OBRIX_BACKEND.profile(),12000,'Não foi possível carregar seu perfil. Tente novamente.');salvarIdentidadeOffline(profile);salvarBaseOffline();const sb=await OBRIX_BACKEND.init(),eid=profile.empresa_id;const [ow,fn,fi]=await timeout(Promise.all([sb.from('obras').select('*').eq('empresa_id',eid).order('criado_em',{ascending:false}),sb.from('funcionarios').select('*').eq('empresa_id',eid).order('criado_em',{ascending:false}),sb.from('financeiro').select('*').eq('empresa_id',eid).order('data',{ascending:false})]),15000,'A conexão demorou demais. Tente novamente.');[ow,fn,fi].forEach(r=>{if(r.error)throw r.error});obras=ow.data||[];funcionarios=fn.data||[];financeiro=fi.data||[];extras=[];diarias=[];vales=[];bonus=[];publicarGlobais();salvarBaseOffline();atualizarInicio();if($('usuario'))$('usuario').textContent=profile.nome||profile.email||'';renderObras();renderEquipe();mostrarApp();window.__OBRIX_CORE_LAST_LOAD=Date.now();void carregarSecundarios(eid);return true}catch(e){if(restaurarOfflineCore('core-fallback'))return true;mostrarErro(e);return false}finally{carregandoCore=false}}
function abrir(id){['inicio','obras','equipe'].forEach(x=>$(x)?.classList.toggle('hidden',x!==id));$('financeiroMain')?.classList.add('hidden');$('estoqueMain')?.classList.add('hidden');$('menuMain')?.classList.add('hidden');$('bInicio')?.classList.toggle('active',id==='inicio');$('bEquipe')?.classList.toggle('active',id==='equipe');$('bMenu')?.classList.remove('active');if(id==='equipe')renderEquipe();if(id==='obras')renderObras();scrollTo({top:0,behavior:'smooth'})}
function renderObras(){const box=$('listaObras');if(!box)return;box.innerHTML=obras.length?obras.map(o=>{const ex=extras.filter(x=>String(x.obra_id)===String(o.id)).reduce((s,x)=>s+Number(x.valor||0),0),rec=financeiro.filter(x=>String(x.obra_id)===String(o.id)&&x.tipo==='receita'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0),desp=financeiro.filter(x=>String(x.obra_id)===String(o.id)&&x.tipo==='despesa'&&(!x.status_lancamento||x.status_lancamento==='ativo')).reduce((s,x)=>s+Number(x.valor||0),0),tot=Number(o.valor_contrato||0)+ex;return `<div class="card item"><h3>${esc(o.nome||'Obra')}</h3><div class="muted">${esc(o.cliente||'')} • ${esc(o.status||'')}</div><div class="grid"><div class="mini"><small>Total atualizado</small><b>${money(tot)}</b></div><div class="mini"><small>Recebido</small><b>${money(rec)}</b></div><div class="mini"><small>A receber</small><b>${money(Math.max(0,tot-rec))}</b></div><div class="mini"><small>Despesas</small><b>${money(desp)}</b></div></div></div>`}).join(''):'<div class="card muted">Nenhuma obra cadastrada.</div>'}
function renderEquipe(){const box=$('listaEquipe');if(!box)return;box.innerHTML=funcionarios.length?funcionarios.map(f=>{const ds=diarias.filter(x=>String(x.funcionario_id)===String(f.id)&&!x.paga),vs=vales.filter(x=>String(x.funcionario_id)===String(f.id)&&!x.quitado),bs=bonus.filter(x=>String(x.funcionario_id)===String(f.id)&&!x.pago),vd=ds.reduce((s,x)=>s+Number(x.valor_total||0),0),vv=vs.reduce((s,x)=>s+Number(x.valor||0),0),vb=bs.reduce((s,x)=>s+Number(x.valor||0),0),liq=vd+vb-vv;return `<div class="card item"><h3>${esc(f.nome||'Funcionário')}</h3><div class="muted">${esc(f.cargo||'')} • ${f.ativo===false?'Inativo':'Ativo'}</div><div class="grid"><div class="mini"><small>Diárias em aberto</small><b>${ds.length}</b></div><div class="mini"><small>Total pendente</small><b>${money(vd)}</b></div><div class="mini"><small>Vale</small><b>${money(vv)}</b></div><div class="mini"><small>Bônus e Extras</small><b>${money(vb)}</b></div><div class="mini"><small>Líquido</small><b>${money(liq)}</b></div></div><div class="actions"><button onclick="equipeAcao('${f.id}','diaria')">Registrar diária</button><button onclick="equipeAcao('${f.id}','vale')">Vale</button><button onclick="equipeAcao('${f.id}','bonus')">Bônus e Extras</button><button onclick="equipeAcao('${f.id}','pagar')">Pagar</button></div></div>`}).join(''):'<div class="card muted">Nenhum funcionário cadastrado.</div>'}
function equipeAcao(id,tipo){alert('Carregando ação da equipe...')}
async function entrarSeguro(){const btn=$('entrar');if(!btn||btn.dataset.busy==='1')return;btn.dataset.busy='1';btn.disabled=true;btn.textContent='Entrando...';$('erro')?.classList.add('hidden');try{
  if(!navigator.onLine){
    const typed=($('email')?.value||'').trim().toLowerCase();
    const b=lerBaseOffline();
    const cached=String(b?.profile?.email||'').trim().toLowerCase();
    if(!b?.profile?.empresa_id)throw new Error('Esta conta ainda não está preparada para acesso offline neste aparelho. Conecte uma vez, entre no OBRIX e depois poderá abrir sem internet.');
    if(typed&&cached&&typed!==cached)throw new Error('Sem internet, este aparelho só pode abrir a última conta salva localmente.');
    if(!restaurarOfflineCore('login-offline'))throw new Error('Não foi possível restaurar a conta salva neste aparelho. Conecte à internet uma vez e tente novamente.');
    return;
  }
  const sb=await timeout(OBRIX_BACKEND.init(),10000,'Não foi possível iniciar a conexão.');const r=await timeout(sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('senha').value}),15000,'A conexão demorou demais. Tente novamente.');if(r.error)throw r.error;const ok=await carregar();if(!ok)throw new Error(($('erro')?.textContent||'Não foi possível carregar o aplicativo.').trim())
}catch(e){mostrarErro(e)}finally{btn.dataset.busy='0';btn.disabled=false;btn.textContent='Entrar'}}
$('entrar').onclick=entrarSeguro;
$('sair').onclick=async()=>{try{const sb=await OBRIX_BACKEND.init();await sb.auth.signOut()}catch(_){}finally{try{localStorage.removeItem(OFFLINE_BASE_KEY);localStorage.removeItem('obrix_offline_base_v2');localStorage.removeItem(OFFLINE_IDENTITY_KEY)}catch(_){}location.reload()}};
(async()=>{if(restaurarOfflineCore('core-auto'))return;try{const sb=await timeout(OBRIX_BACKEND.init(),10000),{data}=await timeout(sb.auth.getSession(),10000);if(data?.session)await carregar()}catch(e){if(!restaurarOfflineCore('core-auto-fallback'))console.warn('OBRIX: sessão automática não carregou',e)}})();
