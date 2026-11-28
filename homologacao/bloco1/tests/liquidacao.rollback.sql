begin;
do $test$
declare emp uuid; ass uuid; pag uuid; r jsonb; m text; plano text; cents integer; origem text; estado text; ref text; inicio timestamptz; fim timestamptz; esperado timestamptz; scenario text; falhou boolean;
begin
 foreach m in array array['pix','cartao','boleto'] loop
 foreach plano in array array['mensal','anual'] loop
 insert into public.empresas(nome) values('FIXTURE TRANSACIONAL BLOCO 1') returning id into emp;
 insert into public.assinaturas(empresa_id,trial_inicio,trial_fim) values(emp,now()-interval '8 days',now()-interval '1 day') on conflict (empresa_id) do update set trial_inicio=excluded.trial_inicio,trial_fim=excluded.trial_fim returning id into ass;
 cents:=case when plano='mensal' then 3990 else 39900 end;
 ref:=case when m='pix' then 'E'||left(replace(gen_random_uuid()::text,'-',''),31) else gen_random_uuid()::text end;
 origem:=case when m='pix' then 'pix-h' else 'cobrancas-h' end;
 estado:=case when m='pix' then 'CONCLUIDA' else 'paid' end;
 insert into public.pagamentos_assinatura(empresa_id,assinatura_id,provedor,metodo,plano,valor,idempotency_key,provedor_preferencia_id,provedor_pagamento_id,detalhes)
 values(emp,ass,'efi',m,plano,cents/100.0,gen_random_uuid()::text,ref,ref,'{"serie":"bloco1-hml-v1","homologacao_teste":true}') returning id into pag;
 foreach scenario in array array['valor','moeda','origem','empresa','pendente','recusado','cancelado','baixa manual','identificador'] loop
 falhou:=false;
 begin
 perform public.obrix_hml_liquidar_v1(pag,case when scenario='empresa' then gen_random_uuid() else emp end,case when scenario='origem' then 'interna' else origem end,case when scenario='identificador' then 'outro' else ref end,ref,case when scenario='valor' then 100 else cents end,case when scenario='moeda' then 'USD' else 'BRL' end,case scenario when 'baixa manual' then 'settled' when 'pendente' then 'waiting' when 'recusado' then 'unpaid' when 'cancelado' then 'canceled' else estado end);
 exception when raise_exception or no_data_found then falhou:=true;
 end;
 if not falhou then raise exception 'Cenário indevidamente aceito: %',scenario; end if;
 end loop;
 if exists(select 1 from private.obrix_hml_liquidacoes_v1 where pagamento_id=pag) then raise exception 'Efeito parcial'; end if;
 -- Cada meio cobre uma situação de assinatura diferente.
 if m='boleto' then update public.assinaturas set status='ativo',plano='permanente' where id=ass;
 elsif m='cartao' then update public.assinaturas set status='ativo',plano='mensal',periodo_inicio=now(),periodo_fim=now()+interval '17 days' where id=ass;
 end if;
 r:=public.obrix_hml_liquidar_v1(pag,emp,origem,ref,ref,cents,'BRL',estado);
 if r->>'duplicado'<>'false' then raise exception 'Primeira aplicação inválida'; end if;
 select periodo_fim into fim from public.assinaturas where id=ass;
 inicio:=now()+case when m='cartao' then interval '17 days' else interval '0 days' end;
 esperado:=inicio+case when plano='mensal' then interval '1 month' else interval '1 year' end;
 if m='boleto' then
 if not exists(select 1 from public.assinaturas where id=ass and public.assinaturas.plano='permanente' and periodo_fim is null) then raise exception 'Permanente alterado'; end if;
 elsif fim is distinct from esperado then raise exception 'Vencimento incorreto'; end if;
 r:=public.obrix_hml_liquidar_v1(pag,emp,origem,ref,ref,cents,'BRL',estado);
 if r->>'duplicado'<>'true' or (select periodo_fim from public.assinaturas where id=ass) is distinct from fim then raise exception 'Duplicação'; end if;
 end loop;end loop;
end;
$test$;
rollback;
