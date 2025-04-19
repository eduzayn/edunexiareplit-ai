#!/usr/bin/env node

/**
 * Este script verifica se o campo paymentOptions existe na tabela courses
 * e o adiciona caso necessário
 */

require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await client.connect();
    console.log('Conectado ao banco de dados');

    // Verificar se a coluna já existe
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name = 'payment_options';
    `;

    const checkResult = await client.query(checkColumnQuery);

    if (checkResult.rows.length === 0) {
      console.log('Campo payment_options não encontrado, adicionando...');
      
      // Adicionar a coluna payment_options
      const addColumnQuery = `
        ALTER TABLE courses 
        ADD COLUMN payment_options JSONB;
      `;
      
      await client.query(addColumnQuery);
      console.log('Campo payment_options adicionado com sucesso!');
    } else {
      console.log('Campo payment_options já existe na tabela courses');
    }

    console.log('Verificando registros existentes...');
    const countQuery = `
      SELECT COUNT(*) as total, 
             COUNT(payment_options) as with_options 
      FROM courses;
    `;
    const countResult = await client.query(countQuery);
    
    console.log(`Total de cursos: ${countResult.rows[0].total}`);
    console.log(`Cursos com opções de pagamento: ${countResult.rows[0].with_options}`);
    
  } catch (error) {
    console.error('Erro ao executar script:', error);
  } finally {
    await client.end();
    console.log('Conexão com o banco de dados encerrada');
  }
}

main();