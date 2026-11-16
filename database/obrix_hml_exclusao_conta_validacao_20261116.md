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
