'use strict';
const assert=require('node:assert/strict');
const api=require('../src/adapters/supabase-team-write.js');
function client(){
 const calls=[];
 return {calls,auth:{getSession:async()=>({data:{session:{user:{id:'user-1'}}},error:null})},from(table){
  const q={payload:null,insert(p){this.payload=p;calls.push({op:'insert',table,p});return this},update(p){this.payload=p;calls.push({op:'update',table,p});return this},eq(k,v){calls.push({op:'eq',table,k,v});return this},select(){return this},async single(){return {data:{id:1,...this.payload},error:null}}};
  return q;
 }};
}
(async()=>{
 const c=client(),w=api.createWriter(c);
 await w.saveFuncionario({nome:'Joao',funcao:'Pedreiro',valor_diaria:'120',obra_id:'10'});
 assert.equal(c.calls[0].p.obra_id,10);
 await w.saveDiaria({funcionario_id:'2',obra_id:'10',qtd:'0.5',valor_diaria:'120'});
 const d=c.calls.find(x=>x.op==='insert'&&x.table==='diarias');assert.equal(d.p.qtd,.5);assert.equal(d.p.status,'pendente');
 const u=client(),wu=api.createWriter(u);await wu.saveFuncionario({id:'7',nome:'Maria',valor_diaria:100});
 assert.ok(u.calls.some(x=>x.op==='eq'&&x.k==='id'&&x.v===7));assert.ok(u.calls.some(x=>x.op==='eq'&&x.k==='user_id'&&x.v==='user-1'));
 for(const bad of ['abc','0','-1','1.5'])await assert.rejects(()=>w.saveDiaria({funcionario_id:bad,obra_id:10,qtd:1,valor_diaria:100}),/ID_INVALIDO/);
 await assert.rejects(()=>w.saveDiaria({funcionario_id:2,obra_id:10,qtd:.25,valor_diaria:100}),/DIARIA_INVALIDA/);
 await assert.rejects(()=>w.saveFuncionario({id:'abc',nome:'X',valor_diaria:1}),/ID_INVALIDO/);
 console.log('refactor-team-write: ok');
})().catch(e=>{console.error(e);process.exit(1)});
