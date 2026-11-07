-- OBRIX | Ensaio restrito de restauração transacional nas 32 tabelas estruturais.
-- ATENÇÃO: SQL projetado EXCLUSIVAMENTE para o banco de AUDITORIA.
-- Não executar no projeto oficial.
-- Pré-requisitos: obrix_operacional_lab reproduzido por introspecção da estrutura
-- de public na produção e obrix_restore_lab preenchido com backups verificados.
-- Replica nomes, tipos e restrições, mas não reproduz todos os triggers e funções
-- operacionais nem os arquivos binários do Supabase Storage.
-- Função bloqueada para anon/authenticated; somente operação administrativa.
CREATE OR REPLACE FUNCTION obrix_operacional_lab.restaurar_lote_tabelas(p_lote uuid, p_falha_simulada boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
 v_empresa uuid;
 v_declarados integer;
 v_recebidos integer;
 v_problemas integer;
 v_modulo text;
 v_linhas jsonb;
 v_colunas text;
 v_selecao text;
 v_atualizacoes text;
 v_sql text;
 v_processados integer := 0;
 v_real_total integer := 0;
 v_esperados integer;
 v_real integer;
BEGIN
 SELECT empresa_origem, registros_declarados INTO v_empresa,v_declarados
 FROM obrix_restore_lab.lotes
 WHERE id=p_lote AND tipo='dados' FOR UPDATE;
 IF v_empresa IS NULL OR v_declarados IS NULL THEN RAISE EXCEPTION 'Lote inexistente'; END IF;

 SELECT COUNT(*) INTO v_recebidos FROM obrix_restore_lab.registros WHERE lote_id=p_lote;
 IF v_recebidos <> v_declarados THEN RAISE EXCEPTION 'Lote incompleto: %/%',v_recebidos,v_declarados; END IF;
 SELECT COUNT(*) INTO v_problemas FROM obrix_restore_lab.registros r WHERE r.lote_id=p_lote AND (
 r.empresa_origem IS DISTINCT FROM v_empresa OR
 r.conteudo->>'empresa_id' IS DISTINCT FROM v_empresa::text OR
 r.conteudo->>'id' IS DISTINCT FROM r.registro_id::text OR
 to_regclass('obrix_operacional_lab.'||r.modulo) IS NULL
 );
 IF v_problemas > 0 THEN RAISE EXCEPTION 'Registros inválidos: %',v_problemas; END IF;

 FOR v_modulo IN SELECT DISTINCT modulo FROM obrix_restore_lab.registros
   WHERE lote_id=p_lote ORDER BY modulo LOOP
  SELECT jsonb_agg(conteudo ORDER BY registro_id),COUNT(*) INTO v_linhas,v_esperados
  FROM obrix_restore_lab.registros
  WHERE lote_id=p_lote AND modulo=v_modulo;

  SELECT string_agg(format('%I',attname),', ' ORDER BY attnum),
         string_agg(format('j.%I',attname),', ' ORDER BY attnum),
         string_agg(format('%1$I=EXCLUDED.%1$I',attname),', ' ORDER BY attnum)
  INTO v_colunas,v_selecao,v_atualizacoes
  FROM pg_catalog.pg_attribute
  WHERE attrelid=format('obrix_operacional_lab.%I',v_modulo)::regclass
    AND attnum>0 AND NOT attisdropped AND attgenerated = '';

  v_sql:=format('INSERT INTO obrix_operacional_lab.%I (%s) SELECT %s FROM jsonb_populate_recordset(NULL::obrix_operacional_lab.%I, $1) j ON CONFLICT (id) DO UPDATE SET %s',
  v_modulo,v_colunas,v_selecao,v_modulo,v_atualizacoes);
  EXECUTE v_sql USING v_linhas;
  GET DIAGNOSTICS v_real=ROW_COUNT;
  IF v_real <> v_esperados THEN RAISE EXCEPTION 'Gravação divergente %: %/%',v_modulo,v_real,v_esperados; END IF;
  v_processados:=v_processados+v_real;
 END LOOP;

 IF p_falha_simulada THEN RAISE EXCEPTION 'FALHA_CONTROLADA_POS_GRAVACAO_OPERACIONAL: rollback'; END IF;
 SET CONSTRAINTS ALL IMMEDIATE;

 FOR v_modulo IN SELECT DISTINCT modulo FROM obrix_restore_lab.registros
 WHERE lote_id=p_lote ORDER BY modulo LOOP
  EXECUTE format('SELECT COUNT(*) FROM obrix_operacional_lab.%I WHERE empresa_id = $1',v_modulo)
  INTO v_real USING v_empresa;
  SELECT COUNT(*) INTO v_esperados FROM obrix_restore_lab.registros WHERE lote_id=p_lote AND modulo=v_modulo;
  IF v_real<>v_esperados THEN RAISE EXCEPTION 'Conferência % falhou: %/%',v_modulo,v_real,v_esperados; END IF;
  v_real_total:=v_real_total+v_real;
 END LOOP;
 IF v_processados<>v_declarados OR v_real_total<>v_declarados THEN
  RAISE EXCEPTION 'Resultado incompleto: %/%',v_real_total,v_declarados;
 END IF;
 RETURN jsonb_build_object('ok',true,'esquema','obrix_operacional_lab','empresa',v_empresa,'registros',v_real_total,'transacional',true);
END;
$function$

REVOKE ALL ON FUNCTION obrix_operacional_lab.restaurar_lote_tabelas(uuid,boolean) FROM PUBLIC, anon, authenticated;

-- Com p_falha_simulada=true, a função deve emitir FALHA_CONTROLADA_POS_GRAVACAO_OPERACIONAL,
-- revertendo integralmente a transação.
-- Com false, importa uma conta por transação após validar integridade e chaves.
