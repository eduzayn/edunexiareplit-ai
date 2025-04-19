/**
 * Script para criar a tabela edunexa_payment_links no banco de dados
 */

// Importa o módulo de pool do PostgreSQL
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const { Pool } = pg;

// Usar a mesma string de conexão que o aplicativo usa no server/db.ts
const connectionString = "postgresql://neondb_owner:npg_NcbmRdPE1l2k@ep-curly-flower-a4sxras7.us-east-1.aws.neon.tech/neondb?sslmode=require";

console.log(`Usando string de conexão: ${connectionString.replace(/:[^:]*@/, ':****@')}`);

// Cria um pool de conexões
const pool = new Pool({
  connectionString,
});

async function createPaymentLinksTable() {
  try {
    // SQL para criar a tabela
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS edunexa_payment_links (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL,
        link_name VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        payment_url VARCHAR(255) NOT NULL,
        billing_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        payer_name VARCHAR(255),
        payer_cpf VARCHAR(20),
        payer_email VARCHAR(255),
        custom_image_url VARCHAR(500),
        notification_enabled BOOLEAN DEFAULT TRUE,
        asaas_id VARCHAR(100)
      );
    `;

    console.log('Criando tabela edunexa_payment_links...');
    await pool.query(createTableSQL);
    console.log('Tabela edunexa_payment_links criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    // Encerra o pool de conexões
    pool.end();
  }
}

// Executa a função principal
createPaymentLinksTable();