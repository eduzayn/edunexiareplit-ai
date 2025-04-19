/**
 * Script para atualizar a tabela edunexa_payment_links no banco de dados
 * adicionando os campos necessários conforme especificação técnica
 */

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

async function updatePaymentLinksTable() {
  try {
    console.log('Atualizando tabela edunexa_payment_links...');
    
    // Verificar se a tabela já existe 
    const checkTableSQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'edunexa_payment_links'
      );
    `;
    
    const tableExists = await pool.query(checkTableSQL);
    
    if (tableExists.rows[0].exists) {
      console.log('Tabela edunexa_payment_links existe, criando campos adicionais...');
      
      // Tentar adicionar o campo internal_id
      try {
        await pool.query(`
          ALTER TABLE edunexa_payment_links 
          ADD COLUMN IF NOT EXISTS internal_id SERIAL PRIMARY KEY;
        `);
        console.log('Campo internal_id adicionado ou já existente');
      } catch (error) {
        console.error('Erro ao adicionar campo internal_id:', error);
      }
      
      // Lista de colunas e seus tipos para adicionar se não existirem
      const columns = [
        { name: 'asaas_payment_link_id', type: 'VARCHAR(100)' },
        { name: 'asaas_payment_link_url', type: 'TEXT' },
        { name: 'link_name', type: 'VARCHAR(255)' },
        { name: 'description', type: 'TEXT' },
        { name: 'amount', type: 'DECIMAL(10, 2)' },
        { name: 'course_id', type: 'INTEGER' },
        { name: 'generating_consultant_id', type: 'INTEGER' },
        { name: 'external_reference', type: 'VARCHAR(255)' },
        { name: 'billing_type', type: 'VARCHAR(50)' },
        { name: 'charge_type', type: 'VARCHAR(50)' },
        { name: 'status', type: 'VARCHAR(20)' },
        { name: 'internal_status', type: 'VARCHAR(20)' },
        { name: 'custom_image_url', type: 'TEXT' },
        { name: 'notification_enabled', type: 'BOOLEAN' },
        { name: 'payer_name', type: 'VARCHAR(255)' },
        { name: 'payer_cpf', type: 'VARCHAR(20)' },
        { name: 'payer_email', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP' }
      ];
      
      // Adicionar cada coluna se não existir
      for (const column of columns) {
        try {
          await pool.query(`
            ALTER TABLE edunexa_payment_links 
            ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};
          `);
          console.log(`Campo ${column.name} adicionado ou já existente`);
        } catch (error) {
          console.error(`Erro ao adicionar campo ${column.name}:`, error);
        }
      }

      // Indexar campos importantes
      try {
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_edunexa_payment_links_course_id 
          ON edunexa_payment_links(course_id);
        `);
        console.log('Índice para course_id criado ou já existente');
        
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_edunexa_payment_links_asaas_id 
          ON edunexa_payment_links(asaas_payment_link_id);
        `);
        console.log('Índice para asaas_payment_link_id criado ou já existente');
      } catch (error) {
        console.error('Erro ao criar índices:', error);
      }
      
      console.log('Atualização da tabela edunexa_payment_links concluída!');
    } else {
      // Criar a tabela completa se não existir
      const createTableSQL = `
        CREATE TABLE edunexa_payment_links (
          internal_id SERIAL PRIMARY KEY,
          asaas_payment_link_id VARCHAR(100),
          asaas_payment_link_url TEXT,
          link_name VARCHAR(255) NOT NULL,
          description TEXT,
          amount DECIMAL(10, 2) NOT NULL,
          course_id INTEGER NOT NULL,
          generating_consultant_id INTEGER,
          external_reference VARCHAR(255),
          billing_type VARCHAR(50) NOT NULL DEFAULT 'UNDEFINED',
          charge_type VARCHAR(50) NOT NULL DEFAULT 'DETACHED',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          internal_status VARCHAR(20) NOT NULL DEFAULT 'Active',
          custom_image_url TEXT,
          notification_enabled BOOLEAN DEFAULT TRUE,
          payer_name VARCHAR(255),
          payer_cpf VARCHAR(20),
          payer_email VARCHAR(255),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_edunexa_payment_links_course_id 
        ON edunexa_payment_links(course_id);
        
        CREATE INDEX idx_edunexa_payment_links_asaas_id 
        ON edunexa_payment_links(asaas_payment_link_id);
      `;
      
      await pool.query(createTableSQL);
      console.log('Tabela edunexa_payment_links criada com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao atualizar tabela:', error);
  } finally {
    // Encerra o pool de conexões
    pool.end();
  }
}

// Executa a função principal
updatePaymentLinksTable();