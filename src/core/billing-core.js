(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.EdificBillingCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const TRIAL_DAYS=7;
  const FULL_LIMITS=Object.freeze({works:null,employees:null});
  const LIMITED_LIMITS=Object.freeze({works:1,employees:1});
  const ACTIVE_STATUSES=new Set(['ativa','active','cortesia','courtesy']);
  const TRIAL_STATUSES=new Set(['trial','teste']);
  const VALID_PLANS=new Set(['mensal','anual']);
  const VALID_METHODS=new Set(['pix','boleto','cartao']);

  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const upper=v=>String(v??'').toUpperCase().trim();
  function time(v){const t=v instanceof Date?v.getTime():new Date(v).getTime();if(!Number.isFinite(t))throw new Error('Data inválida.');return t;}
  function iso(v){return new Date(time(v)).toISOString();}
  function nowIso(v){return v==null?new Date().toISOString():iso(v);}
  function addDays(v,days){return new Date(time(v)+Number(days)*86400000).toISOString();}
  function daysInMonth(year,month){return new Date(Date.UTC(year,month+1,0)).getUTCDate();}
  function addMonthsClamped(v,months){
    const d=new Date(time(v)),day=d.getUTCDate();
    const total=d.getUTCFullYear()*12+d.getUTCMonth()+Number(months);
    const y=Math.floor(total/12),m=((total%12)+12)%12;
    const out=new Date(d.getTime());
    out.setUTCFullYear(y,m,Math.min(day,daysInMonth(y,m)));
    return out.toISOString();
  }
  function addCycle(plan,v){
    const p=norm(plan);if(!VALID_PLANS.has(p))throw new Error('Plano inválido.');
    return addMonthsClamped(v,p==='anual'?12:1);
  }
  function isFuture(v,at){if(!v)return false;try{return time(v)>time(at)}catch(_){return false}}
  function maxIso(a,b){return new Date(Math.max(time(a),time(b))).toISOString();}

  function ensureTrial(subscription={},firstAccessAt){
    const current={...(subscription||{})};
    if(current.trial_inicio&&current.trial_fim)return current;
    const start=nowIso(firstAccessAt);
    const end=addDays(start,TRIAL_DAYS);
    return {...current,status:'trial',plano:current.plano||'trial',trial_inicio:start,trial_fim:end};
  }

  function accessState(subscription={},at){
    const now=nowIso(at),status=norm(subscription?.status);
    if(status==='cortesia'||status==='courtesy')return {mode:'full',reason:'courtesy',limits:FULL_LIMITS};
    if(ACTIVE_STATUSES.has(status)&&isFuture(subscription?.periodo_fim,now))return {mode:'full',reason:'paid',limits:FULL_LIMITS};
    if(TRIAL_STATUSES.has(status)&&isFuture(subscription?.trial_fim,now))return {mode:'full',reason:'trial',limits:FULL_LIMITS,trial_ends_at:iso(subscription.trial_fim)};
    return {mode:'limited',reason:'trial_or_payment_required',limits:LIMITED_LIMITS};
  }

  function checkoutPolicy(input={}){
    const plan=norm(input.plan),method=norm(input.method),now=nowIso(input.now),sub=input.subscription||{};
    if(!VALID_PLANS.has(plan))throw new Error('Plano inválido.');
    if(!VALID_METHODS.has(method))throw new Error('Forma de pagamento inválida.');
    const trialActive=isFuture(sub.trial_fim,now)&&TRIAL_STATUSES.has(norm(sub.status));
    const chargeOn=trialActive?iso(sub.trial_fim):now;
    return {
      plan,method,status:'pending',charge_on:chargeOn,trial_active:trialActive,
      trial_ends_at:trialActive?iso(sub.trial_fim):null,
      payer_data_required:method==='boleto',
      unlock_on_checkout:false,
      unlock_only_after_settlement:true
    };
  }

  function isSettledPaymentEvent(event={}){
    const type=upper(event.type??event.event),billingType=upper(event.billingType??event.billing_type);
    if(type==='PAYMENT_RECEIVED'&&billingType!=='RECEIVED_IN_CASH')return true;
    if(type==='PAYMENT_CONFIRMED'&&billingType==='CREDIT_CARD')return true;
    return false;
  }

  function paymentDate(event={},fallback){
    return nowIso(event.paymentDate??event.clientPaymentDate??event.paid_at??event.date??fallback);
  }
  function eventId(event={}){return String(event.id??event.event_id??event.eventKey??'').trim();}

  function applyProviderEvent(input={}){
    const sub={...(input.subscription||{})},event=input.event||{},id=eventId(event),now=nowIso(input.now);
    if(!id)throw new Error('Evento do provedor sem identificador.');
    const processed=new Set((input.processedEventIds||[]).map(String));
    if(processed.has(id))return {subscription:sub,processedEventIds:[...processed],duplicate:true,activated:false};
    processed.add(id);
    const type=upper(event.type??event.event),settled=isSettledPaymentEvent(event);
    if(settled){
      const plan=norm(event.plan??sub.plano_preferido??sub.plano??'mensal');
      if(!VALID_PLANS.has(plan))throw new Error('Plano pago inválido.');
      const paidAt=paymentDate(event,now);
      const periodStart=sub.trial_fim?maxIso(paidAt,sub.trial_fim):paidAt;
      const periodEnd=addCycle(plan,periodStart);
      return {
        subscription:{...sub,status:'ativa',plano:plan,plano_preferido:plan,periodo_inicio:periodStart,periodo_fim:periodEnd,ultima_cobranca_em:paidAt,proxima_cobranca_em:periodEnd,provedor_status:type,cancelar_no_fim:false,cancelado_em:null},
        processedEventIds:[...processed],duplicate:false,activated:true,period_start:periodStart,period_end:periodEnd
      };
    }
    if(type==='PAYMENT_OVERDUE'||type==='PAYMENT_REFUNDED'){
      const until=sub.periodo_fim||sub.trial_fim;
      if(!isFuture(until,now)&&norm(sub.status)!=='cortesia')sub.status='vencida';
      sub.provedor_status=type;
    }
    return {subscription:sub,processedEventIds:[...processed],duplicate:false,activated:false};
  }

  function canCheckoutUnlock(){return false;}

  return Object.freeze({
    TRIAL_DAYS,FULL_LIMITS,LIMITED_LIMITS,ensureTrial,accessState,checkoutPolicy,
    isSettledPaymentEvent,applyProviderEvent,addCycle,addDays,isFuture,canCheckoutUnlock
  });
});