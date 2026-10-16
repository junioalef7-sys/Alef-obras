(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.EdificAccountDeletionCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const INACTIVE=new Set(['inactive','canceled','cancelled','expired','sem_assinatura','none','']);
  const norm=v=>String(v??'').toLowerCase().trim();

  function cancellationRequired(subscription={}){
    const provider=norm(subscription.provedor??subscription.provider);
    const providerId=String(subscription.provedor_assinatura_id??subscription.provider_subscription_id??'').trim();
    const providerStatus=norm(subscription.provedor_status??subscription.provider_status);
    return Boolean(provider&&providerId&&!INACTIVE.has(providerStatus));
  }

  function buildDeletionPlan(subscription={}){
    const required=cancellationRequired(subscription);
    return Object.freeze({
      cancel_subscription_first:required,
      delete_allowed_without_provider_call:!required,
      confirmation_phrase:'EXCLUIR MINHA CONTA'
    });
  }

  function assertConfirmation(input={}){
    if(String(input.confirmation||'').trim()!=='EXCLUIR MINHA CONTA'||input.confirmed!==true){
      const e=new Error('Confirmação de exclusão inválida.');e.code='DELETE_CONFIRMATION_INVALID';throw e;
    }
    if(!String(input.password||'')){const e=new Error('Informe sua senha atual.');e.code='DELETE_PASSWORD_REQUIRED';throw e;}
    return true;
  }

  function assertProviderCancellation(input={}){
    if(!input.required)return true;
    if(input.network_error||input.provider_error||input.ok!==true){
      const e=new Error('Não foi possível cancelar a assinatura. A conta não foi excluída para evitar cobrança indevida.');
      e.code='SUBSCRIPTION_CANCEL_REQUIRED';throw e;
    }
    const status=norm(input.status);
    if(!INACTIVE.has(status)){
      const e=new Error('O cancelamento da assinatura ainda não foi confirmado. A conta não foi excluída.');
      e.code='SUBSCRIPTION_CANCEL_NOT_CONFIRMED';throw e;
    }
    return true;
  }

  function canDelete(input={}){
    assertConfirmation(input);
    const plan=buildDeletionPlan(input.subscription||{});
    if(plan.cancel_subscription_first)assertProviderCancellation({required:true,...(input.cancellation||{})});
    return {ok:true,plan};
  }

  return Object.freeze({cancellationRequired,buildDeletionPlan,assertConfirmation,assertProviderCancellation,canDelete});
});