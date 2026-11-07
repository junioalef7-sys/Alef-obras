# OBRIX — Ensaio de recuperação física das fotografias

**Data de preparação:** 07/11/2026.  
**Situação:** rotina de teste construída, validada estaticamente e publicada em Vercel PREVIEW; **execução real de perda/restauração no navegador ainda pendente**.  
**Isolamento:** Supabase de AUDITORIA `mjzlwnuklfopdmgcvdcs`, sem qualquer acesso ao projeto oficial `gnvclctqnwxnjxydzhwc`.

## Ambiente

- Página de ensaio: [obrix-e2e-recuperacao-fotos.html](../obrix-e2e-recuperacao-fotos.html).
- Entrada pelo laboratório integrado: [obrix-e2e-integrado.html](../obrix-e2e-integrado.html).
- Bucket privado de testes: `obrix-e2e-fotos-20261107`.
- Tabela de vínculos: `public.obrix_e2e_fotos`; empresa e obra são verificadas por FK e RLS.
- Nenhum objeto existente é selecionado ou apagado pelo ensaio.
- Somente chave pública `sb_publishable_` da instância de auditoria é usada no frontend.
- O CSP do novo arquivo limita conexões à URL do Supabase de auditoria e carrega bibliotecas Supabase JS 2.117.1 e JSZip 3.10.1 explicitamente versionadas.

## Fluxo previsto

1. O navegador **gera uma imagem PNG fictícia**, sem imagens de obras ou dados pessoais reais.
2. Um manifesto inclui empresa, obra, UUID do arquivo, ID do registro, caminho de Storage, tamanho, MIME e SHA-256.
3. É criado um backup `ZIP` com **apenas** `manifest.json` e `foto.png`; os componentes são lidos e validados antes de qualquer upload.
4. A imagem é enviada ao bucket privado e o vínculo é inserido na tabela da empresa. O arquivo é baixado usando autenticação e o SHA-256 dos bytes é conferido.
5. O usuário pode salvar o ZIP no iPhone.
6. Com confirmação explícita, a simulação apaga **somente o arquivo criado neste ensaio** e seu registro de banco; os dois desaparecimentos são conferidos.
7. A restauração lê o ZIP, valida manifesto, empresa, obra, caminho, limite de 5 MB e SHA-256; envia arquivo sem `upsert`, reinserindo o ID e o vínculo originais.
8. Novo download autenticado e conferência de bytes, SHA-256 e FK de empresa/obra demonstram a restauração. Há opção de abrir imagem com URL assinada de 60 segundos.
9. O usuário pode limpar apenas a imagem gerada pelo ensaio. Fotos de outros testes permanecem intactas.

Também é possível restaurar um ZIP salvo no aparelho, sem depender de ele continuar na memória do navegador, após a perda previamente simulada.

## Verificações já feitas em 07/11/2026

- A estrutura de Storage está privada; limite **5.242.880 bytes**, MIME JPEG/PNG/WEBP.
- As políticas `SELECT`, `INSERT` e `DELETE` de `storage.objects` estão vinculadas à empresa.
- A tabela de metadados permite `SELECT`, `INSERT` e `DELETE` apenas ao usuário autenticado da empresa.
- O novo JS é sintaticamente válido.
- **9 testes estáticos/determinísticos da validação do manifesto** passaram:
  - ZIP válido da mesma empresa;
  - ZIP de outra empresa bloqueado;
  - obra de outra empresa bloqueada;
  - caminho inválido bloqueado;
  - arquivo acima de 5 MB bloqueado;
  - SHA-256 sintaticamente inválido bloqueado;
  - identificador inválido bloqueado;
  - bucket diferente proibido;
  - MIME não PNG proibido.
- Um segundo backup não é iniciado enquanto existe um ensaio na aba.
- Foi confirmado que `obrix-e2e-recuperacao-fotos.html` e o laboratório integrado que o referencia respondem HTTP 200 no PREVIEW.
- Código oficial e implantação de produção não foram alterados.

## O que AINDA não está comprovado

- O fluxo de upload, download, exclusão e reenvio físico do ZIP **precisa ser executado em um navegador autenticado**, pelo usuário.
- O ensaio não copia nem recupera as fotografias reais existentes no Storage oficial; esse procedimento exige validação de inventário, permissões, bytes e backup externo adequado.
- O Storage e o PostgreSQL **não participam de uma única transação ACID compartilhada**. São operações em etapas com verificações e compensação limitada; erros entre as etapas ainda precisam ser tratados num fluxo comercial.
- Uma restauração de uma foto fictícia não homologa a escalabilidade, integridade e custo de centenas de fotos, nem recuperação de álbum inteiro.

## Procedimento para o teste no iPhone

1. Abrir o novo link PREVIEW, entrar usando credenciais **exclusivas do laboratório**.
2. Selecionar uma obra fictícia.
3. Tocar **Criar backup de fotografia fictícia**; conferir confirmação e, se possível, tocar **Salvar backup ZIP no iPhone**.
4. Tocar **Simular perda e restaurar automaticamente**; confirmar a exclusão somente do teste.
5. Conferir a mensagem **Restauração real aprovada**, verificar os 2 hashes idênticos e tocar **Abrir fotografia restaurada (60 s)**.
6. Depois, usar **Remover fotografia deste ensaio** para limpar o arquivo fictício.
7. Enviar o resultado exibido na página. Uma captura pode ajudar, sem incluir credenciais.

## Fontes

- [Supabase — Storage Buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase — JavaScript download](https://supabase.com/docs/reference/javascript/file-buckets-download)
- [Supabase — Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

**Produção preservada:** sem migração, publicação ou alteração de código oficial.
