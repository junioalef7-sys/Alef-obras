-- OBRIX / HML 2026-11-18 — NÃO APLICAR AO OFICIAL.
-- Uma assinatura mensal ou anual sem data final não concede acesso vitalício.
-- Somente plano explicitamente 'permanente' é ilimitado.
-- Mantém a semântica dos sete dias e do primeiro acesso.
CREATE OR REPLACE FUNCTION public.obrix_acesso_total(p_empresa_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path TO ''
AS $fn$
 SELECT p_empresa_id IS NOT NULL
  AND p_empresa_id = public.obrix_empresa_atual()
  AND EXISTS (
    SELECT 1 FROM public.assinaturas a
    WHERE a.empresa_id = p_empresa_id
      AND (
        (a.status = 'teste' AND a.trial_fim IS NOT NULL AND now() < a.trial_fim)
        OR
        (a.status = 'ativo' AND (
          a.plano = 'permanente'
          OR (a.plano IN ('mensal','anual') AND a.periodo_fim IS NOT NULL AND now() < a.periodo_fim)
        ))
      )
  )
$fn$;

CREATE OR REPLACE FUNCTION private.enforce_funcionario_trial_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
  v_empresa_id uuid;
  v_acesso_total boolean;
BEGIN
  SELECT p.empresa_id INTO v_empresa_id
    FROM public.perfis p WHERE p.id = (SELECT auth.uid()) LIMIT 1;
  IF v_empresa_id IS NULL OR NEW.empresa_id IS DISTINCT FROM v_empresa_id THEN
    RAISE EXCEPTION 'Empresa invalida para o usuario autenticado.';
  END IF;
  v_acesso_total := public.obrix_acesso_total(v_empresa_id);
  IF NOT v_acesso_total AND (
    SELECT count(*) FROM public.funcionarios f WHERE f.empresa_id = v_empresa_id
  ) >= 1 THEN
    RAISE EXCEPTION 'Plano limitado: permitido no maximo 1 funcionario.';
  END IF;
  RETURN NEW;
END
$fn$;

CREATE OR REPLACE FUNCTION private.enforce_obra_trial_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $fn$
DECLARE
  v_empresa_id uuid;
  v_acesso_total boolean;
BEGIN
  IF current_setting('obrix.restore',true) = 'on' THEN
    RETURN NEW;
  END IF;
  SELECT p.empresa_id INTO v_empresa_id
    FROM public.perfis p WHERE p.id = (SELECT auth.uid()) LIMIT 1;
  IF v_empresa_id IS NULL OR NEW.empresa_id IS DISTINCT FROM v_empresa_id THEN
    RAISE EXCEPTION 'Empresa invalida para o usuario autenticado.';
  END IF;
  v_acesso_total := public.obrix_acesso_total(v_empresa_id);
  IF NOT v_acesso_total AND (
    SELECT count(*) FROM public.obras o WHERE o.empresa_id = v_empresa_id
  ) >= 1 THEN
    RAISE EXCEPTION 'Plano limitado: permitido no maximo 1 obra.';
  END IF;
  RETURN NEW;
END
$fn$;
