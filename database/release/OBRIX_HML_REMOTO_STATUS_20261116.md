# OBRIX — Homologação remota (16/11/2026)

**Estado:** Infraestrutura de homologação ativa, smoke test aprovado; **QA de dispositivos e release oficial NÃO aprovados**.

## Supabase exclusivamente de homologação
- Projeto: `OBRIX-HOMOLOGACAO-ISOLADA-20261116`.
- Ref: `xnvjqolbvzgozlmuagpi`, região `sa-east-1`, `ACTIVE_HEALTHY`.
- Cotação autorizada para criar projeto: **US$ 10/mês adicionais**, além do plano Pro e eventuais recursos.
- Estrutura reconstruída somente nesse projeto: **41 tabelas públicas, 56 funções públicas e 54 políticas públicas**. Backend de pagamento/exclusão candidato aplicado com sucesso apenas nesse projeto.
- Rotinas presentes: `obrix_pagar_equipe_transacional_v2`, `obrix_reservar_exclusao_v1`; duas políticas de Storage de proteção de encerramento presentes.
- Buckets privados: `obrix-documentos`, `obrix-fotos` e `relatorio-fotografico`. Inventário final: **0 usuários, 0 empresas, 0 arquivos**, 3 buckets.
- Edge Functions: `obrix-public-config` (`verify_jwt=false`, configuração exclusivamente pública) e `obrix-delete-account` (`verify_jwt=true`). A exceção CORS foi limitada à URL da prévia existente, exclusivamente quando a função estiver hospedada no ref deste projeto HML.
- Smoke test de rede real por `pg_net`: `GET /functions/v1/obrix-public-config` retornou **HTTP 200**, `backend_url=https://xnvjqolbvzgozlmuagpi.supabase.co` e chave pública com prefixo `sb_publishable`. Não registrar nem transmitir a chave inteira em logs ou documento.

## Vercel Preview existente
- URL: https://alef-obras-qh0huswll-obrix3.vercel.app/obrix.html
- Deployment: **READY** / `preview` (sem `target=production`).
- SHA do deployment: `05ed9b4e29c25ca9be725550cde9c34d5b0d87c2`.
- Verificado no GitHub para esse SHA: `obrix-hml-config.js` contém o ref HML correto, `obrix-backend-adapter.js` exige isolamento de ambiente e `obrix.html` carrega configuração HML antes do adaptador.
- **Atenção:** a prévia é anterior ao SHA mais recente do PR; não tratar como versão candidata final. A interface pode exigir autenticação SSO da Vercel em função das proteções do projeto.
- Nova publicação explícita tentada; Vercel devolveu **HTTP 402 `api-deployments-free-per-day`**, orientando tentar após 24 horas. Não alterar plano ou faturamento Vercel automaticamente.

## Testes e bloqueios
- E2E no Supabase **local descartável** via [GitHub Actions 43927903721](https://github.com/junioalef7-sys/Alef-obras/actions/runs/43927903721): success para cadastro, trial, pagamento e estorno, documento, Storage e exclusão. Esse teste não substitui E2E de navegador na hospedagem remota.
- Revisão de segurança no Supabase HML: `rls_enabled_no_policy` (INFO) e `authenticated_security_definer_function_executable` (WARN, 17 ocorrências). Requer análise de risco antes da promoção oficial.
- **Pendentes:** fluxo real no navegador usando apenas conta sintética nesse backend; sincronização entre dois ou três aparelhos; visualização de PDF multipágina, cabeçalho de orçamento; performance contínua, modo offline, recuperação de senha e trial pós-7 dias; backup/restauração, Security Advisor final e migrações oficiais não reproduzíveis pelo mecanismo automático de branch.
- **Não alterar o OBRIX oficial** sem autorização expressa de publicar SHA exato. PR #35 permanece draft e o domínio oficial não recebeu as mudanças.

## Links
- [Supabase HML](https://supabase.com/dashboard/project/xnvjqolbvzgozlmuagpi)
- [PR #35](https://github.com/junioalef7-sys/Alef-obras/pull/35)
- [Vercel Preview](https://alef-obras-qh0huswll-obrix3.vercel.app/obrix.html)
