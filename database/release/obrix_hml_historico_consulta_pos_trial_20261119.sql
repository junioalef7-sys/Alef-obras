-- OBRIX | HML: consulta do proprio historico mesmo apos os sete dias.
-- Aplicar EXCLUSIVAMENTE no Supabase isolado xavwkfgrnowmusbkbiea.
-- Nao concede INSERT, UPDATE, DELETE, nem acesso a dados de outras empresas.
-- Durante assinatura vigente, as politicas originais continuam vigentes.
CREATE POLICY obrix_hml_historico_consulta_bonus_extras
  ON public.bonus_extras
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_checklist_itens
  ON public.checklist_itens
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_clientes
  ON public.clientes
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_compra_itens
  ON public.compra_itens
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_compras
  ON public.compras
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_diarias
  ON public.diarias
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_diario_atividades
  ON public.diario_atividades
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_diario_equipe
  ON public.diario_equipe
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_diarios_obra
  ON public.diarios_obra
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_documentos
  ON public.documentos
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_estoque_movimentacoes
  ON public.estoque_movimentacoes
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_estoque_saldos
  ON public.estoque_saldos
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_estoques
  ON public.estoques
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_faltas
  ON public.faltas
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_financeiro
  ON public.financeiro
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_fornecedores
  ON public.fornecedores
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_fotos_obra
  ON public.fotos_obra
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_materiais
  ON public.materiais
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_notas
  ON public.notas
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_orcamento_itens
  ON public.orcamento_itens
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_orcamentos
  ON public.orcamentos
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_pagamento_bonus_extras
  ON public.pagamento_bonus_extras
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_pagamento_diarias
  ON public.pagamento_diarias
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_pagamento_vales
  ON public.pagamento_vales
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_pagamentos_equipe
  ON public.pagamentos_equipe
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_relatorio_fotos
  ON public.relatorio_fotos
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_relatorios
  ON public.relatorios
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_relatorios_fotograficos
  ON public.relatorios_fotograficos
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_servicos_extras
  ON public.servicos_extras
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));

CREATE POLICY obrix_hml_historico_consulta_vales
  ON public.vales
  FOR SELECT TO authenticated
  USING (empresa_id = (SELECT public.obrix_empresa_atual()));
