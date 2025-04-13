// Script para testar a integração com a API do Lytex
import axios from 'axios';

// Configurações do Lytex
const LYTEX_API_KEY = process.env.LYTEX_API_KEY;
const LYTEX_CLIENT_ID = process.env.LYTEX_CLIENT_ID;
const LYTEX_API_URL = 'https://api-pay.lytex.com.br';

// Autenticação na API da Lytex
let accessToken = null;
let refreshToken = null;

// Função para obter token da API Lytex
async function getAccessToken() {
  try {
    console.log('Obtendo token de acesso Lytex...');
    
    if (!LYTEX_API_KEY || !LYTEX_CLIENT_ID) {
      console.error('LYTEX_API_KEY ou LYTEX_CLIENT_ID não configurados');
      return false;
    }
    
    const response = await axios.post(`${LYTEX_API_URL}/v2/auth/token`, {
      client_id: LYTEX_CLIENT_ID,
      client_secret: LYTEX_API_KEY
    });
    
    if (response.data && response.data.access_token) {
      accessToken = response.data.access_token;
      refreshToken = response.data.refresh_token;
      
      console.log('Token de acesso obtido com sucesso!');
      console.log(`Expira em: ${response.data.expires_in} segundos`);
      return true;
    } else {
      console.error('Resposta da API não contém access_token');
      console.log('Resposta:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('Erro ao obter token de acesso:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Resposta:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Erro:', error.message);
    }
    return false;
  }
}

// Função para testar a consulta de clientes
async function testCustomerLookup() {
  console.log('==== Testando consulta de cliente no Lytex ====');
  
  try {
    if (!LYTEX_API_KEY || !LYTEX_CLIENT_ID) {
      console.error('LYTEX_API_KEY ou LYTEX_CLIENT_ID não está definida no ambiente');
      return false;
    }
    
    // Obter token de acesso primeiro
    if (!accessToken && !(await getAccessToken())) {
      console.error('Não foi possível obter o token de acesso.');
      return false;
    }
    
    console.log('Token de acesso configurado corretamente');
    
    // Parâmetros de teste (email fictício para exemplo)
    const params = new URLSearchParams();
    params.append('email', 'teste@example.com');
    params.append('client_id', LYTEX_CLIENT_ID);
    
    console.log(`Enviando consulta para ${LYTEX_API_URL}/v2/customers com client_id: ${LYTEX_CLIENT_ID}`);
    
    // Realizar a consulta
    const response = await axios.get(`${LYTEX_API_URL}/v2/customers?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('Resposta recebida:', response.status);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Erro ao consultar cliente no Lytex:');
    
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um status diferente de 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Resposta:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor');
    } else {
      // Erro na configuração da requisição
      console.error('Erro:', error.message);
    }
    
    return false;
  }
}

// Função para testar a criação de um cliente fictício
async function testCustomerCreation() {
  console.log('\n==== Testando criação de cliente no Lytex ====');
  
  try {
    if (!LYTEX_API_KEY || !LYTEX_CLIENT_ID) {
      console.error('LYTEX_API_KEY ou LYTEX_CLIENT_ID não está definida no ambiente');
      return false;
    }
    
    // Obter token de acesso primeiro
    if (!accessToken && !(await getAccessToken())) {
      console.error('Não foi possível obter o token de acesso.');
      return false;
    }
    
    // Dados do cliente de teste
    const customerData = {
      name: 'Cliente Teste',
      email: `teste_${Date.now()}@example.com`,
      document: '12345678909',
      external_id: `test_${Date.now()}`,
      client_id: LYTEX_CLIENT_ID
    };
    
    console.log(`Criando cliente de teste com client_id: ${LYTEX_CLIENT_ID}`);
    console.log('Dados:', customerData);
    
    // Tentar criar o cliente
    const response = await axios.post(`${LYTEX_API_URL}/v2/customers`, customerData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Resposta recebida:', response.status);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Erro ao criar cliente no Lytex:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Resposta:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Sem resposta do servidor');
    } else {
      console.error('Erro:', error.message);
    }
    
    return false;
  }
}

// Função para testar a consulta de um pagamento
// Nota: É necessário ter um ID de pagamento válido para testar
async function testPaymentStatus(paymentId = 'payment_test') {
  console.log('\n==== Testando consulta de pagamento no Lytex ====');
  
  if (!paymentId || paymentId === 'payment_test') {
    console.log('Nenhum ID de pagamento fornecido para teste real. Pulando este teste.');
    return true;
  }
  
  try {
    if (!LYTEX_API_KEY || !LYTEX_CLIENT_ID) {
      console.error('LYTEX_API_KEY ou LYTEX_CLIENT_ID não está definida no ambiente');
      return false;
    }
    
    // Construir URL com os parâmetros necessários
    let requestUrl = `${LYTEX_API_URL}/payments/${paymentId}?client_id=${LYTEX_CLIENT_ID}`;
    
    console.log(`Consultando pagamento: ${requestUrl}`);
    
    // Realizar a consulta
    const response = await axios.get(requestUrl, {
      headers: {
        'Authorization': `Bearer ${LYTEX_API_KEY}`
      }
    });
    
    console.log('Resposta recebida:', response.status);
    console.log('Dados:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Erro ao consultar pagamento no Lytex:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Resposta:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Sem resposta do servidor');
    } else {
      console.error('Erro:', error.message);
    }
    
    return false;
  }
}

// Executar todos os testes
async function runTests() {
  console.log('Iniciando testes de integração com Lytex...');
  console.log('API URL:', LYTEX_API_URL);
  console.log('API Key configurada:', LYTEX_API_KEY ? 'Sim' : 'Não');
  console.log('Client ID configurado:', LYTEX_CLIENT_ID ? 'Sim' : 'Não');
  
  let results = {
    customerLookup: false,
    customerCreation: false,
    paymentStatus: false
  };
  
  // Executar testes em sequência
  results.customerLookup = await testCustomerLookup();
  results.customerCreation = await testCustomerCreation();
  results.paymentStatus = await testPaymentStatus();
  
  // Resumo dos resultados
  console.log('\n==== Resumo dos Testes ====');
  console.log('Consulta de cliente:', results.customerLookup ? '✅ Sucesso' : '❌ Falha');
  console.log('Criação de cliente:', results.customerCreation ? '✅ Sucesso' : '❌ Falha');
  console.log('Consulta de pagamento:', results.paymentStatus ? '✅ Sucesso' : '❌ Falha');
  
  // Verificar todos os resultados
  const allSuccess = Object.values(results).every(result => result === true);
  
  if (allSuccess) {
    console.log('\n✅ Todos os testes foram concluídos com sucesso! A integração com Lytex está funcionando corretamente.');
  } else {
    console.log('\n❌ Alguns testes falharam. Verifique os erros acima e corrija a integração.');
  }
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro inesperado durante os testes:', error);
});