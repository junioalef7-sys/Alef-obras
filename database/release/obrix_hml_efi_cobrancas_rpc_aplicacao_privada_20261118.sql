-- Exclusivo da homologação OBRIX 18/11/2026; projeto xavwkfgrnowmusbkbiea.
-- Rotinas de cobrança SIMULADA disponíveis apenas para service_role.
CREATE OR REPLACE FUNCTION public.obrix_hml_aplicar_pagamento_assinatura(p_pagamento_id uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $fn$
 SELECT private.obrix_aplicar_pagamento_assinatura_hml_ensaio(p_pagamento_id);
$fn$;
CREATE OR REPLACE FUNCTION public.obrix_hml_reverter_pagamento_assinatura(
 p_pagamento_id uuid, p_motivo text DEFAULT NULL
)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path TO ''
AS $fn$
 SELECT private.obrix_reverter_pagamento_assinatura_hml_ensaio(p_pagamento_id,p_motivo);
$fn$;
REVOKE ALL ON FUNCTION public.obrix_hml_aplicar_pagamento_assinatura(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.obrix_hml_reverter_pagamento_assinatura(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_aplicar_pagamento_assinatura(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.obrix_hml_reverter_pagamento_assinatura(uuid,text) TO service_role;
