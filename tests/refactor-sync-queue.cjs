const assert=require('node:assert/strict');
const {createMemoryStore,createSyncQueue}=require('../src/core/sync-queue.js');

(async()=>{
  {
    const sent=[];
    const q=createSyncQueue({store:createMemoryStore(),send:async op=>{sent.push(op.operationId);return true},makeId:()=> 'op-1'});
    await q.enqueue({type:'upsert',entity:'diarias',entityId:10,payload:{valor:200}});
    await q.enqueue({type:'upsert',entity:'diarias',entityId:10,payload:{valor:200},operationId:'op-1'});
    assert.equal((await q.list()).length,1,'mesmo operationId não pode duplicar');
    const r=await q.flush();
    assert.equal(r.sent,1);
    assert.deepEqual(sent,['op-1']);
    assert.equal((await q.list()).length,0);
  }

  {
    let calls=0;
    const store=createMemoryStore();
    const q=createSyncQueue({store,send:async()=>{calls++;throw new Error('offline')},makeId:()=> 'offline-1'});
    await q.enqueue({type:'insert',entity:'vales',payload:{valor:100}});
    const r=await q.flush();
    assert.equal(r.failed,1);
    assert.equal(calls,1);
    const [op]=await q.list();
    assert.equal(op.status,'pending');
    assert.equal(op.attempts,1);
    assert.match(op.lastError,/offline/);
  }

  {
    let online=false,calls=0;
    const q=createSyncQueue({store:createMemoryStore(),send:async()=>{calls++;if(!online)throw new Error('sem rede');return true},makeId:()=> 'retry-1'});
    await q.enqueue({type:'delete',entity:'faltas',entityId:5});
    await q.flush();
    assert.equal((await q.list()).length,1);
    online=true;
    const r=await q.flush();
    assert.equal(r.sent,1);
    assert.equal((await q.list()).length,0);
    assert.equal(calls,2);
  }

  {
    let resolveSend;
    let calls=0;
    const q=createSyncQueue({store:createMemoryStore(),send:()=>{calls++;return new Promise(r=>{resolveSend=r})},makeId:()=> 'lock-1'});
    await q.enqueue({type:'insert',entity:'gastos',payload:{valor:50}});
    const a=q.flush();
    const b=q.flush();
    assert.strictEqual(a,b,'flush concorrente deve compartilhar a mesma execução');
    resolveSend(true);
    await a;
    assert.equal(calls,1,'operação não pode ser enviada duas vezes por flush concorrente');
  }

  {
    const q=createSyncQueue({store:createMemoryStore(),send:async()=>true,maxAttempts:2,makeId:()=> 'stats-1'});
    await q.enqueue({type:'insert',entity:'obras',payload:{nome:'Teste'}});
    const s=await q.stats();
    assert.equal(s.total,1);
    assert.equal(s.pending,1);
  }

  console.log('REFACTOR SYNC QUEUE OK');
})().catch(err=>{console.error(err);process.exit(1)});
