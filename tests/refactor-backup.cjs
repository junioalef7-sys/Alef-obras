const assert=require('node:assert/strict');
const B=require('../src/core/backup-core.js');

function sample(){
  return {
    data:{
      obras:[{id:1,nome:'Obra A'}],
      funcionarios:[{id:10,nome:'João'}],
      checklist:[{id:20,obra_id:1,tarefa:'Alvenaria'}],
      servicos_adicionais:[],servicos:[],terceirizados:[],orcamentos:[],
      diarias:[{id:30,funcionario_id:10,valor:280,operation_id:'dia-1'}],
      gastos:[{id:40,valor:500,operation_id:'g-1'}],
      pagamentos:[{id:50,valor:18435,operation_id:'p-1'}],
      faltas:[{id:60,funcionario_id:10,data:'2026-10-01'}],
      adiantamentos:[{id:70,valor:660,operation_id:'v-1'}],
      diario:[],presencas:[],pagamentos_terceirizados:[]
    },
    aux:{funcionarioObras:{10:1},adiantamentosAplicados:{70:0},servicosAdicionais:{},diariasBaixadas:{30:false}}
  };
}

(()=>{
  const b=B.createBackup(sample(),{backupId:'test-1',date:'2026-10-16T00:00:00.000Z'});
  assert.equal(b.app,'EDIFIC');
  assert.equal(b.version,'11.0');
  assert.equal(b.manifest.integrity_snapshot.diarias.sum_cents,28000,'R$ 280 precisa continuar R$ 280');
  assert.equal(b.manifest.integrity_snapshot.adiantamentos.sum_cents,66000,'Vale R$ 660 precisa permanecer exato');
  assert.equal(b.manifest.integrity_snapshot.pagamentos.sum_cents,1843500,'Quitado R$ 18.435 precisa permanecer exato');
  const c=B.validateBackup(b);
  assert.equal(c.ok,true);
  assert.equal(c.total,b.manifest.total_records);
})();

(()=>{
  const b=B.createBackup(sample());
  b.data.adiantamentos[0].valor=640;
  assert.throws(()=>B.validateBackup(b),e=>e.code==='BACKUP_INTEGRITY_MISMATCH','backup alterado precisa ser recusado');
})();

(()=>{
  const source=sample();const b=B.createBackup(source);
  const current={obras:[{id:999,nome:'Não pode sobreviver no modo exact'}],funcionarios:[],diarias:[],gastos:[],pagamentos:[],faltas:[],adiantamentos:[]};
  const plan=B.planImport(b,current,{mode:'exact'});
  assert.equal(plan.after.obras.length,1);
  assert.equal(plan.after.obras[0].id,1,'IDs devem ser preservados exatamente');
  assert.equal(plan.aux.funcionarioObras['10'],1);
  const ok=B.assertApplied(plan,plan.after);
  assert.equal(ok.ok,true);
})();

(()=>{
  const b=B.createBackup(sample());const plan=B.planImport(b,{},{});
  const partial=JSON.parse(JSON.stringify(plan.after));partial.pagamentos=[];
  assert.throws(()=>B.assertApplied(plan,partial),e=>e.code==='IMPORT_INCOMPLETE'&&e.diffs.some(d=>d.table==='pagamentos'),'importação parcial nunca pode ser aprovada');
})();

(()=>{
  const b=B.createBackup(sample());
  const current=sample().data;
  current.diarias.push({id:999,valor:100,operation_id:'dia-1'}); // mesma operação, não pode duplicar
  const plan=B.planImport(b,current,{mode:'merge'});
  assert.equal(plan.after.diarias.filter(x=>x.operation_id==='dia-1').length,1,'operation_id duplicado precisa resultar em um único registro');
})();

(()=>{
  const src=sample();const modern=B.createBackup(src);
  const legacy={app:'EDIFIQ',version:'10.0',manifest:{tables:modern.manifest.tables,total_records:modern.manifest.total_records,integrity_snapshot:modern.manifest.integrity_snapshot},data:modern.data,...src.aux};
  const checked=B.validateBackup(legacy);
  assert.equal(checked.ok,true);
  assert.match(checked.warnings.join(' '),/legado 10\.0/i,'backup v10 deve ser reconhecido como legado, não descartado');
})();

(()=>{
  assert.throws(()=>B.validateBackup({app:'OUTRO',version:'10.0',data:{}}),/não pertence ao Edific/i);
})();

(()=>{
  const b=B.createBackup(sample());
  const before=sample().data;
  const original=JSON.stringify(before);
  B.planImport(b,before,{mode:'exact'});
  assert.equal(JSON.stringify(before),original,'planejar importação não pode alterar os dados atuais');
})();

console.log('REFACTOR BACKUP OK');