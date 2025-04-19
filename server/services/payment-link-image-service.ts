import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { edunexaPaymentLinks as paymentLinks } from '../../shared/schema';

interface AsaasImageUploadResponse {
  id: string;
  name: string;
  url: string;
  creationDate: string;
  type: string;
  size: number;
  status: string;
}

/**
 * Serviço para gerenciar as imagens dos links de pagamento no Asaas
 */
export class PaymentLinkImageService {
  private apiUrl: string;
  private apiKey: string;
  private isReplicateConfigured: boolean;

  constructor() {
    // Sempre utilizamos ambiente de produção para o Asaas conforme padrão do projeto
    this.apiUrl = 'https://api.asaas.com/v3';
    
    console.log(`[PAYMENT LINK IMAGE SERVICE] Utilizando ambiente Asaas: Produção - ${this.apiUrl}`);
    
    // Chave API do Asaas (prioriza a chave dedicada para o módulo)
    this.apiKey = process.env.ASAAS_ZAYN_KEY || process.env.ASAAS_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('ASAAS_ZAYN_KEY ou ASAAS_API_KEY não configurada!');
    }
    
    console.log(`[PAYMENT LINK IMAGE SERVICE] Token da API (ASAAS_ZAYN_KEY): ${this.apiKey.substring(0, 10)}...`);
    
    // Verificar se o Replicate está configurado para geração de imagens
    this.isReplicateConfigured = !!process.env.REPLICATE_API_TOKEN;
    console.log(`[PAYMENT LINK IMAGE SERVICE] Replicate configurado: ${this.isReplicateConfigured}`);
  }

  /**
   * Faz upload de uma imagem para um link de pagamento do Asaas
   * @param paymentLinkId ID interno do link de pagamento
   * @param imagePath Caminho do arquivo de imagem a ser enviado
   * @returns Resposta do Asaas com os dados da imagem
   */
  async uploadImageToPaymentLink(paymentLinkId: number, imagePath: string): Promise<AsaasImageUploadResponse> {
    try {
      // Buscar o link de pagamento no banco
      const [link] = await db
        .select()
        .from(paymentLinks)
        .where(eq(paymentLinks.id, paymentLinkId));

      if (!link) {
        throw new Error(`Link de pagamento com ID ${paymentLinkId} não encontrado`);
      }

      const asaasPaymentLinkId = link.asaasPaymentLinkId;

      // Criar um FormData para enviar a imagem
      const formData = new FormData();
      formData.append('file', fs.createReadStream(imagePath));

      // Fazer o upload para o Asaas
      const response = await axios.post(
        `${this.apiUrl}/paymentLinks/${asaasPaymentLinkId}/images`,
        formData,
        {
          headers: {
            'access_token': this.apiKey,
            ...formData.getHeaders(),
          },
        }
      );

      // Atualizar o status do link no banco de dados
      await this.updatePaymentLinkStatus(paymentLinkId, 'Active');

      return response.data;
    } catch (error: any) {
      console.error('Erro ao fazer upload de imagem para o link de pagamento:', error.message);
      
      // Se o erro for relacionado ao Asaas, atualizar o status do link para erro
      await this.updatePaymentLinkStatus(paymentLinkId, 'ImageError');
      
      throw error;
    }
  }

  /**
   * Atualiza o status de um link de pagamento no banco de dados
   * @param paymentLinkId ID interno do link de pagamento
   * @param status Novo status do link
   */
  async updatePaymentLinkStatus(paymentLinkId: number, status: 'Active' | 'ImageError' | 'Error' | 'Disabled'): Promise<void> {
    try {
      await db
        .update(paymentLinks)
        .set({ internalStatus: status })
        .where(eq(paymentLinks.id, paymentLinkId));
    } catch (error: any) {
      console.error(`Erro ao atualizar status do link de pagamento ${paymentLinkId}:`, error.message);
      throw error;
    }
  }

  /**
   * Gera uma imagem para um link de pagamento usando IA
   * @param courseId ID do curso
   * @param courseName Nome do curso
   */
  async generateImageForPaymentLink(courseId: number, courseName: string): Promise<string | null> {
    // Se o Replicate não estiver configurado, retorna null
    if (!this.isReplicateConfigured) {
      console.warn('Replicate não configurado. Não é possível gerar imagens.');
      return null;
    }

    try {
      console.log(`[PAYMENT LINK IMAGE SERVICE] Gerando imagem para o curso: ${courseName}`);
      
      // Criar o diretório temporário para a imagem
      const tempDir = os.tmpdir();
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 10000);
      const filename = `course_image_${courseId}_${timestamp}_${randomId}.png`;
      const outputPath = path.join(tempDir, filename);
      
      // Preparar o prompt para gerar a imagem
      const prompt = `Uma imagem educacional profissional representando o curso de ${courseName}. Estilo fotográfico profissional, alta qualidade, adequado para banner educacional online.`;
      
      // Configurar a chamada para a API do Replicate
      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // Stable Diffusion XL 1.0
          input: {
            prompt: prompt,
            width: 1024,
            height: 576, // Proporção 16:9
            num_outputs: 1,
            guidance_scale: 7.5,
            negative_prompt: "texto, palavras, caracteres, logotipos, watermarks, baixa qualidade, distorção, borrado, artefatos, desfocado",
            scheduler: "K_EULER_ANCESTRAL",
            num_inference_steps: 50
          }
        },
        {
          headers: {
            'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // ID da previsão para acompanhamento
      const predictionId = response.data.id;
      console.log(`[PAYMENT LINK IMAGE SERVICE] Previsão iniciada: ${predictionId}`);
      
      // Aguardar a conclusão da geração (polling)
      let prediction = response.data;
      while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
        
        const statusResponse = await axios.get(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        prediction = statusResponse.data;
        console.log(`[PAYMENT LINK IMAGE SERVICE] Status da previsão: ${prediction.status}`);
      }
      
      // Verificar se a geração foi bem-sucedida
      if (prediction.status === 'succeeded' && prediction.output && prediction.output.length > 0) {
        // Baixar a imagem gerada
        const imageUrl = prediction.output[0];
        console.log(`[PAYMENT LINK IMAGE SERVICE] Imagem gerada: ${imageUrl}`);
        
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(outputPath, Buffer.from(imageResponse.data, 'binary'));
        
        console.log(`[PAYMENT LINK IMAGE SERVICE] Imagem salva em: ${outputPath}`);
        return outputPath;
      } else {
        console.error('[PAYMENT LINK IMAGE SERVICE] Falha na geração da imagem:', prediction.error || 'Erro desconhecido');
        return null;
      }
    } catch (error: any) {
      console.error('Erro ao gerar imagem para link de pagamento:', error.message);
      return null;
    }
  }
}

// Exporta uma instância única do serviço
export const paymentLinkImageService = new PaymentLinkImageService();