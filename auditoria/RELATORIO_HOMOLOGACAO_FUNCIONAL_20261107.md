# OBRIX — Homologação funcional de equipe, pagamentos e exclusões

**Data:** 07/11/2026.  
**Escopo:** projeto Supabase de AUDITORIA (esquema `obrix_operacional_lab`), sem gravações no projeto oficial.  
**Estado:** testes funcionais isolados aprovados em parte; pendências listadas antes de qualquer implantação.

## Preparação

- A réplica isolada mantém as 32 tabelas operacionais e restrições multiempresa testadas previamente.
- Foram copiadas **10 definições oficiais** de funções PostgreSQL, modificando apenas as referências `public.` e `private.` para o esquema isolado:
  - `obrix_pagar_funcionario_seguro`
  - `obrix_estornar_pagamento_equipe`
  - `obrix_guard_sensitive_write`
  - `obrix_proteger_financeiro_automatico`
  - `obrix_proteger_financeiro_estoque`
  - `obrix_criar_checklist_padrao`
  - `obrix_empresa_atual`
  - `obrix_acesso_total`
  - `enforce_obra_trial_limit`
  - `enforce_funcionario_trial_limit`
- Foram reproduzidos **12 gatilhos** de obras, funcionários, diárias, financeiro, vales, bônus e pagamentos.
- Foram reproduzidos 58 valores `DEFAULT` relevantes de tabelas operacionais.
- Foram usados **perfis, empresas, assinaturas e dados integralmente fictícios**, com sessão simulada por `request.jwt.claim.sub`.
- A réplica gerou automaticamente **24 etapas** de checklist para três obras fictícias.

## Pagamento distribuído por obra

O funcionário fictício teve:
- 1 diária inteira na obra A1: R$ 200,00.
- 1 meia diária na obra A2: R$ 100,00.
- 1 vale na obra A1: R$ 50,00.
- 1 bônus na obra A2: R$ 30,00.

A função copiada do banco oficial gerou:
- Bruto R$ 330,00 e líquido **R$ 280,00**.
- Duas diárias marcadas pagas, um vale quitado, um bônus quitado.
- Dois vínculos `pagamento_diarias` (R$ 200,00 e R$ 100,00).
- Despesa da obra A1 **R$ 150,00** (diária menos vale).
- Despesa da obra A2 **R$ 130,00** (meia diária mais bônus).
- O total de despesas por obra correspondeu exatamente ao pagamento líquido.

## Estorno, repetição e proibição de duplicação

- `obrix_estornar_pagamento_equipe` reabriu as duas diárias, vale e bônus.
- Dois lançamentos financeiros automáticos foram marcados `estornado`, sem exclusão física.
- Os vínculos ativos de diárias foram desativados.
- Um estorno repetido retornou o estado de `ja_estornado`, sem segunda baixa.
- Um novo pagamento após o estorno foi realizado com sucesso; os lançamentos anteriores permaneceram estornados.
- Uma tentativa de efetuar o mesmo pagamento novamente foi **bloqueada**.
- Todos esses testes foram revertidos por `ROLLBACK`; nenhum pagamento foi persistido no laboratório.

## Segurança de empresas e limites de plano

Os seis testes negativos foram bloqueados:
1. Um proprietário da empresa A tentando pagar o funcionário da B.
2. Alterar a diária de A para um funcionário da B.
3. Alterar a diária de A para uma obra da B.
4. Proprietário da B tentando cadastrar obra na A.
5. Proprietário da B, com plano limitado, tentando criar segunda obra.
6. Proprietário da B, com plano limitado, tentando criar segundo funcionário.

## Achado crítico: exclusão de funcionários

Sem proteção adicional, o vínculo atual `ON DELETE CASCADE` permite que a exclusão **individual** de funcionário sem pagamento registrado elimine em cascata suas **duas diárias, seu vale e seu bônus**. Uma exclusão de funcionário já vinculado a pagamento é barrada por FK `RESTRICT`. 

Um gatilho experimental adicional foi testado:
- Funcionário com histórico: exclusão individual bloqueada.
- Funcionário com histórico: `ativo=false` autorizado, mantendo o histórico.
- Funcionário sem histórico: exclusão autorizada.
- A primeira versão bloqueou indevidamente a exclusão de conta inteira; foi corrigida para permitir o `ON DELETE CASCADE` quando a empresa pai já foi removida na transação.
- Após o ajuste, a **exclusão integral de empresa fictícia** foi aceita, removendo empresa, perfil, assinatura, funcionário e diárias; a transação foi revertida depois do teste.
- A lógica de guarda foi testada como `SECURITY DEFINER` no laboratório.

A proposta de implementação está no script [PROPOSTA_BLOQUEIO_EXCLUSAO_FUNCIONARIO_20261107.sql](./PROPOSTA_BLOQUEIO_EXCLUSAO_FUNCIONARIO_20261107.sql). **Não foi aplicada à produção**.

Também foi confirmado que a exclusão de etapa do checklist referenciada por diária mantém a diária e limpa `checklist_id` como esperado.

## Limitações e pendências

- A cópia das funções ocorreu com mudança das referências de esquema; as tabelas de perfil e assinatura foram reproduzidas simplificadamente. Não houve autenticação real por aplicativo, teste completo de RLS sob papel `authenticated`, nem replicação de todos os gatilhos e rotinas do OBRIX.
- Não foi testada nesta etapa a importação integral dos backups sob os novos gatilhos; o ensaio anterior validou os backups com a estrutura operacional e as restrições, mas sem as cópias funcionais completas.
- Não foi testado o fluxo **real** de exclusão de conta, inclusive Supabase Auth, cobrança e Storage. A proposta de bloqueio de exclusão individual depende dessa homologação antes de aplicação.
- O botão Excluir do aplicativo precisa explicar quando o funcionário possui histórico e deve ser inativado; o fluxo não foi modificado.
- A recuperação física de fotografias e documentos no Storage permanece separada da restauração transacional do banco.
- A proposta de reforço de 49 FKs entre empresas continua pendente de autorização e implantação controlada.

## Próxima etapa

Teste de ponta a ponta em PREVIEW com autenticação real, pagamento e estorno reais **somente em empresa fictícia isolada**, exclusões, assinatura e checagem de Storage; revisar rotinas de exclusão de conta e autorização antes de publicar migrações de banco na produção.

Fontes técnicas: [Supabase — Database functions](https://supabase.com/docs/guides/database/functions) e [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
