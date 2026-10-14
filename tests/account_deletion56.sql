begin;
do $$
declare uid uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); r jsonb; blocked boolean;
begin
 insert into auth.users(id,email) values(uid,uid::text||'@example.invalid'),(other_id,other_id::text||'@example.invalid');
 insert into public.edifiq_assinaturas(empresa_user_id,status,trial_inicio,trial_fim)values(uid,'trial',now()-interval '8 days',now()-interval '1 day');
 insert into public.obras(id,user_id,nome) values(981560000000001,uid,'Fixture própria'),(981560000000002,other_id,'Fixture alheia');
 perform set_config('request.jwt.claim.sub',uid::text,true);
 blocked:=false;begin perform public.edifiq_excluir_minha_conta('ERRADO',null);exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'Confirmação não exigida';end if;
 blocked:=false;begin delete from public.obras where id=981560000000001;exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'Limite foi liberado fora da exclusão';end if;
 r:=public.edifiq_excluir_minha_conta('EXCLUIR MINHA CONTA','fixture');
 if not (r->>'deleted')::boolean or exists(select 1 from auth.users where id=uid) or exists(select 1 from public.obras where user_id=uid) then raise exception 'Exclusão incompleta';end if;
 if not exists(select 1 from public.obras where id=981560000000002) or not exists(select 1 from auth.users where id=other_id) then raise exception 'Outra conta foi atingida';end if;
 blocked:=false;begin insert into public.obras(id,user_id,nome)values(981560000000003,uid,'Sessão antiga');exception when raise_exception then blocked:=true;end;
 if not blocked then raise exception 'Sessão excluída conseguiu gravar';end if;
 if exists(select 1 from edifiq_private.account_deletion_context56 where user_id=uid) then raise exception 'Contexto de exclusão permaneceu';end if;
end $$;
select 'Exclusão em conta vencida, confirmação, isolamento e sessão excluída: aprovados; teste revertido' as resultado;
rollback;
