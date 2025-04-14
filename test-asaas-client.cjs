// Script para testar a integração com Asaas - Clientes
require('dotenv').config();
const axios = require('axios');

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';

if (!ASAAS_API_KEY) {
  console.error('Erro: ASAAS_API_KEY não está definida no ambiente');
  process.exit(1);
}

// Cliente para API do Asaas
const asaasClient = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY
  }
});

// Adicionando interceptor para verificar as requisições
asaasClient.interceptors.request.use(
  config => {
    console.log('Cabeçalhos sendo enviados:', JSON.stringify(config.headers));
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Log de verificação da configuração do cliente
console.log('Configuração do cliente Asaas:');
console.log('- URL base:', ASAAS_API_URL);
console.log('- Token de acesso:', ASAAS_API_KEY ? `${ASAAS_API_KEY.substring(0, 10)}...` : 'Não definido');

// Função para gerar um CPF fake aleatório (apenas para testes)
function generateRandomCPF() {
  const randomDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  return `${randomDigits}00`; // Simplificado para testes, não é um CPF válido
}

// Função para criar um cliente no Asaas
async function createCustomer() {
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

// Função para atualizar um cliente no Asaas
async function updateCustomer(customerId) {
  try {
    const updateData = {
      name: `Cliente Atualizado ${new Date().toISOString()}`,
      address: 'Rua Atualizada',
      addressNumber: '456',
      mobilePhone: '11988887777'
    };

    console.log(`Atualizando cliente ${customerId} com os dados:`, updateData);
    
    const response = await asaasClient.post(`/customers/${customerId}`, updateData);
    console.log('Cliente atualizado com sucesso:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error.response?.data || error.message);
    throw error;
  }
}

// Função para buscar um cliente pelo ID
async function getCustomer(customerId) {
  try {
    const response = await asaasClient.get(`/customers/${customerId}`);
    console.log('Dados do cliente:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar cliente:', error.response?.data || error.message);
    throw error;
  }
}

// Função para buscar um cliente pelo CPF/CNPJ
async function getCustomerByCpfCnpj(cpfCnpj) {
  try {
    const response = await asaasClient.get('/customers', {
      params: { cpfCnpj }
    });
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('Cliente encontrado pelo CPF/CNPJ:', response.data.data[0]);
      return response.data.data[0];
    } else {
      console.log('Nenhum cliente encontrado com o CPF/CNPJ:', cpfCnpj);
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar cliente por CPF/CNPJ:', error.response?.data || error.message);
    throw error;
  }
}

// Função para excluir um cliente
async function deleteCustomer(customerId) {
  try {
    const response = await asaasClient.delete(`/customers/${customerId}`);
    console.log('Cliente excluído com sucesso:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir cliente:', error.response?.data || error.message);
    throw error;
  }
}

// Função principal para executar os testes
async function runTests() {
  try {
    console.log('===== INICIANDO TESTES DE INTEGRAÇÃO COM ASAAS - CLIENTES =====');
    
    // 1. Criar um cliente
    console.log('\n1. Criando cliente de teste...');
    const newCustomer = await createCustomer();
    
    // 2. Buscar o cliente pelo ID
    console.log('\n2. Buscando cliente pelo ID...');
    await getCustomer(newCustomer.id);
    
    // 3. Buscar o cliente pelo CPF/CNPJ
    console.log('\n3. Buscando cliente pelo CPF/CNPJ...');
    await getCustomerByCpfCnpj(newCustomer.cpfCnpj);
    
    // 4. Atualizar o cliente
    console.log('\n4. Atualizando cliente...');
    await updateCustomer(newCustomer.id);
    
    // 5. Buscar o cliente atualizado
    console.log('\n5. Buscando cliente atualizado...');
    await getCustomer(newCustomer.id);
    
    // 6. Excluir o cliente (descomente se precisar limpar o cliente de teste)
    console.log('\n6. Excluindo cliente de teste...');
    await deleteCustomer(newCustomer.id);
    
    console.log('\n===== TESTES CONCLUÍDOS COM SUCESSO =====');
  } catch (error) {
    console.error('Erro durante os testes:', error);
  }
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});