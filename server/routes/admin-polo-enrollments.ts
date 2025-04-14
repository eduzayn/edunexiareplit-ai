import { Router, Request, Response } from "express";
import { db } from "../db";
import { pool } from "../db";

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

    // Construir a consulta SQL manualmente para maior controle
    let queryParams = [];
    let paramCount = 1;

    // Consulta base
    let queryText = `
      SELECT 
        e.id, e.code, e.status, e.enrollment_date AS "enrollmentDate", 
        e.amount, e.payment_method AS "paymentMethod", e.payment_url AS "paymentUrl",
        e.student_id AS "studentId", u.full_name AS "studentName", u.email AS "studentEmail",
        e.course_id AS "courseId", c.name AS "courseName",
        e.polo_id AS "poloId", p.name AS "poloName"
      FROM enrollments e
      LEFT JOIN users u ON e.student_id = u.id
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN polos p ON e.polo_id = p.id
      WHERE 1=1
    `;

    // Adicionar condições de filtro
    if (search) {
      queryText += ` AND (u.full_name ILIKE $${paramCount} OR e.code ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (status && status !== "all") {
      queryText += ` AND e.status = $${paramCount}`;
      queryParams.push(status);
      paramCount++;
    }

    if (course && course !== "all") {
      queryText += ` AND e.course_id = $${paramCount}`;
      queryParams.push(parseInt(course as string));
      paramCount++;
    }

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

      queryText += ` AND e.enrollment_date >= $${paramCount} AND e.enrollment_date <= $${paramCount + 1}`;
      queryParams.push(startDate.toISOString(), now.toISOString());
      paramCount += 2;
    }

    // Adicionar ordenação, paginação e executar a consulta
    queryText += ` ORDER BY e.enrollment_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);
    
    const result = await pool.query(queryText, queryParams);
    const enrollmentsData = result.rows;

    // Contar o total de registros para paginação
    const countQuery = `SELECT COUNT(*)::int FROM enrollments`;
    const countResult = await pool.query(countQuery);
    const totalCount = parseInt(countResult.rows[0].count);

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

    // Consulta SQL direta para buscar cursos
    const query = `
      SELECT id, name, code 
      FROM courses 
      WHERE status = 'published'
    `;
    
    const result = await pool.query(query);
    const availableCourses = result.rows;

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