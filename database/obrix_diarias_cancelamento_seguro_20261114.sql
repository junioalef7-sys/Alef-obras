-- OBRIX 2026-11-14 | Correção segura de exclusão de diárias com pagamentos estornados.
-- PENDENTE DE APROVAÇÃO: não executar no Supabase oficial sem validação.
-- Preserva os vínculos de pagamento e a integridade do histórico financeiro.
BEGIN;
ALTER TABLE public.diarias
  ADD COLUMN IF NOT EXISTS cancelada_em timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text;
COMMENT ON COLUMN public.diarias.cancelada_em IS
  'Cancelamento lógico de diária reaberta após estorno: excluída da folha, mas preservada para histórico.';

CREATE OR REPLACE FUNCTION public.obrix_excluir_diaria_segura(p_diaria_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $obrix$
DECLARE
  v_empresa_id uuid;
  v_diaria public.diarias%ROWTYPE;
  v_links integer := 0;
  v_ativos integer := 0;
  v_rows integer := 0;
BEGIN
  v_empresa_id := public.obrix_empresa_atual();
  IF auth.uid() IS NULL OR v_empresa_id IS NULL OR NOT public.obrix_acesso_total(v_empresa_id) THEN
    RAISE EXCEPTION 'Sessão sem permissão para alterar diárias';
  END IF;

  SELECT * INTO v_diaria
    FROM public.diarias
   WHERE id = p_diaria_id AND empresa_id = v_empresa_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Diária não encontrada nesta empresa';
  END IF;
  IF v_diaria.cancelada_em IS NOT NULL THEN
    RETURN jsonb_build_object('ok',true,'acao','ja_cancelada');
  END IF;
  IF v_diaria.paga THEN
    RAISE EXCEPTION 'Diária paga. Estorne primeiro o pagamento de equipe';
  END IF;

  SELECT count(*)::integer, count(*) FILTER (WHERE ativo = true)::integer
    INTO v_links, v_ativos
    FROM public.pagamento_diarias
   WHERE empresa_id = v_empresa_id AND diaria_id = v_diaria.id;

  IF v_ativos > 0 THEN
    RAISE EXCEPTION 'Diária vinculada a pagamento ativo. Estorne primeiro o pagamento';
  END IF;

  IF v_links > 0 THEN
    UPDATE public.diarias
       SET cancelada_em = now(),
           motivo_cancelamento = 'Cancelamento após estorno - histórico financeiro preservado'
     WHERE id = v_diaria.id AND empresa_id = v_empresa_id
       AND paga = false AND cancelada_em IS NULL;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows <> 1 THEN RAISE EXCEPTION 'Não foi possível cancelar a diária'; END IF;
    RETURN jsonb_build_object('ok',true,'acao','cancelada','vinculos_historicos',v_links);
  END IF;

  DELETE FROM public.diarias
   WHERE id = v_diaria.id AND empresa_id = v_empresa_id
     AND paga = false AND cancelada_em IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows <> 1 THEN RAISE EXCEPTION 'Não foi possível excluir a diária'; END IF;
  RETURN jsonb_build_object('ok',true,'acao','excluida');
END
$obrix$;
REVOKE ALL ON FUNCTION public.obrix_excluir_diaria_segura(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.obrix_excluir_diaria_segura(uuid) TO authenticated;

-- Integridade: ninguém pode pagar uma diária já cancelada, inclusive clientes antigos.
CREATE OR REPLACE FUNCTION public.obrix_bloquear_pagamento_diaria_cancelada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $obrix$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.diarias d
     WHERE d.id = NEW.diaria_id
       AND d.empresa_id = NEW.empresa_id
       AND d.cancelada_em IS NOT NULL
     FOR KEY SHARE
  ) THEN
    RAISE EXCEPTION 'Diária cancelada. Não é permitido vincular novo pagamento';
  END IF;
  RETURN NEW;
END
$obrix$;
DROP TRIGGER IF EXISTS obrix_pagamento_diarias_cancelada_guard ON public.pagamento_diarias;
CREATE TRIGGER obrix_pagamento_diarias_cancelada_guard
BEFORE INSERT OR UPDATE OF diaria_id, empresa_id
ON public.pagamento_diarias
FOR EACH ROW EXECUTE FUNCTION public.obrix_bloquear_pagamento_diaria_cancelada();

CREATE OR REPLACE FUNCTION public.obrix_bloquear_paga_diaria_cancelada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $obrix$
BEGIN
  IF NEW.paga IS TRUE AND OLD.cancelada_em IS NOT NULL THEN
    RAISE EXCEPTION 'Diária cancelada. Não é permitido marcar como paga';
  END IF;
  RETURN NEW;
END
$obrix$;
DROP TRIGGER IF EXISTS obrix_diaria_cancelada_paga_guard ON public.diarias;
CREATE TRIGGER obrix_diaria_cancelada_paga_guard
BEFORE UPDATE OF paga ON public.diarias
FOR EACH ROW EXECUTE FUNCTION public.obrix_bloquear_paga_diaria_cancelada();
COMMIT;
