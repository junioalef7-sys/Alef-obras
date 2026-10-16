(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.EdificSyncQueue=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function fallbackId(){
    return 'op_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,12);
  }

  function createMemoryStore(initial=[]){
    let rows=structuredClone(initial);
    return {
      async load(){return structuredClone(rows)},
      async save(next){rows=structuredClone(next)},
      async clear(){rows=[]}
    };
  }

  function createSyncQueue(options={}){
    const store=options.store;
    const send=options.send;
    if(!store?.load||!store?.save) throw new Error('store inválido.');
    if(typeof send!=='function') throw new Error('send é obrigatório.');

    const maxAttempts=Math.max(1,Number(options.maxAttempts||8));
    const now=options.now||(()=>Date.now());
    const makeId=options.makeId||(()=>globalThis.crypto?.randomUUID?.()||fallbackId());
    let flushing=null;

    async function list(){
      const rows=await store.load();
      return Array.isArray(rows)?rows:[];
    }

    async function enqueue(input={}){
      const type=String(input.type||'').trim();
      const entity=String(input.entity||'').trim();
      if(!type||!entity) throw new Error('type e entity são obrigatórios.');
      const rows=await list();
      const operationId=String(input.operationId||makeId());
      const existing=rows.find(x=>x.operationId===operationId);
      if(existing) return existing;
      const op={
        operationId,
        type,
        entity,
        entityId:input.entityId??null,
        payload:structuredClone(input.payload??{}),
        status:'pending',
        attempts:0,
        createdAt:now(),
        updatedAt:now(),
        lastError:null
      };
      rows.push(op);
      await store.save(rows);
      return structuredClone(op);
    }

    async function remove(operationId){
      const rows=await list();
      const next=rows.filter(x=>x.operationId!==operationId);
      await store.save(next);
      return next.length!==rows.length;
    }

    async function mark(operationId,patch){
      const rows=await list();
      const idx=rows.findIndex(x=>x.operationId===operationId);
      if(idx<0) return null;
      rows[idx]={...rows[idx],...patch,updatedAt:now()};
      await store.save(rows);
      return structuredClone(rows[idx]);
    }

    async function flushOnce(){
      const rows=await list();
      const pending=rows.filter(x=>x.status!=='done'&&x.attempts<maxAttempts);
      const result={sent:0,failed:0,remaining:pending.length};
      for(const op of pending){
        await mark(op.operationId,{status:'sending',attempts:Number(op.attempts||0)+1,lastError:null});
        try{
          const ack=await send(structuredClone(op));
          if(ack===false) throw new Error('Operação não confirmada pelo servidor.');
          await remove(op.operationId);
          result.sent++;
        }catch(error){
          await mark(op.operationId,{status:'pending',lastError:String(error?.message||error||'Falha de sincronização')});
          result.failed++;
          // Para no primeiro erro de transporte para não martelar a rede offline.
          if(options.stopOnError!==false) break;
        }
      }
      result.remaining=(await list()).length;
      return result;
    }

    async function flush(){
      if(flushing) return flushing;
      flushing=flushOnce().finally(()=>{flushing=null});
      return flushing;
    }

    async function retryAll(){
      const rows=await list();
      for(const row of rows){
        row.status='pending';
        row.attempts=0;
        row.lastError=null;
        row.updatedAt=now();
      }
      await store.save(rows);
      return rows.length;
    }

    async function stats(){
      const rows=await list();
      return {
        total:rows.length,
        pending:rows.filter(x=>x.status==='pending').length,
        sending:rows.filter(x=>x.status==='sending').length,
        exhausted:rows.filter(x=>x.attempts>=maxAttempts).length
      };
    }

    return Object.freeze({enqueue,list,flush,retryAll,remove,stats});
  }

  return Object.freeze({createMemoryStore,createSyncQueue});
});
