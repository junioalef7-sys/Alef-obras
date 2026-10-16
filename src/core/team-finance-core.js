(function(root,factory){
  const money=typeof module==='object'&&module.exports?require('./money-core.js'):root.EdificMoneyCore;
  const api=factory(money);
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.EdificTeamFinanceCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';
  if(!M)throw new Error('EdificMoneyCore é obrigatório.');

  const PAID=new Set(['pago','paga','quitado','quitada','baixado','baixada','settled']);
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const same=(a,b)=>String(a??'')===String(b??'');
  const idOf=(row,index=0)=>String(row?.operation_id||row?.client_operation_id||(row?.id!=null?'id:'+row.id:'row:'+index+':'+JSON.stringify(row||{})));
  function unique(rows){const map=new Map();(rows||[]).forEach((r,i)=>map.set(idOf(r,i),r));return [...map.values()];}
  function isPaid(row){return row?.pago===true||row?.quitado===true||row?.baixado===true||PAID.has(norm(row?.status));}
  function workId(row){return String(row?.obra_id??row?.obraId??'').trim();}
  function employeeId(row){return String(row?.funcionario_id??row?.funcionarioId??'').trim();}
  function dailyCents(row){
    if(row?.valor!=null&&row.valor!=='')return M.toCents(row.valor);
    const rate=M.toCents(row?.valor_diaria??row?.diaria??0),qty=Number(row?.qtd??row?.quantidade??row?.fracao??1);
    if(!Number.isFinite(qty)||qty<0)throw new Error('Quantidade de diária inválida.');
    return Math.round(rate*qty);
  }
  function extraCents(row){return M.toCents(row?.valor??0);}
  function advanceOpenCents(row){
    const total=M.toCents(row?.valor??0);
    const applied=M.toCents(row?.valor_aplicado??row?.valor_baixado??0);
    return Math.max(0,total-applied);
  }
  function addGroup(map,obra,kind,cents,row){
    if(!map.has(obra))map.set(obra,{obra_id:obra,dailies:0,extras:0,gross:0,advances:0,advanceApplied:0,advanceExcess:0,net:0,dailyIds:[],extraIds:[],advanceIds:[]});
    const g=map.get(obra);g[kind]+=cents;if(kind==='dailies'||kind==='extras')g.gross+=cents;
    if(kind==='dailies')g.dailyIds.push(row.id??row.operation_id);if(kind==='extras')g.extraIds.push(row.id??row.operation_id);if(kind==='advances')g.advanceIds.push(row.id??row.operation_id);
  }
  function paymentOperationId(employee,groups){
    const parts=[];for(const g of groups){parts.push(...g.dailyIds.map(x=>'d'+x),...g.extraIds.map(x=>'e'+x),...g.advanceIds.map(x=>'v'+x));}
    return 'team-pay:'+String(employee)+':'+parts.sort().join('|');
  }
  function buildSettlement(input={}){
    const employee=String(input.employeeId??'').trim();if(!employee)throw new Error('Funcionário é obrigatório.');
    const groups=new Map(),issues=[];
    const dailies=unique(input.dailies).filter(r=>same(employeeId(r),employee)&&!isPaid(r));
    const extras=unique(input.extras).filter(r=>same(employeeId(r),employee)&&!isPaid(r));
    const advances=unique(input.advances).filter(r=>same(employeeId(r),employee)&&!isPaid(r)&&advanceOpenCents(r)>0);
    for(const row of dailies){const obra=workId(row),value=dailyCents(row);if(!obra){issues.push({type:'missing_work',source:'daily',id:row.id});continue}if(value>0)addGroup(groups,obra,'dailies',value,row)}
    for(const row of extras){const obra=workId(row),value=extraCents(row);if(!obra){issues.push({type:'missing_work',source:'extra',id:row.id});continue}if(value>0)addGroup(groups,obra,'extras',value,row)}
    for(const row of advances){const obra=workId(row),value=advanceOpenCents(row);if(!obra){issues.push({type:'missing_work',source:'advance',id:row.id});continue}if(value>0)addGroup(groups,obra,'advances',value,row)}
    const result=[...groups.values()].sort((a,b)=>String(a.obra_id).localeCompare(String(b.obra_id)));
    for(const g of result){g.advanceApplied=Math.min(g.gross,g.advances);g.advanceExcess=Math.max(0,g.advances-g.gross);g.net=Math.max(0,g.gross-g.advanceApplied)}
    const totals=result.reduce((a,g)=>({gross:a.gross+g.gross,dailies:a.dailies+g.dailies,extras:a.extras+g.extras,advances:a.advances+g.advances,advanceApplied:a.advanceApplied+g.advanceApplied,advanceExcess:a.advanceExcess+g.advanceExcess,net:a.net+g.net}),{gross:0,dailies:0,extras:0,advances:0,advanceApplied:0,advanceExcess:0,net:0});
    const entries=result.filter(g=>g.net>0).map(g=>({obra_id:g.obra_id,categoria:'Mão de obra',valor_cents:g.net,valor:M.fromCents(g.net),operation_id:'finance:'+paymentOperationId(employee,[g]),source:{employee_id:employee,daily_ids:[...g.dailyIds],extra_ids:[...g.extraIds],advance_ids:[...g.advanceIds]}}));
    return {employeeId:employee,groups:result,totals,entries,issues,operationId:paymentOperationId(employee,result),canSettle:issues.length===0};
  }
  function assertSettlement(settlement){if(!settlement?.canSettle){const e=new Error('Pagamento não pode ser concluído: existem registros sem obra vinculada.');e.code='SETTLEMENT_INVALID';e.issues=settlement?.issues||[];throw e}return settlement;}
  function contractSummary(input={}){
    const original=M.toCents(input.original??0);
    const extras=(input.extras||[]).reduce((n,x)=>n+M.toCents(typeof x==='object'?x.valor:x),0);
    const updated=original+extras,received=M.toCents(input.received??0),expenses=M.toCents(input.expenses??0),remaining=Math.max(0,updated-received),result=received-expenses;
    return {original,extras,updated,received,remaining,expenses,result,margin:M.margin(received,expenses)};
  }
  return Object.freeze({unique,isPaid,dailyCents,extraCents,advanceOpenCents,buildSettlement,assertSettlement,contractSummary,paymentOperationId});
});