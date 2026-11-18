-- OBRIX | 18/11/2026 | HOMOLOGAÇÃO ISOLADA.
-- Planos comerciais somente como fixtures INATIVAS até conclusão
-- da integração Efí de sandbox e dos testes de webhook.
-- Projeto exclusivo: xavwkfgrnowmusbkbiea. Não aplicar ao oficial.
INSERT INTO public.planos_assinatura
  (codigo,nome,descricao,valor,periodo,ativo,destaque,ordem)
VALUES
  ('mensal','Plano Mensal','Acesso completo ao OBRIX por 1 mês',39.90,'mensal',false,true,1),
  ('anual','Plano Anual','Acesso completo ao OBRIX por 1 ano',399.00,'anual',false,false,2)
ON CONFLICT (codigo) DO UPDATE
SET nome=EXCLUDED.nome,
    descricao=EXCLUDED.descricao,
    valor=EXCLUDED.valor,
    periodo=EXCLUDED.periodo,
    destaque=EXCLUDED.destaque,
    ordem=EXCLUDED.ordem,
    ativo=false,
    atualizado_em=now();
