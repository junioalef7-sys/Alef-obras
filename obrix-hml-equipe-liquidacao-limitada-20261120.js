(()=>{
'use strict';
// Somente Preview isolada. Não modifica telas ou pagamentos do OBRIX oficial.
const hml='xavwkfgrnowmusbkbiea';
const host=String(location.hostname||'').toLowerCase();
if(!(host.startsWith('obrix-restauracao-app-isolado-20261118')&&host.endsWith('.vercel.app'))
   ||window.__OBRIX_HML_PROJECT_REF!==hml)return;
const api=window.OBRIX_LIQUIDACAO_SEGURA;
if(!api||typeof api.registrar!=='function'||api.__hmlLimitado20261120)return;
const original=api.registrar.bind(api);
const cache=new Map();
const uuid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||''));
const erro=s=>{throw Error(s)};
function requestId(key){
 let id=cache.get(key);
 if(id)return id;
 const storageKey='obrix:hml:pagamento-limitado:'+key;
 try{id=sessionStorage.getItem(storageKey)}catch{}
 if(!uuid(id)){
  id=crypto.randomUUID();
  try{sessionStorage.setItem(storageKey,id)}catch{}
 }
 cache.set(key,id);
 return id;
}
// The ledger survives a page refresh in the SAME browser session. A lost
// HTTP response can be recovered with the original request UUID and rows.
function pendingKey(company,employee,work,day){
 return 'obrix:hml:pagamento-pendente:'+JSON.stringify([company,employee,work,day]);
}
function pendingRead(key){
 try{
  const entry=JSON.parse(sessionStorage.getItem(key)||'null');
  if(!entry||typeof entry!=='object'||!uuid(entry.operation)||
     !Number.isFinite(entry.created)||
     Date.now()-entry.created>48*3600*1000||
     Date.now()+60000<entry.created)return null;
  const ids=entry.ids;
  if(!ids||!Array.isArray(ids.d)||!Array.isArray(ids.v)||!Array.isArray(ids.b))
   return null;
  if(![...ids.d,...ids.v,...ids.b].every(uuid)||
     ids.d.length+ids.v.length+ids.b.length===0||
     [ids.d.length,ids.v.length,ids.b.length].some(n=>n>100))
   return null;
  return entry;
 }catch{return null}
}
function pendingSave(key,operation,signature,ids,expected){
 try{
  sessionStorage.setItem(key,JSON.stringify({
   operation,signature,ids,expected,created:Date.now()
  }));
 }catch{/* one-tab fallback: database also blocks reuse of paid entries */}
}
api.registrar=async function(payload={}){
 const backend=window.OBRIX_BACKEND;
 if(!backend?.init||!backend?.profile)
  return erro('Banco de homologação indisponível. Pagamento bloqueado.');
 if(!navigator.onLine)
  return erro('Conecte-se à internet antes de registrar o pagamento.');
 const sb=await backend.init();
 if(new URL(sb.supabaseUrl||'https://invalid.invalid').origin!=='https://'+hml+'.supabase.co')
  return erro('O pagamento deve utilizar exclusivamente o banco isolado.');
 const profile=await backend.profile(),company=String(profile?.empresa_id||'');
 if(!uuid(company))return erro('Empresa de homologação inválida.');
 const access=await sb.rpc('obrix_acesso_total',{p_empresa_id:company});
 if(access.error)return erro('Não foi possível verificar o estado da assinatura.');
 if(access.data===true)return original(payload);
 if(access.data!==false)return erro('Estado da assinatura não reconhecido.');
 const selected=await sb.from('obrix_hml_limite_selecao')
  .select('obra_id,funcionario_id').eq('empresa_id',company).maybeSingle();
 if(selected.error)return erro('Não foi possível consultar a obra selecionada.');
 const work=String(selected.data?.obra_id||''),employee=String(selected.data?.funcionario_id||'');
 const id=String(payload.funcionarioId||'');
 if(!uuid(work)||!uuid(employee))return erro('Plano limitado: escolha uma obra e um funcionário nas configurações.');
 if(id!==employee)return erro('Plano limitado: somente o funcionário escolhido pode ser pago.');
 const day=String(payload.data||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return erro('Informe a data válida do pagamento.');
 const queries=[
  sb.from('diarias').select('id,obra_id,funcionario_id,valor_total').eq('empresa_id',company)
   .eq('obra_id',work).eq('funcionario_id',employee).eq('paga',false).is('cancelada_em',null),
  sb.from('vales').select('id,obra_id,funcionario_id,valor').eq('empresa_id',company)
   .eq('obra_id',work).eq('funcionario_id',employee).eq('quitado',false).is('estornado_em',null),
  sb.from('bonus_extras').select('id,obra_id,funcionario_id,valor').eq('empresa_id',company)
   .eq('obra_id',work).eq('funcionario_id',employee).eq('pago',false),
  sb.from('funcionarios').select('id,nome').eq('empresa_id',company).eq('id',employee).maybeSingle()
 ];
 const [diarias,vales,bonus,func]=await Promise.all(queries);
 for(const row of [diarias,vales,bonus,func]){
  if(row.error)return erro('Não foi possível verificar as pendências da equipe.');
 }
 if(!func.data)return erro('Funcionário autorizado não encontrado.');
 const ds=diarias.data||[],vs=vales.data||[],bs=bonus.data||[];
 const currentIds={
  d:ds.map(x=>x.id).sort(),v:vs.map(x=>x.id).sort(),b:bs.map(x=>x.id).sort()
 };
 const rowCount=currentIds.d.length+currentIds.v.length+currentIds.b.length;
 const ledgerKey=pendingKey(company,employee,work,day);
 const previous=pendingRead(ledgerKey);
 let ids=currentIds;
 let signature=JSON.stringify([company,employee,work,day,currentIds]);
 let operation;
 if(rowCount===0&&previous){
  // Lost response recovery only. Re-run the same request; DB returns the
  // previous payment or rejects records no longer available.
  if(payload.esperado!==undefined&&payload.esperado!==null&&
     Math.round(Number(payload.esperado)*100)!==previous.expected)
   return erro('Valor do pagamento anterior divergente. Consulte o histórico.');
  ids=previous.ids;
  signature=JSON.stringify([company,employee,work,day,ids]);
  if(signature!==previous.signature)
   return erro('Identificador de reenvio inconsistente. Consulte o histórico.');
  operation=previous.operation;
 }else{
  const calculo=api.calcular({ds,vs,bs});
  if(calculo.erros?.length)return erro(calculo.erros.join(' '));
  if(payload.esperado!==undefined&&payload.esperado!==null&&
     Math.round(Number(payload.esperado)*100)!==calculo.liquido)
   return erro('O valor da folha mudou; abra novamente o pagamento.');
  operation=requestId(signature);
  // Write *before* calling the RPC, so a lost response remains recoverable.
  pendingSave(ledgerKey,operation,signature,currentIds,calculo.liquido);
 }
 const result=await sb.rpc('obrix_hml_pagar_equipe_limitado',{
  p_request_id:operation,
  p_funcionario_id:employee,
  p_obra_id:work,
  p_data_pagamento:day,
  p_diaria_ids:ids.d,
  p_vale_ids:ids.v,
  p_bonus_ids:ids.b
 });
 if(result.error)
  return erro('Pagamento não confirmado: '+String(result.error.message||'falha no servidor')+
     '. Consulte o histórico antes de repetir.');
 const data=result.data;
 if(data?.ok!==true||!uuid(data.pagamento_id))
  return erro('Pagamento não confirmado pelo banco. Consulte o histórico.');
 if(data.estornado===true){
  cache.delete(signature);
  try{
   sessionStorage.removeItem('obrix:hml:pagamento-limitado:'+signature);
   sessionStorage.removeItem(ledgerKey);
  }catch{}
  return erro('Este pagamento foi estornado. Confira o histórico e confirme novamente se deseja pagar.');
 }
 let valores=data;
 if(data.ja_registrado===true){
  const saved=await sb.from('pagamentos_equipe')
   .select('valor_bruto,valor_vales,valor_liquido')
   .eq('empresa_id',company).eq('id',data.pagamento_id).maybeSingle();
  if(saved.error||!saved.data)return erro('Pagamento encontrado, mas não foi possível conferir os valores.');
  valores=saved.data;
 }
 return {
  ok:true,id:data.pagamento_id,nome:func.data.nome,
  bruto:Number(valores.valor_bruto||0),vales:Number(valores.valor_vales||0),
  liquido:Number(valores.valor_liquido||0),
  despesasNovas:Number(valores.valor_liquido||0),
  homologacao:true
 };
};
Object.defineProperty(api,'__hmlLimitado20261120',{value:true,configurable:false});
})();