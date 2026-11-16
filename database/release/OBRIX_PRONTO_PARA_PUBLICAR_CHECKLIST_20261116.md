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
- [ ] Executar o CI do PR e revisar os avisos do Supabase Security Advisor. A produção ainda registra `authenticated_security_definer_function_executable` e `auth_leaked_password_protection`; **não marcar como resolvidos sem revisão real**.
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
