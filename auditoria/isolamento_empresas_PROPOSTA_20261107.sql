-- OBRIX — RASCUNHO DE MIGRAÇÃO / SOMENTE PARA REVISÃO TÉCNICA
-- DATA 07/11/2026 (UTC)
-- NÃO EXECUTAR NO BANCO OFICIAL SEM AUTORIZAÇÃO EXPRESSA, JANELA DE MANUTENÇÃO,
-- BACKUP RESTAURÁVEL ATUAL E TESTE COM TRIGGERS/ROTINAS OPERACIONAIS.
-- As funções atuais devem ser submetidas a regressão antes de aplicar.

-- FASE 1: indices compostos exigidos por FK(identificador,empresa_id).
-- Índices já existentes em compras, materiais e obras não são duplicados.
-- Cuidado: CREATE INDEX (sem CONCURRENTLY) pode bloquear escrita. Agendar janela.
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_assinaturas_id_empresa_uidx ON public."assinaturas"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_bonus_extras_id_empresa_uidx ON public."bonus_extras"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_checklist_itens_id_empresa_uidx ON public."checklist_itens"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_diarias_id_empresa_uidx ON public."diarias"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_diarios_obra_id_empresa_uidx ON public."diarios_obra"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_estoque_movimentacoes_id_empresa_uidx ON public."estoque_movimentacoes"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_estoques_id_empresa_uidx ON public."estoques"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_funcionarios_id_empresa_uidx ON public."funcionarios"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_orcamentos_id_empresa_uidx ON public."orcamentos"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_pagamentos_equipe_id_empresa_uidx ON public."pagamentos_equipe"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_relatorios_fotograficos_id_empresa_uidx ON public."relatorios_fotograficos"(id,empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS obrix_iso_vales_id_empresa_uidx ON public."vales"(id,empresa_id);

-- FASE 2: 49 vínculos passam a exigir a MESMA empresa.
-- NOT VALID: registros existentes requerem VALIDATE posterior.
-- DEFERRABLE INITIALLY DEFERRED permite importações transacionais
-- fora da ordem de dependências, sem admitir incoerência no COMMIT.
-- ON DELETE NO ACTION evita redefinir empresa_id quando a FK antiga aplica SET NULL.
ALTER TABLE public."bonus_extras" ADD CONSTRAINT "obrix_iso_bonus_extras_checklist_id_empresa_fk"
  FOREIGN KEY ("checklist_id",empresa_id) REFERENCES public."checklist_itens"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."bonus_extras" ADD CONSTRAINT "obrix_iso_bonus_extras_funcionario_id_empresa_fk"
  FOREIGN KEY ("funcionario_id",empresa_id) REFERENCES public."funcionarios"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."bonus_extras" ADD CONSTRAINT "obrix_iso_bonus_extras_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."checklist_itens" ADD CONSTRAINT "obrix_iso_checklist_itens_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."compra_itens" ADD CONSTRAINT "obrix_iso_compra_itens_compra_id_empresa_fk"
  FOREIGN KEY ("compra_id",empresa_id) REFERENCES public."compras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."diarias" ADD CONSTRAINT "obrix_iso_diarias_checklist_id_empresa_fk"
  FOREIGN KEY ("checklist_id",empresa_id) REFERENCES public."checklist_itens"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."diarias" ADD CONSTRAINT "obrix_iso_diarias_funcionario_id_empresa_fk"
  FOREIGN KEY ("funcionario_id",empresa_id) REFERENCES public."funcionarios"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."diarias" ADD CONSTRAINT "obrix_iso_diarias_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."diario_atividades" ADD CONSTRAINT "obrix_iso_diario_atividades_diario_id_empresa_fk"
  FOREIGN KEY ("diario_id",empresa_id) REFERENCES public."diarios_obra"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."diario_equipe" ADD CONSTRAINT "obrix_iso_diario_equipe_diario_id_empresa_fk"
  FOREIGN KEY ("diario_id",empresa_id) REFERENCES public."diarios_obra"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."diario_equipe" ADD CONSTRAINT "obrix_iso_diario_equipe_funcionario_id_empresa_fk"
  FOREIGN KEY ("funcionario_id",empresa_id) REFERENCES public."funcionarios"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."diarios_obra" ADD CONSTRAINT "obrix_iso_diarios_obra_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."estoque_movimentacoes" ADD CONSTRAINT "obrix_iso_estoque_movimentacoes_estorno_de_id_empresa_fk"
  FOREIGN KEY ("estorno_de_id",empresa_id) REFERENCES public."estoque_movimentacoes"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."estoque_movimentacoes" ADD CONSTRAINT "obrix_iso_estoque_movimentacoes_estoque_destino_id_empresa_fk"
  FOREIGN KEY ("estoque_destino_id",empresa_id) REFERENCES public."estoques"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."estoque_movimentacoes" ADD CONSTRAINT "obrix_iso_estoque_movimentacoes_estoque_origem_id_empresa_fk"
  FOREIGN KEY ("estoque_origem_id",empresa_id) REFERENCES public."estoques"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."estoque_movimentacoes" ADD CONSTRAINT "obrix_iso_estoque_movimentacoes_material_id_empresa_fk"
  FOREIGN KEY ("material_id",empresa_id) REFERENCES public."materiais"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."estoque_movimentacoes" ADD CONSTRAINT "obrix_iso_estoque_movimentacoes_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."estoque_saldos" ADD CONSTRAINT "obrix_iso_estoque_saldos_estoque_id_empresa_fk"
  FOREIGN KEY ("estoque_id",empresa_id) REFERENCES public."estoques"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."estoque_saldos" ADD CONSTRAINT "obrix_iso_estoque_saldos_material_id_empresa_fk"
  FOREIGN KEY ("material_id",empresa_id) REFERENCES public."materiais"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."estoques" ADD CONSTRAINT "obrix_iso_estoques_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."faltas" ADD CONSTRAINT "obrix_iso_faltas_funcionario_id_empresa_fk"
  FOREIGN KEY ("funcionario_id",empresa_id) REFERENCES public."funcionarios"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."faltas" ADD CONSTRAINT "obrix_iso_faltas_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."financeiro" ADD CONSTRAINT "obrix_iso_financeiro_checklist_id_empresa_fk"
  FOREIGN KEY ("checklist_id",empresa_id) REFERENCES public."checklist_itens"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."financeiro" ADD CONSTRAINT "obrix_iso_financeiro_estoque_movimentacao_id_empresa_fk"
  FOREIGN KEY ("estoque_movimentacao_id",empresa_id) REFERENCES public."estoque_movimentacoes"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."financeiro" ADD CONSTRAINT "obrix_iso_financeiro_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."financeiro" ADD CONSTRAINT "obrix_iso_financeiro_pagamento_equipe_id_empresa_fk"
  FOREIGN KEY ("pagamento_equipe_id",empresa_id) REFERENCES public."pagamentos_equipe"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."fotos_obra" ADD CONSTRAINT "obrix_iso_fotos_obra_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."fotos_obra" ADD CONSTRAINT "obrix_iso_fotos_obra_relatorio_id_empresa_fk"
  FOREIGN KEY ("relatorio_id",empresa_id) REFERENCES public."relatorios_fotograficos"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."funcionarios" ADD CONSTRAINT "obrix_iso_funcionarios_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."notas" ADD CONSTRAINT "obrix_iso_notas_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."orcamento_itens" ADD CONSTRAINT "obrix_iso_orcamento_itens_orcamento_id_empresa_fk"
  FOREIGN KEY ("orcamento_id",empresa_id) REFERENCES public."orcamentos"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."orcamentos" ADD CONSTRAINT "obrix_iso_orcamentos_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pagamento_bonus_extras" ADD CONSTRAINT "obrix_iso_pagamento_bonus_extras_bonus_extra_id_empresa_fk"
  FOREIGN KEY ("bonus_extra_id",empresa_id) REFERENCES public."bonus_extras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pagamento_bonus_extras" ADD CONSTRAINT "obrix_iso_pagamento_bonus_extras_pagamento_id_empresa_fk"
  FOREIGN KEY ("pagamento_id",empresa_id) REFERENCES public."pagamentos_equipe"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pagamento_diarias" ADD CONSTRAINT "obrix_iso_pagamento_diarias_diaria_id_empresa_fk"
  FOREIGN KEY ("diaria_id",empresa_id) REFERENCES public."diarias"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pagamento_diarias" ADD CONSTRAINT "obrix_iso_pagamento_diarias_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pagamento_diarias" ADD CONSTRAINT "obrix_iso_pagamento_diarias_pagamento_id_empresa_fk"
  FOREIGN KEY ("pagamento_id",empresa_id) REFERENCES public."pagamentos_equipe"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pagamento_vales" ADD CONSTRAINT "obrix_iso_pagamento_vales_pagamento_id_empresa_fk"
  FOREIGN KEY ("pagamento_id",empresa_id) REFERENCES public."pagamentos_equipe"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pagamento_vales" ADD CONSTRAINT "obrix_iso_pagamento_vales_vale_id_empresa_fk"
  FOREIGN KEY ("vale_id",empresa_id) REFERENCES public."vales"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pagamentos_assinatura" ADD CONSTRAINT "obrix_iso_pagamentos_assinatura_assinatura_id_empresa_fk"
  FOREIGN KEY ("assinatura_id",empresa_id) REFERENCES public."assinaturas"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."pagamentos_equipe" ADD CONSTRAINT "obrix_iso_pagamentos_equipe_funcionario_id_empresa_fk"
  FOREIGN KEY ("funcionario_id",empresa_id) REFERENCES public."funcionarios"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."relatorio_fotos" ADD CONSTRAINT "obrix_iso_relatorio_fotos_checklist_id_empresa_fk"
  FOREIGN KEY ("checklist_id",empresa_id) REFERENCES public."checklist_itens"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."relatorio_fotos" ADD CONSTRAINT "obrix_iso_relatorio_fotos_diario_id_empresa_fk"
  FOREIGN KEY ("diario_id",empresa_id) REFERENCES public."diarios_obra"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."relatorio_fotos" ADD CONSTRAINT "obrix_iso_relatorio_fotos_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."relatorios_fotograficos" ADD CONSTRAINT "obrix_iso_relatorios_fotograficos_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."servicos_extras" ADD CONSTRAINT "obrix_iso_servicos_extras_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."vales" ADD CONSTRAINT "obrix_iso_vales_checklist_id_empresa_fk"
  FOREIGN KEY ("checklist_id",empresa_id) REFERENCES public."checklist_itens"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."vales" ADD CONSTRAINT "obrix_iso_vales_funcionario_id_empresa_fk"
  FOREIGN KEY ("funcionario_id",empresa_id) REFERENCES public."funcionarios"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;
ALTER TABLE public."vales" ADD CONSTRAINT "obrix_iso_vales_obra_id_empresa_fk"
  FOREIGN KEY ("obra_id",empresa_id) REFERENCES public."obras"(id,empresa_id)
  ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED NOT VALID;

-- Execute as verificações em script distinto. NÃO remover as FKs antigas.
