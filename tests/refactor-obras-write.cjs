const assert=require('assert');
const {createWriter,obraPayload,checklistPayload}=require('../src/adapters/supabase-obras-write.js');
assert.equal(obraPayload({nome:' Obra A ',valor:'1000.129',status:'andamento',progresso:120},'u1').valor,1000.13);
assert.equal(obraPayload({nome:'Obra A',status:'andamento',progresso:120},'u1').progresso,100);
assert.equal(checklistPayload({obra_id:1,tarefa:'Reboco',concluida:true,progresso:20},'u1').progresso,100);
assert.throws(()=>obraPayload({nome:'',status:'andamento'},'u1'),/NOME_OBRA_OBRIGATORIO/);
assert.throws(()=>checklistPayload({obra_id:0,tarefa:'X'},'u1'),/OBRA_INVALIDO/);
const calls=[];
function chain(table,kind,payload){const api={eq(c,v){calls.push(['eq',table,c,v]);return api},select(){return api},single(){return Promise.resolve({data:{id:9,...payload},error:null})}};return api;}
const client={auth:{getSession:async()=>({data:{session:{user:{id:'u1'}}},error:null})},from(table){return {insert(p){calls.push(['insert',table,p]);return chain(table,'insert',p)},update(p){calls.push(['update',table,p]);return chain(table,'update',p)}}}};
(async()=>{const w=createWriter(client);await w.saveObra({nome:'Nova',valor:10,status:'planejada'});await w.saveChecklist({obra_id:1,tarefa:'Alvenaria',progresso:25});await w.saveObra({id:5,nome:'Editada',valor:20,status:'andamento'});assert.ok(calls.some(c=>c[0]==='insert'&&c[1]==='obras'));assert.ok(calls.some(c=>c[0]==='insert'&&c[1]==='checklist'));assert.ok(calls.some(c=>c[0]==='eq'&&c[2]==='user_id'&&c[3]==='u1'));console.log('REFRACTOR OBRAS WRITE OK');})().catch(e=>{console.error(e);process.exit(1)});