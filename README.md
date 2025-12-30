<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

API de Cobranças - Sistema de gerenciamento de pagamentos com integração ao Mercado Pago.

## Tecnologias

- [NestJS](https://nestjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [TypeORM](https://typeorm.io/)
- [Mercado Pago API](https://www.mercadopago.com.br/developers)

## Project setup

```bash
$ npm install
```

## Configuração do Mercado Pago

### Opção 1: Criar Usuário de Teste (Recomendado)

1. **Obtenha um Access Token de PRODUÇÃO:**
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Faça login com sua conta real do Mercado Pago
   - Crie uma aplicação ou use uma existente
   - Copie o **"Access Token de produção"** (começa com `APP_USR-`)

2. **Configure o token temporariamente no .env:**
   ```bash
   MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu-token-de-producao-aqui
   ```

3. **Execute o script para criar usuário de teste:**
   ```bash
   npm run mp:create-test-user
   ```
   
   O script irá:
   - Criar um usuário de teste no Mercado Pago
   - Mostrar as credenciais (email e senha)
   - Salvar as credenciais em um arquivo JSON

4. **Faça login com o usuário de teste:**
   - Acesse: https://www.mercadopago.com.br/developers/panel/app
   - Use o email e senha gerados pelo script
   - Crie uma aplicação de teste
   - Copie o **"Access Token de teste"** (começa com `TEST-`)

5. **Atualize o .env com o token de teste:**
   ```bash
   MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-de-teste-aqui
   ```

### Opção 2: Usar Token Direto (Não Recomendado para Produção)

Se você preferir pular a criação de usuário de teste:

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Crie uma aplicação
3. Copie o "Access Token de teste"
4. Configure no `.env`:
   ```bash
   MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token-aqui
   ```

### Guia Completo

Para mais detalhes, consulte: [MERCADO_PAGO_SETUP.md](./MERCADO_PAGO_SETUP.md)

## Database Setup

1. **Crie o banco de dados:**
   ```bash
   createdb exa
   ```

2. **Configure o .env:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o `.env` e configure suas credenciais do PostgreSQL.

3. **Execute as migrações:**
   ```bash
   npm run build
   npm run migration:run
   ```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Documentation

Com o servidor rodando, acesse a documentação do Swagger:

```
http://localhost:3000/api
```

## Endpoints

- `POST /api/payment` - Criar pagamento
- `GET /api/payment` - Listar pagamentos
- `GET /api/payment/:id` - Buscar pagamento por ID
- `PUT /api/payment/:id` - Atualizar pagamento
- `GET /health` - Health check

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
