import axios from 'axios';

/**
 * Serviço para integração com a API do Freepik
 */
export class FreepikService {
  private apiKey: string;
  private baseUrl: string = 'https://api.freepik.com';

  constructor() {
    this.apiKey = process.env.FREEPIK_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FREEPIK_API_KEY não está configurado!');
    }
  }

  /**
   * Realiza busca de imagens no Freepik
   * @param query Termo de busca
   * @param page Número da página (começando em 1)
   * @param limit Quantidade de resultados por página
   */
  async searchImages(query: string, page: number = 1, limit: number = 10): Promise<any> {
    if (!this.apiKey) {
      throw new Error('FREEPIK_API_KEY não está configurado');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/resources`, {
        headers: {
          'Accept-Language': 'pt-BR',
          'Accept': 'application/json',
          'X-Freepik-API-Key': this.apiKey
        },
        params: {
          term: query,
          page,
          locale: 'pt-br',
          limit,
          filters: {
            content_type: ['photo', 'vector']
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar imagens do Freepik:', error);
      throw error;
    }
  }

  /**
   * Gera uma imagem com AI usando o serviço Mystic do Freepik
   * @param prompt Descrição da imagem a ser gerada
   * @param style Estilo da imagem (opcional)
   */
  async generateImage(prompt: string, style?: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('FREEPIK_API_KEY não está configurado');
    }

    try {
      // Construir o payload para a API Mystic
      const payload: any = {
        prompt,
        n: 1, // Número de imagens a gerar
      };
      
      if (style) {
        payload.style = style;
      }

      const response = await axios.post(`${this.baseUrl}/v1/mystic/generations`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Freepik-API-Key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao gerar imagem com Mystic:', error);
      throw error;
    }
  }

  /**
   * Melhora a resolução de uma imagem usando o serviço de upscaling do Freepik
   * @param imageUrl URL da imagem a ser melhorada
   */
  async upscaleImage(imageUrl: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('FREEPIK_API_KEY não está configurado');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/upscaler`, 
        { image_url: imageUrl },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Freepik-API-Key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao melhorar resolução da imagem:', error);
      throw error;
    }
  }
}

export const freepikService = new FreepikService();