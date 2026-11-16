# OBRIX — Preparação para homologação controlada

**Data:** 16/11/2026  
**Estado da automação local:** verificar último GitHub Actions antes de classificar como aprovado.  
**Escopo:** exclusivamente testes da branch `test/obrix-seguranca-pagamentos-20261116`.  
**PROIBIDO:** alterar banco Supabase oficial, publicar Vercel Production ou remover guardas da migração original sem aprovação específica.

## Teste integrado em Supabase descartável sem cobrança de projeto adicional

O pipeline [`obrix-hml-local-integracao.yml`](../../.github/workflows/obrix-hml-local-integracao.yml) inicializa um stack Supabase completo em Docker no GitHub Actions, com credenciais **somente locais**. Usa Supabase CLI **2.111.0** (fixa para evitar alterações de comportamento da CLI v3).

1. Cria projeto local em `.hml-local` dentro do runner, sem `supabase link` ou chaves da nuvem.
2. Reconstrói o esquema inicial a partir do [SQL estrutural guardado](./obrix_hml_baseline_schema_sem_dados_20261116.sql), autorizado unicamente no endpoint `127.0.0.1:54322`.
3. Cria uma **cópia somente em `$RUNNER_TEMP`** do [backend candidato](./obrix_backend_release_candidate_20261116.sql), removendo a guarda nessa cópia e **nunca** no arquivo rastreado.
4. Executa [`obrix-hml-local-integracao.cjs`](../../tests/obrix-hml-local-integracao.cjs), com conta fictícia, confirmação de trial e login, duas obras, funcionário, duas meias diárias, vale, bônus, pagamento e rateio por obra, bloqueio de duplicidade, estorno, PDF e URL assinada e exclusão de Auth/Storage/banco.
5. Destrói o stack com `supabase stop --no-backup` mesmo se algum teste falhar. Não preserva dados fictícios.

**Não há conexão de banco ao Supabase oficial.** O runner instala o cliente de PostgreSQL e o pacote JS de teste em ambiente temporário e verifica `API_URL=http://127.0.0.1:54321`.

## Preparação da prévia PWA

- `obrix-backend-adapter.js`: produção somente em endereços oficiais conhecidos. Qualquer domínio diferente exige `window.__OBRIX_HML_PROJECT_REF` explícito e recusa cache/configuração que aponte ao oficial.
- `obrix-hml-config.js`: valor vazio por padrão; inserir **somente o identificador público de 20 letras** de um ambiente *novamente criado, isolado, sem usuários reais*.
- `obrix.html`: carrega a configuração antes do adaptador e invalida caches antigos.
- `supabase/functions/obrix-delete-account/cors-origin.mjs`: exceção para **um** domínio Preview exato e apenas quando a Edge Function estiver em Supabase diferente dos projetos oficial e de auditoria.
- `supabase/functions/obrix-delete-account/account-deletion-workflow.mjs`: aceita os papéis reais `proprietario` e `administrador`; nunca o papel `admin` inexistente.
- `tests/obrix-e2e-runtime-hml-branch-20261116.mjs`: executor server-side reutilizável, recusa ambos os projetos conhecidos, requer `OBRIX_HML_PROJECT_REF` e `OBRIX_HML_E2E_TOKEN` (32–128 caracteres) como segredo. **Nunca expor esse token no frontend ou GitHub**.
- `database/release/obrix_hml_fixture_executor_one_shot_20261116.sql`: reserva única no servidor; somente em banco vazio, com habilitação local explícita.

## O que o pipeline NÃO comprova

O stack descartável não é um PWA instalado em iPhone ou Android. Devem ser realizados testes manuais de: navegação persistente, sincronização entre três dispositivos após a segunda gravação, relatórios PDF multipágina, impressão, instalação offline, tema claro/escuro, performance após 30–60 minutos, recuperação de senha e e-mails transacionais, migrações hospedadas, limite de trial de 7 dias, backup/restauração e cenários de bloqueio por assinatura.

## Problema histórico de branches Supabase

O Supabase oficial contém um histórico de **110 migrações** incompleto para a reconstrução do zero. A primeira operação de `create_branch` normalmente tenta modificar `public.atualizar_updated_at_diario()` antes de a função existir. O teste local reproduz a estrutura usando uma **baseline separada e protegida**, evitando alterar o histórico de produção; **isso não corrige automaticamente o problema de Supabase Branching**.

A criação de um projeto Supabase adicional de homologação foi cotada em **US$ 10/mês** (além do plano existente). Não foi criada nem cobrada; requer autorização de custo específica antes de avançar para testes móveis hospedados. A criação de ramificações por hora também pode exigir custos e, sem regularizar as migrações, permanecerá bloqueada.

## Critério de entrada na homologação manual

- [ ] GitHub Actions — E2E local terminou com **success**, sem falhas ignoradas.
- [x] Testes de segurança e regressão SQL do laboratório aprovado: 45/45, com fixtures revertidas.
- [x] Preview bloqueada contra banco oficial por padrão e testes unitários do isolamento.
- [ ] Backend independente remoto provisionado, com buckets privados e Edge de homologação, sem dados reais, antes de testes móveis.
- [ ] Aprovação de dispositivo e responsável pelo teste; nenhum deploy em Production.

Documentação Supabase: [Migrações](https://supabase.com/docs/guides/deployment/database-migrations), [Branching e erros](https://supabase.com/docs/guides/deployment/branching/troubleshooting), [Segurança do Auth](https://supabase.com/docs/guides/auth/password-security).
