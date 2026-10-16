const assert=require('node:assert/strict');
const M=require('../src/core/money-core.js');
const F=require('../src/core/team-finance-core.js');

(()=>{
  assert.equal(M.toCents(280),28000);
  assert.equal(M.toCents('280'),28000);
  assert.equal(M.toCents('280,00'),28000);
  assert.equal(M.toCents('1.234,56'),123456);
  assert.equal(M.toCents('1234.56'),123456);
  assert.equal(M.toCents('R$ 18.435,00'),1843500);
  assert.equal(M.fromCents(28000),280);
})();

(()=>{
  const d=[1,2,3,4].map(id=>({id,operation_id:'d'+id,funcionario_id:'f1',obra_id:'A',valor:200,status:'aberto'}));
  const v=[{id:10,operation_id:'v10',funcionario_id:'f1',obra_id:'A',valor:500},{id:11,operation_id:'v11',funcionario_id:'f1',obra_id:'A',valor:160}];
  const s=F.buildSettlement({employeeId:'f1',dailies:d,advances:v,extras:[]});
  assert.equal(s.totals.gross,80000,'bruto deve ser R$ 800');
  assert.equal(s.totals.advances,66000,'Vales devem somar R$ 660');
  assert.equal(s.totals.advanceApplied,66000,'R$ 660 devem abater nesta folha');
  assert.equal(s.totals.net,14000,'líquido deve ser exatamente R$ 140');
  assert.equal(s.entries.length,1);
  assert.equal(s.entries[0].valor_cents,14000);
})();

(()=>{
  const d=[
    {id:1,operation_id:'a',funcionario_id:'f1',obra_id:'A',valor:200},
    {id:2,operation_id:'b',funcionario_id:'f1',obra_id:'B',valor:200},
    {id:3,operation_id:'c',funcionario_id:'f1',obra_id:'C',valor:200}
  ];
  const s=F.buildSettlement({employeeId:'f1',dailies:d,extras:[],advances:[]});
  assert.deepEqual(s.entries.map(x=>[x.obra_id,x.valor_cents]),[['A',20000],['B',20000],['C',20000]],'3 diárias em 3 obras precisam gerar valores inteiros exatos por obra, sem rateio');
})();

(()=>{
  const d=[{id:1,operation_id:'d1',funcionario_id:'f1',obra_id:'A',valor:400},{id:2,operation_id:'d2',funcionario_id:'f1',obra_id:'B',valor:200}];
  const v=[{id:3,operation_id:'v1',funcionario_id:'f1',obra_id:'A',valor:300}];
  const s=F.buildSettlement({employeeId:'f1',dailies:d,advances:v,extras:[]});
  assert.deepEqual(s.entries.map(x=>[x.obra_id,x.valor_cents]),[['A',10000],['B',20000]],'Vale deve abater somente na obra em que foi lançado');
})();

(()=>{
  const d=[{id:1,operation_id:'d1',funcionario_id:'f1',obra_id:'A',valor:200}];
  const extras=[{id:4,operation_id:'e1',funcionario_id:'f1',obra_id:'A',valor:100,status:'aberto'}];
  const s=F.buildSettlement({employeeId:'f1',dailies:d,extras,advances:[]});
  assert.equal(s.totals.dailies,20000);
  assert.equal(s.totals.extras,10000);
  assert.equal(s.totals.gross,30000,'Bônus/Extra deve somar uma única vez ao bruto');
  assert.equal(s.totals.net,30000);
})();

(()=>{
  const same={id:1,operation_id:'unique-daily',funcionario_id:'f1',obra_id:'A',valor:200};
  const s=F.buildSettlement({employeeId:'f1',dailies:[same,{...same,id:999}],extras:[],advances:[]});
  assert.equal(s.totals.gross,20000,'mesma operation_id não pode duplicar a diária');
})();

(()=>{
  const s=F.buildSettlement({employeeId:'f1',dailies:[{id:1,funcionario_id:'f1',valor:200}],extras:[],advances:[]});
  assert.equal(s.canSettle,false);
  assert.throws(()=>F.assertSettlement(s),e=>e.code==='SETTLEMENT_INVALID');
})();

(()=>{
  const x=F.contractSummary({original:10000,extras:[{valor:1000},{valor:500}],received:8000,expenses:3000});
  assert.equal(x.original,1000000);
  assert.equal(x.extras,150000);
  assert.equal(x.updated,1150000);
  assert.equal(x.remaining,350000);
  assert.equal(x.result,500000);
  assert.equal(x.margin,62.5);
})();

console.log('REFACTOR TEAM FINANCE OK');