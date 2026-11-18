# OBRIX — Auditoria da etapa final de segurança (18/11/2026)

**Ambiente avaliado:** Supabase `xnvjqolbvzgozlmuagpi` e Vercel Preview da branch `test/obrix-seguranca-pagamentos-20261116`.  
**Versão oficial a preservar:** Vercel commit `92495c4898e66d45c44b9e4b240a63a336af4e59`.  
**Status:** **NO-GO para produção**; este relatório não autoriza migração nem publicação.

## Evidência documentada de exclusão ponta a ponta

O checklist `OBRIX_PRONTO_PARA_PUBLICAR_CHECKLIST_20261116.md` registra ensaio de 16/11/2026 no projeto de laboratório `mjzlwnuklfopdmgcvdcs`, com 12/12 verificações verdadeiras: Auth fictício, empresa, sessão, bucket temporário, PDF, PNG, bloqueio de upload durante exclusão, exclusão física, remoção de banco e Auth, token anterior rejeitado e retirada do bucket. A execução não foi repetida em 18/11/2026; evidência do laboratório não substitui ensaio na homologação final com a RPC e Edge Function vigentes.

## Verificações novas de 18/11/2026

Todas as consultas mutáveis foram executadas em **transações encerradas com ROLLBACK**. Não houve exclusão de contas nem arquivos; dados de teste descartados.

- 17 funções `SECURITY DEFINER` executáveis por `authenticated` na homologação; 16 dessas também no oficial. Todas as 17 apresentam, no corpo, seleção de empresa do usuário e checagem de acesso/assinatura, ou leitura de perfil para inicialização do trial. A evidência estrutural **não elimina os avisos** do Security Advisor nem prova ausência de caminhos de autorização incorretos.
- Funções `*_interno` de backup e totais não podem ser executadas por `anon` nem `authenticated`, somente pelas rotinas explicitamente autorizadas; a função de limpeza privada de empresa não concede `EXECUTE` a usuários.
- As quatro RPCs públicas de exclusão de conta são executáveis somente por `service_role` (e proprietário do banco), não por `anon` ou `authenticated`.
- Duas empresas reais da homologação receberam fixtures temporárias de folha. Para cada contexto `authenticated`, o resumo devolveu uma folha própria e **zero folhas da outra empresa**.
- Pagamento transacional passando identificador de funcionário e diária da empresa B sob token da empresa A: **recusado** com `P0001: Funcionário não pertence à empresa atual.`.
- Contagem pós-ROLLBACK: 2 empresas, 1 obra existente, 0 funcionários, 0 diárias, 0 pagamentos, 0 financeiro, 2 arquivos e 0 exclusões pendentes; dados anteriores preservados.

## Avisos de segurança remanescentes

1. `authenticated_security_definer_function_executable` — 17 ocorrências (`WARN`); avaliar caso a caso. O alerta pode corresponder a RPCs intencionalmente executáveis pelo cliente; **não** revogar em massa nem converter em `SECURITY INVOKER` sem validar o módulo.
2. `auth_leaked_password_protection` — 1 aviso (`WARN`); recurso não habilitado na homologação. A documentação Supabase informa que a proteção contra senhas vazadas depende do **plano Supabase Pro ou superior**; conferir elegibilidade antes de planejar ativação.
3. `rls_enabled_no_policy` — 2 ocorrências (`INFO`) no schema privado `obrix_conta_interna`, sem política propositalmente, com acesso às tabelas revogado a clientes. Não são tabelas públicas expostas.

Documentação: https://supabase.com/docs/guides/database/functions e https://supabase.com/docs/guides/auth/password-security

## Bloqueios de liberação restantes

- O arquivo `database/release/obrix_backend_release_candidate_20261116.sql` ainda contém uma guarda que aborta execução, intencionalmente. Não a retirar sem ensaio completo e autorização de implantação.
- O banco oficial ainda precisa receber, em ordem controlada, a nova RPC de pagamento e o journal de exclusão; não promover o Preview atual diretamente, pois contém isolamento/configuração específicos da homologação.
- Falta ensaio reproduzível de restauração de backup no clone isolado com Storage real, seguido de testes de migração, reversão, concorrência, sincronização e carga.
- Antes da promoção, revalidar a Edge Function de exclusão usando **conta fictícia distinta** no mesmo backend da homologação final, sem tocar nos dois usuários existentes.
- Completar homologação de ponta a ponta nos três dispositivos e avaliação dos avisos. A recuperação de senha da homologação foi aprovada pelo usuário em 18/11/2026.

**Regra operacional:** dados do OBRIX oficial não podem ser modificados por tarefas de auditoria. Uma eventual promoção deve usar commit exato, backup restaurável e validação de migração, com publicação única após aprovação.
