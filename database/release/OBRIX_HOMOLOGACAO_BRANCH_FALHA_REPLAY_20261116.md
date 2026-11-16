# OBRIX — Falha de reconstrução da branch Supabase (16/11/2026)

**Estado:** Pro ativo; criação de ramificação aceita, mas replay automático de migrações falhou. A ramificação vazia foi **excluída**, para interromper o custo por hora. Banco e PWA oficiais não sofreram alterações.

## Contexto

- Organização: `qmppumyixebockmshgvj`; consulta do Supabase confirmou `plan=pro`.
- Projeto oficial: `gnvclctqnwxnjxydzhwc`.
- Branch tentada: `obrix-homologacao-final-20261116`, ref `lhbftpxcvgfytcdilifm`, branch ID `d44deedf-e6bd-44b2-b358-0869856435e6`.
- Custo cotado e autorizado: **US$ 0,01344/h**.
- Estado retornado: `MIGRATIONS_FAILED`. Verificação de leitura da branch: **0 tabelas no schema public**, **0 migrações aplicadas**.
- A ferramenta `delete_branch` retornou `{"success":true}`, e `list_branches` confirmou que só resta a branch oficial `main`.

## Erro técnico confirmado pelos logs de Postgres

```
function public.atualizar_updated_at_diario() does not exist
```

A primeira migração histórica, `20261016235013_audit_security_performance_base`, executa diretamente `ALTER FUNCTION public.atualizar_updated_at_diario() SET search_path = public, pg_temp`. No banco recém-criado, essa função ainda não existe.

O mesmo script pressupõe previamente as funções `public.rls_auto_enable()`, diversas políticas de RLS, além de tabelas e campos como `public.empresas`, `public.perfis`, `public.bonus_extras`, `public.compras`, `public.diarias`, `public.documentos`, `public.financeiro` etc. Por isso **não seria correto resolver a falha criando apenas uma função fictícia**.

O histórico oficial possui **110 migrações registradas**, mas elas não contêm, em ordem reproduzível, a criação integral do esquema existente. Na branch GitHub de homologação não há diretório `supabase/migrations` (apenas `supabase/functions`), portanto falta uma base versionada de DDL completa.

## Próximo caminho técnico

1. Gerar **cópia somente do esquema, sem dados e sem segredos** do OBRIX oficial, por meio da Supabase CLI/pg_dump com credenciais mantidas localmente em ambiente controlado. Revisar funções, triggers, políticas de RLS, grants, dependências de `auth`/`storage`, extensões e sequências.
2. Criar baseline versionada e testá-la em banco novo descartável; **não modificar o histórico ou esquema do banco oficial sem avaliação separada**. Ordenar as migrações futuras depois do baseline, evitando reaplicar 110 patches dependentes de um banco já existente.
3. Registrar as migrações reprodutíveis no repositório sob `supabase/migrations`, com CI de reset limpo (prova de criação do zero).
4. Só então recriar a branch Supabase (com custo por hora já estimado, sujeita a nova cotação), executar o candidato guardado em ambiente isolado, revisar performance/segurança e testar Auth, Storage, pagamentos, documentos, Realtime e rollback.
5. Realizar publicação oficial somente após aprovação expressa. A versão Vercel oficial segue no commit `92495c4898e66d45c44b9e4b240a63a336af4e59`.

**Importante:** a correção de `empresa_id NULL` e os testes de laboratório anteriores permanecem relevantes, mas não substituem uma reconstrução exata do banco oficial.

## Fontes

- [Supabase — Branching troubleshooting](https://supabase.com/docs/guides/deployment/branching/troubleshooting)
- [Supabase — Backup/Restore CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase — Migrações](https://supabase.com/docs/guides/deployment/database-migrations)
