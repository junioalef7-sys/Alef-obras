-- HML: permitir estorno de saida de estoque somente na obra escolhida,
-- preservando controle da empresa, login, papel e bloqueio de repeticoes.
-- Exclusivo a xavwkfgrnowmusbkbiea; NUNCA executar no OBRIX oficial.
CREATE OR REPLACE FUNCTION public.obrix_estornar_saida_estoque(p_movimento_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_empresa_id uuid := public.obrix_empresa_atual();
  v_mov public.estoque_movimentacoes%rowtype;
  v_estorno_id uuid;
begin
  if v_empresa_id is null or (select auth.uid()) is null then
    raise exception 'Empresa e usuário autenticado obrigatórios.';
  end if;
  if not exists (
    select 1 from public.perfis p
    where p.id=(select auth.uid()) and p.empresa_id=v_empresa_id
      and p.papel in ('proprietario','administrador')
  ) then
    raise exception 'Operação restrita ao responsável pela empresa.';
  end if;

  select * into v_mov
  from public.estoque_movimentacoes
  where id=p_movimento_id and empresa_id=v_empresa_id
  for update;

  if not found then raise exception 'Movimentação não encontrada.'; end if;
  if not public.obrix_acesso_total(v_empresa_id)
     and not public.obrix_hml_pode_operar_registro(
         v_empresa_id,v_mov.obra_id,NULL::uuid,false,false
     )
  then
    raise exception 'Plano limitado: estorno permitido somente na obra escolhida.';
  end if;
  if v_mov.tipo <> 'saida' then raise exception 'Somente saídas podem ser estornadas por esta ação.'; end if;
  if v_mov.estorno_de_id is not null then raise exception 'Esta movimentação já é um estorno.'; end if;
  if exists(select 1 from public.estoque_movimentacoes where empresa_id=v_empresa_id and estorno_de_id=v_mov.id) then
    raise exception 'Esta saída já foi estornada.';
  end if;

  insert into public.estoque_saldos(empresa_id,estoque_id,material_id,quantidade,atualizado_em)
  values(v_empresa_id,v_mov.estoque_origem_id,v_mov.material_id,v_mov.quantidade,now())
  on conflict (estoque_id,material_id)
  do update set quantidade=public.estoque_saldos.quantidade+excluded.quantidade,atualizado_em=now();

  insert into public.estoque_movimentacoes(empresa_id,material_id,estoque_destino_id,obra_id,tipo,quantidade,custo_unitario,valor_total,data,documento,observacoes,estorno_de_id)
  values(v_empresa_id,v_mov.material_id,v_mov.estoque_origem_id,v_mov.obra_id,'devolucao',v_mov.quantidade,v_mov.custo_unitario,v_mov.valor_total,current_date,v_mov.documento,'Estorno da saída de estoque '||v_mov.id::text,v_mov.id)
  returning id into v_estorno_id;

  update public.financeiro
  set status_lancamento='estornado',atualizado_em=now()
  where empresa_id=v_empresa_id
    and status_lancamento='ativo'
    and (estoque_movimentacao_id=v_mov.id or observacoes like 'Movimentação automática do estoque: '||v_mov.id::text||'%');

  return v_estorno_id;
end;
$function$
;
REVOKE ALL ON FUNCTION public.obrix_estornar_saida_estoque(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.obrix_estornar_saida_estoque(uuid) TO authenticated;
