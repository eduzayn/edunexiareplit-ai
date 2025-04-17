import { Router } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { openaiService } from "../services/openai-service";
import { freepikService } from "../services/freepik-service";
import { insertEBookSchema, insertEBookImageSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// ==================== Rotas públicas ====================

// Obter e-books publicados 
router.get("/published", async (req, res) => {
  try {
    const search = req.query.search as string | undefined;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const ebooks = await storage.getEBooks("published", search, limit, offset);
    
    res.json(ebooks);
  } catch (error) {
    console.error("Erro ao obter e-books publicados:", error);
    res.status(500).json({ error: "Erro ao obter e-books publicados" });
  }
});

// Obter um e-book específico pelo ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ebook = await storage.getEBook(id);
    
    if (!ebook) {
      return res.status(404).json({ error: "E-book não encontrado" });
    }
    
    // Se o e-book não for publicado, apenas administradores podem acessá-lo
    if (ebook.status !== "published") {
      if (!req.session.user || req.session.user.portalType !== "admin") {
        return res.status(403).json({ error: "Acesso não autorizado a este e-book" });
      }
    }
    
    res.json(ebook);
  } catch (error) {
    console.error("Erro ao obter e-book:", error);
    res.status(500).json({ error: "Erro ao obter e-book" });
  }
});

// Obter imagens de um e-book
router.get("/:id/images", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ebook = await storage.getEBook(id);
    
    if (!ebook) {
      return res.status(404).json({ error: "E-book não encontrado" });
    }
    
    // Se o e-book não for publicado, apenas administradores podem acessá-lo
    if (ebook.status !== "published") {
      if (!req.session.user || req.session.user.portalType !== "admin") {
        return res.status(403).json({ error: "Acesso não autorizado a este e-book" });
      }
    }
    
    const images = await storage.getEBookImages(id);
    res.json(images);
  } catch (error) {
    console.error("Erro ao obter imagens do e-book:", error);
    res.status(500).json({ error: "Erro ao obter imagens do e-book" });
  }
});

// ==================== Rotas administrativas (protegidas) ====================

// Listar todos os e-books (para administradores)
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const limit = Number(req.query.limit) || 50;
    const offset = Number(req.query.offset) || 0;
    
    const ebooks = await storage.getEBooks(status, search, limit, offset);
    res.json(ebooks);
  } catch (error) {
    console.error("Erro ao listar e-books:", error);
    res.status(500).json({ error: "Erro ao listar e-books" });
  }
});

// Obter e-books por disciplina
router.get("/discipline/:disciplineId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const disciplineId = Number(req.params.disciplineId);
    const ebooks = await storage.getEBooksByDiscipline(disciplineId);
    res.json(ebooks);
  } catch (error) {
    console.error("Erro ao obter e-books por disciplina:", error);
    res.status(500).json({ error: "Erro ao obter e-books por disciplina" });
  }
});

// Criar um novo e-book
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const eBookData = insertEBookSchema.parse(req.body);
    const createdById = req.session.user?.id;
    
    const newEBook = await storage.createEBook({
      ...eBookData,
      createdById
    });
    
    res.status(201).json(newEBook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de e-book inválidos", details: error.errors });
    }
    console.error("Erro ao criar e-book:", error);
    res.status(500).json({ error: "Erro ao criar e-book" });
  }
});

// Atualizar um e-book existente
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ebook = await storage.getEBook(id);
    
    if (!ebook) {
      return res.status(404).json({ error: "E-book não encontrado" });
    }
    
    const eBookData = insertEBookSchema.partial().parse(req.body);
    const updatedEBook = await storage.updateEBook(id, eBookData);
    
    res.json(updatedEBook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de e-book inválidos", details: error.errors });
    }
    console.error("Erro ao atualizar e-book:", error);
    res.status(500).json({ error: "Erro ao atualizar e-book" });
  }
});

// Excluir um e-book
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ebook = await storage.getEBook(id);
    
    if (!ebook) {
      return res.status(404).json({ error: "E-book não encontrado" });
    }
    
    const deleted = await storage.deleteEBook(id);
    
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: "Não foi possível excluir o e-book" });
    }
  } catch (error) {
    console.error("Erro ao excluir e-book:", error);
    res.status(500).json({ error: "Erro ao excluir e-book" });
  }
});

// Publicar um e-book
router.post("/:id/publish", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ebook = await storage.getEBook(id);
    
    if (!ebook) {
      return res.status(404).json({ error: "E-book não encontrado" });
    }
    
    const publishedEBook = await storage.publishEBook(id);
    
    res.json(publishedEBook);
  } catch (error) {
    console.error("Erro ao publicar e-book:", error);
    res.status(500).json({ error: "Erro ao publicar e-book" });
  }
});

// ==================== Rotas para imagens de e-books ====================

// Adicionar uma imagem a um e-book
router.post("/:id/images", requireAuth, requireAdmin, async (req, res) => {
  try {
    const eBookId = Number(req.params.id);
    const ebook = await storage.getEBook(eBookId);
    
    if (!ebook) {
      return res.status(404).json({ error: "E-book não encontrado" });
    }
    
    const imageData = insertEBookImageSchema.parse({
      ...req.body,
      eBookId
    });
    
    const newImage = await storage.addImageToEBook(imageData);
    res.status(201).json(newImage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de imagem inválidos", details: error.errors });
    }
    console.error("Erro ao adicionar imagem:", error);
    res.status(500).json({ error: "Erro ao adicionar imagem ao e-book" });
  }
});

// Atualizar uma imagem de e-book
router.patch("/images/:imageId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const imageId = Number(req.params.imageId);
    const image = await storage.getEBookImage(imageId);
    
    if (!image) {
      return res.status(404).json({ error: "Imagem não encontrada" });
    }
    
    const imageData = insertEBookImageSchema.partial().parse(req.body);
    const updatedImage = await storage.updateEBookImage(imageId, imageData);
    
    res.json(updatedImage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de imagem inválidos", details: error.errors });
    }
    console.error("Erro ao atualizar imagem:", error);
    res.status(500).json({ error: "Erro ao atualizar imagem" });
  }
});

// Remover uma imagem de e-book
router.delete("/images/:imageId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const imageId = Number(req.params.imageId);
    const image = await storage.getEBookImage(imageId);
    
    if (!image) {
      return res.status(404).json({ error: "Imagem não encontrada" });
    }
    
    const deleted = await storage.removeImageFromEBook(imageId);
    
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ error: "Não foi possível remover a imagem" });
    }
  } catch (error) {
    console.error("Erro ao remover imagem:", error);
    res.status(500).json({ error: "Erro ao remover imagem" });
  }
});

// Reordenar imagens de um e-book
router.post("/:id/images/reorder", requireAuth, requireAdmin, async (req, res) => {
  try {
    const eBookId = Number(req.params.id);
    const ebook = await storage.getEBook(eBookId);
    
    if (!ebook) {
      return res.status(404).json({ error: "E-book não encontrado" });
    }
    
    const schema = z.array(z.object({
      imageId: z.number(),
      order: z.number()
    }));
    
    const imageOrder = schema.parse(req.body);
    
    const success = await storage.reorderEBookImages(eBookId, imageOrder);
    
    if (success) {
      const updatedImages = await storage.getEBookImages(eBookId);
      res.json(updatedImages);
    } else {
      res.status(500).json({ error: "Erro ao reordenar imagens" });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de ordenação inválidos", details: error.errors });
    }
    console.error("Erro ao reordenar imagens:", error);
    res.status(500).json({ error: "Erro ao reordenar imagens" });
  }
});

// ==================== Rotas para integração com OpenAI ====================

// Gerar conteúdo para e-book com OpenAI
router.post("/generate-content", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { topic, disciplineId, additionalContext } = z.object({
      topic: z.string().min(3, "O tópico deve ter pelo menos 3 caracteres"),
      disciplineId: z.number({ required_error: "O ID da disciplina é obrigatório" }),
      additionalContext: z.string().optional()
    }).parse(req.body);
    
    // Verificar se a disciplina existe
    const discipline = await storage.getDiscipline(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ error: "Disciplina não encontrada" });
    }
    
    // Gerar conteúdo usando o serviço OpenAI
    const eBookContent = await openaiService.generateEBook(
      topic,
      discipline.name,
      additionalContext
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

// Gerar sugestões de imagens usando OpenAI
router.post("/generate-image-suggestions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description } = z.object({
      title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
      description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres")
    }).parse(req.body);
    
    // Gerar sugestões de imagens usando o serviço OpenAI
    const imageSuggestions = await openaiService.generateImageSuggestions(title, description);
    
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

// ==================== Rotas para integração com Freepik ====================

// Buscar imagens no Freepik
router.get("/freepik-search", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { query, page, limit } = z.object({
      query: z.string().min(3, "O termo de busca deve ter pelo menos 3 caracteres"),
      page: z.string().optional().transform(val => val ? parseInt(val) : 1),
      limit: z.string().optional().transform(val => val ? parseInt(val) : 10)
    }).parse(req.query);
    
    const results = await freepikService.searchImages(query, page, limit);
    
    res.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Parâmetros de busca inválidos", details: error.errors });
    }
    console.error("Erro ao buscar imagens no Freepik:", error);
    res.status(500).json({ error: "Erro ao buscar imagens" });
  }
});

// Gerar imagem com AI usando o Mystic do Freepik
router.post("/freepik-generate-image", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { prompt, style } = z.object({
      prompt: z.string().min(10, "A descrição da imagem deve ter pelo menos 10 caracteres"),
      style: z.string().optional()
    }).parse(req.body);
    
    const result = await freepikService.generateImage(prompt, style);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados inválidos para geração de imagem", details: error.errors });
    }
    console.error("Erro ao gerar imagem com Freepik Mystic:", error);
    res.status(500).json({ error: "Erro ao gerar imagem" });
  }
});

// Melhorar resolução de uma imagem com o upscaler do Freepik
router.post("/freepik-upscale-image", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { imageUrl } = z.object({
      imageUrl: z.string().url("URL da imagem inválida")
    }).parse(req.body);
    
    const result = await freepikService.upscaleImage(imageUrl);
    
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "URL da imagem inválida", details: error.errors });
    }
    console.error("Erro ao melhorar resolução da imagem:", error);
    res.status(500).json({ error: "Erro ao melhorar resolução da imagem" });
  }
});

// Gerar o e-book completo (texto + imagens)
router.post("/generate-complete-ebook", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { topic, disciplineId, additionalContext } = z.object({
      topic: z.string().min(3, "O tópico deve ter pelo menos 3 caracteres"),
      disciplineId: z.number({ required_error: "O ID da disciplina é obrigatório" }),
      additionalContext: z.string().optional()
    }).parse(req.body);
    
    // Verificar se a disciplina existe
    const discipline = await storage.getDiscipline(disciplineId);
    
    if (!discipline) {
      return res.status(404).json({ error: "Disciplina não encontrada" });
    }
    
    // 1. Gerar conteúdo usando o serviço OpenAI
    const eBookData = await openaiService.generateEBook(
      topic,
      discipline.name,
      additionalContext
    );
    
    // 2. Para cada prompt de imagem, gerar uma imagem com o Freepik
    const images = [];
    
    for (const prompt of eBookData.imagePrompts) {
      try {
        // Tentar gerar imagem com o Freepik
        const imageResult = await freepikService.generateImage(prompt);
        
        if (imageResult?.data?.imageUrl) {
          images.push({
            imageUrl: imageResult.data.imageUrl,
            prompt: prompt,
            altText: prompt
          });
        }
      } catch (imageError) {
        console.error(`Erro ao gerar imagem para o prompt "${prompt}":`, imageError);
        // Continuar mesmo se uma imagem falhar
      }
    }
    
    // 3. Criar o e-book no banco de dados
    const newEBook = await storage.createEBook({
      title: eBookData.title,
      description: eBookData.description,
      content: eBookData.content,
      disciplineId,
      status: 'draft',
      isGenerated: true,
      createdById: req.session.user?.id
    });
    
    // 4. Adicionar as imagens geradas ao e-book
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      await storage.addImageToEBook({
        eBookId: newEBook.id,
        imageUrl: image.imageUrl,
        altText: image.prompt,
        caption: image.prompt,
        order: i + 1
      });
    }
    
    // 5. Buscar o e-book completo com imagens
    const completeEBook = await storage.getEBook(newEBook.id);
    
    res.json(completeEBook);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Dados de requisição inválidos", details: error.errors });
    }
    console.error("Erro ao gerar e-book completo:", error);
    res.status(500).json({ error: "Erro ao gerar e-book completo" });
  }
});

export default router;