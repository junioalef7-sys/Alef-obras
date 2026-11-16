-- OBRIX | REPRODUÇÃO DO LABORATÓRIO SQL | 16/11/2026
-- Somente ambiente OBRIX-AUDITORIA-AUTH-20261102 (mjzlwnuklfopdmgcvdcs).
-- NÃO executar contra o banco oficial nem via migrações automáticas.
-- A transação evita que ferramentas SQL continuem após o erro da guarda.
BEGIN;
DO $guard$ BEGIN RAISE EXCEPTION 'OBRIX HML: execucao manual deliberada requerida'; END $guard$;

-- A migração abaixo foi aplicada no laboratório com esta guarda omitida.
CREATE SCHEMA IF NOT EXISTS obrix_exclusao_hml_20261116;
REVOKE ALL ON SCHEMA obrix_exclusao_hml_20261116 FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS obrix_exclusao_hml_20261116.contexto(
  transacao bigint NOT NULL,
  empresa_id uuid NOT NULL,
  PRIMARY KEY (transacao,empresa_id)
);
REVOKE ALL ON obrix_exclusao_hml_20261116.contexto FROM PUBLIC,anon,authenticated;

-- obrix_operacional_lab.obrix_proteger_financeiro_automatico()
CREATE OR REPLACE FUNCTION obrix_operacional_lab.obrix_proteger_financeiro_automatico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_origem text := coalesce(old.origem,'manual');
  v_msg text;
  v_papel text;
BEGIN
  -- Somente a função privada, com autorização restrita ao service_role,
  -- pode inserir este contexto na própria transação. Nunca confiar em
  -- parâmetros de cliente nem em um GUC de sessão controlável pelo usuário.
  IF TG_OP='DELETE' AND EXISTS (
    SELECT 1 FROM obrix_exclusao_hml_20261116.contexto c
    WHERE c.transacao=txid_current() AND c.empresa_id=old.empresa_id
  ) THEN
    RETURN OLD;
  END IF;

  IF v_origem='manual' THEN
    RETURN CASE WHEN TG_OP='DELETE' THEN old ELSE new END;
  END IF;
  IF TG_OP='DELETE' AND old.status_lancamento='estornado' THEN
    SELECT p.papel INTO v_papel FROM obrix_operacional_lab.perfis p
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
$function$;

-- obrix_exclusao_hml_20261116.apagar_empresa(uuid)
CREATE OR REPLACE FUNCTION obrix_exclusao_hml_20261116.apagar_empresa(p_empresa_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_removidas integer;
  v_tabela record;
  v_restantes boolean;
BEGIN
  INSERT INTO obrix_exclusao_hml_20261116.contexto(transacao,empresa_id)
    VALUES(txid_current(),p_empresa_id);
  -- Financeiro antes dos pagamentos evita perda de vínculos e segue
  -- auditável pela exceção exclusiva desta transação de exclusão.
  DELETE FROM obrix_operacional_lab.financeiro WHERE empresa_id=p_empresa_id;
  IF to_regclass('obrix_operacional_lab.relatorio_fotos') IS NOT NULL THEN
    EXECUTE 'DELETE FROM obrix_operacional_lab.relatorio_fotos WHERE empresa_id=$1' USING p_empresa_id;
  END IF;
  IF to_regclass('obrix_operacional_lab.notas') IS NOT NULL THEN
    EXECUTE 'DELETE FROM obrix_operacional_lab.notas WHERE empresa_id=$1' USING p_empresa_id;
  END IF;
  DELETE FROM obrix_operacional_lab.empresas WHERE id=p_empresa_id;
  GET DIAGNOSTICS v_removidas=ROW_COUNT;
  IF v_removidas<>1 THEN RAISE EXCEPTION 'Empresa não removida integralmente.'; END IF;
  FOR v_tabela IN
    SELECT DISTINCT c.table_schema,c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema=c.table_schema AND t.table_name=c.table_name
    WHERE c.table_schema='obrix_operacional_lab' AND c.column_name='empresa_id'
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
  DELETE FROM obrix_exclusao_hml_20261116.contexto
   WHERE transacao=txid_current() AND empresa_id=p_empresa_id;
END;
$function$;

-- obrix_seg_hml_20261116.obrix_excluir_empresa_dados_v1(uuid,uuid,boolean)
CREATE OR REPLACE FUNCTION obrix_seg_hml_20261116.obrix_excluir_empresa_dados_v1(p_empresa_id uuid, p_usuario_id uuid, p_simular boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_usuarios integer;
BEGIN
  IF p_empresa_id IS NULL OR p_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Empresa e usuário obrigatórios.';
  END IF;
  PERFORM 1 FROM obrix_operacional_lab.empresas WHERE id=p_empresa_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
  SELECT count(*) INTO v_usuarios
   FROM obrix_operacional_lab.perfis WHERE empresa_id=p_empresa_id;
  IF v_usuarios<>1 OR NOT EXISTS(
    SELECT 1 FROM obrix_operacional_lab.perfis WHERE empresa_id=p_empresa_id
     AND id=p_usuario_id AND papel IN ('proprietario','admin')
  ) THEN
    RAISE EXCEPTION 'A exclusão total requer um único titular autorizado.';
  END IF;
  IF p_simular THEN
    BEGIN
      PERFORM obrix_exclusao_hml_20261116.apagar_empresa(p_empresa_id);
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

  PERFORM obrix_exclusao_hml_20261116.apagar_empresa(p_empresa_id);
  RETURN jsonb_build_object('ok',true,'simulacao',false,'empresaRemovida',true);
END;
$function$;

-- obrix_seg_hml_20261116.executar_testes_exclusao_v1()
CREATE OR REPLACE FUNCTION obrix_seg_hml_20261116.executar_testes_exclusao_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
 e1 uuid := gen_random_uuid();
 e2 uuid := gen_random_uuid();
 u1 uuid := gen_random_uuid();
 u2 uuid := gen_random_uuid();
 uextra uuid := gen_random_uuid();
 obra1 uuid;
 obra2 uuid;
 fun1 uuid;
 fun2 uuid;
 dia2 uuid;
 pg2 uuid;
 fin2 uuid;
 dia1 uuid;
 vale1 uuid;
 pg1 uuid;
 fin1 uuid;
 res jsonb := '{}'::jsonb;
 r jsonb;
 before_count bigint;
 direct_block boolean := false;
 after_block boolean := false;
 unauthorized_block boolean := false;
 multiple_block boolean := false;
 original_claim text := current_setting('request.jwt.claim.sub',true);
 fase text := 'início';
BEGIN
 BEGIN
   fase:='criar empresas';
   INSERT INTO obrix_operacional_lab.empresas(id) VALUES(e1),(e2);
   INSERT INTO obrix_operacional_lab.assinaturas(empresa_id,status)
     VALUES(e1,'ativo'),(e2,'ativo');
   INSERT INTO obrix_operacional_lab.perfis(id,empresa_id,papel)
     VALUES(u1,e1,'proprietario'),(u2,e2,'proprietario');
   PERFORM set_config('request.jwt.claim.sub',u1::text,true);
   INSERT INTO obrix_operacional_lab.obras(empresa_id,nome,status)
     VALUES(e1,'HML EXCLUIR - obra 1','andamento') RETURNING id INTO obra1;
   PERFORM set_config('request.jwt.claim.sub',u2::text,true);
   INSERT INTO obrix_operacional_lab.obras(empresa_id,nome,status)

     VALUES(e2,'HML EXCLUIR - obra 2','andamento') RETURNING id INTO obra2;
   INSERT INTO obrix_operacional_lab.funcionarios(empresa_id,nome,valor_diaria)
     VALUES(e2,'Funcionário fictício de outra empresa',160) RETURNING id INTO fun2;
   INSERT INTO obrix_operacional_lab.diarias(empresa_id,funcionario_id,obra_id,quantidade,valor_unitario,valor_total)
     VALUES(e2,fun2,obra2,1,160,160) RETURNING id INTO dia2;
   pg2:=(obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
     fun2,current_date,array[dia2],'{}'::uuid[],'{}'::uuid[])->>'pagamento_id')::uuid;
   SELECT id INTO fin2 FROM obrix_operacional_lab.financeiro
      WHERE pagamento_equipe_id=pg2 AND status_lancamento='ativo';
   IF fin2 IS NULL THEN RAISE EXCEPTION 'Falta o pagamento automático da segunda empresa'; END IF;
   PERFORM set_config('request.jwt.claim.sub',u1::text,true);
   INSERT INTO obrix_operacional_lab.funcionarios(empresa_id,nome,valor_diaria)
     VALUES(e1,'Funcionário fictício exclusão',200) RETURNING id INTO fun1;
   INSERT INTO obrix_operacional_lab.diarias(empresa_id,funcionario_id,obra_id,quantidade,valor_unitario,valor_total)
     VALUES(e1,fun1,obra1,1,200,200) RETURNING id INTO dia1;
   INSERT INTO obrix_operacional_lab.vales(empresa_id,funcionario_id,obra_id,valor)
     VALUES(e1,fun1,obra1,50) RETURNING id INTO vale1;
   fase:='criar pagamento';
   r:=obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(fun1,current_date,
     array[dia1],array[vale1],'{}'::uuid[]);
   pg1:=(r->>'pagamento_id')::uuid;
   SELECT id INTO fin1 FROM obrix_operacional_lab.financeiro
       WHERE pagamento_equipe_id=pg1 AND status_lancamento='ativo' LIMIT 1;
   IF fin1 IS NULL THEN RAISE EXCEPTION 'Não houve financeiro de pagamento.'; END IF;
   -- Isolamento: outra empresa possui registro financeiro manual sem relação com e1.
   PERFORM set_config('request.jwt.claim.sub',u2::text,true);
   INSERT INTO obrix_operacional_lab.financeiro(empresa_id,obra_id,tipo,categoria,descricao,valor,data,origem,status_lancamento)
     VALUES(e2,obra2,'receita','outros','Registro fictício de outra empresa',100,current_date,'manual','ativo');
   PERFORM set_config('request.jwt.claim.sub',u1::text,true);

   BEGIN
     DELETE FROM obrix_operacional_lab.financeiro WHERE id=fin1 AND empresa_id=e1;
   EXCEPTION WHEN OTHERS THEN
     direct_block:=sqlerrm ILIKE '%Este lançamento foi gerado por um pagamento%';
   END;
   IF NOT direct_block THEN RAISE EXCEPTION 'EXCLUSAO DIRETA INDEVIDAMENTE AUTORIZADA'; END IF;
   res:=res||jsonb_build_object('exclusao_financeiro_direta_bloqueada',true);

   BEGIN
     PERFORM obrix_seg_hml_20261116.obrix_excluir_empresa_dados_v1(e1,uextra,true);
   EXCEPTION WHEN OTHERS THEN
     unauthorized_block:=sqlerrm ILIKE '%único titular autorizado%';
   END;
   IF NOT unauthorized_block THEN RAISE EXCEPTION 'AUTORIZACAO DE OUTRO USUARIO PASSOU'; END IF;
   res:=res||jsonb_build_object('usuario_sem_vinculo_rejeitado',true);

   INSERT INTO obrix_operacional_lab.perfis(id,empresa_id,papel) VALUES(uextra,e1,'admin');
   BEGIN
      PERFORM obrix_seg_hml_20261116.obrix_excluir_empresa_dados_v1(e1,u1,true);
   EXCEPTION WHEN OTHERS THEN
      multiple_block:=sqlerrm ILIKE '%único titular autorizado%';
   END;
   IF NOT multiple_block THEN RAISE EXCEPTION 'EMPRESA COM MULTIPLOS USUARIOS PASSOU'; END IF;
   DELETE FROM obrix_operacional_lab.perfis WHERE id=uextra;
   res:=res||jsonb_build_object('empresa_com_multiplos_usuarios_preservada',true);

   SELECT count(*) INTO before_count FROM obrix_operacional_lab.financeiro WHERE empresa_id=e1;
   IF before_count<2 THEN RAISE EXCEPTION 'Ausentes os dois lançamentos automáticos'; END IF;

   fase:='preflight';
   r:=obrix_seg_hml_20261116.obrix_excluir_empresa_dados_v1(e1,u1,true);
   IF r->>'ok'<>'true' OR r->>'simulacao'<>'true' THEN
      RAISE EXCEPTION 'Preflight não confirmado %',r;
   END IF;
   IF NOT EXISTS(SELECT 1 FROM obrix_operacional_lab.empresas WHERE id=e1)
     OR (SELECT count(*) FROM obrix_operacional_lab.financeiro WHERE empresa_id=e1)<>before_count
     OR NOT EXISTS(SELECT 1 FROM obrix_operacional_lab.pagamentos_equipe WHERE id=pg1)
   THEN RAISE EXCEPTION 'Prévia alterou dados: rollback falhou'; END IF;
   res:=res||jsonb_build_object('preflight_transacional_reverte_dados',true);

   fase:='excluir empresa';
   r:=obrix_seg_hml_20261116.obrix_excluir_empresa_dados_v1(e1,u1,false);
   IF r->>'ok'<>'true' OR r->>'simulacao'<>'false'
     OR EXISTS(SELECT 1 FROM obrix_operacional_lab.empresas WHERE id=e1)
     OR EXISTS(SELECT 1 FROM obrix_operacional_lab.financeiro WHERE empresa_id=e1)
     OR EXISTS(SELECT 1 FROM obrix_operacional_lab.pagamentos_equipe WHERE empresa_id=e1)
     OR EXISTS(SELECT 1 FROM obrix_operacional_lab.perfis WHERE empresa_id=e1)
   THEN RAISE EXCEPTION 'Empresa de teste não foi removida de forma íntegra: %',r; END IF;
   res:=res||jsonb_build_object('exclusao_empresa_transacional_concluida',true);

   IF NOT EXISTS(SELECT 1 FROM obrix_operacional_lab.empresas WHERE id=e2)
     OR NOT EXISTS(SELECT 1 FROM obrix_operacional_lab.financeiro WHERE id=fin2 AND pagamento_equipe_id=pg2)
     OR NOT EXISTS(SELECT 1 FROM obrix_operacional_lab.perfis WHERE id=u2)
   THEN RAISE EXCEPTION 'Registros da empresa 2 afetados'; END IF;
   res:=res||jsonb_build_object('outra_empresa_intacta',true);

   IF EXISTS(SELECT 1 FROM obrix_exclusao_hml_20261116.contexto WHERE empresa_id=e1)
   THEN RAISE EXCEPTION 'Contexto de exclusão deixou registro ativo'; END IF;
   res:=res||jsonb_build_object('contexto_transacional_limpo',true);

   PERFORM set_config('request.jwt.claim.sub',u2::text,true);
   BEGIN
     DELETE FROM obrix_operacional_lab.financeiro WHERE id=fin2 AND empresa_id=e2;
   EXCEPTION WHEN OTHERS THEN
     after_block:=SQLERRM ILIKE '%Este lançamento foi gerado por um pagamento%';
   END;
   IF NOT after_block THEN RAISE EXCEPTION 'Proteção de outra empresa enfraqueceu após exclusão'; END IF;
   res:=res||jsonb_build_object('protecao_financeira_outra_empresa_mantida',true);
   -- Additional false-positive proof: manual records are unaffected.
   IF (SELECT count(*) FROM obrix_operacional_lab.financeiro WHERE empresa_id=e2)<>2
   THEN RAISE EXCEPTION 'Registro de outra empresa alterado'; END IF;
   res:=res||jsonb_build_object('registro_manual_outra_empresa_preservado',true);

   -- Revert the entire fixture run, leaving audit project clean.
   RAISE EXCEPTION 'OBRIX_HML_EXCLUSAO_FIXTURES_REVERTIDAS';
 EXCEPTION WHEN OTHERS THEN
   IF SQLERRM <> 'OBRIX_HML_EXCLUSAO_FIXTURES_REVERTIDAS' THEN
     res:=res||jsonb_build_object('erro_inesperado',left(SQLERRM,500),'sqlstate',SQLSTATE,'fase',fase);
   END IF;
 END;
 PERFORM set_config('request.jwt.claim.sub',coalesce(original_claim,''),true);
 RETURN res||jsonb_build_object('fixtures_revertidas',true);
END;
$function$;

REVOKE ALL ON FUNCTION obrix_exclusao_hml_20261116.apagar_empresa(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION obrix_seg_hml_20261116.obrix_excluir_empresa_dados_v1(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION obrix_seg_hml_20261116.obrix_excluir_empresa_dados_v1(uuid,uuid,boolean) TO service_role;
REVOKE ALL ON FUNCTION obrix_seg_hml_20261116.executar_testes_exclusao_v1() FROM PUBLIC,anon,authenticated;
COMMIT;
