-- EDIFIQ / baixa de equipe v1
-- Preparação somente: este arquivo NÃO é aplicado automaticamente no Supabase.
-- A implementação da RPC deve ser concluída apenas após validar o esquema real
-- das tabelas diarias, adiantamentos, pagamentos e gastos.
--
-- Requisitos obrigatórios da futura baixa:
-- 1. executar em uma única transação no banco;
-- 2. usar auth.uid() para isolar o usuário;
-- 3. receber operation_id único e rejeitar/reutilizar tentativas repetidas;
-- 4. selecionar somente diárias realmente pendentes;
-- 5. preservar a obra original de cada diária, sem rateio proporcional;
-- 6. registrar valor_pago, qtd_paga, pago_em e valor_baixado conforme o esquema real;
-- 7. aplicar Vales somente conforme a regra real de adiantamentos;
-- 8. não depender de tabelas ou colunas presumidas como financeiro, bonus_extras
--    ou adiantamentos.status;
-- 9. retornar resumo bruto, descontos, líquido e distribuição por obra;
-- 10. em qualquer erro, fazer rollback completo.

begin;

-- Intencionalmente sem CREATE FUNCTION nesta etapa.
-- Este marcador impede que uma rotina de baixa parcialmente validada seja
-- confundida com uma migração pronta para produção.

rollback;
