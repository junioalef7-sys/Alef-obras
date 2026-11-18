-- Homologação OBRIX 18/11/2026, somente banco isolado xavwkfgrnowmusbkbiea.
-- Espelho isolado dos eventos de pagamento, sem clientes/requisições à Efí.
-- Functions executadas apenas por proprietário/admin no ensaio SQL; não expostas no Data API.
CREATE TABLE IF NOT EXISTS private.pagamento_eventos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 pagamento_id uuid NULL REFERENCES public.pagamentos_assinatura(id) ON DELETE SET NULL,
 provedor text NOT NULL,
 evento_id text NOT NULL,
 tipo text NULL,
 payload jsonb NOT NULL DEFAULT '{}'::jsonb,
 processado boolean NOT NULL DEFAULT false,
 erro text NULL,
 recebido_em timestamptz NOT NULL DEFAULT now(),
 processado_em timestamptz NULL,
 CONSTRAINT pagamento_eventos_provedor_evento_id_key UNIQUE(provedor,evento_id)
);
ALTER TABLE private.pagamento_eventos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.pagamento_eventos FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION private.obrix_hml_finalizar_evento_pagamento_v2(p_provedor text, p_evento_id text, p_pagamento_id uuid DEFAULT NULL::uuid, p_erro text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update private.pagamento_eventos
  set pagamento_id = coalesce(p_pagamento_id, pagamento_id),
      processado = (p_erro is null),
      erro = p_erro,
      processado_em = now()
  where provedor = lower(trim(p_provedor))
    and evento_id = p_evento_id;
end;
$function$;

CREATE OR REPLACE FUNCTION private.obrix_hml_registrar_evento_pagamento_v2(p_provedor text, p_evento_id text, p_tipo text, p_payload jsonb, p_pagamento_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id uuid;
begin
  if coalesce(trim(p_provedor), '') = '' then
    raise exception 'Provedor obrigatório.';
  end if;
  if coalesce(trim(p_evento_id), '') = '' then
    raise exception 'Identificador do evento obrigatório.';
  end if;

  insert into private.pagamento_eventos (
    pagamento_id, provedor, evento_id, tipo, payload
  ) values (
    p_pagamento_id, lower(trim(p_provedor)), p_evento_id, p_tipo, coalesce(p_payload, '{}'::jsonb)
  )
  on conflict (provedor, evento_id) do update
    set payload = excluded.payload,
        tipo = excluded.tipo,
        pagamento_id = coalesce(private.pagamento_eventos.pagamento_id, excluded.pagamento_id),
        erro = null
    where private.pagamento_eventos.processado = false
  returning id into v_id;

  return v_id is not null;
end;
$function$;

REVOKE ALL ON FUNCTION private.obrix_hml_registrar_evento_pagamento_v2(text,text,text,jsonb,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.obrix_hml_finalizar_evento_pagamento_v2(text,text,uuid,text) FROM PUBLIC,anon,authenticated;
