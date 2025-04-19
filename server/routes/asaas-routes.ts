/**
 * Rotas para integração com o Asaas
 */
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { AsaasService } from '../services/asaas-service';

const router = Router();

/**
 * Busca cliente no Asaas pelo CPF/CNPJ
 */
router.get('/customers/search', async (req: Request, res: Response) => {
  try {
    console.log(`[API] Recebida requisição de busca de cliente pelo CPF no Asaas`);
    
    // Não verificamos autenticação para busca por CPF
    console.log(`[API] Busca por CPF não requer autenticação de usuário`);
    
    const { cpfCnpj } = req.query;
    
    if (!cpfCnpj || typeof cpfCnpj !== 'string') {
      console.log(`[API] CPF/CNPJ não fornecido na requisição`);
      return res.status(400).json({
        success: false,
        error: 'CPF/CNPJ é obrigatório'
      });
    }
    
    console.log(`[API] Buscando cliente pelo CPF/CNPJ: ${cpfCnpj}`);
    
    // Busca cliente no Asaas com melhorias de tratamento e logs
    try {
      const customer = await AsaasService.getCustomerByCpfCnpj(cpfCnpj);
      
      console.log(`[API] Resultado da busca por CPF:`, customer ? 'Cliente encontrado' : 'Cliente não encontrado');
      
      if (!customer) {
        return res.json({
          success: true,
          data: null,
          message: 'Cliente não encontrado no Asaas'
        });
      }
      
      console.log(`[API] Cliente encontrado com nome: ${customer.name}`);
      return res.json({
        success: true,
        data: customer,
        message: 'Cliente encontrado no Asaas'
      });
    } catch (asaasError) {
      console.error(`[API] Erro específico na busca do Asaas:`, asaasError);
      
      // Vamos tentar uma abordagem manual - buscando diretamente pela API do Asaas
      // sem passar pelo serviço, para verificar se há problema no serviço
      try {
        console.log(`[API] Tentando busca alternativa direta pela API`);
        const cleanCpf = cpfCnpj.replace(/\D/g, '');
        
        // Importamos axios diretamente
        const axios = require('axios');
        const ASAAS_API_URL = 'https://api.asaas.com/v3';
        const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
        
        console.log(`[API] Usando ASAAS_API_KEY: ${ASAAS_API_KEY?.substring(0, 10)}...`);
        
        const directResponse = await axios.get(`${ASAAS_API_URL}/customers/findByCpfCnpj/${cleanCpf}`, {
          headers: {
            'access-token': ASAAS_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[API] Resposta direta da API:`, directResponse.data);
        
        if (directResponse.data) {
          return res.json({
            success: true,
            data: directResponse.data,
            message: 'Cliente encontrado diretamente na API do Asaas'
          });
        }
      } catch (directError: any) {
        const errorStatus = directError.response?.status || 'sem status';
        const errorData = directError.response?.data || 'sem dados';
        
        console.error(`[API] Erro na busca direta (status ${errorStatus}):`, errorData);
        
        // Se for erro 404, significa que o cliente não foi encontrado
        if (directError.response?.status === 404) {
          return res.json({
            success: true,
            data: null,
            message: 'Cliente não encontrado no Asaas'
          });
        }
      }
      
      // Se chegamos aqui, ambas as abordagens falharam
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar cliente no Asaas',
        details: asaasError instanceof Error ? asaasError.message : 'Erro desconhecido'
      });
    }
  } catch (error) {
    console.error('[API] Erro geral ao buscar cliente no Asaas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar a requisição',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Rota de teste para verificar conexão com a API do Asaas
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    console.log(`[API] Iniciando teste de conexão com API do Asaas`);
    
    // Verificar autenticação
    if (!req.user) {
      console.log(`[API] Usuário não autenticado na requisição de teste`);
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado'
      });
    }
    
    console.log(`[API] Usuário autenticado para teste: ID ${req.user.id}, username ${req.user.username}`);
    
    // Testando API diretamente (GET para /customers)
    const axios = require('axios');
    const ASAAS_API_URL = 'https://api.asaas.com/v3';
    const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;
    
    console.log(`[API] Usando ASAAS_API_KEY: ${ASAAS_API_KEY?.substring(0, 10)}...`);
    
    const directResponse = await axios.get(`${ASAAS_API_URL}/customers`, {
      headers: {
        'access-token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 1 // Pegamos apenas 1 registro para não sobrecarregar os logs
      }
    });
    
    console.log(`[API] Teste de conexão bem-sucedido. Status: ${directResponse.status}`);
    
    return res.json({
      success: true,
      message: 'Conexão com API do Asaas estabelecida com sucesso',
      apiDetails: {
        url: ASAAS_API_URL,
        keyStartsWith: ASAAS_API_KEY?.substring(0, 10),
        endpointTested: '/customers',
        responseStatus: directResponse.status
      },
      data: directResponse.data
    });
  } catch (error: any) {
    console.error('[API] Erro no teste de conexão com API do Asaas:', error);
    
    // Informações detalhadas do erro para depuração
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      responseStatus: error.response?.status,
      responseData: error.response?.data
    };
    
    return res.status(500).json({
      success: false,
      error: 'Erro ao testar conexão com API do Asaas',
      details: errorInfo
    });
  }
});

export default router;