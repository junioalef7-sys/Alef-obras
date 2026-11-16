-- OBRIX | EVIDÊNCIA DE HOMOLOGAÇÃO -- NÃO EXECUTAR EM PRODUÇÃO
-- 2026-11-16: função aplicada somente no projeto de auditoria.
-- Requer schemas e tabelas obrix_operacional_lab, que NÃO são as tabelas oficiais.
-- Esta função não concede EXECUTE a authenticated nem é exposta pelo app.
-- Adaptação para produção ainda exige: filtros cancelada_em/estornado_em,
-- inclusão/checagem de vale financeiro histórico, validação de papéis,
-- privilégios mínimos e testes E2E no PWA.
-- Commit oficial aprovado permanece 92495c4898e66d45c44b9e4b240a63a336af4e59.

CREATE OR REPLACE FUNCTION obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(p_funcionario_id uuid, p_data_pagamento date, p_diaria_ids uuid[], p_vale_ids uuid[], p_bonus_ids uuid[], p_obra_pagamento_id uuid DEFAULT NULL::uuid, p_liquido_esperado numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_empresa uuid := obrix_operacional_lab.obrix_empresa_atual();
 v_nome text;
 v_diarias uuid[] := coalesce(p_diaria_ids,'{}'::uuid[]);
 v_vales uuid[] := coalesce(p_vale_ids,'{}'::uuid[]);
 v_bonus uuid[] := coalesce(p_bonus_ids,'{}'::uuid[]);
 v_total_d numeric(14,2) := 0;
 v_total_v numeric(14,2) := 0;
 v_total_b numeric(14,2) := 0;
 v_bruto numeric(14,2) := 0;
 v_liquido numeric(14,2) := 0;
 v_pagamento uuid;
 v_qtd integer;
 v_obra_negativa boolean := false;
 v_obra_destino uuid;
 v_destino_valido boolean;
 v_linhas integer;
 v_valor_financeiro numeric(14,2);
begin
 if (select auth.uid()) is null or v_empresa is null or not obrix_operacional_lab.obrix_acesso_total(v_empresa) then
   raise exception 'Acesso não autorizado ao pagamento da equipe.';
 end if;
 if p_funcionario_id is null or p_data_pagamento is null then
   raise exception 'Funcionário e data são obrigatórios.';
 end if;
 if cardinality(v_diarias)+cardinality(v_vales)+cardinality(v_bonus)=0 then
   raise exception 'Nenhuma diária, vale ou bônus foi selecionado.';
 end if;
 if array_position(v_diarias,null) is not null or array_position(v_vales,null) is not null or array_position(v_bonus,null) is not null then
   raise exception 'Identificadores nulos não são aceitos.';
 end if;
 if (select count(distinct x) from unnest(v_diarias) x) <> cardinality(v_diarias)
   or (select count(distinct x) from unnest(v_vales) x) <> cardinality(v_vales)
   or (select count(distinct x) from unnest(v_bonus) x) <> cardinality(v_bonus) then
   raise exception 'Não envie o mesmo registro duas vezes.';
 end if;
 select nome into v_nome from obrix_operacional_lab.funcionarios where id=p_funcionario_id and empresa_id=v_empresa;
 if not found then raise exception 'Funcionário não pertence à empresa atual.'; end if;

 -- Lock the selected rows deterministically to serialize competing payments.
 perform 1 from obrix_operacional_lab.diarias
  where id=any(v_diarias) order by id for update;
 perform 1 from obrix_operacional_lab.vales
  where id=any(v_vales) order by id for update;
 perform 1 from obrix_operacional_lab.bonus_extras
  where id=any(v_bonus) order by id for update;

 select count(*), coalesce(sum(valor_total),0) into v_qtd,v_total_d
 from obrix_operacional_lab.diarias
 where id=any(v_diarias) and empresa_id=v_empresa and funcionario_id=p_funcionario_id and paga=false;
 if v_qtd<>cardinality(v_diarias) then raise exception 'Diária inválida ou já paga. Atualize a equipe.'; end if;

 select count(*), coalesce(sum(valor),0) into v_qtd,v_total_v
 from obrix_operacional_lab.vales
 where id=any(v_vales) and empresa_id=v_empresa and funcionario_id=p_funcionario_id and quitado=false and obra_id is not null;
 if v_qtd<>cardinality(v_vales) then raise exception 'Vale inválido, sem obra ou já quitado.'; end if;

 select count(*), coalesce(sum(valor),0) into v_qtd,v_total_b
 from obrix_operacional_lab.bonus_extras
 where id=any(v_bonus) and empresa_id=v_empresa and funcionario_id=p_funcionario_id and pago=false and obra_id is not null;
 if v_qtd<>cardinality(v_bonus) then raise exception 'Bônus inválido, sem obra ou já pago.'; end if;

 v_bruto:=v_total_d+v_total_b;
 v_liquido:=v_bruto-v_total_v;
 if v_bruto<=0 or v_liquido<0 then raise exception 'Pagamento bruto zerado ou líquido negativo.'; end if;
 if p_liquido_esperado is not null and round(p_liquido_esperado,2)<>v_liquido then
   raise exception 'O valor calculado foi alterado. Atualize a folha.';
 end if;

 -- Important: only the selected, tenant-validated records may enter the distribution.
 with dist as (
  select obra_id,valor_total::numeric valor from obrix_operacional_lab.diarias where id=any(v_diarias) and empresa_id=v_empresa
  union all
  select obra_id,valor::numeric from obrix_operacional_lab.bonus_extras where id=any(v_bonus) and empresa_id=v_empresa
  union all
  select obra_id,(-valor)::numeric from obrix_operacional_lab.vales where id=any(v_vales) and empresa_id=v_empresa
 )
 select exists(select 1 from dist group by obra_id having sum(valor)<0) into v_obra_negativa;

 if v_obra_negativa and v_liquido>0 then
   -- If one worksite has a net negative, the user chooses a site with gross earnings.
   with bruto as (
     select obra_id from obrix_operacional_lab.diarias where id=any(v_diarias) and empresa_id=v_empresa
     union all
     select obra_id from obrix_operacional_lab.bonus_extras where id=any(v_bonus) and empresa_id=v_empresa
   )
   select count(distinct obra_id),min(obra_id::text)::uuid into v_qtd,v_obra_destino from bruto;
   if v_qtd=1 and p_obra_pagamento_id is null then
     null;
   else
     v_obra_destino:=p_obra_pagamento_id;
     select exists(
       select 1 from (
         select obra_id from obrix_operacional_lab.diarias where id=any(v_diarias) and empresa_id=v_empresa
         union all
         select obra_id from obrix_operacional_lab.bonus_extras where id=any(v_bonus) and empresa_id=v_empresa
       ) bruto where bruto.obra_id=v_obra_destino
     ) into v_destino_valido;
     if not coalesce(v_destino_valido,false) then
        raise exception 'Selecione uma obra com diária ou bônus neste pagamento.';
     end if;
   end if;
 end if;

 insert into obrix_operacional_lab.pagamentos_equipe(
  empresa_id,funcionario_id,valor_diarias,valor_bonus_extras,valor_vales,valor_bruto,valor_liquido,data_pagamento
 ) values(v_empresa,p_funcionario_id,v_total_d,v_total_b,v_total_v,v_bruto,v_liquido,p_data_pagamento)
 returning id into v_pagamento;

 if cardinality(v_diarias)>0 then
   insert into obrix_operacional_lab.pagamento_diarias(empresa_id,pagamento_id,diaria_id,obra_id,valor)
    select v_empresa,v_pagamento,id,obra_id,valor_total from obrix_operacional_lab.diarias where id=any(v_diarias) and empresa_id=v_empresa;
   update obrix_operacional_lab.diarias set paga=true,pago_em=now() where id=any(v_diarias) and empresa_id=v_empresa;
 end if;
 if cardinality(v_vales)>0 then
   insert into obrix_operacional_lab.pagamento_vales(empresa_id,pagamento_id,vale_id,valor)
    select v_empresa,v_pagamento,id,valor from obrix_operacional_lab.vales where id=any(v_vales) and empresa_id=v_empresa;
   update obrix_operacional_lab.vales set quitado=true,quitado_em=now() where id=any(v_vales) and empresa_id=v_empresa;
 end if;
 if cardinality(v_bonus)>0 then
   insert into obrix_operacional_lab.pagamento_bonus_extras(empresa_id,pagamento_id,bonus_extra_id,valor)
    select v_empresa,v_pagamento,id,valor from obrix_operacional_lab.bonus_extras where id=any(v_bonus) and empresa_id=v_empresa;
   update obrix_operacional_lab.bonus_extras set pago=true,pago_em=now() where id=any(v_bonus) and empresa_id=v_empresa;
 end if;

 if v_liquido>0 then
   if v_obra_negativa then
     insert into obrix_operacional_lab.financeiro(empresa_id,obra_id,tipo,categoria,descricao,valor,data,origem,pagamento_equipe_id,status_lancamento,observacoes)
     values(v_empresa,v_obra_destino,'despesa','mao_de_obra','Pagamento de equipe - '||v_nome,v_liquido,p_data_pagamento,'pagamento_equipe',v_pagamento,'ativo',
     'Compensação de vales entre obras de origem; obra escolhida para pagamento líquido.');
   else
     insert into obrix_operacional_lab.financeiro(empresa_id,obra_id,tipo,categoria,descricao,valor,data,origem,pagamento_equipe_id,status_lancamento)
     with dist as (
       select obra_id,valor_total::numeric valor from obrix_operacional_lab.diarias where id=any(v_diarias) and empresa_id=v_empresa
       union all
       select obra_id,valor::numeric from obrix_operacional_lab.bonus_extras where id=any(v_bonus) and empresa_id=v_empresa
       union all
       select obra_id,(-valor)::numeric from obrix_operacional_lab.vales where id=any(v_vales) and empresa_id=v_empresa
     )
     select v_empresa,obra_id,'despesa','mao_de_obra','Pagamento de equipe - '||v_nome,
       round(sum(valor),2),p_data_pagamento,'pagamento_equipe',v_pagamento,'ativo'
     from dist group by obra_id having round(sum(valor),2)>0;
   end if;
 end if;

 select count(*),coalesce(sum(valor),0) into v_linhas,v_valor_financeiro
 from obrix_operacional_lab.financeiro where empresa_id=v_empresa and pagamento_equipe_id=v_pagamento
   and status_lancamento='ativo' and origem='pagamento_equipe';
 if v_valor_financeiro<>v_liquido then
   raise exception 'Falha no rateio financeiro: total % não corresponde ao pagamento %.',v_valor_financeiro,v_liquido;
 end if;
 return jsonb_build_object('ok',true,'pagamento_id',v_pagamento,'valor_bruto',v_bruto,'valor_vales',v_total_v,
     'valor_liquido',v_liquido,'qtd_lancamentos',v_linhas,'compensacao_entre_obras',v_obra_negativa);
end;
$function$

REVOKE ALL ON FUNCTION obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(uuid,date,uuid[],uuid[],uuid[],uuid,numeric) FROM PUBLIC, anon, authenticated;
