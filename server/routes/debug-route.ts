/**
 * Rota para depuração e diagnóstico
 */

import express from 'express';
import axios from 'axios';

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

export default router;