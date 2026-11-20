-- OBRIX | Inbox Pix de homologacao. 2026-11-19
-- Nunca aplicar este arquivo ao projeto oficial.
-- Eventos recebidos nao sao comprovantes financeiros: sao apenas pistas para conciliacao.
CREATE OR REPLACE FUNCTION public.obrix_hml_inbox_pix_receber(
  p_txid text,
  p_end_to_end_id text,
  p_valor numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_new uuid;
  v_event text;
  v_previous jsonb;
BEGIN
  -- JWT service_role devidamente validado pelo gateway Supabase.
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Somente o servico autenticado pode registrar eventos Pix de homologacao.';
  END IF;
  IF p_txid IS NULL OR p_txid !~ '^obrixhml[0-9a-f]{27}$' THEN
    RAISE EXCEPTION 'TXID fora do escopo das cobrancas controladas de homologacao.';
  END IF;
  IF p_end_to_end_id IS NULL OR p_end_to_end_id !~ '^[a-zA-Z0-9]{16,40}$' THEN
    RAISE EXCEPTION 'EndToEndId ausente ou com formato inesperado.';
  END IF;
  IF p_valor IS NULL OR p_valor <> 1.00 THEN
    RAISE EXCEPTION 'Valor fora do ensaio simulado de R$ 1,00.';
  END IF;

  v_event := 'pix:' || p_end_to_end_id;
  INSERT INTO private.pagamento_eventos (
    provedor, evento_id, tipo, payload
  ) VALUES (
    'efi_pix_hml', v_event, 'pix_recebido_nao_conciliado',
    jsonb_build_object(
      'txid', p_txid,
      'e2e', p_end_to_end_id,
      'valor', p_valor,
      'simulado', true,
      'verificacao_provedor', 'pendente',
      'ativar_assinatura', false
    )
  )
  ON CONFLICT (provedor,evento_id) DO NOTHING
  RETURNING id INTO v_new;

  IF v_new IS NULL THEN
    SELECT payload INTO v_previous
      FROM private.pagamento_eventos
      WHERE provedor='efi_pix_hml' AND evento_id=v_event;
    IF v_previous IS NULL
       OR v_previous->>'txid' IS DISTINCT FROM p_txid
       OR (v_previous->>'valor')::numeric IS DISTINCT FROM p_valor
    THEN
      RAISE EXCEPTION 'Evento duplicado com dados divergentes.';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok',true,
    'inserido',v_new IS NOT NULL,
    'estado','recebido_sem_confirmacao_financeira',
    'assinatura_ativada',false
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.obrix_hml_inbox_pix_receber(text,text,numeric)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_inbox_pix_receber(text,text,numeric)
  TO service_role;
COMMENT ON FUNCTION public.obrix_hml_inbox_pix_receber(text,text,numeric)
  IS 'OBRIX HML: registra somente evento Pix simulado deduplicado. Nao concilia e nao ativa assinatura.';
