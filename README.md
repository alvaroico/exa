# API de Cobranças – Integração com Mercado Pago

API REST construída com NestJS para gerenciar o ciclo de vida de cobranças (pagamentos) com PostgreSQL/TypeORM e integração com o Mercado Pago para pagamentos via PIX e Cartão de Crédito.

## Visão Geral

Esta API permite:

- Criar pagamentos via **PIX** ou **CREDIT_CARD** (`POST /api/payment`).
- Listar pagamentos com filtros por **CPF** e **paymentMethod** (`GET /api/payment`).
- Buscar pagamento por ID (`GET /api/payment/:id`).
- Atualizar o status de um pagamento (`PUT /api/payment/:id`).
- Integrar com o **Mercado Pago Checkout** (preferências) para pagamentos com cartão.
- Receber **webhooks** do Mercado Pago para atualizar o status do pagamento.
- Consultar o **health check** da aplicação e do banco.

Principais tecnologias:

- **NestJS** (Node.js + TypeScript)
- **PostgreSQL** + **TypeORM**
- **Mercado Pago API** (Preferences + Webhooks)
- **Swagger / OpenAPI** para documentação automática

---

## Arquitetura

### Módulos principais

- `AppModule`
  - Configuração principal da aplicação NestJS.
  - Configuração do TypeORM e conexão com PostgreSQL.
  - Registro do módulo de pagamentos.

- `PaymentModule` (`src/api/payment`)
  - `PaymentController`
    - Exposição dos endpoints REST sob `/api/payment`.
  - `PaymentService`
    - Regras de negócio de pagamento.
    - Criação, listagem, busca e atualização de pagamentos.
    - Integração com o `MercadoPagoService` quando `paymentMethod = CREDIT_CARD`.
  - `PaymentWebhookController`
    - Recebe notificações do Mercado Pago em `/api/payment/webhook`.
    - Processa eventos (ex.: `payment.created`, `merchant_order`) e atualiza o status do pagamento.

- `MercadoPagoModule` (`src/external/mercado-pago`)
  - `MercadoPagoService`
    - Responsável por chamar a API do Mercado Pago.
    - Cria **preferences** de checkout (endpoint `/checkout/preferences`).
    - Usa `external_reference` para vincular o pagamento interno ao Mercado Pago.

### Entidades e Banco de Dados

- `Payment` (`src/entities/payment.entity.ts`)
  - `id` (UUID)
  - `cpf` (string, validado por util CPF)
  - `description` (string)
  - `amount` (number)
  - `paymentMethod` (enum: `PIX` | `CREDIT_CARD`)
  - `status` (enum: `PENDING` | `PAID` | `FAIL`)
  - `createdAt` / `updatedAt`

- `MercadoPago` (`src/entities/mercado-pago.entity.ts`)
  - Relaciona um `Payment` com dados da integração Mercado Pago
  - Campos como `paymentId`, `preferenceId`, `checkoutUrl`, `status`, `transactionId` e `rawResponse` da preferência criada.

Migrações principais (em `src/database/migrations`):

- `1704067200001-CreatePaymentsTable.ts`
- `1704067200002-CreateMercadoPagoTable.ts`

O acesso ao banco é feito via TypeORM, configurado em `ormconfig.json` e `src/data-source.ts`/`src/database/config.ts`.

---

## Fluxo de Pagamento

### 1. Criação do pagamento

1. Cliente chama `POST /api/payment` com `cpf`, `description`, `amount` e `paymentMethod`.
2. A API cria um registro na tabela `payments` com status `PENDING`.
3. Se `paymentMethod = CREDIT_CARD`:
   - O `PaymentService` chama o `MercadoPagoService.createPreference`.
   - Uma **preference** é criada no Mercado Pago com:
     - `external_reference = id` do pagamento interno.
     - `back_urls` apontando para `/api/payment/success`, `/failure` e `/pending`.
     - `notification_url` apontando para `/api/payment/webhook`.
   - A API persiste os dados na tabela `mercado_pago` (incluindo `checkoutUrl` e `rawResponse`).
4. A resposta da API inclui os dados do pagamento e, quando aplicável, a `checkoutUrl` para redirecionar o usuário ao Mercado Pago.

### 2. Pagamento do usuário

- O consumidor (front-end, Postman, etc.) redireciona o usuário para a `checkoutUrl` retornada.
- O usuário finaliza (ou não) o pagamento no Mercado Pago.

### 3. Webhook do Mercado Pago

- O Mercado Pago envia eventos para `POST {BACKEND_URL}/api/payment/webhook`.
- O `PaymentWebhookController`:
  - Lê o evento (por exemplo, `type: payment`, `data.id` ou `topic: payment`).
  - Consulta detalhes do pagamento na API do Mercado Pago (`/v1/payments/:id` ou `merchant_orders/:id`).
  - Usa o `external_reference` para localizar o `Payment` interno.
  - Atualiza o status interno para `PAID`, `FAIL` ou mantém `PENDING` conforme o status retornado.

---

## Setup do Projeto

### Pré-requisitos

- **Node.js** LTS
- **npm** (ou outro gerenciador, mas o projeto usa npm)
- **PostgreSQL** instalado e em execução
- Conta no **Mercado Pago**
- (Opcional) **ngrok** para testar webhooks localmente
- (Opcional) **Docker** e **Docker Compose**

### Instalação

```bash
npm install
```

### Variáveis de Ambiente

Crie o arquivo `.env` a partir do template:

```bash
cp .env.example .env
```

Configure pelo menos:

```bash
# Banco de dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=exa

# URL pública do backend (usada nas back_urls e webhook)
BACKEND_URL=http://localhost:3000

# Token de acesso do Mercado Pago (teste ou produção)
MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-aqui
```

> Em ambiente local com webhooks, atualize `BACKEND_URL` para a URL pública do ngrok (ex.: `https://xxxxx.ngrok-free.app`).

### Configuração do Mercado Pago

Você pode seguir duas abordagens:

#### Opção 1 – Usuário de teste (recomendado)

1. Obtenha um **Access Token de produção** no painel de desenvolvedor do Mercado Pago.
2. Configure temporariamente no `.env`:
   ```bash
   MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao
   ```
3. Execute o script para criar usuário de teste:
   ```bash
   npm run mp:create-test-user
   ```
4. O script retorna email e senha do usuário de teste.
5. Faça login como usuário de teste, crie uma aplicação e copie o **Access Token de teste** (`TEST-...`).
6. Atualize o `.env` com:
   ```bash
   MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-de-teste
   ```

#### Opção 2 – Usar token de teste direto

1. Crie uma aplicação no painel.
2. Copie o `Access Token de teste`.
3. Configure no `.env` diretamente.

### Banco de Dados e Migrações

Crie o banco de dados e rode as migrações:

```bash
createdb exa
npm run build
npm run migration:run
```

---

## Executando o Projeto

### Ambiente de desenvolvimento

```bash
# modo desenvolvimento (watch)
npm run start:dev

# modo padrão
npm run start

# modo produção
npm run build
npm run start:prod
```

### Testes

```bash
# testes unitários
npm run test

# testes end-to-end
npm run test:e2e

# cobertura de testes
npm run test:cov
```

### Docker / Docker Compose

Se você preferir rodar com Docker:

```bash
# subir serviços (API + banco)
docker compose up
```

Certifique-se de que o `docker-compose.yaml` está configurado com as mesmas variáveis de ambiente do `.env` ou de um `env_file`.

---

## Documentação da API (Swagger)

Com a aplicação rodando, acesse:

```text
http://localhost:3000/swagger
```

A interface do Swagger exibe todos os endpoints, DTOs, enums e exemplos configurados no código.

---

## Endpoints Principais

### Pagamentos – `/api/payment`

#### `POST /api/payment` – Criar pagamento

Cria um novo pagamento.

Campos comuns:

- `cpf` (string, apenas dígitos, validado via util de CPF)
- `description` (string)
- `amount` (number)
- `paymentMethod` (string: `PIX` ou `CREDIT_CARD`)

Exemplo – pagamento PIX:

```json
{
  "cpf": "22233344405",
  "description": "Pagamento via PIX",
  "amount": 150.0,
  "paymentMethod": "PIX"
}
```

Exemplo – pagamento com Cartão de Crédito:

```json
{
  "cpf": "22233344405",
  "description": "Compra online",
  "amount": 299.99,
  "paymentMethod": "CREDIT_CARD"
}
```

Resposta (exemplo simplificado):

```json
{
  "id": "c0719f81-9711-487d-a5c9-3d7b42f3953d",
  "cpf": "22233344405",
  "description": "Compra online",
  "amount": 299.99,
  "paymentMethod": "CREDIT_CARD",
  "status": "PENDING",
  "checkoutUrl": "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
  "createdAt": "2025-12-30T10:28:06.556Z",
  "updatedAt": "2025-12-30T10:28:06.556Z"
}
```

> Para `PIX`, o comportamento padrão é manter o status em `PENDING` e apenas registrar o pagamento no banco.

#### `GET /api/payment` – Listar pagamentos

Parâmetros de query opcionais:

- `cpf`: filtra por CPF
- `paymentMethod`: `PIX` ou `CREDIT_CARD`

Exemplo:

```text
GET /api/payment?cpf=22233344405&paymentMethod=CREDIT_CARD
```

#### `GET /api/payment/:id` – Buscar pagamento por ID

Retorna os detalhes de um pagamento específico.

- `id` deve ser um UUID válido.
- Se não encontrado ou se o formato do `id` for inválido, a API retorna erro com mensagem padronizada.

#### `PUT /api/payment/:id` – Atualizar pagamento

Atualiza informações de um pagamento, como o `status`.

Exemplo de body:

```json
{
  "status": "PAID"
}
```

> Existe uma regra de negócio que impede, por exemplo, exclusão de pagamentos `PAID`. As validações de status seguem a regra de domínio implementada no `PaymentService`.

> A rota de **DELETE** de pagamento foi removida para manter o histórico de transações.

### Webhooks e Callbacks – `/api/payment`

#### `POST /api/payment/webhook`

Endpoint usado como `notification_url` no Mercado Pago.

- Recebe eventos como `payment.created`, `merchant_order`, etc.
- Usa os dados do evento para consultar a API do Mercado Pago e descobrir:
  - Status do pagamento.
  - `external_reference` (id do pagamento interno).
- Atualiza o status do pagamento interno (`PENDING`, `PAID`, `FAIL`).

#### `POST /api/payment/success`
#### `POST /api/payment/failure`
#### `POST /api/payment/pending`

Endpoints usados como `back_urls` no Mercado Pago:

- `success`: chamado quando o pagamento é aprovado.
- `failure`: chamado quando o pagamento é rejeitado.
- `pending`: chamado quando o pagamento fica pendente.

Normalmente são usados para redirecionar o usuário no front-end, mas aqui também podem registrar logs ou atualizar algum estado adicional.

### Health Check – `/health`

#### `GET /health`

- Verifica se a aplicação está ativa e se a conexão com o banco está funcional.
- Retorna um JSON com status da aplicação e tempo de execução da checagem.

---

## Boas Práticas e Observações

- **Validação de CPF**:
  - O projeto possui um util de validação em `src/utils/cpf.validator.ts` que implementa a regra matemática dos dígitos verificadores.
  - Sempre envie o CPF sem máscara (somente dígitos).

- **Status de Pagamento**:
  - `PENDING`: pagamento criado, aguardando processamento.
  - `PAID`: pagamento aprovado.
  - `FAIL`: pagamento rejeitado ou com erro.

- **Mercado Pago – Sandbox x Produção**:
  - Use tokens de teste (`TEST-...`) em desenvolvimento.
  - Use ngrok (ou semelhante) para expor `BACKEND_URL` e testar webhooks.
  - Não exponha `MERCADO_PAGO_ACCESS_TOKEN` em repositórios públicos.

- **Segurança**:
  - Considere adicionar autenticação (API key/JWT) em produção.
  - Habilite HTTPS no ambiente produtivo.

---

## Licença

Este projeto segue a licença MIT (mesma licença padrão do NestJS).
