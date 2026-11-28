-- Somente no projeto xavwkfgrnowmusbkbiea. A Efí é consultada pelo backend.
create table private.obrix_hml_liquidacoes_v1 (
  pagamento_id uuid primary key references public.pagamentos_assinatura(id),
  origem text not null check (origem in ('pix-h','cobrancas-h')),
  referencia text not null,
  valor_centavos integer not null check (valor_centavos in (3990,39900)),
  confirmado_em timestamptz not null default now(),
  unique (origem,referencia)
);
alter table private.obrix_hml_liquidacoes_v1 enable row level security;
revoke all on private.obrix_hml_liquidacoes_v1 from public,anon,authenticated;

create function public.obrix_hml_liquidar_v1(p_id uuid,p_empresa uuid,p_origem text,p_cobranca text,p_referencia text,p_centavos integer,p_moeda text,p_status text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  pag public.pagamentos_assinatura%rowtype;
  ass public.assinaturas%rowtype;
  anterior private.obrix_hml_liquidacoes_v1%rowtype;
  preco numeric;
  inicio timestamptz;
  fim timestamptz;
begin
  select * into strict pag from public.pagamentos_assinatura where id=p_id and empresa_id=p_empresa for update;
  if pag.provedor is distinct from 'efi' or pag.detalhes->>'serie' is distinct from 'bloco1-hml-v1'
     or pag.detalhes->'homologacao_teste' is distinct from 'true'::jsonb or pag.detalhes ? 'simulado'
     or p_moeda is distinct from 'BRL' or pag.moeda is distinct from 'BRL'
     or p_referencia is null or length(trim(p_referencia)) not between 1 and 128 then
    raise exception 'Origem ou moeda inválida';
  end if;
  if pag.metodo='pix' then
    if p_origem is distinct from 'pix-h' or p_status is distinct from 'CONCLUIDA' or
       p_cobranca is distinct from pag.provedor_preferencia_id or p_cobranca is null or
       p_referencia !~ '^E[0-9A-Za-z]{31}$' then raise exception 'Pix sem comprovação integral'; end if;
  elsif pag.metodo in ('cartao','boleto') then
    if p_origem is distinct from 'cobrancas-h' or p_status is distinct from 'paid' or
       p_cobranca is distinct from pag.provedor_pagamento_id or p_referencia is distinct from p_cobranca then
      raise exception 'Cobrança sem liquidação financeira';
    end if;
  else raise exception 'Método inválido'; end if;
  select valor into strict preco from public.planos_assinatura where codigo=pag.plano and ativo for share;
  if p_centavos is distinct from (case pag.plano when 'mensal' then 3990 when 'anual' then 39900 else -1 end)
     or preco*100 is distinct from p_centavos::numeric or pag.valor is distinct from preco then
     raise exception 'Valor divergente'; end if;
  if pag.revertido_em is not null or pag.status in ('reembolsado','estornado','cancelado') then
    raise exception 'Pagamento encerrado'; end if;
  select * into anterior from private.obrix_hml_liquidacoes_v1 where pagamento_id=p_id;
  if found then
    if anterior.referencia is distinct from p_referencia or anterior.origem is distinct from p_origem then
      raise exception 'Referência divergente'; end if;
    return jsonb_build_object('aplicado',true,'duplicado',true);
  end if;
  if pag.aplicado_em is not null then raise exception 'Pagamento já aplicado por outro fluxo'; end if;
  select * into strict ass from public.assinaturas where id=pag.assinatura_id and empresa_id=p_empresa for update;
  insert into private.obrix_hml_liquidacoes_v1(pagamento_id,origem,referencia,valor_centavos)
    values(p_id,p_origem,p_referencia,p_centavos);
  if ass.plano is distinct from 'permanente' then
    inicio:=greatest(now(),case when ass.status='ativo' then ass.periodo_fim when ass.status='teste' then ass.trial_fim end);
    fim:=inicio+case when pag.plano='anual' then interval '1 year' else interval '1 month' end;
    update public.assinaturas set plano=pag.plano,status='ativo',
      periodo_inicio=case when ass.status='ativo' and ass.periodo_fim>now() then coalesce(ass.periodo_inicio,inicio) else inicio end,
      periodo_fim=fim,provedor_pagamento='efi',atualizado_em=now() where id=ass.id;
  end if;
  update public.pagamentos_assinatura set status='aprovado',aprovado_em=now(),aplicado_em=now(),
    periodo_concedido_inicio=inicio,periodo_concedido_fim=fim,atualizado_em=now() where id=p_id;
  return jsonb_build_object('aplicado',true,'duplicado',false,'periodo_fim',fim);
end;
$$;
revoke all on function public.obrix_hml_liquidar_v1(uuid,uuid,text,text,text,integer,text,text) from public,anon,authenticated;
grant execute on function public.obrix_hml_liquidar_v1(uuid,uuid,text,text,text,integer,text,text) to service_role;
