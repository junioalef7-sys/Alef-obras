const assert=require('assert');
const {createReadonlyAdapter}=require('../src/adapters/supabase-readonly.js');

const rows={
  obras:[{id:1,nome:'Obra A',valor:1000,status:'em_andamento'}],
  checklist:[{id:8,obra_id:1,tarefa:'Alvenaria',concluida:false,progresso:50,valor:0}],
  funcionarios:[{id:2,nome:'João',ativo:true,valor_diaria:200}],
  diarias:[{id:3,funcionario_id:2,obra_id:1,qtd:1,valor_diaria:200,status:'pendente'}],
  adiantamentos:[{id:4,funcionario_id:2,obra_id:1,valor:50}],
  gastos:[{id:5,obra_id:1,valor:100,categoria:'Material'}],
  pagamentos:[{id:6,obra_id:1,valor:400,tipo:'entrada'}],
  servicos_adicionais:[{id:7,obra_id:1,valor:250,descricao:'Extra'}]
};
const calls=[];
function query(table){
  const state={table,select:null,eq:null,order:null};
  const api={
    select(fields){state.select=fields;calls.push(['select',table,fields]);return api},
    eq(col,val){state.eq=[col,val];calls.push(['eq',table,col,val]);return api},
    order(col,opt){state.order=[col,opt];calls.push(['order',table,col,opt]);return api},
    insert(){throw new Error('WRITE_INSERT_CALLED')},
    update(){throw new Error('WRITE_UPDATE_CALLED')},
    delete(){throw new Error('WRITE_DELETE_CALLED')},
    upsert(){throw new Error('WRITE_UPSERT_CALLED')},
    then(resolve,reject){return Promise.resolve({data:rows[table]||[],error:null}).then(resolve,reject)}
  };
  return api;
}
const client={
  auth:{getSession:async()=>({data:{session:{user:{id:'user-123'}}},error:null})},
  from(table){calls.push(['from',table]);return query(table)}
};
(async()=>{
  const adapter=createReadonlyAdapter(client);
  assert.equal(adapter.mode,'readonly');
  for(const forbidden of ['insert','update','delete','upsert','save','remove'])assert.equal(typeof adapter[forbidden],'undefined');
  const snap=await adapter.loadSnapshot();
  assert.equal(snap.user_id,'user-123');
  assert.equal(snap.obras.length,1);assert.equal(snap.checklist.length,1);assert.equal(snap.checklist[0].progresso,50);
  assert.equal(snap.funcionarios.length,1);assert.equal(snap.diarias.length,1);
  assert.equal(snap.adiantamentos[0].valor,50);assert.equal(snap.gastos[0].valor,100);assert.equal(snap.pagamentos[0].valor,400);assert.equal(snap.servicos_adicionais[0].valor,250);
  const expected=['obras','checklist','funcionarios','diarias','adiantamentos','gastos','pagamentos','servicos_adicionais'];
  const froms=calls.filter(x=>x[0]==='from').map(x=>x[1]);
  assert.deepEqual(froms,expected);
  const eqs=calls.filter(x=>x[0]==='eq');
  assert.equal(eqs.length,8);for(const c of eqs){assert.equal(c[2],'user_id');assert.equal(c[3],'user-123')}
  assert.ok(!calls.some(x=>/^write/i.test(String(x[0]))));
  console.log('REFACTOR SUPABASE READONLY + CHECKLIST OK');
})().catch(e=>{console.error(e);process.exit(1)});