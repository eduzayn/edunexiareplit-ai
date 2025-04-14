import 'dotenv/config';
import axios from 'axios';

/**
 * Testes da integração com a API Lytex - Versão 2
 */

// Credenciais
const LYTEX_CLIENT_ID = '67fc8788c6ee06c8728be4ce'; // ID fornecido pelo usuário
const LYTEX_CLIENT_SECRET = process.env.LYTEX_CLIENT_SECRET;
const BASE_URL = 'https://api-pay.lytex.com.br';

// Log das credenciais para depuração (ofuscadas)
console.log('LYTEX_CLIENT_ID:', LYTEX_CLIENT_ID ? 
  LYTEX_CLIENT_ID.substring(0, 4) + '...' + LYTEX_CLIENT_ID.substring(LYTEX_CLIENT_ID.length - 4) : 
  'não definido');
console.log('LYTEX_CLIENT_SECRET:', LYTEX_CLIENT_SECRET ? 
  '********' + LYTEX_CLIENT_SECRET.substring(LYTEX_CLIENT_SECRET.length - 4) : 
  'não definido');

// Dados de teste
const TEST_CPF = '12345678909'; // CPF fictício para teste
const TEST_STUDENT = {
  name: 'Aluno Teste',
  email: 'teste@example.com',
  cpfCnpj: TEST_CPF
};

/**
 * Testa autenticação na API Lytex (V2)
 */
async function testAuthV2() {
  console.log('\n==== Testando autenticação API V2 ====');
  try {
    // Tentativa 1: Formato padrão - auth/token
    try {
      const response = await axios.post(`${BASE_URL}/auth/token`, {
        grantType: 'client_credentials',
        clientId: LYTEX_CLIENT_ID,
        clientSecret: LYTEX_CLIENT_SECRET
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Status:', response.status);
      console.log('Token obtido com sucesso:', response.data.accessToken ? 'SIM' : 'NÃO');
      
      return response.data.accessToken;
    } catch (authError) {
      console.log('Tentativa 1 falhou. Erro:', authError.message);
      
      // Tentativa 2: Formato com oauth/token
      try {
        const response = await axios.post(`${BASE_URL}/oauth/token`, {
          grant_type: 'client_credentials',
          client_id: LYTEX_CLIENT_ID,
          client_secret: LYTEX_CLIENT_SECRET
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Status (tentativa 2):', response.status);
        console.log('Token obtido com sucesso:', response.data.access_token ? 'SIM' : 'NÃO');
        
        return response.data.access_token;
      } catch (authError2) {
        console.log('Tentativa 2 falhou. Erro:', authError2.message);
        
        // Tentativa 3: v2/oauth/token
        try {
          const response = await axios.post(`${BASE_URL}/v2/oauth/token`, {
            grant_type: 'client_credentials',
            client_id: LYTEX_CLIENT_ID,
            client_secret: LYTEX_CLIENT_SECRET
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Status (tentativa 3):', response.status);
          console.log('Token obtido com sucesso:', response.data.access_token ? 'SIM' : 'NÃO');
          
          return response.data.access_token;
        } catch (authError3) {
          console.log('Tentativa 3 falhou. Erro:', authError3.message);
          throw authError3;
        }
      }
    }
  } catch (error) {
    console.error('Erro ao autenticar na API V2:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

/**
 * Testa autenticação na API Lytex (V1)
 */
async function testAuthV1() {
  console.log('\n==== Testando endpoint alternativo ====');
  try {
    // Tentativa com o formato diretamente apontando para o token
    try {
      const response = await axios.post(`${BASE_URL}/token`, {
        grant_type: 'client_credentials',
        client_id: LYTEX_CLIENT_ID,
        client_secret: LYTEX_CLIENT_SECRET
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Status:', response.status);
      console.log('Token obtido com sucesso:', response.data.access_token ? 'SIM' : 'NÃO');
      
      return response.data.access_token;
    } catch (authError) {
      console.log('Tentativa falhou. Erro:', authError.message);
      
      // Tentativa com formato v1/oauth/token  
      try {
        const response = await axios.post(`${BASE_URL}/v1/oauth/token`, {
          grant_type: 'client_credentials',
          client_id: LYTEX_CLIENT_ID,
          client_secret: LYTEX_CLIENT_SECRET
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Status (tentativa v1):', response.status);
        console.log('Token obtido com sucesso:', response.data.access_token ? 'SIM' : 'NÃO');
        
        return response.data.access_token;
      } catch (authError2) {
        console.log('Tentativa v1 falhou. Erro:', authError2.message);
        throw authError2;
      }
    }
  } catch (error) {
    console.error('Erro ao autenticar em endpoints alternativos:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

/**
 * Busca cliente por CPF
 */
async function findClientByCPF(token, cpf) {
  console.log(`\n==== Buscando cliente com CPF: ${cpf} ====`);
  try {
    const response = await axios.get(`${BASE_URL}/v1/clients`, {
      params: { cpfCnpj: cpf },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Clientes encontrados:', response.data.results ? response.data.results.length : 0);
    
    if (response.data.results && response.data.results.length > 0) {
      console.log('Cliente encontrado:', response.data.results[0]._id);
      return response.data.results[0];
    }
    
    console.log('Cliente não encontrado');
    return null;
  } catch (error) {
    console.error('Erro ao buscar cliente:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

/**
 * Cria um novo cliente de teste
 */
async function createTestClient(token) {
  console.log('\n==== Criando cliente de teste ====');
  try {
    const clientData = {
      name: TEST_STUDENT.name,
      type: 'pf', // pessoa física
      treatmentPronoun: 'you',
      cpfCnpj: TEST_STUDENT.cpfCnpj,
      email: TEST_STUDENT.email
    };
    
    console.log('Dados do cliente:', JSON.stringify(clientData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/v1/clients`, clientData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Cliente criado com ID:', response.data._id);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cliente:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

/**
 * Cria uma fatura de teste
 */
async function createTestInvoice(token, clientId) {
  console.log('\n==== Criando fatura de teste ====');
  try {
    // Data de vencimento (5 dias a partir de hoje)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);
    const formattedDueDate = dueDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    const invoiceData = {
      client: { 
        _id: clientId
      },
      items: [{
        name: 'Matrícula - Teste de Integração',
        description: 'Teste de API Lytex',
        quantity: 1,
        value: 9900 // R$ 99,00 em centavos
      }],
      dueDate: formattedDueDate,
      paymentMethods: {
        pix: { enable: true },
        boleto: { enable: true, dueDateDays: 3 }
      },
      externalReference: `TEST-${Date.now()}`
    };
    
    console.log('Dados da fatura:', JSON.stringify(invoiceData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/v1/invoices`, invoiceData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Fatura criada com ID:', response.data._id);
    console.log('URL de pagamento:', response.data.linkCheckout || 'N/A');
    return response.data;
  } catch (error) {
    console.error('Erro ao criar fatura:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

/**
 * Consulta o status de uma fatura
 */
async function checkInvoiceStatus(token, invoiceId) {
  console.log(`\n==== Consultando status da fatura: ${invoiceId} ====`);
  try {
    const response = await axios.get(`${BASE_URL}/v1/invoices/${invoiceId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Status da fatura:', response.data.status);
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar status da fatura:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    return null;
  }
}

/**
 * Executa todos os testes em sequência
 */
async function runTests() {
  console.log('===== INICIANDO TESTES DA API LYTEX =====');
  console.log('Cliente ID:', LYTEX_CLIENT_ID ? LYTEX_CLIENT_ID.substring(0, 5) + '...' : 'NÃO CONFIGURADO');
  
  if (!LYTEX_CLIENT_ID || !LYTEX_CLIENT_SECRET) {
    console.log('ERRO: Credenciais não configuradas. Configure as variáveis LYTEX_CLIENT_ID e LYTEX_CLIENT_SECRET no arquivo .env');
    return;
  }
  
  // Testar ambos os métodos de autenticação
  const tokenV2 = await testAuthV2();
  const tokenV1 = await testAuthV1();
  
  // Usar o token que funcionou (preferência para V2)
  const token = tokenV2 || tokenV1;
  
  if (!token) {
    console.log('ERRO: Falha na autenticação. Não foi possível obter token de acesso.');
    return;
  }
  
  // Buscar cliente existente ou criar novo
  let client = await findClientByCPF(token, TEST_CPF);
  
  if (!client) {
    client = await createTestClient(token);
    if (!client) {
      console.log('ERRO: Falha ao criar cliente de teste.');
      return;
    }
  }
  
  // Criar fatura de teste
  const invoice = await createTestInvoice(token, client._id);
  
  if (invoice) {
    // Consultar status da fatura
    await checkInvoiceStatus(token, invoice._id);
    
    console.log('\n===== TESTE CONCLUÍDO COM SUCESSO =====');
    console.log('URL de pagamento para testes:', invoice.linkCheckout || `https://pay.lytex.com.br/checkout/${invoice._id}`);
  } else {
    console.log('\n===== FALHA NO TESTE =====');
  }
}

// Executar testes
runTests().catch(error => {
  console.error('Erro fatal nos testes:', error);
});