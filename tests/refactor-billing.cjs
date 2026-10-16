const assert=require('node:assert/strict');
const B=require('../src/core/billing-core.js');

(()=>{
  const start='2026-10-05T12:00:00.000Z';
  const s=B.ensureTrial({},start);
  assert.equal(s.status,'trial');
  assert.equal(s.trial_inicio,start);
  assert.equal(s.trial_fim,'2026-10-12T12:00:00.000Z');
  assert.equal(B.TRIAL_DAYS,7);
})();

(()=>{
  const sub={status:'trial',trial_inicio:'2026-10-05T12:00:00.000Z',trial_fim:'2026-10-12T12:00:00.000Z'};
  const state=B.accessState(sub,'2026-10-08T12:00:00.000Z');
  assert.equal(state.mode,'full');
  assert.equal(state.reason,'trial');
  const policy=B.checkoutPolicy({subscription:sub,plan:'mensal',method:'pix',now:'2026-10-08T12:00:00.000Z'});
  assert.equal(policy.charge_on,'2026-10-12T12:00:00.000Z','quem contrata durante o trial só deve ser cobrado no fim dos 7 dias');
  assert.equal(policy.unlock_on_checkout,false);
  assert.equal(policy.unlock_only_after_settlement,true);
  assert.equal(policy.payer_data_required,false,'Pix não deve exigir nome/CPF antes de abrir o checkout');
})();

(()=>{
  const sub={status:'trial',trial_fim:'2026-10-12T12:00:00.000Z'};
  const p=B.checkoutPolicy({subscription:sub,plan:'mensal',method:'boleto',now:'2026-10-08T12:00:00.000Z'});
  assert.equal(p.status,'pending');
  assert.equal(p.unlock_on_checkout,false,'emitir boleto jamais pode liberar o aplicativo');
  assert.equal(p.payer_data_required,true);
})();

(()=>{
  const expired={status:'trial',trial_fim:'2026-10-12T12:00:00.000Z'};
  const state=B.accessState(expired,'2026-10-13T12:00:00.000Z');
  assert.equal(state.mode,'limited');
  assert.deepEqual(state.limits,{works:1,employees:1});
})();

(()=>{
  assert.equal(B.isSettledPaymentEvent({type:'PAYMENT_CREATED',billingType:'BOLETO'}),false);
  assert.equal(B.isSettledPaymentEvent({type:'PAYMENT_RECEIVED',billingType:'BOLETO'}),true);
  assert.equal(B.isSettledPaymentEvent({type:'PAYMENT_RECEIVED',billingType:'PIX'}),true);
  assert.equal(B.isSettledPaymentEvent({type:'PAYMENT_CONFIRMED',billingType:'CREDIT_CARD'}),true);
  assert.equal(B.isSettledPaymentEvent({type:'PAYMENT_CONFIRMED',billingType:'PIX'}),false);
})();

(()=>{
  const sub={status:'trial',trial_fim:'2026-10-12T12:00:00.000Z',plano_preferido:'mensal'};
  const e={id:'evt-1',type:'PAYMENT_RECEIVED',billingType:'PIX',paymentDate:'2026-10-12T12:03:00.000Z',plan:'mensal'};
  const r=B.applyProviderEvent({subscription:sub,event:e,processedEventIds:[],now:'2026-10-12T12:03:01.000Z'});
  assert.equal(r.activated,true);
  assert.equal(r.subscription.status,'ativa');
  assert.equal(r.subscription.periodo_inicio,'2026-10-12T12:03:00.000Z');
  assert.equal(r.subscription.periodo_fim,'2026-11-12T12:03:00.000Z');
  const duplicate=B.applyProviderEvent({subscription:r.subscription,event:e,processedEventIds:r.processedEventIds,now:'2026-10-12T12:04:00.000Z'});
  assert.equal(duplicate.duplicate,true,'webhook repetido não pode ativar nem cobrar duas vezes');
  assert.equal(duplicate.activated,false);
})();

(()=>{
  const sub={status:'trial',trial_fim:'2026-10-12T12:00:00.000Z',plano_preferido:'mensal'};
  const e={id:'evt-boleto-created',type:'PAYMENT_CREATED',billingType:'BOLETO',date:'2026-10-08T10:00:00.000Z'};
  const r=B.applyProviderEvent({subscription:sub,event:e,processedEventIds:[],now:'2026-10-08T10:00:00.000Z'});
  assert.equal(r.activated,false,'boleto emitido não pode ativar assinatura');
  assert.equal(r.subscription.status,'trial');
})();

assert.equal(B.canCheckoutUnlock(),false);
console.log('REFACTOR BILLING OK');