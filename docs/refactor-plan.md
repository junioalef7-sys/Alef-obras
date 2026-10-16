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

### Fase 6 — Relatório fotográfico
- Supabase Storage;
- metadados no banco;
- miniaturas/compressão;
- paginação;
- fila de upload offline;
- retry sem duplicação.

## Regra de integração

Nenhum módulo novo entra na `main` apenas porque “funcionou uma vez”. Para integrar, precisa passar por teste automatizado, teste em navegador e teste no iPhone/PWA.