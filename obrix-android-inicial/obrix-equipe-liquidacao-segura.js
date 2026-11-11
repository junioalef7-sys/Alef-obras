(()=>{'use strict';
if(window.OBRIX_LIQUIDACAO_SEGURA)return;
const moeda=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const cent=v=>Math.round((Number(v)||0)*100);
const valor=c=>Math.round(c)/100;
const str=v=>String(v||'');
const emProcessamento=new Set();
function calcular({ds=[],bs=[],vs=[]}={}){
  const brutoDiarias=ds.reduce((a,x)=>a+cent(x.valor_total),0);
  const brutoBonus=bs.reduce((a,x)=>a+cent(x.valor),0);
  const adiantamentos=vs.reduce((a,x)=>a+cent(x.valor),0);
  const liquido=brutoDiarias+brutoBonus-adiantamentos;
  const obras=new Map(),porEtapa=new Map(),erros=[];
  function add(x,centavos,tipo){
    if(!x.obra_id){erros.push('Há '+tipo+' sem obra vinculada.');return}
    const id=str(x.obra_id);
    const ob=obras.get(id)||{id,bruto:0,vales:0,saldo:0};
    if(tipo==='vale')ob.vales+=centavos;else ob.bruto+=centavos;
    ob.saldo=ob.bruto-ob.vales;obras.set(id,ob);
    if(x.checklist_id){
      const k=id+'|'+str(x.checklist_id);
      porEtapa.set(k,(porEtapa.get(k)||0)+(tipo==='vale'?-centavos:centavos));
    }
  }
  ds.forEach(x=>add(x,cent(x.valor_total),'diária'));
  bs.forEach(x=>add(x,cent(x.valor),'bônus'));
  vs.forEach(x=>add(x,cent(x.valor),'vale'));
  const negativas=[...obras.values()].filter(x=>x.saldo<0);
  const obrasTrabalhadas=[...obras.values()].filter(x=>x.bruto>0);
  if(liquido<0)erros.push('O líquido ficou negativo. Revise os vales em aberto.');
  if(!ds.length&&!bs.length&&!vs.length)erros.push('Nenhum registro em aberto.');
  if(liquido>0&&!obrasTrabalhadas.length)erros.push('Não há obra com diária ou bônus para receber o pagamento.');
  return{bruto:brutoDiarias+brutoBonus,diarias:brutoDiarias,bonus:brutoBonus,vales:adiantamentos,liquido,obras,porEtapa,negativas,obrasTrabalhadas,precisaEscolherObra:liquido>0&&negativas.length>0&&obrasTrabalhadas.length>1,erros};
}
function opcoesDeObra(r,obras){
  const nomes=new Map((obras||[]).map(o=>[str(o.id),str(o.nome||'Obra')]));
  return r.obrasTrabalhadas.map(o=>({id:o.id,nome:nomes.get(o.id)||'Obra '+o.id.slice(0,8)}));
}
function linhasFinanceiro(r,eid,pid,nome,data,destino){
  const base={empresa_id:eid,tipo:'despesa',categoria:'mao_de_obra',
   descricao:'Pagamento de equipe - '+nome,data,origem:'pagamento_equipe',
   pagamento_equipe_id:pid,status_lancamento:'ativo'};
  if(r.liquido<=0)return[];
  if(r.negativas.length){
    const id=str(destino||r.obrasTrabalhadas[0]?.id);
    return[{...base,obra_id:id,valor:valor(r.liquido),
      checklist_id:null,checklist_ids:[],checklist_valores:{},
      observacoes:'Pagamento líquido com compensação de vales registrados nas obras de origem. Sem rateio entre obras.'}];
  }
  return[...r.obras.values()].filter(o=>o.saldo>0).map(o=>{
    const etapa={};let somaEtapas=0;
    for(const [k,c] of r.porEtapa)if(k.startsWith(o.id+'|')&&c>0){etapa[k.split('|')[1]]=valor(c);somaEtapas+=c}
    if(somaEtapas>o.saldo){for(const k of Object.keys(etapa))delete etapa[k]}
    const ids=Object.keys(etapa);
    return{...base,obra_id:o.id,valor:valor(o.saldo),
      checklist_id:ids[0]||null,checklist_ids:ids,checklist_valores:etapa}
  });
}
async function dadosAbertos(sb,eid,funcionarioId){
 const id=str(funcionarioId);
 const [dr,br,vr]=await Promise.all([
   sb.from('diarias').select('*').eq('empresa_id',eid).eq('funcionario_id',id).eq('paga',false),
   sb.from('bonus_extras').select('*').eq('empresa_id',eid).eq('funcionario_id',id).eq('pago',false),
   sb.from('vales').select('*').eq('empresa_id',eid).eq('funcionario_id',id).eq('quitado',false).is('estornado_em',null)
 ]);
 for(const x of [dr,br,vr])if(x.error)throw x.error;
 return{ds:dr.data||[],bs:br.data||[],vs:vr.data||[]};
}
async function verificarVinculos(sb,eid,rows,table,coluna){
 if(!rows.length)return;
 const q=await sb.from(table).select('id').eq('empresa_id',eid).eq('ativo',true)
   .in(coluna,rows.map(x=>x.id)).limit(1);
 if(q.error)throw q.error;
 if(q.data?.length)throw Error('Um registro já está vinculado a outro pagamento. Atualize a equipe antes de continuar.');
}
async function garantirValesFinanceiros(sb,eid,funcionario,vs){
 for(const v of vs){
   const q=await sb.from('financeiro').select('id,status_lancamento').eq('empresa_id',eid).eq('vale_id',v.id);
   if(q.error)throw q.error;
   if(q.data?.some(x=>x.status_lancamento==='ativo'))continue;
   if(q.data?.length)throw Error('O vale possui lançamento estornado no Financeiro. Revise antes de pagar.');
   if(cent(v.valor)<=0)throw Error('Vale sem valor válido.');
   const checklistId=v.checklist_id||null;
   const dados={empresa_id:eid,obra_id:v.obra_id,checklist_id:checklistId,
     checklist_ids:checklistId?[checklistId]:[],
     checklist_valores:checklistId?{[checklistId]:valor(cent(v.valor))}:{},
     tipo:'despesa',categoria:'mao_de_obra',
     descricao:'Vale da equipe - '+funcionario.nome,
     valor:valor(cent(v.valor)),data:v.data,origem:'vale_equipe',vale_id:v.id,
     status_lancamento:'ativo',observacoes:v.observacoes||null};
   const ins=await sb.from('financeiro').insert(dados);
   if(ins.error)throw new Error('Não foi possível registrar o vale no Financeiro: '+ins.error.message);
 }
}
async function registrar({funcionarioId,data,obraPagamentoId,esperado}={}){
 const id=str(funcionarioId);
 if(emProcessamento.has(id))throw Error('Este funcionário já possui pagamento em andamento.');
 emProcessamento.add(id);let pid=null,sb=null;
 try{
   if(!navigator.onLine)throw Error('Conecte-se à internet para pagar com segurança.');
   if(!data||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(data))throw Error('Informe uma data de pagamento válida.');
   sb=await OBRIX_BACKEND.init();const perfil=await OBRIX_BACKEND.profile(),eid=perfil?.empresa_id;
   if(!eid)throw Error('Empresa não identificada.');
   const func=await sb.from('funcionarios').select('id,nome').eq('empresa_id',eid).eq('id',id).maybeSingle();
   if(func.error)throw func.error;
   if(!func.data)throw Error('Funcionário não encontrado nesta empresa.');
   const registros=await dadosAbertos(sb,eid,id),r=calcular(registros);
   if(r.erros.length)throw Error(r.erros.join(' '));
   if(esperado!=null&&cent(esperado)!==r.liquido)throw Error('Os valores foram atualizados. Feche e abra novamente o pagamento.');
   let destino=str(obraPagamentoId);
   if(r.negativas.length&&r.liquido>0){
     if(!destino&&r.obrasTrabalhadas.length===1)destino=r.obrasTrabalhadas[0].id;
     if(!r.obrasTrabalhadas.some(o=>o.id===destino))
       throw Error('Selecione a obra que receberá o lançamento líquido, sem alterar a obra das diárias, bônus e vales.');
   }
   await Promise.all([
     verificarVinculos(sb,eid,registros.ds,'pagamento_diarias','diaria_id'),
     verificarVinculos(sb,eid,registros.bs,'pagamento_bonus_extras','bonus_extra_id'),
     verificarVinculos(sb,eid,registros.vs,'pagamento_vales','vale_id')
   ]);
   // Vales antigos sem financeiro são recuperados uma única vez, na obra original.
   // Isso é separado da baixa e permanece correto mesmo se a baixa falhar.
   await garantirValesFinanceiros(sb,eid,func.data,registros.vs);
   const p=await sb.from('pagamentos_equipe').insert({empresa_id:eid,funcionario_id:id,
     valor_diarias:valor(r.diarias),valor_bonus_extras:valor(r.bonus),
     valor_vales:valor(r.vales),valor_bruto:valor(r.bruto),
     valor_liquido:valor(r.liquido),data_pagamento:data}).select('id').single();
   if(p.error)throw p.error;pid=p.data.id;
   if(registros.ds.length){
     let q=await sb.from('pagamento_diarias').insert(registros.ds.map(x=>({
       empresa_id:eid,pagamento_id:pid,diaria_id:x.id,obra_id:x.obra_id,valor:x.valor_total})));
     if(q.error)throw q.error;
     q=await sb.from('diarias').update({paga:true,pago_em:new Date().toISOString()})
       .eq('empresa_id',eid).eq('funcionario_id',id).eq('paga',false)
       .in('id',registros.ds.map(x=>x.id)).select('id');
     if(q.error||q.data?.length!==registros.ds.length)throw Error('Falha ao confirmar diárias. '+(q.error?.message||'Registros foram alterados.'));
   }
   if(registros.bs.length){
     let q=await sb.from('pagamento_bonus_extras').insert(registros.bs.map(x=>({
       empresa_id:eid,pagamento_id:pid,bonus_extra_id:x.id,valor:x.valor})));
     if(q.error)throw q.error;
     q=await sb.from('bonus_extras').update({pago:true,pago_em:new Date().toISOString()})
       .eq('empresa_id',eid).eq('funcionario_id',id).eq('pago',false)
       .in('id',registros.bs.map(x=>x.id)).select('id');
     if(q.error||q.data?.length!==registros.bs.length)throw Error('Falha ao confirmar bônus. '+(q.error?.message||'Registros foram alterados.'));
   }
   if(registros.vs.length){
     let q=await sb.from('pagamento_vales').insert(registros.vs.map(x=>({
       empresa_id:eid,pagamento_id:pid,vale_id:x.id,valor:x.valor})));
     if(q.error)throw q.error;
     q=await sb.from('vales').update({quitado:true,quitado_em:new Date().toISOString()})
       .eq('empresa_id',eid).eq('funcionario_id',id).eq('quitado',false)
       .in('id',registros.vs.map(x=>x.id)).select('id');
     if(q.error||q.data?.length!==registros.vs.length)throw Error('Falha ao quitar vales. '+(q.error?.message||'Registros foram alterados.'));
   }
   const linhas=linhasFinanceiro(r,eid,pid,func.data.nome,data,destino);
   if(linhas.length){
     const q=await sb.from('financeiro').insert(linhas);
     if(q.error)throw q.error;
   }
   return{ok:true,id:pid,nome:func.data.nome,bruto:valor(r.bruto),vales:valor(r.vales),
     liquido:valor(r.liquido),despesasNovas:linhas.reduce((a,x)=>a+Number(x.valor||0),0)};
 }catch(e){
   if(pid){
    let estornado=false;
    try{
      const reverter=await sb.rpc('obrix_estornar_pagamento_equipe',{
        p_pagamento_id:pid,p_motivo:'Reversão automática por falha na gravação da baixa'});
      estornado=!reverter.error&&reverter.data?.ok===true;
    }catch(erro){console.error('OBRIX: falha ao reverter pagamento incompleto',erro)}
    if(estornado)throw new Error('Pagamento não concluído. A tentativa foi revertida com segurança e as pendências foram reabertas. Motivo: '+(e?.message||e));
    throw new Error('Pagamento incompleto. Não repita antes de conferir o Financeiro e o Histórico; estorno automático não confirmado. Detalhes: '+(e?.message||e));
   }
   throw e;
 }finally{emProcessamento.delete(id)}
}
window.OBRIX_LIQUIDACAO_SEGURA={calcular,opcoesDeObra,linhasFinanceiro,registrar};
})();