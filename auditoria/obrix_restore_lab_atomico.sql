-- OBRIX — Laboratorio de recuperacao atomica (somente projeto AUDITORIA)
-- Esta rotina e uma prova transacional com espelho JSONB; NAO aplica dados nas tabelas
-- operacionais do OBRIX e NAO restaura objetos do Supabase Storage.
-- Pre-requisito: esquema privado obrix_restore_lab e tabelas lotes/registros
-- provisionados no Supabase de auditoria. NAO executar na producao.
CREATE TABLE IF NOT EXISTS obrix_restore_lab.registros_recuperados (
  empresa_origem uuid NOT NULL,
  modulo text NOT NULL,
  registro_id uuid NOT NULL,
  conteudo jsonb NOT NULL CHECK (jsonb_typeof(conteudo) = 'object'),
  lote_id uuid NOT NULL REFERENCES obrix_restore_lab.lotes(id) ON DELETE CASCADE,
  recuperado_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (empresa_origem,modulo,registro_id)
);
ALTER TABLE obrix_restore_lab.registros_recuperados ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON obrix_restore_lab.registros_recuperados FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION obrix_restore_lab.restaurar_lote_atomico(p_lote uuid, p_simular_falha boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
 v_empresa uuid;
 v_declarado integer;
 v_encontrado integer;
 v_erros integer;
 v_vinculos integer;
 v_gravados integer;
 v_conferidos integer;
BEGIN
 SELECT empresa_origem,registros_declarados
 INTO v_empresa,v_declarado
 FROM obrix_restore_lab.lotes
 WHERE id=p_lote AND tipo='dados'
 FOR UPDATE;

 IF v_empresa IS NULL OR v_declarado IS NULL OR v_declarado<=0 THEN
  RAISE EXCEPTION 'Lote de dados não encontrado ou inválido';
 END IF;

 SELECT COUNT(*) INTO v_encontrado
 FROM obrix_restore_lab.registros r WHERE r.lote_id=p_lote;
 IF v_encontrado<>v_declarado THEN
  RAISE EXCEPTION 'Pré-validação: lote incompleto (% de %)',v_encontrado,v_declarado;
 END IF;

 SELECT COUNT(*) INTO v_erros
 FROM obrix_restore_lab.registros r
 WHERE r.lote_id=p_lote
 AND (
  r.empresa_origem IS DISTINCT FROM v_empresa
  OR r.conteudo->>'empresa_id' IS DISTINCT FROM v_empresa::text
  OR r.conteudo->>'id' IS DISTINCT FROM r.registro_id::text
 );
 IF v_erros>0 THEN RAISE EXCEPTION 'Pré-validação: % registro(s) com empresa ou ID incoerente',v_erros; END IF;

 WITH m(modulo,coluna,destino) AS (VALUES
 ('obras','cliente_id','clientes'),
 ('funcionarios','obra_id','obras'),
 ('servicos_extras','obra_id','obras'),
 ('checklist_itens','obra_id','obras'),
 ('diarios_obra','obra_id','obras'),
 ('diario_atividades','diario_id','diarios_obra'),
 ('diario_equipe','diario_id','diarios_obra'),
 ('diario_equipe','funcionario_id','funcionarios'),
 ('notas','obra_id','obras'),
 ('diarias','funcionario_id','funcionarios'),
 ('diarias','obra_id','obras'),
 ('diarias','checklist_id','checklist_itens'),
 ('faltas','funcionario_id','funcionarios'),
 ('faltas','obra_id','obras'),
 ('vales','funcionario_id','funcionarios'),
 ('vales','obra_id','obras'),
 ('vales','checklist_id','checklist_itens'),
 ('bonus_extras','funcionario_id','funcionarios'),
 ('bonus_extras','obra_id','obras'),
 ('bonus_extras','checklist_id','checklist_itens'),
 ('pagamentos_equipe','funcionario_id','funcionarios'),
 ('pagamento_diarias','pagamento_id','pagamentos_equipe'),
 ('pagamento_diarias','diaria_id','diarias'),
 ('pagamento_diarias','obra_id','obras'),
 ('pagamento_vales','pagamento_id','pagamentos_equipe'),
 ('pagamento_vales','vale_id','vales'),
 ('pagamento_bonus_extras','pagamento_id','pagamentos_equipe'),
 ('pagamento_bonus_extras','bonus_extra_id','bonus_extras'),
 ('financeiro','obra_id','obras'),
 ('financeiro','checklist_id','checklist_itens'),
 ('financeiro','pagamento_equipe_id','pagamentos_equipe'),
 ('financeiro','compra_id','compras'),
 ('financeiro','estoque_movimentacao_id','estoque_movimentacoes'),
 ('estoques','obra_id','obras'),
 ('estoque_saldos','estoque_id','estoques'),
 ('estoque_saldos','material_id','materiais'),
 ('estoque_movimentacoes','material_id','materiais'),
 ('estoque_movimentacoes','obra_id','obras'),
 ('estoque_movimentacoes','estoque_origem_id','estoques'),
 ('estoque_movimentacoes','estoque_destino_id','estoques'),
 ('estoque_movimentacoes','compra_id','compras'),
 ('estoque_movimentacoes','estorno_de_id','estoque_movimentacoes'),
 ('compras','obra_id','obras'),
 ('compras','fornecedor_id','fornecedores'),
 ('compra_itens','compra_id','compras'),
 ('compra_itens','material_id','materiais'),
 ('orcamentos','obra_id','obras'),
 ('orcamentos','cliente_id','clientes'),
 ('orcamento_itens','orcamento_id','orcamentos'),
 ('documentos','obra_id','obras'),
 ('documentos','cliente_id','clientes'),
 ('documentos','funcionario_id','funcionarios'),
 ('relatorios','cliente_id','clientes'),
 ('relatorios_fotograficos','obra_id','obras'),
 ('fotos_obra','obra_id','obras'),
 ('fotos_obra','relatorio_id','relatorios_fotograficos'),
 ('relatorio_fotos','obra_id','obras'),
 ('relatorio_fotos','checklist_id','checklist_itens'),
 ('relatorio_fotos','diario_id','diarios_obra')
 ),
 referencias AS (
  SELECT m.destino, r.conteudo->>m.coluna AS alvo
  FROM obrix_restore_lab.registros r JOIN m ON m.modulo=r.modulo
  WHERE r.lote_id=p_lote AND NULLIF(r.conteudo->>m.coluna,'') IS NOT NULL
 )
 SELECT COUNT(*)::int, COUNT(*) FILTER (WHERE b.id IS NULL)::int
 INTO v_vinculos,v_erros
 FROM referencias ref
 LEFT JOIN obrix_restore_lab.registros b
  ON b.lote_id=p_lote AND b.modulo=ref.destino AND b.registro_id::text=ref.alvo;

 IF v_erros>0 THEN RAISE EXCEPTION 'Pré-validação: % vínculo(s) inválido(s)',v_erros; END IF;

 INSERT INTO obrix_restore_lab.registros_recuperados
 (empresa_origem,modulo,registro_id,conteudo,lote_id,recuperado_em)
 SELECT v_empresa,r.modulo,r.registro_id,r.conteudo,p_lote,now()
 FROM obrix_restore_lab.registros r WHERE r.lote_id=p_lote
 ON CONFLICT (empresa_origem,modulo,registro_id)
 DO UPDATE SET
   conteudo=EXCLUDED.conteudo,
   lote_id=EXCLUDED.lote_id,
   recuperado_em=EXCLUDED.recuperado_em;
 GET DIAGNOSTICS v_gravados=ROW_COUNT;

 IF p_simular_falha THEN
  RAISE EXCEPTION 'FALHA_SIMULADA_APOS_GRAVACAO: transação deve reverter completamente';
 END IF;

 SELECT COUNT(*) INTO v_conferidos
 FROM obrix_restore_lab.registros_recuperados
 WHERE lote_id=p_lote AND empresa_origem=v_empresa;

 IF v_gravados<>v_declarado OR v_conferidos<>v_declarado THEN
  RAISE EXCEPTION 'Conferência pós-gravação divergiu: gravados %, conferidos %, esperados %',
   v_gravados,v_conferidos,v_declarado;
 END IF;

 RETURN jsonb_build_object(
  'ok',true,'empresa_origem',v_empresa,'registros',v_conferidos,
  'vinculos_conferidos',v_vinculos,'problemas',v_erros,'transacional',true
 );
END;
$function$


REVOKE ALL ON FUNCTION obrix_restore_lab.restaurar_lote_atomico(uuid,boolean) FROM PUBLIC, anon, authenticated;

-- Exemplos: use IDs de lote gerados SOMENTE no laboratorio:
-- SELECT obrix_restore_lab.restaurar_lote_atomico('<LOTE_UUID>'::uuid, true);
-- A chamada com true DEVE falhar e reverter completamente.
-- SELECT obrix_restore_lab.restaurar_lote_atomico('<LOTE_UUID>'::uuid, false);
-- A chamada com false deve gravar todos os registros do lote, em uma unica transacao.
