/**
 * Rota para depuração e diagnóstico
 */

import express from 'express';
import axios from 'axios';
import asaasChargesService from '../services/asaas-charges-service';

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
router.get('/asaas-charges', async (req, res) => {
  try {
    console.log('Testando serviço de cobranças do Asaas:');
    
    // Usar o serviço real para obter cobranças
    console.log('Chamando método getAllCharges do serviço');
    const charges = await asaasChargesService.getAllCharges();
    
    res.json({
      success: true,
      message: 'Cobranças obtidas com sucesso',
      data: charges
    });
  } catch (error) {
    console.error('Erro ao buscar cobranças via serviço:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar cobranças',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Rota para buscar clientes do Asaas diretamente
router.get('/asaas-customers', async (req, res) => {
  try {
    console.log('Buscando clientes do Asaas:');
    
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
      
      // Buscar clientes
      const response = await asaasApi.get('/customers', {
        params: { limit: 50 }
      });
      
      console.log(`Encontrados ${response.data.totalCount} clientes no Asaas`);
      
      res.json({
        success: true,
        message: 'Clientes obtidos com sucesso',
        data: response.data.data
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