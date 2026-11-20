-- OBRIX: Diario de obras + checklist no plano limitado. SOMENTE HML.
-- Projeto isolado xavwkfgrnowmusbkbiea. Nao aplicar no OBRIX oficial.
-- Nao altera SELECT historico. Nao concede DELETE nem direitos em outras empresas.

CREATE OR REPLACE FUNCTION public.obrix_hml_diario_equipe_limitada(
  p_empresa_id uuid,
  p_obra_id uuid,
  p_equipe_ids uuid[]
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO ''
AS $body$
  SELECT public.obrix_hml_pode_operar_registro(
    p_empresa_id,p_obra_id,NULL::uuid,false,false
  )
  AND cardinality(coalesce(p_equipe_ids,ARRAY[]::uuid[])) <= 1
  AND (
    cardinality(coalesce(p_equipe_ids,ARRAY[]::uuid[])) = 0
    OR EXISTS(
      SELECT 1 FROM public.obrix_hml_limite_selecao s
      WHERE s.empresa_id = p_empresa_id
      AND s.obra_id = p_obra_id
      AND s.funcionario_id = p_equipe_ids[1]
    )
  );
$body$;

CREATE OR REPLACE FUNCTION public.obrix_hml_diario_filho_permitido(
  p_empresa_id uuid,
  p_diario_id uuid,
  p_funcionario_id uuid,
  p_requer_funcionario boolean
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO ''
AS $body$
  SELECT p_diario_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.diarios_obra d
    WHERE d.id=p_diario_id
      AND d.empresa_id=p_empresa_id
      AND public.obrix_hml_pode_operar_registro(
        p_empresa_id,d.obra_id,p_funcionario_id,p_requer_funcionario,false
      )
  );
$body$;

REVOKE ALL ON FUNCTION public.obrix_hml_diario_equipe_limitada(uuid,uuid,uuid[])
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_diario_equipe_limitada(uuid,uuid,uuid[])
 TO authenticated;
REVOKE ALL ON FUNCTION public.obrix_hml_diario_filho_permitido(uuid,uuid,uuid,boolean)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_diario_filho_permitido(uuid,uuid,uuid,boolean)
 TO authenticated;

-- DIARIO: leitura antiga livre por empresa, edicao somente da obra
-- escolhida. WITH CHECK impede adicionar a equipe nao autorizada.
CREATE POLICY obrix_hml_limitado_diario_inserir ON public.diarios_obra
 FOR INSERT TO authenticated
 WITH CHECK (
   public.obrix_hml_diario_equipe_limitada(empresa_id,obra_id,equipe_ids)
 );

CREATE POLICY obrix_hml_limitado_diario_atualizar ON public.diarios_obra
 FOR UPDATE TO authenticated
 USING (public.obrix_hml_pode_operar_registro(
   empresa_id,obra_id,NULL::uuid,false,false))
 WITH CHECK (public.obrix_hml_diario_equipe_limitada(
   empresa_id,obra_id,equipe_ids
 ));

-- ATIVIDADES: vinculo de diario pertence a obra e empresa selecionadas.
CREATE POLICY obrix_hml_limitado_diario_atividades_inserir ON public.diario_atividades
 FOR INSERT TO authenticated
 WITH CHECK (public.obrix_hml_diario_filho_permitido(
   empresa_id,diario_id,NULL::uuid,false
 ));

CREATE POLICY obrix_hml_limitado_diario_atividades_atualizar ON public.diario_atividades
 FOR UPDATE TO authenticated
 USING (public.obrix_hml_diario_filho_permitido(
   empresa_id,diario_id,NULL::uuid,false
 ))
 WITH CHECK (public.obrix_hml_diario_filho_permitido(
   empresa_id,diario_id,NULL::uuid,false
 ));

-- EQUIPE DO DIARIO: somente funcionario escolhido, mesmo se o
-- usuario tentar referenciar diario de outra obra.
CREATE POLICY obrix_hml_limitado_diario_equipe_inserir ON public.diario_equipe
 FOR INSERT TO authenticated
 WITH CHECK (public.obrix_hml_diario_filho_permitido(
   empresa_id,diario_id,funcionario_id,true
 ));

CREATE POLICY obrix_hml_limitado_diario_equipe_atualizar ON public.diario_equipe
 FOR UPDATE TO authenticated
 USING (public.obrix_hml_diario_filho_permitido(
   empresa_id,diario_id,funcionario_id,true
 ))
 WITH CHECK (public.obrix_hml_diario_filho_permitido(
   empresa_id,diario_id,funcionario_id,true
 ));

-- CHECKLIST: opera somente dentro da obra escolhida.
CREATE POLICY obrix_hml_limitado_checklist_inserir ON public.checklist_itens
 FOR INSERT TO authenticated
 WITH CHECK (public.obrix_hml_pode_operar_registro(
   empresa_id,obra_id,NULL::uuid,false,false
 ));

CREATE POLICY obrix_hml_limitado_checklist_atualizar ON public.checklist_itens
 FOR UPDATE TO authenticated
 USING (public.obrix_hml_pode_operar_registro(
   empresa_id,obra_id,NULL::uuid,false,false
 ))
 WITH CHECK (public.obrix_hml_pode_operar_registro(
   empresa_id,obra_id,NULL::uuid,false,false
 ));
