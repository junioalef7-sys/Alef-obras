-- OBRIX: liberacao operacional seletiva depois de 7 dias
-- ESCOPO EXCLUSIVO DO BANCO ISOLADO xavwkfgrnowmusbkbiea
-- Nao aplicar ao oficial. Preserva SELECT do historico e ALL do plano pago.
-- Sem permissoes novas de DELETE; financeiro limitado apenas a origem manual.

CREATE OR REPLACE FUNCTION public.obrix_hml_pode_operar_registro(
    p_empresa_id uuid,
    p_obra_id uuid,
    p_funcionario_id uuid,
    p_requer_funcionario boolean,
    p_aceita_obra_nula boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO ''
AS $body$
  SELECT
    p_empresa_id IS NOT NULL
    AND p_empresa_id = (SELECT public.obrix_empresa_atual())
    AND (SELECT auth.uid()) IS NOT NULL
    AND NOT public.obrix_acesso_total(p_empresa_id)
    AND EXISTS (
      SELECT 1 FROM public.perfis p
      WHERE p.id=(SELECT auth.uid()) AND p.empresa_id=p_empresa_id
      AND p.papel IN ('proprietario','administrador')
    )
    AND EXISTS (
      SELECT 1 FROM public.obrix_hml_limite_selecao s
      WHERE s.empresa_id=p_empresa_id
      AND s.obra_id IS NOT NULL
      AND (s.obra_id=p_obra_id OR (p_aceita_obra_nula AND p_obra_id IS NULL))
      AND (NOT p_requer_funcionario OR
           (p_funcionario_id IS NOT NULL AND s.funcionario_id=p_funcionario_id))
    );
$body$;

REVOKE ALL ON FUNCTION public.obrix_hml_pode_operar_registro(uuid,uuid,uuid,boolean,boolean)
 FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_pode_operar_registro(uuid,uuid,uuid,boolean,boolean)
 TO authenticated;
COMMENT ON FUNCTION public.obrix_hml_pode_operar_registro(uuid,uuid,uuid,boolean,boolean)
 IS 'HML somente: verifica obra e funcionario selecionados apos trial; nunca concede consulta de outra empresa e nao altera assinaturas.';

-- diarias: assinatura ativa segue pelas policies originais;
-- plano vencido so permite selecionar e editar registros autorizados.
CREATE POLICY obrix_hml_limitado_inserir_diarias
 ON public.diarias
 FOR INSERT TO authenticated
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, false));

CREATE POLICY obrix_hml_limitado_atualizar_diarias
 ON public.diarias
 FOR UPDATE TO authenticated
 USING (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, false))
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, false));

-- financeiro: assinatura ativa segue pelas policies originais;
-- plano vencido so permite selecionar e editar registros autorizados.
CREATE POLICY obrix_hml_limitado_inserir_financeiro
 ON public.financeiro
 FOR INSERT TO authenticated
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, NULL::uuid, false, false) AND origem = 'manual');

CREATE POLICY obrix_hml_limitado_atualizar_financeiro
 ON public.financeiro
 FOR UPDATE TO authenticated
 USING (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, NULL::uuid, false, false) AND origem = 'manual')
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, NULL::uuid, false, false) AND origem = 'manual');

-- faltas: assinatura ativa segue pelas policies originais;
-- plano vencido so permite selecionar e editar registros autorizados.
CREATE POLICY obrix_hml_limitado_inserir_faltas
 ON public.faltas
 FOR INSERT TO authenticated
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, true));

CREATE POLICY obrix_hml_limitado_atualizar_faltas
 ON public.faltas
 FOR UPDATE TO authenticated
 USING (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, true))
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, true));

-- vales: assinatura ativa segue pelas policies originais;
-- plano vencido so permite selecionar e editar registros autorizados.
CREATE POLICY obrix_hml_limitado_inserir_vales
 ON public.vales
 FOR INSERT TO authenticated
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, false));

CREATE POLICY obrix_hml_limitado_atualizar_vales
 ON public.vales
 FOR UPDATE TO authenticated
 USING (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, false))
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, false));

-- bonus_extras: assinatura ativa segue pelas policies originais;
-- plano vencido so permite selecionar e editar registros autorizados.
CREATE POLICY obrix_hml_limitado_inserir_bonus_extras
 ON public.bonus_extras
 FOR INSERT TO authenticated
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, false));

CREATE POLICY obrix_hml_limitado_atualizar_bonus_extras
 ON public.bonus_extras
 FOR UPDATE TO authenticated
 USING (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, false))
 WITH CHECK (public.obrix_hml_pode_operar_registro(empresa_id, obra_id, funcionario_id, true, false));

