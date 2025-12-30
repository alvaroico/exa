#!/usr/bin/env node

/**
 * Script para criar usuário de teste no Mercado Pago
 *
 * Como usar:
 * 1. Coloque seu Access Token de PRODUÇÃO no .env (começa com APP_USR-)
 * 2. Execute: node create-test-user.js
 * 3. O script irá criar um usuário de teste e mostrar as credenciais
 */

const https = require('https');
require('dotenv').config();

const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const SITE_ID = 'MLB'; // Brasil

if (!MERCADO_PAGO_ACCESS_TOKEN) {
  console.error('❌ ERRO: MERCADO_PAGO_ACCESS_TOKEN não encontrado no .env');
  console.error('');
  console.error('Configure seu Access Token no arquivo .env:');
  console.error('MERCADO_PAGO_ACCESS_TOKEN=APP_USR-seu-token-aqui');
  process.exit(1);
}

if (MERCADO_PAGO_ACCESS_TOKEN.startsWith('TEST-')) {
  console.error('❌ ERRO: Você está usando um token de TESTE');
  console.error('');
  console.error('Para criar usuários de teste, você precisa usar um token de PRODUÇÃO');
  console.error('Acesse: https://www.mercadopago.com.br/developers/panel/app');
  console.error('E copie o "Access Token de produção" (começa com APP_USR-)');
  process.exit(1);
}

console.log('🚀 Criando usuário de teste no Mercado Pago...\n');

const data = JSON.stringify({
  site_id: SITE_ID,
  description: `Test user created at ${new Date().toISOString()}`
});

const options = {
  hostname: 'api.mercadopago.com',
  port: 443,
  path: '/users/test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 200) {
      const user = JSON.parse(responseData);

      console.log('✅ Usuário de teste criado com sucesso!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 CREDENCIAIS DO USUÁRIO DE TESTE');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`ID:       ${user.id}`);
      console.log(`Email:    ${user.email}`);
      console.log(`Nickname: ${user.nickname}`);
      console.log(`Password: ${user.password}`);
      console.log(`Site ID:  ${user.site_id}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      console.log('📝 PRÓXIMOS PASSOS:\n');
      console.log('1. Faça login com este usuário em:');
      console.log('   https://www.mercadopago.com.br/developers/panel/app\n');
      console.log('2. Crie uma aplicação de teste');
      console.log('3. Copie o "Access Token de teste" dessa aplicação');
      console.log('4. Atualize o .env com o novo token:\n');
      console.log(`   MERCADO_PAGO_ACCESS_TOKEN=TEST-xxxxx-xxxxx-xxxxx\n`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Salvar em arquivo
      const fs = require('fs');
      const filename = `test-user-${user.nickname}.json`;
      fs.writeFileSync(filename, JSON.stringify(user, null, 2));
      console.log(`💾 Credenciais salvas em: ${filename}\n`);

    } else {
      console.error('❌ Erro ao criar usuário de teste\n');
      console.error(`Status: ${res.statusCode}`);
      console.error(`Response: ${responseData}\n`);

      if (res.statusCode === 401) {
        console.error('⚠️  Token inválido ou expirado');
        console.error('Obtenha um novo token em:');
        console.error('https://www.mercadopago.com.br/developers/panel/app\n');
      } else if (res.statusCode === 403) {
        console.error('⚠️  Token sem permissões necessárias');
        console.error('Certifique-se de usar um token de PRODUÇÃO (APP_USR-)\n');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro ao fazer request:', error.message);
});

req.write(data);
req.end();

