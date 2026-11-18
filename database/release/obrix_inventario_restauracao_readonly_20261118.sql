-- OBRIX | Inventário antes e depois da restauração
-- 18/11/2026 - leitura apenas, sem dados individuais, credenciais ou caminhos.
-- Execute separadamente no banco original e no clone restaurado.
-- Compare tabelas, quantidade de linhas e inventário de arquivos.
-- Atenção: a comparação de contagens NÃO prova a integridade binária dos
-- arquivos; verificar o download/abertura e, quando houver, hashes externos.
BEGIN READ ONLY;

DO $obrix$
DECLARE t record;
  n bigint;
  counts jsonb := '{}'::jsonb;
BEGIN
  FOR t IN SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' ORDER BY tablename LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', t.tablename) INTO n;
    counts := counts || jsonb_build_object(t.tablename,n);
  END LOOP;
  PERFORM pg_catalog.set_config('obrix.inventory.table_counts',counts::text,true);
END
$obrix$;

SELECT
  'banco_publico' AS conjunto,
  current_setting('obrix.inventory.table_counts')::jsonb AS contagens,
  (SELECT COUNT(*) FROM auth.users) AS quantidade_auth,
  (SELECT COUNT(*) FROM public.empresas) AS quantidade_empresas;

SELECT
  b.id AS bucket,
  b.public AS acesso_publico,
  COUNT(o.id) AS objetos,
  COALESCE(SUM((o.metadata->>'size')::bigint),0) AS bytes_metadata,
  COUNT(o.id) FILTER (
    WHERE EXISTS(
      SELECT 1 FROM public.empresas e
      WHERE e.id::text=split_part(o.name,'/',1)
    )
  ) AS arquivos_prefixo_empresa_existente,
  COUNT(o.id) FILTER (
    WHERE NOT EXISTS(
      SELECT 1 FROM public.empresas e
      WHERE e.id::text=split_part(o.name,'/',1)
    )
  ) AS arquivos_prefixo_nao_reconhecido
FROM storage.buckets b
LEFT JOIN storage.objects o ON o.bucket_id=b.id
GROUP BY b.id,b.public
ORDER BY b.id;

SELECT 
  count(*) AS tabelas_publicas,
  count(*) FILTER (WHERE c.relrowsecurity) AS tabelas_com_rls,
  md5(string_agg(
    c.relname||':'||
    coalesce((
      SELECT md5(string_agg(
         col.attname||':'||format_type(col.atttypid,col.atttypmod)||':'||
         col.attnotnull::text,',' ORDER BY col.attnum))
      FROM pg_attribute col
      WHERE col.attrelid=c.oid AND col.attnum>0 AND NOT col.attisdropped
    ),''),
    ';' ORDER BY c.relname)) AS assinatura_estrutura_colunas
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p');

ROLLBACK;

-- Pontos externos obrigatórios:
-- 1. Restaurar banco e confirmar estrutura/FKs/trigger/RLS.
-- 2. Repor os objetos binários do Storage; não copiar apenas storage.objects.
-- 3. Validar download de amostras de PDF, fotos e documentos e seus hashes.
-- 4. Validar autenticação e recuperação das contas num ambiente isolado.
-- 5. Não converter esta rotina de inventário em automação de produção.
