# OBRIX — Webhook Pix Efí: receptor isolado (19/11/2026)

**Status: somente preparação técnica; NÃO homologado ponta a ponta.**

Este material existe apenas na branch `test/obrix-restauracao-app-isolado-20261118` e no Supabase HML `xavwkfgrnowmusbkbiea`. Não registrar a chave Pix na Efí, não implantar o relay em servidor público e não habilitar assinaturas com base nesses eventos sem autorização explícita e homologação adicional.

## Arquitetura proposta

1. **Efí em homologação** -> `POST https://<dominio-de-homologacao>/webhook` durante cadastro e `/webhook/pix` para Pix. A Efí exige mTLS de entrada; o relay de referência (`relay.mjs`) exige certificado cliente validado contra a cadeia pública de homologação da Efí.
2. **Relay Node TLS (NÃO IMPLANTADO):** aceita apenas POST nessas rotas, somente clientes com mTLS validado; limita corpo a 32 KiB. Para Pix, assina `<timestamp-epoch-segundos>.<corpo-bruto>` com HMAC-SHA256.
3. **Supabase Edge `obrix-hml-pix-webhook-inbox-20261119` (ACTIVE, mas FAIL-CLOSED):** confere projeto HML, segredo de pelo menos 32 caracteres, assinatura constante-tempo, tolerância de 5 min, formato JSON, valor fixo R$1 e TXID `obrixhml...` do ensaio.
4. **RPC `public.obrix_hml_inbox_pix_receber` (implantada na HML):** somente `service_role` pode registrar `private.pagamento_eventos`, com idempotência por `endToEndId`. Eventuais eventos são marcados como **não conciliados**.
5. **NENHUM pagamento, assinatura ou plano é ativado** por esse caminho. A conciliação futura deve consultar a Efí via OAuth + mTLS de saída e validar empresa, plano, idempotência, quantia integral, estado confirmado e origem.

## Variáveis e certificados, apenas no futuro servidor HML

- `OBRIX_HML_EFI_PIX_RELAY_HMAC_KEY`: segredo aleatório hexadecimal ou Base64 *com pelo menos 32 caracteres*, o **mesmo** no relay e nos Edge Function Secrets **do projeto isolado**. Não enviar pelo chat nem commitar no GitHub.
- `OBRIX_HML_SERVER_TLS_CERT_PATH`: certificado HTTPS válido do futuro domínio de homologação.
- `OBRIX_HML_SERVER_TLS_KEY_PATH`: chave privada TLS do domínio (não é a chave privada da API Pix).
- `OBRIX_HML_EFI_WEBHOOK_CA_PATH`: cadeia pública para **webhook de entrada** em homologação fornecida pela Efí: https://certificados.efipay.com.br/webhooks/certificate-chain-homolog.crt . Não confundir com `EFI_PIX_CERT_B64` do cliente de saída.
- `OBRIX_HML_WEBHOOK_PORT`: por padrão `8443`, com roteamento TLS de 443 no domínio quando implantado.

`relay.mjs` é referência de implantação: requer revisão operacional (rede, firewall, renovação de certificado, monitoramento, disponibilidade, retries e testes de segurança) antes de publicação. Apenas estar com a Edge Function ACTIVE não configura um receptor Pix funcional. **O nome do segredo do relay foi intencionalmente criado agora; não foi provisionado nesta etapa.**

## Testes obrigatórios antes do cadastro na Efí

- Servidor com DNS HTTPS e TLS 1.2+, certificado válido, acesso aos arquivos TLS e CA Efí.
- Conexão **sem** certificado cliente deve falhar na borda TLS; com certificado de cliente homologação Efí válido deve passar. Testes locais com um certificado qualquer não comprovam que a Efí será aceita.
- Requisição diretamente à URL pública da Edge Function sem HMAC deve ser rejeitada. Segredo ausente, HMAC incorreto ou tempo com atraso maior que 5 minutos devem ser rejeitados. Nunca confiar apenas em cabeçalhos como `X-Forwarded-For` ou `X-Client-Cert` enviados por um cliente.
- Evento idêntico entregue duas vezes deve gerar só um registro. Não aceitar TXID fora do ensaio, valor diferente de R$1, corpo excessivo ou formato inesperado.
- Nenhum evento deve modificar `pagamentos_assinatura` nem `assinaturas`. Simulações NÃO representam pagamento comercial.
- Confirmar **por consulta** a situação atual da chave Pix no portal Efí antes de usar `PUT /v2/webhook/:chave`, pois cada chave aceita somente uma URL. Caso já esteja associada a outro sistema, não sobrescrever.
- Cadastrar e receber teste mTLS da Efí apenas com autorização do responsável; registrar entrega e reentrega; só então chamar de 'webhook validado'.

## Testes já concluídos em HML

A função de banco passou **8 verificações transacionais** com `ROLLBACK`: primeira inserção, idempotência, uma linha por evento, nenhuma assinatura ativada, somente campos mínimos, rejeição de R$39,90, rejeição de TXID arbitrário e rejeição de usuário comum. Após os testes, banco sem pagamentos ou eventos persistentes.

## Referências oficiais
- Efí: https://dev.efipay.com.br/docs/api-pix/webhooks/
- Exemplo oficial de relay Nginx mTLS: https://github.com/efipay/mtls-webhook
- Supabase — autenticação de Edge Functions: https://supabase.com/docs/guides/functions/auth-headers
- Supabase — acesso a Secrets: https://supabase.com/docs/guides/functions/secrets
