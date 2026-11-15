# Unificação dos endereços do OBRIX

**Endereço oficial único:** https://alef-obras-obrix3.vercel.app/obrix.html

O arquivo `vercel.json` redireciona o domínio alternativo da Vercel para o canônico. O arquivo `cloudflare-legacy-redirect/index.mjs` redireciona o Worker antigo `obrix.junioalef7.workers.dev` para a Vercel, preservando caminhos, consultas e fragmentos do navegador (relevantes para links de recuperação de senha).

## Ativar o redirecionamento do Cloudflare

Esta parte **não é ativada** pela implantação da Vercel. Ela requer acesso à conta Cloudflare que administra o Worker `obrix`.

1. Confirmar que https://alef-obras-obrix3.vercel.app/obrix.html abre e permite recuperar senha.
2. Abrir Supabase Dashboard → projeto `gnvclctqnwxnjxydzhwc` → Authentication → URL Configuration: configurar **Site URL** como `https://alef-obras-obrix3.vercel.app/obrix.html`, além de conferir a inclusão desse mesmo URL em **Redirect URLs**. Preservar temporariamente os endereços antigos permitidos até expiração dos links enviados anteriormente.
3. Na conta Cloudflare correta, na raiz deste repositório, executar `cd cloudflare-legacy-redirect && npx wrangler deploy`. A configuração tem `name: "obrix"`, portanto **substitui o Worker anterior**; confirmar que é a conta/projeto correto antes de publicar.
4. Verificar `https://obrix.junioalef7.workers.dev/obrix.html` → endereço Vercel; repetir com um link antigo de recuperação ainda válido sem expor o token. Não exibir tokens em logs.
5. Atualizar atalhos/bookmarks de clientes. Sessões no navegador são por origem, portanto pode ser necessário entrar novamente. Não excluir dados locais caso existam registros offline ainda não sincronizados.

**Não** executar exclusão de usuários, fotos, obras ou tabelas nesta migração. Preservar iPhone, Android e desktop, incluindo os manifestos PWA e as telas aprovadas.

Referências: https://supabase.com/docs/guides/auth/redirect-urls e https://developers.cloudflare.com/workers/examples/redirect/
