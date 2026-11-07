# OBRIX — Auditoria de isolamento por empresa (proposta de migração)

**Execução:** 06/11/2026 (horário de Brasília), 07/11/2026 UTC.  
**Ambiente:** leitura do banco OBRIX oficial + operações e migrações APENAS no Supabase de auditoria.  
**Situação:** scripts preparados para revisão. **NÃO foram executados no banco oficial.**

## 1. Situação do banco oficial

A introspecção de chaves estrangeiras identificou:
- **53** relacionamentos com FK de coluna única entre tabelas com `empresa_id`;
- **4** desses já têm FK composta equivalente que protege o vínculo com a empresa;
- **49** vínculos com necessidade de reforço para garantir que o registro apontado pertence à mesma empresa;
- **1.340** referências existentes inspecionadas em consulta somente leitura, com **0 relações entre empresas diferentes**.
- O preflight SQL versionado em [isolamento_empresas_PRECHECK_20261107.sql](./isolamento_empresas_PRECHECK_20261107.sql) foi executado no banco oficial, retornando **0 violações**.

Observação: a auditoria cobre relacionamentos existentes definidos por FK; não equivale a provar ausência de associações inseguras em JSON, caminhos de arquivo ou código aplicativo.

## 2. Testes executados no banco isolado

- A réplica operacional de **32 tabelas** já montada recebeu **48 novas FKs compostas** `(id_relacionado, empresa_id)`, incluindo registros financeiros, diárias, equipe, estoque, checklist, obras e pagamentos.
- A 49ª, `pagamentos_assinatura.assinatura_id -> assinaturas`, foi testada separadamente com dados fictícios e a mesma técnica de FK composta, inclusive `NOT VALID` e `VALIDATE CONSTRAINT`.
- Os dois backups reais (**464 + 161 = 625 registros**) foram restaurados na réplica operacional com restrições reforçadas.
- Na conta principal foram preservados os **106 vínculos de pagamento-diária**, **6 vales**, **14 bônus/extras**, receitas de **R$ 136.596,00** e despesas de **R$ 103.837,45**.
- Na conta de testes foram recuperadas **118 diárias**, receita de **R$ 6.800,00** e despesas de **R$ 850,00**.
- **11 tentativas de mudar referências para objetos de outra empresa foram bloqueadas**, envolvendo diárias, obras, equipe, financeiro, fotografias e pagamentos.
- Operações legítimas de diárias, vales, bônus, financeiro e edição de registro já vinculado ao pagamento continuaram válidas.
- Uma tentativa de apontar um pagamento para uma diária já vinculada a outro pagamento foi bloqueada por **índice único original**, como esperado. Não é uma falha da nova FK.
- Exclusão simulada de uma etapa do checklist com referências ativas manteve o comportamento de `SET NULL` previsto pelas FKs antigas.
- Duas falhas forçadas após gravar registros foram revertidas; hashes de diárias, vales, bônus, financeiro e pagamentos permaneceram idênticos antes/depois.

### Compatibilidade da importação

O primeiro ensaio com as FKs novas definidas como **não adiáveis** falhou porque a rotina de recuperação processa algumas tabelas antes de seus pais (por exemplo, bônus antes do checklist). O erro reverteu a transação, sem perda.

As FKs foram ajustadas no laboratório para **`DEFERRABLE INITIALLY DEFERRED`**, com verificação na conclusão da transação (`SET CONSTRAINTS ALL IMMEDIATE`). Após esse ajuste, os dois backups completos foram importados com sucesso.

## 3. Scripts propostos, não aplicados

- [Preflight](./isolamento_empresas_PRECHECK_20261107.sql): consulta de inconsistências existentes; espera 0 resultados.
- [Proposta](./isolamento_empresas_PROPOSTA_20261107.sql): **12 índices únicos compostos** adicionais (3 pais já têm índices compatíveis) e **49 FKs compostas** para duas fases de implantação; com `NOT VALID`.
- [Validação](./isolamento_empresas_VALIDAR_20261107.sql): faz a verificação dos dados existentes de todas as 49 FKs em etapa posterior.

**Não executar automaticamente.** Aplicação em produção exige planejamento de locks, índices, janela de manutenção e autorização expressa. Não foram alterados os dados reais.

## 4. Itens pendentes antes de aplicar

1. Reproduzir e testar **triggers e funções de pagamentos, estornos, compras, assinatura e exclusões** do banco oficial. A réplica reproduz tipos e constraints, não todo comportamento operacional.
2. Realizar ensaio de regressão no aplicativo móvel e desktop, especialmente equipe, diárias, vale, bônus, exclusão e pagamentos distribuídos por obra.
3. Validar tempo de criação/validação das 49 FKs e índices, com estratégia de migração segura e rollback.
4. Conferir autorização, RLS e integridade do Storage na recuperação completa.
5. Só após esses testes e aprovação expressa, considerar aplicação oficial.

## 5. Preservação

O esquema temporário de assinaturas e as cópias das contas são eliminados após os testes. Os scripts ficam na ramificação de teste, sem alteração de aplicativos oficiais.

Referências técnicas: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html).
