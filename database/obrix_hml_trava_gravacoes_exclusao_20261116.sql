-- OBRIX: EVIDÊNCIA DA HOMOLOGAÇÃO, NÃO EXECUTAR EM PRODUÇÃO.
-- Apenas banco de auditoria mjzlwnuklfopdmgcvdcs / schema obrix_operacional_lab.
-- GUARDA DELIBERADA impede aplicação direta e criação acidental de gatilhos.
BEGIN;
DO $security_guard$ BEGIN
 RAISE EXCEPTION 'OBRIX: script demonstrativo, não executar fora do laboratório';
END $security_guard$;

-- A migração efetiva está registrada no histórico do banco de auditoria.
CREATE OR REPLACE FUNCTION obrix_exclusao_hml_20261116.bloquear_gravacoes_empresa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_empresa uuid;
 v_destino uuid;
 v_etapa text;
 v_contexto_autorizado boolean := false;
BEGIN
 IF TG_TABLE_NAME='empresas' THEN
   IF TG_OP='INSERT' THEN v_empresa:=NEW.id;
   ELSE v_empresa:=OLD.id;
   END IF;
   IF TG_OP='UPDATE' THEN v_destino:=NEW.id; END IF;
 ELSE
   IF TG_OP='INSERT' THEN v_empresa:=NEW.empresa_id;
   ELSE v_empresa:=OLD.empresa_id;
   END IF;
   IF TG_OP='UPDATE' THEN v_destino:=NEW.empresa_id; END IF;
 END IF;
 IF v_empresa IS NULL THEN RAISE EXCEPTION 'Empresa obrigatória.'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_empresa::text,8102026));
 IF v_destino IS NOT NULL AND v_destino IS DISTINCT FROM v_empresa THEN
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_destino::text,8102026));
 END IF;
 SELECT EXISTS(
    SELECT 1 FROM obrix_exclusao_hml_20261116.contexto
    WHERE transacao=pg_catalog.txid_current() AND empresa_id=v_empresa
 ) INTO v_contexto_autorizado;
 IF v_contexto_autorizado THEN RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END; END IF;
 SELECT etapa INTO v_etapa
 FROM obrix_exclusao_hml_20261116.solicitacoes WHERE empresa_id=v_empresa;
 IF FOUND THEN
    RAISE EXCEPTION 'Empresa em exclusão (%). Nova gravação bloqueada.',v_etapa
      USING ERRCODE='42501';
 END IF;
 IF v_destino IS NOT NULL AND v_destino IS DISTINCT FROM v_empresa THEN
   SELECT etapa INTO v_etapa FROM obrix_exclusao_hml_20261116.solicitacoes
     WHERE empresa_id=v_destino;
   IF FOUND THEN RAISE EXCEPTION 'Empresa de destino em exclusão.'
       USING ERRCODE='42501'; END IF;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$function$;

REVOKE ALL ON FUNCTION obrix_exclusao_hml_20261116.bloquear_gravacoes_empresa()
FROM PUBLIC,anon,authenticated;

DO $install$
DECLARE tab record;
BEGIN
 FOR tab IN SELECT DISTINCT c.table_name
 FROM information_schema.columns c JOIN information_schema.tables t
 ON t.table_schema=c.table_schema AND t.table_name=c.table_name
 WHERE c.table_schema='obrix_operacional_lab' AND c.column_name='empresa_id'
 AND t.table_type='BASE TABLE'
 LOOP
 EXECUTE format(
  'CREATE TRIGGER obrix_hml_bloquear_gravacoes_exclusao BEFORE INSERT OR UPDATE OR DELETE ON obrix_operacional_lab.%I FOR EACH ROW EXECUTE FUNCTION obrix_exclusao_hml_20261116.bloquear_gravacoes_empresa()',
 tab.table_name);
 END LOOP;
END $install$;
CREATE TRIGGER obrix_hml_bloquear_gravacoes_exclusao
BEFORE UPDATE OR DELETE ON obrix_operacional_lab.empresas
FOR EACH ROW EXECUTE FUNCTION obrix_exclusao_hml_20261116.bloquear_gravacoes_empresa();

CREATE OR REPLACE FUNCTION obrix_seg_hml_20261116.executar_testes_exclusao_bloqueio_v1()
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
 invalid_step_block boolean := false;
 insert_block boolean := false;
 update_block boolean := false;
 delete_block boolean := false;
 other_allowed boolean := false;
 wrong_user_block boolean := false;
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

   fase:='reservar exclusao';
   r:=obrix_seg_hml_20261116.obrix_reservar_exclusao_v1(e1,u1);
   IF r->>'ok'<>'true' OR r->>'etapa'<>'preparado' OR r->>'retomada'<>'false' THEN
     RAISE EXCEPTION 'Reserva inicial inválida: %',r; END IF;
   r:=obrix_seg_hml_20261116.obrix_reservar_exclusao_v1(e1,u1);
   IF r->>'retomada'<>'true' OR r->>'etapa'<>'preparado'
     OR (SELECT count(*) FROM obrix_exclusao_hml_20261116.solicitacoes WHERE empresa_id=e1)<>1 THEN
     RAISE EXCEPTION 'Repetição de reserva não foi idempotente'; END IF;
   res:=res||jsonb_build_object('reserva_idempotente',true);

   -- Testes de bloqueio de escrita com o job ainda em 'preparado'.
   BEGIN
     INSERT INTO obrix_operacional_lab.obras(empresa_id,nome,status)
     VALUES(e1,'Obra criada indevidamente após exclusão','andamento');
   EXCEPTION WHEN insufficient_privilege THEN
     insert_block:=true;
   END;
   IF NOT insert_block THEN RAISE EXCEPTION 'INSERT de empresa em exclusão permitido'; END IF;
   BEGIN
     UPDATE obrix_operacional_lab.obras SET nome='Alterada durante exclusão' WHERE id=obra1;
   EXCEPTION WHEN insufficient_privilege THEN
     update_block:=true;
   END;
   IF NOT update_block THEN RAISE EXCEPTION 'UPDATE de empresa em exclusão permitido'; END IF;
   BEGIN
     DELETE FROM obrix_operacional_lab.obras WHERE id=obra1;
   EXCEPTION WHEN insufficient_privilege THEN
     delete_block:=true;
   END;
   IF NOT delete_block THEN RAISE EXCEPTION 'DELETE de empresa em exclusão permitido'; END IF;
   -- A empresa 2 não pode ser afetada pela solicitação da empresa 1.
   PERFORM set_config('request.jwt.claim.sub',u2::text,true);
   UPDATE obrix_operacional_lab.obras
     SET nome='HML - Outra empresa permanece editável' WHERE id=obra2;
   SELECT EXISTS(SELECT 1 FROM obrix_operacional_lab.obras
     WHERE id=obra2 AND nome='HML - Outra empresa permanece editável')
     INTO other_allowed;
   PERFORM set_config('request.jwt.claim.sub',u1::text,true);
   IF NOT other_allowed THEN RAISE EXCEPTION 'Outra empresa indevidamente bloqueada'; END IF;
   res:=res||jsonb_build_object(
      'insert_apos_reserva_bloqueado',insert_block,
      'update_apos_reserva_bloqueado',update_block,
      'delete_apos_reserva_bloqueado',delete_block,
      'outra_empresa_continua_editavel',other_allowed);


   BEGIN
     PERFORM obrix_seg_hml_20261116.obrix_reservar_exclusao_v1(e1,uextra);
   EXCEPTION WHEN OTHERS THEN
     wrong_user_block:=SQLERRM ILIKE '%outro usuário%';
   END;
   IF NOT wrong_user_block THEN RAISE EXCEPTION 'Outro usuário conseguiu recuperar reserva'; END IF;
   res:=res||jsonb_build_object('reserva_outro_usuario_rejeitada',true);

   BEGIN
     PERFORM obrix_seg_hml_20261116.obrix_avancar_exclusao_v1(e1,u1,'banco_concluido');
   EXCEPTION WHEN OTHERS THEN
     invalid_step_block:=SQLERRM ILIKE '%pular uma etapa%';
   END;
   IF NOT invalid_step_block THEN RAISE EXCEPTION 'Etapa de Storage foi pulada'; END IF;
   res:=res||jsonb_build_object('salto_de_etapas_rejeitado',true);

   -- Simulação do checkpoint da API Storage; nenhum arquivo real é acessado.
   r:=obrix_seg_hml_20261116.obrix_avancar_exclusao_v1(e1,u1,'storage_concluido');
   IF r->>'etapa'<>'storage_concluido' THEN
     RAISE EXCEPTION 'Storage não marcado como concluído'; END IF;
   r:=obrix_seg_hml_20261116.obrix_avancar_exclusao_v1(e1,u1,'storage_concluido');
   IF r->>'ja_aplicado'<>'true' THEN
     RAISE EXCEPTION 'Checkpoint Storage não idempotente'; END IF;
   IF NOT EXISTS(SELECT 1 FROM obrix_operacional_lab.empresas WHERE id=e1) THEN
     RAISE EXCEPTION 'Empresa removida antes de confirmar banco'; END IF;
   res:=res||jsonb_build_object('storage_checkpoint_idempotente',true);

   fase:='excluir empresa';
   r:=obrix_seg_hml_20261116.obrix_avancar_exclusao_v1(e1,u1,'banco_concluido');
   IF r->>'ok'<>'true' OR r->>'etapa'<>'banco_concluido'
     OR EXISTS(SELECT 1 FROM obrix_operacional_lab.empresas WHERE id=e1)
     OR EXISTS(SELECT 1 FROM obrix_operacional_lab.financeiro WHERE empresa_id=e1)
     OR EXISTS(SELECT 1 FROM obrix_operacional_lab.pagamentos_equipe WHERE empresa_id=e1)
     OR EXISTS(SELECT 1 FROM obrix_operacional_lab.perfis WHERE empresa_id=e1)
   THEN RAISE EXCEPTION 'Empresa de teste não foi removida de forma íntegra: %',r; END IF;
   res:=res||jsonb_build_object('exclusao_empresa_transacional_concluida',true);

   r:=obrix_seg_hml_20261116.obrix_avancar_exclusao_v1(e1,u1,'banco_concluido');
   IF r->>'ja_aplicado'<>'true' THEN
     RAISE EXCEPTION 'Banco repetido não é idempotente'; END IF;
   res:=res||jsonb_build_object('banco_checkpoint_idempotente',true);

   fase:='retomar após banco';
   r:=obrix_seg_hml_20261116.obrix_reservar_exclusao_v1(e1,u1);
   IF r->>'retomada'<>'true' OR r->>'etapa'<>'banco_concluido' THEN
     RAISE EXCEPTION 'Solicitação não persistiu após remoção'; END IF;
   res:=res||jsonb_build_object('solicitacao_persiste_apos_exclusao',true);

   -- Este checkpoint representa sucesso do Auth simulado; NÃO exclui auth.users.
   r:=obrix_seg_hml_20261116.obrix_avancar_exclusao_v1(e1,u1,'finalizado');
   IF r->>'etapa'<>'finalizado' THEN RAISE EXCEPTION 'Auth não finalizou'; END IF;
   r:=obrix_seg_hml_20261116.obrix_reservar_exclusao_v1(e1,u1);
   IF r->>'etapa'<>'finalizado' THEN RAISE EXCEPTION 'Finalização não persistiu'; END IF;
   res:=res||jsonb_build_object('auth_checkpoint_simulado',true);

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
REVOKE ALL ON FUNCTION obrix_seg_hml_20261116.executar_testes_exclusao_bloqueio_v1()
FROM PUBLIC,anon,authenticated;
COMMIT;
