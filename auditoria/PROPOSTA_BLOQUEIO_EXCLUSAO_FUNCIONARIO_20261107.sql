-- OBRIX | PROPOSTA PARA REVISÃO — NÃO EXECUTAR NA PRODUÇÃO
-- Preparada após homologação em Supabase de AUDITORIA em 07/11/2026.
-- Objetivo: preservar histórico de funcionários em exclusões individuais,
-- sem bloquear a exclusão por cascata da empresa inteira.
-- Pré-requisito: revisar e testar fluxos reais de exclusão de conta e RLS
-- no aplicativo oficial. Requer autorização expressa antes da implantação.

CREATE OR REPLACE FUNCTION private.obrix_bloquear_exclusao_funcionario_historico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- A exclusão integral da empresa já removeu o registro pai na transação:
  -- permitir ON DELETE CASCADE para que uma conta possa ser excluída integralmente.
  IF NOT EXISTS(SELECT 1 FROM public.empresas e WHERE e.id=OLD.empresa_id) THEN
    RETURN OLD;
  END IF;

  -- Validação adicional quando a operação parte de uma sessão autenticada.
  IF (SELECT auth.uid()) IS NOT NULL
    AND OLD.empresa_id IS DISTINCT FROM public.obrix_empresa_atual() THEN
    RAISE EXCEPTION 'Empresa não autorizada para excluir este funcionário.';
  END IF;

  IF EXISTS(SELECT 1 FROM public.diarias x WHERE x.empresa_id=OLD.empresa_id AND x.funcionario_id=OLD.id)
  OR EXISTS(SELECT 1 FROM public.faltas x WHERE x.empresa_id=OLD.empresa_id AND x.funcionario_id=OLD.id)
  OR EXISTS(SELECT 1 FROM public.vales x WHERE x.empresa_id=OLD.empresa_id AND x.funcionario_id=OLD.id)
  OR EXISTS(SELECT 1 FROM public.bonus_extras x WHERE x.empresa_id=OLD.empresa_id AND x.funcionario_id=OLD.id)
  OR EXISTS(SELECT 1 FROM public.pagamentos_equipe x WHERE x.empresa_id=OLD.empresa_id AND x.funcionario_id=OLD.id)
  OR EXISTS(SELECT 1 FROM public.diario_equipe x WHERE x.empresa_id=OLD.empresa_id AND x.funcionario_id=OLD.id)
  OR EXISTS(SELECT 1 FROM public.documentos x WHERE x.empresa_id=OLD.empresa_id AND x.funcionario_id=OLD.id)
  OR EXISTS(SELECT 1 FROM public.relatorios x WHERE x.empresa_id=OLD.empresa_id AND x.funcionario_id=OLD.id)
  THEN
    RAISE EXCEPTION 'Funcionário possui histórico. Utilize Inativar para preservar diárias, vales, bônus, pagamentos e documentos.';
  END IF;

  RETURN OLD;
END;
$$;

-- A função de trigger não deve ser exposta como RPC a usuários comuns.
REVOKE ALL ON FUNCTION private.obrix_bloquear_exclusao_funcionario_historico()
FROM PUBLIC, anon, authenticated;

-- Verificar previamente se o gatilho não foi criado por outra implantação.
CREATE TRIGGER trg_obrix_bloquear_exclusao_funcionario_com_historico
BEFORE DELETE ON public.funcionarios
FOR EACH ROW
EXECUTE FUNCTION private.obrix_bloquear_exclusao_funcionario_historico();

-- Atenção: após ativar o gatilho, o botão Excluir deve exibir o erro de histórico
-- com instrução para inativação. Não aplicar sem teste de exclusão de conta.
