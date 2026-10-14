begin;
create table edifiq_private.account_deletion_context56(txid bigint not null, user_id uuid not null, primary key(txid,user_id));
alter table edifiq_private.account_deletion_context56 enable row level security;
revoke all on edifiq_private.account_deletion_context56 from public,anon,authenticated;
CREATE OR REPLACE FUNCTION edifiq_private.limit_business_writes54()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 actor uuid := auth.uid(); company uuid; sub public.edifiq_assinaturas%rowtype;
 first_id bigint; total bigint; target_id bigint;
begin
 if actor is null then
  if current_setting('request.jwt.claim.role',true)='anon' then raise exception 'Não autenticado'; end if;
  if TG_OP='DELETE' then return old; else return new; end if;
 end if;
 if not exists(select 1 from auth.users where id=actor) then raise exception 'Sessão encerrada. Entre novamente.'; end if;
 if TG_OP='DELETE' then company:=old.user_id;
 else company:=new.user_id; end if;
 if TG_TABLE_NAME in ('obras','funcionarios') then
  if TG_OP='DELETE' then target_id:=old.id; else target_id:=new.id; end if;
 end if;
 if TG_OP='DELETE' and company=actor and exists(select 1 from edifiq_private.account_deletion_context56 c where c.txid=txid_current() and c.user_id=actor) then return old; end if;
 if company is null or company is distinct from public.edifiq_empresa_atual() then raise exception 'Empresa inválida'; end if;
 if TG_OP='UPDATE' and old.user_id is distinct from new.user_id then raise exception 'Não é permitido transferir registros entre empresas'; end if;
 select * into sub from public.edifiq_assinaturas where empresa_user_id=company;
 if sub.status='cortesia' or (sub.status='ativa' and (sub.periodo_fim is null or sub.periodo_fim>now())) or (sub.status='trial' and sub.trial_fim>now()) then
  if TG_OP='DELETE' then return old; else return new; end if;
 end if;
 if TG_TABLE_NAME not in ('obras','funcionarios') or TG_OP='DELETE' then
  raise exception 'Acesso limitado. Assine um plano para usar este recurso.' using errcode='P0001';
 end if;
 -- Serialize quota checks for concurrent devices in the same company.
 perform pg_advisory_xact_lock(hashtextextended(company::text||':limited54',0));
 execute format('select count(*), (array_agg(id order by created_at nulls last,id))[1] from public.%I where user_id=$1',TG_TABLE_NAME) into total,first_id using company;
 if TG_OP='INSERT' and total>0 then raise exception 'O acesso limitado permite somente uma obra e um funcionário.'; end if;
 if TG_OP='UPDATE' and target_id is distinct from first_id then raise exception 'Este cadastro está preservado e será liberado após o pagamento.'; end if;
 return new;
end $function$;

CREATE OR REPLACE FUNCTION public.edifiq_excluir_minha_conta(p_confirmacao text, p_motivo text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_uid uuid := auth.uid();
  r record;
  v_pass int;
  v_sql text;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado';
  end if;

  if trim(coalesce(p_confirmacao,'')) <> 'EXCLUIR MINHA CONTA' then
    raise exception 'Confirmação inválida';
  end if;

  insert into edifiq_private.account_deletion_context56(txid,user_id) values(txid_current(),v_uid) on conflict do nothing;
  -- Remove dados operacionais ligados ao usuário/empresa. Tabelas de cobrança e
  -- auditoria comercial são preservadas quando necessárias para retenção legal.
  for v_pass in 1..4 loop
    for r in
      select c.table_name,
             string_agg(format('%I = %L::uuid', c.column_name, v_uid::text), ' or ') as predicates
      from information_schema.columns c
      where c.table_schema = 'public' and exists(select 1 from information_schema.tables t where t.table_schema=c.table_schema and t.table_name=c.table_name and t.table_type='BASE TABLE')
        and c.data_type = 'uuid'
        and c.column_name in ('user_id','membro_user_id','empresa_user_id','usuario_id')
        and c.table_name not in (
          'edifiq_assinaturas',
          'edifiq_pagamentos_assinatura',
          'edifiq_pagamento_eventos',
          'edifiq_checkout_sessoes',
          'edifiq_comercial_auditoria',
          'edifiq_comercial_controle',
          'edifiq_homologacao_cobranca',
          'edifiq_piloto_clientes',
          'edifiq_piloto_convites',
          'edifiq_piloto_incidentes',
          'edifiq_piloto_validacoes',
          'auditoria_edifiq'
        )
      group by c.table_name
    loop
      begin
        v_sql := format('delete from public.%I where %s', r.table_name, r.predicates);
        execute v_sql;
      exception when foreign_key_violation then
        null;
      end;
    end loop;
  end loop;

  -- Perfil usa o próprio id do usuário.
  if to_regclass('public.profiles') is not null then
    delete from public.profiles where id = v_uid;
  end if;

  -- Remove a identidade de autenticação por último. Depois deste ponto o login
  -- deixa de existir imediatamente.
  delete from auth.users where id = v_uid;
  if not found then
    raise exception 'Conta não encontrada no Auth';
  end if;

  delete from edifiq_private.account_deletion_context56 where txid=txid_current() and user_id=v_uid;
  return jsonb_build_object('ok', true, 'deleted', true, 'user_id', v_uid);
end;
$function$;

commit;