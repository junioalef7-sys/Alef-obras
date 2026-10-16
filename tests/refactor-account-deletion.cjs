const assert=require('node:assert/strict');
const D=require('../src/core/account-deletion-core.js');

(()=>{
  const plan=D.buildDeletionPlan({provedor:'asaas',provedor_assinatura_id:'sub-1',provedor_status:'ACTIVE'});
  assert.equal(plan.cancel_subscription_first,true);
  assert.equal(plan.delete_allowed_without_provider_call,false);
})();

(()=>{
  const plan=D.buildDeletionPlan({provedor:'asaas',provedor_assinatura_id:'sub-1',provedor_status:'INACTIVE'});
  assert.equal(plan.cancel_subscription_first,false);
})();

(()=>{
  assert.throws(()=>D.canDelete({
    confirmation:'EXCLUIR MINHA CONTA',confirmed:true,password:'senha',
    subscription:{provedor:'asaas',provedor_assinatura_id:'sub-1',provedor_status:'ACTIVE'},
    cancellation:{required:true,ok:false,provider_error:true}
  }),e=>e.code==='SUBSCRIPTION_CANCEL_REQUIRED'&&/não foi excluída/i.test(e.message));
})();

(()=>{
  assert.throws(()=>D.canDelete({
    confirmation:'EXCLUIR MINHA CONTA',confirmed:true,password:'senha',
    subscription:{provedor:'asaas',provedor_assinatura_id:'sub-1',provedor_status:'ACTIVE'},
    cancellation:{required:true,ok:true,status:'ACTIVE'}
  }),e=>e.code==='SUBSCRIPTION_CANCEL_NOT_CONFIRMED');
})();

(()=>{
  const result=D.canDelete({
    confirmation:'EXCLUIR MINHA CONTA',confirmed:true,password:'senha',
    subscription:{provedor:'asaas',provedor_assinatura_id:'sub-1',provedor_status:'ACTIVE'},
    cancellation:{required:true,ok:true,status:'INACTIVE'}
  });
  assert.equal(result.ok,true,'só deve liberar exclusão depois que a renovação estiver cancelada');
})();

(()=>{
  assert.throws(()=>D.assertConfirmation({confirmation:'excluir minha conta',confirmed:true,password:'senha'}),e=>e.code==='DELETE_CONFIRMATION_INVALID');
  assert.throws(()=>D.assertConfirmation({confirmation:'EXCLUIR MINHA CONTA',confirmed:true,password:''}),e=>e.code==='DELETE_PASSWORD_REQUIRED');
})();

console.log('REFACTOR ACCOUNT DELETION OK');