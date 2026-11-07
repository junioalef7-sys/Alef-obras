# OBRIX — Laboratório de interface isolado

**Data:** 07/11/2026. **Branch:** `test/interface-lab-equipe-20261107`.

## Entrega

Página isolada: [obrix-laboratorio-interface.html](../obrix-laboratorio-interface.html).

A página tem uma política CSP que impede conexões de rede (`connect-src 'none'`) e não carrega bibliotecas externas, tokens ou configurações do OBRIX de produção. Utiliza **somente objetos JavaScript em memória**. A tela não persiste informações no navegador nem acessa dados reais. Foi publicada somente como `PREVIEW` da Vercel, sem mexer na produção.

## Testes automáticos do modelo — 22 aprovados

1. Separação inicial das empresas A/B.
2. Funcionário de outra empresa inacessível.
3. Obra de outra empresa não pode ser vinculada.
4. Diária inteira de R$ 200.
5. Meia diária de R$ 100.
6. Bruto R$ 330, vale R$ 50, líquido R$ 280.
7. Vínculos individuais R$ 200/R$ 100, sem rateio.
8. Despesas por obra A1 R$ 150 / A2 R$ 130.
9. Pagamento marca diária, bônus e vale como quitados.
10. Pagamento repetido é bloqueado.
11. Estorno reabre os registros.
12. Estorno marca despesas como estornadas e desativa vínculos.
13. Novo estorno do mesmo pagamento é idempotente.
14. Novo pagamento após estorno é válido.
15. Exclusão de funcionário com histórico é impedida.
16. Inativação impede novo registro de diária.
17. Inativação preserva histórico.
18. Plano limitado impede segunda obra.
19. Plano limitado impede segundo funcionário.
20. Empresa de teste mantém dados separados.
21. Funcionário sem histórico pode ser excluído.
22. Exclusão integral da empresa B preserva a empresa A.

O modelo JavaScript embutido foi exercitado diretamente com as 22 verificações. A Vercel confirmou implantação PREVIEW `READY`, e a URL da página retornou HTTP 200.

**Limitação importante:** este não é um teste de ponta a ponta real do aplicativo publicado. Ele não valida login, RLS com sessões reais, chamadas REST, Edge Functions, Supabase Storage, gatilhos, operações financeiras no banco real, ou a interface oficial das telas de Equipe/Financeiro. As funções reais de pagamento/estorno foram avaliadas separadamente no ensaio SQL anterior, em banco de auditoria.

## Inventário do Storage, conferido somente em produção

- Conta principal: 45 arquivos no bucket `relatorio-fotografico`, 3 no `obrix-documentos` e 1 no `obrix-fotos`.
- Conta de testes: 242 arquivos no bucket `relatorio-fotografico`.
- Nenhuma gravação ou exclusão no Storage oficial nesta etapa.

**Próximo passo de homologação real:** configurar uma instância de teste com autenticação própria, o esquema operacional do aplicativo e um bucket privado temporário; executar o frontend oficial redirecionado apenas para esse backend e validar fluxo de dados, Storage, permissões e exclusão integral. Não conectar um laboratório à produção para testes destrutivos.

Fonte técnica: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) e [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).
