// Script para testar endpoints da API v1 com base na documentação encontrada
import axios from 'axios';

// Configurações do Lytex
const LYTEX_API_KEY = process.env.LYTEX_API_KEY;
const LYTEX_CLIENT_ID = process.env.LYTEX_CLIENT_ID;
const LYTEX_API_URL = 'https://api-pay.lytex.com.br';
const LYTEX_AUTH_URL = 'https://api-pay.lytex.com.br/v2/auth/obtain_token'; // Mesmo endpoint de auth para v2

// Variáveis globais para tokens
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

// Testar endpoints da API v1 com base na documentação
async function testV1Endpoints() {
  console.log('\n==== Testando endpoints da API v1 com base na documentação ====');
  
  try {
    if (!accessToken && !(await getAccessToken())) {
      console.error('Não foi possível obter o token de acesso.');
      return false;
    }
    
    // Vamos testar os endpoints mencionados na documentação v1
    const endpointsToTest = [
      // Auth/User endpoints
      { method: 'get', url: '/v1/users/me', desc: 'Dados do usuário' },
      
      // Clientes endpoints
      { method: 'get', url: '/v1/clients', desc: 'Listar clientes' },
      { method: 'get', url: '/v1/clients?limit=5', desc: 'Listar clientes com limite' },
      { method: 'post', url: '/v1/clients', desc: 'Criar cliente', data: {
        cpfCnpj: '12345678909',
        name: 'Cliente Teste',
        email: `teste_${Date.now()}@example.com`,
        cellphone: '11999998888',
        type: 'pf' // pf = pessoa física, pj = pessoa jurídica
      }},
      
      // Invoice/Cobrança endpoints
      { method: 'get', url: '/v1/invoices', desc: 'Listar faturas' },
      { method: 'post', url: '/v1/invoices', desc: 'Criar fatura', data: {
        cpfCnpj: '47023937153', // CPF real obtido da listagem de clientes
        dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], // 7 dias no futuro
        value: 1000, // R$ 10,00
        description: 'Teste fatura API v1', 
        // Removido o field items conforme mensagem de erro
        paymentMethods: {
          pix: { enable: true },
          boleto: { enable: true, dueDateDays: 3 },
          creditCard: { enable: true, maxParcels: 3, isRatesToPayer: false }
        }
      }},
      
      // Comparação com endpoints v2
      { method: 'get', url: '/v2/clients', desc: 'v2 - Listar clientes' },
      { method: 'get', url: '/v2/invoices', desc: 'v2 - Listar faturas' }
    ];
    
    console.log(`Testando ${endpointsToTest.length} endpoints...`);
    
    const results = [];
    
    for (const endpoint of endpointsToTest) {
      try {
        console.log(`\nTestando ${endpoint.method.toUpperCase()} ${endpoint.url} - ${endpoint.desc}`);
        
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000,
          validateStatus: status => true // Para não rejeitar nenhum status HTTP
        };
        
        let response;
        const fullUrl = `${LYTEX_API_URL}${endpoint.url}`;
        
        if (endpoint.method === 'get') {
          response = await axios.get(fullUrl, config);
        } else if (endpoint.method === 'post') {
          response = await axios.post(fullUrl, endpoint.data, config);
        }
        
        const result = {
          endpoint: endpoint.url,
          method: endpoint.method.toUpperCase(),
          status: response.status,
          success: response.status < 400,
          description: endpoint.desc
        };
        
        results.push(result);
        
        console.log(`Status da resposta: ${response.status}`);
        
        if (response.status < 400) {
          console.log('Resposta bem-sucedida ✅');
          if (response.data && typeof response.data === 'object') {
            // Mostrar apenas informações resumidas
            if (Array.isArray(response.data.results)) {
              console.log(`Número de resultados: ${response.data.results.length}`);
              if (response.data.results.length > 0) {
                console.log('Campos disponíveis no primeiro resultado:');
                console.log(Object.keys(response.data.results[0]).join(', '));
              }
            } else if (response.data._id) {
              // Para respostas de objetos individuais
              console.log(`ID: ${response.data._id}`);
              console.log('Campos disponíveis:');
              console.log(Object.keys(response.data).join(', '));
            } else {
              // Para outros tipos de respostas
              console.log('Estrutura da resposta:');
              console.log(Object.keys(response.data).join(', '));
            }
          } else {
            console.log(response.data);
          }
        } else {
          console.log('Resposta de erro ❌');
          
          // Mostrar apenas as partes mais importantes do erro
          if (response.data && response.data.message) {
            console.log(`Mensagem: ${response.data.message}`);
          }
          
          if (response.data && response.data.error && response.data.error.details) {
            console.log('Detalhes do erro:');
            response.data.error.details.forEach(detail => {
              console.log(`- ${detail.message}`);
            });
          } else if (typeof response.data === 'object') {
            console.log('Erro:', JSON.stringify(response.data).substring(0, 200));
          }
        }
      } catch (error) {
        console.error(`Erro ao testar ${endpoint.method.toUpperCase()} ${endpoint.url}:`);
        console.error(error.message);
        
        results.push({
          endpoint: endpoint.url,
          method: endpoint.method.toUpperCase(),
          status: 'ERROR',
          success: false,
          description: endpoint.desc,
          error: error.message
        });
      }
    }
    
    // Resumo dos resultados
    console.log('\n==== Resumo dos Testes ====');
    console.log('| Endpoint | Método | Status | Descrição |');
    console.log('|----------|--------|--------|-----------|');
    
    results.forEach(result => {
      console.log(`| ${result.endpoint} | ${result.method} | ${result.status} ${result.success ? '✅' : '❌'} | ${result.description} |`);
    });
    
    // Contagem
    const successCount = results.filter(r => r.success).length;
    console.log(`\nResultados: ${successCount} de ${results.length} endpoints funcionaram corretamente.`);
    
    return true;
  } catch (error) {
    console.error('Erro ao testar endpoints v1:');
    console.error(error);
    return false;
  }
}

// Função principal
async function runTest() {
  console.log('Iniciando teste dos endpoints da API v1 Lytex baseados na documentação...');
  console.log('API URL:', LYTEX_API_URL);
  console.log('API Key configurada:', LYTEX_API_KEY ? 'Sim' : 'Não');
  console.log('Client ID configurado:', LYTEX_CLIENT_ID ? 'Sim' : 'Não');
  
  await testV1Endpoints();
  
  console.log('\nTeste concluído!');
}

// Executar o teste
runTest().catch(error => {
  console.error('Erro inesperado durante o teste:', error);
});