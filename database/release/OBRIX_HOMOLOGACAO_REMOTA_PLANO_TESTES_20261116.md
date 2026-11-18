# OBRIX — Homologação funcional remota | 16/11/2026

**Estado:** ambiente preparado, PWA em Preview protegido. **Não publicar no oficial** antes da assinatura dos testes físicos, da revisão de segurança e do plano de rollback.

## Ambientes isolados

| Campo | Valor |
|---|---|
| Supabase de homologação | `xnvjqolbvzgozlmuagpi` |
| Nome | `OBRIX-HOMOLOGACAO-ISOLADA-20261116` |
| Região | `sa-east-1` (São Paulo) |
| Vercel | `alef-obras-git-test-obrix-seguranca-pagamentos-20261116-obrix3.vercel.app` |
| Branch GitHub | `test/obrix-seguranca-pagamentos-20261116` |
| Projeto oficial | `gnvclctqnwxnjxydzhwc` — NÃO ALTERAR |
| Custo adicional | US$ 10/mês enquanto o projeto de homologação permanecer ativo |

**Atenção:** a Vercel protege a Preview. Compartilhar somente o link temporário gerado no Vercel; **não** registrar seu parâmetro `_vercel_share` neste documento ou em logs. Após expirar, gerar um link de compartilhamento novo. O teste pode exigir acesso renovado após instalar o PWA.

## Evidências técnicas verificadas

- Baseline de esquema aplicada **somente** no novo projeto. Conferência: **41** tabelas públicas, **56** funções públicas e **54** políticas públicas antes do pacote candidato.
- SQL candidato de pagamentos/exclusão aplicado **somente** na homologação. RPCs presentes, duas políticas adicionais de Storage presentes.
- Três buckets criados como privados: `obrix-documentos`, `obrix-fotos`, `relatorio-fotografico`.
- Edge `obrix-public-config` retorna HTTP 200 com **URL do Supabase HML**, não produção.
- Edge `obrix-delete-account` ativa **com verificação JWT** e origens Preview autorizadas; função administrativa nunca é incorporada ao cliente.
- Frontend bloqueia hosts desconhecidos e recusa backend de produção em Preview.
- Pagamento pela Preview usa RPC atômica do HML; testes unitários verificam que produção permanece isolada.
- Teste integrado real em **Supabase local descartável** aprovado: https://github.com/junioalef7-sys/Alef-obras/actions/runs/43927903721.

## O que não está automaticamente homologado

Nenhuma sessão real em iPhone/Android foi operada por esta automação. O teste remoto de criação de conta por ferramenta administrativa **não foi concluído**; as tentativas foram bloqueadas pelo controle de acesso disponível. O sucesso do CI local não valida entregabilidade de e-mail do projeto remoto, performance em dispositivos, Realtime real nem restauração de arquivos físicos. **Não declarar GO de venda.**

## Checklist de homologação manual (usar dados fictícios)

| ID | Cenário | iPhone | Android | Computador | Evidência / resultado |
|---|---|---|---|---|---|
| H01 | Abrir Preview e login em conta de teste | Pendente | Pendente | Pendente | |
| H02 | Cadastro e confirmação de e-mail | Pendente | Pendente | Pendente | |
| H03 | Recuperação de senha por e-mail | Pendente | Pendente | Pendente | |
| H04 | Trial válido por 7 dias e limite após vencimento | Pendente | Pendente | Pendente | |
| H05 | Obras: criar, editar, checklist, foto e reabrir | Pendente | Pendente | Pendente | |
| H06 | Equipe: 1 diária inteira ou 2 meias diárias por dia | Pendente | Pendente | Pendente | |
| H07 | Exclusão mútua diária/falta no mesmo dia | Pendente | Pendente | Pendente | |
| H08 | Vale/bônus/pagamento atômico; rateio por obra | Pendente | Pendente | Pendente | |
| H09 | Estorno devolve pendências e financeiro correto | Pendente | Pendente | Pendente | |
| H10 | Documentos PDF multipágina: abrir até a última página | Pendente | Pendente | Pendente | |
| H11 | PDF orçamento: paginação e rodapé sem sobreposição | Pendente | Pendente | Pendente | |
| H12 | Duas gravações consecutivas: Realtime entre aparelhos | Pendente | Pendente | Pendente | |
| H13 | Temas claro/escuro sem piscadas/contraste invertido | Pendente | Pendente | Pendente | |
| H14 | Uso prolongado sem travar, navegar e retornar | Pendente | Pendente | Pendente | |
| H15 | PWA instalação/abertura/voltar/offline | Pendente | Pendente | Pendente | |
| H16 | Backup e restauração controlada, incluindo Storage | Pendente | Pendente | Pendente | |
| H17 | Isolamento de dados entre duas empresas fictícias | Pendente | Pendente | Pendente | |
| H18 | Exclusão definitiva fictícia: Auth+empresa+Storage | Pendente | Pendente | Pendente | |

### Protocolo de sincronização

1. Em uma conta fictícia, abrir a **mesma empresa** simultaneamente nos três aparelhos.
2. Registrar uma diária no iPhone; comprovar que aparece em Android e PC sem fechar o PWA.
3. Registrar uma **segunda diária** válida em outra data; confirmar atualização **imediata** em ambos, sem fechar/reabrir.
4. Repetir com obras, financeiro, diário, documentos e estoque. Fotografar/registrar horário e comportamento em caso de atraso.

### Critérios para liberar publicação

- Todos os casos H01–H18 com evidência e resultado registrado, ou riscos explicitamente aceitos (nunca autenticação, RLS, cobrança/estorno ou exclusão parcial).
- Verificar configuração remota de e-mail e senha vazada no Supabase Pro.
- Security Advisor: avaliar funções `SECURITY DEFINER` executáveis por `authenticated`, sem revogar indiscriminadamente.
- Executar restauração de backup de teste **sem dados reais** (banco e arquivos físicos separados), confirmar estratégia de rollback e preparar monitoramento.
- Aprovar SHA exato do PR, migrar backend, publicar Edge, mudar UI somente após isso.
- Só promover para oficial com autorização expressa, em mudança única e revisável.

## Encerramento e cobrança

O projeto Supabase HML tem custo adicional de **US$ 10/mês** enquanto existir. Após a homologação, avaliar sua remoção no painel Supabase; remover o projeto elimina os dados e arquivos *fictícios* que tiverem sido criados. Não remover antes de registrar todas as evidências.

## Referências

- https://supabase.com/docs/guides/deployment/managing-environments
- https://supabase.com/docs/guides/storage/buckets/creating-buckets
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links
