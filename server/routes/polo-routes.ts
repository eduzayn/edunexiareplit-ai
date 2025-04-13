import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requirePolo } from "../middleware/auth";
import { eq, and, like, desc, asc, or, sql } from "drizzle-orm";
import { polos, users, courses, enrollments } from "@shared/schema";

const router = Router();

// Middleware para garantir que apenas usuários do tipo polo possam acessar estas rotas
router.use(requirePolo);

// Rota para obter dados do dashboard do polo
router.get("/dashboard", async (req, res) => {
  try {
    const poloUser = req.user;

    // Verificar se o usuário polo tem um polo associado
    const userPolo = await storage.getPoloByCode(poloUser?.username || "");
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Obter resumo de alunos
    const students = await storage.getEnrollments(
      undefined, 
      undefined, 
      undefined, 
      undefined, 
      userPolo.id
    );

    // Calcular estatísticas
    const activeStudents = students.filter(s => s.status === "active").length;
    const newStudentsThisMonth = students.filter(s => {
      const enrollmentDate = new Date(s.createdAt);
      const now = new Date();
      return enrollmentDate.getMonth() === now.getMonth() &&
             enrollmentDate.getFullYear() === now.getFullYear();
    }).length;

    // Dados de transações financeiras
    const financialData = {
      totalRevenue: students.reduce((total, s) => total + (s.amount || 0), 0),
      pendingPayments: students.filter(s => s.status === "pending_payment").length,
    };

    // Retornar dados do dashboard
    return res.json({
      poloInfo: userPolo,
      studentsStats: {
        total: students.length,
        active: activeStudents,
        newThisMonth: newStudentsThisMonth
      },
      financialStats: financialData,
      // Dados simulados para mostrar no dashboard
      unitPerformance: [
        { unit: "São Paulo - Centro", students: 48, target: 50, progress: 96, revenue: 9600 },
        { unit: "São Paulo - Zona Sul", students: 36, target: 40, progress: 90, revenue: 7200 },
        { unit: "Campinas", students: 30, target: 30, progress: 100, revenue: 6000 },
        { unit: "Ribeirão Preto", students: 12, target: 20, progress: 60, revenue: 1880 }
      ],
      recentEnrollments: students
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    });
  } catch (error) {
    console.error("Erro ao obter dados do dashboard do polo:", error);
    return res.status(500).json({ message: "Erro ao carregar dados do dashboard" });
  }
});

// Rota para obter configurações do polo
router.get("/settings", async (req, res) => {
  try {
    const poloUser = req.user;

    // Obter dados do polo
    const userPolo = await storage.getPoloByCode(poloUser?.username || "");
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Obter configurações de vendas
    const salesLinkConfig = {
      enabled: true, // Default é habilitar
      customSlug: userPolo.code.toLowerCase(),
      autoApproveEnrollments: false,
      trackReferrals: true,
      commission: 10 // Comissão padrão de 10%
    };

    // Obter permissões de cursos
    const coursePermissions = {
      allCourses: true,
      selectedCourses: [] // IDs dos cursos permitidos
    };

    return res.json({
      ...userPolo,
      salesLink: salesLinkConfig,
      coursePermissions: coursePermissions
    });
  } catch (error) {
    console.error("Erro ao obter configurações do polo:", error);
    return res.status(500).json({ message: "Erro ao carregar configurações do polo" });
  }
});

// Rota para atualizar configurações do polo
router.patch("/settings", async (req, res) => {
  try {
    const poloUser = req.user;
    const poloData = req.body;

    // Obter o polo atual
    const userPolo = await storage.getPoloByCode(poloUser?.username || "");
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Atualizar dados do polo
    const updatedPolo = await storage.updatePolo(userPolo.id, {
      name: poloData.name,
      managerName: poloData.managerName,
      email: poloData.email,
      phone: poloData.phone,
      address: poloData.address,
      city: poloData.city,
      state: poloData.state,
      postalCode: poloData.postalCode,
      status: poloData.status,
      capacity: poloData.capacity
    });

    return res.json(updatedPolo);
  } catch (error) {
    console.error("Erro ao atualizar configurações do polo:", error);
    return res.status(500).json({ message: "Erro ao atualizar configurações do polo" });
  }
});

// Rota para atualizar configurações de links de vendas
router.patch("/sales-link", async (req, res) => {
  try {
    const poloUser = req.user;
    const salesLinkData = req.body;

    // Obter o polo atual
    const userPolo = await storage.getPoloByCode(poloUser?.username || "");
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Aqui seria implementada a lógica para atualizar as configurações de links de vendas
    // Como estas configurações não estão no modelo de dados original, iríamos estender o modelo

    return res.json({
      enabled: salesLinkData.enabled,
      customSlug: salesLinkData.customSlug || userPolo.code.toLowerCase(),
      autoApproveEnrollments: salesLinkData.autoApproveEnrollments,
      trackReferrals: salesLinkData.trackReferrals,
      commission: salesLinkData.commission
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações de links de vendas:", error);
    return res.status(500).json({ message: "Erro ao atualizar configurações de links de vendas" });
  }
});

// Rota para atualizar permissões de cursos
router.patch("/course-permissions", async (req, res) => {
  try {
    const poloUser = req.user;
    const permissions = req.body;

    // Obter o polo atual
    const userPolo = await storage.getPoloByCode(poloUser?.username || "");
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Aqui seria implementada a lógica para atualizar as permissões de cursos
    // Como estas permissões não estão no modelo de dados original, iríamos estender o modelo

    return res.json({
      allCourses: permissions.allCourses,
      selectedCourses: permissions.selectedCourses || []
    });
  } catch (error) {
    console.error("Erro ao atualizar permissões de cursos:", error);
    return res.status(500).json({ message: "Erro ao atualizar permissões de cursos" });
  }
});

// Rota para obter cursos disponíveis
router.get("/available-courses", async (req, res) => {
  try {
    // Obter todos os cursos publicados
    const courses = await storage.getCourses(undefined, "published");
    
    return res.json(courses.map(course => ({
      id: course.id,
      name: course.name,
      status: course.status
    })));
  } catch (error) {
    console.error("Erro ao obter cursos disponíveis:", error);
    return res.status(500).json({ message: "Erro ao carregar cursos disponíveis" });
  }
});

// Rota para listar alunos vinculados ao polo
router.get("/students", async (req, res) => {
  try {
    const poloUser = req.user;
    const { search, status, course } = req.query;

    // Obter o polo atual
    const userPolo = await storage.getPoloByCode(poloUser?.username || "");
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Obter matrículas vinculadas ao polo
    const enrollments = await storage.getEnrollments(
      search as string, 
      status as string, 
      undefined, 
      course ? parseInt(course as string) : undefined,
      userPolo.id
    );

    // Mapear matrículas para formato de estudantes
    const students = await Promise.all(enrollments.map(async enrollment => {
      // Obter dados do aluno
      const student = await storage.getUser(enrollment.studentId);
      
      // Obter dados do curso
      const course = await storage.getCourse(enrollment.courseId);
      
      // Formatação simplificada para demonstração
      return {
        id: student?.id,
        name: student?.fullName || "Nome não disponível",
        email: student?.email || "Email não disponível",
        phone: student?.phone || "Telefone não disponível",
        enrollmentDate: enrollment.createdAt,
        status: enrollment.status,
        courseName: course?.name || "Curso não disponível",
        courseProgress: enrollment.progress || 0,
        lastPaymentDate: enrollment.lastPaymentDate,
        paymentStatus: enrollment.paymentStatus,
      };
    }));

    // Obter lista de cursos para filtros
    const availableCourses = await storage.getCourses(undefined, "published");
    const courseNames = availableCourses.map(course => course.name);

    return res.json({
      students,
      total: students.length,
      filtered: students.length,
      courses: courseNames
    });
  } catch (error) {
    console.error("Erro ao listar alunos:", error);
    return res.status(500).json({ message: "Erro ao carregar lista de alunos" });
  }
});

// Rota para obter relatórios
router.get("/reports", async (req, res) => {
  try {
    const poloUser = req.user;
    const { search, course, status, date, startDate, endDate } = req.query;

    // Obter o polo atual
    const userPolo = await storage.getPoloByCode(poloUser?.username || "");
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Definir intervalo de datas com base no filtro
    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (date) {
      const now = new Date();
      dateEnd = now;
      
      switch(date) {
        case 'last30days':
          dateStart = new Date(now.setDate(now.getDate() - 30));
          break;
        case 'last3months':
          dateStart = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'last6months':
          dateStart = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case 'last12months':
          dateStart = new Date(now.setMonth(now.getMonth() - 12));
          break;
        case 'custom':
          if (startDate) dateStart = new Date(startDate as string);
          if (endDate) dateEnd = new Date(endDate as string);
          break;
      }
    }

    // Obter matrículas vinculadas ao polo com filtros
    const enrollments = await storage.getEnrollments(
      search as string, 
      status as string, 
      undefined, 
      course ? parseInt(course as string) : undefined,
      userPolo.id,
      undefined,
      undefined,
      dateStart,
      dateEnd
    );

    // Obter dados dos alunos e cursos
    const studentsData = await Promise.all(enrollments.map(async enrollment => {
      const student = await storage.getUser(enrollment.studentId);
      const course = await storage.getCourse(enrollment.courseId);
      
      return {
        id: student?.id,
        name: student?.fullName || "Nome não disponível",
        email: student?.email || "Email não disponível",
        course: course?.name || "Curso não disponível",
        status: enrollment.status,
        enrollmentDate: enrollment.createdAt,
        progress: enrollment.progress || 0
      };
    }));

    // Calcular estatísticas de matrículas por mês
    const enrollmentsByMonth = [
      { month: "Jan", enrollments: 0 },
      { month: "Fev", enrollments: 0 },
      { month: "Mar", enrollments: 0 },
      { month: "Abr", enrollments: 0 },
      { month: "Mai", enrollments: 0 },
      { month: "Jun", enrollments: 0 },
      { month: "Jul", enrollments: 0 },
      { month: "Ago", enrollments: 0 },
      { month: "Set", enrollments: 0 },
      { month: "Out", enrollments: 0 },
      { month: "Nov", enrollments: 0 },
      { month: "Dez", enrollments: 0 }
    ];

    // Calcular estatísticas de receita por mês
    const revenueByMonth = [
      { month: "Jan", revenue: 0 },
      { month: "Fev", revenue: 0 },
      { month: "Mar", revenue: 0 },
      { month: "Abr", revenue: 0 },
      { month: "Mai", revenue: 0 },
      { month: "Jun", revenue: 0 },
      { month: "Jul", revenue: 0 },
      { month: "Ago", revenue: 0 },
      { month: "Set", revenue: 0 },
      { month: "Out", revenue: 0 },
      { month: "Nov", revenue: 0 },
      { month: "Dez", revenue: 0 }
    ];

    // Preencher dados de estatísticas
    enrollments.forEach(enrollment => {
      const enrollmentDate = new Date(enrollment.createdAt);
      const monthIndex = enrollmentDate.getMonth();
      
      enrollmentsByMonth[monthIndex].enrollments += 1;
      revenueByMonth[monthIndex].revenue += enrollment.amount || 0;
    });

    // Estatísticas por curso
    const coursesData: { [key: string]: { id: number, name: string, students: number, revenue: number } } = {};
    
    await Promise.all(enrollments.map(async enrollment => {
      const course = await storage.getCourse(enrollment.courseId);
      if (course) {
        if (!coursesData[course.id]) {
          coursesData[course.id] = {
            id: course.id,
            name: course.name,
            students: 0,
            revenue: 0
          };
        }
        
        coursesData[course.id].students += 1;
        coursesData[course.id].revenue += enrollment.amount || 0;
      }
    }));

    // Formatação dos dados do relatório
    return res.json({
      students: {
        total: studentsData.length,
        active: studentsData.filter(s => s.status === "active").length,
        inactive: studentsData.filter(s => s.status !== "active").length,
        newThisMonth: studentsData.filter(s => {
          const date = new Date(s.enrollmentDate);
          const now = new Date();
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length,
        list: studentsData
      },
      enrollment: {
        totalEnrollments: enrollments.length,
        completedEnrollments: enrollments.filter(e => e.status === "completed").length,
        activeEnrollments: enrollments.filter(e => e.status === "active").length,
        inactiveEnrollments: enrollments.filter(e => e.status === "inactive" || e.status === "cancelled").length,
        byMonth: enrollmentsByMonth
      },
      financial: {
        totalRevenue: enrollments.reduce((sum, e) => sum + (e.amount || 0), 0),
        pendingPayments: enrollments.filter(e => e.status === "pending_payment").reduce((sum, e) => sum + (e.amount || 0), 0),
        completedPayments: enrollments.filter(e => e.status !== "pending_payment").reduce((sum, e) => sum + (e.amount || 0), 0),
        byMonth: revenueByMonth
      },
      courses: {
        list: Object.values(coursesData)
      }
    });
  } catch (error) {
    console.error("Erro ao gerar relatórios:", error);
    return res.status(500).json({ message: "Erro ao gerar relatórios" });
  }
});

// Rota para listar links de vendas
router.get("/sales-links", async (req, res) => {
  try {
    const poloUser = req.user;

    // Obter o polo atual
    const userPolo = await storage.getPoloByCode(poloUser?.username || "");
    if (!userPolo) {
      return res.status(404).json({ message: "Polo não encontrado para este usuário" });
    }

    // Como não temos uma tabela de links de vendas no modelo atual,
    // retornamos um exemplo de implementação que seria estendido
    // com uma nova tabela no banco de dados
    
    // Link principal (default)
    const mainLink = {
      id: 1,
      name: "Link Principal",
      slug: userPolo.code.toLowerCase(),
      url: `${req.protocol}://${req.get('host')}/inscrever?polo=${userPolo.code.toLowerCase()}`,
      status: "active",
      created: new Date().toISOString().split('T')[0],
      autoApprove: true,
      commission: 10,
      visits: 0,
      conversions: 0,
      revenue: 0
    };
    
    return res.json({
      links: [mainLink],
      totalVisits: 0,
      totalConversions: 0,
      totalRevenue: 0,
      conversionRate: 0,
      avgCommission: 10
    });
  } catch (error) {
    console.error("Erro ao listar links de vendas:", error);
    return res.status(500).json({ message: "Erro ao carregar links de vendas" });
  }
});

export default router;