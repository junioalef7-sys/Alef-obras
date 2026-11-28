create function public.obrix_hml_estado_efi_v1(p_id uuid,p_empresa uuid,p_cobranca text,p_estado text)
returns void language plpgsql security definer set search_path='' as $$
declare p public.pagamentos_assinatura%rowtype; novo text;
begin
 select * into strict p from public.pagamentos_assinatura where id=p_id and empresa_id=p_empresa for update;
 if p.provedor is distinct from 'efi' or p.detalhes->>'serie' is distinct from 'bloco1-hml-v1' or
    p.detalhes->'homologacao_teste' is distinct from 'true'::jsonb or p_cobranca is null or
    p_cobranca is distinct from (case when p.metodo='pix' then p.provedor_preferencia_id else p.provedor_pagamento_id end) then
    raise exception 'Cobrança fora do escopo'; end if;
 novo:=case p_estado when 'refunded' then 'reembolsado' when 'DEVOLVIDO' then 'reembolsado'
   when 'contested' then 'estornado' when 'canceled' then 'cancelado' when 'REMOVIDA_PELO_USUARIO_RECEBEDOR' then 'cancelado'
   when 'REMOVIDA_PELO_PSP' then 'cancelado' when 'expired' then 'expirado' when 'unpaid' then 'rejeitado'
   when 'approved' then 'processando' when 'identified' then 'processando' when 'settled' then 'pendente'
   when 'waiting' then 'pendente' when 'ATIVA' then 'pendente' when 'link' then 'pendente' when 'new' then 'pendente' end;
 if novo is null then raise exception 'Estado desconhecido'; end if;
 if p.revertido_em is not null or p.status in ('reembolsado','estornado','cancelado') then return; end if;
 if p.aplicado_em is not null then
   if novo not in ('reembolsado','estornado','cancelado') then return; end if;
   perform private.obrix_reverter_pagamento_assinatura_hml_ensaio(p_id,'Efí sandbox: '||p_estado);
 end if;
 update public.pagamentos_assinatura set status=novo,atualizado_em=now() where id=p_id and status is distinct from novo;
end;
$$;
revoke all on function public.obrix_hml_estado_efi_v1(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.obrix_hml_estado_efi_v1(uuid,uuid,text,text) to service_role;
