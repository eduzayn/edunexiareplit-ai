/**
 * Rotas para gerenciar as configurações específicas das instituições
 */
import { Router } from 'express';
import { z } from 'zod';
import { institutionSettingsService } from '../services/institution-settings-service';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middlewares/permission-middleware';

const router = Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Schema para validação do corpo da requisição ao criar/atualizar configuração
const settingSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.string(),
  encrypted: z.boolean().default(false),
});

/**
 * Obter todas as configurações de uma instituição
 * GET /api/institution-settings
 */
router.get('/', requirePermission('configuracao', 'ler'), async (req: any, res) => {
  try {
    const user = req.user;
    
    // Obter institutionId do usuário ou usar 1 como valor padrão
    // TODO: Implementar um mecanismo mais robusto para determinar a instituição
    const institutionId = user?.institutionId || 1;
    
    // Por padrão não retornamos os valores criptografados
    const includeEncrypted = req.query.includeEncrypted === 'true';
    
    const settings = await institutionSettingsService.listSettings(
      institutionId, 
      includeEncrypted
    );
    
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar configurações da instituição' 
    });
  }
});

/**
 * Obter uma configuração específica
 * GET /api/institution-settings/:key
 */
router.get('/:key', requirePermission('configuracao', 'ler'), async (req: any, res) => {
  try {
    const user = req.user;
    const { key } = req.params;
    
    // Obter institutionId do usuário ou usar 1 como valor padrão
    // TODO: Implementar um mecanismo mais robusto para determinar a instituição
    const institutionId = user?.institutionId || 1;
    
    const value = await institutionSettingsService.getSetting(institutionId, key);
    
    if (value === null) {
      return res.status(404).json({ 
        success: false, 
        message: `Configuração '${key}' não encontrada` 
      });
    }
    
    return res.json({ success: true, data: { key, value } });
  } catch (error) {
    console.error(`Erro ao buscar configuração:`, error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar configuração da instituição' 
    });
  }
});

/**
 * Criar ou atualizar uma configuração
 * POST /api/institution-settings
 */
router.post('/', requirePermission('configuracao', 'atualizar'), async (req: any, res) => {
  try {
    const user = req.user;
    
    // Obter institutionId do usuário ou usar 1 como valor padrão
    // TODO: Implementar um mecanismo mais robusto para determinar a instituição
    const institutionId = user?.institutionId || 1;
    
    // Validar o corpo da requisição
    const validationResult = settingSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados inválidos', 
        errors: validationResult.error.errors 
      });
    }
    
    const { key, value, encrypted } = validationResult.data;
    
    await institutionSettingsService.setSetting(
      institutionId, 
      key, 
      value, 
      encrypted
    );
    
    return res.json({ 
      success: true, 
      message: `Configuração '${key}' salva com sucesso` 
    });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao salvar configuração da instituição' 
    });
  }
});

/**
 * Excluir uma configuração
 * DELETE /api/institution-settings/:key
 */
router.delete('/:key', requirePermission('configuracao', 'deletar'), async (req: any, res) => {
  try {
    const user = req.user;
    const { key } = req.params;
    
    // Obter institutionId do usuário ou usar 1 como valor padrão
    // TODO: Implementar um mecanismo mais robusto para determinar a instituição
    const institutionId = user?.institutionId || 1;
    
    await institutionSettingsService.deleteSetting(institutionId, key);
    
    return res.json({ 
      success: true, 
      message: `Configuração '${key}' excluída com sucesso` 
    });
  } catch (error) {
    console.error('Erro ao excluir configuração:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir configuração da instituição' 
    });
  }
});

/**
 * Rotas específicas para integrações
 */

/**
 * Obter chave da API do Asaas
 * GET /api/institution-settings/integrations/asaas
 */
router.get('/integrations/asaas', requirePermission('configuracao', 'ler'), async (req: any, res) => {
  try {
    const user = req.user;
    
    // Obter institutionId do usuário ou usar 1 como valor padrão
    // TODO: Implementar um mecanismo mais robusto para determinar a instituição
    const institutionId = user?.institutionId || 1;
    
    const apiKey = await institutionSettingsService.getAsaasApiKey(institutionId);
    
    if (!apiKey) {
      return res.status(404).json({ 
        success: false, 
        message: 'Chave da API Asaas não configurada para esta instituição' 
      });
    }
    
    return res.json({ 
      success: true, 
      data: { configured: true }
    });
  } catch (error) {
    console.error('Erro ao buscar configuração do Asaas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar configuração do Asaas' 
    });
  }
});

/**
 * Configurar chave da API do Asaas
 * POST /api/institution-settings/integrations/asaas
 */
router.post('/integrations/asaas', requirePermission('configuracao', 'atualizar'), async (req: any, res) => {
  try {
    const user = req.user;
    
    // Obter institutionId do usuário ou usar 1 como valor padrão
    // TODO: Implementar um mecanismo mais robusto para determinar a instituição
    const institutionId = user?.institutionId || 1;
    
    const { apiKey } = req.body;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Chave da API Asaas não fornecida ou inválida' 
      });
    }
    
    await institutionSettingsService.setAsaasApiKey(institutionId, apiKey);
    
    return res.json({ 
      success: true, 
      message: 'Chave da API Asaas configurada com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao configurar chave do Asaas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erro ao configurar chave da API Asaas' 
    });
  }
});

export default router;