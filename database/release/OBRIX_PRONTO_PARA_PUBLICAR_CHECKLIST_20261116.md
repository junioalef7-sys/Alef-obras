# OBRIX — Candidato à publicação oficial
**Data da revisão:** 16/11/2026  
**Base oficial preservada:** `92495c4898e66d45c44b9e4b240a63a336af4e59`  
**Branch:** `test/obrix-seguranca-pagamentos-20261116`  
**Estado:** **NÃO APROVADO PARA PRODUÇÃO — aprovação condicionada a testes finais**

## Escopo autorizado

Corrigir as operações financeiras da equipe e a exclusão de conta, preservando o restante do aplicativo, visual, configurações de PWA e desempenho aprovado. O OBRIX oficial e seu banco não devem sofrer mudanças até a homologação de ponta a ponta e aprovação explícita. Este pacote contém fontes e testes **guardados contra implantação acidental**.

## Componentes reunidos

1. `database/release/obrix_backend_release_candidate_20261116.sql`: proposta de backend transacional para pagamentos da equipe, rateio por obra e checklist, estorno correto, journal de exclusão, bloqueio de gravações e de uploads durante o encerramento. **Possui uma exceção inicial que impede qualquer aplicação direta.** Necessita revisão e retirada explícita da guarda apenas no procedimento final aprovado.
2. `database/release/obrix_backend_rollback_candidate_20261116.sql`: proposta de reversão, também guardada. Preserva o histórico de exclusões e recusa o rollback se houver solicitações ativas.
3. `supabase/functions/obrix-delete-account/index.ts` + `account-deletion-workflow.mjs` + `storage-cleanup.mjs`: fluxo de exclusão server-side com checkpoints, autenticação real do solicitante, varredura e remoção de arquivos via Storage API, SQL e Auth. Ainda **não implantado** no Supabase oficial.
4. `obrix-equipe-liquidacao-segura.js`: fluxo transacional para o backend oficial, mas **desligado por padrão** em `__OBRIX_PAGAMENTO_ATOMICO_PRODUCAO`. Mantém o caminho legado até o backend oficial ser homologado.
5. `obrix-financeiro-main.js`: edição de lançamentos manuais sem reenviar `status_lancamento` e `origem`.
6. `.github/workflows/obrix-seguranca-release-candidato.yml`: CI sem segredos que confere código, regras da migração e regressão em testes de conta, Storage e pagamento.

## Evidências já observadas

- Supabase de auditoria: 21 validações de exclusão e proteção de registros aprovadas, com fixtures revertidas.
- Supabase de auditoria: 7 validações de autorização de upload/encerramento aprovadas, com fixtures revertidas.
- Testes simulados existentes: 18 cenários de exclusão/recuperação e 8 de limpeza de arquivos aprovados anteriormente.
- Testes simulados desta revisão: 4 cenários do caminho novo de pagamento com backend falso e 8 invariantes estáticos do pacote aprovados. Cinco cenários foram acrescentados ao CI.
- Produção: nenhum dos novos procedimentos foi instalado no banco oficial; revisão de leitura não encontrou o journal ou a RPC nova.
- **Limite:** estes resultados não substituem testes reais de autenticação, Storage, orçamento, sincronização ou uso contínuo no iPhone, Android e computador.

## Bloqueios obrigatórios para liberação

- [ ] Revisar a proposta SQL integral contra o esquema oficial e testar no clone isolado **com todos os campos, FKs, triggers e políticas**; a guarda permanece ativa até então.
- [ ] Validar que o gatilho de exclusão não causa degradação de latência, deadlocks ou perda de Realtime nas operações mais usadas.
- [x] Executar E2E de **conta Auth inteiramente fictícia**, PDF e foto sintéticos, através de função temporária da auditoria com credenciais administrativas somente no servidor. **12/12 verificações aprovadas em 16/11/2026**, HTTP 200. A função foi desativada e os auxiliares removidos após o teste. Não houve execução no banco oficial.
- [ ] Confirmar bloqueio de uploads concorrentes, tentativas de escrita usando tokens antigos, recuperação de jobs interrompidos, conta com múltiplos membros e exclusão física de arquivos.
- [ ] Habilitar o novo pagamento **só no ambiente de teste apropriado**, com a RPC já migrada para o mesmo banco, testando valores por obra, checklists, vales antigos, bônus, duas meias diárias, faltas, duplicidade, estorno e rede intermitente.
- [ ] Validar fluxo end-to-end no iPhone, Android e computador em ambos os temas, sem alterar visual ou navegação; consultar logs de erros, travamentos e sincronização.
- [ ] Confirmar backup e restauração de teste do banco e mídias, além de rollback em ambiente equivalente.
- [x] Executar CI da homologação: [GitHub Actions 43866113947](https://github.com/junioalef7-sys/Alef-obras/actions/runs/43866113947), **sucesso**, incluindo testes de Documentos, Storage, Auth (simulado) e pagamentos.
- [ ] Concluir a análise e eventual correção dos avisos do Supabase Security Advisor: produção ainda registra `authenticated_security_definer_function_executable` (16 funções) e `auth_leaked_password_protection` (recurso de proteção de senha desativado). A revisão preliminar confirmou que as 16 funções têm controle de empresa/acesso ou identificação de usuário, mas a análise de funções internas delegadas e o alerta de senhas ainda exigem validação e decisão de configuração. **Não tratar os avisos como resolvidos.**
- [ ] Aprovar explicitamente o **SHA exato**, depois promover a versão testada conforme procedimento oficial.

## Ordem de promoção, somente após aprovação

1. Fazer snapshot consistente do banco e inventário dos arquivos; registrar o identificador da versão e um ponto de rollback.
2. Aplicar a migração **sem a guarda, após revisão técnica**, em ambiente equivalente; confirmar integridade e segurança de `authenticated` e `service_role`.
3. Homologar a nova Edge Function com conta fictícia no mesmo backend; validar o journal e o bloqueio de uploads.
4. Homologar a interface com `__OBRIX_PAGAMENTO_ATOMICO_PRODUCAO=true` em uma **prévia realmente isolada**. Não confundir domínio Preview com banco separado.
5. Preparar uma única publicação para o endereço oficial, com rollback de interface e banco coordenados. Não ativar restrições diretas de DELETE financeiro antes de verificar que nenhuma funcionalidade usa esse caminho.
6. Fazer checagem pós-publicação de uma diária, vale, bônus, pagamento e estorno **em uma empresa de teste**, nunca com dados de clientes.

## Condição de parada

Se o CI falhar, um cenário real de Auth/Storage não puder ser executado, ou o banco de preview não estiver isolado, **não publicar**. Não usar afirmações como “100% estável” ou “pronto para vender” sem evidências de produção.

## Documentação oficial consultada

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/auth/managing-user-data
- https://vercel.com/docs/deployments

## Divergência confirmada entre produção e main — BLOQUEIO DE MERGE

Consulta GitHub de 16/11/2026: `main` e o commit atualmente publicado `92495c4` estão divergentes. A comparação apresentou **17 commits em `main` além do ancestral comum** e **1.344 commits do histórico oficial não presentes em `main`** (contagens da API de comparação, sujeitas a mudanças posteriores). Portanto **nunca usar merge automático para main como forma de publicar esta correção**. Foi criada a branch base `review/obrix-oficial-92495c4-base-20261116` no SHA oficial, e o [PR #35](https://github.com/junioalef7-sys/Alef-obras/pull/35) foi redirecionado para ela como **rascunho**.

A versão a promover deverá ser um build staged derivado do SHA aprovado e verificado (não da branch `main` divergente). Nenhum merge/prod deployment está autorizado nesta fase.


## E2E real Auth + Storage concluído — 16/11/2026

**Projeto:** `OBRIX-AUDITORIA-AUTH-20261102` (`mjzlwnuklfopdmgcvdcs`). **Não realizado em produção.**

Foi criada uma identidade fictícia via `auth.admin.createUser`, uma empresa e perfil em `obrix_operacional_lab`, um bucket novo e isolado e dois arquivos (PDF e PNG) enviados por uma **sessão real**. A função Edge de auditoria chamou o fluxo da branch `account-deletion-workflow.mjs` e `storage-cleanup.mjs`, com um adaptador RPC service_role exclusivo ao laboratório. A solicitação foi reservada antes da tentativa de upload adicional.

**Resultado HTTP 200: 12/12 verificações `true`**: `auth_criado`, `empresa_ficticia_criada`, `login_real_validado`, `bucket_isolado_criado`, `pdf_enviado`, `foto_enviada`, `upload_durante_exclusao_bloqueado`, `arquivos_removidos`, `dados_empresa_removidos`, `auth_removido`, `token_anterior_recusado` e `bucket_temporario_removido`. A execução usou somente os novos UUIDs gerados, e nenhuma conta preexistente foi consultada para exclusão.

A primeira execução de diagnóstico foi interrompida pelo gatilho de limite do trial ao tentar criar uma obra sem JWT de usuário. O fixture foi limitado a empresa/perfil (exatamente o necessário para Auth+Storage), e a segunda execução passou integralmente; isso **não prova** o comportamento do trial/limite de obras no PWA.

**Limpeza pós-teste comprovada:** 3 usuários Auth, 243 objetos Storage e 2 buckets (mesmos números anteriores); 0 empresas, 0 solicitações e 0 usuários sintéticos remanescentes. As RPCs temporárias, política exclusiva do bucket de teste e `pg_net` foram removidos. A função Edge de execução única foi desativada, responde apenas 410 e voltou a exigir JWT. `authenticated` não ficou com USAGE no esquema interno da suíte. **Não ocorreu alteração no oficial.**

**O que este E2E não confirma:** a implementação da migração no `public` oficial, concorrência simultânea com dois clientes enviando arquivo, desempenho, recuperação real após falha intermediária da rede, fluxos de contas com vários membros, testes visuais em Android/iPhone/desktop e integração do cliente com a RPC oficial. Essas etapas permanecem pendentes.

**Fontes da API:** https://supabase.com/docs/guides/auth/managing-user-data , https://supabase.com/docs/guides/storage/security/access-control , https://supabase.com/docs/guides/storage/management/delete-objects .


## Correção isolada de visualização de Documentos — 16/11/2026

Arquivos: `obrix-documentos-direto.js`, `obrix-offline-v3.js` e `tests/obrix-documentos-viewer.cjs`. A área de `iframe` recebeu `min-height:0`/altura dinâmica `dvh` e o visualizador passou a oferecer a ação `Abrir completo`, que abre a URL assinada em resposta a um toque/clique direto. O carregador recebeu versão atualizada para evitar asset antigo no cache. Os demais módulos, cores e layout das telas não foram modificados.

**Teste:** cinco cenários automatizados aprovados, incluindo fluxo de iPhone simulado, URL assinada vinda do Storage e filtro de consulta por empresa. O pipeline GitHub Actions [43866113947](https://github.com/junioalef7-sys/Alef-obras/actions/runs/43866113947) executou essa suíte com `success`.

**Limite:** ainda não foi possível executar visualização real de arquivo multipágina em dispositivos físicos, nem verificar comportamento de impressão no Safari instalado como PWA. A correção não autoriza publicação por si só.

## Realtime, desempenho e segurança: verificações complementares

**Realtime oficial (consulta somente leitura):** a publicação `supabase_realtime` está configurada para operações `INSERT`, `UPDATE` e `DELETE` e inclui 12 tabelas fundamentais analisadas (`obras`, `funcionarios`, `diarias`, `vales`, `financeiro`, `pagamentos_equipe`, `documentos`, `notas`, `orcamentos`, `relatorios_fotograficos`, `fotos_obra` e `diarios_obra`). Essa configuração é necessária, mas **não comprova entrega em tempo real entre dispositivos**.

**Benchmark isolado:** `EXPLAIN ANALYZE SELECT obrix_seg_hml_20261116.executar_testes_exclusao_bloqueio_v1()` concluiu com **127,11 ms** para uma execução sintética da suíte de 21 verificações no laboratório. Este número não representa latência do PWA, carga concorrente, fila de Realtime ou desempenho Android/iPhone/desktop. O checklist de desempenho de uso contínuo permanece aberto.

**Advisor de segurança da produção:** 16 funções `SECURITY DEFINER` podem ser chamadas por `authenticated` (algumas são operações intencionais do aplicativo). A verificação de leitura confirmou controle de empresa/acesso no wrapper dessas funções ou identificação por `auth.uid()`; também foram inspecionados os delegados de backup e compras para comprovar filtragem por empresa. Isso **não é auditoria de exploração completa**, nem justifica revogar todas as chamadas de uma vez. O alerta de senhas vazadas continua ativo; sua configuração depende do plano e dos controles de Auth do Supabase. Consulta técnica: https://supabase.com/docs/guides/auth/password-security .

**Testes automatizados:** após a correção de Documentos, a execução [43866913530](https://github.com/junioalef7-sys/Alef-obras/actions/runs/43866913530) terminou em `success` para o commit `5bcbd551a39b9716e6bdc06cb6da7ffc3edfdacd`.

**Não houve merge, deploy em produção, alteração das políticas de Storage oficiais nem modificação de dados de clientes.**

## Bloqueio obrigatório: laboratório ainda não equivalente ao oficial

A auditoria de `information_schema.columns` identificou **89 divergências** nas 23 tabelas comparadas: 308 colunas no oficial e 279 colunas no laboratório anterior. A tabela `notificacoes` não está presente no laboratório; `perfis.empresa_id` é opcional no oficial, mas obrigatório na cópia. A nova migração foi corrigida para respeitar `NULL`, e o teste transacional de regressão foi aprovado com `ROLLBACK`. A migração continua bloqueada contra execução acidental.

**Atualização 16/11/2026:** o plano Supabase Pro foi confirmado; a autorização de custo por hora foi registrada e a ramificação `obrix-homologacao-final-20261116` foi criada. Entretanto, a criação terminou em `MIGRATIONS_FAILED` porque a primeira das 110 migrações oficiais (`20261016235013_audit_security_performance_base`) tenta modificar `public.atualizar_updated_at_diario()`, ausente em um banco vazio. O repositório não inclui a baseline `supabase/migrations` reprodutível. A branch vazia foi **excluída e a exclusão confirmada** para interromper o custo por hora. Antes de uma nova tentativa é obrigatório reconstruir e versionar a baseline do schema sem dados; [diagnóstico completo](./OBRIX_HOMOLOGACAO_BRANCH_FALHA_REPLAY_20261116.md).

**Status:** a homologação de paridade integral e o teste em PWA apontando para banco isolado continuam pendentes; não liberar promoção nem apresentar o release como pronto.

[Ver inventário de diferenças e teste](./OBRIX_HOMOLOGACAO_PARIDADE_BANCO_20261116.md).

## Atualização após reconstrução real e teste descartável (16/11/2026)

A baseline estrutural **sem dados** foi gerada a partir do esquema oficial e testada em uma ramificação isolada. O SQL criou as 41 tabelas `public`, funções, triggers e políticas esperadas, e a migração candidata também compilou nesse ambiente. A dependência de índice UNIQUE anterior a FK foi corrigida.

O teste integrado Auth/Equipe/Financeiro/Documentos/Storage passou em **15 verificações funcionais**. Houve falha na **conferência pós-exclusão** por `service_role` não ter `SELECT` direto em `financeiro`, não na própria exclusão; consulta SQL administrativa comprovou a remoção de todos os registros e objetos da empresa fictícia. A asserção de token antigo **não foi executada**. A tentativa de atualizar a função temporária foi bloqueada pelas configurações de segurança; não houve contorno.

A ramificação temporária foi excluída, e a listagem final mostrou somente a ramificação oficial, evitando custo contínuo. O relatório completo está em [OBRIX_HOMOLOGACAO_BASELINE_INTEGRADA_20261116.md](./OBRIX_HOMOLOGACAO_BASELINE_INTEGRADA_20261116.md).

**Status de release ainda BLOQUEADO:** o replay das 110 migrações oficiais não reconstrói o banco do zero sem baseline adicional; testes físicos nos três dispositivos, JWT antigo, recuperação/backup, desempenho contínuo e alertas de segurança continuam pendentes. Não promover o PR nem alterar produção até fechar essas verificações.

## Conclusão do ensaio de esquema completo — 16/11/2026

**NÃO LIBERADO PARA PUBLICAÇÃO.**

Foi criada uma baseline de banco **somente de definições**, incluindo 41 tabelas `public`, 2 tabelas `private`, 66 funções, 38 gatilhos, 65 políticas, 239 restrições e 149 índices independentes. Ela foi validada em transação com `ROLLBACK` e instalada apenas em ramificação Supabase temporária. A migração candidata de pagamento e exclusão compilou e foi instalada nessa mesma ramificação. Verificou-se equivalência inicial de 41 tabelas, 56 funções e 54 políticas no esquema público.

O E2E autenticado no banco reconstruído aprovou criação de conta, perfil, trial, login, duas obras, funcionário, duas meias diárias em obras diferentes, vale, bônus, pagamento, rateio e bloqueio de duplicidade. A RPC de estorno foi aceita e uma consulta posterior confirmou duas diárias e um vale reabertos e dois lançamentos financeiros estornados. A leitura direta com `service_role` do Financeiro e das Diárias foi bloqueada por ACLs que **também existem no banco oficial**; o teste não ampliou privilégios para contorná-las.

**Não concluídos nessa ramificação:** integração real de Documentos, remoção Auth+Storage+DB, retomada, carga/realtime e teste em três aparelhos. A função HTTP temporária foi substituída por resposta 410 e autenticação obrigatória; a ramificação deixou de constar na lista de branches/projetos do Supabase antes da última bateria de SQL. Não atribuir causa ou custo final sem confirmação da plataforma.

**Bloqueio primário persistente:** as 110 migrações históricas do banco oficial ainda não iniciam o projeto do zero: a primeira depende de `public.atualizar_updated_at_diario()` e de várias tabelas preexistentes. A baseline em GitHub **não altera automaticamente esse histórico**. Corrigir a linhagem de migração com procedimento de baseline/reconciliação rigoroso, sem operar em produção antes de aprovação específica.

[Resultados técnicos, evidências e casos pendentes](./OBRIX_HOMOLOGACAO_RESULTADOS_BRANCH_20261116.md).

A versão oficial da Vercel continua em `92495c4898e66d45c44b9e4b240a63a336af4e59` (`READY`). O PR #35 permanece em rascunho. O Supabase Pro continua ativo, mesmo sem branch temporária; acompanhar a cobrança mensal.

**Segurança adicional:** o repositório `junioalef7-sys/Alef-obras` está PUBLIC, e o novo arquivo de baseline contém a implementação de funções e políticas. A varredura inicial de literais não localizou tokens JWT ou chaves conhecidas, mas **não substitui auditoria de segredos**; avaliar tornar o repositório privado antes da comercialização. Não alterar sua visibilidade automaticamente.
