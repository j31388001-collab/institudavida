# Integração PromissePay

Documentação consultada em 2026-10-29:

- Visão geral: https://docs.promisse.com.br/
- Criar pagamento: https://docs.promisse.com.br/transacoes/criar
- Consultar transação: https://docs.promisse.com.br/transacoes/consultar

A API usa `POST /transactions` com o header `Authorization` e `Content-Type: application/json`. O campo obrigatório `amount` deve ser enviado em centavos; `webhook` é opcional. A resposta de criação pode fornecer o identificador da transação, status, QR Code em Base64 e o código Pix copia-e-cola. O status deve ser confirmado pela consulta/webhook antes de considerar o pagamento concluído.

A documentação informa que a API opera em produção e não possui sandbox. Por isso, o botão da interface só deve criar uma cobrança real quando o visitante confirmar o valor e estiver ciente de que a cobrança será processada pelo provedor.
