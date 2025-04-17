import OpenAI from "openai";

/**
 * Serviço avançado para integração com a API do OpenAI
 * Suporta geração de conteúdo contextualizado, referências e importação de material
 */
export class AdvancedOpenAIService {
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
    temperature?: number,
    systemPrompt?: string
  }): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY não está configurado');
    }

    try {
      const messages = [];
      
      // Adicionar prompt do sistema se fornecido
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      
      // Adicionar prompt do usuário
      messages.push({ role: "user", content: prompt });
      
      const response = await this.client.chat.completions.create({
        model: options?.model || "gpt-4o", // o modelo mais recente é "gpt-4o"
        messages: messages,
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
   * @param referenceMaterials Materiais de referência (URLs, textos)
   * @returns Objeto contendo título, conteúdo e sugestões de imagens
   */
  async generateEBook(
    topic: string, 
    disciplineName: string, 
    additionalContext?: string,
    referenceMaterials?: string[]
  ): Promise<{
    title: string;
    content: string;
    description: string;
    imagePrompts: string[];
    tableOfContents: {title: string, level: number}[];
  }> {
    // Preparar o contexto com materiais de referência se houver
    let contextWithReferences = additionalContext || '';
    
    if (referenceMaterials && referenceMaterials.length > 0) {
      contextWithReferences += '\n\nMateriais de referência a considerar:\n';
      referenceMaterials.forEach((material, index) => {
        contextWithReferences += `${index + 1}. ${material}\n`;
      });
    }
    
    const systemPrompt = `Você é um professor especialista e autor acadêmico com experiência em criar materiais educacionais de alta qualidade. Seu objetivo é criar e-books educacionais que sejam informativos, envolventes e visualmente atrativos.`;
    
    const prompt = `Crie um e-book educacional completo sobre "${topic}" para a disciplina "${disciplineName}".
    
${contextWithReferences ? contextWithReferences + '\n' : ''}

O e-book deve incluir:
1. Um título cativante e educacional
2. Uma descrição resumida do conteúdo (máximo 150 palavras)
3. Um sumário com todos os capítulos e seções
4. Conteúdo completo dividido em seções claras com subtítulos hierárquicos (usando # para títulos principais, ## para subtítulos, ### para seções menores)
5. Pelo menos 8 sugestões de imagens (marcadas como [IMAGEM: descrição detalhada]) que poderiam ser geradas para ilustrar pontos-chave
6. Exemplos práticos e estudos de caso quando apropriado
7. Destaques para termos e conceitos importantes usando **termo** para negrito
8. Citações inspiradoras ou reflexivas em formato de bloco de citação

Retorne a resposta no seguinte formato:
TÍTULO: [título do e-book]
DESCRIÇÃO: [breve descrição]
SUMÁRIO:
[lista de capítulos e seções]
CONTEÚDO:
[conteúdo completo formatado em markdown com subtítulos e [IMAGEM: descrições de imagens]]

O texto deve seguir padrões acadêmicos, ser informativo, ter tom profissional e ser adequado para estudantes de nível superior.`;

    try {
      const response = await this.generateText(prompt, {
        maxTokens: 4000,
        temperature: 0.7,
        systemPrompt
      });

      // Extrair as partes do texto gerado
      const titleMatch = response.match(/TÍTULO:\s*(.*)/);
      const descriptionMatch = response.match(/DESCRIÇÃO:\s*([\s\S]*?)(?=SUMÁRIO:|$)/);
      const tocMatch = response.match(/SUMÁRIO:\s*([\s\S]*?)(?=CONTEÚDO:|$)/);
      const contentMatch = response.match(/CONTEÚDO:\s*([\s\S]*)/);

      // Extrair prompts de imagem do conteúdo
      const imagePromptRegex = /\[IMAGEM:\s*(.*?)\]/g;
      const imagePrompts: string[] = [];
      
      let match;
      const content = contentMatch ? contentMatch[1].trim() : '';
      while ((match = imagePromptRegex.exec(content)) !== null) {
        imagePrompts.push(match[1].trim());
      }

      // Extrair o sumário
      const tocText = tocMatch ? tocMatch[1].trim() : '';
      const tableOfContents = this.parseTableOfContents(tocText);

      // Remover os marcadores de imagem, deixando apenas uma referência numérica
      const cleanedContent = content.replace(imagePromptRegex, (match, p1, offset) => {
        const index = imagePrompts.findIndex(prompt => prompt === p1.trim());
        return `[Imagem ${index + 1}]`;
      });

      return {
        title: titleMatch ? titleMatch[1].trim() : 'E-book sobre ' + topic,
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
        content: cleanedContent,
        imagePrompts,
        tableOfContents
      };
    } catch (error) {
      console.error('Erro ao gerar e-book:', error);
      throw new Error('Falha ao gerar conteúdo do e-book');
    }
  }
  
  /**
   * Parseia o texto do sumário para extrair a estrutura hierárquica
   */
  private parseTableOfContents(tocText: string): {title: string, level: number}[] {
    if (!tocText) return [];
    
    const lines = tocText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const toc: {title: string, level: number}[] = [];
    
    lines.forEach(line => {
      // Determinar o nível com base na indentação ou formatação
      let level = 1;
      
      if (line.startsWith('   ')) {
        level = 3;
        line = line.replace(/^\s+/, '');
      } else if (line.startsWith(' ')) {
        level = 2;
        line = line.replace(/^\s+/, '');
      }
      
      // Remover marcadores de lista numerados ou com pontos
      line = line.replace(/^(\d+\.|\*|-)\s+/, '');
      
      toc.push({ title: line, level });
    });
    
    return toc;
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

    const systemPrompt = `Você é um designer especialista em visualização de conteúdo educacional. Seu objetivo é sugerir imagens que ilustrem conceitos educacionais de forma clara e envolvente.`;
    
    const prompt = `Com base no título e descrição de um e-book educacional, gere 8 descrições detalhadas para imagens que poderiam ilustrar o conteúdo.

Título do e-book: ${title}
Descrição: ${description}

Para cada imagem:
1. Forneça uma descrição visual detalhada (2-3 frases)
2. Especifique estilo visual (fotografia, ilustração, diagrama, etc.)
3. Indique paleta de cores sugerida
4. Descreva o contexto educacional e como a imagem reforça o aprendizado

Retorne apenas as 8 descrições das imagens, uma por linha, sem numeração ou marcadores.`;

    try {
      const response = await this.generateText(prompt, {
        maxTokens: 1500,
        temperature: 0.8,
        systemPrompt
      });

      // Dividir a resposta em parágrafos e filtrar vazios
      const suggestions = response.split('\n\n')
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0)
        .slice(0, 8); // Limitar a 8 sugestões

      return suggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões de imagens:', error);
      throw new Error('Falha ao gerar sugestões de imagens');
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
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY não está configurado');
    }

    const systemPrompt = `Você é um assistente especializado em análise de conteúdo educacional. Seu trabalho é extrair informações úteis de textos para auxiliar na criação de e-books.`;
    
    const prompt = `Analise o seguinte texto e extraia:
1. Um resumo conciso do conteúdo (máximo 100 palavras)
2. Cinco pontos-chave abordados no texto
3. Recomendação de 3-5 seções que poderiam ser incluídas em um e-book baseado neste conteúdo

Texto para análise:
${importedText.substring(0, 8000)} ${importedText.length > 8000 ? '... (texto truncado)' : ''}

Responda no seguinte formato:
RESUMO:
[resumo conciso]

PONTOS-CHAVE:
1. [ponto 1]
2. [ponto 2]
...

RECOMENDAÇÃO DE SEÇÕES:
- [seção 1]
- [seção 2]
...`;

    try {
      const response = await this.generateText(prompt, {
        maxTokens: 1500,
        temperature: 0.3,
        systemPrompt
      });
      
      // Extrair as partes da resposta
      const summaryMatch = response.match(/RESUMO:\s*([\s\S]*?)(?=PONTOS-CHAVE:|$)/);
      const pointsMatch = response.match(/PONTOS-CHAVE:\s*([\s\S]*?)(?=RECOMENDAÇÃO DE SEÇÕES:|$)/);
      const sectionsMatch = response.match(/RECOMENDAÇÃO DE SEÇÕES:\s*([\s\S]*)/);
      
      // Processar pontos-chave
      const pointsText = pointsMatch ? pointsMatch[1].trim() : '';
      const keyPoints = pointsText
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0);
        
      // Processar recomendações de seções
      const sectionsText = sectionsMatch ? sectionsMatch[1].trim() : '';
      const recommendedSections = sectionsText
        .split('\n')
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
      
      return {
        summary: summaryMatch ? summaryMatch[1].trim() : '',
        keyPoints,
        recommendedSections
      };
    } catch (error) {
      console.error('Erro ao analisar conteúdo importado:', error);
      throw new Error('Falha ao analisar o conteúdo importado');
    }
  }
}

// Instância única para uso em toda a aplicação
export const advancedOpenaiService = new AdvancedOpenAIService();