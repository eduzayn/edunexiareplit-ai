/**
 * Rota de teste para a API Asaas
 */

import express from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = express.Router();

// Constantes da API Asaas
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
const ASAAS_API_KEY = process.env.ASAAS_ZAYN_KEY;

router.get('/test-asaas-connection', async (req, res) => {
  try {
    console.log('ASAAS_API_URL:', ASAAS_API_URL);
    console.log('ASAAS_API_KEY está definido:', !!ASAAS_API_KEY);
    
    // Criar uma instância do axios configurada para o Asaas
    const asaasApi = axios.create({
      baseURL: ASAAS_API_URL,
      headers: {
        'access_token': ASAAS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    // Tenta fazer uma requisição simples para a API
    const response = await asaasApi.get('/payments', { 
      params: { 
        limit: 1 
      } 
    });
    
    res.json({
      success: true,
      message: 'Conexão com Asaas estabelecida com sucesso',
      apiStatus: 'OK',
      data: {
        totalCount: response.data.totalCount,
        hasMorePages: response.data.hasMore,
        sampleData: response.data.data.length > 0 ? response.data.data[0] : null
      }
    });
  } catch (error: any) {
    console.error('Erro ao testar conexão com Asaas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao testar conexão com Asaas',
      error: error.message,
      response: error.response?.data || null
    });
  }
});

export default router;