import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ReplicateVideoOptions {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_frames?: number;
  fps?: number;
  model?: string;
}

export interface VideoGenerationResult {
  id: string;
  url: string;
  status: string;
  prompt: string;
  width: number;
  height: number;
  duration: number;
}

export class ReplicateService {
  private apiToken?: string;
  private baseUrl: string = 'https://api.replicate.com/v1';
  private isAvailable: boolean = false;

  constructor() {
    if (!process.env.REPLICATE_API_TOKEN) {
      console.warn('REPLICATE_API_TOKEN environment variable is not set. Video generation service will be disabled.');
      this.isAvailable = false;
    } else {
      this.apiToken = process.env.REPLICATE_API_TOKEN;
      this.isAvailable = true;
    }
  }

  /**
   * Gera um vídeo curto usando o Replicate
   * @param options Opções para geração de vídeo
   */
  async generateVideo(options: ReplicateVideoOptions): Promise<VideoGenerationResult> {
    if (!this.isAvailable) {
      throw new Error('Replicate service is not available. Please configure REPLICATE_API_TOKEN environment variable.');
    }
    
    try {
      // Define modelo padrão para Zeroscope (geração de vídeo da Replicate)
      const modelVersion = options.model || 'anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e361be391d0f87af6eaa3375';

      // Configura parâmetros para a API
      const input = {
        prompt: options.prompt,
        negative_prompt: options.negative_prompt || "blurry, low quality, worst quality, low resolution, poor quality",
        width: options.width || 576,
        height: options.height || 320,
        num_frames: options.num_frames || 24,
        fps: options.fps || 8,
      };

      // Inicia a geração do vídeo
      const startResponse = await axios.post(
        `${this.baseUrl}/predictions`,
        {
          version: modelVersion,
          input: input
        },
        {
          headers: {
            'Authorization': `Token ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!startResponse.data || !startResponse.data.id) {
        throw new Error('Failed to start video generation');
      }

      const predictionId = startResponse.data.id;
      let status = 'starting';
      let result = null;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutos com polling a cada 5 segundos

      // Poll pela conclusão
      while (status !== 'succeeded' && status !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Aguarda 5 segundos entre as verificações
        
        const checkResponse = await axios.get(
          `${this.baseUrl}/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Token ${this.apiToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        status = checkResponse.data.status;
        if (status === 'succeeded') {
          result = checkResponse.data;
        }
        
        attempts++;
      }

      if (!result || status !== 'succeeded') {
        throw new Error(`Video generation ${status === 'failed' ? 'failed' : 'timed out'}`);
      }

      // Convertendo resultados da API para o formato esperado
      return {
        id: result.id,
        url: result.output, // O URL do vídeo
        status: 'completed',
        prompt: options.prompt,
        width: options.width || 576,
        height: options.height || 320,
        duration: (options.num_frames || 24) / (options.fps || 8)
      };
    } catch (error) {
      console.error('Error generating video with Replicate:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Replicate API error: ${error.response?.data?.detail || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Salva um vídeo do Replicate para o sistema de arquivos
   */
  async saveVideoToFile(videoUrl: string, outputDir: string = 'uploads/ebook-videos'): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Replicate service is not available. Please configure REPLICATE_API_TOKEN environment variable.');
    }
    try {
      // Criar diretório se não existir
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Gerar nome de arquivo único
      const fileHash = crypto.createHash('md5').update(videoUrl).digest('hex');
      const fileExtension = '.mp4'; // Vídeos do Replicate geralmente são MP4
      const fileName = `replicate_${fileHash}${fileExtension}`;
      const filePath = path.join(outputDir, fileName);

      // Verificar se o arquivo já existe
      if (fs.existsSync(filePath)) {
        return filePath;
      }

      // Baixar vídeo
      const response = await axios({
        url: videoUrl,
        method: 'GET',
        responseType: 'stream'
      });

      // Salvar no sistema de arquivos
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error saving Replicate video to file:', error);
      throw error;
    }
  }

  /**
   * Gera vídeos educacionais para complementar o conteúdo de e-books
   * @param topic Tópico ou assunto do e-book
   * @param context Contexto adicional para melhorar a relevância do vídeo
   */
  async generateEducationalVideo(topic: string, context: string): Promise<VideoGenerationResult> {
    const enhancedPrompt = `Educational animation about ${topic}. ${context}. High quality animation, clear visuals, educational style, no text.`;
    
    return this.generateVideo({
      prompt: enhancedPrompt,
      negative_prompt: "low quality, blurry, distorted, text, watermarks, poor quality",
      width: 576,
      height: 320,
      num_frames: 24,
      fps: 8
    });
  }
}

// Exportar uma classe em vez de uma instância para permitir inicialização controlada
const replicateService = new ReplicateService();
console.log(`[REPLICATE SERVICE] Status: ${replicateService.isAvailable ? 'Disponível' : 'Indisponível'}`);
export default replicateService;