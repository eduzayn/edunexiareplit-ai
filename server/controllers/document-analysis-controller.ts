import { Request, Response } from 'express';
import { documentAnalysisService } from '../services/document-analysis-service';

export class DocumentAnalysisController {
  /**
   * Analisa uma imagem para extrair informações
   * @param req Requisição com a imagem em base64 e o tipo de documento
   * @param res Resposta com os dados extraídos
   */
  async analyzeImage(req: Request, res: Response) {
    try {
      const { image, documentType } = req.body;

      if (!image) {
        return res.status(400).json({ message: 'Imagem não fornecida' });
      }

      if (!documentType) {
        return res.status(400).json({ message: 'Tipo de documento não especificado' });
      }

      const result = await documentAnalysisService.analyzeImage(image, documentType);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      return res.status(500).json({ 
        message: 'Erro ao processar a análise da imagem',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Analisa texto para extrair informações
   * @param req Requisição com o texto e o tipo de documento
   * @param res Resposta com os dados extraídos
   */
  async analyzeText(req: Request, res: Response) {
    try {
      const { text, documentType } = req.body;

      if (!text) {
        return res.status(400).json({ message: 'Texto não fornecido' });
      }

      if (!documentType) {
        return res.status(400).json({ message: 'Tipo de documento não especificado' });
      }

      const result = await documentAnalysisService.analyzeText(text, documentType);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao analisar texto:', error);
      return res.status(500).json({ 
        message: 'Erro ao processar a análise do texto',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Valida dados de matrícula para identificar problemas
   * @param req Requisição com os dados de matrícula
   * @param res Resposta com a validação
   */
  async validateEnrollmentData(req: Request, res: Response) {
    try {
      const { enrollmentData } = req.body;

      if (!enrollmentData) {
        return res.status(400).json({ message: 'Dados de matrícula não fornecidos' });
      }

      const result = await documentAnalysisService.validateEnrollmentData(enrollmentData);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Erro ao validar dados de matrícula:', error);
      return res.status(500).json({ 
        message: 'Erro ao processar a validação dos dados de matrícula',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}

// Exporta uma única instância do controlador
export const documentAnalysisController = new DocumentAnalysisController();