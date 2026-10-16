(function(){
'use strict';
if(window.__EDIFIQ_HOMOLOG_SHELL)return;window.__EDIFIQ_HOMOLOG_SHELL=true;
const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const data={
 works:[
  {id:'A',name:'Praça Boulevard',original:18000,extras:[{valor:1200}],received:9000,expenses:4200,status:'Em andamento'},
  {id:'B',name:'Refeitório Rio do Peixe',original:32000,extras:[],received:16000,expenses:7800,status:'Em andamento'}
 ],
 employees:[
  {id:'f1',name:'João',role:'Pedreiro',dailies:[{id:'d1',funcionario_id:'f1',obra_id:'A',valor:400},{id:'d2',funcionario_id:'f1',obra_id:'B',valor:400}],advances:[{id:'v1',funcionario_id:'f1',obra_id:'A',valor:160}],extras:[{id:'e1',funcionario_id:'f1',obra_id:'B',valor:100}]},
  {id:'f2',name:'Carlos',role:'Servente',dailies:[{id:'d3',funcionario_id:'f2',obra_id:'A',valor:250}],advances:[],extras:[]}
 ],
 finance:[
  {type:'Receita',work:'Praça Boulevard',value:9000},
  {type:'Despesa',work:'Praça Boulevard',value:4200},
  {type:'Receita',work:'Refeitório Rio do Peixe',value:16000},
  {type:'Despesa',work:'Refeitório Rio do Peixe',value:7800}
 ]
};
let logged=false,current='inicio';
function show(id){document.querySelectorAll('[data-screen]').forEach(x=>x.classList.toggle('active',x.dataset.screen===id));document.querySelectorAll('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===id));current=id}
function renderWorks(){const host=$('worksList');host.innerHTML=data.works.map(w=>{const s=EdificTeamFinanceCore.contractSummary({original:w.original,extras:w.extras,received:w.received,expenses:w.expenses});return `<article class="card"><div class="between"><div><h3>${w.name}</h3><span class="pill">${w.status}</span></div><b>${money(s.updated/100)}</b></div><div class="miniGrid"><div><span>Recebido</span><b>${money(s.received/100)}</b></div><div><span>Despesas</span><b>${money(s.expenses/100)}</b></div><div><span>Resultado</span><b>${money(s.result/100)}</b></div><div><span>Falta receber</span><b>${money(s.remaining/100)}</b></div></div></article>`}).join('')}
function renderTeam(){const host=$('teamList');host.innerHTML=data.employees.map(e=>{const s=EdificTeamFinanceCore.buildSettlement({employeeId:e.id,dailies:e.dailies,advances:e.advances,extras:e.extras});return `<article class="card"><div class="between"><div><h3>${e.name}</h3><div class="muted">${e.role}</div></div><b>${money(s.totals.net/100)}</b></div><div class="miniGrid"><div><span>Bruto</span><b>${money(s.totals.gross/100)}</b></div><div><span>Vale</span><b>${money(s.totals.advances/100)}</b></div><div><span>Bônus/Extras</span><b>${money(s.totals.extras/100)}</b></div><div><span>Líquido</span><b>${money(s.totals.net/100)}</b></div></div></article>`}).join('')}
function renderFinance(){const rec=data.finance.filter(x=>x.type==='Receita').reduce((a,x)=>a+x.value,0),desp=data.finance.filter(x=>x.type==='Despesa').reduce((a,x)=>a+x.value,0),res=rec-desp;$('financeCards').innerHTML=`<div class="kpi"><span>Receitas</span><b>${money(rec)}</b></div><div class="kpi"><span>Despesas</span><b>${money(desp)}</b></div><div class="kpi"><span>Resultado</span><b>${money(res)}</b></div>`;$('financeList').innerHTML=data.finance.map(x=>`<div class="row"><div><b>${x.type}</b><div class="muted">${x.work}</div></div><b>${money(x.value)}</b></div>`).join('')}
function renderHome(){const contracts=data.works.reduce((a,w)=>a+w.original+w.extras.reduce((s,e)=>s+e.valor,0),0),received=data.works.reduce((a,w)=>a+w.received,0);$('homeCards').innerHTML=`<div class="kpi"><span>Total contratado</span><b>${money(contracts)}</b></div><div class="kpi"><span>A receber</span><b>${money(contracts-received)}</b></div><div class="kpi"><span>Obras ativas</span><b>${data.works.length}</b></div><div class="kpi"><span>Funcionários</span><b>${data.employees.length}</b></div>`}
function boot(){renderHome();renderWorks();renderTeam();renderFinance();document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>logged&&show(b.dataset.nav));$('openWorks').onclick=()=>show('obras');$('loginBtn').onclick=()=>{logged=true;$('loginScreen').classList.add('hidden');$('appShell').classList.remove('hidden');show('inicio')};$('logoutBtn').onclick=()=>{logged=false;$('appShell').classList.add('hidden');$('loginScreen').classList.remove('hidden')};$('simulateSync').onclick=async()=>{const q=EdificSyncQueue.createSyncQueue({store:EdificSyncQueue.createMemoryStore(),send:async()=>true});await q.enqueue({type:'update',entity:'obra',entityId:'A',payload:{status:'Em andamento'},operationId:'demo-sync-1'});const r=await q.flush();$('syncResult').textContent=`Sincronização simulada: ${r.sent} operação enviada, ${r.remaining} pendente.`};$('simulateBackup').onclick=()=>{const b=EdificBackupCore.createBackup({data:{obras:data.works,funcionarios:data.employees,checklist:[],servicos_adicionais:[],servicos:[],terceirizados:[],orcamentos:[],diarias:[],gastos:[],pagamentos:[],faltas:[],adiantamentos:[],diario:[],presencas:[],pagamentos_terceirizados:[]}});$('syncResult').textContent=`Backup de teste ${b.version}: ${b.manifest.total_records} registros validados.`}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();