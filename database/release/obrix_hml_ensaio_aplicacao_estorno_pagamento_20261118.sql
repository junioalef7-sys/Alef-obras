-- Ensaio isolado de cobrança; não contém chamadas à Efí ou usuários reais.
-- Rotinas copiadas para schema privado com EXECUTE revogado dos usuários.
-- SQL-fonte comparado com função de produção em 18/11/2026, sem publicar no oficial.
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


CREATE OR REPLACE FUNCTION private.obrix_reverter_pagamento_assinatura_hml_ensaio(p_pagamento_id uuid, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_pag public.pagamentos_assinatura%rowtype;
  v_ass public.assinaturas%rowtype;
  v_novo_fim timestamptz;
  v_outros_validos integer := 0;
  v_agora timestamptz := now();
begin
  select * into v_pag
  from public.pagamentos_assinatura
  where id = p_pagamento_id
  for update;

  if not found then
    raise exception 'Pagamento não encontrado.';
  end if;

  if v_pag.aplicado_em is null then
    return jsonb_build_object('ok', true, 'sem_periodo_aplicado', true, 'pagamento_id', v_pag.id);
  end if;

  if v_pag.revertido_em is not null then
    return jsonb_build_object('ok', true, 'ja_revertido', true, 'pagamento_id', v_pag.id, 'revertido_em', v_pag.revertido_em);
  end if;

  select * into v_ass
  from public.assinaturas
  where id = v_pag.assinatura_id
    and empresa_id = v_pag.empresa_id
  for update;

  if not found then
    raise exception 'Assinatura não encontrada para este pagamento.';
  end if;

  select count(*)::int into v_outros_validos
  from public.pagamentos_assinatura p
  where p.assinatura_id = v_pag.assinatura_id
    and p.id <> v_pag.id
    and p.aplicado_em is not null
    and p.revertido_em is null
    and p.status = 'aprovado';

  if v_ass.periodo_fim is not null then
    if v_pag.plano = 'anual' then
      v_novo_fim := v_ass.periodo_fim - interval '1 year';
    else
      v_novo_fim := v_ass.periodo_fim - interval '1 month';
    end if;
  end if;

  update public.pagamentos_assinatura
  set revertido_em = v_agora,
      detalhes = coalesce(detalhes, '{}'::jsonb) || jsonb_build_object(
        'reversao_assinatura', jsonb_build_object(
          'em', v_agora,
          'motivo', nullif(trim(coalesce(p_motivo, '')), '')
        )
      )
  where id = v_pag.id;

  -- Estorno de cobrança passada não cancela o direito permanente.
  if v_ass.plano = 'permanente' and v_ass.status = 'ativo' then
    return jsonb_build_object('ok', true, 'acesso_permanente', true,
                              'pagamento_id', v_pag.id, 'novo_periodo_fim', null);
  end if;

  if v_outros_validos > 0 then
    update public.assinaturas
    set periodo_fim = case
          when v_novo_fim is null then periodo_fim
          when periodo_inicio is not null and v_novo_fim < periodo_inicio then periodo_inicio
          else v_novo_fim
        end,
        status = 'ativo',
        atualizado_em = v_agora
    where id = v_ass.id;
  elsif v_ass.trial_fim is not null and v_agora < v_ass.trial_fim then
    update public.assinaturas
    set plano = 'teste',
        status = 'teste',
        periodo_inicio = null,
        periodo_fim = null,
        provedor_pagamento = null,
        atualizado_em = v_agora
    where id = v_ass.id;
  else
    update public.assinaturas
    set status = 'cancelado',
        periodo_inicio = null,
        periodo_fim = null,
        provedor_pagamento = null,
        atualizado_em = v_agora
    where id = v_ass.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'ja_revertido', false,
    'pagamento_id', v_pag.id,
    'outros_pagamentos_validos', v_outros_validos,
    'trial_ainda_valido', (v_ass.trial_fim is not null and v_agora < v_ass.trial_fim),
    'novo_periodo_fim', v_novo_fim
  );
end;
$function$;


REVOKE ALL ON FUNCTION private.obrix_aplicar_pagamento_assinatura_hml_ensaio(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.obrix_reverter_pagamento_assinatura_hml_ensaio(uuid, text) FROM PUBLIC, anon, authenticated;
