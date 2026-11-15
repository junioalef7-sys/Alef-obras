-- OBRIX | Proposta de protecao transacional para diarias e faltas.
-- SOMENTE PREPARADO: nao executar no banco oficial antes da homologacao e autorizacao.
-- Protege novas gravacoes mesmo com historico legado conflitante (nao exclui nem reescreve dados).
-- O lock transacional impede que dois aparelhos insiram registros concorrentes do mesmo funcionario/dia.
--
-- Regras:
-- (1) maximo uma falta, justificada ou nao, por empresa/funcionario/data;
-- (2) nao misturar falta e diaria na mesma data;
-- (3) maximo uma diaria inteira ou duas meias diarias, somando 1.
-- (4) diario cancelado (cancelada_em IS NOT NULL) nao consome o limite.

create or replace function public.obrix_validar_registro_equipe_por_dia()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  total_diarias numeric;
begin
  -- Serializa faltas e diarias por empresa + funcionario + data (obras diferentes inclusas).
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      new.empresa_id::text || ':' || new.funcionario_id::text || ':' || new.data::text, 0
    )
  );

  if tg_table_name = 'faltas' then
    if exists(
      select 1 from public.faltas f
      where f.empresa_id = new.empresa_id
        and f.funcionario_id = new.funcionario_id
        and f.data = new.data
        and f.id <> new.id
    ) then
      raise exception using
        errcode = '23505',
        message = 'Este funcionario ja possui uma falta registrada nesta data.';
    end if;

    if exists(
      select 1 from public.diarias d
      where d.empresa_id = new.empresa_id
        and d.funcionario_id = new.funcionario_id
        and d.data = new.data
        and d.cancelada_em is null
    ) then
      raise exception using
        errcode = '23514',
        message = 'Nao e possivel registrar falta: ja existe diaria nesta data.';
    end if;

  elsif tg_table_name = 'diarias' then
    -- Permite cancelar uma diaria mesmo quando existem registros historicos em conflito.
    if new.cancelada_em is not null then
      return new;
    end if;

    if new.quantidade not in (0.5, 1) then
      raise exception using
        errcode = '23514',
        message = 'A diaria deve ser inteira ou meia diaria.';
    end if;

    if exists(
      select 1 from public.faltas f
      where f.empresa_id = new.empresa_id
        and f.funcionario_id = new.funcionario_id
        and f.data = new.data
    ) then
      raise exception using
        errcode = '23514',
        message = 'Nao e possivel registrar diaria: ja existe falta nesta data.';
    end if;

    select coalesce(sum(d.quantidade), 0)
      into total_diarias
    from public.diarias d
    where d.empresa_id = new.empresa_id
      and d.funcionario_id = new.funcionario_id
      and d.data = new.data
      and d.cancelada_em is null
      and d.id <> new.id;

    if total_diarias + new.quantidade > 1 then
      raise exception using
        errcode = '23514',
        message = 'Limite diario atingido: uma diaria inteira ou duas meias diarias.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists obrix_faltas_um_registro_por_dia on public.faltas;
create trigger obrix_faltas_um_registro_por_dia
before insert or update of empresa_id, funcionario_id, data
on public.faltas
for each row execute function public.obrix_validar_registro_equipe_por_dia();

drop trigger if exists obrix_diarias_limite_por_dia on public.diarias;
create trigger obrix_diarias_limite_por_dia
before insert or update of empresa_id, funcionario_id, data, quantidade, cancelada_em
on public.diarias
for each row execute function public.obrix_validar_registro_equipe_por_dia();
