-- OBRIX | Pagamento da equipe apos trial, com idempotencia, somente HML.
-- Executar EXCLUSIVAMENTE no Supabase restaurado xavwkfgrnowmusbkbiea.
-- Mantem as funcoes do plano pago e o oficial sem alteracoes.
CREATE TABLE IF NOT EXISTS private.obrix_hml_pagamento_equipe_requisicoes (
 empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
 request_id uuid NOT NULL,
 funcionario_id uuid NOT NULL REFERENCES public.funcionarios(id),
 obra_id uuid NOT NULL REFERENCES public.obras(id),
 payload jsonb NOT NULL,
 pagamento_id uuid NOT NULL UNIQUE REFERENCES public.pagamentos_equipe(id),
 criado_em timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (empresa_id,request_id)
);
ALTER TABLE private.obrix_hml_pagamento_equipe_requisicoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.obrix_hml_pagamento_equipe_requisicoes FROM PUBLIC,anon,authenticated;
COMMENT ON TABLE private.obrix_hml_pagamento_equipe_requisicoes IS
 'HML: requests idempotentes de pagamento no plano limitado, acesso somente por RPC segura.';

CREATE OR REPLACE FUNCTION public.obrix_hml_pagar_equipe_limitado(
 p_request_id uuid,
 p_funcionario_id uuid,
 p_obra_id uuid,
 p_data_pagamento date,
 p_diaria_ids uuid[],
 p_vale_ids uuid[],
 p_bonus_ids uuid[]
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE
 v_empresa uuid := public.obrix_empresa_atual();
 v_uid uuid := (SELECT auth.uid());
 v_papel text;
 v_diarias uuid[] := coalesce(p_diaria_ids,'{}'::uuid[]);
 v_vales uuid[] := coalesce(p_vale_ids,'{}'::uuid[]);
 v_bonus uuid[] := coalesce(p_bonus_ids,'{}'::uuid[]);
 v_payload jsonb;
 v_antigo private.obrix_hml_pagamento_equipe_requisicoes%ROWTYPE;
 v_pagamento_id uuid;
 v_nome text;
 v_count integer;
 v_total_d numeric := 0;
 v_total_v numeric := 0;
 v_total_b numeric := 0;
 v_bruto numeric;
 v_liquido numeric;
 v_rows integer;
BEGIN
 IF v_uid IS NULL OR v_empresa IS NULL OR p_request_id IS NULL
    OR p_funcionario_id IS NULL OR p_obra_id IS NULL
    OR p_data_pagamento IS NULL THEN
   RAISE EXCEPTION 'Usuário, empresa, funcionário, obra, data e operação são obrigatórios.';
 END IF;
 SELECT papel INTO v_papel FROM public.perfis
  WHERE id=v_uid AND empresa_id=v_empresa;
 IF coalesce(v_papel,'') NOT IN ('proprietario','administrador') THEN
   RAISE EXCEPTION 'Pagamento restrito ao proprietário ou administrador.';
 END IF;
 IF cardinality(v_diarias)>100 OR cardinality(v_vales)>100 OR
    cardinality(v_bonus)>100 OR
    cardinality(v_diarias)+cardinality(v_vales)+cardinality(v_bonus)=0 THEN
   RAISE EXCEPTION 'Selecione entre um e cem registros de cada categoria.';
 END IF;
 IF EXISTS (SELECT 1 FROM unnest(v_diarias) AS x(id) WHERE id IS NULL)
    OR EXISTS (SELECT 1 FROM unnest(v_vales) AS x(id) WHERE id IS NULL)
    OR EXISTS (SELECT 1 FROM unnest(v_bonus) AS x(id) WHERE id IS NULL)
    OR (SELECT count(*) FROM (SELECT DISTINCT id FROM unnest(v_diarias) AS x(id)) sub)<>cardinality(v_diarias)
    OR (SELECT count(*) FROM (SELECT DISTINCT id FROM unnest(v_vales) AS x(id)) sub)<>cardinality(v_vales)
    OR (SELECT count(*) FROM (SELECT DISTINCT id FROM unnest(v_bonus) AS x(id)) sub)<>cardinality(v_bonus)
 THEN
   RAISE EXCEPTION 'Seleção contém registros duplicados ou inválidos.';
 END IF;

 v_payload:=jsonb_build_object(
  'funcionario',p_funcionario_id,'obra',p_obra_id,
  'data',p_data_pagamento,
  'diarias',(SELECT coalesce(jsonb_agg(id ORDER BY id),'[]'::jsonb) FROM unnest(v_diarias) AS x(id)),
  'vales',(SELECT coalesce(jsonb_agg(id ORDER BY id),'[]'::jsonb) FROM unnest(v_vales) AS x(id)),
  'bonus',(SELECT coalesce(jsonb_agg(id ORDER BY id),'[]'::jsonb) FROM unnest(v_bonus) AS x(id))
 );

 -- Serializacao por empresa + UUID, inclusive se o cliente reenviar ao perder resposta.
 PERFORM pg_catalog.pg_advisory_xact_lock(
   pg_catalog.hashtextextended(
     'obrix-hml-equipe:'||v_empresa::text||':'||p_request_id::text,0)
 );
 SELECT * INTO v_antigo FROM private.obrix_hml_pagamento_equipe_requisicoes
 WHERE empresa_id=v_empresa AND request_id=p_request_id FOR UPDATE;
 IF FOUND THEN
   IF v_antigo.payload IS DISTINCT FROM v_payload THEN
     RAISE EXCEPTION 'Identificador de pagamento reutilizado com dados diferentes.';
   END IF;
   RETURN jsonb_build_object('ok',true,'ja_registrado',true,
     'pagamento_id',v_antigo.pagamento_id,
     'estornado',(SELECT estornado_em IS NOT NULL
       FROM public.pagamentos_equipe WHERE id=v_antigo.pagamento_id));
 END IF;

 -- Este endpoint existe apenas para plano vencido com selecao permanente.
 IF NOT public.obrix_hml_pode_operar_registro(
   v_empresa,p_obra_id,p_funcionario_id,true,false) THEN
   RAISE EXCEPTION 'Plano limitado: pagamento permitido somente para obra e funcionário escolhidos.';
 END IF;
 SELECT nome INTO v_nome FROM public.funcionarios
 WHERE id=p_funcionario_id AND empresa_id=v_empresa AND ativo=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Funcionário ativo não encontrado nesta empresa.'; END IF;

 PERFORM 1 FROM public.diarias d WHERE d.id=ANY(v_diarias)
 ORDER BY d.id FOR UPDATE;
 SELECT count(*),coalesce(sum(valor_total),0) INTO v_count,v_total_d
 FROM public.diarias d
 WHERE d.id=ANY(v_diarias) AND d.empresa_id=v_empresa
   AND d.funcionario_id=p_funcionario_id AND d.obra_id=p_obra_id
   AND d.paga=false AND d.cancelada_em IS NULL AND d.valor_total>0;
 IF v_count<>cardinality(v_diarias) THEN
   RAISE EXCEPTION 'Diária inválida, cancelada, paga ou pertencente a outra obra ou funcionário.';
 END IF;

 PERFORM 1 FROM public.vales v WHERE v.id=ANY(v_vales)
 ORDER BY v.id FOR UPDATE;
 SELECT count(*),coalesce(sum(valor),0) INTO v_count,v_total_v
 FROM public.vales v
 WHERE v.id=ANY(v_vales) AND v.empresa_id=v_empresa
   AND v.funcionario_id=p_funcionario_id AND v.obra_id=p_obra_id
   AND v.quitado=false AND v.estornado_em IS NULL AND v.valor>0;
 IF v_count<>cardinality(v_vales) THEN
   RAISE EXCEPTION 'Vale inválido, quitado, estornado ou pertencente a outra obra ou funcionário.';
 END IF;
 -- Vale nao pode diminuir o liquido se a despesa original nao estiver registrada.
 IF EXISTS(
    SELECT 1 FROM public.vales v
    WHERE v.id=ANY(v_vales)
      AND NOT EXISTS (
        SELECT 1 FROM public.financeiro fin
        WHERE fin.empresa_id=v_empresa AND fin.vale_id=v.id
          AND fin.origem='vale_equipe'
          AND fin.status_lancamento='ativo'
          AND fin.valor=v.valor AND fin.obra_id=p_obra_id
      )
 ) THEN RAISE EXCEPTION 'Vale sem despesa financeira original ativa. Regularize antes do pagamento.'; END IF;

 PERFORM 1 FROM public.bonus_extras b WHERE b.id=ANY(v_bonus)
 ORDER BY b.id FOR UPDATE;
 SELECT count(*),coalesce(sum(valor)) INTO v_count,v_total_b
 FROM public.bonus_extras b
 WHERE b.id=ANY(v_bonus) AND b.empresa_id=v_empresa
   AND b.funcionario_id=p_funcionario_id AND b.obra_id=p_obra_id
   AND b.pago=false AND b.valor>0;
 IF v_count<>cardinality(v_bonus) THEN
   RAISE EXCEPTION 'Bônus inválido, já pago ou pertencente a outra obra ou funcionário.';
 END IF;
 v_total_b:=coalesce(v_total_b,0);
 v_bruto:=v_total_d+v_total_b;
 v_liquido:=v_bruto-v_total_v;
 IF v_bruto<=0 OR v_liquido<0 THEN
   RAISE EXCEPTION 'Pagamento sem valor bruto ou líquido negativo. Revise os vales.';
 END IF;

 INSERT INTO public.pagamentos_equipe(
  empresa_id,funcionario_id,valor_diarias,valor_bonus_extras,valor_vales,
  valor_bruto,valor_liquido,data_pagamento,observacoes
 ) VALUES (
  v_empresa,p_funcionario_id,v_total_d,v_total_b,v_total_v,
  v_bruto,v_liquido,p_data_pagamento,
  'Plano limitado: liquidação atômica de uma obra'
 ) RETURNING id INTO v_pagamento_id;

 IF cardinality(v_diarias)>0 THEN
   INSERT INTO public.pagamento_diarias(
     empresa_id,pagamento_id,diaria_id,obra_id,valor
   ) SELECT v_empresa,v_pagamento_id,d.id,d.obra_id,d.valor_total
   FROM public.diarias d WHERE d.id=ANY(v_diarias);
   UPDATE public.diarias SET paga=true,pago_em=now()
   WHERE id=ANY(v_diarias) AND empresa_id=v_empresa
     AND obra_id=p_obra_id AND funcionario_id=p_funcionario_id AND paga=false;
   GET DIAGNOSTICS v_rows=ROW_COUNT;
   IF v_rows<>cardinality(v_diarias) THEN RAISE EXCEPTION 'Diárias foram alteradas durante o pagamento.'; END IF;
 END IF;

 IF cardinality(v_vales)>0 THEN
   INSERT INTO public.pagamento_vales(
     empresa_id,pagamento_id,vale_id,valor
   ) SELECT v_empresa,v_pagamento_id,v.id,v.valor
   FROM public.vales v WHERE v.id=ANY(v_vales);
   UPDATE public.vales SET quitado=true,quitado_em=now()
   WHERE id=ANY(v_vales) AND empresa_id=v_empresa
     AND obra_id=p_obra_id AND funcionario_id=p_funcionario_id AND quitado=false;
   GET DIAGNOSTICS v_rows=ROW_COUNT;
   IF v_rows<>cardinality(v_vales) THEN RAISE EXCEPTION 'Vales foram alterados durante o pagamento.'; END IF;
 END IF;

 IF cardinality(v_bonus)>0 THEN
   INSERT INTO public.pagamento_bonus_extras(
     empresa_id,pagamento_id,bonus_extra_id,valor
   ) SELECT v_empresa,v_pagamento_id,b.id,b.valor
   FROM public.bonus_extras b WHERE b.id=ANY(v_bonus);
   UPDATE public.bonus_extras SET pago=true,pago_em=now()
   WHERE id=ANY(v_bonus) AND empresa_id=v_empresa
     AND obra_id=p_obra_id AND funcionario_id=p_funcionario_id AND pago=false;
   GET DIAGNOSTICS v_rows=ROW_COUNT;
   IF v_rows<>cardinality(v_bonus) THEN RAISE EXCEPTION 'Bônus foram alterados durante o pagamento.'; END IF;
 END IF;

 -- Vales ja foram contabilizados como despesas na origem: registrar SO
 -- o liquido do pagamento, para nao contar novamente o adiantamento.
 IF v_liquido>0 THEN
   INSERT INTO public.financeiro(
    empresa_id,obra_id,tipo,categoria,descricao,valor,data,
    origem,pagamento_equipe_id,status_lancamento
   ) VALUES(
    v_empresa,p_obra_id,'despesa','mao_de_obra',
    'Pagamento equipe - '||v_nome,v_liquido,p_data_pagamento,
    'pagamento_equipe',v_pagamento_id,'ativo'
   );
 END IF;

 INSERT INTO private.obrix_hml_pagamento_equipe_requisicoes(
  empresa_id,request_id,funcionario_id,obra_id,payload,pagamento_id
 ) VALUES (v_empresa,p_request_id,p_funcionario_id,p_obra_id,v_payload,v_pagamento_id);
 RETURN jsonb_build_object(
   'ok',true,'ja_registrado',false,'pagamento_id',v_pagamento_id,
   'obra_id',p_obra_id,'funcionario_id',p_funcionario_id,
   'valor_bruto',v_bruto,'valor_vales',v_total_v,'valor_liquido',v_liquido,
   'estornado',false
 );
END;
$body$;

REVOKE ALL ON FUNCTION public.obrix_hml_pagar_equipe_limitado(
 uuid,uuid,uuid,date,uuid[],uuid[],uuid[]
) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_pagar_equipe_limitado(
 uuid,uuid,uuid,date,uuid[],uuid[],uuid[]
) TO authenticated;

CREATE OR REPLACE FUNCTION public.obrix_hml_estornar_equipe_limitado(
 p_pagamento_id uuid,p_motivo text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $body$
DECLARE
 v_empresa uuid:=public.obrix_empresa_atual();
 v_uid uuid:=(SELECT auth.uid());
 v_papel text;
 v_req private.obrix_hml_pagamento_equipe_requisicoes%ROWTYPE;
 v_pag public.pagamentos_equipe%ROWTYPE;
 v_diarias integer :=0;
 v_vales integer :=0;
 v_bonus integer :=0;
 v_financeiro integer :=0;
 v_count integer;
BEGIN
 IF v_uid IS NULL OR v_empresa IS NULL OR p_pagamento_id IS NULL THEN
   RAISE EXCEPTION 'Operação não autenticada.';
 END IF;
 SELECT papel INTO v_papel FROM public.perfis
 WHERE id=v_uid AND empresa_id=v_empresa;
 IF coalesce(v_papel,'') NOT IN ('proprietario','administrador') THEN
   RAISE EXCEPTION 'Estorno restrito ao proprietário ou administrador.';
 END IF;
 SELECT * INTO v_req FROM private.obrix_hml_pagamento_equipe_requisicoes
 WHERE empresa_id=v_empresa AND pagamento_id=p_pagamento_id
 FOR UPDATE;
 IF NOT FOUND THEN
   RAISE EXCEPTION 'Pagamento não foi originado pelo plano limitado.';
 END IF;
 IF NOT public.obrix_hml_pode_operar_registro(
   v_empresa,v_req.obra_id,v_req.funcionario_id,true,false
 ) THEN
   RAISE EXCEPTION 'Plano limitado: estorno fora da obra ou funcionário selecionado.';
 END IF;
 SELECT * INTO v_pag FROM public.pagamentos_equipe
 WHERE id=p_pagamento_id AND empresa_id=v_empresa
   AND funcionario_id=v_req.funcionario_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pagamento não encontrado nesta empresa.'; END IF;
 IF v_pag.estornado_em IS NOT NULL THEN
   RETURN jsonb_build_object('ok',true,'ja_estornado',true,'pagamento_id',p_pagamento_id);
 END IF;
 IF EXISTS(
    SELECT 1 FROM public.pagamento_diarias pd
      JOIN public.diarias d ON d.id=pd.diaria_id
     WHERE pd.pagamento_id=p_pagamento_id AND pd.ativo=true
       AND (pd.empresa_id<>v_empresa OR d.empresa_id<>v_empresa
         OR pd.obra_id<>v_req.obra_id OR d.obra_id<>v_req.obra_id
         OR d.funcionario_id<>v_req.funcionario_id)
 ) OR EXISTS(
    SELECT 1 FROM public.pagamento_vales pv
      JOIN public.vales v ON v.id=pv.vale_id
     WHERE pv.pagamento_id=p_pagamento_id AND pv.ativo=true
       AND (pv.empresa_id<>v_empresa OR v.empresa_id<>v_empresa
        OR v.obra_id IS DISTINCT FROM v_req.obra_id
        OR v.funcionario_id<>v_req.funcionario_id)
 ) OR EXISTS(
    SELECT 1 FROM public.pagamento_bonus_extras pb
      JOIN public.bonus_extras b ON b.id=pb.bonus_extra_id
     WHERE pb.pagamento_id=p_pagamento_id AND pb.ativo=true
       AND (pb.empresa_id<>v_empresa OR b.empresa_id<>v_empresa
        OR b.obra_id IS DISTINCT FROM v_req.obra_id
        OR b.funcionario_id<>v_req.funcionario_id)
 ) THEN RAISE EXCEPTION 'Vínculos do pagamento divergentes do plano limitado.'; END IF;

 UPDATE public.diarias d SET paga=false,pago_em=NULL
 WHERE d.empresa_id=v_empresa AND d.funcionario_id=v_req.funcionario_id
   AND d.obra_id=v_req.obra_id AND d.paga=true
   AND EXISTS(
     SELECT 1 FROM public.pagamento_diarias pd
      WHERE pd.pagamento_id=p_pagamento_id AND pd.diaria_id=d.id AND pd.ativo=true
   );
 GET DIAGNOSTICS v_diarias=ROW_COUNT;
 SELECT count(*) INTO v_count FROM public.pagamento_diarias
 WHERE pagamento_id=p_pagamento_id AND ativo=true;
 IF v_diarias<>v_count THEN RAISE EXCEPTION 'Diárias vinculadas ao pagamento foram alteradas.'; END IF;

 UPDATE public.vales v SET quitado=false,quitado_em=NULL
 WHERE v.empresa_id=v_empresa AND v.funcionario_id=v_req.funcionario_id
   AND v.obra_id=v_req.obra_id AND v.quitado=true
   AND EXISTS(
     SELECT 1 FROM public.pagamento_vales pv
      WHERE pv.pagamento_id=p_pagamento_id AND pv.vale_id=v.id AND pv.ativo=true
   );
 GET DIAGNOSTICS v_vales=ROW_COUNT;
 SELECT count(*) INTO v_count FROM public.pagamento_vales
 WHERE pagamento_id=p_pagamento_id AND ativo=true;
 IF v_vales<>v_count THEN RAISE EXCEPTION 'Vales vinculados ao pagamento foram alterados.'; END IF;

 UPDATE public.bonus_extras b SET pago=false,pago_em=NULL
 WHERE b.empresa_id=v_empresa AND b.funcionario_id=v_req.funcionario_id
   AND b.obra_id=v_req.obra_id AND b.pago=true
   AND EXISTS(
     SELECT 1 FROM public.pagamento_bonus_extras pb
      WHERE pb.pagamento_id=p_pagamento_id AND pb.bonus_extra_id=b.id AND pb.ativo=true
   );
 GET DIAGNOSTICS v_bonus=ROW_COUNT;
 SELECT count(*) INTO v_count FROM public.pagamento_bonus_extras
 WHERE pagamento_id=p_pagamento_id AND ativo=true;
 IF v_bonus<>v_count THEN RAISE EXCEPTION 'Bônus vinculados ao pagamento foram alterados.'; END IF;

 UPDATE public.pagamento_diarias SET ativo=false
  WHERE pagamento_id=p_pagamento_id AND empresa_id=v_empresa AND ativo=true;
 UPDATE public.pagamento_vales SET ativo=false
  WHERE pagamento_id=p_pagamento_id AND empresa_id=v_empresa AND ativo=true;
 UPDATE public.pagamento_bonus_extras SET ativo=false
  WHERE pagamento_id=p_pagamento_id AND empresa_id=v_empresa AND ativo=true;

 UPDATE public.financeiro
 SET status_lancamento='estornado',atualizado_em=now(),
 observacoes=concat_ws(' | ',nullif(observacoes,''),'Estornado por pagamento limitado')
 WHERE empresa_id=v_empresa AND obra_id=v_req.obra_id
 AND pagamento_equipe_id=p_pagamento_id AND origem='pagamento_equipe'
 AND status_lancamento='ativo';
 GET DIAGNOSTICS v_financeiro=ROW_COUNT;
 IF v_financeiro<>(CASE WHEN v_pag.valor_liquido>0 THEN 1 ELSE 0 END) THEN
   RAISE EXCEPTION 'Despesa financeira do pagamento divergente.';
 END IF;
 UPDATE public.pagamentos_equipe
 SET estornado_em=now(),motivo_estorno=nullif(trim(coalesce(p_motivo,'')),'')
 WHERE empresa_id=v_empresa AND id=p_pagamento_id;
 RETURN jsonb_build_object('ok',true,'ja_estornado',false,
  'pagamento_id',p_pagamento_id,'diarias_reabertas',v_diarias,
  'vales_reabertos',v_vales,'bonus_reabertos',v_bonus,
  'financeiro_estornado',v_financeiro);
END;
$body$;

REVOKE ALL ON FUNCTION public.obrix_hml_estornar_equipe_limitado(uuid,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_hml_estornar_equipe_limitado(uuid,text)
 TO authenticated;
COMMENT ON FUNCTION public.obrix_hml_pagar_equipe_limitado(
 uuid,uuid,uuid,date,uuid[],uuid[],uuid[]) IS
 'HML: pagamento transacional da obra e funcionario selecionados com request_id idempotente; nao toca plano oficial.';
COMMENT ON FUNCTION public.obrix_hml_estornar_equipe_limitado(uuid,text) IS
 'HML: estorna somente pagamento originado na rota de plano limitado e verifica obra/funcionario.';
