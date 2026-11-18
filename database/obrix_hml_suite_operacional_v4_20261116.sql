-- SUÍTE EXCLUSIVA DE HOMOLOGAÇÃO OBRIX; NÃO EXECUTAR NO BANCO OFICIAL
-- Usa schemas isolados e fixtures revertidas no mesmo bloco transacional.
-- A execução deve ocorrer somente no projeto Supabase de auditoria.

CREATE OR REPLACE FUNCTION obrix_seg_hml_20261116.executar_testes_operacionais_v4()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  e1 uuid := gen_random_uuid();
  e2 uuid := gen_random_uuid();
  ebackup uuid := gen_random_uuid();
  u1 uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  fun uuid;
  obra1 uuid;
  obra2 uuid;
  obackup uuid;
  dia1 uuid;
  dia2 uuid;
  vale1 uuid;
  chk1 uuid;
  chk2 uuid;
  dc uuid;
  ve uuid;
  outro_pagamento uuid;
  recusou_cancelada boolean := false;
  recusou_estornado boolean := false;
  recusou_duplicados boolean := false;
  recusou_outro_cliente boolean := false;
  dia_neg uuid;
  vale_neg uuid;
  pg_neg uuid;
  rec_neg jsonb;
  bloqueio_destino boolean := false;
  bloqueio_valor boolean := false;
  bonus1 uuid;
  pagamento uuid;
  lote uuid;
  backup_json jsonb;
  retorno jsonb;
  resultado jsonb := '{}'::jsonb;
  duplicado_bloqueado boolean := false;
  cruzado_bloqueado boolean := false;
  rollback_backup boolean := false;
  nome_obra text;
  n integer;
  total numeric;
  original_claim text := current_setting('request.jwt.claim.sub',true);
begin
  begin
    insert into obrix_operacional_lab.empresas(id) values(e1),(e2),(ebackup);
    insert into obrix_operacional_lab.assinaturas(empresa_id,status) values(e1,'ativo'),(e2,'ativo'),(ebackup,'ativo');
    insert into obrix_operacional_lab.perfis(id,empresa_id,papel) values(u1,e1,'proprietario'),(u2,e2,'proprietario');
    perform set_config('request.jwt.claim.sub',u1::text,true);

    insert into obrix_operacional_lab.obras(empresa_id,nome,status)
    values(e1,'HML Obra 1','andamento') returning id into obra1;
    insert into obrix_operacional_lab.obras(empresa_id,nome,status)
    values(e1,'HML Obra 2','andamento') returning id into obra2;
    insert into obrix_operacional_lab.funcionarios(empresa_id,nome,valor_diaria)
    values(e1,'Funcionario HML',200) returning id into fun;
    insert into obrix_operacional_lab.diarias(empresa_id,funcionario_id,obra_id,quantidade,valor_unitario,valor_total)
    values(e1,fun,obra1,0.5,200,100) returning id into dia1;
    insert into obrix_operacional_lab.diarias(empresa_id,funcionario_id,obra_id,quantidade,valor_unitario,valor_total)
    values(e1,fun,obra2,0.5,200,100) returning id into dia2;
    insert into obrix_operacional_lab.bonus_extras(empresa_id,funcionario_id,obra_id,valor)
    values(e1,fun,obra1,40) returning id into bonus1;
    insert into obrix_operacional_lab.vales(empresa_id,funcionario_id,obra_id,valor)
    values(e1,fun,obra2,20) returning id into vale1;
    select id into chk1 from obrix_operacional_lab.checklist_itens where obra_id=obra1 and empresa_id=e1 order by ordem limit 1;
    select id into chk2 from obrix_operacional_lab.checklist_itens where obra_id=obra2 and empresa_id=e1 order by ordem limit 1;
    if chk1 is null or chk2 is null then raise exception 'Checklist padrão não encontrado na obra de homologação'; end if;
    update obrix_operacional_lab.diarias set checklist_id=chk1 where id=dia1;
    update obrix_operacional_lab.bonus_extras set checklist_id=chk1 where id=bonus1;
    update obrix_operacional_lab.diarias set checklist_id=chk2 where id=dia2;
    update obrix_operacional_lab.vales set checklist_id=chk2 where id=vale1;

    pagamento := (obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
      fun,current_date,array[dia1,dia2]::uuid[],array[vale1]::uuid[],array[bonus1]::uuid[])->>'pagamento_id')::uuid;

    select valor_liquido into total from obrix_operacional_lab.pagamentos_equipe where id=pagamento;
    if total is distinct from 220 then raise exception 'Pagamento incorreto: líquido %, esperado 220',total; end if;

    select count(*) into n from obrix_operacional_lab.diarias where id in(dia1,dia2) and paga=true;
    if n<>2 then raise exception 'Pagamento nao marcou duas meias diarias'; end if;

    if not exists(select 1 from obrix_operacional_lab.vales where id=vale1 and quitado) or
       not exists(select 1 from obrix_operacional_lab.bonus_extras where id=bonus1 and pago)
    then raise exception 'Vale ou bonus nao quitado'; end if;

    select count(*), coalesce(sum(valor),0) into n,total from obrix_operacional_lab.financeiro
    where pagamento_equipe_id=pagamento and origem='pagamento_equipe' and status_lancamento='ativo';
    if n<>2 or total<>220 then raise exception 'Distribuicao financeira: % linhas, total %',n,total; end if;
    if not exists (select 1 from obrix_operacional_lab.financeiro where pagamento_equipe_id=pagamento and obra_id=obra1 and valor=140)
      or not exists (select 1 from obrix_operacional_lab.financeiro where pagamento_equipe_id=pagamento and obra_id=obra2 and valor=80)
    then raise exception 'Distribuicao por obra incorreta'; end if;
    resultado := resultado || jsonb_build_object('pagamento_220',true,'financeiro_duas_obras',true,'duas_meias_diarias',true);
    -- Vale antigo inexistente no financeiro foi lançado exatamente uma vez.
    select count(*) into n from obrix_operacional_lab.financeiro
      where empresa_id=e1 and vale_id=vale1 and origem='vale_equipe' and status_lancamento='ativo';
    if n<>1 then raise exception 'Reconciliação de vale antigo falhou: % lançamentos',n; end if;
    if not exists(select 1 from obrix_operacional_lab.financeiro
       where pagamento_equipe_id=pagamento and obra_id=obra1 and checklist_ids=array[chk1]::uuid[]
       and (checklist_valores->>chk1::text)::numeric=140)
     or not exists(select 1 from obrix_operacional_lab.financeiro
       where pagamento_equipe_id=pagamento and obra_id=obra2 and checklist_ids=array[chk2]::uuid[]
       and (checklist_valores->>chk2::text)::numeric=80)
     then raise exception 'Checklist da despesa da equipe não preservado'; end if;
    resultado := resultado || jsonb_build_object('vale_antigo_lancado_uma_vez',true,'rateio_checklist_por_obra',true);

    insert into obrix_operacional_lab.diarias(
      empresa_id,funcionario_id,obra_id,quantidade,valor_unitario,valor_total,cancelada_em)
      values(e1,fun,obra1,1,200,200,now()) returning id into dc;
    begin
       perform obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
          fun,current_date,array[dc]::uuid[],'{}'::uuid[],'{}'::uuid[]);
    exception when others then recusou_cancelada := sqlerrm ilike '%Diária inválida%'; end;
    insert into obrix_operacional_lab.vales(empresa_id,funcionario_id,obra_id,valor,estornado_em)
      values(e1,fun,obra2,15,now()) returning id into ve;
    begin
       perform obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
         fun,current_date,'{}'::uuid[],array[ve]::uuid[],'{}'::uuid[]);
    exception when others then recusou_estornado := sqlerrm ilike '%Vale inválido%'
       or sqlerrm ilike '%bruto zerado%'; end;
    begin
       perform obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
        fun,current_date,array[dia1,dia1]::uuid[],'{}'::uuid[],'{}'::uuid[]);
    exception when others then recusou_duplicados := sqlerrm ilike '%mesmo registro duas vezes%'; end;
    resultado := resultado || jsonb_build_object(
       'diaria_cancelada_rejeitada',recusou_cancelada,
       'vale_estornado_rejeitado',recusou_estornado,
       'ids_duplicados_rejeitados',recusou_duplicados);

    begin
      perform obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
      fun,current_date,array[dia1,dia2]::uuid[],array[vale1]::uuid[],array[bonus1]::uuid[]);
    exception when others then
      duplicado_bloqueado := sqlerrm ilike '%já foram pagas%' or sqlerrm ilike '%já foram quitados%'
        or sqlerrm ilike '%inválid%';
    end;
    resultado := resultado || jsonb_build_object('duplicidade_rejeitada',duplicado_bloqueado);

    perform set_config('request.jwt.claim.sub',u2::text,true);
    begin
      perform obrix_operacional_lab.obrix_estornar_pagamento_equipe(pagamento,'teste entre empresas');
    exception when others then
      cruzado_bloqueado := sqlerrm ilike '%não encontrado%' or sqlerrm ilike '%não autoriz%';
    end;
    resultado := resultado || jsonb_build_object('estorno_outra_empresa_rejeitado',cruzado_bloqueado);
    begin
      perform obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
       fun,current_date,array[dia1]::uuid[],'{}'::uuid[],'{}'::uuid[]);
    exception when others then
      recusou_outro_cliente := sqlerrm ilike '%não pertence à empresa%'
         or sqlerrm ilike '%não autorizado%';
    end;
    perform set_config('request.jwt.claim.sub',u1::text,true);
    resultado := resultado || jsonb_build_object('pagamento_outra_empresa_rejeitado',recusou_outro_cliente);

    retorno := obrix_operacional_lab.obrix_estornar_pagamento_equipe(pagamento,'teste homologacao');
    if coalesce((retorno->>'ok')::boolean,false)=false
      or coalesce((retorno->>'diarias_reabertas')::integer,0)<>2
      or coalesce((retorno->>'vales_reabertos')::integer,0)<>1
      or coalesce((retorno->>'bonus_reabertos')::integer,0)<>1
      or coalesce((retorno->>'financeiro_estornado')::integer,0)<>2
    then raise exception 'Estorno incompleto %',retorno::text; end if;

    select count(*) into n from obrix_operacional_lab.diarias where id in(dia1,dia2) and paga=false;
    if n<>2 then raise exception 'Diarias nao reabertas'; end if;
    if not exists(select 1 from obrix_operacional_lab.vales where id=vale1 and quitado=false)
    or not exists(select 1 from obrix_operacional_lab.bonus_extras where id=bonus1 and pago=false)
    then raise exception 'Vales ou bonus nao reabertos'; end if;
    select count(*) into n from obrix_operacional_lab.financeiro
    where pagamento_equipe_id=pagamento and status_lancamento='estornado';
    if n<>2 then raise exception 'Financeiro nao estornado'; end if;
    resultado := resultado || jsonb_build_object('estorno_reabre_pendencias',true,'estorno_financeiro',true);

    retorno := obrix_operacional_lab.obrix_estornar_pagamento_equipe(pagamento,'segunda chamada');
    resultado := resultado || jsonb_build_object('estorno_idempotente',coalesce((retorno->>'ja_estornado')::boolean,false));

    -- Novo pagamento após o estorno deve reaproveitar o vale já lançado,
    -- sem lançar novamente o adiantamento.
    retorno := obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
       fun,current_date,array[dia1,dia2]::uuid[],array[vale1]::uuid[],array[bonus1]::uuid[]);
    outro_pagamento := (retorno->>'pagamento_id')::uuid;
    select count(*) into n from obrix_operacional_lab.financeiro
      where vale_id=vale1 and origem='vale_equipe' and status_lancamento='ativo';
    if n<>1 then raise exception 'Vale duplicado após estorno/re-pagamento'; end if;
    perform obrix_operacional_lab.obrix_estornar_pagamento_equipe(outro_pagamento,'estorno do novo pagamento');
    resultado := resultado || jsonb_build_object('vale_nao_duplicado_apos_repagamento',true);

    -- Compensation: daily earnings in obra 1 and a vale in obra 2.
    insert into obrix_operacional_lab.diarias(empresa_id,funcionario_id,obra_id,quantidade,valor_unitario,valor_total)
    values(e1,fun,obra1,1,200,200) returning id into dia_neg;
    insert into obrix_operacional_lab.vales(empresa_id,funcionario_id,obra_id,valor)
    values(e1,fun,obra2,80) returning id into vale_neg;

    begin
      perform obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
        fun,current_date,array[dia_neg]::uuid[],array[vale_neg]::uuid[],'{}'::uuid[],obra2,120);
    exception when others then
      bloqueio_destino := sqlerrm ilike '%Selecione uma obra com diária ou bônus%';
    end;

    begin
      perform obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
        fun,current_date,array[dia_neg]::uuid[],array[vale_neg]::uuid[],'{}'::uuid[],obra1,121);
    exception when others then
      bloqueio_valor := sqlerrm ilike '%valor calculado foi alterado%';
    end;

    rec_neg := obrix_operacional_lab.obrix_pagar_equipe_transacional_v2(
      fun,current_date,array[dia_neg]::uuid[],array[vale_neg]::uuid[],'{}'::uuid[],obra1,120);
    if coalesce((rec_neg->>'compensacao_entre_obras')::boolean,false) is false
       or (rec_neg->>'valor_liquido')::numeric<>120
    then raise exception 'Pagamento com compensação não confirmado %',rec_neg; end if;
    pg_neg := (rec_neg->>'pagamento_id')::uuid;
    select count(*),coalesce(sum(valor),0) into n,total
      from obrix_operacional_lab.financeiro
      where pagamento_equipe_id=pg_neg and obra_id=obra1 and status_lancamento='ativo';
    if n<>1 or total<>120 then raise exception 'Destino incorreto em compensação de vales'; end if;
    if exists(select 1 from obrix_operacional_lab.financeiro
      where pagamento_equipe_id=pg_neg and obra_id=obra2) then
      raise exception 'Vale criou despesa na obra incorreta'; end if;

    rec_neg := obrix_operacional_lab.obrix_estornar_pagamento_equipe(pg_neg,'estorno compensacao');
    if coalesce((rec_neg->>'diarias_reabertas')::integer,0)<>1
      or coalesce((rec_neg->>'vales_reabertos')::integer,0)<>1
    then raise exception 'Estorno compensação falhou'; end if;
    resultado := resultado || jsonb_build_object(
      'compensacao_obras_120',true,
      'compensacao_destino_indevido_bloqueado',bloqueio_destino,
      'valor_desatualizado_bloqueado',bloqueio_valor,
      'compensacao_estorno_reabre_pendencias',true);

    begin
      -- Reproduz apenas a sequência SQL do Edge Function oficial:
      -- estornar lançamentos automáticos, removê-los e depois remover empresa.
      update obrix_operacional_lab.financeiro
        set status_lancamento='estornado'
        where empresa_id=e1 and origem<>'manual' and status_lancamento='ativo';
      delete from obrix_operacional_lab.financeiro where empresa_id=e1;
      delete from obrix_operacional_lab.empresas where id=e1;
      resultado := resultado || jsonb_build_object('exclusao_empresa_fluxo_edge',
        not exists(select 1 from obrix_operacional_lab.pagamentos_equipe where empresa_id=e1));
    exception when others then
      resultado := resultado || jsonb_build_object('exclusao_empresa_fluxo_edge',false,
        'exclusao_empresa_fluxo_edge_erro',left(sqlerrm,240));
    end;

    insert into obrix_operacional_lab.perfis(id,empresa_id,papel) values(gen_random_uuid(),ebackup,'proprietario');
    perform set_config('request.jwt.claim.sub',(select id::text from obrix_operacional_lab.perfis where empresa_id=ebackup limit 1),true);
    insert into obrix_operacional_lab.obras(empresa_id,nome,status)
    values(ebackup,'HML BACKUP ORIGINAL','planejada') returning id into obackup;
    select to_jsonb(o) into backup_json from obrix_operacional_lab.obras o where o.id=obackup;
    insert into obrix_restore_lab.lotes(empresa_origem,tipo,registros_declarados,status)
    values(ebackup,'dados',1,'preparado') returning id into lote;
    insert into obrix_restore_lab.registros(lote_id,modulo,registro_id,empresa_origem,conteudo)
    values(lote,'obras',obackup,ebackup,backup_json);
    update obrix_operacional_lab.obras set nome='HML BACKUP ALTERADO' where id=obackup;
    begin
      perform obrix_operacional_lab.restaurar_lote_tabelas(lote,true);
    exception when others then
      rollback_backup := sqlerrm like '%FALHA_CONTROLADA_POS_GRAVACAO_OPERACIONAL%';
    end;
    select nome into nome_obra from obrix_operacional_lab.obras where id=obackup;
    resultado := resultado || jsonb_build_object('falha_backup_reverte_transacao', rollback_backup and nome_obra='HML BACKUP ALTERADO');
    retorno := obrix_operacional_lab.restaurar_lote_tabelas(lote,false);
    select nome into nome_obra from obrix_operacional_lab.obras where id=obackup;
    resultado := resultado || jsonb_build_object('restauracao_backup_dados',coalesce((retorno->>'ok')::boolean,false) and nome_obra='HML BACKUP ORIGINAL');

    raise exception 'OBRIX_HML_ROLLBACK_FIXTURES_20261116';
  exception when others then
    if sqlerrm<>'OBRIX_HML_ROLLBACK_FIXTURES_20261116' then
      resultado := resultado || jsonb_build_object('erro_inesperado',left(sqlerrm,400),'sqlstate',sqlstate);
    end if;
  end;
  return resultado || jsonb_build_object('fixtures_revertidas',true);
end;
$function$;
REVOKE ALL ON FUNCTION obrix_seg_hml_20261116.executar_testes_operacionais_v4() FROM PUBLIC,anon,authenticated;
-- Para conferir no banco de auditoria: SELECT obrix_seg_hml_20261116.executar_testes_operacionais_v4();
