import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Definição do tipo sem depender da importação que pode não estar disponível
interface ContentBlockText {
  type: 'text';
  text: string;
}

dotenv.config();

// Certifique-se de que a chave de API está disponível
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('⚠️ ANTHROPIC_API_KEY não está definida no arquivo .env');
}

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = 'claude-3-7-sonnet-20250219';

class DocumentAnalysisService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('[DocumentAnalysisService] Serviço de análise de documentos inicializado com sucesso.');
  }

  /**
   * Extrai texto de uma imagem usando Claude Vision
   * @param imageBase64 Imagem em base64
   * @param documentType Tipo de documento
   */
  async analyzeImage(imageBase64: string, documentType: string): Promise<any> {
    try {
      const systemPrompt = this.getSystemPromptForDocumentType(documentType);
      
      const response = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: `Extraia as informações deste documento ${documentType}. Forneça os dados em formato JSON estruturado e legível.`
              }
            ]
          }
        ]
      });
      
      // Extrai o texto do primeiro bloco de conteúdo
      const textContent = this.extractTextFromContent(response.content);
      return this.parseResponse(textContent);
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      throw new Error(`Erro ao analisar imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Analisa texto de um documento
   * @param text Texto do documento
   * @param documentType Tipo de documento
   */
  async analyzeText(text: string, documentType: string): Promise<any> {
    try {
      const systemPrompt = this.getSystemPromptForDocumentType(documentType);
      
      const response = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Extraia as informações do seguinte texto de documento ${documentType}. Forneça os dados em formato JSON estruturado e legível.\n\n${text}`
          }
        ]
      });
      
      // Extrai o texto do primeiro bloco de conteúdo
      const textContent = this.extractTextFromContent(response.content);
      return this.parseResponse(textContent);
    } catch (error) {
      console.error('Erro ao analisar texto:', error);
      throw new Error(`Erro ao analisar texto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Valida dados de matrícula com IA para encontrar potenciais problemas
   * @param enrollmentData Dados da matrícula para validação
   */
  async validateEnrollmentData(enrollmentData: any): Promise<any> {
    try {
      const response = await this.anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: `Você é um assistente especializado em validação de dados de matrícula acadêmica. 
        Sua tarefa é analisar os dados de matrícula e identificar inconsistências, problemas ou 
        informações ausentes que possam impedir a conclusão do processo de matrícula com sucesso.
        
        Forneça sua análise em formato JSON contendo as seguintes propriedades:
        - isValid (boolean): se os dados são válidos ou não
        - issues (array): lista de problemas encontrados
        - suggestions (array): sugestões para correção
        - comments (string): comentários adicionais sobre a análise
        
        Seja meticuloso na validação verificando:
        - Completude dos dados pessoais
        - Formato correto de documentos (CPF, email, telefone)
        - Consistência entre informações fornecidas
        - Validação de datas (vigência do curso, prazos)
        - Detalhes de pagamento e parcelamento`,
        messages: [
          {
            role: 'user',
            content: `Valide os seguintes dados de matrícula e identifique quaisquer problemas ou inconsistências:\n\n${JSON.stringify(enrollmentData, null, 2)}`
          }
        ]
      });
      
      // Extrai o texto do primeiro bloco de conteúdo
      const textContent = this.extractTextFromContent(response.content);
      return this.parseResponse(textContent);
    } catch (error) {
      console.error('Erro ao validar dados de matrícula:', error);
      throw new Error(`Erro ao validar dados de matrícula: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Extrai texto de um bloco de conteúdo da API Anthropic
   * @param content Array de blocos de conteúdo
   */
  private extractTextFromContent(content: any[]): string {
    if (!content || content.length === 0) {
      return '';
    }

    const firstBlock = content[0];
    
    // Verifica se é um bloco de texto
    if (firstBlock && typeof firstBlock === 'object' && 'type' in firstBlock && firstBlock.type === 'text') {
      return (firstBlock as ContentBlockText).text;
    }
    
    // Para outros tipos de blocos, tenta acessar a propriedade text (se existir)
    if (firstBlock && typeof firstBlock === 'object' && 'text' in firstBlock) {
      return String(firstBlock.text);
    }
    
    // Fallback: converte para string
    return JSON.stringify(firstBlock);
  }

  /**
   * Gera um sistema prompt adequado para o tipo de documento
   * @param documentType Tipo de documento
   */
  private getSystemPromptForDocumentType(documentType: string): string {
    const documentPrompts: Record<string, string> = {
      rg: `Você é um assistente especializado em extrair informações de documentos de identidade (RG) brasileiros.
           Identifique e extraia os seguintes campos: Nome completo, Número do RG, Data de nascimento, Filiação, 
           CPF (se disponível), Data de expedição, Órgão expedidor.`,
      
      cpf: `Você é um assistente especializado em extrair informações de documentos CPF brasileiros.
            Identifique e extraia os seguintes campos: Nome completo, Número do CPF, Data de nascimento, 
            Data de emissão (se disponível).`,
      
      passport: `Você é um assistente especializado em extrair informações de passaportes.
                Identifique e extraia os seguintes campos: Nome completo, Número do passaporte, 
                Nacionalidade, Data de nascimento, Data de emissão, Data de validade, 
                Local de emissão, Tipo de passaporte, Sexo.`,
      
      driver_license: `Você é um assistente especializado em extrair informações de carteiras de habilitação (CNH) brasileiras.
                      Identifique e extraia os seguintes campos: Nome completo, Número do registro, 
                      CPF, Data de nascimento, Data de primeira habilitação, 
                      Data de validade, Categoria, Observações.`,
      
      address_proof: `Você é um assistente especializado em extrair informações de comprovantes de endereço.
                     Identifique e extraia os seguintes campos: Nome do titular, Endereço completo, 
                     CEP, Cidade, Estado, Tipo de documento (conta de luz, água, etc.), 
                     Data de emissão, Número da unidade consumidora (se aplicável).`,
      
      diploma: `Você é um assistente especializado em extrair informações de diplomas acadêmicos.
               Identifique e extraia os seguintes campos: Nome do aluno, Nome da instituição, 
               Curso concluído, Grau obtido, Data de conclusão, Data de emissão do diploma, 
               Número de registro.`,
      
      school_transcript: `Você é um assistente especializado em extrair informações de históricos escolares.
                         Identifique e extraia os seguintes campos: Nome do aluno, Nome da instituição, 
                         Curso, Disciplinas cursadas com notas e cargas horárias, Média geral, 
                         Período de início e conclusão, Situação acadêmica.`,
      
      enrollment_form: `Você é um assistente especializado em extrair informações de fichas de matrícula.
                       Identifique e extraia os seguintes campos: Nome do aluno, CPF, RG, Data de nascimento, 
                       Endereço, Telefone, Email, Curso escolhido, Turno, Campus, 
                       Modalidade (presencial/EAD), Valor da mensalidade, Forma de pagamento.`,
      
      contract: `Você é um assistente especializado em extrair informações de contratos educacionais.
                Identifique e extraia os seguintes campos: Nome do contratante, CPF/CNPJ, 
                Nome do aluno (se diferente do contratante), Instituição de ensino, 
                Curso contratado, Valor total, Forma de pagamento, Prazo do contrato, 
                Cláusulas principais, Penalidades por desistência.`,
    };

    return documentPrompts[documentType] || 
      `Você é um assistente especializado em extrair informações de documentos. 
      Identifique e extraia as informações relevantes deste documento do tipo ${documentType}.
      Forneça os dados em formato JSON estruturado.`;
  }

  /**
   * Tenta fazer o parse da resposta da API como JSON
   * Se falhar, retorna o texto original
   * @param text Texto de resposta
   */
  private parseResponse(text: string): any {
    try {
      // Tenta extrair o JSON da resposta
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // Tenta analisar diretamente como JSON
      return JSON.parse(text);
    } catch (error) {
      // Se não for possível analisar como JSON, retorna um objeto com o texto
      return { rawText: text };
    }
  }
}

// Exporta uma única instância do serviço
export const documentAnalysisService = new DocumentAnalysisService();