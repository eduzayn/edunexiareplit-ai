/**
 * !!! IMPORTANTE: NÃO EXCLUIR ESTE ARQUIVO !!!
 * 
 * Este script é essencial para testar o adaptador do gateway de pagamento Lytex.
 * Ele contém testes que validam o funcionamento correto da integração do 
 * sistema com o gateway, incluindo registro de alunos e geração de cobranças.
 * 
 * Mantenha este arquivo para referência e testes futuros da integração.
 */

// Usando formato ESM (import)
import { LytexGatewayAdapter } from './server/services/payment-gateways.js';

async function testLytexAdapter() {
  console.log('===== TESTANDO LYTEX GATEWAY ADAPTER =====');
  
  try {
    // Criar instância do adaptador
    const gateway = new LytexGatewayAdapter();
    console.log('Gateway inicializado');
    
    // Testar registro de aluno
    const userData = {
      id: 123,
      fullName: 'Aluno Teste',
      email: 'aluno.teste@exemplo.com',
      cpf: '12345678909'
    };
    
    console.log(`\n==== Testando registro de aluno ====`);
    console.log(`Dados: ${JSON.stringify(userData)}`);
    
    const customerResult = await gateway.registerStudent(userData);
    console.log(`Registro concluído: ${JSON.stringify(customerResult)}`);
    
    // Testar criação de pagamento
    console.log(`\n==== Testando criação de pagamento ====`);
    const enrollment = {
      id: 456,
      code: 'TEST-' + Date.now(),
      studentId: userData.id,
      courseId: 789,
      amount: 99.90,
      paymentMethod: 'pix',
      course: {
        name: 'Curso de Teste',
        price: 99.90
      },
      student: {
        fullName: userData.fullName,
        email: userData.email,
        cpf: userData.cpf
      }
    };
    
    console.log(`Dados da matrícula: ${JSON.stringify(enrollment)}`);
    
    const paymentResult = await gateway.createPayment(enrollment);
    console.log(`Pagamento criado: ${JSON.stringify(paymentResult)}`);
    console.log(`URL de pagamento: ${paymentResult.paymentUrl}`);
    
    // Testar consulta de status
    if (paymentResult.externalId) {
      console.log(`\n==== Testando consulta de status ====`);
      console.log(`ID externo: ${paymentResult.externalId}`);
      
      const status = await gateway.getPaymentStatus(paymentResult.externalId);
      console.log(`Status do pagamento: ${status}`);
    }
    
    console.log('\n===== TESTE CONCLUÍDO COM SUCESSO =====');
  } catch (error) {
    console.error('ERRO NO TESTE:', error);
  }
}

testLytexAdapter().catch(console.error);
