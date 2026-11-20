-- OBRIX: Protecao do Storage durante plano limitado - SOMENTE HML
-- Proyecto isolado xavwkfgrnowmusbkbiea. Nao aplicar ao oficial.
-- Preserva SELECT de arquivos antigos. Nao aumenta permissoes existentes.
-- Formatos existentes:
-- <empresa>/<obra>/<arquivo> em documentos, fotos, relatorio fotografico
-- <empresa>/capas/<obra>/<arquivo> em capas de obra.
CREATE OR REPLACE FUNCTION public.obrix_hml_storage_pode_escrever(
 p_bucket text,
 p_caminho text,
 p_exclusao boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO ''
AS $body$
 SELECT CASE
  WHEN p_bucket IS NULL THEN false
  WHEN p_bucket NOT IN ('obrix-documentos','obrix-fotos','relatorio-fotografico') THEN true
  -- A politica permissiva existente ainda exige que o caminho seja da empresa.
  WHEN public.obrix_acesso_total((SELECT public.obrix_empresa_atual())) THEN true
  -- Preservar arquivos historicos durante o periodo gratuito limitado.
  WHEN p_exclusao THEN false
  WHEN split_part(p_caminho,'/',1) IS DISTINCT FROM
       (SELECT public.obrix_empresa_atual())::text THEN false
  ELSE public.obrix_hml_pode_operar_registro(
    (SELECT public.obrix_empresa_atual()),
    CASE
      WHEN (CASE WHEN p_bucket='obrix-fotos' AND split_part(p_caminho,'/',2)='capas'
           THEN split_part(p_caminho,'/',3) ELSE split_part(p_caminho,'/',2) END)
           ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN (CASE WHEN p_bucket='obrix-fotos' AND split_part(p_caminho,'/',2)='capas'
           THEN split_part(p_caminho,'/',3) ELSE split_part(p_caminho,'/',2) END)::uuid
      ELSE NULL::uuid
    END,
    NULL::uuid,false,false
  )
 END;
$body$;

REVOKE ALL ON FUNCTION public.obrix_hml_storage_pode_escrever(text,text,boolean)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_storage_pode_escrever(text,text,boolean)
 TO authenticated;
COMMENT ON FUNCTION public.obrix_hml_storage_pode_escrever(text,text,boolean)
 IS 'HML: restringe INSERT/UPDATE do Storage a obra escolhida apos trial. Bloqueia DELETE, preserva SELECT.';

-- RESTRICTIVE garante AND com as politicas originais, nao substitui a
-- verificacao existente de pasta da empresa e de usuario autenticado.
CREATE POLICY obrix_hml_storage_insercao_limitada
 ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK (public.obrix_hml_storage_pode_escrever(bucket_id,name,false));

CREATE POLICY obrix_hml_storage_atualizacao_limitada
 ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
 USING (public.obrix_hml_storage_pode_escrever(bucket_id,name,false))
 WITH CHECK (public.obrix_hml_storage_pode_escrever(bucket_id,name,false));

CREATE POLICY obrix_hml_storage_exclusao_limitada
 ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
 USING (public.obrix_hml_storage_pode_escrever(bucket_id,name,true));
