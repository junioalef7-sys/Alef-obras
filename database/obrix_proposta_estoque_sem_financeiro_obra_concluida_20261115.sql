-- PROPOSTA DE ALTERAÇÃO, NÃO APLICADA NO SUPABASE OFICIAL.

-- Aplicar somente após aprovação explícita, com teste transacional das duas funções.

-- Preserva todas as regras de permissão, saldos e estornos das funções existentes.

-- Para obras concluídas: grava movimentação de estoque, sem criar receita ou despesa.

BEGIN;

CREATE OR REPLACE FUNCTION public.obrix_registrar_saida_estoque(p_material_id uuid, p_estoque_id uuid, p_quantidade numeric, p_data date DEFAULT CURRENT_DATE, p_documento text DEFAULT NULL::text, p_observacoes text DEFAULT NULL::text, p_obra_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_empresa_id uuid := public.obrix_empresa_atual();
  v_obra_id uuid;
  v_movimento_id uuid;
  v_saldo numeric;
  v_custo numeric;
  v_material_nome text;
  v_valor numeric;
begin
  if v_empresa_id is null then raise exception 'Empresa atual não encontrada.'; end if;
  if not public.obrix_acesso_total(v_empresa_id) then raise exception 'Acesso não autorizado para esta empresa.'; end if;
  if p_quantidade is null or p_quantidade <= 0 then raise exception 'Quantidade deve ser maior que zero.'; end if;

  select coalesce(custo_medio,0), nome into v_custo, v_material_nome
  from public.materiais where id=p_material_id and empresa_id=v_empresa_id and ativo=true;
  if not found then raise exception 'Material ativo não encontrado.'; end if;

  perform 1 from public.estoques where id=p_estoque_id and empresa_id=v_empresa_id and ativo=true;
  if not found then raise exception 'Local de estoque ativo não encontrado.'; end if;

  if p_obra_id is not null then
    perform 1 from public.obras where id=p_obra_id and empresa_id=v_empresa_id;
    if not found then raise exception 'Obra de destino não encontrada.'; end if;
    v_obra_id := p_obra_id;
  else
    select obra_id into v_obra_id from public.estoques where id=p_estoque_id and empresa_id=v_empresa_id;
  end if;
  if v_obra_id is null then raise exception 'Informe a obra de destino.'; end if;

  select quantidade into v_saldo from public.estoque_saldos
  where empresa_id=v_empresa_id and estoque_id=p_estoque_id and material_id=p_material_id for update;
  if v_saldo is null then raise exception 'Saldo não encontrado para este material neste estoque.'; end if;
  if v_saldo < p_quantidade then raise exception 'Saldo insuficiente. Disponível: %.',v_saldo; end if;

  v_valor := p_quantidade * v_custo;
  update public.estoque_saldos set quantidade=quantidade-p_quantidade,atualizado_em=now()
  where empresa_id=v_empresa_id and estoque_id=p_estoque_id and material_id=p_material_id;

  insert into public.estoque_movimentacoes(empresa_id,material_id,estoque_origem_id,obra_id,tipo,quantidade,custo_unitario,valor_total,data,documento,observacoes)
  values(v_empresa_id,p_material_id,p_estoque_id,v_obra_id,'saida',p_quantidade,v_custo,v_valor,coalesce(p_data,current_date),nullif(trim(p_documento),''),nullif(trim(p_observacoes),''))
  returning id into v_movimento_id;

  -- A movimentação permanece registrada no estoque, mas obra concluída não gera despesa.
  if not exists (select 1 from public.obras o where o.id=v_obra_id and o.empresa_id=v_empresa_id and lower(coalesce(o.status,'')) in ('concluida','concluída','finalizada','finalizado')) then
  insert into public.financeiro(empresa_id,obra_id,tipo,categoria,descricao,valor,data,origem,observacoes,status_lancamento,estoque_movimentacao_id)
  values(v_empresa_id,v_obra_id,'despesa','material','Saída de estoque - '||coalesce(v_material_nome,'Material'),v_valor,coalesce(p_data,current_date),'estoque','Movimentação automática do estoque: '||v_movimento_id::text||case when nullif(trim(p_observacoes),'') is not null then ' | '||trim(p_observacoes) else '' end,'ativo',v_movimento_id);
  end if;

  return v_movimento_id;
end; 
$function$;

CREATE OR REPLACE FUNCTION public.obrix_registrar_saida_estoque_offline(p_movimento_id uuid, p_material_id uuid, p_estoque_id uuid, p_quantidade numeric, p_obra_id uuid, p_data date DEFAULT NULL::date, p_documento text DEFAULT NULL::text, p_observacoes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_empresa_id uuid := public.obrix_empresa_atual();
  v_saldo numeric;
  v_custo numeric;
  v_material_nome text;
  v_valor numeric;
begin
  if v_empresa_id is null then raise exception 'Empresa atual não encontrada.'; end if;
  if not public.obrix_acesso_total(v_empresa_id) then raise exception 'Acesso não autorizado para esta empresa.'; end if;
  if p_movimento_id is null then raise exception 'Identificador da movimentação é obrigatório.'; end if;
  if p_quantidade is null or p_quantidade <= 0 then raise exception 'Quantidade deve ser maior que zero.'; end if;

  if exists (
    select 1 from public.estoque_movimentacoes
    where id = p_movimento_id and empresa_id = v_empresa_id
  ) then
    return p_movimento_id;
  end if;

  select coalesce(custo_medio,0), nome into v_custo, v_material_nome
  from public.materiais
  where id = p_material_id and empresa_id = v_empresa_id and ativo = true;
  if not found then raise exception 'Material ativo não encontrado.'; end if;

  perform 1 from public.estoques
  where id = p_estoque_id and empresa_id = v_empresa_id and ativo = true;
  if not found then raise exception 'Local de estoque ativo não encontrado.'; end if;

  perform 1 from public.obras
  where id = p_obra_id and empresa_id = v_empresa_id;
  if not found then raise exception 'Obra de destino não encontrada.'; end if;

  select quantidade into v_saldo
  from public.estoque_saldos
  where empresa_id = v_empresa_id
    and estoque_id = p_estoque_id
    and material_id = p_material_id
  for update;

  if v_saldo is null then raise exception 'Saldo não encontrado para este material neste estoque.'; end if;
  if v_saldo < p_quantidade then raise exception 'Saldo insuficiente. Disponível: %.', v_saldo; end if;

  v_valor := p_quantidade * v_custo;

  update public.estoque_saldos
  set quantidade = quantidade - p_quantidade,
      atualizado_em = now()
  where empresa_id = v_empresa_id
    and estoque_id = p_estoque_id
    and material_id = p_material_id;

  insert into public.estoque_movimentacoes(
    id, empresa_id, material_id, estoque_origem_id, obra_id, tipo,
    quantidade, custo_unitario, valor_total, data, documento, observacoes
  ) values (
    p_movimento_id, v_empresa_id, p_material_id, p_estoque_id, p_obra_id, 'saida',
    p_quantidade, v_custo, v_valor, coalesce(p_data,current_date),
    nullif(trim(p_documento),''), nullif(trim(p_observacoes),'')
  );

  -- Movimentação offline preservada sem lançamento no financeiro em obra concluída.
  if not exists (select 1 from public.obras o where o.id=p_obra_id and o.empresa_id=v_empresa_id and lower(coalesce(o.status,'')) in ('concluida','concluída','finalizada','finalizado'))
    and not exists (
    select 1 from public.financeiro
    where empresa_id = v_empresa_id
      and origem = 'estoque'
      and estoque_movimentacao_id = p_movimento_id
  ) then
    insert into public.financeiro(
      empresa_id, obra_id, tipo, categoria, descricao, valor, data,
      origem, observacoes, status_lancamento, estoque_movimentacao_id
    ) values (
      v_empresa_id, p_obra_id, 'despesa', 'material',
      'Saída de estoque - '||coalesce(v_material_nome,'Material'),
      v_valor, coalesce(p_data,current_date), 'estoque',
      'Movimentação automática do estoque: '||p_movimento_id::text||
        case when nullif(trim(p_observacoes),'') is not null then ' | '||trim(p_observacoes) else '' end,
      'ativo', p_movimento_id
    );
  end if;

  return p_movimento_id;
end; 
$function$;

COMMIT;