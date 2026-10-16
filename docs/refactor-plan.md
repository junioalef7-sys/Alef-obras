# Reformulação estrutural do Edific

Esta branch é a nova base de desenvolvimento. A produção permanece na `main` até cada etapa ser validada.

## Objetivos

1. Um único controlador de autenticação e sessão.
2. Supabase como fonte oficial de dados online.
3. Offline com fila local explícita e reenvio idempotente.
4. Escritas financeiras e de equipe protegidas contra duplicação.
5. Backup versionado, validado e verificável.
6. Cobrança decidida pelo servidor/webhook, nunca pelo navegador.
7. Módulos separados para reduzir regressões entre áreas.
8. Testes automáticos antes de integrar qualquer módulo à produção.
9. Relatório fotográfico não será reintroduzido nesta reformulação.

## Ordem de execução

### Fase 1 — Auth e sessão
- controlador único de estado;
- timeout central;
- apenas um listener de `onAuthStateChange`;
- login não depende de sincronização para liberar a tela;
- falha de sync nunca devolve o usuário para login;
- logout limpa estado da sessão;
- recuperação de senha tratada como estado próprio.

### Fase 2 — Sincronização
- IDs únicos por operação;
- fila offline;
- retry controlado;
- resolução de conflito por versão/data;
- Supabase como fonte oficial;
- Realtime apenas para receber mudanças.

### Fase 3 — Backup/importação
- versão do formato;
- contagem por tabela;
- validação antes da gravação;
- relatório pós-importação;
- nenhuma importação parcial silenciosa.

### Fase 4 — Obras, Equipe e Financeiro
- separar leitura, cálculo e escrita;
- pagamentos e diárias idempotentes;
- valores monetários normalizados;
- transações de banco para ações compostas.

### Fase 5 — Cobrança e conta
- webhook como fonte de verdade do pagamento;
- boleto só libera após confirmação;
- cancelamento confirmado antes de exclusão;
- exclusão de conta no servidor.

### Fase 6 — Integração e homologação
- integrar os núcleos novos em uma versão de teste;
- manter produção atual isolada;
- testar login, navegação, sincronização, backup, obras, equipe, financeiro e cobrança em conjunto;
- validar no navegador e no iPhone/PWA;
- somente depois preparar migração controlada para produção.

## Escopo excluído

- Relatório fotográfico não será reintroduzido no Edific nesta reformulação.
- Fotos antigas existentes no banco/Storage não serão apagadas automaticamente; qualquer exclusão futura deverá ser uma decisão explícita e separada.

## Regra de integração

Nenhum módulo novo entra na `main` apenas porque “funcionou uma vez”. Para integrar, precisa passar por teste automatizado, teste em navegador e teste no iPhone/PWA.