# OBRIX — Homologação em banco reconstruído (16/11/2026)

**Status: HOMOLOGAÇÃO PARCIAL; NÃO PUBLICAR EM PRODUÇÃO.**

## Isolamento verificado

- Banco oficial: `gnvclctqnwxnjxydzhwc`, apenas consultas de leitura nesta etapa.
- Versão Vercel oficial: commit `92495c4898e66d45c44b9e4b240a63a336af4e59` (`READY`).
- Ramificação temporária utilizada: `obrix-baseline-ensaio-20261116` (`ygcwnozfseojqronhaan`). Status inicial `MIGRATIONS_FAILED` devido ao primeiro dos 110 patches do histórico. **Após os ensaios, não apareceu mais em `list_branches` nem em `list_projects`**. Não afirmar método de remoção nem valor final faturado sem consultar a fatura.
- Usuários e valores de teste foram criados exclusivamente na ramificação, todos com identificador `obrix-e2e-20261116-*@example.com`. Não foi usado nenhum registro de cliente.
- O endpoint temporário de E2E foi substituído por resposta 410 e passou a exigir JWT antes do desaparecimento da ramificação.

## Nova baseline de esquema

Arquivo versionado: [baseline estrutural protegida](./obrix_hml_baseline_schema_sem_dados_20261116.sql).

O SQL foi gerado a partir de catálogos do PostgreSQL do banco oficial, com somente **DDL, não dados**, abrangendo:
- 43 tabelas (41 `public`, 2 `private`), 536 colunas;
- 66 funções, 239 constraints, 149 índices independentes;
- 38 triggers (incluindo Auth), 65 políticas de RLS/Storage;
- 2 sequências e grants observados em cada tabela/função.

Uma primeira execução isolada falhou porque alguns FKs dependiam de índices únicos independentes. O arquivo foi corrigido para criar índices antes de FKs. O segundo ensaio executou a baseline inteira com `ROLLBACK` bem-sucedido.

A baseline foi instalada **somente na ramificação temporária**, com a respectiva autorização local de ensaio. Conferência: **41 tabelas `public`, 56 funções `public`, 54 políticas `public`**, sem usuários e sem registros da empresa inicialmente.

## Migração candidata

`obrix_backend_release_candidate_20261116.sql` foi executada com sucesso sobre o esquema isolado reconstruído, primeiro com `ROLLBACK`, depois somente na ramificação temporária. A função `obrix_pagar_equipe_transacional_v2` existia, e duas políticas adicionais de bloqueio de upload estavam presentes.

Correção de permissão: a função e outros controles da migração foram ajustados para aceitar o papel real `administrador`, conforme constraint oficial, e não o valor inexistente `admin`.

**Observação:** o próprio arquivo de release segue com guarda `OBRIX RELEASE BLOCKED`; somente o ensaio local removeu temporariamente essa guarda, exclusivamente na ramificação descartável.

## Testes de integração efetivamente executados

Um executor temporário isolado chamou APIs verdadeiras de Auth, PostgREST, Storage e as RPCs da aplicação, com credenciais administrativas mantidas no servidor.

| Fluxo | Resultado observado |
|---|---|
| Auth Admin — usuário fictício | Aprovado |
| Trigger de cadastro — empresa e perfil | Aprovado |
| Assinatura trial | Aprovado |
| Login com senha real | Aprovado |
| Criação de 2 obras pelo usuário autenticado | Aprovado |
| Cadastro de funcionário | Aprovado |
| 2 meias diárias em obras distintas | Aprovado |
| Registro de vale e bônus | Aprovado |
| Pagamento transacional | Aprovado |
| Rateio do valor líquido entre as 2 obras | Aprovado |
| Bloqueio de tentativa de pagamento duplicado | Aprovado |
| RPC de estorno | Aceita; leitura SQL posterior confirmou 2 diárias e 1 vale reabertos, além de lançamentos estornados |
| Upload e visualização real de Documentos nessa ramificação | **Não concluído** |
| Exclusão real Auth + Storage + banco nessa ramificação | **Não concluído** |
| Teste de restauração de backup e uso físico iPhone/Android/PC | **Não concluído** |

Na primeira execução, uma consulta com `service_role` foi recusada pelo ACL do Financeiro. Uma verificação somente de leitura comprovou que a mesma proibição existe no banco oficial; o teste foi corrigido para ler o rateio como `authenticated`, sem modificar grants oficiais. Na segunda execução, o rateio e a duplicidade passaram, e o estorno executou; o teste interrompeu-se ao tentar conferir as diárias com o mesmo papel administrativo, igualmente sem permissão de SELECT direto. Uma consulta SQL posterior comprovou que o estorno retornou os registros para aberto.

**Não tratar as verificações não executadas como aprovadas.**

O E2E de 12/12 etapas de Auth/Storage registrado anteriormente foi realizado no laboratório simplificado `mjzlwnuklfopdmgcvdcs`; não substitui a execução na estrutura completa.

## Bloqueios ainda abertos

1. **Migrações Supabase:** a criação automática de novas branches continua em `MIGRATIONS_FAILED`. O histórico oficial de 110 migrações pressupõe objetos preexistentes; a baseline candidata foi testada manualmente, mas o histórico de migração de produção **não foi reescrito**. Para corrigir com segurança, é necessário versionar e revisar um baseline oficial ou reparar a cadeia de migrações com a Supabase CLI e testar nova criação do zero. Não alterar o histórico do banco oficial sem aprovação de uma operação específica.
2. **E2E completo na estrutura real:** concluir Documentos, exclusão definitiva, retomada após falhas, sessões antigas e bloqueio de upload concorrente.
3. **Testes de dispositivos e Realtime:** iPhone, Android e computador nos dois temas, incluindo navegação prolongada e sincronização de registros sucessivos.
4. **Backups e segurança:** testar restauração de backup, rollback, Security Advisor e proteção contra senhas comprometidas; a versão atual ainda possui alertas de segurança.
5. **Publicação coordenada:** preparar migração SQL + Edge Functions + interface sob revisão, com rollback e commit exato aprovado. O PR #35 é rascunho e não deve ser mesclado ou promovido automaticamente.

**Conclusão:** a reconstrução e os testes de pagamentos avançaram, mas o pacote **ainda não está liberado para produção**. O oficial permaneceu sem alterações.

## Fontes de referência

- https://supabase.com/kb/troubleshooting/branch-in-migrations-failed-status
- https://supabase.com/docs/guides/deployment/branching/troubleshooting
- https://supabase.com/docs/guides/deployment/branching
- https://github.com/junioalef7-sys/Alef-obras/pull/35
