import { Router } from 'express';
import { storage } from '../storage';
import { advancedOpenaiService } from '../services/advanced-openai-service';
import { z } from 'zod';
import { Request as ExpressRequest } from 'express';

// Estender o Request do Express para incluir o user
declare global {
  namespace Express {
    interface Request {
      user?: any;
      isAuthenticated?: () => boolean;
    }
  }
}

const router = Router();

// Validação para o corpo da requisição de geração de conteúdo
const generateContentSchema = z.object({
  topic: z.string().min(3, "O tópico deve ter pelo menos 3 caracteres"),
  disciplineId: z.number().int().positive("ID da disciplina inválido"),
  additionalContext: z.string().optional(),
  referenceMaterials: z.array(z.string()).optional(),
});

// Endpoint para geração de conteúdo avançado do e-book
router.post('/generate-content', async (req, res) => {
  try {
    // Validar o corpo da requisição
    const validationResult = generateContentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: validationResult.error.format() 
      });
    }

    const { topic, disciplineId, additionalContext, referenceMaterials } = validationResult.data;

    // Buscar a disciplina para usá-la como contexto
    const discipline = await storage.getDiscipline(disciplineId);
    if (!discipline) {
      return res.status(404).json({ error: "Disciplina não encontrada" });
    }

    // Gerar o conteúdo com o serviço avançado do OpenAI
    const generatedEBook = await advancedOpenaiService.generateEBook(
      topic, 
      discipline.name, 
      additionalContext || '',
      referenceMaterials || []
    );

    // Retornar o conteúdo gerado
    res.json(generatedEBook);
  } catch (error: any) {
    console.error("Erro ao gerar conteúdo avançado:", error);
    res.status(500).json({ error: "Erro ao gerar conteúdo: " + error.message });
  }
});

// Validação para o corpo da requisição de análise de conteúdo
const analyzeContentSchema = z.object({
  content: z.string().min(10, "O conteúdo deve ter pelo menos 10 caracteres"),
});

// Endpoint para análise de conteúdo importado
router.post('/analyze-content', async (req, res) => {
  try {
    // Validar o corpo da requisição
    const validationResult = analyzeContentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: validationResult.error.format() 
      });
    }

    const { content } = validationResult.data;

    // Analisar o conteúdo com o serviço avançado do OpenAI
    const analysis = await advancedOpenaiService.analyzeImportedContent(content);

    // Retornar a análise
    res.json(analysis);
  } catch (error: any) {
    console.error("Erro ao analisar conteúdo:", error);
    res.status(500).json({ error: "Erro ao analisar conteúdo: " + error.message });
  }
});

// Validação para o corpo da requisição de geração de sugestões de imagens
const generateImageSuggestionsSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
});

// Endpoint para geração de sugestões de imagens
router.post('/generate-image-suggestions', async (req, res) => {
  try {
    // Validar o corpo da requisição
    const validationResult = generateImageSuggestionsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: validationResult.error.format() 
      });
    }

    const { title, description } = validationResult.data;

    // Gerar sugestões de imagens com o serviço avançado do OpenAI
    const imageSuggestions = await advancedOpenaiService.generateImageSuggestions(title, description);

    // Retornar as sugestões
    res.json({ imageSuggestions });
  } catch (error: any) {
    console.error("Erro ao gerar sugestões de imagens:", error);
    res.status(500).json({ error: "Erro ao gerar sugestões de imagens: " + error.message });
  }
});

// Endpoint para salvar e-book avançado
router.post('/', async (req, res) => {
  try {
    // Verificar autenticação usando a session
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: "Não autorizado" });
    }

    const { title, description, content, disciplineId, tableOfContents } = req.body;

    // Validação básica
    if (!title || !description || !content || !disciplineId) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // Criar o e-book no banco de dados
    const ebook = await storage.createEBook({
      title,
      description,
      content,
      disciplineId,
      status: req.body.status || 'draft',
      isGenerated: true,
      createdById: (req.user as any)?.id
    });

    // Resposta
    res.status(201).json(ebook);
  } catch (error: any) {
    console.error("Erro ao salvar e-book:", error);
    res.status(500).json({ error: "Erro ao salvar e-book: " + error.message });
  }
});

export default router;