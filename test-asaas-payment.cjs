require('dotenv').config();
const axios = require('axios');

// Configurações da API do Asaas
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

// Verificar se a chave API está definida
if (!ASAAS_API_KEY) {
  console.error('Erro: Chave de API do Asaas não definida.');
  process.exit(1);
}

// Configuração do cliente Axios para a API do Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});

// Exibir informações de configuração
console.log('Configuração do cliente Asaas:');
console.log('- URL base:', ASAAS_API_URL);
console.log('- Token de acesso:', ASAAS_API_KEY ? `${ASAAS_API_KEY.substring(0, 10)}...` : 'Não definido');

// Função para gerar um CPF válido aleatório (apenas para testes)
function generateRandomCPF() {
  // Gera 9 dígitos aleatórios
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }
  let remainder = sum % 11;
  const firstVerifier = remainder < 2 ? 0 : 11 - remainder;
  
  // Adiciona o primeiro dígito verificador
  digits.push(firstVerifier);
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i);
  }
  remainder = sum % 11;
  const secondVerifier = remainder < 2 ? 0 : 11 - remainder;
  
  // Adiciona o segundo dígito verificador
  digits.push(secondVerifier);
  
  // Retorna o CPF formatado
  return digits.join('');
}

// Função para criar um cliente no Asaas (necessário para os testes de cobrança)
async function createTestCustomer() {
  try {
    const customerData = {
      name: `Cliente Teste ${new Date().toISOString().slice(0, 10)}`,
      cpfCnpj: generateRandomCPF(),
      email: `teste-${Date.now()}@example.com`,
      mobilePhone: '11999998888',
      address: 'Rua Teste',
      addressNumber: '123',
      complement: 'Apto 101',
      province: 'Centro',
      postalCode: '01234000',
      externalReference: `client_test_${Date.now()}`
    };

    console.log('Criando cliente com os dados:', customerData);
    
    const response = await asaasClient.post('/customers', customerData);
    console.log('Cliente criado com sucesso:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cliente:', error.response?.data || error.message);
    throw error;
  }
}

// Função para criar uma cobrança no Asaas
async function createPayment(customerId) {
  try {
    // Data de vencimento: 5 dias a partir de hoje
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);
    const formattedDueDate = dueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    const paymentData = {
      customer: customerId,
      billingType: 'BOLETO', // Tipos: BOLETO, CREDIT_CARD, PIX, TRANSFER, DEPOSIT, UNDEFINED
      value: 150.75,
      dueDate: formattedDueDate,
      description: 'Fatura de teste para integração',
      externalReference: `invoice_test_${Date.now()}`
    };

    console.log('Criando cobrança com os dados:', paymentData);
    
    const response = await asaasClient.post('/payments', paymentData);
    console.log('Cobrança criada com sucesso:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cobrança:', error.response?.data || error.message);
    throw error;
  }
}

// Função para criar uma cobrança PIX
async function createPixPayment(customerId) {
  try {
    // Data de vencimento: 1 dia a partir de hoje
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const formattedDueDate = dueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    const paymentData = {
      customer: customerId,
      billingType: 'PIX',
      value: 99.90,
      dueDate: formattedDueDate,
      description: 'Fatura PIX de teste',
      externalReference: `invoice_pix_test_${Date.now()}`
    };

    console.log('Criando cobrança PIX com os dados:', paymentData);
    
    const response = await asaasClient.post('/payments', paymentData);
    console.log('Cobrança PIX criada com sucesso:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cobrança PIX:', error.response?.data || error.message);
    throw error;
  }
}

// Função para gerar QR Code PIX
async function generatePixQrCode(paymentId) {
  try {
    console.log(`Gerando QR Code PIX para o pagamento ${paymentId}...`);
    
    const response = await asaasClient.get(`/payments/${paymentId}/pixQrCode`);
    console.log('QR Code PIX gerado com sucesso:', {
      encodedImage: response.data.encodedImage ? 'Imagem codificada em base64 disponível' : 'Nenhuma imagem disponível',
      payload: response.data.payload || 'Nenhum payload disponível'
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error.response?.data || error.message);
    throw error;
  }
}

// Função para buscar uma cobrança pelo ID
async function getPayment(paymentId) {
  try {
    console.log(`Buscando cobrança com ID ${paymentId}...`);
    
    const response = await asaasClient.get(`/payments/${paymentId}`);
    console.log('Dados da cobrança:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar cobrança:', error.response?.data || error.message);
    throw error;
  }
}

// Função para cancelar uma cobrança
async function cancelPayment(paymentId) {
  try {
    console.log(`Cancelando cobrança com ID ${paymentId}...`);
    
    const response = await asaasClient.delete(`/payments/${paymentId}`);
    console.log('Cobrança cancelada:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao cancelar cobrança:', error.response?.data || error.message);
    throw error;
  }
}

// Função para buscar cobranças de um cliente
async function getCustomerPayments(customerId) {
  try {
    console.log(`Buscando cobranças do cliente ${customerId}...`);
    
    const response = await asaasClient.get('/payments', {
      params: { customer: customerId }
    });
    
    console.log(`Total de cobranças encontradas: ${response.data.data?.length || 0}`);
    
    return response.data.data || [];
  } catch (error) {
    console.error('Erro ao buscar cobranças do cliente:', error.response?.data || error.message);
    throw error;
  }
}

// Função principal para executar os testes
async function runTests() {
  try {
    console.log('===== INICIANDO TESTES DE INTEGRAÇÃO COM ASAAS - COBRANÇAS =====');
    
    // 1. Criar um cliente para os testes
    console.log('\n1. Criando cliente de teste...');
    const customer = await createTestCustomer();
    
    // 2. Criar uma cobrança de boleto
    console.log('\n2. Criando cobrança de boleto...');
    const payment = await createPayment(customer.id);
    
    // 3. Buscar detalhes da cobrança
    console.log('\n3. Buscando detalhes da cobrança...');
    await getPayment(payment.id);
    
    // 4. Criar uma cobrança PIX
    console.log('\n4. Criando cobrança PIX...');
    const pixPayment = await createPixPayment(customer.id);
    
    // 5. Gerar QR Code PIX para a cobrança
    console.log('\n5. Gerando QR Code PIX...');
    await generatePixQrCode(pixPayment.id);
    
    // 6. Listar todas as cobranças do cliente
    console.log('\n6. Listando cobranças do cliente...');
    await getCustomerPayments(customer.id);
    
    // 7. Cancelar as cobranças
    console.log('\n7. Cancelando cobranças...');
    await cancelPayment(payment.id);
    await cancelPayment(pixPayment.id);
    
    console.log('\n===== TESTES CONCLUÍDOS COM SUCESSO =====');
  } catch (error) {
    console.error('\nErro durante os testes:', error);
  }
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});