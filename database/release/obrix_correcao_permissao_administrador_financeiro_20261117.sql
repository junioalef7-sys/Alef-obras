-- OBRIX | Correção pontual de autorização financeira | 17/11/2026
-- Conferida no Supabase de homologação isolado.
-- O domínio de perfis.papel aceita 'proprietario', 'administrador' e 'usuario'.
-- O trigger anterior aceitava 'admin', rótulo que não existe na constraint.
--
-- Aplicar ao oficial somente na janela de atualização aprovada, após
-- confirmação do backup, conferência da função atual e teste de regressão.
-- CREATE OR REPLACE preserva a assinatura, os privilégios e os triggers.
-- Não altera tabelas, contas, pagamentos ou registros financeiros.

CREATE OR REPLACE FUNCTION public.obrix_guard_sensitive_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := (select auth.uid());
  v_papel text;
begin
  -- Rotinas internas confiáveis (service role/migrations) não possuem auth.uid().
  if v_uid is null then
    return case when TG_OP = 'DELETE' then old else new end;
  end if;

  select p.papel
    into v_papel
    from public.perfis p
   where p.id = v_uid
   limit 1;

  -- O papel reconhecido no cadastro é 'administrador', e não 'admin'.
  if coalesce(v_papel, '') not in ('proprietario', 'administrador') then
    raise exception 'Operação restrita ao proprietário ou administrador da empresa.';
  end if;

  return case when TG_OP = 'DELETE' then old else new end;
end;
$function$;
