import axios from 'axios';

export interface ReplicateImageGenerationOptions {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_outputs?: number;
  scheduler?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
}

export class ReplicateService {
  private readonly apiKey: string | null;
  private readonly baseUrl = 'https://api.replicate.com/v1/predictions';
  private readonly defaultModel = 'stability-ai/sdxl';
  private readonly defaultVersion = '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
  private readonly isAvailable: boolean;

  constructor() {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    this.apiKey = apiKey || null;
    this.isAvailable = !!apiKey;
    
    if (!apiKey) {
      console.warn('REPLICATE_API_TOKEN não está configurado. Serviço de geração de imagens não estará disponível.');
    }
  }
  
  // Método para verificar se o serviço está disponível
  public checkAvailability(): boolean {
    return this.isAvailable;
  }

  private getHeaders() {
    return {
      'Authorization': `Token ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Gera uma imagem usando o modelo SDXL do Replicate
   */
  async generateImage(options: ReplicateImageGenerationOptions): Promise<string[]> {
    // Verificar se o serviço está disponível
    if (!this.isAvailable) {
      throw new Error('Serviço Replicate não está disponível. Token de API não configurado.');
    }
    
    try {
      // Cria a predição
      const createResponse = await axios.post(
        this.baseUrl,
        {
          version: this.defaultVersion,
          input: {
            prompt: options.prompt,
            negative_prompt: options.negative_prompt || '',
            width: options.width || 1024,
            height: options.height || 1024,
            num_outputs: options.num_outputs || 1,
            scheduler: options.scheduler || 'K_EULER',
            num_inference_steps: options.num_inference_steps || 50,
            guidance_scale: options.guidance_scale || 7.5
          }
        },
        { headers: this.getHeaders() }
      );

      const predictionId = createResponse.data.id;
      
      // Espera a predição ser concluída
      let status = createResponse.data.status;
      let result = null;
      
      while (status !== 'succeeded' && status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const statusResponse = await axios.get(
          `${this.baseUrl}/${predictionId}`,
          { headers: this.getHeaders() }
        );
        
        status = statusResponse.data.status;
        if (status === 'succeeded') {
          result = statusResponse.data.output;
        }
      }
      
      if (status === 'failed') {
        throw new Error('Falha ao gerar imagem no Replicate');
      }
      
      return result;
    } catch (error: any) {
      console.error('Erro ao gerar imagem:', error.response?.data || error.message);
      throw new Error('Falha ao gerar imagem: ' + (error.response?.data?.detail || error.message));
    }
  }
}

export const replicateService = new ReplicateService();