# OBRIX — Homologação estrutural e funcional em Supabase isolado

**Data:** 16/11/2026  
**Situação:** avanço importante, **NÃO LIBERADO PARA PUBLICAÇÃO OFICIAL**.

## Ambiente utilizado

- Supabase Pro em organização do OBRIX.
- Projeto oficial: `gnvclctqnwxnjxydzhwc` (não alterado).
- Ramificação temporária descartável: `obrix-baseline-ensaio-20261116` (`ygcwnozfseojqronhaan`), criada sem dados da produção.
- Custo cotado da ramificação: US$ 0,01344/h.
- **Remoção realizada após o ensaio:** `delete_branch` devolveu `success:true`, e `list_branches` confirmou que apenas `main` permanece. A remoção também desativa a função E2E temporária e exclui os registros sintéticos exclusivos da ramificação.

## Baseline do banco reconstruída

Arquivo: [`obrix_hml_baseline_schema_sem_dados_20261116.sql`](./obrix_hml_baseline_schema_sem_dados_20261116.sql).

Extração feita somente por leitura de metadados do PostgreSQL oficial, sem copiar dados de usuários, fotos, arquivos, tokens ou senhas:

| Componente | Elementos |
|---|---:|
| Tabelas nos esquemas public e privados | 43 |
| Colunas | 536 |
| Funções | 66 |
| Restrições | 239 |
| Índices independentes | 149 |
| Gatilhos de aplicação e Auth | 38 |
| Políticas RLS/Storage | 65 |

O primeiro ensaio falhou porque uma chave estrangeira dependia de um índice UNIQUE ainda não criado. A ordem foi corrigida para **PK/UNIQUE/CHECK → índices independentes → FKs**. O ensaio seguinte executou a baseline completa em banco descartável.

O pacote `obrix_backend_release_candidate_20261116.sql` foi compilado sobre essa estrutura no mesmo banco de homologação. Uma conferência direta confirmou:
- 41 tabelas `public`;
- 61 funções `public`, incluindo as RPCs de pagamento e de exclusão;
- 38 gatilhos de bloqueio de gravação durante a exclusão;
- 2 políticas Storage restritivas;
- `perfis.empresa_id` e `notificacoes.empresa_id` preservados como nullable;
- RPCs de exclusão acessíveis apenas a `service_role`, e RPC de pagamento disponível para `authenticated`.

**Observação de auditoria:** uma execução retornou sucesso na consulta de `ROLLBACK`, mas posteriormente o banco apresentou a estrutura instalada. Por isso, o estado final foi verificado diretamente por consultas posteriores; não se considera comprovada uma reversão integral dessa execução anterior.

## Teste integrado real na estrutura candidata

Um teste HTTP via Edge Function **temporária e de uso único** criou uma conta fictícia isolada (via Auth Admin), realizou login real, inseriu dados de obra/equipe, executou a RPC de pagamento, enviou um documento via Storage e solicitou a exclusão.

**15 verificações concluídas positivamente no retorno da função:**

1. Conta Auth criada;
2. Empresa e perfil gerados automaticamente no cadastro;
3. Login real;
4. Duas obras;
5. Funcionário;
6. Duas meias diárias na mesma data, em obras distintas;
7. Vale;
8. Bônus;
9. Pagamento atômico no valor líquido esperado;
10. Rateio financeiro em duas obras;
11. Pagamento duplicado recusado;
12. Upload de PDF;
13. Registro do documento;
14. Reserva da exclusão;
15. Rejeição de novo upload após a reserva.

A função prosseguiu até concluir a exclusão da conta, mas respondeu HTTP 500 **apenas na etapa de auditoria posterior**, pois o papel `service_role` não possui `SELECT` direto na tabela `financeiro` nesse esquema. Essa falta de permissão já está presente na estrutura extraída do oficial; ampliar a permissão apenas para fazer o teste passar seria incorreto.

Uma consulta SQL administrativa independente, usando os UUIDs **exclusivamente fictícios** dessa execução, confirmou:
- Auth fictício inexistente;
- empresa fictícia inexistente;
- **0** lançamentos financeiros associados;
- **0** registros de documento associados;
- **0** objetos Storage com o prefixo da empresa;
- etapa `finalizado` persistida no journal de exclusão;
- bucket temporário inexistente.

**Pendência:** o bloqueio de gravação usando o JWT antigo não chegou a ser executado no teste HTTP devido à falha da consulta intermediária. A tentativa de republicar a função E2E com a asserção corrigida foi **bloqueada por controles de segurança do ambiente**. Não foi realizada nenhuma tentativa de contorno.

## Requisitos ainda abertos para publicação

1. Transformar a baseline em uma sequência de migrações reproduzível desde banco novo e corrigir a dependência da primeira dentre as 110 migrações históricas; hoje a criação automática de ramificação ainda retorna `MIGRATIONS_FAILED`.
2. Concluir o E2E sem exceções de conferência, incluindo tokens antigos e falhas intermediárias de rede.
3. Homologar de forma prolongada o PWA em iPhone, Android e computador, com sincronização, offline, impressão de PDFs e registos de Equipe/Financeiro/Documentos.
4. Revisar alertas de segurança do Supabase, inclusive `authenticated_security_definer_function_executable`, proteção contra senhas vazadas e políticas permissivas sobrepostas.
5. Executar teste verificável de backup/restauração e rollback completo, incluindo mídia e Auth.
6. Confirmar o SHA final na Vercel e realizar uma só publicação oficial **após aprovação específica**.

A migração de release ainda contém guarda deliberada que a impede de ser aplicada inadvertidamente. O PR [#35](https://github.com/junioalef7-sys/Alef-obras/pull/35) permanece rascunho. A produção segue na versão `92495c4`.

## Documentação oficial

- [Supabase Branching — Troubleshooting](https://supabase.com/docs/guides/deployment/branching/troubleshooting)
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase Auth — Managing User Data](https://supabase.com/docs/guides/auth/managing-user-data)
- [Supabase Storage — Access Control](https://supabase.com/docs/guides/storage/security/access-control)
