-- OBRIX | PROPOSTA DE REVERSÃO | NAO EXECUTAR AUTOMATICAMENTE
-- Este roteiro só pode ser executado após restaurar a Edge Function e a UI
-- anteriores, confirmar que NAO há exclusões em andamento e autorizar
-- explicitamente rollback. Nenhuma tabela de dados de clientes é apagada.
BEGIN;
DO $abort$ BEGIN
 RAISE EXCEPTION 'OBRIX ROLLBACK BLOCKED: requer aprovacao e validação de estado';
END $abort$;

DO $pendente$
BEGIN
 IF EXISTS(SELECT 1 FROM obrix_conta_interna.solicitacoes
           WHERE etapa <> 'finalizado') THEN
   RAISE EXCEPTION 'Exclusões pendentes: rollback recusado.';
 END IF;
END $pendente$;

DROP POLICY IF EXISTS obrix_exclusao_restricao_upload ON storage.objects;
DROP POLICY IF EXISTS obrix_exclusao_restricao_alteracao ON storage.objects;

DO $trig$
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
    'DROP TRIGGER IF EXISTS obrix_exclusao_bloquear_gravacoes ON public.%I',
    tab.table_name);
 END LOOP;
END $trig$;
DROP TRIGGER IF EXISTS obrix_exclusao_bloquear_gravacoes ON public.empresas;

-- Restaura EXATAMENTE o gatilho financeiro do ponto oficial 92495c4.
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
  if v_origem = 'manual' then
    return case when TG_OP='DELETE' then old else new end;
  end if;

  if TG_OP = 'DELETE' and old.status_lancamento = 'estornado' then
    select p.papel into v_papel from public.perfis p where p.id = auth.uid() limit 1;
    if coalesce(v_papel,'') in ('proprietario','admin') then
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
$function$;

REVOKE ALL ON FUNCTION public.obrix_pagar_equipe_transacional_v2(
 uuid,date,uuid[],uuid[],uuid[],uuid,numeric) FROM authenticated,anon,PUBLIC;
DROP FUNCTION IF EXISTS public.obrix_pagar_equipe_transacional_v2(
 uuid,date,uuid[],uuid[],uuid[],uuid,numeric);

DROP FUNCTION IF EXISTS public.obrix_consultar_exclusao_v1(uuid);
DROP FUNCTION IF EXISTS public.obrix_avancar_exclusao_v1(uuid,uuid,text);
DROP FUNCTION IF EXISTS public.obrix_reservar_exclusao_v1(uuid,uuid);
DROP FUNCTION IF EXISTS public.obrix_excluir_empresa_dados_v1(uuid,uuid,boolean);

-- NÃO DROP SCHEMA: manter journal e contexto para auditoria.
-- O schema privado fica inacessível ao cliente e pode ser removido por
-- migração separada, após revisão de retenção e conformidade.
REVOKE EXECUTE ON FUNCTION obrix_conta_interna.obrix_storage_upload_permitido(text)
 FROM authenticated;
COMMIT;
