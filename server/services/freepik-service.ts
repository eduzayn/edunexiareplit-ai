import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FreepikImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  styleId?: string;
  ratio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
  samples?: number;
}

export interface FreepikUpscalerOptions {
  imageUrl: string;
  scale?: number;
}

export interface FreepikStockSearchOptions {
  query: string;
  limit?: number;
  page?: number;
  locale?: string;
  sort?: 'popular' | 'recent';
  filterVector?: boolean;
  filterPhoto?: boolean;
  filterPSD?: boolean;
  filterVideo?: boolean;
}

export interface GeneratedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  prompt: string;
}

export interface UpscaledImage {
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface StockResult {
  id: number;
  type: 'vector' | 'photo' | 'psd' | 'video';
  title: string;
  url: string;
  preview_url: string;
  width: number;
  height: number;
  is_premium: boolean;
}

export class FreepikService {
  private apiKey: string;
  private baseUrl: string = 'https://api.freepik.com/v1';

  constructor() {
    if (!process.env.FREEPIK_API_KEY) {
      throw new Error('FREEPIK_API_KEY environment variable is not set');
    }
    this.apiKey = process.env.FREEPIK_API_KEY;
    console.log(`[FreepikService] Inicializado com chave API: ${this.apiKey.substring(0, 8)}...`);
  }

  /**
   * Gera imagens usando a API Mystic do Freepik
   */
  async generateImages(options: FreepikImageGenerationOptions): Promise<GeneratedImage[]> {
    try {
      const requestData = {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt || '',
        style_id: options.styleId || 'general',
        ratio: options.ratio || '1:1',
        samples: options.samples || 1
      };

      console.log(`[FreepikService] Gerando imagens com prompt: "${options.prompt}"`);
      
      const response = await axios.post(
        `${this.baseUrl}/mystic/generate`,
        requestData,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );

      // Verificar se a resposta é válida
      if (!response.data) {
        throw new Error('Resposta vazia da API Freepik');
      }

      if (response.data.error) {
        throw new Error(`Freepik API error: ${response.data.error.message}`);
      }

      // Verificar se os dados existem
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.log('Resposta da API Freepik:', JSON.stringify(response.data, null, 2));
        return []; // Retornar array vazio se não houver dados
      }

      console.log(`[FreepikService] ${response.data.data.length} imagens geradas com sucesso`);

      return response.data.data.map((img: any) => ({
        id: img.id || '',
        url: img.url || '',
        width: img.width || 0,
        height: img.height || 0,
        prompt: options.prompt
      }));
    } catch (error) {
      console.error('Error generating images with Freepik:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Freepik API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Melhora a qualidade de uma imagem usando a API Upscaler do Freepik
   * @param options Opções de upscale ou URL da imagem diretamente
   */
  async upscaleImage(options: FreepikUpscalerOptions | string): Promise<UpscaledImage> {
    try {
      let imageUrl: string;
      let scale: number = 2;
      
      // Verifica se é uma string (URL) ou um objeto de opções
      if (typeof options === 'string') {
        imageUrl = options;
      } else {
        imageUrl = options.imageUrl;
        scale = options.scale || 2;
      }
      
      console.log(`[FreepikService] Iniciando upscale de imagem. Scale: ${scale}`);
      
      const response = await axios.post(
        `${this.baseUrl}/upscaler`,
        {
          image_url: imageUrl,
          scale: scale
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          }
        }
      );

      // Verificar se a resposta é válida
      if (!response.data) {
        throw new Error('Resposta vazia da API Freepik');
      }

      if (response.data.error) {
        throw new Error(`Freepik API error: ${response.data.error.message}`);
      }

      // Verificar se os dados existem
      if (!response.data.data) {
        console.log('Resposta da API Freepik:', JSON.stringify(response.data, null, 2));
        throw new Error('Dados de upscale não encontrados na resposta');
      }
      
      console.log(`[FreepikService] Upscale concluído com sucesso. Dimensões: ${response.data.data.width}x${response.data.data.height}`);

      return {
        id: response.data.data.id || '',
        url: response.data.data.url || '',
        width: response.data.data.width || 0,
        height: response.data.data.height || 0
      };
    } catch (error) {
      console.error('Error upscaling image with Freepik:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Freepik API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Busca conteúdo stock (imagens, vetores, vídeos) do Freepik
   */
  async searchStockContent(options: FreepikStockSearchOptions): Promise<StockResult[]> {
    try {
      // Montar os parâmetros da URL com a codificação adequada
      const params = new URLSearchParams();
      params.append('q', options.query);
      
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.page) params.append('page', options.page.toString());
      if (options.locale) params.append('locale', options.locale);
      if (options.sort) params.append('sort', options.sort);
      
      // Criar uma array de tipos de recursos para o filtro
      const resourceTypes: string[] = [];
      if (options.filterVector) resourceTypes.push('vector');
      if (options.filterPhoto) resourceTypes.push('photo');
      if (options.filterPSD) resourceTypes.push('psd');
      if (options.filterVideo) resourceTypes.push('video');
      
      // Construir a URL base
      let url = `${this.baseUrl}/resources/search?${params.toString()}`;
      
      // Adicionar filtros de tipo de conteúdo manualmente (não usando URLSearchParams para evitar problemas de codificação)
      resourceTypes.forEach(type => {
        url += `&filter[resource_type][]=${type}`;
      });

      console.log(`[FreepikService] URL de busca: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      // Verificar se a resposta é válida
      if (!response.data) {
        throw new Error('Resposta vazia da API Freepik');
      }

      if (response.data.error) {
        throw new Error(`Freepik API error: ${response.data.error.message}`);
      }

      // Verificar se os dados existem
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.log('Resposta da API Freepik:', JSON.stringify(response.data, null, 2));
        return []; // Retornar array vazio se não houver dados
      }

      // Mapear os resultados com verificações de segurança para cada campo
      return response.data.data.map((item: any) => ({
        id: item.id || 0,
        type: item.resource_type || 'photo',
        title: item.title || 'Untitled',
        url: item.url || '',
        preview_url: item.preview_url || '',
        width: item.width || 0,
        height: item.height || 0,
        is_premium: !!item.is_premium
      }));
    } catch (error) {
      console.error('Error searching Freepik stock content:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Freepik API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Salva uma imagem do Freepik para o sistema de arquivos
   */
  async saveImageToFile(imageUrl: string, outputDir: string = 'uploads/ebook-images'): Promise<string> {
    try {
      // Criar diretório se não existir
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Gerar nome de arquivo único
      const fileHash = crypto.createHash('md5').update(imageUrl).digest('hex');
      const fileExtension = '.jpg'; // Assumindo que todas as imagens são JPG
      const fileName = `freepik_${fileHash}${fileExtension}`;
      const filePath = path.join(outputDir, fileName);

      // Verificar se o arquivo já existe
      if (fs.existsSync(filePath)) {
        return filePath;
      }

      // Baixar imagem
      const response = await axios({
        url: imageUrl,
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
      console.error('Error saving Freepik image to file:', error);
      throw error;
    }
  }

  /**
   * Gera imagens didáticas para enriquecer o conteúdo de e-books
   * @param topic Tópico ou assunto do e-book
   * @param context Contexto adicional para melhorar a relevância das imagens
   * @param numberOfImages Número de imagens a serem geradas
   */
  async generateEducationalImages(topic: string, context: string, numberOfImages: number = 3): Promise<GeneratedImage[]> {
    const enhancedPrompt = `Educational illustration about ${topic}. ${context}. High quality, instructional, clear, educational style.`;
    
    return this.generateImages({
      prompt: enhancedPrompt,
      negativePrompt: "low quality, blurry, distorted, text, watermarks",
      styleId: "general",
      ratio: "16:9", // Bom para conteúdo educacional
      samples: numberOfImages
    });
  }

  /**
   * Encontra imagens stock relevantes para conteúdo educacional
   */
  async findEducationalStockImages(topic: string, limit: number = 5): Promise<StockResult[]> {
    const searchQuery = `educational ${topic}`;
    
    return this.searchStockContent({
      query: searchQuery,
      limit: limit,
      filterVector: true,
      filterPhoto: true,
      sort: 'popular'
    });
  }

  /**
   * Busca imagens no Freepik (método de compatibilidade)
   * @param query Query de busca
   * @param page Número da página
   * @param limit Limite de resultados
   */
  async searchImages(query: string, page: number = 1, limit: number = 10): Promise<any> {
    return this.searchStockContent({
      query,
      page,
      limit,
      filterVector: true,
      filterPhoto: true
    });
  }

  /**
   * Gera uma imagem com o Freepik Mystic (método de compatibilidade)
   * @param prompt Descrição da imagem a ser gerada
   * @param style Estilo opcional da imagem
   */
  async generateImage(prompt: string, style?: string): Promise<any> {
    const images = await this.generateImages({
      prompt,
      styleId: style || 'general',
      samples: 1
    });

    if (images && images.length > 0) {
      // Formatar resposta para compatibilidade com código existente
      return {
        data: {
          imageUrl: images[0].url,
          width: images[0].width,
          height: images[0].height
        }
      };
    }
    
    throw new Error('Falha ao gerar imagem com Freepik Mystic');
  }
}

export default new FreepikService();