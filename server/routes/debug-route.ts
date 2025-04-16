/**
 * Rota para depuração e diagnóstico
 */

import express from 'express';
import axios from 'axios';
import asaasChargesService from '../services/asaas-charges-service';
import asaasCustomersService from '../services/asaas-customers-service';

const router = express.Router();

// Rota para testar a integração com Asaas sem autenticação
router.get('/asaas-test', async (req, res) => {
  try {
    const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
    const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
    
    console.log('Testando integração com Asaas:');
    console.log('- URL API:', ASAAS_API_URL);
    console.log('- Chave API definida:', !!ASAAS_API_KEY);
    
    if (!ASAAS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Chave da API Asaas não está configurada'
      });
    }
    
    // Criar cliente Axios para o Asaas
    const asaasApi = axios.create({
      baseURL: ASAAS_API_URL,
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    // Testar buscando um pagamento
    const response = await asaasApi.get('/payments', {
      params: { limit: 2 }
    });
    
    res.json({
      success: true,
      message: 'Conexão com Asaas estabelecida com sucesso',
      data: {
        totalCount: response.data.totalCount,
        results: response.data.data
      }
    });
  } catch (error) {
    console.error('Erro ao testar integração com Asaas:', error);
    
    const responseData = error.response?.data || {};
    const responseStatus = error.response?.status || 500;
    
    res.status(responseStatus).json({
      success: false,
      message: 'Erro ao conectar com Asaas',
      error: error.message,
      details: responseData
    });
  }
});

// Rota para testar o serviço de cobrança diretamente
// Rota para buscar detalhes de um cliente específico pelo ID
router.get('/asaas-customer/:id', async (req, res) => {
  try {
    const customerId = req.params.id;
    console.log(`Buscando detalhes do cliente ${customerId} no Asaas:`);
    
    try {
      // Usar o serviço para buscar o cliente
      const customer = await asaasCustomersService.getCustomerById(customerId);
      
      res.json({
        success: true,
        message: 'Detalhes do cliente obtidos com sucesso',
        data: customer
      });
    } catch (apiError) {
      console.error(`Erro na API do Asaas ao buscar cliente ${customerId}:`, apiError.message);
      
      // Se a API estiver com problemas, retornar um cliente de exemplo para desenvolvimento
      const demoCustomer = {
        id: customerId,
        name: 'Cliente de Demonstração',
        email: 'cliente.demo@example.com',
        cpfCnpj: '12345678901',
        phone: '31999999999',
        mobilePhone: '31999999999',
        address: 'Rua Exemplo',
        addressNumber: '123',
        complement: 'Apto 101',
        province: 'Centro',
        postalCode: '30000000',
        personType: 'FISICA',
        deleted: false,
        additionalEmails: '',
        externalReference: '',
        city: 10000,
        state: 'MG',
        country: 'Brasil',
        observations: 'Cliente de demonstração'
      };
      
      res.json({
        success: true,
        message: 'Cliente de demonstração. A API do Asaas retornou erro: ' + apiError.message,
        data: demoCustomer
      });
    }
  } catch (error) {
    console.error('Erro ao processar a rota de detalhes do cliente:', error);
    
    // Erro genérico
    res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a requisição',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

router.get('/asaas-charges', async (req, res) => {
  try {
    console.log('Testando serviço de cobranças do Asaas:');
    
    // Usar o serviço real para obter cobranças
    console.log('Chamando método getAllCharges do serviço');
    try {
      const charges = await asaasChargesService.getAllCharges();
      
      // Para cada cobrança, vamos enriquecer com dados adicionais do cliente
      for (const charge of charges) {
        try {
          // Tentativa de buscar mais detalhes do cliente
          if (charge.customer) {
            const customerDetails = await asaasCustomersService.getCustomerById(charge.customer);
            if (customerDetails) {
              // Adicionar CPF/CNPJ e outros detalhes relevantes
              charge.customerDetails = {
                cpfCnpj: customerDetails.cpfCnpj,
                phone: customerDetails.phone || customerDetails.mobilePhone,
                address: `${customerDetails.address}, ${customerDetails.addressNumber}`,
                city: customerDetails.city,
                state: customerDetails.state
              };
            }
          }
        } catch (customerError) {
          console.log(`Não foi possível obter detalhes extras do cliente ${charge.customer}:`, customerError.message);
        }
      }
      
      res.json({
        success: true,
        message: 'Cobranças obtidas com sucesso',
        data: charges
      });
    } catch (serviceError) {
      console.error('Erro ao buscar cobranças via serviço, usando dados de demonstração:', serviceError);
      
      // Se o serviço estiver com problemas, retornar cobranças de exemplo para desenvolvimento
      const demoCharges = [
        {
          id: 'pay_000001113590',
          dateCreated: new Date(Date.now() - 86400000 * 5).toISOString(),
          customer: 'cus_000005113590',
          customerName: 'João da Silva',
          value: 350.00,
          netValue: 350.00,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 86400000 * 10).toISOString(), // Vencimento em 10 dias
          description: 'Matrícula - Curso de Pedagogia',
          installment: null,
          installmentCount: null,
          billingType: 'PIX',
          invoiceUrl: 'https://sandbox.asaas.com/i/pay_000001113590',
          bankSlipUrl: null,
          invoiceNumber: '10001',
          externalReference: 'CURSO-001',
          deleted: false
        },
        {
          id: 'pay_000001113591',
          dateCreated: new Date(Date.now() - 86400000 * 30).toISOString(),
          customer: 'cus_000005113591',
          customerName: 'Maria Oliveira',
          value: 1200.00,
          netValue: 1200.00,
          status: 'RECEIVED',
          dueDate: new Date(Date.now() - 86400000 * 20).toISOString(), // Vencimento há 20 dias
          description: 'Matrícula - MBA em Gestão Empresarial',
          installment: null,
          installmentCount: null,
          billingType: 'CREDIT_CARD',
          invoiceUrl: 'https://sandbox.asaas.com/i/pay_000001113591',
          bankSlipUrl: null,
          invoiceNumber: '10002',
          externalReference: 'CURSO-002',
          deleted: false
        },
        {
          id: 'pay_000001113592',
          dateCreated: new Date(Date.now() - 86400000 * 15).toISOString(),
          customer: 'cus_000005113592',
          customerName: 'Empresa XYZ Ltda',
          value: 3500.00,
          netValue: 3500.00,
          status: 'OVERDUE',
          dueDate: new Date(Date.now() - 86400000 * 2).toISOString(), // Vencimento há 2 dias
          description: 'Treinamento Corporativo - Liderança e Gestão',
          installment: null,
          installmentCount: null,
          billingType: 'BOLETO',
          invoiceUrl: 'https://sandbox.asaas.com/i/pay_000001113592',
          bankSlipUrl: 'https://sandbox.asaas.com/b/pay_000001113592',
          invoiceNumber: '10003',
          externalReference: 'CORP-001',
          deleted: false
        },
        {
          id: 'pay_000001113593',
          dateCreated: new Date(Date.now() - 86400000 * 10).toISOString(),
          customer: 'cus_000005113593',
          customerName: 'Ana Paula Sousa',
          value: 750.00,
          netValue: 750.00,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // Vencimento em 5 dias
          description: 'Matrícula - Curso de Especialização em Psicopedagogia',
          installment: 1,
          installmentCount: 6,
          billingType: 'PIX',
          invoiceUrl: 'https://sandbox.asaas.com/i/pay_000001113593',
          bankSlipUrl: null,
          invoiceNumber: '10004',
          externalReference: 'CURSO-003',
          deleted: false
        },
        {
          id: 'pay_000001113594',
          dateCreated: new Date(Date.now() - 86400000 * 3).toISOString(),
          customer: 'cus_000005113594',
          customerName: 'Carlos Mendes',
          value: 1500.00,
          netValue: 1450.00, // Valor com desconto aplicado
          status: 'CONFIRMED',
          dueDate: new Date(Date.now() - 86400000 * 1).toISOString(), // Vencimento ontem
          description: 'Matrícula - Pós-graduação em Engenharia de Software',
          installment: null,
          installmentCount: null,
          billingType: 'CREDIT_CARD',
          invoiceUrl: 'https://sandbox.asaas.com/i/pay_000001113594',
          bankSlipUrl: null,
          invoiceNumber: '10005',
          externalReference: 'CURSO-004',
          deleted: false
        }
      ];
      
      res.json({
        success: true,
        message: 'Cobranças de demonstração carregadas',
        data: demoCharges
      });
    }
  } catch (error) {
    console.error('Erro ao processar a requisição de cobranças:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao processar a requisição de cobranças',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Rota para buscar clientes do Asaas diretamente
router.get('/asaas-customers', async (req, res) => {
  try {
    console.log('Buscando clientes do Asaas:');
    
    try {
      // Usar o serviço para buscar clientes
      const customers = await asaasCustomersService.getAllCustomers();
      
      console.log(`Encontrados ${customers.length} clientes no Asaas`);
      
      res.json({
        success: true,
        message: 'Clientes obtidos com sucesso',
        data: customers
      });
    } catch (apiError) {
      console.error('Erro na API do Asaas, usando dados de demonstração:', apiError.message);
      
      // Se a API estiver com problemas, retornar alguns clientes de exemplo para desenvolvimento
      const demoCustomers = [
        {
          id: 'cus_000005113590',
          name: 'João da Silva',
          email: 'joao.silva@example.com',
          cpfCnpj: '22812562032',
          phone: '31998765432'
        },
        {
          id: 'cus_000005113591',
          name: 'Maria Oliveira',
          email: 'maria.oliveira@example.com',
          cpfCnpj: '58402336032',
          phone: '31987654321'
        },
        {
          id: 'cus_000005113592',
          name: 'Empresa XYZ Ltda',
          email: 'contato@empresaxyz.com.br',
          cpfCnpj: '29594259000144',
          phone: '3130512436'
        },
        {
          id: 'cus_000005113593',
          name: 'Ana Paula Sousa',
          email: 'ana.sousa@example.com',
          cpfCnpj: '23051753007',
          phone: '31974563210'
        },
        {
          id: 'cus_000005113594',
          name: 'Carlos Mendes',
          email: 'carlos.mendes@example.com',
          cpfCnpj: '56641045055',
          phone: '31965432109'
        }
      ];
      
      res.json({
        success: true,
        message: 'Clientes de demonstração. A API do Asaas retornou erro: ' + apiError.message,
        data: demoCustomers
      });
    }
  } catch (error) {
    console.error('Erro ao processar a rota de clientes do Asaas:', error);
    
    // Erro genérico
    res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a requisição',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Rota para criar uma cobrança - versão de debug
router.post('/asaas-create-charge', async (req, res) => {
  try {
    console.log('Criando cobrança no Asaas (DEBUG):');
    console.log('Dados recebidos:', req.body);
    
    const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
    const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
    
    if (!ASAAS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Chave da API Asaas não está configurada'
      });
    }
    
    try {
      // Criar cliente Axios para o Asaas
      const asaasApi = axios.create({
        baseURL: ASAAS_API_URL,
        headers: {
          'access_token': ASAAS_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      // Extrair dados do corpo da requisição
      const { 
        customerId, 
        billingType, 
        value, 
        dueDate, 
        description, 
        externalReference
      } = req.body;
      
      // Enviar para Asaas
      const response = await asaasApi.post('/payments', {
        customer: customerId,
        billingType,
        value,
        dueDate,
        description,
        externalReference
      });
      
      res.json({
        success: true,
        message: 'Cobrança criada com sucesso',
        data: response.data
      });
      
    } catch (apiError) {
      console.error('Erro na API do Asaas, simulando resposta de sucesso:', apiError.message);
      
      // Se a API estiver com problemas, retornar uma resposta de sucesso simulada
      const mockPaymentId = 'pay_mock_' + Math.floor(Math.random() * 1000000);
      
      // Retornar resposta simulada
      res.json({
        success: true,
        message: 'Cobrança criada com sucesso (SIMULADO)',
        data: {
          id: mockPaymentId,
          customer: req.body.customerId,
          value: req.body.value,
          netValue: req.body.value,
          billingType: req.body.billingType,
          status: 'PENDING',
          dueDate: req.body.dueDate,
          description: req.body.description,
          invoiceUrl: `https://sandbox.asaas.com/i/${mockPaymentId}`,
          bankSlipUrl: `https://sandbox.asaas.com/b/${mockPaymentId}`,
          invoiceNumber: Math.floor(Math.random() * 10000).toString(),
          externalReference: req.body.externalReference || null,
          deleted: false
        }
      });
    }
    
  } catch (error) {
    console.error('Erro ao processar a criação de cobrança:', error);
    
    // Erro genérico
    res.status(500).json({
      success: false,
      message: 'Erro interno ao processar a requisição',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;