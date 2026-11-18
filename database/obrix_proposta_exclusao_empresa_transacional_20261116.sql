-- PROPOSTA ANTIGA / SUPERADA EM 16/11/2026.
-- A Edge Function de teste agora exige o journal retomável:
-- obrix_reservar_exclusao_v1, obrix_avancar_exclusao_v1,
-- obrix_consultar_exclusao_v1 e o registro persistente de estados.
-- Este arquivo isoladamente NÃO satisfaz essa API; NÃO aplicar.
-- O arquivo mantém sua guarda de abortar execução intencionalmente.
-- OBRIX | PROPOSTA PARA REVISÃO HUMANA — NÃO EXECUTADA
-- NÃO EXECUTAR EM PRODUÇÃO. Primeiro testar num clone autorizado com dados fictícios.
-- O bloqueio inicial é proposital: remova-o somente após revisar o estado real
-- de TODOS os gatilhos, FKs e tabelas associados à empresa.
-- Supabase Auth e Storage são separados da transação SQL.
BEGIN;
DO $guard$
BEGIN
  RAISE EXCEPTION 'OBRIX PROPOSTA NÃO APROVADA: banco não alterado';
END $guard$;

-- 1. Contexto confiável, privado, válido apenas na transação da exclusão.
CREATE SCHEMA IF NOT EXISTS obrix_exclusao_interna;
REVOKE ALL ON SCHEMA obrix_exclusao_interna FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS obrix_exclusao_interna.contexto (
  transacao bigint NOT NULL,
  empresa_id uuid NOT NULL,
  PRIMARY KEY (transacao,empresa_id)
);
REVOKE ALL ON obrix_exclusao_interna.contexto FROM PUBLIC,anon,authenticated;

-- 2. Substituição proposta do gatilho de proteção financeira: replica
-- a lógica observada na homologação e acrescenta UMA exceção auditável.
-- IMPORTANTE: antes de ativar, comparar com pg_get_functiondef na produção.
CREATE OR REPLACE FUNCTION public.obrix_proteger_financeiro_automatico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
DECLARE
  v_origem text := coalesce(old.origem,'manual');
  v_msg text;
  v_papel text;
BEGIN
  -- Somente a função privada, com autorização restrita ao service_role,
  -- pode inserir este contexto na própria transação. Nunca confiar em
  -- parâmetros de cliente nem em um GUC de sessão controlável pelo usuário.
  IF TG_OP='DELETE' AND EXISTS (
    SELECT 1 FROM obrix_exclusao_interna.contexto c
    WHERE c.transacao=txid_current() AND c.empresa_id=old.empresa_id
  ) THEN
    RETURN OLD;
  END IF;

  IF v_origem='manual' THEN
    RETURN CASE WHEN TG_OP='DELETE' THEN old ELSE new END;
  END IF;
  IF TG_OP='DELETE' AND old.status_lancamento='estornado' THEN
    SELECT p.papel INTO v_papel FROM public.perfis p
     WHERE p.id=auth.uid() LIMIT 1;
    IF coalesce(v_papel,'') IN ('proprietario','admin') THEN
      RETURN old;
    END IF;
  END IF;
  v_msg := CASE v_origem
    WHEN 'estoque' THEN 'Este lançamento foi gerado pelo Estoque. Faça o estorno em Estoque > Histórico.'
    WHEN 'compra' THEN 'Este lançamento foi gerado por uma compra. Cancele ou estorne a compra no módulo Estoque.'
    WHEN 'pagamento_equipe' THEN 'Este lançamento foi gerado por um pagamento da equipe. Faça o estorno pelo módulo Equipe.'
    ELSE 'Este lançamento automático deve ser corrigido no módulo de origem.'
  END;
  IF TG_OP='DELETE' THEN RAISE EXCEPTION '%',v_msg; END IF;
  IF TG_OP='UPDATE' THEN
    IF old.status_lancamento='ativo'
      AND new.status_lancamento='estornado'
      AND new.empresa_id IS NOT DISTINCT FROM old.empresa_id
      AND new.obra_id IS NOT DISTINCT FROM old.obra_id
      AND new.checklist_id IS NOT DISTINCT FROM old.checklist_id
      AND new.tipo IS NOT DISTINCT FROM old.tipo
      AND new.categoria IS NOT DISTINCT FROM old.categoria
      AND new.descricao IS NOT DISTINCT FROM old.descricao
      AND new.valor IS NOT DISTINCT FROM old.valor
      AND new.data IS NOT DISTINCT FROM old.data
      AND new.origem IS NOT DISTINCT FROM old.origem
      AND new.pagamento_equipe_id IS NOT DISTINCT FROM old.pagamento_equipe_id
      AND new.compra_id IS NOT DISTINCT FROM old.compra_id
      AND new.estoque_movimentacao_id IS NOT DISTINCT FROM old.estoque_movimentacao_id
    THEN RETURN NEW; END IF;
    RAISE EXCEPTION '%',v_msg;
  END IF;
  RETURN NEW;
END;
$fn$;

-- 3. Exclusão interna, nunca exposta ao usuário nem ao navegador.
-- Toda remoção e verificação acontecem NA MESMA transação SQL.
CREATE OR REPLACE FUNCTION obrix_exclusao_interna.apagar_empresa(p_empresa_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $apagar$
DECLARE
  v_removidas integer;
  v_tabela record;
  v_restantes boolean;
BEGIN
  INSERT INTO obrix_exclusao_interna.contexto(transacao,empresa_id)
    VALUES(txid_current(),p_empresa_id);
  -- Financeiro antes dos pagamentos evita perda de vínculos e segue
  -- auditável pela exceção exclusiva desta transação de exclusão.
  DELETE FROM public.financeiro WHERE empresa_id=p_empresa_id;
  IF to_regclass('public.relatorio_fotos') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.relatorio_fotos WHERE empresa_id=$1' USING p_empresa_id;
  END IF;
  IF to_regclass('public.notas') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.notas WHERE empresa_id=$1' USING p_empresa_id;
  END IF;
  DELETE FROM public.empresas WHERE id=p_empresa_id;
  GET DIAGNOSTICS v_removidas=ROW_COUNT;
  IF v_removidas<>1 THEN RAISE EXCEPTION 'Empresa não removida integralmente.'; END IF;
  FOR v_tabela IN
    SELECT DISTINCT c.table_schema,c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema=c.table_schema AND t.table_name=c.table_name
    WHERE c.table_schema='public' AND c.column_name='empresa_id'
      AND t.table_type='BASE TABLE' AND c.table_name<>'empresas'
  LOOP
    EXECUTE format(
      'SELECT EXISTS(SELECT 1 FROM %I.%I WHERE empresa_id::text=$1)',
       v_tabela.table_schema,v_tabela.table_name)
      INTO v_restantes USING p_empresa_id::text;
    IF v_restantes THEN
      RAISE EXCEPTION 'Restaram dados da empresa na tabela %.',v_tabela.table_name;
    END IF;
  END LOOP;
  DELETE FROM obrix_exclusao_interna.contexto
   WHERE transacao=txid_current() AND empresa_id=p_empresa_id;
END;
$apagar$;
REVOKE ALL ON FUNCTION obrix_exclusao_interna.apagar_empresa(uuid)
 FROM PUBLIC,anon,authenticated;

-- 4. RPC pública com EXECUTE exclusivo de service_role.
-- O modo prévia REALMENTE tenta todas as exclusões e REVERTE por savepoint
-- PL/pgSQL; não retorna aprovação só por verificar uma contagem de perfis.
CREATE OR REPLACE FUNCTION public.obrix_excluir_empresa_dados_v1(
 p_empresa_id uuid, p_usuario_id uuid, p_simular boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $rpc$
DECLARE
  v_usuarios integer;
BEGIN
  IF p_empresa_id IS NULL OR p_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Empresa e usuário obrigatórios.';
  END IF;
  PERFORM 1 FROM public.empresas WHERE id=p_empresa_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
  SELECT count(*) INTO v_usuarios
   FROM public.perfis WHERE empresa_id=p_empresa_id;
  IF v_usuarios<>1 OR NOT EXISTS(
    SELECT 1 FROM public.perfis WHERE empresa_id=p_empresa_id
     AND id=p_usuario_id AND papel IN ('proprietario','admin')
  ) THEN
    RAISE EXCEPTION 'A exclusão total requer um único titular autorizado.';
  END IF;
  IF p_simular THEN
    BEGIN
      PERFORM obrix_exclusao_interna.apagar_empresa(p_empresa_id);
      -- Um RAISE/EXCEPTION nesta subtransação desfaz as exclusões,
      -- inclusive as cascatas de FK e o contexto transitório da trigger.
      RAISE EXCEPTION 'OBRIX_SIMULACAO_ROLLBACK_20261116';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM='OBRIX_SIMULACAO_ROLLBACK_20261116' THEN
        RETURN jsonb_build_object('ok',true,'simulacao',true);
      END IF;
      RAISE;
    END;
  END IF;

  PERFORM obrix_exclusao_interna.apagar_empresa(p_empresa_id);
  RETURN jsonb_build_object('ok',true,'simulacao',false,'empresaRemovida',true);
END;
$rpc$;

REVOKE ALL ON FUNCTION public.obrix_excluir_empresa_dados_v1(uuid,uuid,boolean)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_excluir_empresa_dados_v1(uuid,uuid,boolean)
 TO service_role;
COMMIT;
