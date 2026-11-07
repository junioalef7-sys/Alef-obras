# OBRIX — Homologação da restauração operacional isolada

**Data do ensaio:** 07/11/2026 (UTC), correspondente a 06/11/2026 em horário de Brasília.

**Escopo:** projeto Supabase de AUDITORIA, esquema privado `obrix_operacional_lab`. Não foi realizada publicação ou gravação no projeto de produção.

## Testes comprovados

| Verificação | Resultado |
| --- | ---: |
| Tabelas operacionais representadas | 32 |
| Restrições originais reproduzidas (PK, FK, UNIQUE, CHECK) | 187 |
| Restrições adicionais de integridade por empresa testadas | 23 |
| Total de restrições na réplica, incluindo PK de empresas fictícia | 211 |
| Backups JSON completos testados | 2 |
| Registros recuperados no PostgreSQL | 625 / 625 |
| Conta principal (6 obras) | 464 |
| Conta de testes (8 obras) | 161 |
| Obras recuperadas | 14 |
| Funcionários recuperados | 16 |
| Diárias recuperadas | 229 |
| Lançamentos financeiros | 85 |
| Vínculos pagamento-diária | 106 |
| Fotos com metadados no banco | 45 |
| Falha simulada após gravação | ROLLBACK confirmado para ambas as contas |
| Falha simulada com dados já existentes | ROLLBACK confirmou hashes imutáveis |
| Restauração repetida (idempotência) | Nenhuma duplicação ou mudança de hash observada |
| Proteção cruzada de funcionário/diária na réplica reforçada | Bloqueou vínculo com funcionário de outra empresa |

### Totais financeiros recuperados do backup

| Conta | Receitas | Despesas | Soma das diárias |
| --- | ---: | ---: | ---: |
| Principal, arquivo de 03/11/2026 | R$ 136.596,00 | R$ 103.837,45 | R$ 24.080,00 |
| Testes, arquivo de 07/11/2026 | R$ 6.800,00 | R$ 850,00 | R$ 25.585,00 |

**Importante:** o backup da conta principal contém 111 diárias; uma verificação da produção já identificou 126 diárias atuais. Não substitua registros atuais pelo backup antigo.

## Pendência séria identificada

Uma FK original da tabela `diarias` valida somente `funcionario_id`. Num ensaio isolado, essa regra aceitou apontar uma diária de uma empresa para um funcionário de outra, desde que o ID estrangeiro existisse. A operação foi revertida e nenhum dado oficial foi alterado.

Foi acrescentada somente no laboratório uma FK composta `(funcionario_id, empresa_id)` para `funcionarios(id, empresa_id)`, bem como proteções adicionais para vínculos críticos de obras, checklist, financeiro e pagamentos. A tentativa cruzada passou a falhar.

**Status:** não aplicar correções na produção sem avaliar todos os vínculos críticos, possíveis migrações e efeito sobre o aplicativo, testar e aprovar explicitamente.

## Limitações de homologação

1. A réplica foi construída a partir dos tipos, colunas e restrições do banco oficial, mas **não** implementa integralmente os gatilhos, funções operacionais, políticas RLS, índices de desempenho ou mecanismos de login reais.
2. Os 242 arquivos históricos da conta de testes e os 45 arquivos da conta principal no Supabase Storage não foram restaurados fisicamente neste ensaio. O backup JSON contém registros, não os objetos binários do Storage.
3. O recurso oficial de restauração do OBRIX não foi alterado nem habilitado. O código atual continua exigindo uma implementação/validação transacional segura antes da comercialização.
4. A conta com 8 obras é exclusivamente de testes. Suas 105 diárias com `paga=false` e `pago_em` preenchido não foram corrigidas.
5. Os dados dos dois backups foram eliminados do ambiente de auditoria após as verificações.

## Próximas ações

- Resolver vínculos entre empresas no banco oficial, com migration revisada e testes em ambiente separado.
- Validar a restauração sobre esquema com gatilhos/funções/RLS, inclusive os casos de pagamento, vale, bônus, estorno, versões e assinaturas.
- Testar a recuperação dos objetos Storage separadamente e compará-los com o inventário de arquivos.
- Liberar o fluxo de restauração apenas após esses testes; produção permanece intacta.

Fonte técnica: Supabase [Database Functions](https://supabase.com/docs/guides/database/functions) e [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
