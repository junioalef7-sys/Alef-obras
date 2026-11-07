# OBRIX — Preparação da homologação integrada com Auth/RLS/Storage reais

**Data:** 07/11/2026. **Branch:** `test/e2e-auth-storage-20261107`.  
**Instância:** Supabase AUDITORIA `mjzlwnuklfopdmgcvdcs`, não o oficial `gnvclctqnwxnjxydzhwc`.

## Entrega

- Página de testes separada: [obrix-e2e-integrado.html](../obrix-e2e-integrado.html).
- Projeto Supabase de auditoria já existente, sem custo de novo projeto.
- **13 tabelas** dedicadas, com **RLS ativo em todas** e **0 permissões `SELECT` para `anon`**.
- Autorização por associação `usuario_id -> empresa_id` vinculada ao `auth.uid()` do projeto de auditoria.
- Cadastro de empresa fictícia via RPC autenticada, com uma empresa por usuário e bloqueio de novos vínculos indevidos.
- Diárias inteiras e meias calculadas por trigger PostgreSQL com o valor do funcionário.
- RPCs transacionais para pagamento de equipe, estorno, inativação, exclusão de funcionário sem histórico, simulação de plano limitado e exclusão de dados da empresa fictícia.
- Pagamentos e financeiro não possuem permissões diretas de `UPDATE` ao papel `authenticated`.
- Bucket **privado** `obrix-e2e-fotos-20261107`, até 5 MB, somente `image/jpeg`, `image/png` e `image/webp`; políticas RLS verificam pasta da empresa e, no upload, existência da obra no mesmo tenant.
- A interface utiliza somente a chave do tipo `sb_publishable_` (pública, própria do projeto de auditoria). Não contém segredo `service_role`.
- Política CSP limita `connect-src` exclusivamente ao Supabase de auditoria.
- Publicação Vercel PREVIEW (`READY`), URL servida com HTTP 200. Script JavaScript compilado sintaticamente sem erros pela checagem estática.

## Testes executados

1. Usando o contexto `authenticated` do usuário de auditoria, a conta de teste viu **2 obras próprias**; não viu obra de outra empresa e foi impedida de cadastrar uma obra em tenant diferente.
2. 1 diária inteira de R$ 200 e 1 meia diária de R$ 100 foram valorizadas no PostgreSQL.
3. Adicionado bônus de R$ 30 e vale de R$ 50, o pagamento produziu **R$ 280 líquidos** e lançamentos de **R$ 150** na primeira obra e **R$ 130** na segunda.
4. Pagamento duplicado foi bloqueado.
5. Estorno reabriu as diárias e permitiu novo pagamento de R$ 280.
6. Criação de empresa via RPC autenticada passou; segunda empresa para o mesmo usuário foi recusada.
7. Exclusão de empresa fictícia com funcionário e diária funcionou, sem deixar vínculos.
8. Storage: tentativa de inserir metadados temporários numa pasta própria passou; na pasta de outra empresa foi bloqueada. Isso **não é prova de envio físico de arquivo pela Storage API**.
9. Acesso anônimo à tabela de empresas foi negado.
10. Todos os testes SQL foram revertidos com `ROLLBACK`; o ambiente terminou com **0 empresas, 0 membros, 0 obras, 0 diárias, 0 pagamentos e 0 objetos Storage**. O projeto de auditoria permanece com seu 1 usuário Auth existente.
11. A implantação oficial Vercel permaneceu `READY` no commit `748c61c046180b4a635e1bd95bb42849b7b0a757`, sem deploy de produção nesta etapa.

## Limitações (pendentes)

- **Login e cadastro com um e-mail real de teste ainda não foram realizados pela interface.** Eles exigem a ação do usuário e eventualmente confirmação de e-mail no projeto de auditoria.
- A página de homologação é uma **interface independente**, não o frontend OBRIX oficial completo. As rotinas E2E foram implementadas especificamente para a auditoria e não substituem todas as funções do banco principal.
- O upload/download real de uma imagem via Supabase Storage ainda deve ser testado manualmente com uma imagem totalmente fictícia. Não copiar fotografias de clientes para o ambiente de teste.
- A exclusão de empresa fictícia remove dados do banco, mas **não remove o usuário Auth**, e exige exclusão prévia de arquivos do Storage.
- A configuração de e-mails/redirects do Auth pode exigir ajustes se a confirmação de e-mail não retornar corretamente. Não foram alteradas configurações de login do OBRIX oficial.
- A homologação da restauração dos 45/242 arquivos reais e a aplicação das 49 FKs na produção ainda não estão autorizadas.
- É recomendável testar duas contas Auth de auditoria em sessões separadas para confirmar o isolamento real entre empresas usando o cliente web.

## Procedimento para usuário

1. Abrir a página PREVIEW; criar acesso com **e-mail de teste** e senha nova, distinta da oficial. Caso solicitado, confirmar e-mail.
2. Entrar, criar empresa fictícia, registrar duas obras, funcionário, diária inteira, meia diária, vale e bônus.
3. Pagar, conferir as despesas por obra, estornar e tentar pagar novamente.
4. Enviar e depois remover uma fotografia **descartável**, criada para testes; não enviar fotografias reais.
5. Repetir o cadastro com outro e-mail num navegador privado para validar isolamento.
6. Excluir os dados fictícios (após remover arquivos do bucket).

Fontes oficiais: [Supabase Password Auth](https://supabase.com/docs/guides/auth/passwords), [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
