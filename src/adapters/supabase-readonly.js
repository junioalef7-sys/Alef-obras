(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.EDIFIQReadonlySupabase=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const TABLES=Object.freeze({
    obras:'obras', funcionarios:'funcionarios', diarias:'diarias', vales:'adiantamentos',
    gastos:'gastos', pagamentos:'pagamentos', extras:'servicos_adicionais'
  });

  const FIELDS=Object.freeze({
    obras:'id,nome,cliente,endereco,valor,status,tipo_servico,data_inicio,data_fim,observacoes,telefone,progresso,updated_at',
    funcionarios:'id,nome,funcao,telefone,tipo_pagamento,valor_diaria,salario_mensal,dia_pagamento,ativo,obra_id,registrar_diaria,updated_at',
    diarias:'id,data,funcionario_id,obra_id,qtd,valor_diaria,status,observacao,horas,tipo_jornada,valor_pago,qtd_paga,pago_em,valor_baixado,checklist_id,operation_id,updated_at',
    vales:'id,funcionario_id,obra_id,valor,data,observacao,checklist_id,operation_id,updated_at',
    gastos:'id,obra_id,descricao,quantidade,valor,fornecedor,data,unidade,categoria,subcategoria,observacao,checklist_id,funcionario_id,servico_extra_id,status,data_pagamento,valor_baixado,aplicado,operation_id,updated_at',
    pagamentos:'id,obra_id,valor,data,forma_pagamento,descricao,funcionario_id,tipo,observacao,desconto,fornecedor,checklist_id,operation_id,updated_at',
    extras:'id,obra_id,descricao,valor,data,observacao,operation_id,updated_at'
  });

  function assertClient(client){if(!client?.auth?.getSession||!client?.from)throw new Error('Cliente Supabase inválido.');return client}
  async function sessionUser(client){const{data,error}=await client.auth.getSession();if(error)throw error;const user=data?.session?.user;if(!user?.id)throw new Error('Sessão não autenticada.');return user}
  async function runSelect(client,table,fields,userId,orderCol){
    let q=client.from(table).select(fields).eq('user_id',userId);
    if(orderCol)q=q.order(orderCol,{ascending:false});
    const{data,error}=await q;if(error)throw error;return Array.isArray(data)?data:[];
  }
  function createReadonlyAdapter(client){
    client=assertClient(client);
    const load=async(key,orderCol)=>{const user=await sessionUser(client);return runSelect(client,TABLES[key],FIELDS[key],user.id,orderCol)};
    async function loadSnapshot(){
      const user=await sessionUser(client);
      const entries=await Promise.all([
        runSelect(client,TABLES.obras,FIELDS.obras,user.id,'updated_at'),
        runSelect(client,TABLES.funcionarios,FIELDS.funcionarios,user.id,'updated_at'),
        runSelect(client,TABLES.diarias,FIELDS.diarias,user.id,'data'),
        runSelect(client,TABLES.vales,FIELDS.vales,user.id,'data'),
        runSelect(client,TABLES.gastos,FIELDS.gastos,user.id,'data'),
        runSelect(client,TABLES.pagamentos,FIELDS.pagamentos,user.id,'data'),
        runSelect(client,TABLES.extras,FIELDS.extras,user.id,'data')
      ]);
      return Object.freeze({user_id:user.id,loaded_at:new Date().toISOString(),obras:entries[0],funcionarios:entries[1],diarias:entries[2],adiantamentos:entries[3],gastos:entries[4],pagamentos:entries[5],servicos_adicionais:entries[6]});
    }
    return Object.freeze({
      mode:'readonly',loadSnapshot,
      loadObras:()=>load('obras','updated_at'),
      loadFuncionarios:()=>load('funcionarios','updated_at'),
      loadDiarias:()=>load('diarias','data'),
      loadVales:()=>load('vales','data'),
      loadGastos:()=>load('gastos','data'),
      loadPagamentos:()=>load('pagamentos','data'),
      loadExtras:()=>load('extras','data')
    });
  }
  return Object.freeze({TABLES,FIELDS,createReadonlyAdapter});
});