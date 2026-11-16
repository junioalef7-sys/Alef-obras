-- OBRIX | FONTE VALIDADA NO LABORATÓRIO | NÃO EXECUTAR NO BANCO OFICIAL
-- Atualização 16/11/2026: filtros para diárias canceladas e vales estornados;
-- checagem de vínculos ativos; reconciliação atômica de vales antigos;
-- manutenção de checklist no rateio financeiro, sem rateio quando vales cruzam obras.
-- Ambiente: OBRIX-AUDITORIA-AUTH-20261102, schema obrix_operacional_lab.
-- Os testes temporários revertem as operações; não houve aplicação na produção.
-- Segurança: função em schema privado, EXECUTE revogado dos clientes.
-- Dependências do laboratório não existem necessariamente no schema public da produção.
-- Não usar este arquivo como migração automática do aplicativo oficial.

CREATE OR REPLACE FUNCTION obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(p_funcionario_id uuid, p_data_pagamento date, p_diaria_ids uuid[], p_vale_ids uuid[], p_bonus_ids uuid[], p_obra_pagamento_id uuid DEFAULT NULL::uuid, p_liquido_esperado numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_empresa uuid := obrix_operacional_lab.obrix_empresa_atual();
 v_nome text;
 v_papel text;
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
 select papel into v_papel from obrix_operacional_lab.perfis where id=(select auth.uid()) and empresa_id=v_empresa;
 if coalesce(v_papel,'') not in ('proprietario','admin') then raise exception 'Operação restrita ao proprietário ou administrador.'; end if;

 -- Lock the selected rows deterministically to serialize competing payments.
 perform 1 from obrix_operacional_lab.diarias
  where id=any(v_diarias) and empresa_id=v_empresa order by id for update;
 perform 1 from obrix_operacional_lab.vales
  where id=any(v_vales) and empresa_id=v_empresa order by id for update;
 perform 1 from obrix_operacional_lab.bonus_extras
  where id=any(v_bonus) and empresa_id=v_empresa order by id for update;

 select count(*), coalesce(sum(valor_total),0) into v_qtd,v_total_d
 from obrix_operacional_lab.diarias
 where id=any(v_diarias) and empresa_id=v_empresa and funcionario_id=p_funcionario_id and paga=false and cancelada_em is null
   and not exists(select 1 from obrix_operacional_lab.pagamento_diarias pd where pd.diaria_id=diarias.id and pd.ativo);
 if v_qtd<>cardinality(v_diarias) then raise exception 'Diária inválida ou já paga. Atualize a equipe.'; end if;

 select count(*), coalesce(sum(valor),0) into v_qtd,v_total_v
 from obrix_operacional_lab.vales
 where id=any(v_vales) and empresa_id=v_empresa and funcionario_id=p_funcionario_id and quitado=false and obra_id is not null and estornado_em is null
   and not exists(select 1 from obrix_operacional_lab.pagamento_vales pv where pv.vale_id=vales.id and pv.ativo);
 if v_qtd<>cardinality(v_vales) then raise exception 'Vale inválido, sem obra ou já quitado.'; end if;

 select count(*), coalesce(sum(valor),0) into v_qtd,v_total_b
 from obrix_operacional_lab.bonus_extras
 where id=any(v_bonus) and empresa_id=v_empresa and funcionario_id=p_funcionario_id and pago=false and obra_id is not null
   and not exists(select 1 from obrix_operacional_lab.pagamento_bonus_extras pb where pb.bonus_extra_id=bonus_extras.id and pb.ativo);
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


 -- Vales históricos sem lançamento: reconciliação na mesma transação.
 if cardinality(v_vales)>0 then
   if exists(select 1 from obrix_operacional_lab.financeiro f
     where f.empresa_id=v_empresa and f.vale_id=any(v_vales)
       and f.origem='vale_equipe' and f.status_lancamento='estornado') then
     raise exception 'Vale com lançamento estornado no Financeiro. Revise o histórico.';
   end if;
   if exists(select 1 from obrix_operacional_lab.financeiro f
     where f.empresa_id=v_empresa and f.vale_id=any(v_vales)
       and f.status_lancamento='ativo'
     group by f.vale_id having count(*)>1) then
     raise exception 'Vale duplicado no Financeiro. Revise o histórico.';
   end if;
   insert into obrix_operacional_lab.financeiro(
     empresa_id,obra_id,checklist_id,checklist_ids,checklist_valores,
     tipo,categoria,descricao,valor,data,origem,vale_id,status_lancamento,observacoes)
   select v_empresa,v.obra_id,v.checklist_id,
       case when v.checklist_id is null then '{}'::uuid[] else array[v.checklist_id] end,
       case when v.checklist_id is null then '{}'::jsonb else jsonb_build_object(v.checklist_id::text,round(v.valor,2)) end,
       'despesa','mao_de_obra','Vale da equipe - '||v_nome,
       v.valor,v.data,'vale_equipe',v.id,'ativo',v.observacoes
   from obrix_operacional_lab.vales v
   where v.empresa_id=v_empresa and v.id=any(v_vales)
       and not exists(select 1 from obrix_operacional_lab.financeiro f
         where f.empresa_id=v_empresa and f.vale_id=v.id
           and f.origem='vale_equipe' and f.status_lancamento='ativo');
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

     insert into obrix_operacional_lab.financeiro(
       empresa_id,obra_id,tipo,categoria,descricao,valor,data,origem,pagamento_equipe_id,
       status_lancamento,checklist_id,checklist_ids,checklist_valores)
     with dist as (
       select obra_id,checklist_id,valor_total::numeric valor from obrix_operacional_lab.diarias
         where id=any(v_diarias) and empresa_id=v_empresa
       union all
       select obra_id,checklist_id,valor::numeric from obrix_operacional_lab.bonus_extras
         where id=any(v_bonus) and empresa_id=v_empresa
       union all
       select obra_id,checklist_id,(-valor)::numeric from obrix_operacional_lab.vales
         where id=any(v_vales) and empresa_id=v_empresa
     ),
     saldos as (select obra_id,round(sum(valor),2) saldo from dist
       group by obra_id having round(sum(valor),2)>0),
     por_etapa as (select obra_id,checklist_id,round(sum(valor),2) valor from dist
       where checklist_id is not null group by obra_id,checklist_id having round(sum(valor),2)>0),
     etapas as (select obra_id,array_agg(checklist_id order by checklist_id) ids,
       jsonb_object_agg(checklist_id::text,valor) valores,sum(valor) total from por_etapa group by obra_id)
     select v_empresa,s.obra_id,'despesa','mao_de_obra',
       'Pagamento de equipe - '||v_nome,s.saldo,p_data_pagamento,'pagamento_equipe',v_pagamento,'ativo',
       case when coalesce(e.total,0)<=s.saldo then e.ids[1] else null end,
       case when coalesce(e.total,0)<=s.saldo then coalesce(e.ids,'{}'::uuid[]) else '{}'::uuid[] end,
       case when coalesce(e.total,0)<=s.saldo then coalesce(e.valores,'{}'::jsonb) else '{}'::jsonb end
     from saldos s left join etapas e on e.obra_id=s.obra_id;
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
$function$;
REVOKE ALL ON FUNCTION obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(uuid,date,uuid[],uuid[],uuid[],uuid,numeric) FROM PUBLIC,anon,authenticated;
