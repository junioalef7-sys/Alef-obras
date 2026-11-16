-- SQL de regressão: executar SOMENTE no Supabase AUDITORIA (schema privado).
-- Nenhum dado persistente; BEGIN/ROLLBACK e identificadores fictícios.
BEGIN;
DO $safe$
BEGIN
 IF to_regnamespace('obrix_exclusao_hml_20261116') IS NULL
    OR to_regnamespace('obrix_operacional_lab') IS NULL
 THEN RAISE EXCEPTION 'REJEITADO: banco não é laboratório OBRIX'; END IF;
END $safe$;
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
 IF v_empresa IS NULL THEN
   -- Perfis em cadastro inicial e notificações globais podem não ter empresa.
   -- Ao vincular posteriormente a uma empresa, respeitar o bloqueio da exclusão.
   IF v_destino IS NULL THEN
     RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
   END IF;
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_destino::text,8102026));
   IF EXISTS(SELECT 1 FROM obrix_exclusao_hml_20261116.solicitacoes
      WHERE empresa_id=v_destino) THEN
     RAISE EXCEPTION 'Empresa de destino em exclusão. Gravação bloqueada.'
       USING ERRCODE='42501';
   END IF;
   RETURN NEW;
 END IF;
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
$function$
;
CREATE TEMP TABLE obrix_nullable_regressao(
 id uuid PRIMARY KEY,
 empresa_id uuid NULL,
 conteudo text
) ON COMMIT DROP;
CREATE TRIGGER obrix_hml_bloquear_gravacoes_exclusao
BEFORE INSERT OR UPDATE OR DELETE ON obrix_nullable_regressao
FOR EACH ROW EXECUTE FUNCTION obrix_exclusao_hml_20261116.bloquear_gravacoes_empresa();
DO $check$
DECLARE
 e1 uuid:=gen_random_uuid();
 e2 uuid:=gen_random_uuid();
 u1 uuid:=gen_random_uuid();
 n1 uuid:=gen_random_uuid();
 blocked boolean:=false;
BEGIN
 INSERT INTO obrix_operacional_lab.empresas(id) VALUES(e1),(e2);
 INSERT INTO obrix_operacional_lab.perfis(id,empresa_id,papel)
 VALUES(u1,e1,'proprietario');
 INSERT INTO obrix_nullable_regressao(id,empresa_id,conteudo) VALUES(n1,NULL,'perfil novo');
 UPDATE obrix_nullable_regressao SET conteudo='notificação global' WHERE id=n1;
 UPDATE obrix_nullable_regressao SET empresa_id=e2 WHERE id=n1;
 UPDATE obrix_nullable_regressao SET empresa_id=NULL WHERE id=n1;
 PERFORM set_config('request.jwt.claim.sub',u1::text,true);
 PERFORM obrix_seg_hml_20261116.obrix_reservar_exclusao_v1(e1,u1);

 BEGIN
  UPDATE obrix_nullable_regressao SET empresa_id=e1 WHERE id=n1;
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'ERRO: vínculo com empresa em exclusão permitido'; END IF;
 blocked:=false;
 BEGIN
  INSERT INTO obrix_nullable_regressao(id,empresa_id,conteudo)
  VALUES(gen_random_uuid(),e1,'inserção indevida');
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'ERRO: insert durante exclusão permitido'; END IF;
 INSERT INTO obrix_nullable_regressao(id,empresa_id,conteudo)
 VALUES(gen_random_uuid(),NULL,'sem empresa');
 UPDATE obrix_nullable_regressao SET conteudo='atualizado' WHERE id=n1;
 DELETE FROM obrix_nullable_regressao WHERE id=n1;
 IF (SELECT count(*) FROM obrix_nullable_regressao WHERE empresa_id=e1)<>0
 THEN RAISE EXCEPTION 'ERRO: registros ilegais permaneceram'; END IF;
END $check$;
ROLLBACK;
SELECT 'OBRIX_REGRESSAO_EMPRESA_NULA_OK' AS resultado;
