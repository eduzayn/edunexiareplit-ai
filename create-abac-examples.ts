import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import * as abacSchema from './shared/abac-schema';

dotenv.config();

// Configurações do banco de dados
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('A variável de ambiente DATABASE_URL não está definida');
  process.exit(1);
}

/**
 * Script para criar dados de exemplo para o sistema ABAC
 */
async function createExampleData() {
  console.log('Criando dados de exemplo para o sistema ABAC...');
  
  // Conecta ao banco de dados
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // Exemplos de permissões por fase de instituição
    console.log('Inserindo exemplos de permissões por fase de instituição...');
    
    // Limpa dados existentes
    await db.delete(abacSchema.institutionPhasePermissions);
    
    // Insere novos exemplos
    await db.insert(abacSchema.institutionPhasePermissions).values([
      {
        resource: 'matricula',
        action: 'ler',
        phase: 'active',
        description: 'Ver matrículas quando instituição está ativa',
        isAllowed: true,
        isActive: true
      },
      {
        resource: 'matricula',
        action: 'criar',
        phase: 'suspended',
        description: 'Criar matrículas quando instituição está suspensa',
        isAllowed: false,
        isActive: true
      },
      {
        resource: 'financeiro',
        action: 'ler',
        phase: 'active',
        description: 'Visualizar informações financeiras quando instituição está ativa',
        isAllowed: true,
        isActive: true
      },
      {
        resource: 'financeiro',
        action: 'criar',
        phase: 'canceled',
        description: 'Criar informações financeiras quando instituição está cancelada',
        isAllowed: false,
        isActive: true
      },
      {
        resource: 'curso',
        action: 'ler',
        phase: 'implementation',
        description: 'Visualizar cursos durante implementação',
        isAllowed: true,
        isActive: true
      }
    ]);
    
    console.log('Exemplos de permissões por fase de instituição inseridos com sucesso!');
    
    // Exemplos de permissões por status de pagamento
    console.log('Inserindo exemplos de permissões por status de pagamento...');
    
    // Limpa dados existentes
    await db.delete(abacSchema.paymentStatusPermissions);
    
    // Insere novos exemplos
    await db.insert(abacSchema.paymentStatusPermissions).values([
      {
        resource: 'certificado',
        action: 'gerar',
        paymentStatus: 'paid',
        description: 'Gerar certificado quando o pagamento está confirmado',
        isAllowed: true,
        isActive: true
      },
      {
        resource: 'certificado',
        action: 'gerar',
        paymentStatus: 'pending',
        description: 'Gerar certificado quando o pagamento está pendente',
        isAllowed: false,
        isActive: true
      },
      {
        resource: 'aula',
        action: 'acessar',
        paymentStatus: 'overdue',
        description: 'Acessar aulas quando o pagamento está atrasado',
        isAllowed: false,
        isActive: true
      },
      {
        resource: 'aula',
        action: 'acessar',
        paymentStatus: 'paid',
        description: 'Acessar aulas quando o pagamento está confirmado',
        isAllowed: true,
        isActive: true
      },
      {
        resource: 'material',
        action: 'baixar',
        paymentStatus: 'pending',
        description: 'Baixar materiais quando o pagamento está pendente',
        isAllowed: true,
        isActive: true
      }
    ]);
    
    console.log('Exemplos de permissões por status de pagamento inseridos com sucesso!');
    
    console.log('Dados de exemplo criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar dados de exemplo:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executa a criação dos dados de exemplo
createExampleData()
  .then(() => {
    console.log('Processo de criação de dados de exemplo finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha na criação de dados de exemplo:', error);
    process.exit(1);
  });