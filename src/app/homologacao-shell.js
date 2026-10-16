(function(){
'use strict';
if(window.__EDIFIQ_HOMOLOG_SHELL)return;window.__EDIFIQ_HOMOLOG_SHELL=true;
const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
let data={
 works:[
  {id:'A',name:'Praça Boulevard',original:18000,extras:[{valor:1200}],received:9000,expenses:4200,status:'Em andamento'},
  {id:'B',name:'Refeitório Rio do Peixe',original:32000,extras:[],received:16000,expenses:7800,status:'Em andamento'}
 ],
 employees:[
  {id:'f1',name:'João',role:'Pedreiro',dailies:[{id:'d1',funcionario_id:'f1',obra_id:'A',valor:400}],advances:[{id:'v1',funcionario_id:'f1',obra_id:'A',valor:160}],extras:[{id:'e1',funcionario_id:'f1',obra_id:'A',valor:100}]},
  {id:'f2',name:'Carlos',role:'Servente',dailies:[{id:'d3',funcionario_id:'f2',obra_id:'A',valor:250}],advances:[],extras:[]}
 ],
 finance:[
  {type:'Receita',work:'Praça Boulevard',value:9000},
  {type:'Despesa',work:'Praça Boulevard',value:4200},
  {type:'Receita',work:'Refeitório Rio do Peixe',value:16000},
  {type:'Despesa',work:'Refeitório Rio do Peixe',value:7800}
 ]
};
let logged=false,current='inicio',source='simulado';
const same=(a,b)=>String(a??'')===String(b??'');
const n=v=>{const x=Number(v||0);return Number.isFinite(x)?x:0};
function isRevenue(p){const t=String(p?.tipo||'').toLowerCase();return !p?.funcionario_id&&(!t||/entrada|receita|receb/.test(t))}
function snapshotToData(s){
 const obras=Array.isArray(s?.obras)?s.obras:[], extras=Array.isArray(s?.servicos_adicionais)?s.servicos_adicionais:[], pagamentos=Array.isArray(s?.pagamentos)?s.pagamentos:[], gastos=Array.isArray(s?.gastos)?s.gastos:[], diarias=Array.isArray(s?.diarias)?s.diarias:[], vales=Array.isArray(s?.adiantamentos)?s.adiantamentos:[], funcs=Array.isArray(s?.funcionarios)?s.funcionarios:[];
 const workName=id=>(obras.find(o=>same(o.id,id))||{}).nome||'Sem obra';
 const works=obras.map(o=>{
  const rec=pagamentos.filter(p=>same(p.obra_id,o.id)&&isRevenue(p)).reduce((a,p)=>a+n(p.valor),0);
  const desp=gastos.filter(g=>same(g.obra_id,o.id)).reduce((a,g)=>a+n(g.valor),0);
  return {id:o.id,name:o.nome||'Obra',original:n(o.valor),extras:extras.filter(e=>same(e.obra_id,o.id)).map(e=>({valor:n(e.valor)})),received:rec,expenses:desp,status:o.status||'—'};
 });
 const employees=funcs.map(f=>({
  id:f.id,name:f.nome||'Funcionário',role:f.funcao||'Função não informada',
  dailies:diarias.filter(d=>same(d.funcionario_id,f.id)&&String(d.status||'pendente').toLowerCase()!=='pago').map(d=>({id:d.id,funcionario_id:f.id,obra_id:d.obra_id,valor:n(d.valor_diaria)*n(d.qtd||1)})),
  advances:vales.filter(v=>same(v.funcionario_id,f.id)).map(v=>({id:v.id,funcionario_id:f.id,obra_id:v.obra_id,valor:n(v.valor)})),
  extras:gastos.filter(g=>same(g.funcionario_id,f.id)&&g.servico_extra_id).map(g=>({id:g.id,funcionario_id:f.id,obra_id:g.obra_id,valor:n(g.valor)}))
 }));
 const finance=[
  ...pagamentos.filter(isRevenue).map(p=>({type:'Receita',work:workName(p.obra_id),value:n(p.valor)})),
  ...gastos.map(g=>({type:'Despesa',work:workName(g.obra_id),value:n(g.valor)}))
 ];
 return {works,employees,finance};
}
function show(id){document.querySelectorAll('[data-screen]').forEach(x=>x.classList.toggle('active',x.dataset.screen===id));document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===id));current=id}
function renderWorks(){const host=$('worksList');host.innerHTML=data.works.map(w=>{const s=EdificTeamFinanceCore.contractSummary({original:w.original,extras:w.extras,received:w.received,expenses:w.expenses});return `<article class="card"><div class="between"><div><h3>${w.name}</h3><span class="pill">${w.status}</span></div><b>${money(s.updated/100)}</b></div><div class="miniGrid"><div><span>Recebido</span><b>${money(s.received/100)}</b></div><div><span>Despesas</span><b>${money(s.expenses/100)}</b></div><div><span>Resultado</span><b>${money(s.result/100)}</b></div><div><span>Falta receber</span><b>${money(s.remaining/100)}</b></div></div></article>`}).join('')||'<div class="card muted">Nenhuma obra disponível para leitura.</div>'}
function renderTeam(){const host=$('teamList');host.innerHTML=data.employees.map(e=>{const s=EdificTeamFinanceCore.buildSettlement({employeeId:e.id,dailies:e.dailies,advances:e.advances,extras:e.extras});return `<article class="card"><div class="between"><div><h3>${e.name}</h3><div class="muted">${e.role}</div></div><b>${money(s.totals.net/100)}</b></div><div class="miniGrid"><div><span>Bruto</span><b>${money(s.totals.gross/100)}</b></div><div><span>Vale</span><b>${money(s.totals.advances/100)}</b></div><div><span>Bônus/Extras</span><b>${money(s.totals.extras/100)}</b></div><div><span>Líquido</span><b>${money(s.totals.net/100)}</b></div></div></article>`}).join('')||'<div class="card muted">Nenhum funcionário disponível para leitura.</div>'}
function renderFinance(){const rec=data.finance.filter(x=>x.type==='Receita').reduce((a,x)=>a+x.value,0),desp=data.finance.filter(x=>x.type==='Despesa').reduce((a,x)=>a+x.value,0),res=rec-desp;$('financeCards').innerHTML=`<div class="kpi"><span>Receitas</span><b>${money(rec)}</b></div><div class="kpi"><span>Despesas</span><b>${money(desp)}</b></div><div class="kpi"><span>Resultado</span><b>${money(res)}</b></div>`;$('financeList').innerHTML=data.finance.map(x=>`<div class="row"><div><b>${x.type}</b><div class="muted">${x.work}</div></div><b>${money(x.value)}</b></div>`).join('')||'<div class="card muted">Nenhum lançamento disponível para leitura.</div>'}
function renderHome(){const contracts=data.works.reduce((a,w)=>a+w.original+w.extras.reduce((s,e)=>s+n(e.valor),0),0),received=data.works.reduce((a,w)=>a+w.received,0);$('homeCards').innerHTML=`<div class="kpi"><span>Total contratado</span><b>${money(contracts)}</b></div><div class="kpi"><span>A receber</span><b>${money(contracts-received)}</b></div><div class="kpi"><span>Obras ativas</span><b>${data.works.length}</b></div><div class="kpi"><span>Funcionários</span><b>${data.employees.length}</b></div>`}
function renderAll(){renderHome();renderWorks();renderTeam();renderFinance();const status=$('dataSourceStatus');if(status)status.textContent=source==='supabase'?'Fonte: Supabase em modo somente leitura. Nenhuma gravação está habilitada.':'Fonte: dados simulados de homologação.'}
async function loadReadonly(client){if(!window.EDIFIQReadonlySupabase)throw new Error('Adaptador somente leitura ausente.');const adapter=window.EDIFIQReadonlySupabase.createReadonlyAdapter(client);const snap=await adapter.loadSnapshot();data=snapshotToData(snap);source='supabase';renderAll();return {mode:adapter.mode,counts:{obras:snap.obras.length,funcionarios:snap.funcionarios.length,diarias:snap.diarias.length,gastos:snap.gastos.length,pagamentos:snap.pagamentos.length}}}
function boot(){renderAll();document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>logged&&show(b.dataset.nav));$('openWorks').onclick=()=>show('obras');$('loginBtn').onclick=()=>{logged=true;$('loginScreen').classList.add('hidden');$('appShell').classList.remove('hidden');show('inicio')};$('logoutBtn').onclick=()=>{logged=false;$('appShell').classList.add('hidden');$('loginScreen').classList.remove('hidden')};$('simulateSync').onclick=async()=>{const q=EdificSyncQueue.createSyncQueue({store:EdificSyncQueue.createMemoryStore(),send:async()=>true});await q.enqueue({type:'update',entity:'obra',entityId:'A',payload:{status:'Em andamento'},operationId:'demo-sync-1'});const r=await q.flush();$('syncResult').textContent=`Sincronização simulada: ${r.sent} operação enviada, ${r.remaining} pendente.`};$('simulateBackup').onclick=()=>{const b=EdificBackupCore.createBackup({data:{obras:data.works,funcionarios:data.employees,checklist:[],servicos_adicionais:[],servicos:[],terceirizados:[],orcamentos:[],diarias:[],gastos:[],pagamentos:[],faltas:[],adiantamentos:[],diario:[],presencas:[],pagamentos_terceirizados:[]}});$('syncResult').textContent=`Backup de teste ${b.version}: ${b.manifest.total_records} registros validados.`}}
window.EDIFIQHomologacao=Object.freeze({loadReadonly,getSource:()=>source,getData:()=>JSON.parse(JSON.stringify(data))});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();