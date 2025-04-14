// Usando TypeScript para executar o teste
import { createPaymentGateway } from './server/services/payment-gateways';
import { Enrollment } from './shared/schema';

async function testLytexAdapter() {
  console.log('===== TESTANDO LYTEX GATEWAY ADAPTER =====');
  
  try {
    // Criar instância do adaptador
    const gateway = createPaymentGateway('lytex');
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
      status: 'pending_payment',
      paymentMethod: 'pix',
      payment_gateway: 'lytex',
      course: {
        id: 789,
        name: 'Curso de Teste',
        price: 99.90,
        code: 'CURSO001',
        status: 'published',
        description: 'Descrição do curso de teste',
        workload: 40
      },
      student: {
        id: 123,
        fullName: userData.fullName,
        email: userData.email,
        cpf: userData.cpf
      }
    } as unknown as Enrollment;
    
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
