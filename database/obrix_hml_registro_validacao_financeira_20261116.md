# OBRIX — Homologação de segurança financeira (16/11/2026)

**Ambiente exclusivo:** Supabase `OBRIX-AUDITORIA-AUTH-20261102` (`mjzlwnuklfopdmgcvdcs`).  
**Esquema funcional:** `obrix_operacional_lab`. **Esquema de permissões:** `obrix_seg_hml_20261116`.  
**Oficial:** sem migrations, sem alterações de privilégios, sem merge/promoção e sem novo deploy. Commit oficial de referência: `92495c4898e66d45c44b9e4b240a63a336af4e59`.

## Implementação de laboratório

A função `obrix_operacional_lab.obrix_pagar_equipe_transacional_v2` consolida pagamento, vínculo de diárias/vales/bônus, baixas e despesas por obra em **uma transação PostgreSQL**. Tem locks sobre registros selecionados; valida empresa atual, registros já pagos, valores esperados, duplicidade de IDs e destino da compensação de vales. Funciona também com duas meias diárias em obras diferentes. A função está **sem permissão EXECUTE para authenticated** e o esquema não é exposto ao aplicativo.

A prova de permissões usa uma tabela fictícia `financeiro_permissao`, com `UPDATE` concedido somente em colunas editáveis e negado para `status_lancamento`. Como `authenticated`, uma alteração manual da descrição funcionou, enquanto `UPDATE status_lancamento='estornado'` gerou `insufficient_privilege`. A transação de prova foi revertida.

## Resultado confirmado do teste transacional

A suíte `obrix_seg_hml_20261116.executar_testes_operacionais_v2()` retornou **true** em todos os campos abaixo:

- `pagamento_220`, `financeiro_duas_obras`, `duas_meias_diarias`
- `duplicidade_rejeitada`, `estorno_outra_empresa_rejeitado`
- `estorno_reabre_pendencias`, `estorno_financeiro`, `estorno_idempotente`
- `compensacao_obras_120`, `compensacao_destino_indevido_bloqueado`
- `valor_desatualizado_bloqueado`, `compensacao_estorno_reabre_pendencias`
- `exclusao_empresa_cascata`, `restauracao_backup_dados`, `falha_backup_reverte_transacao`
- `fixtures_revertidas`

Os dados de teste foram revertidos; contagem de empresas, pagamentos, financeiro e lançamentos fictícios no laboratório é 0 após o teste.

## Pendências obrigatórias antes de alterar produção

1. Adaptar a rotina ao esquema real (filtrar `diarias.cancelada_em` e `vales.estornado_em`; validar papéis e permissões internas).
2. Incorporar a criação/checagem de lançamentos financeiros de vales antigos na **mesma transação**; preservar o controle de `checklist_ids`, `checklist_valores` e `checklist_id`.
3. Validar todas as combinações de pagamento, inclusive líquido zero, mais de uma obra e pagamento repetido concorrente.
4. No front-end, substituir a sequência de `INSERT/UPDATE` da rotina `obrix-equipe-liquidacao-segura.js` por uma chamada à nova RPC, com tratamento de erros; só ativar depois de preparar a API no ambiente certo.
5. Para restringir `UPDATE(status_lancamento)` no Financeiro, editar a rotina de lançamento manual para **não enviar** `origem` nem `status_lancamento` em alterações de registros existentes, antes de retirar os privilégios dessas colunas. Preservar os estornos pelas RPCs autorizadas.
6. Verificar deleção real de conta e arquivos (Auth, Storage e registros órfãos), sem excluir usuários reais no teste.
7. Fazer testes end-to-end na **versão de teste** do PWA no iPhone, Android e computador, inclusive offline e sincronização.
8. Conferir advisers de segurança e rollback, obter aprovação explícita antes de qualquer migração/deploy oficial.

**Não executar este material em produção como uma migração automática.**
