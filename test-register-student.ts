import { createPaymentGateway } from './server/services/payment-gateways';

async function testRegisterStudent() {
  try {
    const userData = {
      id: 999,
      fullName: "Aluno Teste",
      email: "aluno.teste@example.com"
    };

    console.log("Registrando aluno no Asaas...");
    const asaasGateway = createPaymentGateway('asaas');
    const asaasCustomerId = await asaasGateway.registerStudent(userData);
    console.log(`Aluno registrado no Asaas com sucesso. ID: ${asaasCustomerId}`);

    console.log("\nRegistrando aluno no Lytex...");
    const lytexGateway = createPaymentGateway('lytex');
    const lytexCustomerId = await lytexGateway.registerStudent(userData);
    console.log(`Aluno registrado no Lytex com sucesso. ID: ${lytexCustomerId}`);
  } catch (error) {
    console.error("Erro ao registrar aluno:", error);
  }
}

testRegisterStudent();