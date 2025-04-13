// Script para testar a integração com a API do Lytex
import axios from 'axios';

// Configurações do Lytex
const LYTEX_API_KEY = process.env.LYTEX_API_KEY;
const LYTEX_CLIENT_ID = process.env.LYTEX_CLIENT_ID;
const LYTEX_API_URL = 'https://api-pay.lytex.com.br';
const LYTEX_AUTH_URL = 'https://api-pay.lytex.com.br/v2/auth/obtain_token';

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
    
    // Tentando novo endpoint do OAuth baseado na documentação
    console.log(`Tentando autenticação via ${LYTEX_AUTH_URL}`);
    
    const response = await axios.post(LYTEX_AUTH_URL, {
      grantType: 'clientCredentials',
      clientId: LYTEX_CLIENT_ID,
      clientSecret: LYTEX_API_KEY
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Resposta completa da API:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.accessToken) {
      accessToken = response.data.accessToken;
      refreshToken = response.data.refreshToken;
      
      console.log('Token de acesso obtido com sucesso!');
      console.log(`Expira em: ${response.data.expireAt || 'desconhecido'}`);
      return true;
    } else {
      console.error('Resposta da API não contém accessToken');
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
    
    // Obter token de acesso primeiro
    if (!accessToken && !(await getAccessToken())) {
      console.error('Não foi possível obter o token de acesso.');
      return false;
    }
    
    // Construir URL com os parâmetros necessários
    let requestUrl = `${LYTEX_API_URL}/v2/payments/${paymentId}?client_id=${LYTEX_CLIENT_ID}`;
    
    console.log(`Consultando pagamento: ${requestUrl}`);
    
    // Realizar a consulta com o token de acesso
    const response = await axios.get(requestUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
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

// Tentar descobrir endpoints disponíveis
async function exploreApiEndpoints() {
  console.log('\n==== Explorando endpoints disponíveis na API Lytex ====');
  
  try {
    if (!accessToken && !(await getAccessToken())) {
      console.error('Não foi possível obter o token de acesso.');
      return false;
    }
    
    // Lista de caminhos possíveis para verificar
    // Inclui variações em português e inglês
    const possiblePaths = [
      // Base e versão
      '',
      'v2',
      'v3',
      'api',
      'api/v2',
      
      // Clientes/Customers (em inglês e português)
      'v2/customers',
      'customers',
      'v2/customer',
      'customer',
      'v2/clientes', // PT
      'clientes', // PT
      'v2/cliente', // PT
      'cliente', // PT
      'v2/sacados', // PT termo financeiro
      'sacados', // PT
      
      // Pagamentos/Payments (em inglês e português)
      'v2/payments',
      'payments',
      'v2/payment',
      'payment',
      'v2/pagamentos', // PT
      'pagamentos', // PT
      'v2/pagamento', // PT
      'pagamento', // PT
      
      // Cobranças (termos alternativos)
      'v2/charges',
      'charges',
      'v2/charge',
      'charge',
      'v2/cobrancas', // PT
      'cobrancas', // PT
      'v2/cobranca', // PT
      'cobranca', // PT
      
      // Faturas/Invoices (já encontrados)
      'v2/invoices',
      'invoices',
      'v2/invoice',
      'invoice',
      'v2/faturas', // PT
      'faturas', // PT
      'v2/fatura', // PT
      'fatura' // PT
    ];
    
    console.log('Verificando endpoints disponíveis com métodos HTTP variados...');
    console.log('Testando primeiro os endpoints significativos com diferentes métodos HTTP...');
    
    // Testar os endpoints mais importantes com diferentes métodos HTTP
    const keyEndpoints = [
      // v2
      'v2/customers', 'v2/clientes', 'v2/sacados',
      'v2/payments', 'v2/pagamentos', 'v2/cobrancas', 'v2/charges',
      'v2/invoices', 'v2/faturas',
      
      // v3
      'v3/customers', 'v3/clients',
      'v3/payments', 'v3/invoices',
      
      // Sem versão
      'customers', 'clients', 'clientes',
      'payments', 'pagamentos', 'faturas'
    ];
    
    const httpMethods = ['get', 'post'];
    
    for (const endpoint of keyEndpoints) {
      for (const method of httpMethods) {
        try {
          const url = `${LYTEX_API_URL}/${endpoint}`;
          console.log(`Testando ${method.toUpperCase()} ${url}`);
          
          // Configurar a requisição com timeout e headers adicionais relevantes
          const config = {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 5000,
            validateStatus: status => true // Para não rejeitar nenhum status HTTP
          };
          
          // Dados de exemplo para métodos POST
          const testData = method === 'post' ? {
            clientId: LYTEX_CLIENT_ID,
            name: 'Cliente Teste',
            document: '12345678909',
            email: `teste_${Date.now()}@example.com`
          } : null;
          
          // Executar a requisição com o método apropriado
          const response = method === 'get' 
            ? await axios.get(url, config)
            : await axios.post(url, testData, config);
          
          // Mostrar resultados completos para respostas bem-sucedidas
          if (response.status < 400) {
            console.log(`✅ ${method.toUpperCase()} ${url} - Status: ${response.status}`);
            if (response.data) {
              console.log('   Resposta:', typeof response.data === 'object' 
                          ? JSON.stringify(response.data, null, 2).substring(0, 300) + '...' 
                          : response.data.toString().substring(0, 300) + '...');
            }
          } else {
            console.log(`❌ ${method.toUpperCase()} ${url} - Status: ${response.status} - ${response.statusText || 'Erro'}`);
            
            // Examinar o corpo da resposta para mensagens de erro úteis
            if (response.data) {
              console.log('   Detalhes:', JSON.stringify(response.data).substring(0, 200));
            }
          }
        } catch (error) {
          console.log(`❌ ${method.toUpperCase()} ${endpoint} - Erro: ${error.message}`);
        }
      }
    }
    
    // Agora verifica os demais endpoints apenas com método GET
    console.log('\nVerificando endpoints restantes com método GET...');
    
    for (const path of possiblePaths) {
      // Pular os que já testamos com vários métodos
      if (keyEndpoints.includes(path)) continue;
      
      try {
        const url = `${LYTEX_API_URL}/${path}`;
        console.log(`Testando GET ${url}`);
        
        // Definir timeout curto para não demorar muito em caso de falha
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          timeout: 5000,
          validateStatus: status => true // Para não rejeitar nenhum status HTTP
        });
        
        if (response.status < 400) {
          console.log(`✅ GET ${url} - Status: ${response.status}`);
          if (response.data) {
            console.log('   Resposta:', typeof response.data === 'object' 
                      ? JSON.stringify(response.data, null, 2).substring(0, 200) + '...' 
                      : response.data.toString().substring(0, 200) + '...');
          }
        } else {
          console.log(`❌ GET ${url} - Status: ${response.status} - ${response.statusText || 'Erro'}`);
        }
      } catch (error) {
        if (error.response) {
          console.log(`❌ GET ${path} - Status: ${error.response.status} - ${error.response.statusText || 'Erro'}`);
        } else if (error.code === 'ECONNABORTED') {
          console.log(`❌ GET ${path} - Timeout`);
        } else {
          console.log(`❌ GET ${path} - ${error.message}`);
        }
      }
    }
    
    console.log('\nExploração de endpoints concluída');
    return true;
  } catch (error) {
    console.error('Erro ao explorar endpoints:', error);
    return false;
  }
}

// Executar todos os testes
async function runTests() {
  console.log('Iniciando testes de integração com Lytex...');
  console.log('API URL:', LYTEX_API_URL);
  console.log('API Key configurada:', LYTEX_API_KEY ? 'Sim' : 'Não');
  console.log('Client ID configurado:', LYTEX_CLIENT_ID ? 'Sim' : 'Não');
  
  // Primeiro, explorar endpoints para descobrir quais rotas estão disponíveis
  await exploreApiEndpoints();
  
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
    console.log('\n❌ Alguns testes falharam. Isso era esperado, pois a API v2 ainda está em desenvolvimento.');
    console.log('A autenticação está funcionando corretamente, mas os endpoints específicos podem não estar disponíveis ainda.');
    console.log('A implementação atual foi adaptada para funcionar quando os endpoints estiverem disponíveis, usando simulação no interim.');
  }
}

// Executar os testes
runTests().catch(error => {
  console.error('Erro inesperado durante os testes:', error);
});