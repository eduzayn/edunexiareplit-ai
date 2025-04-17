import OpenAI from "openai";

/**
 * Serviço para integração com a API do OpenAI
 */
export class OpenAIService {
  private apiKey: string;
  private client: OpenAI;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY não está configurado!');
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
    model?: string,
    maxTokens?: number,
    temperature?: number
  }): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY não está configurado');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || "gpt-4o", // o modelo mais recente é "gpt-4o" que foi lançado em 13 de maio de 2024
        messages: [{ role: "user", content: prompt }],
        max_tokens: options?.maxTokens || 2000,
        temperature: options?.temperature || 0.7,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Erro ao gerar texto com OpenAI:', error);
      throw error;
    }
  }

  /**
   * Gera um e-book completo com base nas especificações fornecidas
   * @param topic Tópico principal do e-book
   * @param disciplineName Nome da disciplina
   * @param additionalContext Contexto adicional ou requisitos específicos
   * @returns Objeto contendo título, conteúdo e sugestões de imagens
   */
  async generateEBook(topic: string, disciplineName: string, additionalContext?: string): Promise<{
    title: string;
    content: string;
    description: string;
    imagePrompts: string[];
  }> {
    const prompt = `Crie um e-book educacional completo sobre "${topic}" para a disciplina "${disciplineName}".
    
${additionalContext ? additionalContext + '\n' : ''}

O e-book deve incluir:
1. Um título cativante e educacional
2. Uma descrição resumida do conteúdo (máximo 150 palavras)
3. Conteúdo completo dividido em seções claras com subtítulos
4. Pelo menos 5 sugestões de imagens (marcadas como [IMAGEM: descrição detalhada]) que poderiam ser geradas para ilustrar pontos-chave

Retorne a resposta no seguinte formato:
TÍTULO: [título do e-book]
DESCRIÇÃO: [breve descrição]
CONTEÚDO:
[conteúdo completo com subtítulos e [IMAGEM: descrições de imagens]]

O texto deve seguir padrões acadêmicos, ser informativo, ter tom profissional e ser adequado para estudantes de nível superior.`;

    try {
      const response = await this.generateText(prompt, {
        maxTokens: 3500,
        temperature: 0.7
      });

      // Extrair as partes do texto gerado
      const titleMatch = response.match(/TÍTULO:\s*(.*)/);
      const descriptionMatch = response.match(/DESCRIÇÃO:\s*([\s\S]*?)(?=CONTEÚDO:|$)/);
      const contentMatch = response.match(/CONTEÚDO:\s*([\s\S]*)/);

      // Extrair prompts de imagem do conteúdo
      const imagePromptRegex = /\[IMAGEM:\s*(.*?)\]/g;
      const imagePrompts: string[] = [];
      
      let match;
      const content = contentMatch ? contentMatch[1].trim() : '';
      while ((match = imagePromptRegex.exec(content)) !== null) {
        imagePrompts.push(match[1].trim());
      }

      // Remover os marcadores de imagem, deixando apenas uma referência numérica
      const cleanedContent = content.replace(imagePromptRegex, (match, p1, offset) => {
        const index = imagePrompts.findIndex(prompt => prompt === p1.trim());
        return `[Imagem ${index + 1}]`;
      });

      return {
        title: titleMatch ? titleMatch[1].trim() : 'E-book sobre ' + topic,
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
        content: cleanedContent,
        imagePrompts
      };
    } catch (error) {
      console.error('Erro ao gerar e-book:', error);
      throw new Error('Falha ao gerar conteúdo do e-book');
    }
  }
  
  /**
   * Gera sugestões de descrições para imagens com base no título e descrição do e-book
   * @param title Título do e-book
   * @param description Descrição do e-book
   * @returns Lista de sugestões de descrições para imagens
   */
  async generateImageSuggestions(title: string, description: string): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY não está configurado');
    }

    const prompt = `Com base no título e descrição de um e-book educacional, gere 5 descrições detalhadas para imagens que poderiam ilustrar o conteúdo.

Título do e-book: ${title}
Descrição: ${description}

Forneça descrições específicas e visuais que possam ser usadas para gerar ou buscar imagens. Cada descrição deve ser detalhada, com 1-2 frases, focada em elementos visuais claros.

Retorne apenas as 5 descrições das imagens, uma por linha, sem numeração ou marcadores.`;

    try {
      const response = await this.generateText(prompt, {
        maxTokens: 1000,
        temperature: 0.8
      });

      // Dividir a resposta em linhas e filtrar linhas vazias
      const suggestions = response.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5); // Limitar a 5 sugestões

      return suggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões de imagens:', error);
      throw new Error('Falha ao gerar sugestões de imagens');
    }
  }
}

// Instância única para uso em toda a aplicação
export const openaiService = new OpenAIService();