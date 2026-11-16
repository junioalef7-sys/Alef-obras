/**
 * OBRIX — Exclusão retomável, EXCLUSIVAMENTE na branch de homologação.
 * Exige três RPCs com privilégio de EXECUTE somente para service_role:
 * obrix_reservar_exclusao_v1, obrix_avancar_exclusao_v1,
 * obrix_consultar_exclusao_v1. Sem as RPCs, falha antes de apagar arquivos.
 * O job privado sobrevive ao DELETE em cascata da empresa.
 * Nenhuma credencial administrativa pode ir para o navegador.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FASES=new Set(['preparado','storage_concluido','banco_concluido','finalizado']);

async function rpcSegura(admin,nome,args){
  const {data,error}=await admin.rpc(nome,args);
  if(error)throw Error('Falha de segurança na etapa '+nome+'. Verifique o estado da solicitação.');
  if(!data||data.ok!==true||!FASES.has(data.etapa)){
    throw Error('O servidor não confirmou a etapa '+nome+'. A operação foi interrompida.');
  }
  return data;
}

async function confirmarLoginRemovido(admin,userId){
  if(typeof admin.auth.admin.getUserById!=='function'){
    throw Error('Não é possível verificar a remoção do login.');
  }
  const {data,error}=await admin.auth.admin.getUserById(userId);
  if(!error&&data?.user){
    throw Error('A exclusão foi marcada como concluída, mas o login ainda existe.');
  }
  // Só o 404 da API Auth é prova suficiente para considerar removido.
  const codigo=Number(error?.status??error?.code);
  if(codigo!==404 && String(error?.code||'')!=='user_not_found'){
    throw Error('Não foi possível verificar que o login foi removido.');
  }
}

async function completarExclusaoEmpresa({admin,userId,empresaId,etapa,limparStorage}){
  const pedido={p_empresa_id:empresaId,p_usuario_id:userId};
  let arquivosRemovidos=0,bytesEstimados=0;
  if(!FASES.has(etapa))throw Error('A exclusão está em um estado inválido.');
  if(etapa==='finalizado'){
    await confirmarLoginRemovido(admin,userId);
    return {ok:true,arquivosRemovidos:0,bytesEstimados:0,escopo:'empresa',jaConcluida:true};
  }
  if(etapa==='preparado'||etapa==='storage_concluido'){
    // Repetir o inventário e a limpeza é seguro para a mesma empresa.
    // Se uma operação anterior removeu parcialmente arquivos, os restantes são listados.
    const limpeza=await limparStorage(admin.storage,empresaId);
    arquivosRemovidos=Number(limpeza.arquivosRemovidos||0);
    bytesEstimados=Number(limpeza.bytesEstimados||0);
    if(!Number.isSafeInteger(arquivosRemovidos)||arquivosRemovidos<0)
      throw Error('Não foi possível conferir os arquivos removidos.');
    if(etapa==='preparado'){
      const gravada=await rpcSegura(admin,'obrix_avancar_exclusao_v1',
        {...pedido,p_etapa:'storage_concluido'});
      if(gravada.etapa!=='storage_concluido')
        throw Error('Confirmação do Storage inconsistente. Contate o suporte.');
    }
    etapa='storage_concluido';
  }
  if(etapa==='storage_concluido'){
    // O servidor exige que o job tenha passado pelo Storage. O DELETE e o
    // checkpoint banco_concluido ocorrem dentro da mesma transação SQL.
    let confirmada;
    try {
      confirmada=await rpcSegura(admin,'obrix_avancar_exclusao_v1',
        {...pedido,p_etapa:'banco_concluido'});
    }catch(_){
      throw Error('A exclusão dos arquivos foi processada, mas o banco não confirmou a operação. O estado foi preservado para retomada pelo suporte.');
    }
    if(confirmada.etapa!=='banco_concluido')throw Error('O banco não confirmou a exclusão.');
    etapa='banco_concluido';
  }
  if(etapa==='banco_concluido'){
    const {error}=await admin.auth.admin.deleteUser(userId);
    if(error){
      // Se o login já foi apagado em uma tentativa anterior, um 404 verificável
      // permite retomar só o checkpoint. Qualquer outra falha permanece bloqueada.
      try {
        await confirmarLoginRemovido(admin,userId);
      }catch(_){
        throw Error('O banco foi processado, mas o login não foi removido. A solicitação pode ser retomada sem excluir novamente a empresa.');
      }
    }
    // A confirmação só ocorre depois da resposta Auth ou da verificação 404.
    const concluida=await rpcSegura(admin,'obrix_avancar_exclusao_v1',
      {...pedido,p_etapa:'finalizado'});
    if(concluida.etapa!=='finalizado')
      throw Error('O login foi removido, mas a finalização da solicitação requer revisão.');
  }
  return {ok:true,arquivosRemovidos,bytesEstimados,escopo:'empresa'};
}

export async function excluirContaVerificada({admin,userId,perfil,limparStorage}){
  if(!UUID.test(String(userId||'')))throw Error('Usuário inválido para exclusão.');
  if(!admin?.auth?.admin?.deleteUser||!admin?.rpc||!admin?.from)
    throw Error('Serviço de exclusão indisponível.');
  if(typeof limparStorage!=='function')throw Error('Limpeza do armazenamento indisponível.');
  const empresaId=perfil?.empresa_id||null;
  if(empresaId){
    if(!UUID.test(String(empresaId)))throw Error('Empresa inválida para exclusão.');
    if(String(perfil.id)!==String(userId))throw Error('Perfil e sessão não correspondem.');
    const {count,error}=await admin.from('perfis')
      .select('id',{count:'exact',head:true}).eq('empresa_id',empresaId);
    if(error||!Number.isInteger(count)||count<1)
      throw Error('Não foi possível conferir os usuários da empresa.');
    if(count===1){
      if(!['proprietario','admin'].includes(perfil.papel))
        throw Error('Somente o titular ou administrador pode excluir a última conta da empresa.');
      const entrada=await rpcSegura(admin,'obrix_reservar_exclusao_v1',
        {p_empresa_id:empresaId,p_usuario_id:userId});
      return completarExclusaoEmpresa({
        admin,userId,empresaId,etapa:entrada.etapa,limparStorage
      });
    }
    // Conta vinculada a outros membros: preserva todos os dados compartilhados.
    const {error:perfilError}=await admin.from('perfis').delete().eq('id',userId).eq('empresa_id',empresaId);
    if(perfilError)throw Error('Não foi possível remover seu perfil. Os dados compartilhados permanecem.');
  }else{
    // A conta pode estar retomando após o banco ter sido removido. É incorreto
    // assumir que a ausência de perfil significa que não havia uma empresa.
    const {data,error}=await admin.rpc('obrix_consultar_exclusao_v1',
      {p_usuario_id:userId});
    if(error||!data||typeof data.encontrado!=='boolean')
      throw Error('Não foi possível verificar uma exclusão anterior. Nenhum login foi removido.');
    if(data.encontrado){
      if(data.ok!==true||!UUID.test(String(data.empresa_id)))
        throw Error('Solicitação anterior inválida.');
      if(!['banco_concluido','finalizado'].includes(data.etapa))
        throw Error('A exclusão da empresa não terminou. Solicite a retomada pelo suporte.');
      return completarExclusaoEmpresa({
        admin,userId,empresaId:data.empresa_id,etapa:data.etapa,limparStorage
      });
    }
  }
  const {error:userError}=await admin.auth.admin.deleteUser(userId);
  if(userError)throw Error('O perfil foi processado, mas não foi possível excluir o login. Solicite suporte.');
  return {ok:true,arquivosRemovidos:0,bytesEstimados:0,escopo:'usuario'};
}
