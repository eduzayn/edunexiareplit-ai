import OpenAI from "openai";
import { storage } from "../storage";
import { EBookContent } from "@shared/schema";

// Inicializa o cliente da OpenAI com a chave da API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class OpenAIService {
  /**
   * Gera conteúdo para um e-book interativo com base no título, descrição e contexto da disciplina
   */
  async generateEBookContent(
    title: string, 
    description: string, 
    disciplineId: number
  ): Promise<EBookContent> {
    try {
      // Buscar informações da disciplina para contexto
      const discipline = await storage.getDiscipline(disciplineId);
      
      if (!discipline) {
        throw new Error("Disciplina não encontrada");
      }

      // Construir o prompt para o modelo de linguagem
      const prompt = `
        Crie um e-book interativo educacional com o título: "${title}".
        Descrição: ${description}
        
        Contexto da disciplina:
        - Nome: ${discipline.name}
        - Código: ${discipline.code}
        - Ementa: ${discipline.syllabus}
        - Carga horária: ${discipline.workload} horas
        
        O e-book deve incluir:
        1. Uma introdução atraente ao tema
        2. Entre 3 a 5 capítulos com conteúdo relevante
        3. Exercícios interativos para cada capítulo
        4. Um resumo ao final de cada capítulo
        5. Referências bibliográficas relevantes
        
        Formate o conteúdo usando Markdown para estruturar o texto. Inclua sugestões de imagens e diagramas que poderiam ser adicionados depois.
      `;

      // Chamar a API da OpenAI (gpt-4o é o modelo mais recente e avançado)
      // o modelo mais novo da OpenAI é "gpt-4o" que foi lançado após 13 de maio de 2024. não altere isso a menos que explicitamente solicitado pelo usuário
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      });

      // Extrair o conteúdo gerado
      const markdownContent = response.choices[0].message.content || "";
      
      // Retornar o conteúdo estruturado
      return {
        title,
        description,
        content: markdownContent,
        disciplineId,
        generatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo com OpenAI:", error);
      throw new Error(`Falha na geração de conteúdo: ${error.message || "Erro desconhecido"}`);
    }
  }

  /**
   * Gera sugestões de imagens para ilustrar um e-book com base no título e descrição
   */
  async generateImageSuggestions(title: string, description: string): Promise<string[]> {
    try {
      const prompt = `
        Sugira 5 descrições detalhadas de imagens educacionais para um e-book sobre "${title}" com a descrição: "${description}".
        
        Para cada imagem, forneça uma descrição clara e detalhada que poderia ser usada para:
        1. Buscar no Freepik ou banco de imagens semelhante
        2. Gerar com IA
        
        Formate como uma lista numerada, com cada item tendo entre 30-50 palavras.
      `;

      // o modelo mais novo da OpenAI é "gpt-4o" que foi lançado após 13 de maio de 2024. não altere isso a menos que explicitamente solicitado pelo usuário
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      // Extrair o conteúdo gerado
      const suggestionsText = response.choices[0].message.content || "";
      
      // Dividir as sugestões em um array
      const suggestions = suggestionsText
        .split(/\d+\.\s+/)
        .filter(suggestion => suggestion.trim().length > 0)
        .map(suggestion => suggestion.trim());
      
      return suggestions;
    } catch (error: any) {
      console.error("Erro ao gerar sugestões de imagens:", error);
      throw new Error(`Falha na geração de sugestões de imagens: ${error.message || "Erro desconhecido"}`);
    }
  }
}

// Exporta uma instância do serviço para uso em outros módulos
export const openAIService = new OpenAIService();