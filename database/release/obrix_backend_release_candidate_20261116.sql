-- OBRIX / PRÉ-PUBLICAÇÃO 2026-11-16 — CANDIDATO NÃO HOMOLOGADO EM PRODUÇÃO.
-- Não aplicar automaticamente. Remover a guarda SOMENTE após testes E2E, auditoria,
-- aprovação do usuário e backup verificável. Não alterar o front antes do backend.
BEGIN;
DO $block$ BEGIN
  RAISE EXCEPTION 'OBRIX RELEASE BLOCKED: exige homologação integrada e aprovação';
END $block$;

CREATE SCHEMA IF NOT EXISTS obrix_conta_interna;
REVOKE ALL ON SCHEMA obrix_conta_interna FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA obrix_conta_interna TO authenticated;
CREATE TABLE IF NOT EXISTS obrix_conta_interna.contexto(
  transacao bigint NOT NULL,
  empresa_id uuid NOT NULL,
  PRIMARY KEY(transacao,empresa_id)
);
REVOKE ALL ON obrix_conta_interna.contexto FROM PUBLIC,anon,authenticated;
ALTER TABLE obrix_conta_interna.contexto ENABLE ROW LEVEL SECURITY;
CREATE TABLE IF NOT EXISTS obrix_conta_interna.solicitacoes(
 empresa_id uuid PRIMARY KEY,
 usuario_id uuid NOT NULL UNIQUE,
 etapa text NOT NULL DEFAULT 'preparado'
   CHECK(etapa IN ('preparado','storage_concluido','banco_concluido','finalizado')),
 criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON obrix_conta_interna.solicitacoes FROM PUBLIC,anon,authenticated;
ALTER TABLE obrix_conta_interna.solicitacoes ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.obrix_proteger_financeiro_automatico()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_origem text := coalesce(old.origem,'manual');
  v_msg text;
  v_papel text;
begin
  -- Exceção exclusiva de remoção completa de empresa autorizada.
  -- Contexto de transação é criado somente pela RPC com service_role.
  if TG_OP='DELETE' and exists(
    select 1 from obrix_conta_interna.contexto ctx
    where ctx.transacao=txid_current() and ctx.empresa_id=old.empresa_id
  ) then return old; end if;
  if v_origem = 'manual' then
    return case when TG_OP='DELETE' then old else new end;
  end if;

  if TG_OP = 'DELETE' and old.status_lancamento = 'estornado' then
    select p.papel into v_papel from public.perfis p where p.id = auth.uid() limit 1;
    if coalesce(v_papel,'') in ('proprietario','administrador') then
      return old;
    end if;
  end if;

  v_msg := case v_origem
    when 'estoque' then 'Este lançamento foi gerado pelo Estoque. Faça o estorno em Estoque > Histórico.'
    when 'compra' then 'Este lançamento foi gerado por uma compra. Cancele ou estorne a compra no módulo Estoque.'
    when 'pagamento_equipe' then 'Este lançamento foi gerado por um pagamento da equipe. Faça o estorno pelo módulo Equipe.'
    else 'Este lançamento automático deve ser corrigido no módulo de origem.'
  end;

  if TG_OP = 'DELETE' then
    raise exception '%', v_msg;
  end if;

  if TG_OP = 'UPDATE' then
    if old.status_lancamento = 'ativo'
       and new.status_lancamento = 'estornado'
       and new.empresa_id is not distinct from old.empresa_id
       and new.obra_id is not distinct from old.obra_id
       and new.checklist_id is not distinct from old.checklist_id
       and new.tipo is not distinct from old.tipo
       and new.categoria is not distinct from old.categoria
       and new.descricao is not distinct from old.descricao
       and new.valor is not distinct from old.valor
       and new.data is not distinct from old.data
       and new.origem is not distinct from old.origem
       and new.pagamento_equipe_id is not distinct from old.pagamento_equipe_id
       and new.compra_id is not distinct from old.compra_id
       and new.estoque_movimentacao_id is not distinct from old.estoque_movimentacao_id then
      return new;
    end if;
    raise exception '%', v_msg;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION obrix_conta_interna.apagar_empresa(p_empresa_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_removidas integer;
  v_tabela record;
  v_restantes boolean;
BEGIN
  INSERT INTO obrix_conta_interna.contexto(transacao,empresa_id)
    VALUES(txid_current(),p_empresa_id);
  -- Financeiro antes dos pagamentos evita perda de vínculos e segue
  -- auditável pela exceção exclusiva desta transação de exclusão.
  DELETE FROM public.financeiro WHERE empresa_id=p_empresa_id;
  IF to_regclass('public.relatorio_fotos') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.relatorio_fotos WHERE empresa_id=$1' USING p_empresa_id;
  END IF;
  IF to_regclass('public.notas') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.notas WHERE empresa_id=$1' USING p_empresa_id;
  END IF;
  DELETE FROM public.empresas WHERE id=p_empresa_id;
  GET DIAGNOSTICS v_removidas=ROW_COUNT;
  IF v_removidas<>1 THEN RAISE EXCEPTION 'Empresa não removida integralmente.'; END IF;
  FOR v_tabela IN
    SELECT DISTINCT c.table_schema,c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema=c.table_schema AND t.table_name=c.table_name
    WHERE c.table_schema='public' AND c.column_name='empresa_id'
      AND t.table_type='BASE TABLE' AND c.table_name<>'empresas'
  LOOP
    EXECUTE format(
      'SELECT EXISTS(SELECT 1 FROM %I.%I WHERE empresa_id::text=$1)',
       v_tabela.table_schema,v_tabela.table_name)
      INTO v_restantes USING p_empresa_id::text;
    IF v_restantes THEN
      RAISE EXCEPTION 'Restaram dados da empresa na tabela %.',v_tabela.table_name;
    END IF;
  END LOOP;
  DELETE FROM obrix_conta_interna.contexto
   WHERE transacao=txid_current() AND empresa_id=p_empresa_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.obrix_excluir_empresa_dados_v1(p_empresa_id uuid, p_usuario_id uuid, p_simular boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_usuarios integer;
BEGIN
  IF p_empresa_id IS NULL OR p_usuario_id IS NULL THEN
    RAISE EXCEPTION 'Empresa e usuário obrigatórios.';
  END IF;
  PERFORM 1 FROM public.empresas WHERE id=p_empresa_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
  SELECT count(*) INTO v_usuarios
   FROM public.perfis WHERE empresa_id=p_empresa_id;
  IF v_usuarios<>1 OR NOT EXISTS(
    SELECT 1 FROM public.perfis WHERE empresa_id=p_empresa_id
     AND id=p_usuario_id AND papel IN ('proprietario','administrador')
  ) THEN
    RAISE EXCEPTION 'A exclusão total requer um único titular autorizado.';
  END IF;
  IF p_simular THEN
    BEGIN
      PERFORM obrix_conta_interna.apagar_empresa(p_empresa_id);
      -- Um RAISE/EXCEPTION nesta subtransação desfaz as exclusões,
      -- inclusive as cascatas de FK e o contexto transitório da trigger.
      RAISE EXCEPTION 'OBRIX_SIMULACAO_ROLLBACK_20261116';
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM='OBRIX_SIMULACAO_ROLLBACK_20261116' THEN
        RETURN jsonb_build_object('ok',true,'simulacao',true);
      END IF;
      RAISE;
    END;
  END IF;

  PERFORM obrix_conta_interna.apagar_empresa(p_empresa_id);
  RETURN jsonb_build_object('ok',true,'simulacao',false,'empresaRemovida',true);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.obrix_reservar_exclusao_v1(p_empresa_id uuid, p_usuario_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_etapa text;
 v_usuario uuid;
 v_qtd integer;
BEGIN
 IF p_empresa_id IS NULL OR p_usuario_id IS NULL THEN
   RAISE EXCEPTION 'Empresa e usuário são obrigatórios.';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_empresa_id::text,8102026));
 SELECT etapa,usuario_id INTO v_etapa,v_usuario
 FROM obrix_conta_interna.solicitacoes
 WHERE empresa_id=p_empresa_id FOR UPDATE;
 IF FOUND THEN
   IF v_usuario<>p_usuario_id THEN
     RAISE EXCEPTION 'Exclusão reservada para outro usuário.';
   END IF;
   RETURN jsonb_build_object('ok',true,'etapa',v_etapa,'retomada',true);
 END IF;
 PERFORM 1 FROM public.empresas WHERE id=p_empresa_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Empresa não encontrada.'; END IF;
 SELECT count(*) INTO v_qtd FROM public.perfis
 WHERE empresa_id=p_empresa_id;
 IF v_qtd<>1 OR NOT EXISTS (
   SELECT 1 FROM public.perfis
   WHERE empresa_id=p_empresa_id AND id=p_usuario_id
   AND papel IN ('proprietario','administrador')
 ) THEN RAISE EXCEPTION 'Exclusão exige um único titular autorizado.'; END IF;

 -- Verifica os DELETEs com rollback real antes de criar a solicitação.
 PERFORM public.obrix_excluir_empresa_dados_v1(
   p_empresa_id,p_usuario_id,true
 );
 INSERT INTO obrix_conta_interna.solicitacoes(empresa_id,usuario_id)
 VALUES(p_empresa_id,p_usuario_id);
 RETURN jsonb_build_object('ok',true,'etapa','preparado','retomada',false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.obrix_avancar_exclusao_v1(p_empresa_id uuid, p_usuario_id uuid, p_etapa text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_atual text;
 v_usuario uuid;
 v_ordem_atual integer;
 v_ordem_nova integer;
BEGIN
 IF p_empresa_id IS NULL OR p_usuario_id IS NULL
   OR p_etapa NOT IN ('storage_concluido','banco_concluido','finalizado') THEN
    RAISE EXCEPTION 'Parâmetros da exclusão inválidos.';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_empresa_id::text,8102026));
 SELECT etapa,usuario_id INTO v_atual,v_usuario
 FROM obrix_conta_interna.solicitacoes
 WHERE empresa_id=p_empresa_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Solicitação de exclusão inexistente.'; END IF;
 IF v_usuario<>p_usuario_id THEN RAISE EXCEPTION 'Usuário divergente da solicitação.'; END IF;
 v_ordem_atual:=CASE v_atual
   WHEN 'preparado' THEN 1 WHEN 'storage_concluido' THEN 2
   WHEN 'banco_concluido' THEN 3 WHEN 'finalizado' THEN 4 END;
 v_ordem_nova:=CASE p_etapa
   WHEN 'storage_concluido' THEN 2 WHEN 'banco_concluido' THEN 3
   WHEN 'finalizado' THEN 4 END;
 IF v_ordem_atual>=v_ordem_nova THEN
   RETURN jsonb_build_object('ok',true,'etapa',v_atual,'ja_aplicado',true);
 END IF;
 IF v_ordem_nova<>v_ordem_atual+1 THEN
   RAISE EXCEPTION 'Não é permitido pular uma etapa da exclusão.';
 END IF;
 IF p_etapa='banco_concluido' THEN
   -- Banco e checkpoint na mesma transação, logo ambos confirmam ou revertem.
   PERFORM public.obrix_excluir_empresa_dados_v1(
     p_empresa_id,p_usuario_id,false);
 END IF;
 UPDATE obrix_conta_interna.solicitacoes
 SET etapa=p_etapa,atualizado_em=now()
 WHERE empresa_id=p_empresa_id;
 RETURN jsonb_build_object('ok',true,'etapa',p_etapa,'ja_aplicado',false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.obrix_consultar_exclusao_v1(p_usuario_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_empresa uuid;
 v_etapa text;
BEGIN
 IF p_usuario_id IS NULL THEN
   RAISE EXCEPTION 'Usuário obrigatório.';
 END IF;
 SELECT empresa_id,etapa INTO v_empresa,v_etapa
   FROM obrix_conta_interna.solicitacoes
   WHERE usuario_id=p_usuario_id;
 IF NOT FOUND THEN
   RETURN jsonb_build_object('ok',false,'encontrado',false);
 END IF;
 RETURN jsonb_build_object(
  'ok',true,'encontrado',true,'empresa_id',v_empresa,'etapa',v_etapa
 );
END;
$function$
;
CREATE OR REPLACE FUNCTION obrix_conta_interna.bloquear_gravacoes_empresa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_empresa uuid;
 v_destino uuid;
 v_etapa text;
 v_contexto_autorizado boolean := false;
BEGIN
 IF TG_TABLE_NAME='empresas' THEN
   IF TG_OP='INSERT' THEN v_empresa:=NEW.id;
   ELSE v_empresa:=OLD.id;
   END IF;
   IF TG_OP='UPDATE' THEN v_destino:=NEW.id; END IF;
 ELSE
   IF TG_OP='INSERT' THEN v_empresa:=NEW.empresa_id;
   ELSE v_empresa:=OLD.empresa_id;
   END IF;
   IF TG_OP='UPDATE' THEN v_destino:=NEW.empresa_id; END IF;
 END IF;
 IF v_empresa IS NULL THEN
   -- Perfis em cadastro inicial e notificações globais podem não ter empresa.
   -- Ao vincular posteriormente a uma empresa, respeitar o bloqueio da exclusão.
   IF v_destino IS NULL THEN
     RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
   END IF;
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_destino::text,8102026));
   IF EXISTS(SELECT 1 FROM obrix_conta_interna.solicitacoes
      WHERE empresa_id=v_destino) THEN
     RAISE EXCEPTION 'Empresa de destino em exclusão. Gravação bloqueada.'
       USING ERRCODE='42501';
   END IF;
   RETURN NEW;
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_empresa::text,8102026));
 IF v_destino IS NOT NULL AND v_destino IS DISTINCT FROM v_empresa THEN
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_destino::text,8102026));
 END IF;
 SELECT EXISTS(
    SELECT 1 FROM obrix_conta_interna.contexto
    WHERE transacao=pg_catalog.txid_current() AND empresa_id=v_empresa
 ) INTO v_contexto_autorizado;
 IF v_contexto_autorizado THEN RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END; END IF;
 SELECT etapa INTO v_etapa
 FROM obrix_conta_interna.solicitacoes WHERE empresa_id=v_empresa;
 IF FOUND THEN
    RAISE EXCEPTION 'Empresa em exclusão (%). Nova gravação bloqueada.',v_etapa
      USING ERRCODE='42501';
 END IF;
 IF v_destino IS NOT NULL AND v_destino IS DISTINCT FROM v_empresa THEN
   SELECT etapa INTO v_etapa FROM obrix_conta_interna.solicitacoes
     WHERE empresa_id=v_destino;
   IF FOUND THEN RAISE EXCEPTION 'Empresa de destino em exclusão.'
       USING ERRCODE='42501'; END IF;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END;
$function$
;

-- Gatilhos atualizados de forma idempotente: reaplicar o SQL não gera
-- conflito por nome já existente. O CREATE OR REPLACE mantém a versão
-- exigida, sob a mesma transação de implantação; não remove outras triggers.
-- Analisar overhead e concorrência em produção antes de remover a guarda.
DO $triggers$
DECLARE tab record;
BEGIN
 FOR tab IN
  SELECT DISTINCT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t
       ON t.table_schema=c.table_schema AND t.table_name=c.table_name
   WHERE c.table_schema='public' AND c.column_name='empresa_id'
     AND t.table_type='BASE TABLE'
 LOOP
  EXECUTE format(
    'CREATE OR REPLACE TRIGGER obrix_exclusao_bloquear_gravacoes BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION obrix_conta_interna.bloquear_gravacoes_empresa()',
    tab.table_name);
 END LOOP;
END $triggers$;
CREATE OR REPLACE TRIGGER obrix_exclusao_bloquear_gravacoes
 BEFORE UPDATE OR DELETE ON public.empresas FOR EACH ROW
 EXECUTE FUNCTION obrix_conta_interna.bloquear_gravacoes_empresa();
CREATE OR REPLACE FUNCTION obrix_conta_interna.obrix_storage_upload_permitido(p_empresa_prefix text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_usuario uuid := auth.uid();
 v_empresa uuid;
BEGIN
 IF v_usuario IS NULL OR p_empresa_prefix IS NULL OR p_empresa_prefix !~
   '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
 THEN RETURN false; END IF;
 v_empresa := p_empresa_prefix::uuid;
 PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_empresa::text,8102026));
 IF NOT EXISTS (SELECT 1 FROM public.perfis
        WHERE id=v_usuario AND empresa_id=v_empresa)
 THEN RETURN false; END IF;
 RETURN NOT EXISTS (SELECT 1 FROM obrix_conta_interna.solicitacoes
       WHERE empresa_id=v_empresa);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.obrix_pagar_equipe_transacional_v2(p_funcionario_id uuid, p_data_pagamento date, p_diaria_ids uuid[], p_vale_ids uuid[], p_bonus_ids uuid[], p_obra_pagamento_id uuid DEFAULT NULL::uuid, p_liquido_esperado numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 v_empresa uuid := public.obrix_empresa_atual();
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
 if (select auth.uid()) is null or v_empresa is null or not public.obrix_acesso_total(v_empresa) then
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
 select nome into v_nome from public.funcionarios where id=p_funcionario_id and empresa_id=v_empresa;
 if not found then raise exception 'Funcionário não pertence à empresa atual.'; end if;
 select papel into v_papel from public.perfis where id=(select auth.uid()) and empresa_id=v_empresa;
 if coalesce(v_papel,'') not in ('proprietario','administrador') then raise exception 'Operação restrita ao proprietário ou administrador.'; end if;

 -- Lock the selected rows deterministically to serialize competing payments.
 perform 1 from public.diarias
  where id=any(v_diarias) and empresa_id=v_empresa order by id for update;
 perform 1 from public.vales
  where id=any(v_vales) and empresa_id=v_empresa order by id for update;
 perform 1 from public.bonus_extras
  where id=any(v_bonus) and empresa_id=v_empresa order by id for update;

 select count(*), coalesce(sum(valor_total),0) into v_qtd,v_total_d
 from public.diarias
 where id=any(v_diarias) and empresa_id=v_empresa and funcionario_id=p_funcionario_id and paga=false and cancelada_em is null
   and not exists(select 1 from public.pagamento_diarias pd where pd.diaria_id=diarias.id and pd.ativo);
 if v_qtd<>cardinality(v_diarias) then raise exception 'Diária inválida ou já paga. Atualize a equipe.'; end if;

 select count(*), coalesce(sum(valor),0) into v_qtd,v_total_v
 from public.vales
 where id=any(v_vales) and empresa_id=v_empresa and funcionario_id=p_funcionario_id and quitado=false and obra_id is not null and estornado_em is null
   and not exists(select 1 from public.pagamento_vales pv where pv.vale_id=vales.id and pv.ativo);
 if v_qtd<>cardinality(v_vales) then raise exception 'Vale inválido, sem obra ou já quitado.'; end if;

 select count(*), coalesce(sum(valor),0) into v_qtd,v_total_b
 from public.bonus_extras
 where id=any(v_bonus) and empresa_id=v_empresa and funcionario_id=p_funcionario_id and pago=false and obra_id is not null
   and not exists(select 1 from public.pagamento_bonus_extras pb where pb.bonus_extra_id=bonus_extras.id and pb.ativo);
 if v_qtd<>cardinality(v_bonus) then raise exception 'Bônus inválido, sem obra ou já pago.'; end if;

 v_bruto:=v_total_d+v_total_b;
 v_liquido:=v_bruto-v_total_v;
 if v_bruto<=0 or v_liquido<0 then raise exception 'Pagamento bruto zerado ou líquido negativo.'; end if;
 if p_liquido_esperado is not null and round(p_liquido_esperado,2)<>v_liquido then
   raise exception 'O valor calculado foi alterado. Atualize a folha.';
 end if;

 -- Important: only the selected, tenant-validated records may enter the distribution.
 with dist as (
  select obra_id,valor_total::numeric valor from public.diarias where id=any(v_diarias) and empresa_id=v_empresa
  union all
  select obra_id,valor::numeric from public.bonus_extras where id=any(v_bonus) and empresa_id=v_empresa
  union all
  select obra_id,(-valor)::numeric from public.vales where id=any(v_vales) and empresa_id=v_empresa
 )
 select exists(select 1 from dist group by obra_id having sum(valor)<0) into v_obra_negativa;

 if v_obra_negativa and v_liquido>0 then
   -- If one worksite has a net negative, the user chooses a site with gross earnings.
   with bruto as (
     select obra_id from public.diarias where id=any(v_diarias) and empresa_id=v_empresa
     union all
     select obra_id from public.bonus_extras where id=any(v_bonus) and empresa_id=v_empresa
   )
   select count(distinct obra_id),min(obra_id::text)::uuid into v_qtd,v_obra_destino from bruto;
   if v_qtd=1 and p_obra_pagamento_id is null then
     null;
   else
     v_obra_destino:=p_obra_pagamento_id;
     select exists(
       select 1 from (
         select obra_id from public.diarias where id=any(v_diarias) and empresa_id=v_empresa
         union all
         select obra_id from public.bonus_extras where id=any(v_bonus) and empresa_id=v_empresa
       ) bruto where bruto.obra_id=v_obra_destino
     ) into v_destino_valido;
     if not coalesce(v_destino_valido,false) then
        raise exception 'Selecione uma obra com diária ou bônus neste pagamento.';
     end if;
   end if;
 end if;


 -- Vales históricos sem lançamento: reconciliação na mesma transação.
 if cardinality(v_vales)>0 then
   if exists(select 1 from public.financeiro f
     where f.empresa_id=v_empresa and f.vale_id=any(v_vales)
       and f.origem='vale_equipe' and f.status_lancamento='estornado') then
     raise exception 'Vale com lançamento estornado no Financeiro. Revise o histórico.';
   end if;
   if exists(select 1 from public.financeiro f
     where f.empresa_id=v_empresa and f.vale_id=any(v_vales)
       and f.status_lancamento='ativo'
     group by f.vale_id having count(*)>1) then
     raise exception 'Vale duplicado no Financeiro. Revise o histórico.';
   end if;
   insert into public.financeiro(
     empresa_id,obra_id,checklist_id,checklist_ids,checklist_valores,
     tipo,categoria,descricao,valor,data,origem,vale_id,status_lancamento,observacoes)
   select v_empresa,v.obra_id,v.checklist_id,
       case when v.checklist_id is null then '{}'::uuid[] else array[v.checklist_id] end,
       case when v.checklist_id is null then '{}'::jsonb else jsonb_build_object(v.checklist_id::text,round(v.valor,2)) end,
       'despesa','mao_de_obra','Vale da equipe - '||v_nome,
       v.valor,v.data,'vale_equipe',v.id,'ativo',v.observacoes
   from public.vales v
   where v.empresa_id=v_empresa and v.id=any(v_vales)
       and not exists(select 1 from public.financeiro f
         where f.empresa_id=v_empresa and f.vale_id=v.id
           and f.origem='vale_equipe' and f.status_lancamento='ativo');
 end if;

 insert into public.pagamentos_equipe(
  empresa_id,funcionario_id,valor_diarias,valor_bonus_extras,valor_vales,valor_bruto,valor_liquido,data_pagamento
 ) values(v_empresa,p_funcionario_id,v_total_d,v_total_b,v_total_v,v_bruto,v_liquido,p_data_pagamento)
 returning id into v_pagamento;

 if cardinality(v_diarias)>0 then
   insert into public.pagamento_diarias(empresa_id,pagamento_id,diaria_id,obra_id,valor)
    select v_empresa,v_pagamento,id,obra_id,valor_total from public.diarias where id=any(v_diarias) and empresa_id=v_empresa;
   update public.diarias set paga=true,pago_em=now() where id=any(v_diarias) and empresa_id=v_empresa;
 end if;
 if cardinality(v_vales)>0 then
   insert into public.pagamento_vales(empresa_id,pagamento_id,vale_id,valor)
    select v_empresa,v_pagamento,id,valor from public.vales where id=any(v_vales) and empresa_id=v_empresa;
   update public.vales set quitado=true,quitado_em=now() where id=any(v_vales) and empresa_id=v_empresa;
 end if;
 if cardinality(v_bonus)>0 then
   insert into public.pagamento_bonus_extras(empresa_id,pagamento_id,bonus_extra_id,valor)
    select v_empresa,v_pagamento,id,valor from public.bonus_extras where id=any(v_bonus) and empresa_id=v_empresa;
   update public.bonus_extras set pago=true,pago_em=now() where id=any(v_bonus) and empresa_id=v_empresa;
 end if;

 if v_liquido>0 then
   if v_obra_negativa then
     insert into public.financeiro(empresa_id,obra_id,tipo,categoria,descricao,valor,data,origem,pagamento_equipe_id,status_lancamento,observacoes)
     values(v_empresa,v_obra_destino,'despesa','mao_de_obra','Pagamento de equipe - '||v_nome,v_liquido,p_data_pagamento,'pagamento_equipe',v_pagamento,'ativo',
     'Compensação de vales entre obras de origem; obra escolhida para pagamento líquido.');
   else

     insert into public.financeiro(
       empresa_id,obra_id,tipo,categoria,descricao,valor,data,origem,pagamento_equipe_id,
       status_lancamento,checklist_id,checklist_ids,checklist_valores)
     with dist as (
       select obra_id,checklist_id,valor_total::numeric valor from public.diarias
         where id=any(v_diarias) and empresa_id=v_empresa
       union all
       select obra_id,checklist_id,valor::numeric from public.bonus_extras
         where id=any(v_bonus) and empresa_id=v_empresa
       union all
       select obra_id,checklist_id,(-valor)::numeric from public.vales
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
 from public.financeiro where empresa_id=v_empresa and pagamento_equipe_id=v_pagamento
   and status_lancamento='ativo' and origem='pagamento_equipe';
 if v_valor_financeiro<>v_liquido then
   raise exception 'Falha no rateio financeiro: total % não corresponde ao pagamento %.',v_valor_financeiro,v_liquido;
 end if;
 return jsonb_build_object('ok',true,'pagamento_id',v_pagamento,'valor_bruto',v_bruto,'valor_vales',v_total_v,
     'valor_liquido',v_liquido,'qtd_lancamentos',v_linhas,'compensacao_entre_obras',v_obra_negativa);
end;
$function$
;

-- Toda RPC de exclusão é restrita a service_role; somente a validação de upload
-- é acessível ao papel authenticated a partir das políticas do Storage.
REVOKE ALL ON FUNCTION public.obrix_excluir_empresa_dados_v1(uuid,uuid,boolean)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.obrix_reservar_exclusao_v1(uuid,uuid)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.obrix_avancar_exclusao_v1(uuid,uuid,text)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.obrix_consultar_exclusao_v1(uuid)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_excluir_empresa_dados_v1(uuid,uuid,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.obrix_reservar_exclusao_v1(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.obrix_avancar_exclusao_v1(uuid,uuid,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.obrix_consultar_exclusao_v1(uuid) TO service_role;

REVOKE ALL ON FUNCTION obrix_conta_interna.apagar_empresa(uuid)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION obrix_conta_interna.bloquear_gravacoes_empresa()
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION obrix_conta_interna.obrix_storage_upload_permitido(text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION obrix_conta_interna.obrix_storage_upload_permitido(text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.obrix_pagar_equipe_transacional_v2(
  uuid,date,uuid[],uuid[],uuid[],uuid,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.obrix_pagar_equipe_transacional_v2(
  uuid,date,uuid[],uuid[],uuid[],uuid,numeric) TO authenticated;
-- Não REVOGAR gravações diretas enquanto o fluxo novo não for validado e ativado.

-- Políticas recriadas atomicamente para permitir reaplicação após sucesso.
-- Não altera políticas anteriores. AS RESTRICTIVE faz interseção com todas
-- permissões existentes: bloqueia uploads concorrentes somente nesses buckets.
DROP POLICY IF EXISTS obrix_exclusao_restricao_upload ON storage.objects;
CREATE POLICY obrix_exclusao_restricao_upload
ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (
 bucket_id NOT IN ('obrix-documentos','obrix-fotos','relatorio-fotografico')
 OR obrix_conta_interna.obrix_storage_upload_permitido(
       (storage.foldername(name))[1])
);
DROP POLICY IF EXISTS obrix_exclusao_restricao_alteracao ON storage.objects;
CREATE POLICY obrix_exclusao_restricao_alteracao
ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
USING (
 bucket_id NOT IN ('obrix-documentos','obrix-fotos','relatorio-fotografico')
 OR obrix_conta_interna.obrix_storage_upload_permitido(
       (storage.foldername(name))[1])
)
WITH CHECK (
 bucket_id NOT IN ('obrix-documentos','obrix-fotos','relatorio-fotografico')
 OR obrix_conta_interna.obrix_storage_upload_permitido(
       (storage.foldername(name))[1])
);
COMMIT;
