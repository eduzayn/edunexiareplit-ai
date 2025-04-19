
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

/**
 * CONFIGURAÇÃO DO BANCO DE DADOS:
 * 
 * IMPORTANTE: Este projeto está configurado para usar explicitamente um banco de dados PostgreSQL Neon externo
 * que contém 43 tabelas pré-configuradas com dados reais. Esta configuração ignora deliberadamente a variável 
 * de ambiente DATABASE_URL do Replit.
 * 
 * Por que esta abordagem:
 * 1. O banco externo "ep-curly-flower-a4sxras7.us-east-1.aws.neon.tech" contém todas as tabelas e dados necessários
 * 2. Quando usamos a ferramenta de banco de dados do Replit, ele cria um novo banco vazio e altera as variáveis
 *    de ambiente, mas precisamos continuar usando o banco externo existente
 * 3. Na interface do Replit, o painel "Database" mostrará incorretamente 0 tabelas, mas isso é apenas visual
 * 
 * A aplicação está corretamente conectada ao banco externo e funcionando com todos os dados existentes.
 */

neonConfig.webSocketConstructor = ws;

// Usar explicitamente a string de conexão do banco externo, ignorando DATABASE_URL
const CONNECTION_STRING = "postgresql://neondb_owner:npg_NcbmRdPE1l2k@ep-curly-flower-a4sxras7.us-east-1.aws.neon.tech/neondb?sslmode=require";

console.log("Conectando ao banco de dados externo:", CONNECTION_STRING.replace(/:[^:]*@/, ":****@"));
console.log("Ignorando variável de ambiente DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:]*@/, ":****@"));

// Criar um pool com configurações de reconexão
export const pool = new Pool({ 
  connectionString: CONNECTION_STRING,
  max: 20, // Máximo de conexões no pool
  idleTimeoutMillis: 30000, // Tempo limite para conexões inativas
  connectionTimeoutMillis: 5000, // Tempo limite para estabelecer novas conexões
});

// Adicionar tratamento de erro e reconexão
pool.on('error', (err, client) => {
  console.error('Erro inesperado no cliente do pool:', err.message);
  // Não encerrar o aplicativo, permitir que o pool tente reconectar
});

// Verificar a conexão com o banco de dados
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Conexão com banco de dados estabelecida com sucesso');
    client.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
    return false;
  }
}

// Testar a conexão inicialmente
testConnection();

export const db = drizzle({ client: pool, schema });
