import { Request, Response, Router } from 'express';
import { replicateService, ReplicateImageGenerationOptions } from '../services/replicate';

export const aiServicesRouter = Router();

/**
 * Rota para gerar imagens usando o serviço Replicate
 * POST /api/ai/generate-image
 */
aiServicesRouter.post('/generate-image', async (req: Request, res: Response) => {
  try {
    // Verificar autenticação
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Verificar se o serviço Replicate está disponível
    if (!replicateService.checkAvailability()) {
      return res.status(503).json({ 
        success: false, 
        error: 'Serviço de geração de imagens não está disponível. Contate o administrador do sistema.'
      });
    }

    // Validar payload
    const { 
      prompt, 
      negative_prompt, 
      width, 
      height, 
      num_outputs, 
      scheduler, 
      num_inference_steps, 
      guidance_scale 
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'O prompt é obrigatório' });
    }

    // Configurar opções
    const options: ReplicateImageGenerationOptions = {
      prompt,
      negative_prompt,
      width: width || 1024,
      height: height || 1024,
      num_outputs: Math.min(num_outputs || 1, 4), // Limitar a 4 imagens no máximo
      scheduler,
      num_inference_steps,
      guidance_scale
    };

    // Gerar imagem
    const images = await replicateService.generateImage(options);
    
    // Retornar URLs das imagens geradas
    return res.json({ 
      success: true, 
      images,
      prompt
    });
  } catch (error: any) {
    console.error('Erro na geração de imagem:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar imagem'
    });
  }
});