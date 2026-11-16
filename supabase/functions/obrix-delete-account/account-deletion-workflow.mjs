/**
 * OBRIX — fluxo de exclusão de conta, testável sem dados reais.
 * APENAS BRANCH DE TESTES. Requer duas RPCs com EXECUTE exclusivo de service_role.
 * Não altera transações financeiras para 'estornadas' como atalho para excluir.
 */
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function excluirContaVerificada({admin,userId,perfil,limparStorage}){
  if(!UUID.test(String(userId||'')))throw Error('Usuário inválido para exclusão.');
  if(!admin?.auth?.admin?.deleteUser||!admin?.rpc||!admin?.from)
    throw Error('Serviço de exclusão indisponível.');
  if(typeof limparStorage!=='function')throw Error('Limpeza do armazenamento indisponível.');
  let arquivosRemovidos=0,bytesEstimados=0,escopo='usuario';
  const empresaId=perfil?.empresa_id||null;
  if(empresaId){
    if(!UUID.test(String(empresaId)))throw Error('Empresa inválida para exclusão.');
    if(String(perfil.id)!==String(userId))throw Error('Perfil e sessão não correspondem.');
    const {count,error:countError}=await admin.from('perfis')
      .select('id',{count:'exact',head:true}).eq('empresa_id',empresaId);
    if(countError||!Number.isInteger(count)||count<1)
      throw Error('Não foi possível conferir os usuários da empresa.');
    if(count===1){
      if(!['proprietario','admin'].includes(perfil.papel))
        throw Error('Somente o titular ou administrador pode excluir a última conta da empresa.');
      // Preflight read/authorization BEFORE deleting any files.
      const pedido={p_empresa_id:empresaId,p_usuario_id:userId};
      const pre=await admin.rpc('obrix_excluir_empresa_dados_v1',{...pedido,p_simular:true});
      if(pre.error||pre.data?.ok!==true||pre.data?.simulacao!==true)
        throw Error('A exclusão transacional do banco não está preparada. Nenhum arquivo foi removido.');
      // Storage API is not a database transaction: errors after this point are partial.
      const limpeza=await limparStorage(admin.storage,empresaId);
      arquivosRemovidos=Number(limpeza.arquivosRemovidos)||0;
      bytesEstimados=Number(limpeza.bytesEstimados)||0;
      const banco=await admin.rpc('obrix_excluir_empresa_dados_v1',{...pedido,p_simular:false});
      if(banco.error||banco.data?.ok!==true||banco.data?.simulacao===true)
        throw Error('Arquivos foram processados, mas a remoção do banco não foi confirmada. Não recrie dados; entre em contato com o suporte.');
      escopo='empresa';
    }else{
      // Multiple members: shared business data and files must remain.
      const {error}=await admin.from('perfis').delete().eq('id',userId).eq('empresa_id',empresaId);
      if(error)throw Error('Não foi possível remover seu perfil. Os dados compartilhados permanecem.');
    }
  }
  const {error:userError}=await admin.auth.admin.deleteUser(userId);
  if(userError)throw Error('Os dados da conta foram processados, mas a exclusão do login não foi confirmada. Solicite suporte.');
  return {ok:true,arquivosRemovidos,bytesEstimados,escopo};
}
