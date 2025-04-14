import { Router, Request, Response } from "express";
import { db } from "../db";
import { courses, users, enrollments, institutions, polos } from "../../shared/schema";
import { and, eq, like, desc, gte, lte } from "drizzle-orm";

const router = Router();

// Esta rota permite que administradores acessem a funcionalidade de matrículas do polo
router.get("/polo-enrollments", async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é administrador
    if (req.user?.portalType !== "admin") {
      return res.status(403).json({ message: "Acesso restrito a administradores" });
    }

    const { search, status, course, date } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Construir a condição de consulta com base nos filtros
    let whereConditions = [];

    // Filtro de busca (nome do aluno, código ou email)
    if (search) {
      whereConditions.push(
        like(users.name, `%${search}%`),
        like(enrollments.code, `%${search}%`),
        like(users.email, `%${search}%`)
      );
    }

    // Filtro de status
    if (status && status !== "all") {
      whereConditions.push(`${enrollments.status.name} = '${status}'`);
    }

    // Filtro de curso
    if (course && course !== "all") {
      whereConditions.push(`${enrollments.courseId.name} = ${parseInt(course as string)}`);
    }

    // Filtro de data
    if (date && date !== "all") {
      const now = new Date();
      let startDate = new Date();

      switch (date) {
        case "last30days":
          startDate.setDate(now.getDate() - 30);
          break;
        case "last3months":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "last6months":
          startDate.setMonth(now.getMonth() - 6);
          break;
        case "last12months":
          startDate.setMonth(now.getMonth() - 12);
          break;
      }

      whereConditions.push(
        `${enrollments.enrollmentDate.name} >= '${startDate.toISOString()}'`,
        `${enrollments.enrollmentDate.name} <= '${now.toISOString()}'`
      );
    }

    // Consulta para obter matrículas com join em outras tabelas
    const enrollmentsData = await db
      .select({
        id: enrollments.id,
        code: enrollments.code,
        status: enrollments.status,
        enrollmentDate: enrollments.enrollmentDate,
        amount: enrollments.amount,
        paymentMethod: enrollments.paymentMethod,
        paymentUrl: enrollments.paymentUrl,
        studentId: enrollments.studentId,
        studentName: users.name,
        studentEmail: users.email,
        courseId: enrollments.courseId,
        courseName: courses.name,
        poloId: enrollments.poloId,
        poloName: polos.name,
      })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.studentId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(polos, eq(enrollments.poloId, polos.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(enrollments.enrollmentDate))
      .limit(limit)
      .offset(offset);

    // Obter o total de registros para paginação
    const totalCount = await db
      .select({ count: enrollments.id })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.studentId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .then((result) => result.length);

    return res.status(200).json({
      enrollments: enrollmentsData,
      total: totalCount,
      filtered: enrollmentsData.length,
      page,
      limit,
      previousPage: page > 1 ? page - 1 : null,
      nextPage: totalCount > page * limit ? page + 1 : null,
    });
  } catch (error) {
    console.error("Erro ao buscar matrículas:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para obter cursos disponíveis - permitindo acesso de administradores
router.get("/available-courses", async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é administrador
    if (req.user?.portalType !== "admin") {
      return res.status(403).json({ message: "Acesso restrito a administradores" });
    }

    const availableCourses = await db
      .select({
        id: courses.id,
        name: courses.name,
        code: courses.code,
      })
      .from(courses)
      .where(`${courses.status.name} = 'published'`);

    return res.status(200).json(availableCourses);
  } catch (error) {
    console.error("Erro ao buscar cursos disponíveis:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

// Rota para enviar link de pagamento por email - permitindo acesso de administradores
router.post("/polo-enrollments/:id/send-payment-link", async (req: Request, res: Response) => {
  try {
    // Verificar se o usuário é administrador
    if (req.user?.portalType !== "admin") {
      return res.status(403).json({ message: "Acesso restrito a administradores" });
    }
    
    const { id } = req.params;
    const { studentEmail, paymentUrl } = req.body;
    
    if (!studentEmail || !paymentUrl) {
      return res.status(400).json({ message: "Email do aluno e URL de pagamento são obrigatórios" });
    }
    
    // Aqui implementaria o envio real de email
    // Por enquanto apenas simulamos o sucesso
    console.log(`[EMAIL SIMULADO] Link de pagamento enviado para ${studentEmail}: ${paymentUrl}`);
    
    return res.status(200).json({ message: "Email enviado com sucesso" });
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
});

export default router;