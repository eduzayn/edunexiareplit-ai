import express from "express";
import { db } from "../db";
import { 
  certificateTemplates,
  insertCertificateTemplateSchema,
  certificates
} from "@shared/schema";
import { eq, and, desc, inArray, like, isNull } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Listar todos os templates de certificado
router.get("/", async (req, res) => {
  try {
    const templates = await db.query.certificateTemplates.findMany({
      with: {
        institution: true,
        createdBy: true,
      },
      orderBy: [desc(certificateTemplates.createdAt)],
    });
    
    return res.json(templates);
  } catch (error) {
    console.error("Erro ao buscar templates de certificado:", error);
    return res.status(500).json({
      message: "Erro ao buscar templates de certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Buscar template por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await db.query.certificateTemplates.findFirst({
      where: eq(certificateTemplates.id, parseInt(id)),
      with: {
        institution: true,
        createdBy: true,
      },
    });
    
    if (!template) {
      return res.status(404).json({ message: "Template de certificado não encontrado" });
    }
    
    return res.json(template);
  } catch (error) {
    console.error("Erro ao buscar template de certificado:", error);
    return res.status(500).json({
      message: "Erro ao buscar template de certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Criar novo template
router.post("/", validateBody(insertCertificateTemplateSchema), async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id;
    
    // Criar o template
    const [newTemplate] = await db.insert(certificateTemplates).values({
      ...data,
      createdById: userId || null,
    }).returning();
    
    return res.status(201).json(newTemplate);
  } catch (error) {
    console.error("Erro ao criar template de certificado:", error);
    return res.status(500).json({
      message: "Erro ao criar template de certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Atualizar template
router.put("/:id", validateBody(insertCertificateTemplateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const template = await db.query.certificateTemplates.findFirst({
      where: eq(certificateTemplates.id, parseInt(id)),
    });
    
    if (!template) {
      return res.status(404).json({ message: "Template de certificado não encontrado" });
    }
    
    // Verificar se existem certificados usando este template
    const certificatesUsingTemplate = await db.query.certificates.findMany({
      where: and(
        eq(certificates.templateId, parseInt(id)),
        eq(certificates.status, "issued")
      ),
      limit: 1,
    });
    
    if (certificatesUsingTemplate.length > 0) {
      // Podemos permitir atualizações, mas com aviso
      console.warn(`Template ${id} está sendo atualizado, mas já possui certificados emitidos.`);
    }
    
    // Atualizar template
    const [updatedTemplate] = await db.update(certificateTemplates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(certificateTemplates.id, parseInt(id)))
      .returning();
    
    return res.json(updatedTemplate);
  } catch (error) {
    console.error("Erro ao atualizar template de certificado:", error);
    return res.status(500).json({
      message: "Erro ao atualizar template de certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Desativar template
router.post("/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await db.query.certificateTemplates.findFirst({
      where: eq(certificateTemplates.id, parseInt(id)),
    });
    
    if (!template) {
      return res.status(404).json({ message: "Template de certificado não encontrado" });
    }
    
    if (!template.isActive) {
      return res.status(400).json({ message: "Template já está desativado" });
    }
    
    // Desativar template
    const [updatedTemplate] = await db.update(certificateTemplates)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(certificateTemplates.id, parseInt(id)))
      .returning();
    
    return res.json(updatedTemplate);
  } catch (error) {
    console.error("Erro ao desativar template de certificado:", error);
    return res.status(500).json({
      message: "Erro ao desativar template de certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Ativar template
router.post("/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await db.query.certificateTemplates.findFirst({
      where: eq(certificateTemplates.id, parseInt(id)),
    });
    
    if (!template) {
      return res.status(404).json({ message: "Template de certificado não encontrado" });
    }
    
    if (template.isActive) {
      return res.status(400).json({ message: "Template já está ativo" });
    }
    
    // Ativar template
    const [updatedTemplate] = await db.update(certificateTemplates)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(certificateTemplates.id, parseInt(id)))
      .returning();
    
    return res.json(updatedTemplate);
  } catch (error) {
    console.error("Erro ao ativar template de certificado:", error);
    return res.status(500).json({
      message: "Erro ao ativar template de certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Endpoint para listagem rápida apenas dos templates ativos
router.get("/options/active", async (req, res) => {
  try {
    const { institutionId } = req.query;
    
    let query = and(eq(certificateTemplates.isActive, true));
    
    // Filtrar por instituição quando fornecido
    if (institutionId) {
      query = and(
        query,
        eq(certificateTemplates.institutionId, parseInt(institutionId as string))
      );
    }
    
    const activeTemplates = await db.query.certificateTemplates.findMany({
      where: query,
      columns: {
        id: true,
        name: true,
        description: true,
        type: true,
        defaultTitle: true,
        previewImageUrl: true,
        institutionId: true,
      },
      orderBy: [certificateTemplates.name],
    });
    
    return res.json(activeTemplates);
  } catch (error) {
    console.error("Erro ao buscar templates ativos:", error);
    return res.status(500).json({
      message: "Erro ao buscar templates ativos",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;