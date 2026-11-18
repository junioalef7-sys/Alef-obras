
-- OBRIX: implementação exclusiva da homologação isolada de 18/11/2026.
-- Não aplicar ao banco oficial.
CREATE TABLE IF NOT EXISTS public.obrix_hml_limite_selecao (
  empresa_id uuid PRIMARY KEY REFERENCES public.empresas(id) ON DELETE CASCADE,
  obra_id uuid NULL,
  funcionario_id uuid NULL,
  selecionado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.obrix_hml_limite_selecao ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.obrix_hml_limite_selecao FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.obrix_hml_limite_selecao TO authenticated;
CREATE POLICY obrix_hml_limite_selecao_consulta ON public.obrix_hml_limite_selecao
  FOR SELECT TO authenticated USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE OR REPLACE FUNCTION public.obrix_hml_selecionar_plano_limitado(
  p_obra_id uuid DEFAULT NULL, p_funcionario_id uuid DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE v_empresa uuid; v_papel text; v_obra uuid; v_funcionario uuid;
BEGIN
  SELECT p.empresa_id,p.papel INTO v_empresa,v_papel FROM public.perfis p
    WHERE p.id = (SELECT auth.uid());
  IF v_empresa IS NULL OR coalesce(v_papel,'') NOT IN ('proprietario','administrador') THEN
    RAISE EXCEPTION 'Somente o proprietário ou administrador pode selecionar os registros do plano limitado.' USING ERRCODE='42501';
  END IF;
  IF public.obrix_acesso_total(v_empresa) THEN
    RAISE EXCEPTION 'A assinatura está ativa. Não é necessário limitar os registros.' USING ERRCODE='23514';
  END IF;
  IF p_obra_id IS NULL AND p_funcionario_id IS NULL THEN
    RAISE EXCEPTION 'Selecione uma obra ou um funcionário.' USING ERRCODE='23514';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('obrix-hml-plan-select:' || v_empresa::text,0));
  IF p_obra_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.obras o WHERE o.id=p_obra_id AND o.empresa_id=v_empresa
  ) THEN
    RAISE EXCEPTION 'A obra selecionada não pertence à empresa.' USING ERRCODE='23514';
  END IF;
  IF p_funcionario_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.funcionarios f WHERE f.id=p_funcionario_id AND f.empresa_id=v_empresa
  ) THEN
    RAISE EXCEPTION 'O funcionário selecionado não pertence à empresa.' USING ERRCODE='23514';
  END IF;
  SELECT s.obra_id,s.funcionario_id INTO v_obra,v_funcionario
    FROM public.obrix_hml_limite_selecao s WHERE s.empresa_id=v_empresa FOR UPDATE;
  IF (v_obra IS NOT NULL AND p_obra_id IS NOT NULL AND v_obra<>p_obra_id)
     OR (v_funcionario IS NOT NULL AND p_funcionario_id IS NOT NULL AND v_funcionario<>p_funcionario_id) THEN
    RAISE EXCEPTION 'A seleção já está definida. A troca exige reativação da assinatura.' USING ERRCODE='23514';
  END IF;
  INSERT INTO public.obrix_hml_limite_selecao AS s (empresa_id,obra_id,funcionario_id)
  VALUES(v_empresa,p_obra_id,p_funcionario_id)
  ON CONFLICT(empresa_id) DO UPDATE SET
    obra_id=coalesce(s.obra_id,EXCLUDED.obra_id),
    funcionario_id=coalesce(s.funcionario_id,EXCLUDED.funcionario_id);
  SELECT s.obra_id,s.funcionario_id INTO v_obra,v_funcionario
    FROM public.obrix_hml_limite_selecao s WHERE s.empresa_id=v_empresa;
  RETURN jsonb_build_object('ok',true,'obra_id',v_obra,'funcionario_id',v_funcionario);
END
$body$;
REVOKE ALL ON FUNCTION public.obrix_hml_selecionar_plano_limitado(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.obrix_hml_selecionar_plano_limitado(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION private.obrix_hml_limite_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE v_empresa uuid; v_selecionado uuid;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN RETURN NEW; END IF;
  v_empresa := CASE WHEN TG_OP='INSERT' THEN NEW.empresa_id ELSE OLD.empresa_id END;
  IF v_empresa IS DISTINCT FROM public.obrix_empresa_atual() THEN
    RAISE EXCEPTION 'Operação fora da empresa autenticada.' USING ERRCODE='42501';
  END IF;
  IF public.obrix_acesso_total(v_empresa) THEN RETURN NEW; END IF;
  IF TG_OP='INSERT' THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('obrix-hml-plan-new:'||v_empresa::text||':'||TG_TABLE_NAME,0));
    IF EXISTS (
      SELECT 1 FROM public.obrix_hml_limite_selecao s
      WHERE s.empresa_id=v_empresa AND
        CASE WHEN TG_TABLE_NAME='obras' THEN s.obra_id ELSE s.funcionario_id END IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Plano limitado: o registro permitido já foi escolhido.' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.empresa_id IS DISTINCT FROM OLD.empresa_id THEN
    RAISE EXCEPTION 'Não é permitido alterar o identificador do registro ou da empresa.' USING ERRCODE='42501';
  END IF;
  SELECT CASE WHEN TG_TABLE_NAME='obras' THEN s.obra_id ELSE s.funcionario_id END
  INTO v_selecionado FROM public.obrix_hml_limite_selecao s WHERE s.empresa_id=v_empresa;
  IF v_selecionado IS NULL OR v_selecionado<>OLD.id THEN
    RAISE EXCEPTION 'Plano limitado: este registro está disponível somente para consulta. Selecione o registro permitido em Planos e Assinaturas.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END
$body$;

CREATE OR REPLACE FUNCTION private.obrix_hml_limite_apos_cadastro()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.obrix_acesso_total(NEW.empresa_id) THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME='obras' THEN
    INSERT INTO public.obrix_hml_limite_selecao AS s (empresa_id,obra_id)
      VALUES(NEW.empresa_id,NEW.id)
    ON CONFLICT (empresa_id) DO UPDATE SET obra_id=coalesce(s.obra_id,EXCLUDED.obra_id);
  ELSIF TG_TABLE_NAME='funcionarios' THEN
    INSERT INTO public.obrix_hml_limite_selecao AS s (empresa_id,funcionario_id)
      VALUES(NEW.empresa_id,NEW.id)
    ON CONFLICT (empresa_id) DO UPDATE SET funcionario_id=coalesce(s.funcionario_id,EXCLUDED.funcionario_id);
  END IF;
  RETURN NEW;
END
$body$;

CREATE TRIGGER obrix_hml_limited_guard_obras
  BEFORE INSERT OR UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION private.obrix_hml_limite_guard();
CREATE TRIGGER obrix_hml_limited_guard_funcionarios
  BEFORE INSERT OR UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION private.obrix_hml_limite_guard();
CREATE TRIGGER obrix_hml_limited_pick_obras
  AFTER INSERT ON public.obras FOR EACH ROW EXECUTE FUNCTION private.obrix_hml_limite_apos_cadastro();
CREATE TRIGGER obrix_hml_limited_pick_funcionarios
  AFTER INSERT ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION private.obrix_hml_limite_apos_cadastro();

-- Exclusão comum fica impedida quando o teste vence; a exclusão definitiva
-- de conta por serviço administrativo não depende dessas políticas de usuário.
ALTER POLICY obras_delete_empresa ON public.obras
  USING (empresa_id=public.obrix_empresa_atual() AND public.obrix_acesso_total(empresa_id));
ALTER POLICY funcionarios_delete_empresa ON public.funcionarios
  USING (empresa_id=public.obrix_empresa_atual() AND public.obrix_acesso_total(empresa_id));
