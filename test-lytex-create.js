/**
 * !!! IMPORTANTE: NÃO EXCLUIR ESTE ARQUIVO !!!
 * 
 * Este script é essencial para testar a integração com a API do Lytex.
 * Ele contém testes de criação de clientes e faturas que são fundamentais 
 * para validar o funcionamento correto do gateway de pagamento.
 * 
 * Mantenha este arquivo para referência e testes futuros.
 */

// Script para testar a criação de clientes e faturas na API Lytex
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

// Função para criar um cliente (teste de diferentes formatos)
async function testClientCreation() {
  console.log('\n==== Testando criação de clientes ====');
  
  try {
    if (!accessToken && !(await getAccessToken())) {
      console.error('Não foi possível obter o token de acesso.');
      return false;
    }
    
    // Formatos a serem testados para criação de cliente
    const testFormats = [
      {
        desc: "Formato baseado na documentação v1 com validação de CPF",
        data: {
          name: "Cliente Teste V1",
          type: "pf", // pf = pessoa física, pj = pessoa jurídica
          treatmentPronoun: "you", // Pronome de tratamento válido (you, mr, lady)
          cpfCnpj: "47023937153", // CPF válido obtido da listagem existente
          email: `teste_${Date.now()}@example.com`,
          cellphone: "11999998888"
        }
      },
      {
        desc: "Formato com tipo PJ e pronome corrigido",
        data: {
          name: "Empresa Teste V1",
          type: "pj", 
          treatmentPronoun: "you", // Pronome corrigido conforme mensagem de erro
          cpfCnpj: "07317422000156", // CNPJ da Lytex
          email: `empresa_${Date.now()}@example.com`,
          cellphone: "11988887777"
        }
      }
    ];
    
    // Testar cada formato
    for (const format of testFormats) {
      console.log(`\nTestando: ${format.desc}`);
      
      try {
        const response = await axios.post(`${LYTEX_API_URL}/v1/clients`, format.data, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Status da resposta: ${response.status} ✅`);
        if (response.data) {
          console.log('Cliente criado com sucesso:');
          console.log('ID:', response.data._id);
          console.log('Campos retornados:', Object.keys(response.data).join(', '));
          return response.data; // Retorna o cliente criado para uso nos testes de fatura
        }
      } catch (error) {
        console.log(`Status da resposta: ${error.response?.status || 'ERROR'} ❌`);
        
        if (error.response && error.response.data) {
          console.log('Erro ao criar cliente:');
          
          if (error.response.data.message) {
            console.log(`Mensagem: ${error.response.data.message}`);
          }
          
          if (error.response.data.error && error.response.data.error.details) {
            console.log('Detalhes do erro:');
            error.response.data.error.details.forEach(detail => {
              console.log(`- ${detail.message}`);
            });
          } else {
            console.log('Resposta completa:', JSON.stringify(error.response.data).substring(0, 500));
          }
        } else {
          console.log('Erro desconhecido:', error.message);
        }
      }
    }
    
    // Nenhum formato funcionou, vamos listar um cliente existente para usá-lo na criação de faturas
    console.log('\nBuscando um cliente existente para os testes de fatura...');
    
    const listResponse = await axios.get(`${LYTEX_API_URL}/v1/clients?limit=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (listResponse.data && listResponse.data.results && listResponse.data.results.length > 0) {
      console.log('Cliente existente encontrado:');
      console.log('ID:', listResponse.data.results[0]._id);
      console.log('Nome:', listResponse.data.results[0].name);
      console.log('CPF/CNPJ:', listResponse.data.results[0].cpfCnpj);
      return listResponse.data.results[0];
    } else {
      console.error('Não foi possível listar clientes existentes');
      return null;
    }
  } catch (error) {
    console.error('Erro no teste de criação de clientes:', error.message);
    return null;
  }
}

// Função para criar uma fatura (teste de diferentes formatos)
async function testInvoiceCreation(client) {
  console.log('\n==== Testando criação de faturas ====');
  
  if (!client || !client._id) {
    console.error('Cliente não informado ou inválido para testes de fatura');
    return false;
  }
  
  try {
    if (!accessToken && !(await getAccessToken())) {
      console.error('Não foi possível obter o token de acesso.');
      return false;
    }
    
    // Formatos a serem testados para criação de fatura
    const testFormats = [
      {
        desc: "Formato com campos client e items (valor mínimo ajustado)",
        data: {
          client: {
            _id: client._id,
            name: client.name,
            type: client.type,
            cpfCnpj: client.cpfCnpj,
            email: client.email
          },
          dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], // 7 dias no futuro
          items: [
            {
              name: "Curso de MBA",
              quantity: 1,
              value: 50000 // R$ 500,00 - valor mínimo para pagamento com cartão
            }
          ],
          paymentMethods: {
            pix: { enable: true },
            boleto: { enable: true, dueDateDays: 3 },
            creditCard: { enable: true, maxParcels: 3, isRatesToPayer: false }
          }
        }
      },
      {
        desc: "Formato com client completo",
        data: {
          client: client, // Objeto client completo
          dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], // 7 dias no futuro
          items: [
            {
              name: "Curso de Pós-Graduação",
              quantity: 1,
              value: 50000 // R$ 500,00
            }
          ],
          paymentMethods: {
            pix: { enable: true },
            boleto: { enable: true, dueDateDays: 3 },
            creditCard: { enable: true, maxParcels: 3, isRatesToPayer: false }
          }
        }
      },
      {
        desc: "Formato v1 documentado",
        data: {
          client: { 
            _id: client._id 
          },
          items: [
            {
              name: "Curso de Segunda Graduação",
              quantity: 1,
              value: 50000 // R$ 500,00
            }
          ],
          dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], // 7 dias no futuro
          paymentMethods: {
            pix: { enable: true },
            boleto: { enable: true }
          }
        }
      }
    ];
    
    // Testar cada formato
    for (const format of testFormats) {
      console.log(`\nTestando: ${format.desc}`);
      
      try {
        const response = await axios.post(`${LYTEX_API_URL}/v1/invoices`, format.data, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`Status da resposta: ${response.status} ✅`);
        if (response.data) {
          console.log('Fatura criada com sucesso:');
          console.log('ID:', response.data._id);
          console.log('Valor:', response.data.totalValue);
          if (response.data.linkCheckout) {
            console.log('Link de checkout:', response.data.linkCheckout);
          }
          if (response.data.linkBoleto) {
            console.log('Link de boleto:', response.data.linkBoleto);
          }
          return true;
        }
      } catch (error) {
        console.log(`Status da resposta: ${error.response?.status || 'ERROR'} ❌`);
        
        if (error.response && error.response.data) {
          console.log('Erro ao criar fatura:');
          
          if (error.response.data.message) {
            console.log(`Mensagem: ${error.response.data.message}`);
          }
          
          if (error.response.data.error && error.response.data.error.details) {
            console.log('Detalhes do erro:');
            error.response.data.error.details.forEach(detail => {
              console.log(`- ${detail.message}`);
            });
          } else {
            console.log('Resposta completa:', JSON.stringify(error.response.data).substring(0, 500));
          }
        } else {
          console.log('Erro desconhecido:', error.message);
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erro no teste de criação de faturas:', error.message);
    return false;
  }
}

// Função principal
async function runTest() {
  console.log('Iniciando teste de criação na API Lytex...');
  
  try {
    // Primeiro testar a criação de cliente
    const client = await testClientCreation();
    
    // Se tivermos um cliente, testar a criação de fatura
    if (client) {
      await testInvoiceCreation(client);
    }
    
    console.log('\nTeste concluído!');
  } catch (error) {
    console.error('Erro geral durante os testes:', error);
  }
}

// Executar o teste
runTest().catch(error => {
  console.error('Erro inesperado durante o teste:', error);
});