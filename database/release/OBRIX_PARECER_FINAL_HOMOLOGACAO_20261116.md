# OBRIX — Parecer técnico da rodada final de homologação

**Data:** 16/11/2026  
**Decisão de liberação:** **NO-GO (NÃO PUBLICAR)**  
**PR:** https://github.com/junioalef7-sys/Alef-obras/pull/35 — `draft`, não mesclado  
**Versão oficial preservada:** `92495c4898e66d45c44b9e4b240a63a336af4e59` — Vercel `READY`  
**Ramificação em revisão:** `test/obrix-seguranca-pagamentos-20261116`

## Evidências aprovadas

1. **Esquema inicial reconstruído sem dados:** versão controlada de 43 tabelas (41 públicas), 536 colunas, 66 funções, 239 constraints, 149 índices independentes, 38 triggers e 65 políticas. A ordem de criação de índices antes das FKs foi corrigida. Ensaio em banco vazio executou com `ROLLBACK`; instalação manual em branch temporária conferiu 41 tabelas públicas, 56 funções públicas e 54 políticas públicas. A migração candidata de pagamentos/exclusão foi aplicada apenas na branch descartável, após teste reversível.
2. **Backend de pagamentos:** registro real em conta fictícia com trial, obras, funcionário, duas meias diárias, vale e bônus, pagamento atômico, rateio financeiro entre duas obras, bloqueio de duplicidade e RPC de estorno. Duas diárias e vale voltaram ao estado em aberto em consulta SQL posterior. Isso **não valida** o app completo.
3. **Testes de exclusão e upload no laboratório anterior:** execução atual de 21/21 proteções de exclusão, 7/7 de upload e 17/17 de retomada (45/45). Permaneceram intactos três usuários e 243 arquivos preexistentes; não restaram empresas fictícias ou jobs.
4. **Segurança de prévia:** `obrix-backend-adapter.js` foi alterado **na ramificação de teste** para não conectar automaticamente uma URL Preview Vercel ao Supabase oficial. Preview exige `window.__OBRIX_HML_PROJECT_REF` apontando para uma branch isolada; se ausente, bloqueia `init()` **antes de requisitar configuração**. Se a configuração apontar ao Supabase oficial, recusa. Cache contaminado também é recusado. O domínio oficial aprovado conserva a configuração antiga. Testes automatizados para esses cenários, além de revisão do `?v` no HTML, foram adicionados ao CI.
5. **GitHub Actions:** execução mais recente do pipeline de segurança concluída com `success` após o novo bloqueio de prévia. Verificar SHA exato no momento da publicação, pois alterações posteriores criam novos builds.

## Bloqueios objetivos — por que ainda não é seguro publicar

### B1. Histórico Supabase não reconstrutível por branching

A criação das duas últimas branches gerou `MIGRATIONS_FAILED`. O log aponta a função `public.atualizar_updated_at_diario()` ausente na primeira migração. O banco de produção tem 110 migrações registradas que presumem pré-existência de objetos. Embora a baseline estrutural tenha funcionado **manualmente**, o provisionamento autônomo segue quebrado; a branch temporária usada para ensaio deixou de aparecer em `list_branches`. Não alterar o histórico oficial nem marcar migrações ficticiamente como aplicadas sem plano separado de recuperação, backup e autorização específica.

### B2. E2E Auth + Storage + Documentos na estrutura completa não finalizado

O cenário conjunto em banco reconstruído chegou até o pagamento/estorno, mas terminou por restrições de leitura do `service_role` (ACL que também existe na produção) na checagem das diárias. O E2E antigo de 12/12 etapas com Auth e Storage foi aprovado **somente no laboratório simplificado**. Falta comprovar no banco completo a visualização/URL assinada de Documento, exclusão física, deleção Auth, invalidação de sessão antiga, recuperação em falha e concorrência. Não afrouxar grants do Financeiro nem da equipe para fazer passar o teste: as consultas de auditoria devem usar `authenticated` ou uma função de verificação dedicada.

### B3. Ambiente Preview e testes dos dispositivos

A URL Preview anterior era ligada diretamente ao projeto Supabase oficial pelo `obrix-backend-adapter.js`. Agora fica bloqueada sem backend isolado. **Portanto não existe atualmente um PWA de teste E2E com backend independente operacional.** Precisam ser testados Android, iPhone e desktop, temas claro/escuro, Documentos multipágina e impressão, cabeçalhos, desempenho após uso prolongado, real-time do 1º/2º registro, trial 7 dias, senha, cadastro e offline com dados fictícios.

### B4. Segurança da produção

O Security Advisor continua com:
- `authenticated_security_definer_function_executable` — **16 funções**, aviso `WARN`. Analisar a necessidade de EXECUTE por usuários autenticados, RLS, propriedade e argumentos em cada uma. Não revogar indiscriminadamente para não quebrar as funções legítimas.
- `auth_leaked_password_protection` — **1 aviso WARN**. Habilitar a verificação de senhas vazadas em **Authentication → Settings / Security** conforme a interface atual do Supabase Pro e então consultar novamente o Advisor.

Referências:  
https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable  
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

O Performance Advisor retornou `multiple_permissive_policies` (1 WARN), `unused_index` (32 INFO) e `auth_db_connections_absolute` (1 INFO). O Health Advisor não retornou avisos. Esses alertas exigem decisão documentada antes de vender o produto, sem remoção arbitrária de índices.

### B5. Recuperação e backups

O plano Supabase Pro oferece backups diários de banco, mas um snapshot do PostgreSQL **não restaura os arquivos físicos do Storage**. Ainda falta provar **restauração de banco e arquivos, rollback de Edge Function e rollback de Vercel**. Não executar restauração em produção; uma cópia de backup para um novo projeto pode criar custos adicionais e copiar dados pessoais: requer autorização de custo e avaliação de privacidade.

Referência: https://supabase.com/docs/guides/platform/backups

## Condições técnicas para transformar este NO-GO em GO

- [ ] Corrigir o replay das 110 migrações de forma reproduzível **sem tocar no oficial sem aprovação específica**; criar uma branch que termine em estado saudável, sem DDL manual corretivo.
- [ ] Reexecutar o E2E completo, de ponta a ponta, em ambiente isolado **com estrutura equivalente** e conta 100% fictícia, cobrindo Documentos, Storage, Auth e retomada.
- [ ] Executar cenários de isolamento entre empresas, permissões de usuários, duplicidade e travas concorrentes; verificar não haver novos registros após exclusão.
- [ ] Disponibilizar Preview apontando exclusivamente para essa branch e testar iPhone/Android/desktop e ambas as aparências sem alterar o visual aprovado.
- [ ] Resolver ou formalmente avaliar cada aviso de Security Advisor e os riscos de Performance Advisor.
- [ ] Confirmar backup/restauração do banco **e arquivos**, rollback e acompanhamento de erros.
- [ ] Exigir uma aprovação específica do **SHA exato**, alinhar backend, Edge e interface; nenhuma publicação automática. A migração candidata continua protegida por `OBRIX RELEASE BLOCKED`, e a chave de pagamento transacional permanece desligada por padrão até a operação ter sido homologada.

## Custo e integridade

- OBRIX oficial: **não modificado** nesta rodada.
- Supabase Pro: continua ativo na organização enquanto não for reduzido/cancelado na interface.
- Branches temporárias: não há branch de teste listada no Supabase ao final desta revisão; custo final só será conhecido na fatura.
- Nenhum usuário ou arquivo preexistente foi apagado dos projetos atuais.

## Parecer

**A rodada foi encerrada como NO-GO de publicação, não como homologação integral aprovada.** Parte relevante do backend está aprovada, mas os itens acima são impeditivos objetivos para declarar o OBRIX pronto para clientes pagantes. O revisor deve preservar a versão oficial e o ponto de partida aprovado até uma rodada GO com evidências completas.

[Histórico de execução em branch com SQL real](./OBRIX_HOMOLOGACAO_RESULTADOS_BRANCH_20261116.md) · [Checklist de release](./OBRIX_PRONTO_PARA_PUBLICAR_CHECKLIST_20261116.md)
