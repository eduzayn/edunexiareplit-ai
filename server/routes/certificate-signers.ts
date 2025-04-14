import express from "express";
import { db } from "../db";
import { 
  certificateSigners,
  insertCertificateSignerSchema,
  certificates
} from "@shared/schema";
import { eq, and, desc, inArray, like, isNull } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Listar todos os signatários
router.get("/", async (req, res) => {
  try {
    const signers = await db.query.certificateSigners.findMany({
      with: {
        institution: true,
        createdBy: true,
      },
      orderBy: [desc(certificateSigners.createdAt)],
    });
    
    return res.json(signers);
  } catch (error) {
    console.error("Erro ao buscar signatários de certificados:", error);
    return res.status(500).json({
      message: "Erro ao buscar signatários de certificados",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Buscar signatário por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const signer = await db.query.certificateSigners.findFirst({
      where: eq(certificateSigners.id, parseInt(id)),
      with: {
        institution: true,
        createdBy: true,
      },
    });
    
    if (!signer) {
      return res.status(404).json({ message: "Signatário não encontrado" });
    }
    
    return res.json(signer);
  } catch (error) {
    console.error("Erro ao buscar signatário:", error);
    return res.status(500).json({
      message: "Erro ao buscar signatário",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Criar novo signatário
router.post("/", validateBody(insertCertificateSignerSchema), async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id;
    
    // Criar o signatário
    const [newSigner] = await db.insert(certificateSigners).values({
      ...data,
      createdById: userId || null,
    }).returning();
    
    return res.status(201).json(newSigner);
  } catch (error) {
    console.error("Erro ao criar signatário:", error);
    return res.status(500).json({
      message: "Erro ao criar signatário",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Atualizar signatário
router.put("/:id", validateBody(insertCertificateSignerSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const signer = await db.query.certificateSigners.findFirst({
      where: eq(certificateSigners.id, parseInt(id)),
    });
    
    if (!signer) {
      return res.status(404).json({ message: "Signatário não encontrado" });
    }
    
    // Verificar se existem certificados usando este signatário
    const certificatesUsingSigner = await db.query.certificates.findMany({
      where: and(
        eq(certificates.signerId, parseInt(id)),
        eq(certificates.status, "issued")
      ),
      limit: 1,
    });
    
    if (certificatesUsingSigner.length > 0) {
      // Podemos permitir atualizações, mas com aviso
      console.warn(`Signatário ${id} está sendo atualizado, mas já possui certificados emitidos.`);
    }
    
    // Atualizar signatário
    const [updatedSigner] = await db.update(certificateSigners)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(certificateSigners.id, parseInt(id)))
      .returning();
    
    return res.json(updatedSigner);
  } catch (error) {
    console.error("Erro ao atualizar signatário:", error);
    return res.status(500).json({
      message: "Erro ao atualizar signatário",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Desativar signatário
router.post("/:id/deactivate", async (req, res) => {
  try {
    const { id } = req.params;
    
    const signer = await db.query.certificateSigners.findFirst({
      where: eq(certificateSigners.id, parseInt(id)),
    });
    
    if (!signer) {
      return res.status(404).json({ message: "Signatário não encontrado" });
    }
    
    if (!signer.isActive) {
      return res.status(400).json({ message: "Signatário já está desativado" });
    }
    
    // Desativar signatário
    const [updatedSigner] = await db.update(certificateSigners)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(certificateSigners.id, parseInt(id)))
      .returning();
    
    return res.json(updatedSigner);
  } catch (error) {
    console.error("Erro ao desativar signatário:", error);
    return res.status(500).json({
      message: "Erro ao desativar signatário",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Ativar signatário
router.post("/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    
    const signer = await db.query.certificateSigners.findFirst({
      where: eq(certificateSigners.id, parseInt(id)),
    });
    
    if (!signer) {
      return res.status(404).json({ message: "Signatário não encontrado" });
    }
    
    if (signer.isActive) {
      return res.status(400).json({ message: "Signatário já está ativo" });
    }
    
    // Ativar signatário
    const [updatedSigner] = await db.update(certificateSigners)
      .set({
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(certificateSigners.id, parseInt(id)))
      .returning();
    
    return res.json(updatedSigner);
  } catch (error) {
    console.error("Erro ao ativar signatário:", error);
    return res.status(500).json({
      message: "Erro ao ativar signatário",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Endpoint para listagem rápida apenas dos signatários ativos
router.get("/options/active", async (req, res) => {
  try {
    const { institutionId } = req.query;
    
    let query = and(eq(certificateSigners.isActive, true));
    
    // Filtrar por instituição quando fornecido
    if (institutionId) {
      query = and(
        query,
        eq(certificateSigners.institutionId, parseInt(institutionId as string))
      );
    }
    
    const activeSigners = await db.query.certificateSigners.findMany({
      where: query,
      columns: {
        id: true,
        name: true,
        role: true,
        signatureImageUrl: true,
        institutionId: true,
      },
      orderBy: [certificateSigners.name],
    });
    
    return res.json(activeSigners);
  } catch (error) {
    console.error("Erro ao buscar signatários ativos:", error);
    return res.status(500).json({
      message: "Erro ao buscar signatários ativos",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;