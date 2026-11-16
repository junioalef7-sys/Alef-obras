-- OBRIX | PROPOSTA NÃO APLICADA AO BANCO | 2026-11-16
-- Escopo: bloquear DELETE direto nas quatro tabelas do histórico de
-- pagamentos da equipe, sem alterar as permissões atuais de INSERT/SELECT.
-- Executar APENAS em uma cópia de testes do Supabase após aprovação.
-- Não usar como migração automática de produção.
--
-- Por quê:
--   authenticated atualmente possui DELETE nessas tabelas; as políticas
--   filtram por empresa e o trigger exige proprietário/admin, porém
--   um usuário com esse papel pode contornar a trilha de estorno.
--   pagamento_diarias/vales/bonus_extras -> pagamentos_equipe ON DELETE CASCADE;
--   financeiro.pagamento_equipe_id -> pagamentos_equipe ON DELETE SET NULL.
--   Excluir um pagamento pode, portanto, remover vínculos sem reabrir pendências.
--
-- Compatibilidade prevista:
--   obrix-equipe-liquidacao-segura.js usa INSERT nessas tabelas
--   e obrix_estornar_pagamento_equipe usa UPDATE, não DELETE.
--   Esta proposta mantém INSERT e UPDATE intactos; ainda exige
--   teste de pagamento, estorno, exclusão de conta e backup em homologação.

REVOKE DELETE ON TABLE
  public.pagamentos_equipe,
  public.pagamento_diarias,
  public.pagamento_vales,
  public.pagamento_bonus_extras
FROM authenticated;

-- Verificação somente de leitura APÓS aplicação na homologação:
-- Resultado esperado: false nas quatro linhas.
SELECT
  c.relname AS tabela,
  has_table_privilege('authenticated', c.oid, 'DELETE') AS exclusao_direta_permitida,
  has_table_privilege('authenticated', c.oid, 'INSERT') AS insercao_atual_preservada,
  has_table_privilege('authenticated', c.oid, 'SELECT') AS leitura_atual_preservada
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'pagamentos_equipe', 'pagamento_diarias',
    'pagamento_vales', 'pagamento_bonus_extras'
  )
ORDER BY c.relname;

-- PENDÊNCIAS DE HARDENING (NÃO COBERTAS NESTA PROPOSTA):
-- 1. A rotina real de pagamento ainda realiza vários INSERT/UPDATE
--    independentes pelo cliente. Não revogar INSERT antes de migrar esse
--    fluxo para uma única RPC transacional, preservando o cálculo entre obras.
-- 2. O trigger do Financeiro permite UPDATE direto de status_lancamento
--    para 'estornado' em alguns lançamentos automáticos. Revisar/fechar
--    essa via sem impedir o estorno legítimo executado via SECURITY DEFINER.
-- 3. Confirmar com testes reais em ambiente isolado a restauração de backup,
--    exclusão total de conta, fechamento de caixa e estorno de pagamentos.
-- 4. Após os testes, preparar migração definitiva sob aprovação expressa,
--    mantendo o ponto de partida oficial 92495c4898e66d45c44b9e4b240a63a336af4e59.
