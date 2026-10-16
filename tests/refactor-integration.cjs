const assert=require('node:assert/strict');
const Auth=require('../src/core/auth-controller.js');
const Sync=require('../src/core/sync-queue.js');
const Backup=require('../src/core/backup-core.js');
const TF=require('../src/core/team-finance-core.js');
const Billing=require('../src/core/billing-core.js');
const Deletion=require('../src/core/account-deletion-core.js');
const Integration=require('../src/core/integration-controller.js');

(async()=>{
  let authCb=null;
  const session={user:{id:'u1',email:'cliente@edific.test'}};
  const client={auth:{
    async getSession(){return{data:{session},error:null}},
    onAuthStateChange(cb){authCb=cb;return{data:{subscription:{unsubscribe(){}}}}},
    async signInWithPassword(){return{data:{session},error:null}},
    async signOut(){return{error:null}}
  }};
  const auth=Auth.createAuthController({getClient:async()=>client,timeoutMs:2000});

  let failFirst=true;
  const store=Sync.createMemoryStore();
  const sync=Sync.createSyncQueue({store,send:async op=>{
    if(failFirst){failFirst=false;throw new Error('rede indisponível')}
    return {ok:true,operation_id:op.operationId};
  }});

  const startedAt='2026-10-01T12:00:00.000Z';
  let subscription={status:'trial',plano:'trial',trial_inicio:startedAt,trial_fim:Billing.addDays(startedAt,7)};
  const saved=[];
  const app=Integration.createIntegrationController({
    auth,sync,backup:Backup,teamFinance:TF,billing:Billing,deletion:Deletion,
    loadSubscription:async()=>subscription,
    saveSubscription:async next=>{subscription={...next};saved.push({...next});return true}
  });

  await app.start('2026-10-03T12:00:00.000Z');
  let st=app.getState();
  assert.equal(st.auth.status,'signed_in');
  assert.equal(st.access.mode,'full');
  assert.equal(st.access.reason,'trial');

  await sync.enqueue({operationId:'op-1',type:'upsert',entity:'obra',entityId:'o1',payload:{nome:'Obra 1'}});
  const firstFlush=await app.flushSync();
  assert.equal(firstFlush.failed,1);
  assert.equal(app.getState().auth.status,'signed_in','falha de sync não pode derrubar login');
  const secondFlush=await app.flushSync();
  assert.equal(secondFlush.sent,1);
  assert.equal((await sync.stats()).total,0);

  const backup=Backup.createBackup({data:{
    obras:[{id:'o1',nome:'Obra 1'}],
    funcionarios:[{id:'f1',nome:'João'}],
    checklist:[],servicos_adicionais:[],servicos:[],terceirizados:[],orcamentos:[],
    diarias:[{id:'d1',operation_id:'d1',funcionario_id:'f1',obra_id:'o1',valor:200}],
    gastos:[],pagamentos:[],faltas:[],adiantamentos:[],diario:[],presencas:[],pagamentos_terceirizados:[]
  }});
  const plan=app.prepareImport(backup,{},{mode:'exact'});
  assert.equal(plan.expected.obras.count,1);
  assert.doesNotThrow(()=>app.verifyImport(plan,plan.after));
  const broken={...plan.after,funcionarios:[]};
  assert.throws(()=>app.verifyImport(plan,broken),e=>e.code==='IMPORT_INCOMPLETE');

  const settlement=app.prepareTeamSettlement({
    employeeId:'f1',
    dailies:[
      {id:1,operation_id:'a',funcionario_id:'f1',obra_id:'A',valor:200},
      {id:2,operation_id:'b',funcionario_id:'f1',obra_id:'B',valor:200},
      {id:3,operation_id:'c',funcionario_id:'f1',obra_id:'C',valor:200}
    ],
    extras:[],advances:[]
  });
  assert.deepEqual(settlement.entries.map(x=>[x.obra_id,x.valor_cents]),[['A',20000],['B',20000],['C',20000]]);

  const boleto=app.prepareCheckout({plan:'mensal',method:'boleto',now:'2026-10-03T12:00:00.000Z'});
  assert.equal(boleto.charge_on,subscription.trial_fim);
  assert.equal(boleto.unlock_on_checkout,false);
  const created=app.providerCheckoutCreated({id:'checkout-1',method:'boleto'});
  assert.equal(created.unlocked,false);
  assert.equal(created.access.mode,'full');

  const beforeEnd=app.getState().subscription.trial_fim;
  const paid=await app.applyBillingEvent({id:'evt-1',type:'PAYMENT_RECEIVED',billingType:'PIX',plan:'mensal',paymentDate:'2026-10-04T10:00:00.000Z'},[],'2026-10-04T10:00:00.000Z');
  assert.equal(paid.activated,true);
  assert.equal(paid.subscription.status,'ativa');
  assert.equal(paid.subscription.periodo_inicio,beforeEnd,'pagamento durante trial só inicia período pago no fim do trial');
  assert.equal(paid.access.mode,'full');

  const dup=await app.applyBillingEvent({id:'evt-1',type:'PAYMENT_RECEIVED',billingType:'PIX',plan:'mensal',paymentDate:'2026-10-04T10:00:00.000Z'},['evt-1'],'2026-10-04T10:00:00.000Z');
  assert.equal(dup.duplicate,true);
  assert.equal(dup.activated,false);

  subscription={...app.getState().subscription,provedor:'asaas',provedor_assinatura_id:'sub_123',provedor_status:'ACTIVE'};
  await app.refreshSubscription('2026-10-09T12:00:00.000Z');
  assert.throws(()=>app.prepareAccountDeletion({confirmation:'EXCLUIR MINHA CONTA',confirmed:true,password:'123',cancellation:{required:true,ok:false,network_error:true}}),e=>e.code==='SUBSCRIPTION_CANCEL_REQUIRED');
  const deletion=app.prepareAccountDeletion({confirmation:'EXCLUIR MINHA CONTA',confirmed:true,password:'123',cancellation:{required:true,ok:true,status:'INACTIVE'}});
  assert.equal(deletion.ok,true);

  const health=app.health();
  assert.equal(health.ok,true);
  assert.equal(health.auth_status,'signed_in');
  assert.equal(health.sync_pending,0);
  assert.equal(saved.length>0,true);

  if(authCb)authCb('TOKEN_REFRESHED',session);
  app.destroy();
  console.log('REFACTOR INTEGRATION OK');
})().catch(err=>{console.error(err);process.exit(1)});