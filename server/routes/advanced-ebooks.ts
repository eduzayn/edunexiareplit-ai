import express from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth-middleware';
import { storage } from '../storage';
import { advancedOpenaiService } from '../services/advanced-openai-service';

const router = express.Router();

// Gerar conteúdo avançado para e-book com OpenAI
router.post("/generate-content", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { topic, disciplineId, additionalContext, referenceMaterials } = z.object({
      topic: z.string().min(3, "O tópico deve ter pelo menos 3 caracteres"),
      disciplineId: z.number({ required_error: "O ID da disciplina é obrigatório" }),
      additionalContext: z.string().optional(),
      referenceMaterials: z.array(z.string()).optional()
    }).parse(req.body);
    
    // Verificar se a disciplina existe
    const discipline = await storage.getDiscipline(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ error: "Disciplina não encontrada" });
    }
    
    // Gerar conteúdo usando o serviço OpenAI avançado
    const eBookContent = await advancedOpenaiService.generateEBook(
      topic,
      discipline.name,
      additionalContext,
      referenceMaterials
    );
    
    // Responder com o conteúdo gerado
    res.json(eBookContent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de requisição inválidos", details: error.errors });
    }
    console.error("Erro ao gerar conteúdo para e-book:", error);
    res.status(500).json({ error: "Erro ao gerar conteúdo para e-book" });
  }
});

// Gerar sugestões de imagens avançadas usando OpenAI
router.post("/generate-image-suggestions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description } = z.object({
      title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
      description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres")
    }).parse(req.body);
    
    // Gerar sugestões de imagens usando o serviço OpenAI avançado
    const imageSuggestions = await advancedOpenaiService.generateImageSuggestions(title, description);
    
    // Responder com as sugestões geradas
    res.json({ imageSuggestions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de requisição inválidos", details: error.errors });
    }
    console.error("Erro ao gerar sugestões de imagens:", error);
    res.status(500).json({ error: "Erro ao gerar sugestões de imagens" });
  }
});

// Analisar conteúdo importado
router.post("/analyze-content", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { content } = z.object({
      content: z.string().min(50, "O conteúdo deve ter pelo menos 50 caracteres"),
    }).parse(req.body);
    
    // Analisar o conteúdo importado
    const analysis = await advancedOpenaiService.analyzeImportedContent(content);
    
    // Responder com a análise
    res.json(analysis);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de requisição inválidos", details: error.errors });
    }
    console.error("Erro ao analisar conteúdo:", error);
    res.status(500).json({ error: "Erro ao analisar conteúdo importado" });
  }
});

// Salvar e-book avançado (com tabela de conteúdo)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, content, disciplineId, tableOfContents } = z.object({
      title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
      description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres"),
      content: z.string().min(50, "O conteúdo deve ter pelo menos 50 caracteres"),
      disciplineId: z.number({ required_error: "O ID da disciplina é obrigatório" }),
      tableOfContents: z.array(z.object({
        title: z.string(),
        level: z.number()
      })).optional()
    }).parse(req.body);
    
    // Verificar se a disciplina existe
    const discipline = await storage.getDiscipline(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ error: "Disciplina não encontrada" });
    }
    
    // Criar o e-book no banco de dados
    const newEBook = await storage.createEBook({
      title,
      description,
      content,
      disciplineId,
      status: 'draft',
      isGenerated: true,
      createdById: (req as any).user?.id
      // Nota: o campo metadata não existe no esquema, então armazenaremos a tabela de conteúdo no conteúdo do e-book
      // ou implementaremos essa funcionalidade no future quando o esquema for atualizado
    });
    
    // Responder com o e-book criado
    res.status(201).json(newEBook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de requisição inválidos", details: error.errors });
    }
    console.error("Erro ao salvar e-book:", error);
    res.status(500).json({ error: "Erro ao salvar e-book" });
  }
});

export default router;