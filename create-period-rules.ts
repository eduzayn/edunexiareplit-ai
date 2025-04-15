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
 * Script para criar regras de permissão baseadas em período
 */
async function createPeriodRules() {
  console.log('Criando regras de permissão baseadas em período...');
  
  // Conecta ao banco de dados
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    // Limpa dados existentes
    await db.delete(abacSchema.periodPermissionRules);
    
    // Regras para período de matrícula (enrollment)
    const enrollmentPeriodRules = [
      // Antes do período (daysBeforeStart > 0)
      { 
        resource: 'matricula', 
        action: 'criar', 
        periodType: 'enrollment', 
        daysBeforeStart: 15, 
        daysAfterEnd: 0, 
        description: 'Permitir criar matrículas 15 dias antes do início do período de matrícula', 
        isActive: true 
      },
      { 
        resource: 'matricula', 
        action: 'atualizar', 
        periodType: 'enrollment', 
        daysBeforeStart: 15, 
        daysAfterEnd: 0, 
        description: 'Permitir atualizar matrículas 15 dias antes do início do período de matrícula', 
        isActive: true 
      },
      { 
        resource: 'pagamento', 
        action: 'criar', 
        periodType: 'enrollment', 
        daysBeforeStart: 15, 
        daysAfterEnd: 0, 
        description: 'Permitir criar pagamentos 15 dias antes do início do período de matrícula', 
        isActive: true 
      },
      { 
        resource: 'curso', 
        action: 'atualizar', 
        periodType: 'enrollment', 
        daysBeforeStart: 30, 
        daysAfterEnd: 0, 
        description: 'Permitir atualizar cursos 30 dias antes do início do período de matrícula', 
        isActive: true 
      },
      
      // Após o período (daysAfterEnd > 0)
      { 
        resource: 'matricula', 
        action: 'criar', 
        periodType: 'enrollment', 
        daysBeforeStart: 0, 
        daysAfterEnd: 7, 
        description: 'Permitir criar matrículas até 7 dias após o fim do período de matrícula', 
        isActive: true 
      },
      { 
        resource: 'matricula', 
        action: 'atualizar', 
        periodType: 'enrollment', 
        daysBeforeStart: 0, 
        daysAfterEnd: 15, 
        description: 'Permitir atualizar matrículas até 15 dias após o fim do período de matrícula', 
        isActive: true 
      },
      { 
        resource: 'matricula', 
        action: 'cancelar', 
        periodType: 'enrollment', 
        daysBeforeStart: 0, 
        daysAfterEnd: 10, 
        description: 'Permitir cancelar matrículas até 10 dias após o fim do período de matrícula', 
        isActive: true 
      },
    ];
    
    // Regras para período acadêmico (academic)
    const academicPeriodRules = [
      // Antes do período (daysBeforeStart > 0)
      { 
        resource: 'disciplina', 
        action: 'ler', 
        periodType: 'academic', 
        daysBeforeStart: 30, 
        daysAfterEnd: 0, 
        description: 'Permitir visualizar disciplinas 30 dias antes do início do período acadêmico', 
        isActive: true 
      },
      { 
        resource: 'aula', 
        action: 'ler', 
        periodType: 'academic', 
        daysBeforeStart: 15, 
        daysAfterEnd: 0, 
        description: 'Permitir visualizar aulas 15 dias antes do início do período acadêmico', 
        isActive: true 
      },
      { 
        resource: 'material', 
        action: 'ler', 
        periodType: 'academic', 
        daysBeforeStart: 15, 
        daysAfterEnd: 0, 
        description: 'Permitir visualizar materiais 15 dias antes do início do período acadêmico', 
        isActive: true 
      },
      { 
        resource: 'material', 
        action: 'baixar', 
        periodType: 'academic', 
        daysBeforeStart: 10, 
        daysAfterEnd: 0, 
        description: 'Permitir baixar materiais 10 dias antes do início do período acadêmico', 
        isActive: true 
      },
      
      // Após o período (daysAfterEnd > 0)
      { 
        resource: 'aula', 
        action: 'ler', 
        periodType: 'academic', 
        daysBeforeStart: 0, 
        daysAfterEnd: 90, 
        description: 'Permitir visualizar aulas até 90 dias após o fim do período acadêmico', 
        isActive: true 
      },
      { 
        resource: 'material', 
        action: 'baixar', 
        periodType: 'academic', 
        daysBeforeStart: 0, 
        daysAfterEnd: 90, 
        description: 'Permitir baixar materiais até 90 dias após o fim do período acadêmico', 
        isActive: true 
      },
      { 
        resource: 'atividade', 
        action: 'ler', 
        periodType: 'academic', 
        daysBeforeStart: 0, 
        daysAfterEnd: 60, 
        description: 'Permitir visualizar atividades até 60 dias após o fim do período acadêmico', 
        isActive: true 
      },
      { 
        resource: 'avaliacao', 
        action: 'ler', 
        periodType: 'academic', 
        daysBeforeStart: 0, 
        daysAfterEnd: 90, 
        description: 'Permitir visualizar avaliações até 90 dias após o fim do período acadêmico', 
        isActive: true 
      },
    ];
    
    // Regras para período financeiro (financial)
    const financialPeriodRules = [
      // Antes do período (daysBeforeStart > 0)
      { 
        resource: 'pagamento', 
        action: 'criar', 
        periodType: 'financial', 
        daysBeforeStart: 30, 
        daysAfterEnd: 0, 
        description: 'Permitir criar pagamentos 30 dias antes do início do período financeiro', 
        isActive: true 
      },
      { 
        resource: 'pagamento', 
        action: 'atualizar', 
        periodType: 'financial', 
        daysBeforeStart: 30, 
        daysAfterEnd: 0, 
        description: 'Permitir atualizar pagamentos 30 dias antes do início do período financeiro', 
        isActive: true 
      },
      { 
        resource: 'desconto', 
        action: 'aplicar', 
        periodType: 'financial', 
        daysBeforeStart: 45, 
        daysAfterEnd: 0, 
        description: 'Permitir aplicar descontos 45 dias antes do início do período financeiro', 
        isActive: true 
      },
      { 
        resource: 'boleto', 
        action: 'gerar', 
        periodType: 'financial', 
        daysBeforeStart: 30, 
        daysAfterEnd: 0, 
        description: 'Permitir gerar boletos 30 dias antes do início do período financeiro', 
        isActive: true 
      },
      
      // Após o período (daysAfterEnd > 0)
      { 
        resource: 'pagamento', 
        action: 'regularizar', 
        periodType: 'financial', 
        daysBeforeStart: 0, 
        daysAfterEnd: 30, 
        description: 'Permitir regularizar pagamentos até 30 dias após o fim do período financeiro', 
        isActive: true 
      },
      { 
        resource: 'pagamento', 
        action: 'cancelar', 
        periodType: 'financial', 
        daysBeforeStart: 0, 
        daysAfterEnd: 15, 
        description: 'Permitir cancelar pagamentos até 15 dias após o fim do período financeiro', 
        isActive: true 
      },
      { 
        resource: 'relatorio', 
        action: 'gerar', 
        periodType: 'financial', 
        daysBeforeStart: 0, 
        daysAfterEnd: 60, 
        description: 'Permitir gerar relatórios financeiros até 60 dias após o fim do período financeiro', 
        isActive: true 
      },
    ];
    
    // Regras para período de certificação (certification)
    const certificationPeriodRules = [
      // Antes do período (daysBeforeStart > 0)
      { 
        resource: 'certificado', 
        action: 'solicitar', 
        periodType: 'certification', 
        daysBeforeStart: 15, 
        daysAfterEnd: 0, 
        description: 'Permitir solicitar certificados 15 dias antes do início do período de certificação', 
        isActive: true 
      },
      { 
        resource: 'certificado', 
        action: 'verificar_requisitos', 
        periodType: 'certification', 
        daysBeforeStart: 30, 
        daysAfterEnd: 0, 
        description: 'Permitir verificar requisitos para certificação 30 dias antes do início do período de certificação', 
        isActive: true 
      },
      
      // Após o período (daysAfterEnd > 0)
      { 
        resource: 'certificado', 
        action: 'gerar', 
        periodType: 'certification', 
        daysBeforeStart: 0, 
        daysAfterEnd: 90, 
        description: 'Permitir gerar certificados até 90 dias após o fim do período de certificação', 
        isActive: true 
      },
      { 
        resource: 'certificado', 
        action: 'baixar', 
        periodType: 'certification', 
        daysBeforeStart: 0, 
        daysAfterEnd: 365, 
        description: 'Permitir baixar certificados até 1 ano após o fim do período de certificação', 
        isActive: true 
      },
      { 
        resource: 'certificado', 
        action: 'compartilhar', 
        periodType: 'certification', 
        daysBeforeStart: 0, 
        daysAfterEnd: 730, 
        description: 'Permitir compartilhar certificados até 2 anos após o fim do período de certificação', 
        isActive: true 
      },
      { 
        resource: 'certificado', 
        action: 'validar', 
        periodType: 'certification', 
        daysBeforeStart: 0, 
        daysAfterEnd: 1825, 
        description: 'Permitir validar certificados até 5 anos após o fim do período de certificação', 
        isActive: true 
      },
    ];
    
    // Combinando todas as regras
    const allPeriodRules = [
      ...enrollmentPeriodRules,
      ...academicPeriodRules,
      ...financialPeriodRules,
      ...certificationPeriodRules
    ];
    
    // Insere as regras
    await db.insert(abacSchema.periodPermissionRules).values(allPeriodRules);
    console.log(`Inseridas ${allPeriodRules.length} regras de permissão baseadas em período`);
    
    console.log('Regras de permissão baseadas em período criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar regras de permissão baseadas em período:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Executa a criação das regras
createPeriodRules()
  .then(() => {
    console.log('Processo de criação de regras baseadas em período finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Falha na criação de regras baseadas em período:', error);
    process.exit(1);
  });