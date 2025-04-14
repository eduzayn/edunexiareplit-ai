# Documentação da Integração com a API Lytex

## Visão Geral

A integração com o gateway de pagamento Lytex foi implementada para permitir o processamento de pagamentos de matrículas no sistema EdunexIA. A integração utiliza a API Lytex para autenticação, consulta de clientes, criação de faturas e verificação de status de pagamentos.

## Endpoints Utilizados

- **Autenticação**: `/v2/auth/obtain_token` - Endpoint para obter token de acesso
- **Clientes**: `/v1/clients` - Endpoint para consultar e criar clientes
- **Faturas**: `/v1/invoices` - Endpoint para criar faturas e gerar links de pagamento

## Fluxo de Integração

1. **Autenticação**: O sistema se autentica na API Lytex usando as credenciais configuradas (CLIENT_ID e CLIENT_SECRET)
2. **Registro de Aluno**: Ao processar uma matrícula, o sistema verifica se o aluno já está cadastrado na plataforma Lytex
3. **Criação de Fatura**: Com os dados do aluno e da matrícula, o sistema cria uma fatura na Lytex
4. **Link de Pagamento**: O sistema recebe e armazena o link de pagamento gerado pela Lytex
5. **Verificação de Status**: Periodicamente, o sistema consulta o status do pagamento na API

## Requisitos Técnicos

### Autenticação

- O token de acesso obtido é válido por 60 minutos
- O sistema gerencia automaticamente a renovação do token quando necessário

### Clientes

- O documento (CPF/CNPJ) do cliente é um campo obrigatório e único
- A busca de clientes pode ser feita diretamente pelo CPF ou pelo ID do cliente
- Caso o cliente não exista, o sistema o cadastra automaticamente

### Faturas

- As faturas exigem pelo menos os seguintes campos obrigatórios:
  - `client`: Dados do cliente (nome, tipo, CPF, email)
  - `items`: Lista de itens da fatura (nome, descrição, quantidade, valor)
  - `dueDate`: Data de vencimento no formato YYYY-MM-DD
  - `paymentMethods`: Métodos de pagamento habilitados
  - `externalReference`: Código de referência da matrícula

### Métodos de Pagamento

- **PIX**: Habilitado para todos os valores
- **Boleto**: Habilitado para todos os valores, com prazo configurável
- **Cartão de Crédito**: Disponível apenas para valores acima de R$ 500,00

### Tratamento de Erros

- O sistema implementa mecanismos de tolerância a falhas e retry
- Em caso de indisponibilidade temporária da API, o sistema utiliza uma simulação como fallback
- Todas as operações e erros são devidamente registrados em logs

## Configuração

Para utilizar a integração, é necessário configurar as seguintes variáveis de ambiente:

- `LYTEX_CLIENT_ID`: Identificador do cliente na plataforma Lytex
- `LYTEX_CLIENT_SECRET`: Chave secreta para autenticação na API

## Testes e Validação

A integração foi testada em diversos cenários:

1. Autenticação na API
2. Busca de clientes por CPF
3. Criação de novos clientes
4. Criação de faturas com diferentes métodos de pagamento
5. Verificação de status de pagamentos

## Limitações Conhecidas

- A API de status de pagamento (v2) apresenta inconsistências e em alguns casos retorna erro 404
- Em caso de falha na verificação de status, o sistema assume o status "pending_payment" por segurança

## Melhorias Futuras

- Implementar webhook para recebimento de notificações de pagamento em tempo real
- Adicionar suporte a parcelamento no cartão de crédito
- Melhorar a tratativa de erros específicos da API