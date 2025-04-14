import { Router, Request, Response } from "express";
import { db } from "../db";
import { courses, users, enrollments, polos } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

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

    // Construir a consulta SQL com os filtros
    let query = db
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
      .leftJoin(polos, eq(enrollments.poloId, polos.id));
    
    // Adicionar filtros à consulta
    const conditions = [];
    
    // Filtro de busca
    if (search) {
      conditions.push(sql`(${users.name} LIKE ${'%' + search + '%'} OR ${enrollments.code} LIKE ${'%' + search + '%'} OR ${users.email} LIKE ${'%' + search + '%'})`);
    }
    
    // Filtro de status
    if (status && status !== "all") {
      conditions.push(sql`${enrollments.status} = ${status}`);
    }
    
    // Filtro de curso
    if (course && course !== "all") {
      conditions.push(sql`${enrollments.courseId} = ${parseInt(course as string)}`);
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
      
      conditions.push(sql`${enrollments.enrollmentDate} >= ${startDate.toISOString()} AND ${enrollments.enrollmentDate} <= ${now.toISOString()}`);
    }
    
    // Adicionar as condições à consulta
    if (conditions.length > 0) {
      const whereClause = sql.join(conditions, sql` AND `);
      query = query.where(whereClause);
    }
    
    // Ordenar e limitar resultados
    const enrollmentsData = await query
      .orderBy(sql`${enrollments.enrollmentDate} DESC`)
      .limit(limit)
      .offset(offset);
    
    // Consulta para contar o total de registros
    let countQuery = db
      .select({ count: sql`count(*)` })
      .from(enrollments)
      .leftJoin(users, eq(enrollments.studentId, users.id))
      .leftJoin(courses, eq(enrollments.courseId, courses.id));
    
    // Adicionar as mesmas condições à consulta de contagem
    if (conditions.length > 0) {
      const whereClause = sql.join(conditions, sql` AND `);
      countQuery = countQuery.where(whereClause);
    }
    
    const countResult = await countQuery;
    const totalCount = countResult.length > 0 ? Number(countResult[0].count) : 0;
    
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
      .where(sql`${courses.status} = 'published'`);

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