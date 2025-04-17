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
        params: {
          q: query,
          page,
          limit,
        },
        headers: {
          'Accept-Language': 'pt-BR',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Freepik-API-Key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao buscar imagens no Freepik:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Erro na API do Freepik: ${error.response.status} - ${error.response.data.message || 'Erro desconhecido'}`);
      }
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
      const data: any = {
        prompt: prompt
      };

      if (style) {
        data.style = style;
      }

      const response = await axios.post(`${this.baseUrl}/v1/mystic/generations`, data, {
        headers: {
          'Accept-Language': 'pt-BR',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Freepik-API-Key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao gerar imagem com Mystic:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Erro na API do Freepik Mystic: ${error.response.status} - ${error.response.data.message || 'Erro desconhecido'}`);
      }
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
        `${this.baseUrl}/v1/mystic/upscale`,
        { image_url: imageUrl },
        {
          headers: {
            'Accept-Language': 'pt-BR',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Freepik-API-Key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao melhorar resolução da imagem:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(`Erro na API de upscaling do Freepik: ${error.response.status} - ${error.response.data.message || 'Erro desconhecido'}`);
      }
      throw error;
    }
  }
}

// Instância única para uso em toda a aplicação
export const freepikService = new FreepikService();