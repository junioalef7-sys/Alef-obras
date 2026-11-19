-- OBRIX HML - Gate financeiro na aplicacao de assinatura (19/11/2026).
-- Exclusivo ao Supabase restauracao isolada, SEM ALTERACAO NO OFICIAL.
CREATE OR REPLACE FUNCTION private.obrix_aplicar_pagamento_assinatura_hml_ensaio(p_pagamento_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_pag public.pagamentos_assinatura%rowtype;
  v_ass public.assinaturas%rowtype;
  v_base timestamptz;
  v_inicio timestamptz;
  v_fim timestamptz;
  v_preco numeric;
begin
  select * into v_pag
  from public.pagamentos_assinatura
  where id = p_pagamento_id
  for update;

  if not found then
    raise exception 'Pagamento não encontrado.';
  end if;

  if v_pag.aplicado_em is not null and v_pag.revertido_em is null then
    return jsonb_build_object(
      'ok', true,
      'ja_aplicado', true,
      'pagamento_id', v_pag.id,
      'periodo_concedido_inicio', v_pag.periodo_concedido_inicio,
      'periodo_concedido_fim', v_pag.periodo_concedido_fim
    );
  end if;

  if v_pag.status <> 'aprovado' then
    raise exception 'Pagamento ainda não foi confirmado pelo provedor.';
  end if;

  -- Nao transformar cobranca simulada nem valor parcial em assinatura paga.
  if v_pag.moeda <> 'BRL' then
    raise exception 'Moeda do pagamento nao corresponde ao catalogo de planos.';
  end if;

  if lower(coalesce(v_pag.detalhes->>'simulado','false')) in ('true','1','sim','yes') then
    raise exception 'Pagamentos simulados nao concedem acesso ao plano.';
  end if;

  select pl.valor into v_preco
    from public.planos_assinatura pl
   where pl.codigo = v_pag.plano and pl.ativo = true
   for share;

  if v_preco is null or v_pag.valor <> v_preco then
    raise exception 'Valor de pagamento nao corresponde ao preco integral do plano.';
  end if;


  select * into v_ass
  from public.assinaturas
  where id = v_pag.assinatura_id
    and empresa_id = v_pag.empresa_id
  for update;

  if not found then
    raise exception 'Assinatura não encontrada para este pagamento.';
  end if;

  -- Evita downgrade da assinatura permanente na confirmação de pagamentos antigos.
  if v_ass.plano = 'permanente' and v_ass.status = 'ativo' then
    update public.pagamentos_assinatura
       set aplicado_em = now(),
           aprovado_em = coalesce(aprovado_em, now()),
           periodo_concedido_inicio = null,
           periodo_concedido_fim = null,
           revertido_em = null
     where id = v_pag.id;
    return jsonb_build_object('ok', true, 'acesso_permanente', true,
                              'pagamento_id', v_pag.id, 'empresa_id', v_pag.empresa_id);
  end if;

  if v_ass.status = 'ativo'
     and v_ass.periodo_fim is not null
     and v_ass.periodo_fim > now() then
    v_base := v_ass.periodo_fim;
    v_inicio := coalesce(v_ass.periodo_inicio, now());
  elsif v_ass.status = 'teste' and v_ass.trial_fim > now() then
    v_base := v_ass.trial_fim;
    v_inicio := v_ass.trial_fim;
  else
    v_base := now();
    v_inicio := now();
  end if;

  if v_pag.plano = 'anual' then
    v_fim := v_base + interval '1 year';
  else
    v_fim := v_base + interval '1 month';
  end if;

  update public.assinaturas
  set plano = v_pag.plano,
      status = 'ativo',
      periodo_inicio = v_inicio,
      periodo_fim = v_fim,
      provedor_pagamento = v_pag.provedor,
      atualizado_em = now()
  where id = v_ass.id;

  update public.pagamentos_assinatura
  set aplicado_em = now(),
      aprovado_em = coalesce(aprovado_em, now()),
      periodo_concedido_inicio = v_base,
      periodo_concedido_fim = v_fim,
      revertido_em = null
  where id = v_pag.id;

  return jsonb_build_object(
    'ok', true,
    'ja_aplicado', false,
    'pagamento_id', v_pag.id,
    'empresa_id', v_pag.empresa_id,
    'plano', v_pag.plano,
    'periodo_inicio', v_inicio,
    'periodo_fim', v_fim,
    'periodo_concedido_inicio', v_base,
    'periodo_concedido_fim', v_fim
  );
end;
$function$;

REVOKE ALL ON FUNCTION private.obrix_aplicar_pagamento_assinatura_hml_ensaio(uuid)
  FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION private.obrix_aplicar_pagamento_assinatura_hml_ensaio(uuid)
  IS 'HML: aplica apenas pagamento aprovado, nao-simulado, BRL e no valor integral do plano; nunca cobrar no teste';
