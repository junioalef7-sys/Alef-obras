-- OBRIX — RASCUNHO DE MIGRAÇÃO / SOMENTE PARA REVISÃO TÉCNICA
-- DATA 07/11/2026 (UTC)
-- NÃO EXECUTAR NO BANCO OFICIAL SEM AUTORIZAÇÃO EXPRESSA, JANELA DE MANUTENÇÃO,
-- BACKUP RESTAURÁVEL ATUAL E TESTE COM TRIGGERS/ROTINAS OPERACIONAIS.
-- As funções atuais devem ser submetidas a regressão antes de aplicar.

-- FASE 3: realizar somente após conferência read-only e implantação
-- controlada da fase 1/2. Pode consumir tempo de leitura e locks.
ALTER TABLE public."bonus_extras" VALIDATE CONSTRAINT "obrix_iso_bonus_extras_checklist_id_empresa_fk";
ALTER TABLE public."bonus_extras" VALIDATE CONSTRAINT "obrix_iso_bonus_extras_funcionario_id_empresa_fk";
ALTER TABLE public."bonus_extras" VALIDATE CONSTRAINT "obrix_iso_bonus_extras_obra_id_empresa_fk";
ALTER TABLE public."checklist_itens" VALIDATE CONSTRAINT "obrix_iso_checklist_itens_obra_id_empresa_fk";
ALTER TABLE public."compra_itens" VALIDATE CONSTRAINT "obrix_iso_compra_itens_compra_id_empresa_fk";
ALTER TABLE public."diarias" VALIDATE CONSTRAINT "obrix_iso_diarias_checklist_id_empresa_fk";
ALTER TABLE public."diarias" VALIDATE CONSTRAINT "obrix_iso_diarias_funcionario_id_empresa_fk";
ALTER TABLE public."diarias" VALIDATE CONSTRAINT "obrix_iso_diarias_obra_id_empresa_fk";
ALTER TABLE public."diario_atividades" VALIDATE CONSTRAINT "obrix_iso_diario_atividades_diario_id_empresa_fk";
ALTER TABLE public."diario_equipe" VALIDATE CONSTRAINT "obrix_iso_diario_equipe_diario_id_empresa_fk";
ALTER TABLE public."diario_equipe" VALIDATE CONSTRAINT "obrix_iso_diario_equipe_funcionario_id_empresa_fk";
ALTER TABLE public."diarios_obra" VALIDATE CONSTRAINT "obrix_iso_diarios_obra_obra_id_empresa_fk";
ALTER TABLE public."estoque_movimentacoes" VALIDATE CONSTRAINT "obrix_iso_estoque_movimentacoes_estorno_de_id_empresa_fk";
ALTER TABLE public."estoque_movimentacoes" VALIDATE CONSTRAINT "obrix_iso_estoque_movimentacoes_estoque_destino_id_empresa_fk";
ALTER TABLE public."estoque_movimentacoes" VALIDATE CONSTRAINT "obrix_iso_estoque_movimentacoes_estoque_origem_id_empresa_fk";
ALTER TABLE public."estoque_movimentacoes" VALIDATE CONSTRAINT "obrix_iso_estoque_movimentacoes_material_id_empresa_fk";
ALTER TABLE public."estoque_movimentacoes" VALIDATE CONSTRAINT "obrix_iso_estoque_movimentacoes_obra_id_empresa_fk";
ALTER TABLE public."estoque_saldos" VALIDATE CONSTRAINT "obrix_iso_estoque_saldos_estoque_id_empresa_fk";
ALTER TABLE public."estoque_saldos" VALIDATE CONSTRAINT "obrix_iso_estoque_saldos_material_id_empresa_fk";
ALTER TABLE public."estoques" VALIDATE CONSTRAINT "obrix_iso_estoques_obra_id_empresa_fk";
ALTER TABLE public."faltas" VALIDATE CONSTRAINT "obrix_iso_faltas_funcionario_id_empresa_fk";
ALTER TABLE public."faltas" VALIDATE CONSTRAINT "obrix_iso_faltas_obra_id_empresa_fk";
ALTER TABLE public."financeiro" VALIDATE CONSTRAINT "obrix_iso_financeiro_checklist_id_empresa_fk";
ALTER TABLE public."financeiro" VALIDATE CONSTRAINT "obrix_iso_financeiro_estoque_movimentacao_id_empresa_fk";
ALTER TABLE public."financeiro" VALIDATE CONSTRAINT "obrix_iso_financeiro_obra_id_empresa_fk";
ALTER TABLE public."financeiro" VALIDATE CONSTRAINT "obrix_iso_financeiro_pagamento_equipe_id_empresa_fk";
ALTER TABLE public."fotos_obra" VALIDATE CONSTRAINT "obrix_iso_fotos_obra_obra_id_empresa_fk";
ALTER TABLE public."fotos_obra" VALIDATE CONSTRAINT "obrix_iso_fotos_obra_relatorio_id_empresa_fk";
ALTER TABLE public."funcionarios" VALIDATE CONSTRAINT "obrix_iso_funcionarios_obra_id_empresa_fk";
ALTER TABLE public."notas" VALIDATE CONSTRAINT "obrix_iso_notas_obra_id_empresa_fk";
ALTER TABLE public."orcamento_itens" VALIDATE CONSTRAINT "obrix_iso_orcamento_itens_orcamento_id_empresa_fk";
ALTER TABLE public."orcamentos" VALIDATE CONSTRAINT "obrix_iso_orcamentos_obra_id_empresa_fk";
ALTER TABLE public."pagamento_bonus_extras" VALIDATE CONSTRAINT "obrix_iso_pagamento_bonus_extras_bonus_extra_id_empresa_fk";
ALTER TABLE public."pagamento_bonus_extras" VALIDATE CONSTRAINT "obrix_iso_pagamento_bonus_extras_pagamento_id_empresa_fk";
ALTER TABLE public."pagamento_diarias" VALIDATE CONSTRAINT "obrix_iso_pagamento_diarias_diaria_id_empresa_fk";
ALTER TABLE public."pagamento_diarias" VALIDATE CONSTRAINT "obrix_iso_pagamento_diarias_obra_id_empresa_fk";
ALTER TABLE public."pagamento_diarias" VALIDATE CONSTRAINT "obrix_iso_pagamento_diarias_pagamento_id_empresa_fk";
ALTER TABLE public."pagamento_vales" VALIDATE CONSTRAINT "obrix_iso_pagamento_vales_pagamento_id_empresa_fk";
ALTER TABLE public."pagamento_vales" VALIDATE CONSTRAINT "obrix_iso_pagamento_vales_vale_id_empresa_fk";
ALTER TABLE public."pagamentos_assinatura" VALIDATE CONSTRAINT "obrix_iso_pagamentos_assinatura_assinatura_id_empresa_fk";
ALTER TABLE public."pagamentos_equipe" VALIDATE CONSTRAINT "obrix_iso_pagamentos_equipe_funcionario_id_empresa_fk";
ALTER TABLE public."relatorio_fotos" VALIDATE CONSTRAINT "obrix_iso_relatorio_fotos_checklist_id_empresa_fk";
ALTER TABLE public."relatorio_fotos" VALIDATE CONSTRAINT "obrix_iso_relatorio_fotos_diario_id_empresa_fk";
ALTER TABLE public."relatorio_fotos" VALIDATE CONSTRAINT "obrix_iso_relatorio_fotos_obra_id_empresa_fk";
ALTER TABLE public."relatorios_fotograficos" VALIDATE CONSTRAINT "obrix_iso_relatorios_fotograficos_obra_id_empresa_fk";
ALTER TABLE public."servicos_extras" VALIDATE CONSTRAINT "obrix_iso_servicos_extras_obra_id_empresa_fk";
ALTER TABLE public."vales" VALIDATE CONSTRAINT "obrix_iso_vales_checklist_id_empresa_fk";
ALTER TABLE public."vales" VALIDATE CONSTRAINT "obrix_iso_vales_funcionario_id_empresa_fk";
ALTER TABLE public."vales" VALIDATE CONSTRAINT "obrix_iso_vales_obra_id_empresa_fk";

-- Estado esperado: 49 validações concluídas.
