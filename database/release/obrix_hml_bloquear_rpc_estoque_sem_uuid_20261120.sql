-- SOMENTE Supabase HML xavwkfgrnowmusbkbiea.
-- A API online legada gera UUID novo a cada pedido e pode duplicar saldo/despesa.
-- A UI de teste agora chama obrix_registrar_saida_estoque_offline com UUID estavel.
-- Falha fechada para clientes autenticados ainda com JS antigo em cache.
REVOKE ALL ON FUNCTION public.obrix_registrar_saida_estoque(
 uuid,uuid,numeric,date,text,text,uuid
) FROM PUBLIC,anon,authenticated;
COMMENT ON FUNCTION public.obrix_registrar_saida_estoque(
 uuid,uuid,numeric,date,text,text,uuid
) IS 'HML: acesso do cliente revogado por nao suportar chave de idempotencia; usar obrix_registrar_saida_estoque_offline com UUID fixo.';
