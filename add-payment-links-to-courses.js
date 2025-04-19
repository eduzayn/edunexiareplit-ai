require('dotenv').config();
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');

async function main() {
  // Configurar a conexão com o banco de dados
  const connectionString = process.env.DATABASE_URL;
  console.log('Conectando ao banco de dados...');
  
  const client = postgres(connectionString);
  const db = drizzle(client);
  
  try {
    console.log('Adicionando campos de link de pagamento à tabela de cursos...');
    
    // Verificar se as colunas já existem
    const checkColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name IN ('payment_link_url', 'payment_link_id')
    `);
    
    if (checkColumns.length === 0) {
      // Adicionar as colunas se não existirem
      await db.execute(sql`
        ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
        ADD COLUMN IF NOT EXISTS payment_link_id TEXT
      `);
      console.log('Campos adicionados com sucesso!');
    } else {
      console.log('Os campos já existem na tabela de cursos.');
    }
    
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao executar a migração:', error);
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error('Erro na execução principal:', error);
  process.exit(1);
});