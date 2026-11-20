-- OBRIX HML — corrigir saida offline sem conceder UPDATE direto no saldo.
-- Usar somente no projeto restauracao isolada xavwkfgrnowmusbkbiea.
CREATE OR REPLACE FUNCTION public.obrix_registrar_saida_estoque_offline(
 p_movimento_id uuid,
 p_material_id uuid,
 p_estoque_id uuid,
 p_quantidade numeric,
 p_obra_id uuid,
 p_data date DEFAULT NULL::date,
 p_documento text DEFAULT NULL::text,
 p_observacoes text DEFAULT NULL::text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
 v_empresa_id uuid := public.obrix_empresa_atual();
 v_uid uuid := (SELECT auth.uid());
 v_papel text;
 v_original public.estoque_movimentacoes%rowtype;
 v_saldo numeric;
 v_custo numeric;
 v_material_nome text;
 v_valor numeric;
 v_documento text := nullif(trim(p_documento),'');
 v_observacoes text := nullif(trim(p_observacoes),'');
 v_data date := coalesce(p_data,current_date);
BEGIN
 IF v_empresa_id IS NULL OR v_uid IS NULL THEN
   RAISE EXCEPTION 'Usuário ou empresa não autenticados.';
 END IF;
 SELECT p.papel INTO v_papel
 FROM public.perfis p
 WHERE p.id=v_uid AND p.empresa_id=v_empresa_id;
 IF v_papel NOT IN ('proprietario','administrador') OR v_papel IS NULL THEN
   RAISE EXCEPTION 'Operação restrita ao responsável pela empresa.';
 END IF;
 IF NOT public.obrix_acesso_total(v_empresa_id) THEN
   RAISE EXCEPTION 'Assinatura sem acesso total. Operação de estoque indisponível.';
 END IF;
 IF p_movimento_id IS NULL OR p_material_id IS NULL OR
    p_estoque_id IS NULL OR p_obra_id IS NULL THEN
   RAISE EXCEPTION 'Movimentação, material, estoque e obra são obrigatórios.';
 END IF;
 IF p_quantidade IS NULL OR p_quantidade<=0 THEN
   RAISE EXCEPTION 'Quantidade deve ser maior que zero.';
 END IF;

 -- A mesma operação, até em requisições simultâneas, precisa ter a
 -- mesma identidade. A serialização impede duas retiradas para o mesmo UUID.
 PERFORM pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended('obrix-hml-saida-offline:'||p_movimento_id::text,0)
 );
 SELECT * INTO v_original FROM public.estoque_movimentacoes
  WHERE id=p_movimento_id FOR UPDATE;
 IF FOUND THEN
   IF v_original.empresa_id IS DISTINCT FROM v_empresa_id OR
      v_original.tipo IS DISTINCT FROM 'saida' OR
      v_original.estoque_origem_id IS DISTINCT FROM p_estoque_id OR
      v_original.material_id IS DISTINCT FROM p_material_id OR
      v_original.obra_id IS DISTINCT FROM p_obra_id OR
      v_original.quantidade IS DISTINCT FROM p_quantidade OR
      v_original.data IS DISTINCT FROM v_data OR
      v_original.documento IS DISTINCT FROM v_documento OR
      v_original.observacoes IS DISTINCT FROM v_observacoes
   THEN
     RAISE EXCEPTION 'Identificador reutilizado com dados diferentes.';
   END IF;
   IF NOT EXISTS (
      SELECT 1 FROM public.financeiro f
       WHERE f.empresa_id=v_empresa_id
         AND f.estoque_movimentacao_id=p_movimento_id
         AND f.origem='estoque' AND f.status_lancamento='ativo'
   ) THEN
     RAISE EXCEPTION 'Movimentação pré-existente sem despesa ativa correspondente.';
   END IF;
   RETURN p_movimento_id;
 END IF;

 SELECT coalesce(m.custo_medio,0),m.nome INTO v_custo,v_material_nome
  FROM public.materiais m
  WHERE m.id=p_material_id AND m.empresa_id=v_empresa_id AND m.ativo=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Material ativo não encontrado.'; END IF;
 SELECT 1 INTO STRICT v_saldo FROM public.estoques e
  WHERE e.id=p_estoque_id AND e.empresa_id=v_empresa_id AND e.ativo=true;
 -- A checagem anterior falha se o estoque não pertencer à empresa.
 IF NOT EXISTS (
  SELECT 1 FROM public.obras o
  WHERE o.id=p_obra_id AND o.empresa_id=v_empresa_id
 ) THEN RAISE EXCEPTION 'Obra de destino inválida para esta empresa.'; END IF;

 SELECT s.quantidade INTO v_saldo FROM public.estoque_saldos s
  WHERE s.empresa_id=v_empresa_id
    AND s.estoque_id=p_estoque_id AND s.material_id=p_material_id
  FOR UPDATE;
 IF v_saldo IS NULL THEN RAISE EXCEPTION 'Saldo não encontrado.'; END IF;
 IF v_saldo<p_quantidade THEN RAISE EXCEPTION 'Saldo insuficiente.'; END IF;
 v_valor:=p_quantidade*v_custo;
 IF v_valor<=0 THEN
   RAISE EXCEPTION 'Material sem custo médio válido para lançar despesa.';
 END IF;

 UPDATE public.estoque_saldos s
 SET quantidade=s.quantidade-p_quantidade,atualizado_em=now()
 WHERE s.empresa_id=v_empresa_id
   AND s.estoque_id=p_estoque_id AND s.material_id=p_material_id
   AND s.quantidade>=p_quantidade;
 IF NOT FOUND THEN RAISE EXCEPTION 'Saldo foi alterado. Recarregue o estoque.'; END IF;

 INSERT INTO public.estoque_movimentacoes(
  id,empresa_id,material_id,estoque_origem_id,obra_id,tipo,
  quantidade,custo_unitario,valor_total,data,documento,observacoes
 ) VALUES (
  p_movimento_id,v_empresa_id,p_material_id,p_estoque_id,p_obra_id,'saida',
  p_quantidade,v_custo,v_valor,v_data,v_documento,v_observacoes
 );

 INSERT INTO public.financeiro(
  empresa_id,obra_id,tipo,categoria,descricao,valor,data,origem,
  observacoes,status_lancamento,estoque_movimentacao_id
 ) VALUES (
  v_empresa_id,p_obra_id,'despesa','material',
  'Saída de estoque - '||coalesce(v_material_nome,'Material'),
  v_valor,v_data,'estoque',
  'Movimentação automática do estoque: '||p_movimento_id::text||
    CASE WHEN v_observacoes IS NULL THEN '' ELSE ' | '||v_observacoes END,
  'ativo',p_movimento_id
 );
 RETURN p_movimento_id;
END;
$function$;
REVOKE ALL ON FUNCTION public.obrix_registrar_saida_estoque_offline(
 uuid,uuid,uuid,numeric,uuid,date,text,text
) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.obrix_registrar_saida_estoque_offline(
 uuid,uuid,uuid,numeric,uuid,date,text,text
) TO authenticated;
COMMENT ON FUNCTION public.obrix_registrar_saida_estoque_offline(
 uuid,uuid,uuid,numeric,uuid,date,text,text
) IS 'HML: saida offline com assinatura vigente, autorizacao administrativa, UUID idempotente e saldo atualizado em transacao atomica.';
