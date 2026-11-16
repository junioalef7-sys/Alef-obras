-- OBRIX: fixture de homologação RESTRITA A BANCO NOVO, SEM DADOS REAIS.
-- Uso: sessão SQL de uma branch nova, com backend já migrado, executar:
-- SET obrix.allow_test_fixture = 'homologacao-ficticia-20261116';
-- Depois executar este script nesta MESMA conexão.
-- NUNCA aplicar em produção ou no laboratório de auditoria com dados existentes.
BEGIN;
DO $guard$
BEGIN
 IF coalesce(current_setting('obrix.allow_test_fixture',true),'')<>
   'homologacao-ficticia-20261116' THEN
   RAISE EXCEPTION 'OBRIX_HML_FIXTURE_BLOCKED: falta aprovação de ambiente isolado';
 END IF;
 IF to_regprocedure('public.obrix_pagar_equipe_transacional_v2(uuid,date,uuid[],uuid[],uuid[],uuid,numeric)') IS NULL
   OR to_regnamespace('obrix_conta_interna') IS NULL
   OR to_regclass('public.empresas') IS NULL THEN
   RAISE EXCEPTION 'OBRIX_HML_FIXTURE_BLOCKED: backend de homologação incompleto';
 END IF;
 IF EXISTS(SELECT 1 FROM auth.users)
   OR EXISTS(SELECT 1 FROM public.empresas)
   OR EXISTS(SELECT 1 FROM storage.objects)
   OR EXISTS(SELECT 1 FROM storage.buckets WHERE id LIKE 'obrix-hml-fixture-%')
 THEN
   RAISE EXCEPTION 'OBRIX_HML_FIXTURE_BLOCKED: banco contém dados, não executar';
 END IF;
END $guard$;

CREATE TABLE obrix_conta_interna.obrix_hml_once(
 nome text PRIMARY KEY,
 criado_em timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON obrix_conta_interna.obrix_hml_once FROM PUBLIC,anon,authenticated;
ALTER TABLE obrix_conta_interna.obrix_hml_once ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.obrix_hml_claim_once_v1()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $fn$
DECLARE linhas integer;
BEGIN
 INSERT INTO obrix_conta_interna.obrix_hml_once(nome)
 VALUES('hml-full-e2e')
 ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS linhas=ROW_COUNT;
 RETURN linhas=1;
END;
$fn$;

REVOKE ALL ON FUNCTION public.obrix_hml_claim_once_v1() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_claim_once_v1() TO service_role;
COMMIT;

-- Após o teste, não usar RESET no oficial.
-- Apagar a branch inteira e conferir ausência em list_branches;
-- a função temporária não deve ficar exposta em projeto permanente.
