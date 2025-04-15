/**
 * Script para remover todas as tabelas relacionadas ao CRM
 */
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function dropCRMTables() {
  try {
    console.log('Iniciando a remoção das tabelas CRM...');

    // Remover tabela de contatos (que tem chave estrangeira para clients)
    console.log('Removendo tabela de contatos...');
    await sql`DROP TABLE IF EXISTS contacts CASCADE`;
    console.log('Tabela de contatos removida com sucesso.');

    // Remover tabela de leads
    console.log('Removendo tabela de leads...');
    await sql`DROP TABLE IF EXISTS leads CASCADE`;
    console.log('Tabela de leads removida com sucesso.');

    // Remover tabela de clientes
    console.log('Removendo tabela de clientes...');
    await sql`DROP TABLE IF EXISTS clients CASCADE`;
    console.log('Tabela de clientes removida com sucesso.');

    // Remover enum type para status de lead
    console.log('Removendo tipo enum para status de lead...');
    await sql`DROP TYPE IF EXISTS lead_status CASCADE`;
    console.log('Tipo enum para status de lead removido com sucesso.');

    // Remover enum type para tipo de cliente
    console.log('Removendo tipo enum para tipo de cliente...');
    await sql`DROP TYPE IF EXISTS client_type CASCADE`;
    console.log('Tipo enum para tipo de cliente removido com sucesso.');

    console.log('Todas as tabelas relacionadas ao CRM foram removidas com sucesso!');
  } catch (error) {
    console.error('Erro ao remover tabelas CRM:', error);
  }
}

// Executar a função
dropCRMTables().then(() => {
  console.log('Script finalizado.');
  process.exit(0);
}).catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});