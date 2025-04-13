// Script para testar o único endpoint v2 encontrado: /v2/invoices
import axios from 'axios';

// Configurações do Lytex
const LYTEX_API_KEY = process.env.LYTEX_API_KEY;
const LYTEX_CLIENT_ID = process.env.LYTEX_CLIENT_ID;
const LYTEX_API_URL = 'https://api-pay.lytex.com.br';
const LYTEX_AUTH_URL = 'https://api-pay.lytex.com.br/v2/auth/obtain_token';

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

// Testar o endpoint v2/invoices (que parece funcionar)
async function testInvoicesEndpoint() {
  console.log('\n==== Testando o endpoint v2/invoices ====');
  
  try {
    if (!accessToken && !(await getAccessToken())) {
      console.error('Não foi possível obter o token de acesso.');
      return false;
    }
    
    // 1. Primeiro testar GET para listar faturas
    console.log('\nGET v2/invoices - Listar faturas:');
    
    const response = await axios.get(`${LYTEX_API_URL}/v2/invoices?client_id=${LYTEX_CLIENT_ID}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`Status da resposta: ${response.status}`);
    
    if (response.data && response.data.results) {
      // Mostrar apenas informações essenciais e não a resposta completa
      console.log(`Total de faturas encontradas: ${response.data.results.length}`);
      console.log('Estrutura de uma fatura (campos disponíveis):');
      
      if (response.data.results.length > 0) {
        const sampleInvoice = response.data.results[0];
        console.log(Object.keys(sampleInvoice).join(', '));
        
        // Mostrar detalhes da primeira fatura de forma resumida
        console.log('\nExemplo de fatura:');
        console.log(`ID: ${sampleInvoice._id}`);
        console.log(`Cliente: ${sampleInvoice.client?.name || 'N/A'}`);
        console.log(`Método de pagamento: ${sampleInvoice.paymentMethod || 'N/A'}`);
        console.log(`Status: ${sampleInvoice.status || 'N/A'}`);
        console.log(`Valor: ${sampleInvoice.value || 'N/A'}`);
        
        if (sampleInvoice.dueDate) {
          console.log(`Data de vencimento: ${sampleInvoice.dueDate}`);
        }
        
        if (sampleInvoice.payedAt) {
          console.log(`Data de pagamento: ${sampleInvoice.payedAt}`);
        }
      }
    } else {
      console.log('Dados da resposta:');
      console.log(JSON.stringify(response.data, null, 2));
    }
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const invoiceId = response.data.results[0]._id;
      
      // 2. Testar GET para obter detalhes de uma fatura específica
      console.log(`\nGET v2/invoices/${invoiceId} - Detalhes da fatura:`);
      
      const detailResponse = await axios.get(`${LYTEX_API_URL}/v2/invoices/${invoiceId}?client_id=${LYTEX_CLIENT_ID}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status da resposta: ${detailResponse.status}`);
      
      // Mostra apenas os campos principais de forma resumida
      if (detailResponse.data) {
        console.log('Estrutura da resposta (campos disponíveis):');
        console.log(Object.keys(detailResponse.data).join(', '));
        
        // Mostrar valores importantes
        const invoice = detailResponse.data;
        console.log('\nInformações importantes:');
        console.log(`ID: ${invoice._id || 'N/A'}`);
        console.log(`Cliente: ${invoice.client?.name || 'N/A'}`);
        console.log(`Método de pagamento: ${invoice.paymentMethod || 'N/A'}`);
        console.log(`Status: ${invoice.status || 'N/A'}`);
        console.log(`Valor: ${invoice.value || 'N/A'}`);
        console.log(`Moeda: ${invoice.currency || 'N/A'}`);
        
        if (invoice.dueDate) {
          console.log(`Data de vencimento: ${invoice.dueDate}`);
        }
        
        if (invoice.payedAt) {
          console.log(`Data de pagamento: ${invoice.payedAt}`);
        }
        
        // Métodos de pagamento disponíveis
        if (invoice.paymentMethods && Array.isArray(invoice.paymentMethods)) {
          console.log(`\nMétodos de pagamento disponíveis: ${invoice.paymentMethods.join(', ')}`);
        }
        
        // Links de pagamento
        if (invoice.publicAcessUrl) {
          console.log(`\nURL pública de acesso: ${invoice.publicAcessUrl}`);
        }
        
        // Informações de barcode/QRCode se disponíveis
        if (invoice.bankBarcode) {
          console.log(`\nCódigo de barras bancário: ${invoice.bankBarcode}`);
        }
        
        if (invoice.pixQrCodeImage) {
          console.log(`URL do QR Code PIX disponível: Sim`);
        }
      } else {
        console.log('Dados da resposta:');
        console.log(JSON.stringify(detailResponse.data, null, 2));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao testar o endpoint v2/invoices:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Resposta:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Erro:', error.message);
    }
    return false;
  }
}

// Função principal
async function runTest() {
  console.log('Iniciando teste específico do endpoint v2/invoices na API Lytex...');
  console.log('API URL:', LYTEX_API_URL);
  console.log('API Key configurada:', LYTEX_API_KEY ? 'Sim' : 'Não');
  console.log('Client ID configurado:', LYTEX_CLIENT_ID ? 'Sim' : 'Não');
  
  await testInvoicesEndpoint();
  
  console.log('\nTeste concluído!');
}

// Executar o teste
runTest().catch(error => {
  console.error('Erro inesperado durante o teste:', error);
});