-- OBRIX — RASCUNHO DE MIGRAÇÃO / SOMENTE PARA REVISÃO TÉCNICA
-- DATA 07/11/2026 (UTC)
-- NÃO EXECUTAR NO BANCO OFICIAL SEM AUTORIZAÇÃO EXPRESSA, JANELA DE MANUTENÇÃO,
-- BACKUP RESTAURÁVEL ATUAL E TESTE COM TRIGGERS/ROTINAS OPERACIONAIS.
-- As funções atuais devem ser submetidas a regressão antes de aplicar.

-- Confere violação entre registros existentes; resultado deve ter zero linhas.
WITH diagnostico AS (
  SELECT 'bonus_extras.checklist_id -> checklist_itens'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."bonus_extras" origem JOIN public."checklist_itens" destino ON origem."checklist_id"=destino.id
  UNION ALL
  SELECT 'bonus_extras.funcionario_id -> funcionarios'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."bonus_extras" origem JOIN public."funcionarios" destino ON origem."funcionario_id"=destino.id
  UNION ALL
  SELECT 'bonus_extras.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."bonus_extras" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'checklist_itens.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."checklist_itens" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'compra_itens.compra_id -> compras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."compra_itens" origem JOIN public."compras" destino ON origem."compra_id"=destino.id
  UNION ALL
  SELECT 'diarias.checklist_id -> checklist_itens'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."diarias" origem JOIN public."checklist_itens" destino ON origem."checklist_id"=destino.id
  UNION ALL
  SELECT 'diarias.funcionario_id -> funcionarios'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."diarias" origem JOIN public."funcionarios" destino ON origem."funcionario_id"=destino.id
  UNION ALL
  SELECT 'diarias.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."diarias" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'diario_atividades.diario_id -> diarios_obra'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."diario_atividades" origem JOIN public."diarios_obra" destino ON origem."diario_id"=destino.id
  UNION ALL
  SELECT 'diario_equipe.diario_id -> diarios_obra'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."diario_equipe" origem JOIN public."diarios_obra" destino ON origem."diario_id"=destino.id
  UNION ALL
  SELECT 'diario_equipe.funcionario_id -> funcionarios'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."diario_equipe" origem JOIN public."funcionarios" destino ON origem."funcionario_id"=destino.id
  UNION ALL
  SELECT 'diarios_obra.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."diarios_obra" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'estoque_movimentacoes.estorno_de_id -> estoque_movimentacoes'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."estoque_movimentacoes" origem JOIN public."estoque_movimentacoes" destino ON origem."estorno_de_id"=destino.id
  UNION ALL
  SELECT 'estoque_movimentacoes.estoque_destino_id -> estoques'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."estoque_movimentacoes" origem JOIN public."estoques" destino ON origem."estoque_destino_id"=destino.id
  UNION ALL
  SELECT 'estoque_movimentacoes.estoque_origem_id -> estoques'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."estoque_movimentacoes" origem JOIN public."estoques" destino ON origem."estoque_origem_id"=destino.id
  UNION ALL
  SELECT 'estoque_movimentacoes.material_id -> materiais'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."estoque_movimentacoes" origem JOIN public."materiais" destino ON origem."material_id"=destino.id
  UNION ALL
  SELECT 'estoque_movimentacoes.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."estoque_movimentacoes" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'estoque_saldos.estoque_id -> estoques'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."estoque_saldos" origem JOIN public."estoques" destino ON origem."estoque_id"=destino.id
  UNION ALL
  SELECT 'estoque_saldos.material_id -> materiais'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."estoque_saldos" origem JOIN public."materiais" destino ON origem."material_id"=destino.id
  UNION ALL
  SELECT 'estoques.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."estoques" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'faltas.funcionario_id -> funcionarios'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."faltas" origem JOIN public."funcionarios" destino ON origem."funcionario_id"=destino.id
  UNION ALL
  SELECT 'faltas.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."faltas" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'financeiro.checklist_id -> checklist_itens'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."financeiro" origem JOIN public."checklist_itens" destino ON origem."checklist_id"=destino.id
  UNION ALL
  SELECT 'financeiro.estoque_movimentacao_id -> estoque_movimentacoes'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."financeiro" origem JOIN public."estoque_movimentacoes" destino ON origem."estoque_movimentacao_id"=destino.id
  UNION ALL
  SELECT 'financeiro.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."financeiro" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'financeiro.pagamento_equipe_id -> pagamentos_equipe'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."financeiro" origem JOIN public."pagamentos_equipe" destino ON origem."pagamento_equipe_id"=destino.id
  UNION ALL
  SELECT 'fotos_obra.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."fotos_obra" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'fotos_obra.relatorio_id -> relatorios_fotograficos'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."fotos_obra" origem JOIN public."relatorios_fotograficos" destino ON origem."relatorio_id"=destino.id
  UNION ALL
  SELECT 'funcionarios.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."funcionarios" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'notas.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."notas" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'orcamento_itens.orcamento_id -> orcamentos'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."orcamento_itens" origem JOIN public."orcamentos" destino ON origem."orcamento_id"=destino.id
  UNION ALL
  SELECT 'orcamentos.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."orcamentos" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'pagamento_bonus_extras.bonus_extra_id -> bonus_extras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."pagamento_bonus_extras" origem JOIN public."bonus_extras" destino ON origem."bonus_extra_id"=destino.id
  UNION ALL
  SELECT 'pagamento_bonus_extras.pagamento_id -> pagamentos_equipe'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."pagamento_bonus_extras" origem JOIN public."pagamentos_equipe" destino ON origem."pagamento_id"=destino.id
  UNION ALL
  SELECT 'pagamento_diarias.diaria_id -> diarias'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."pagamento_diarias" origem JOIN public."diarias" destino ON origem."diaria_id"=destino.id
  UNION ALL
  SELECT 'pagamento_diarias.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."pagamento_diarias" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'pagamento_diarias.pagamento_id -> pagamentos_equipe'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."pagamento_diarias" origem JOIN public."pagamentos_equipe" destino ON origem."pagamento_id"=destino.id
  UNION ALL
  SELECT 'pagamento_vales.pagamento_id -> pagamentos_equipe'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."pagamento_vales" origem JOIN public."pagamentos_equipe" destino ON origem."pagamento_id"=destino.id
  UNION ALL
  SELECT 'pagamento_vales.vale_id -> vales'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."pagamento_vales" origem JOIN public."vales" destino ON origem."vale_id"=destino.id
  UNION ALL
  SELECT 'pagamentos_assinatura.assinatura_id -> assinaturas'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."pagamentos_assinatura" origem JOIN public."assinaturas" destino ON origem."assinatura_id"=destino.id
  UNION ALL
  SELECT 'pagamentos_equipe.funcionario_id -> funcionarios'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."pagamentos_equipe" origem JOIN public."funcionarios" destino ON origem."funcionario_id"=destino.id
  UNION ALL
  SELECT 'relatorio_fotos.checklist_id -> checklist_itens'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."relatorio_fotos" origem JOIN public."checklist_itens" destino ON origem."checklist_id"=destino.id
  UNION ALL
  SELECT 'relatorio_fotos.diario_id -> diarios_obra'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."relatorio_fotos" origem JOIN public."diarios_obra" destino ON origem."diario_id"=destino.id
  UNION ALL
  SELECT 'relatorio_fotos.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."relatorio_fotos" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'relatorios_fotograficos.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."relatorios_fotograficos" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'servicos_extras.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."servicos_extras" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
  UNION ALL
  SELECT 'vales.checklist_id -> checklist_itens'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."vales" origem JOIN public."checklist_itens" destino ON origem."checklist_id"=destino.id
  UNION ALL
  SELECT 'vales.funcionario_id -> funcionarios'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."vales" origem JOIN public."funcionarios" destino ON origem."funcionario_id"=destino.id
  UNION ALL
  SELECT 'vales.obra_id -> obras'::text AS vinculo,COUNT(*)::int AS referencias,
    COUNT(*) FILTER (WHERE origem.empresa_id <> destino.empresa_id)::int AS divergencias
    FROM public."vales" origem JOIN public."obras" destino ON origem."obra_id"=destino.id
)
SELECT * FROM diagnostico WHERE divergencias>0 ORDER BY vinculo;

-- Requer resultado zero acima; abortar aplicação se houver divergências.
