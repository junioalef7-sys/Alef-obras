# OBRIX — Ensaio integrado complementar (18/11/2026)

**Ambiente:** Supabase de homologação isolado `xnvjqolbvzgozlmuagpi`, Vercel Preview.  
**Escopo:** restauração lógica sintética, exclusão lógica segura e verificação de implementação e logs.  
**Status:** **NO-GO para produção**. Não houve execução de migração no Supabase oficial, alteração de dados no oficial, exclusão de Auth ou remoção física de arquivos.

## 1. Restauração lógica — aprovada em transação reversível

Ensaio `BEGIN ... ROLLBACK`, com sessão `authenticated` do tenant de homologação:

- Entrada fictícia EDIFIQ: uma obra, um funcionário vinculado à obra e um item de checklist.
- Primeira execução de `public.obrix_restaurar_backup_edifiq(...)`: `ok:true`, 1 obra, 1 funcionário e 1 item de checklist criados.
- Segunda execução do mesmo conteúdo: `ok:true`, 0 obras, 0 funcionários e 0 itens adicionais (idempotência verificada).
- Consultas dentro da transação confirmaram exatamente 1 obra, 1 funcionário e 1 item de checklist.
- `ROLLBACK` encerrou a transação, preservando os dados existentes.

**Limite:** não é uma restauração real do backup do usuário, de fotos/documentos do Storage, de credenciais de Auth nem uma reconstrução integral do esquema. Não foi fornecido arquivo de backup restaurável nesta execução. A documentação Supabase informa que o backup do PostgreSQL não contém os objetos físicos do Storage.

## 2. Exclusão lógica — aprovada em transação reversível

- Empresa descartável e obra de teste criadas temporariamente no banco de homologação.
- Perfil de uma conta existente foi vinculado transitoriamente à empresa descartável na **mesma transação**, sem alterar suas credenciais.
- Pré-simulação `obrix_excluir_empresa_dados_v1(...,true)` retornou sucesso.
- `obrix_reservar_exclusao_v1` criou etapa `preparado`.
- Nova gravação para a empresa em exclusão foi recusada com `42501`.
- Checkpoints `storage_concluido`, `banco_concluido` e `finalizado` foram verificados **somente no banco**.
- Consulta dentro da transação confirmou remoção da empresa e da obra fictícias, manutenção do journal finalizado e existência da conta Auth real.
- `ROLLBACK` restaurou o perfil, a empresa e os dados de antes do teste.

**Limite:** o checkpoint de Storage foi simulado; não houve chamada real da Storage API para excluir arquivos, nem `auth.admin.deleteUser`. Portanto este ensaio **não aprova a exclusão ponta a ponta** na homologação final. O laboratório isolado de 16/11 já registrava 12/12 verificações completas, mas esse ensaio precisa ser reproduzido na implantação final antes de produção.

## 3. Conferência de Edge Function implantada

Edge `obrix-delete-account`, versão 3, `ACTIVE`, com `verify_jwt=true`:

- Três módulos implantados iguais byte a byte à branch versionada: `account-deletion-workflow.mjs`, `storage-cleanup.mjs`, `cors-origin.mjs`.
- `index.ts` contém diferenças **somente** na lista `allowedOrigins`, feita para aceitar domínios de homologação no projeto isolado; normalizando essa lista, o código coincide com a branch.
- Revalidar lista de origens no deployment oficial; não promover o `index.ts` específico da homologação sem a configuração de produção.

## 4. Monitoramento e limites de observabilidade

- Consulta de clusters de erros da Vercel, janela de 24 horas: nenhum erro de runtime agregado retornado.
- Consulta de logs de runtime separada por ambiente, janela de 30 minutos: nenhuma entrada agregada.
- A conta Vercel informa retenção de logs inferior a 24 horas (Hobby) para consultas detalhadas. A ausência de logs **não prova ausência de travamentos ou falhas do JavaScript no navegador**.
- Central de Estabilidade: sete ocorrências carregadas são identificadas pelo próprio sistema como **exemplos editáveis**, sem evidências recentes suficientes para comprovar estabilidade.
- Não foram realizados nesta etapa testes de longa duração em iPhone, Android e desktop, nem medição real de sincronização.

## 5. Condição de saída

**Bloqueios ainda necessários:** (a) restauração real de backup e mídias em ambiente separado, (b) fluxo Auth+Storage de exclusão com conta totalmente fictícia na homologação final, (c) smoke E2E de pagamentos, anexos e sincronização nos dispositivos, (d) revisão final de privilégios SQL e senha vazada, (e) ensaio da migração do schema oficial em clone restaurável.

A versão oficial não pode ser alterada em razão deste relatório; aprovação de implementação e publicação exige liberação específica do pacote exato.

**Documentação oficial:** https://supabase.com/docs/guides/platform/backups e https://supabase.com/docs/guides/storage/security/access-control
