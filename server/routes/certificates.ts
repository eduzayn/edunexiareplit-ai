import express from "express";
import { db } from "../db";
import { 
  certificates, 
  certificateDisciplines, 
  certificateHistory, 
  certificateSigners, 
  certificateTemplates,
  users, 
  courses, 
  enrollments,
  institutions,
  insertCertificateSchema,
  insertCertificateDisciplineSchema,
  insertCertificateHistorySchema
} from "@shared/schema";
import { eq, and, desc, inArray, like, isNull, isNotNull } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { generateUniqueCode } from "../utils";

const router = express.Router();

// Middleware de autenticação para todas as rotas
router.use(requireAuth);

// Listar todos os certificados
router.get("/", async (req, res) => {
  try {
    const allCertificates = await db.query.certificates.findMany({
      with: {
        student: true,
        course: true,
        institution: true,
        template: true,
        signer: true,
      },
      orderBy: [desc(certificates.createdAt)],
    });
    
    return res.json(allCertificates);
  } catch (error) {
    console.error("Erro ao buscar certificados:", error);
    return res.status(500).json({
      message: "Erro ao buscar certificados",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Buscar certificado por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(id)),
      with: {
        student: true,
        course: true,
        institution: true,
        template: true,
        signer: true,
        disciplines: true,
        history: {
          with: {
            performedBy: true,
          },
          orderBy: [desc(certificateHistory.timestamp)],
        },
      },
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    return res.json(certificate);
  } catch (error) {
    console.error("Erro ao buscar certificado:", error);
    return res.status(500).json({
      message: "Erro ao buscar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Criar novo certificado
router.post("/", validateBody(insertCertificateSchema), async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user?.id;
    
    // Validações adicionais
    const enrollment = await db.query.enrollments.findFirst({
      where: eq(enrollments.id, data.enrollmentId),
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: "Matrícula não encontrada" });
    }
    
    // Verificar se o certificado já existe para esta matrícula
    const existingCertificate = await db.query.certificates.findFirst({
      where: eq(certificates.enrollmentId, data.enrollmentId),
    });
    
    if (existingCertificate) {
      return res.status(400).json({ 
        message: "Já existe um certificado emitido para esta matrícula" 
      });
    }
    
    // Gerar código único para o certificado
    const certificateCode = await generateUniqueCode("CERT", async (code) => {
      const exists = await db.query.certificates.findFirst({
        where: eq(certificates.code, code),
      });
      return !exists;
    });
    
    // Criar o certificado
    const [newCertificate] = await db.insert(certificates).values({
      ...data,
      code: certificateCode,
      createdById: userId || null,
      status: "draft", // Sempre começa como rascunho
    }).returning();
    
    // Registrar histórico
    await db.insert(certificateHistory).values({
      certificateId: newCertificate.id,
      action: "create",
      performedById: userId || null,
      performedByType: "admin",
      timestamp: new Date(),
      details: { message: "Certificado criado com sucesso" },
    });
    
    return res.status(201).json(newCertificate);
  } catch (error) {
    console.error("Erro ao criar certificado:", error);
    return res.status(500).json({
      message: "Erro ao criar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Atualizar certificado
router.put("/:id", validateBody(insertCertificateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user?.id;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(id)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    // Não permitir atualização de certificados já emitidos
    if (certificate.status === "issued") {
      return res.status(400).json({ 
        message: "Não é possível editar certificados já emitidos" 
      });
    }
    
    // Atualizar certificado
    const [updatedCertificate] = await db.update(certificates)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, parseInt(id)))
      .returning();
    
    // Registrar histórico
    await db.insert(certificateHistory).values({
      certificateId: parseInt(id),
      action: "update",
      performedById: userId || null,
      performedByType: "admin",
      timestamp: new Date(),
      details: { 
        message: "Certificado atualizado",
        changedFields: Object.keys(data),
      },
    });
    
    return res.json(updatedCertificate);
  } catch (error) {
    console.error("Erro ao atualizar certificado:", error);
    return res.status(500).json({
      message: "Erro ao atualizar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Emitir certificado (mudar status para issued)
router.post("/:id/issue", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(id)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    if (certificate.status === "issued") {
      return res.status(400).json({ message: "Certificado já foi emitido" });
    }
    
    // Atualizar status do certificado
    const [updatedCertificate] = await db.update(certificates)
      .set({
        status: "issued",
        issueDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, parseInt(id)))
      .returning();
    
    // Registrar histórico
    await db.insert(certificateHistory).values({
      certificateId: parseInt(id),
      action: "issue",
      performedById: userId || null,
      performedByType: "admin",
      timestamp: new Date(),
      details: { message: "Certificado emitido oficialmente" },
    });
    
    return res.json(updatedCertificate);
  } catch (error) {
    console.error("Erro ao emitir certificado:", error);
    return res.status(500).json({
      message: "Erro ao emitir certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Revogar certificado
router.post("/:id/revoke", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(id)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    if (certificate.status !== "issued") {
      return res.status(400).json({ 
        message: "Apenas certificados emitidos podem ser revogados" 
      });
    }
    
    // Atualizar status do certificado
    const [updatedCertificate] = await db.update(certificates)
      .set({
        status: "revoked",
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, parseInt(id)))
      .returning();
    
    // Registrar histórico
    await db.insert(certificateHistory).values({
      certificateId: parseInt(id),
      action: "revoke",
      performedById: userId || null,
      performedByType: "admin",
      timestamp: new Date(),
      details: { 
        message: "Certificado revogado",
        reason: reason || "Não especificado" 
      },
    });
    
    return res.json(updatedCertificate);
  } catch (error) {
    console.error("Erro ao revogar certificado:", error);
    return res.status(500).json({
      message: "Erro ao revogar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Gerenciar disciplinas do certificado

// Adicionar disciplina ao certificado
router.post("/:id/disciplines", validateBody(insertCertificateDisciplineSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.id, parseInt(id)),
    });
    
    if (!certificate) {
      return res.status(404).json({ message: "Certificado não encontrado" });
    }
    
    if (certificate.status === "issued") {
      return res.status(400).json({ 
        message: "Não é possível editar disciplinas de certificados já emitidos" 
      });
    }
    
    // Adicionar disciplina
    const [newDiscipline] = await db.insert(certificateDisciplines).values({
      ...data,
      certificateId: parseInt(id),
    }).returning();
    
    return res.status(201).json(newDiscipline);
  } catch (error) {
    console.error("Erro ao adicionar disciplina ao certificado:", error);
    return res.status(500).json({
      message: "Erro ao adicionar disciplina ao certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Atualizar disciplina do certificado
router.put("/disciplines/:disciplineId", validateBody(insertCertificateDisciplineSchema), async (req, res) => {
  try {
    const { disciplineId } = req.params;
    const data = req.body;
    
    const discipline = await db.query.certificateDisciplines.findFirst({
      where: eq(certificateDisciplines.id, parseInt(disciplineId)),
      with: {
        certificate: true,
      },
    });
    
    if (!discipline) {
      return res.status(404).json({ message: "Disciplina não encontrada" });
    }
    
    if (discipline.certificate.status === "issued") {
      return res.status(400).json({ 
        message: "Não é possível editar disciplinas de certificados já emitidos" 
      });
    }
    
    // Atualizar disciplina
    const [updatedDiscipline] = await db.update(certificateDisciplines)
      .set(data)
      .where(eq(certificateDisciplines.id, parseInt(disciplineId)))
      .returning();
    
    return res.json(updatedDiscipline);
  } catch (error) {
    console.error("Erro ao atualizar disciplina do certificado:", error);
    return res.status(500).json({
      message: "Erro ao atualizar disciplina do certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Remover disciplina do certificado
router.delete("/disciplines/:disciplineId", async (req, res) => {
  try {
    const { disciplineId } = req.params;
    
    const discipline = await db.query.certificateDisciplines.findFirst({
      where: eq(certificateDisciplines.id, parseInt(disciplineId)),
      with: {
        certificate: true,
      },
    });
    
    if (!discipline) {
      return res.status(404).json({ message: "Disciplina não encontrada" });
    }
    
    if (discipline.certificate.status === "issued") {
      return res.status(400).json({ 
        message: "Não é possível remover disciplinas de certificados já emitidos" 
      });
    }
    
    // Remover disciplina
    await db.delete(certificateDisciplines)
      .where(eq(certificateDisciplines.id, parseInt(disciplineId)));
    
    return res.json({ message: "Disciplina removida com sucesso" });
  } catch (error) {
    console.error("Erro ao remover disciplina do certificado:", error);
    return res.status(500).json({
      message: "Erro ao remover disciplina do certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Buscar alunos elegíveis para certificação
router.get("/eligible-students", async (req, res) => {
  try {
    // Obter matrículas concluídas
    const completedEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.status, "completed"),
      with: {
        student: true,
        course: true,
        institution: true,
        polo: true,
      },
    });
    
    // Verificar quais matrículas ainda não possuem certificados
    const certificatedEnrollmentIds = await db.select({ 
      enrollmentId: certificates.enrollmentId 
    })
    .from(certificates);
    
    const enrollmentIdsWithCertificates = certificatedEnrollmentIds.map(c => c.enrollmentId);
    
    // Filtrar matrículas que ainda não possuem certificados
    const eligibleStudents = completedEnrollments.filter(
      enrollment => !enrollmentIdsWithCertificates.includes(enrollment.id)
    );
    
    return res.json(eligibleStudents);
  } catch (error) {
    console.error("Erro ao buscar alunos elegíveis para certificação:", error);
    return res.status(500).json({
      message: "Erro ao buscar alunos elegíveis para certificação",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Verificar certificado (acesso público)
router.get("/verify/:code", async (req, res) => {
  try {
    const { code } = req.params;
    
    const certificate = await db.query.certificates.findFirst({
      where: eq(certificates.code, code),
      with: {
        student: {
          columns: {
            id: true,
            fullName: true,
            cpf: true,
            email: true,
          }
        },
        course: true,
        institution: true,
        disciplines: true,
      },
    });
    
    if (!certificate) {
      return res.status(404).json({ 
        valid: false,
        message: "Certificado não encontrado" 
      });
    }
    
    // Registrar verificação no histórico (opcional)
    await db.insert(certificateHistory).values({
      certificateId: certificate.id,
      action: "verify",
      performedByType: "system",
      timestamp: new Date(),
      details: { 
        message: "Certificado verificado publicamente",
        ipAddress: req.ip
      },
    });
    
    return res.json({
      valid: certificate.status === "issued",
      status: certificate.status,
      certificate: {
        code: certificate.code,
        student: certificate.student,
        course: certificate.course,
        institution: certificate.institution,
        issueDate: certificate.issueDate,
        expirationDate: certificate.expirationDate,
      }
    });
  } catch (error) {
    console.error("Erro ao verificar certificado:", error);
    return res.status(500).json({
      valid: false,
      message: "Erro ao verificar certificado",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;