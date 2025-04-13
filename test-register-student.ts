import { createPaymentGateway } from './server/services/payment-gateways';

async function testRegisterStudent() {
  try {
    const userData = {
      id: 999,
      fullName: "Aluno Teste",
      email: "aluno.teste@example.com",
      cpf: "12345678900" // CPF fictício para teste
    };

    console.log("Registrando aluno no Asaas...");
    const asaasGateway = createPaymentGateway('asaas');
    const asaasResponse = await asaasGateway.registerStudent(userData);
    console.log(`Aluno ${asaasResponse.alreadyExists ? 'já existe' : 'registrado'} no Asaas com sucesso.`);
    console.log(`ID: ${asaasResponse.customerId}, Já existia: ${asaasResponse.alreadyExists}`);

    console.log("\nRegistrando aluno no Lytex...");
    const lytexGateway = createPaymentGateway('lytex');
    const lytexResponse = await lytexGateway.registerStudent(userData);
    console.log(`Aluno ${lytexResponse.alreadyExists ? 'já existe' : 'registrado'} no Lytex com sucesso.`);
    console.log(`ID: ${lytexResponse.customerId}, Já existia: ${lytexResponse.alreadyExists}`);
    
    // Agora vamos testar novamente com o mesmo usuário para verificar a detecção de duplicação
    console.log("\n===== TESTE DE DUPLICAÇÃO =====");
    console.log("\nTentando registrar o mesmo aluno novamente no Asaas...");
    const asaasResponse2 = await asaasGateway.registerStudent(userData);
    console.log(`Aluno ${asaasResponse2.alreadyExists ? 'já existe' : 'registrado'} no Asaas.`);
    console.log(`ID: ${asaasResponse2.customerId}, Já existia: ${asaasResponse2.alreadyExists}`);

    console.log("\nTentando registrar o mesmo aluno novamente no Lytex...");
    const lytexResponse2 = await lytexGateway.registerStudent(userData);
    console.log(`Aluno ${lytexResponse2.alreadyExists ? 'já existe' : 'registrado'} no Lytex.`);
    console.log(`ID: ${lytexResponse2.customerId}, Já existia: ${lytexResponse2.alreadyExists}`);
  } catch (error) {
    console.error("Erro ao registrar aluno:", error);
  }
}

testRegisterStudent();