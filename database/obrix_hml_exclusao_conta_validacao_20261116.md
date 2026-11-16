# OBRIX — Exclusão de conta: diagnóstico e prévia (16/11/2026)

**Escopo:** alterações apenas na branch `test/obrix-seguranca-pagamentos-20261116`. Nada publicado no aplicativo oficial; sem exclusão de usuários reais; proposta SQL propositalmente aborta antes de qualquer DDL ou DELETE.

## Problema confirmado no laboratório anterior

A trigger `obrix_proteger_financeiro_automatico` bloqueou a exclusão em cascata de lançamentos automáticos de uma empresa fictícia. A Edge Function oficial tentava contornar isso com `UPDATE financeiro SET status_lancamento='estornado'`, depois `DELETE financeiro`, depois `DELETE empresas` em chamadas separadas. Não há garantia de atomicidade entre elas, e o contorno prejudica o histórico dos pagamentos.

## Fluxo novo na branch de testes

- `supabase/functions/obrix-delete-account/index.ts` encaminha a operação para `account-deletion-workflow.mjs`.
- A pré-validação exige usuário e empresa correspondentes, papel autorizado quando há apenas um membro e uma RPC transacional `obrix_excluir_empresa_dados_v1`; sem RPC preparada, nada é apagado.
- Somente após a prévia real no banco, executa limpeza do Storage pela API; depois confirma a remoção de dados empresariais na RPC e, por último, exclui o login no Supabase Auth.
- Se a empresa tiver outros integrantes, preserva a empresa e o Storage; somente o perfil do usuário e sua autenticação são removidos.
- A proposta SQL preserva as restrições financeiras para operações normais. Em exclusão empresarial autorizada, contexto de transação interno permite apagar o Financeiro sem um estorno contábil artificial. Um teste de prévia executa os DELETEs em uma subtransação PL/pgSQL e os **reverte**, detectando erros de FK/gatilho antes de remover Storage.

## Testes realizados

Oito testes JavaScript com clientes simulados passaram:
1. Último titular: contagem → prévia SQL → Storage → SQL → Auth.
2. Prévia SQL falha: nenhuma exclusão.
3. Banco falha após Storage: não exclui Auth, informa estado parcial.
4. Empresa com múltiplos membros: preserva arquivos e dados compartilhados.
5. Perfil sem papel autorizado: não inicia exclusão.
6. ID de perfil divergente: não inicia exclusão.
7. Retomada sem perfil: tentativa limitada à exclusão de Auth.
8. Falha no Auth: não relata sucesso.

Teste fonte: `tests/obrix-excluir-conta-fluxo-seguro.cjs`.

## Limites e pendências obrigatórias

- **A proposta SQL ainda NÃO foi aplicada ao Supabase de auditoria.** Na última verificação, o acesso via conector retornou `link_id must identify an eligible linked account`; não foi possível testar a mudança no banco nesta etapa.
- O SQL foi deliberadamente protegido por um `RAISE EXCEPTION` inicial. **Não remover essa guarda nem publicar a migração até a revisão completa.**
- O preflight não torna Storage, Postgres e Auth uma operação distribuída atômica. Mudanças concorrentes entre prévia SQL e exclusão efetiva ainda precisam de bloqueio operacional, estado de exclusão/retomada e política de não regravação.
- Antes do uso por clientes, validar todos os gatilhos e tabelas com FK; testar no banco de auditoria com dados fictícios, incluindo dados compartilhados, imagens e falhas entre etapas.
- Avaliar Auth tokens/sessões, registros órfãos, permissões `service_role` e limpeza das outras referências à empresa.
- **Versão oficial em produção permanece no commit `92495c4898e66d45c44b9e4b240a63a336af4e59`.**

## Referências

- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/docs/guides/storage/management/delete
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Homologação do banco concluída — 16/11/2026

**Ambiente exclusivamente utilizado:** Supabase `mjzlwnuklfopdmgcvdcs` (auditoria). Nenhuma migração foi aplicada ao banco oficial `gnvclctqnwxnjxydzhwc`; a função `public.obrix_excluir_empresa_dados_v1(uuid,uuid,boolean)` não existe na produção.

Após confirmação do acesso, a lógica foi adaptada somente para os esquemas privados `obrix_operacional_lab`, `obrix_exclusao_hml_20261116` e `obrix_seg_hml_20261116`. A versão efetivamente validada foi registrada em [obrix_hml_exclusao_empresa_lab_validado_20261116.sql](./obrix_hml_exclusao_empresa_lab_validado_20261116.sql). O arquivo mantém uma guarda transacional intencional e não deve ser executado diretamente nem usado na produção.

A suíte `obrix_seg_hml_20261116.executar_testes_exclusao_v1()` confirmou **true** para:
- `exclusao_financeiro_direta_bloqueada`: lançamento automático continua protegido contra DELETE direto.
- `usuario_sem_vinculo_rejeitado`: usuário estranho não autoriza remoção.
- `empresa_com_multiplos_usuarios_preservada`: não apaga dados compartilhados quando existem vários membros.
- `preflight_transacional_reverte_dados`: teste real de exclusão executa operação e reverte seus efeitos.
- `exclusao_empresa_transacional_concluida`: pagamento, vale, financeiro e empresa são apagados na mesma transação.
- `outra_empresa_intacta`: obras, autenticação operacional e lançamentos de empresa diferente não são afetados.
- `protecao_financeira_outra_empresa_mantida`: DELETE direto de **outro pagamento automático** segue bloqueado após exclusão autorizada.
- `registro_manual_outra_empresa_preservado`: lançamento manual de outra empresa permanece.
- `contexto_transacional_limpo`: não sobram exceções temporárias ativas.
- `fixtures_revertidas`: a suíte descarta integralmente os dados artificiais ao terminar.

Verificação final: **0** linhas em `obrix_operacional_lab.empresas`, `perfis`, `financeiro`, `pagamentos_equipe` e `obrix_exclusao_hml_20261116.contexto`. `authenticated` não tem EXECUTE na RPC privada; `service_role` possui privilégio EXECUTE, mas não tem USAGE no esquema privado da suíte. Portanto, a API Edge **ainda não está integrada** a essa versão de laboratório. Nenhuma conta Auth nem arquivo real foi excluído.

Supabase Security Advisor do projeto de auditoria ainda apresentou avisos de `authenticated_security_definer_function_executable` e proteção contra senhas vazadas não ativada, além do aviso informativo `rls_enabled_no_policy`. Eles não foram declarados resolvidos.

**Pendências antes da versão oficial:** desenhar fluxo de retomada de exclusão em caso de falha entre Storage, SQL e Auth; validar concorrência com transações de usuários; testar o endpoint autenticado com conta fictícia isolada; revisão de todas as FKs e vínculos de Storage; validar o botão em preview iPhone/Android/computador, a sessão e a remoção de arquivos físicos; aprovação explícita antes de qualquer alteração no oficial.


## Validação de retomada, Auth e Storage — 16/11/2026

O Supabase de auditoria possui **3 registros em Auth e 243 objetos em Storage** (2 buckets). Eles foram preservados: nenhuma conta Auth e nenhum arquivo físico foram excluídos nos testes desta rodada.

Foi instalado exclusivamente em `obrix_exclusao_hml_20261116` o registro `solicitacoes` com fases `preparado`, `storage_concluido`, `banco_concluido` e `finalizado`. As funções privadas `obrix_reservar_exclusao_v1`, `obrix_avancar_exclusao_v1` e `obrix_consultar_exclusao_v1` permitem retomar a partir da última confirmação, impedir etapas fora de ordem e impedir que outro usuário assuma a solicitação. A fase `banco_concluido` é gravada na mesma transação que exclui os dados da empresa.

A suíte SQL `obrix_seg_hml_20261116.executar_testes_exclusao_journal_v1()` retornou todas as verificações `true`, incluindo: `reserva_idempotente`, `reserva_outro_usuario_rejeitada`, `salto_de_etapas_rejeitado`, `storage_checkpoint_idempotente`, `banco_checkpoint_idempotente`, `solicitacao_persiste_apos_exclusao`, `auth_checkpoint_simulado`, `preflight_transacional_reverte_dados`, `exclusao_empresa_transacional_concluida`, `outra_empresa_intacta`, `protecao_financeira_outra_empresa_mantida` e `fixtures_revertidas`.

A rotina JavaScript `account-deletion-workflow.mjs` passou a utilizar checkpoints, com consulta de retomada por usuário mesmo após a exclusão do perfil empresarial. Detecta `deleteUser` executado anteriormente e só considera a conta removida se `getUserById` comprovar **404**. Testes simulados dessa versão: **18/18** (fluxo/Auth) e **8/8** (Storage), executados com funções em memória. Os arquivos de testes estão em `tests/obrix-excluir-conta-fluxo-seguro.cjs` e `tests/obrix-delete-account-storage.cjs`.

A checagem final do laboratório encontrou: `auth_users=3`, `storage_objects=243`, `lab_empresas=0`, `lab_financeiro=0`, `solicitacoes=0` e `contextos=0`. Permissões de `authenticated` em `solicitacoes` e nas RPCs de journal: negadas. O `service_role` tem EXECUTE nos métodos privados, mas **não tem USAGE no schema privado do laboratório**, e essas funções não estão expostas pelo PostgREST. A Edge Function não foi implantada nem testada por HTTP nessa etapa.

**Limites antes de aprovar clientes:** criar um usuário inteiramente fictício pelo Auth Admin do projeto de auditoria, arquivos novos criados exclusivamente para o teste via Storage API e executar uma requisição autenticada real à Edge Function isolada. Garantir bloqueio de novos registros e uploads durante o encerramento (concorrência), revisão dos tokens/sessões que permanecem válidos até `exp`, inventário de paths legados, jobs interrompidos após remoção do Auth e suporte à retomada administrativa. Não publicar no OBRIX oficial antes de aprovação expressa.

**Arquivos:** [journal SQL](./obrix_hml_journal_exclusao_retomavel_20261116.sql), [fluxo retomável](../supabase/functions/obrix-delete-account/account-deletion-workflow.mjs), [testes](../tests/obrix-excluir-conta-fluxo-seguro.cjs).

**Referências:** https://supabase.com/docs/guides/auth/managing-user-data e https://supabase.com/docs/guides/storage/management/delete-objects.

## Bloqueio de alterações durante exclusão — teste concluído em 16/11/2026

**Somente Supabase de auditoria**: foi instalada a trigger `obrix_hml_bloquear_gravacoes_exclusao` em **35 tabelas** clonadas do schema `obrix_operacional_lab` (inclusive controle de DELETE/UPDATE da empresa). O código `obrix_exclusao_hml_20261116.bloquear_gravacoes_empresa()` usa o mesmo lock consultivo transacional do journal, valida a fase da exclusão e permite somente a transação privada autorizada que está removendo os dados da empresa. Não altera as tabelas reais de `public`.

A suíte `obrix_seg_hml_20261116.executar_testes_exclusao_bloqueio_v1()` retornou todos os **21 indicadores como true**, incluindo `insert_apos_reserva_bloqueado`, `update_apos_reserva_bloqueado`, `delete_apos_reserva_bloqueado` e `outra_empresa_continua_editavel`. Manteve as validações anteriores de exclusão transacional, preflight com rollback, isolamento da outra empresa, rastreabilidade do journal e bloqueio de DELETE financeiro direto. Todos os dados sintéticos da suíte foram revertidos.

[SQL de evidência e suíte de testes](./obrix_hml_trava_gravacoes_exclusao_20261116.sql) — arquivo com guarda de execução para evitar migração acidental.

**Escopo não coberto:** gravação de novos arquivos na API Supabase Storage e sessões JWT já emitidas **não são barradas por este gatilho de tabelas**. Continuam obrigatórios testes HTTP reais com uma nova conta Auth totalmente fictícia, arquivos novos exclusivamente de teste e verificação de uploads concorrentes. A interface de teste ainda não executa a exclusão real completa; publicação oficial continua proibida sem aprovação expressa.

## Etapa E2E real — tentativa protegida e encerramento seguro (16/11/2026)

**Resultado: não concluída por restrição do canal de execução**, não por falha comprovada no OBRIX. O Supabase de auditoria recebeu uma extensão HTTP temporária, quatro RPCs de montagem/verificação de fixture sintético, uma função Edge restrita e um controle de disparo único. A comunicação de diagnóstico sem credenciais respondeu **401** como esperado. A tentativa posterior de disparar uma requisição autenticada foi bloqueada pela camada de segurança do ambiente antes de chegar à função, por envolver o envio de credenciais de autenticação no comando. Não se tentou contornar a restrição por outro canal.

**Reversão executada:** a Edge Function temporária `obrix-audit-e2e-delete-20261116` foi atualizada para retornar somente **410 — desativada**; as quatro RPCs auxiliares e a tabela temporária foram removidas; a extensão `pg_net` foi desinstalada. A prova `obrix_seg_hml_20261116.executar_testes_exclusao_bloqueio_v1()` e as proteções consolidadas anteriores permanecem intactas.

**Integridade confirmada depois da tentativa:** projeto de auditoria com **3 usuários** em `auth.users`, **243 objetos** em `storage.objects`, **0 empresas** e **0 solicitações** pendentes no laboratório. Nenhum e-mail de teste `obrix-audit-delete-*@example.com` e nenhum objeto `obrix-fixture-delete-20261116.txt` foi criado. As operações temporárias não são mais executáveis. **Produção não foi alterada.**

**Leitura somente do Storage oficial:** os buckets `obrix-documentos` (6 objetos), `obrix-fotos` (4) e `relatorio-fotografico` (316) totalizam **326 objetos**; todos possuem um prefixo UUID como primeiro componente do caminho. As atuais políticas de `INSERT`/`UPDATE` autorizam pelo vínculo com a empresa, **sem verificar se há exclusão em andamento**. Isso deixa uma pendência de upload concorrente entre o inventário do Storage e a exclusão da empresa. Uma futura proposta deve bloquear `INSERT` e `UPDATE` em buckets relevantes após a reserva da exclusão, usando uma verificação de status autorizada, sem conceder acesso de leitura à tabela privada de solicitações.

**Para fechar a homologação:** usar um executor HTTP autorizado com as credenciais mantidas exclusivamente no servidor; criar uma conta Auth integralmente fictícia e um arquivo novo sob UUID exclusivo no bucket de auditoria; executar o fluxo real `preparado → storage_concluido → banco_concluido → finalizado`; conferir `getUserById`, Storage.list e resíduos por empresa; testar upload simultâneo e tokens anteriores; garantir restauração/limpeza somente dos IDs sintéticos. O projeto oficial permanece no commit `92495c4`, sem qualquer deploy.

Fontes de implementação: https://supabase.com/docs/guides/database/extensions/pg_net , https://supabase.com/docs/reference/javascript/auth-admin-createuser , https://supabase.com/docs/reference/javascript/auth-admin-deleteuser , https://supabase.com/docs/guides/storage/management/delete-objects .
