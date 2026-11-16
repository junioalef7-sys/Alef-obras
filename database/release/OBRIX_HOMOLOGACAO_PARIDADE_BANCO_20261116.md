# OBRIX — paridade do banco e bloqueio de publicação
**Data:** 16/11/2026  
**Produção:** Supabase `gnvclctqnwxnjxydzhwc`, esquema `public` (consultas somente leitura).  
**Laboratório anterior:** Supabase `mjzlwnuklfopdmgcvdcs`, esquema `obrix_operacional_lab`.  
**Branch do código:** `test/obrix-seguranca-pagamentos-20261116`.  
**Status:** **NÃO LIBERADO PARA PRODUÇÃO**.

## Problema reproduzido

Foi comparada a estrutura de **23 tabelas de maior relevância** para pagamentos, Documentos, cadastro, obras e exclusão de conta, utilizando `information_schema.columns` dos dois projetos.

| Medida | Valor |
|---|---:|
| Colunas no banco oficial (conjunto analisado) | 308 |
| Colunas correspondentes no laboratório | 279 |
| Divergências de coluna, nulidade ou valor padrão | 89 |

Exemplos relevantes:
- `public.perfis.empresa_id` é **nullable** em produção, mas **NOT NULL** no laboratório. Cadastros ainda sem empresa podem ser legítimos.
- `public.notificacoes.empresa_id` é **nullable** e a tabela inteira `notificacoes` não foi incluída na cópia do laboratório.
- `empresas`, `assinaturas` e `perfis` têm outras colunas presentes no oficial e ausentes na cópia, inclusive campos de trial, nome e dados de cadastro.
- Em `documentos`, `compras`, `diarios_obra`, `relatorios_fotograficos`, `estoque_movimentacoes` e outras tabelas, vários valores padrão não coincidem.
- `diarias.motivo_cancelamento` existe em produção e não está no laboratório.

**Consequência:** as suítes transacionais aprovadas no laboratório fornecem evidência dos comportamentos testados, mas **não demonstram compatibilidade integral do release com o banco oficial**.

## Correção já entregue

A migração candidata em `obrix_backend_release_candidate_20261116.sql` foi corrigida:
- Permite `INSERT`, `UPDATE` e `DELETE` de registros cujo `empresa_id` permanece `NULL`, respeitando o esquema existente.
- Ao atualizar `empresa_id` de `NULL` para um UUID, verifica a trava transacional e bloqueia o vínculo com uma empresa que está sendo excluída.
- Mantém bloqueio de `INSERT` com `empresa_id` de empresa em exclusão.

Foi executado teste no banco de auditoria com uma tabela temporária que permite `empresa_id NULL`, uma empresa fictícia em exclusão e uma segunda empresa autorizada. **Passou:** criação/edição global, mudança de vínculo para empresa permitida, bloqueio de vínculo e inserção em empresa em exclusão, e exclusão de registro global. **BEGIN/ROLLBACK** reverteu todos os dados e substituições temporárias de funções.

Evidência reproduzível: `obrix_hml_regressao_empresa_nula_20261116.sql`, com proteção para impedir execução em projeto que não contenha os esquemas privados da auditoria. Adicionado teste ao `obrix-prepublish-safety-gate.cjs`.

## Requisitos antes de publicar

1. Criar ambiente Supabase de homologação derivado das **migrações do projeto oficial**, sem dados de clientes e com credenciais próprias, conforme documentação de Supabase Branching.
2. Cotar e obter autorização explícita para eventual **custo de ramificação**. A tentativa de criação do ambiente retornou `confirm_cost_id` obrigatório; **nenhuma ramificação foi criada**.
3. Aplicar o release candidato **após revisão e sem a guarda de bloqueio**, somente nesse ambiente de homologação.
4. Executar testes reais de cadastro inicial, trial, Documentos e anexos, pagamentos/estornos, exclusão da empresa, Auth, Storage, Realtime e backups.
5. Validar a reversão, critérios de latência, fluxo em iPhone/Android/desktop e alertas do Supabase Security Advisor.
6. Não promover automaticamente o PR de revisão `#35`, nem aplicar migrações ao banco oficial antes da aprovação específica do release.

## Documentação

- https://supabase.com/docs/guides/deployment/branching
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/changelog.md
