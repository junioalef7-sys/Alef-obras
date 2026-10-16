(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.EdificIntegrationCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function createIntegrationController(options={}){
    const auth=options.auth;
    const sync=options.sync;
    const backup=options.backup;
    const teamFinance=options.teamFinance;
    const billing=options.billing;
    const deletion=options.deletion;
    if(!auth||!sync||!backup||!teamFinance||!billing||!deletion)throw new Error('Núcleos obrigatórios ausentes.');

    const loadSubscription=typeof options.loadSubscription==='function'?options.loadSubscription:async()=>({});
    const saveSubscription=typeof options.saveSubscription==='function'?options.saveSubscription:async()=>true;
    const listeners=new Set();
    let unsubscribeAuth=null;
    let state={
      started:false,
      auth:auth.getState?.()||null,
      subscription:null,
      access:{mode:'limited',reason:'not_started',limits:{works:1,employees:1}},
      sync:{total:0,pending:0,sending:0,exhausted:0},
      lastSync:null,
      lastError:null
    };

    function snapshot(){return JSON.parse(JSON.stringify(state));}
    function emit(patch={}){
      state={...state,...patch};
      const s=snapshot();
      for(const fn of listeners){try{fn(s)}catch(e){console.warn('EdificIntegration listener',e)}}
      return s;
    }
    function subscribe(fn){if(typeof fn!=='function')throw new Error('Listener inválido.');listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn)}
    function getState(){return snapshot()}

    async function refreshSyncStats(){
      const stats=await sync.stats();emit({sync:stats});return stats;
    }
    async function refreshSubscription(now){
      const sub=await loadSubscription();
      const normalized=sub?.trial_inicio&&sub?.trial_fim?sub:billing.ensureTrial(sub||{},now);
      if(JSON.stringify(normalized)!==JSON.stringify(sub||{}))await saveSubscription(normalized);
      const access=billing.accessState(normalized,now);
      emit({subscription:normalized,access,lastError:null});
      return {subscription:normalized,access};
    }

    async function start(now){
      if(state.started)return snapshot();
      unsubscribeAuth=auth.subscribe(async a=>{
        emit({auth:a});
        if(a?.status===auth.STATES?.SIGNED_IN||a?.status==='signed_in'){
          try{await refreshSubscription(now)}catch(error){emit({lastError:String(error?.message||error)})}
        }else if(a?.status===auth.STATES?.SIGNED_OUT||a?.status==='signed_out'){
          emit({subscription:null,access:{mode:'limited',reason:'signed_out',limits:{works:1,employees:1}}});
        }
      });
      emit({started:true});
      await auth.bootstrap();
      await refreshSyncStats();
      return snapshot();
    }

    async function flushSync(){
      try{
        const result=await sync.flush();
        const stats=await refreshSyncStats();
        emit({lastSync:result,lastError:result.failed?`Sincronização com ${result.failed} falha(s).`:null,sync:stats});
        return result;
      }catch(error){
        emit({lastError:String(error?.message||error)});
        throw error;
      }
    }

    function prepareImport(file,current,options){return backup.planImport(file,current,options)}
    function verifyImport(plan,actual){return backup.assertApplied(plan,actual)}
    function prepareTeamSettlement(input){const s=teamFinance.buildSettlement(input);return teamFinance.assertSettlement(s)}

    function prepareCheckout(input={}){
      const sub=input.subscription||state.subscription||{};
      return billing.checkoutPolicy({...input,subscription:sub});
    }
    function providerCheckoutCreated(checkout={}){
      // Criar checkout nunca altera o acesso. Acesso depende exclusivamente do estado da assinatura/webhook.
      return {checkout:{...checkout,status:'pending'},access:state.access,unlocked:false};
    }
    async function applyBillingEvent(event,processedEventIds=[],now){
      const current=state.subscription||{};
      const result=billing.applyProviderEvent({subscription:current,event,processedEventIds,now});
      if(!result.duplicate)await saveSubscription(result.subscription);
      const access=billing.accessState(result.subscription,now);
      emit({subscription:result.subscription,access,lastError:null});
      return {...result,access};
    }

    function prepareAccountDeletion(input={}){
      return deletion.canDelete({...input,subscription:input.subscription||state.subscription||{}});
    }

    function health(){
      const authState=state.auth||{};
      return {
        ok:Boolean(state.started&&authState.status),
        auth_status:authState.status||'unknown',
        access_mode:state.access?.mode||'limited',
        sync_pending:Number(state.sync?.total||0),
        has_subscription:Boolean(state.subscription),
        last_error:state.lastError
      };
    }

    function destroy(){try{unsubscribeAuth?.()}catch(_){}unsubscribeAuth=null;listeners.clear();auth.destroy?.();state={...state,started:false}}

    return Object.freeze({start,subscribe,getState,refreshSubscription,flushSync,prepareImport,verifyImport,prepareTeamSettlement,prepareCheckout,providerCheckoutCreated,applyBillingEvent,prepareAccountDeletion,health,destroy});
  }

  return Object.freeze({createIntegrationController});
});