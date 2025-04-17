import OpenAI from "openai";

/**
 * Serviço avançado para integração com a API do OpenAI
 * Suporta geração de conteúdo contextualizado, referências e importação de material
 */
export class AdvancedOpenAIService {
  private apiKey: string;
  private client: OpenAI;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    
    if (!this.apiKey) {
      console.error("OPENAI_API_KEY não configurada. O serviço não funcionará corretamente.");
    }
    
    this.client = new OpenAI({ apiKey: this.apiKey });
  }

  /**
   * Gera conteúdo de texto baseado no prompt fornecido
   * @param prompt Descrição do que deve ser gerado
   * @param options Opções adicionais
   * @returns Texto gerado pelo modelo
   */
  async generateText(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
    format?: 'markdown' | 'json' | 'text';
  }): Promise<string> {
    try {
      // Ajustar parâmetros com valores padrão se não fornecidos
      const temperature = options?.temperature ?? 0.7;
      const maxTokens = options?.maxTokens ?? 2000;
      
      // Configurar o formato da resposta se solicitado
      const responseFormat = options?.format === 'json' 
        ? { type: "json_object" as const } 
        : undefined;

      // Gerar a resposta
      const response = await this.client.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em educação, focado em gerar conteúdo educacional de alta qualidade. 
            ${options?.format === 'markdown' ? 'Formate sua resposta usando Markdown, com títulos, subtítulos, listas e ênfases apropriadas.' : ''}
            ${options?.format === 'json' ? 'Formate sua resposta como um objeto JSON válido.' : ''}`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        response_format: responseFormat,
      });

      return response.choices[0].message.content || "";
    } catch (error) {
      console.error("Erro ao gerar texto com OpenAI:", error);
      throw new Error(`Falha ao gerar texto: ${error}`);
    }
  }

  /**
   * Gera um e-book completo com base nas especificações fornecidas
   * @param topic Tópico principal do e-book
   * @param disciplineName Nome da disciplina
   * @param additionalContext Contexto adicional ou requisitos específicos
   * @param referenceMaterials Materiais de referência (URLs, textos)
   * @returns Objeto contendo título, conteúdo e sugestões de imagens
   */
  async generateEBook(
    topic: string,
    disciplineName: string,
    additionalContext: string = "",
    referenceMaterials: string[] = []
  ): Promise<{
    title: string;
    content: string;
    description: string;
    tableOfContents: { title: string; level: number }[];
  }> {
    try {
      // Construir um prompt contextualizado com base nas informações fornecidas
      let prompt = `Crie um e-book educacional completo sobre "${topic}" para a disciplina "${disciplineName}".`;
      
      // Adicionar contexto adicional se fornecido
      if (additionalContext && additionalContext.trim()) {
        prompt += `\n\nContexto adicional: ${additionalContext}`;
      }
      
      // Adicionar materiais de referência se fornecidos
      if (referenceMaterials && referenceMaterials.length > 0) {
        prompt += `\n\nUse os seguintes materiais de referência para contextualizar o conteúdo:\n`;
        referenceMaterials.forEach((material, index) => {
          prompt += `\nMaterial ${index + 1}:\n${material}\n`;
        });
      }
      
      // Solicitar estrutura específica para o e-book
      prompt += `\n\nO e-book deve conter:
      1. Um título envolvente e descritivo
      2. Um sumário detalhado com capítulos e seções
      3. Conteúdo completo formatado em Markdown
      4. Sugestões de onde inserir imagens ilustrativas no formato [Imagem X]
      
      Formate sua resposta como JSON com a seguinte estrutura:
      {
        "title": "Título do E-book",
        "description": "Uma descrição concisa do conteúdo do e-book (150-200 caracteres)",
        "tableOfContents": [{"title": "Nome do capítulo/seção", "level": número (1 para capítulos, 2 para seções, 3 para subseções)}],
        "content": "Conteúdo completo em Markdown"
      }`;

      // Gerar o e-book usando o modelo GPT
      const response = await this.client.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `Você é um escritor especializado em conteúdo educacional. Crie um e-book completo e bem estruturado sobre o tópico solicitado, seguindo a estrutura indicada e usando os materiais de referência fornecidos para contextualizar o conteúdo. Use uma linguagem clara, didática e adequada ao contexto acadêmico.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      // Parse da resposta JSON
      const ebookData = JSON.parse(response.choices[0].message.content || "{}");
      
      // Extrair e processar o sumário
      let tableOfContents = [];
      if (ebookData.tableOfContents) {
        tableOfContents = ebookData.tableOfContents;
      } else if (ebookData.content) {
        // Tentar extrair o sumário do conteúdo se não estiver explícito no JSON
        tableOfContents = this.parseTableOfContents(ebookData.content);
      }

      return {
        title: ebookData.title || topic,
        content: ebookData.content || "",
        description: ebookData.description || additionalContext,
        tableOfContents: tableOfContents,
      };
    } catch (error) {
      console.error("Erro ao gerar e-book completo:", error);
      throw new Error(`Falha ao gerar e-book: ${error}`);
    }
  }

  /**
   * Parseia o texto do sumário para extrair a estrutura hierárquica
   */
  private parseTableOfContents(tocText: string): {title: string, level: number}[] {
    const tocResult = [];
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    let match;
    
    while ((match = headingRegex.exec(tocText)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      tocResult.push({
        title: title,
        level: level
      });
    }
    
    return tocResult;
  }

  /**
   * Gera sugestões de descrições para imagens com base no título e descrição do e-book
   * @param title Título do e-book
   * @param description Descrição do e-book
   * @returns Lista de sugestões de descrições para imagens
   */
  async generateImageSuggestions(title: string, description: string): Promise<string[]> {
    try {
      const prompt = `
      Com base no e-book "**${title}**" que tem a seguinte descrição:
      
      "${description}"
      
      Gere 5 sugestões detalhadas para imagens que poderiam ilustrar este e-book educacional. 
      Cada sugestão deve:
      1. Ser específica e descritiva
      2. Estar relacionada diretamente ao conteúdo do e-book
      3. Servir como referência para busca em bancos de imagens ou geração com IA

      Crie suas sugestões como uma lista em formato JSON. Exemplo:
      ["Descrição da imagem 1", "Descrição da imagem 2", ...etc]
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `Você é um especialista em design visual educacional. Sua tarefa é sugerir imagens descritivas e relevantes para complementar materiais educacionais.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });

      // Parse da resposta JSON
      const suggestionsData = JSON.parse(response.choices[0].message.content || "[]");
      
      return Array.isArray(suggestionsData) ? suggestionsData : [];
    } catch (error) {
      console.error("Erro ao gerar sugestões de imagens:", error);
      throw new Error(`Falha ao gerar sugestões de imagens: ${error}`);
    }
  }

  /**
   * Analisa e extrai informações úteis de um texto importado
   * @param importedText Texto a ser analisado
   * @returns Informações extraídas do texto
   */
  async analyzeImportedContent(importedText: string): Promise<{
    summary: string;
    keyPoints: string[];
    recommendedSections: string[];
  }> {
    try {
      // Limitar o tamanho do texto para análise
      const textForAnalysis = importedText.substring(0, 15000);
      
      const prompt = `
      Analise o seguinte texto educacional e extraia as informações mais relevantes:

      """
      ${textForAnalysis}
      """

      Por favor, forneça:
      1. Um resumo conciso (até 200 caracteres)
      2. Uma lista dos pontos-chave (máximo 5 itens)
      3. Recomendações de seções ou tópicos que poderiam ser criados com base neste conteúdo (máximo 3 itens)

      Retorne sua análise como JSON no seguinte formato:
      {
        "summary": "Resumo do texto",
        "keyPoints": ["Ponto 1", "Ponto 2", ...],
        "recommendedSections": ["Seção 1", "Seção 2", ...]
      }
      `;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `Você é um assistente especializado em análise de conteúdo educacional. Sua tarefa é extrair as informações mais relevantes de textos acadêmicos e educacionais, resumindo-os de forma concisa e estruturada.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      // Parse da resposta JSON
      const analysisData = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        summary: analysisData.summary || "Resumo não disponível",
        keyPoints: Array.isArray(analysisData.keyPoints) ? analysisData.keyPoints : [],
        recommendedSections: Array.isArray(analysisData.recommendedSections) ? analysisData.recommendedSections : [],
      };
    } catch (error) {
      console.error("Erro ao analisar conteúdo importado:", error);
      throw new Error(`Falha ao analisar conteúdo: ${error}`);
    }
  }
}

export const advancedOpenaiService = new AdvancedOpenAIService();