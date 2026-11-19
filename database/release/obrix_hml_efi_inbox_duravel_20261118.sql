-- OBRIX | Homologação Efí Cobranças 18/11/2026.
-- SOMENTE projeto isolado xavwkfgrnowmusbkbiea; não aplicar à produção.
-- Inbox durável: a Efí considera GET /notification/:token como recebimento.
-- O token deve ser persistido ANTES de consultar o provedor, permitindo replay.
CREATE TABLE IF NOT EXISTS private.obrix_hml_efi_cobrancas_inbox (
  token text PRIMARY KEY CHECK (char_length(token) BETWEEN 8 AND 320),
  recebido_em timestamptz NOT NULL DEFAULT now(),
  ultima_tentativa_em timestamptz NULL,
  tentativas integer NOT NULL DEFAULT 0 CHECK (tentativas >= 0),
  processado boolean NOT NULL DEFAULT false,
  processado_em timestamptz NULL,
  erro text NULL
);
ALTER TABLE private.obrix_hml_efi_cobrancas_inbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.obrix_hml_efi_cobrancas_inbox FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS obrix_hml_efi_inbox_pending
  ON private.obrix_hml_efi_cobrancas_inbox (recebido_em)
  WHERE processado IS FALSE;

CREATE OR REPLACE FUNCTION public.obrix_hml_efi_reservar_notificacao(p_token text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE v_token text := trim(coalesce(p_token,'')); v_saved text;
BEGIN
  IF char_length(v_token) NOT BETWEEN 8 AND 320 THEN
    RAISE EXCEPTION 'Token de notificação inválido.' USING ERRCODE='22023';
  END IF;
  INSERT INTO private.obrix_hml_efi_cobrancas_inbox AS i
    (token,ultima_tentativa_em,tentativas)
  VALUES(v_token,now(),1)
  ON CONFLICT (token) DO UPDATE SET
    ultima_tentativa_em=now(),
    tentativas=i.tentativas+1
  WHERE i.processado IS FALSE
  RETURNING token INTO v_saved;
  RETURN v_saved IS NOT NULL;
END
$fn$;

CREATE OR REPLACE FUNCTION public.obrix_hml_efi_finalizar_notificacao(
  p_token text, p_erro text DEFAULT NULL
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE v_changed integer;
BEGIN
  UPDATE private.obrix_hml_efi_cobrancas_inbox
  SET processado=(p_erro IS NULL),
      processado_em=CASE WHEN p_erro IS NULL THEN now() ELSE NULL END,
      erro=CASE WHEN p_erro IS NULL THEN NULL ELSE left(p_erro,240) END
  WHERE token=p_token AND processado IS FALSE;
  GET DIAGNOSTICS v_changed=ROW_COUNT;
  RETURN v_changed=1;
END
$fn$;

CREATE OR REPLACE FUNCTION public.obrix_hml_efi_listar_notificacoes_pendentes(p_limite integer DEFAULT 20)
RETURNS TABLE (token text, tentativas integer)
LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $fn$
  SELECT i.token,i.tentativas
  FROM private.obrix_hml_efi_cobrancas_inbox i
  WHERE i.processado IS FALSE
  ORDER BY i.recebido_em
  LIMIT least(greatest(coalesce(p_limite,20),1),50);
$fn$;

REVOKE ALL ON FUNCTION public.obrix_hml_efi_reservar_notificacao(text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.obrix_hml_efi_finalizar_notificacao(text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.obrix_hml_efi_listar_notificacoes_pendentes(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_efi_reservar_notificacao(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.obrix_hml_efi_finalizar_notificacao(text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.obrix_hml_efi_listar_notificacoes_pendentes(integer) TO service_role;
