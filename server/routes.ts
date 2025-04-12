import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertDisciplineSchema, 
  insertCourseSchema, 
  insertCourseDisciplineSchema,
  insertQuestionSchema,
  insertAssessmentSchema,
  insertAssessmentQuestionSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Middleware para garantir que o usuário esteja autenticado
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    next();
  };

  // Middleware para garantir que o usuário seja um administrador
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || req.user.portalType !== "admin") {
      return res.status(403).json({ message: "Acesso restrito a administradores" });
    }
    next();
  };

  // Portal-specific API routes
  app.get("/api/dashboard/:portalType", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const portalType = req.params.portalType;
    const user = req.user;

    if (user.portalType !== portalType) {
      return res.status(403).json({ 
        message: "Access forbidden: You don't have permission to access this portal" 
      });
    }

    // Return dashboard data based on portal type
    let dashboardData: any = {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        portalType: user.portalType,
      }
    };
    
    // We would add specific data for each portal type here
    // This is just the basic structure
    switch (portalType) {
      case "student":
        dashboardData = {
          ...dashboardData,
          stats: {
            progress: 78,
            activeCourses: 3,
            nextPayment: "15/07/2023",
          },
          courses: []
        };
        break;
      case "partner":
        dashboardData = {
          ...dashboardData,
          stats: {
            students: 42,
            commission: 1250.00,
            pendingPayment: 750.00,
          },
          referrals: []
        };
        break;
      case "polo":
        dashboardData = {
          ...dashboardData,
          stats: {
            activeStudents: 126,
            newEnrollments: 15,
            revenue: 24680.00,
          },
          locations: []
        };
        break;
      case "admin":
        dashboardData = {
          ...dashboardData,
          stats: {
            totalUsers: 1528,
            totalInstitutions: 23,
            monthlyRevenue: 156400.00,
          },
          recentActivity: []
        };
        break;
    }

    res.json(dashboardData);
  });

  // ================== Rotas para Disciplinas ==================
  // Listar disciplinas
  app.get("/api/admin/disciplines", requireAdmin, async (req, res) => {
    try {
      const search = req.query.search?.toString();
      const limit = parseInt(req.query.limit?.toString() || "50");
      const offset = parseInt(req.query.offset?.toString() || "0");

      const disciplines = await storage.getDisciplines(search, limit, offset);
      res.json(disciplines);
    } catch (error) {
      console.error("Error fetching disciplines:", error);
      res.status(500).json({ message: "Erro ao buscar disciplinas" });
    }
  });

  // Obter uma disciplina específica
  app.get("/api/admin/disciplines/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const discipline = await storage.getDiscipline(id);
      
      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      res.json(discipline);
    } catch (error) {
      console.error("Error fetching discipline:", error);
      res.status(500).json({ message: "Erro ao buscar disciplina" });
    }
  });

  // Criar uma nova disciplina
  app.post("/api/admin/disciplines", requireAdmin, async (req, res) => {
    try {
      // Validar os dados da disciplina
      const disciplineData = insertDisciplineSchema.parse({ 
        ...req.body,
        createdById: req.user.id
      });
      
      const discipline = await storage.createDiscipline(disciplineData);
      res.status(201).json(discipline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error creating discipline:", error);
      res.status(500).json({ message: "Erro ao criar disciplina" });
    }
  });

  // Atualizar uma disciplina
  app.put("/api/admin/disciplines/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingDiscipline = await storage.getDiscipline(id);
      
      if (!existingDiscipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Validar os dados da atualização
      const updateData = insertDisciplineSchema.partial().parse(req.body);
      
      const updatedDiscipline = await storage.updateDiscipline(id, updateData);
      res.json(updatedDiscipline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating discipline:", error);
      res.status(500).json({ message: "Erro ao atualizar disciplina" });
    }
  });

  // Excluir uma disciplina
  app.delete("/api/admin/disciplines/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDiscipline(id);
      
      if (!success) {
        return res.status(404).json({ message: "Disciplina não encontrada ou não pode ser excluída" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting discipline:", error);
      res.status(500).json({ message: "Erro ao excluir disciplina" });
    }
  });

  // ================== Rotas para Cursos ==================
  // Listar cursos
  app.get("/api/admin/courses", requireAdmin, async (req, res) => {
    try {
      const search = req.query.search?.toString();
      const status = req.query.status?.toString();
      const limit = parseInt(req.query.limit?.toString() || "50");
      const offset = parseInt(req.query.offset?.toString() || "0");

      const courses = await storage.getCourses(search, status, limit, offset);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Erro ao buscar cursos" });
    }
  });

  // Obter um curso específico
  app.get("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Erro ao buscar curso" });
    }
  });

  // Criar um novo curso
  app.post("/api/admin/courses", requireAdmin, async (req, res) => {
    try {
      // Validar os dados do curso
      const courseData = insertCourseSchema.parse({ 
        ...req.body,
        createdById: req.user.id
      });
      
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error creating course:", error);
      res.status(500).json({ message: "Erro ao criar curso" });
    }
  });

  // Atualizar um curso
  app.put("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingCourse = await storage.getCourse(id);
      
      if (!existingCourse) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      // Validar os dados da atualização
      const updateData = insertCourseSchema.partial().parse(req.body);
      
      const updatedCourse = await storage.updateCourse(id, updateData);
      res.json(updatedCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating course:", error);
      res.status(500).json({ message: "Erro ao atualizar curso" });
    }
  });

  // Excluir um curso
  app.delete("/api/admin/courses/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCourse(id);
      
      if (!success) {
        return res.status(404).json({ message: "Curso não encontrado ou não pode ser excluído" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Erro ao excluir curso" });
    }
  });

  // Publicar um curso
  app.post("/api/admin/courses/:id/publish", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingCourse = await storage.getCourse(id);
      
      if (!existingCourse) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      // Verificar se o curso já está publicado
      if (existingCourse.status === "published") {
        return res.status(400).json({ message: "Curso já está publicado" });
      }
      
      const publishedCourse = await storage.publishCourse(id);
      res.json(publishedCourse);
    } catch (error) {
      console.error("Error publishing course:", error);
      res.status(500).json({ message: "Erro ao publicar curso" });
    }
  });

  // ================== Rotas para Disciplinas em Cursos ==================
  // Listar disciplinas de um curso
  app.get("/api/admin/courses/:courseId/disciplines", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const courseDisciplines = await storage.getCourseDisciplines(courseId);
      res.json(courseDisciplines);
    } catch (error) {
      console.error("Error fetching course disciplines:", error);
      res.status(500).json({ message: "Erro ao buscar disciplinas do curso" });
    }
  });

  // Adicionar uma disciplina a um curso
  app.post("/api/admin/courses/:courseId/disciplines", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      
      // Validar os dados
      const courseDisciplineData = insertCourseDisciplineSchema.parse({
        ...req.body,
        courseId,
      });
      
      const newCourseDiscipline = await storage.addDisciplineToCourse(courseDisciplineData);
      res.status(201).json(newCourseDiscipline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error adding discipline to course:", error);
      res.status(500).json({ message: "Erro ao adicionar disciplina ao curso" });
    }
  });

  // Remover uma disciplina de um curso
  app.delete("/api/admin/courses/:courseId/disciplines/:disciplineId", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const disciplineId = parseInt(req.params.disciplineId);
      
      const success = await storage.removeDisciplineFromCourse(courseId, disciplineId);
      
      if (!success) {
        return res.status(404).json({ 
          message: "Disciplina não encontrada no curso ou não pode ser removida" 
        });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error removing discipline from course:", error);
      res.status(500).json({ message: "Erro ao remover disciplina do curso" });
    }
  });

  // Reordenar disciplinas em um curso
  app.put("/api/admin/courses/:courseId/disciplines/reorder", requireAdmin, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const { disciplineOrder } = req.body;
      
      if (!Array.isArray(disciplineOrder)) {
        return res.status(400).json({ 
          message: "O corpo da requisição deve conter um array 'disciplineOrder'"
        });
      }
      
      const success = await storage.reorderCourseDisciplines(courseId, disciplineOrder);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Erro ao reordenar disciplinas"
        });
      }
      
      res.status(200).json({ message: "Disciplinas reordenadas com sucesso" });
    } catch (error) {
      console.error("Error reordering disciplines:", error);
      res.status(500).json({ message: "Erro ao reordenar disciplinas" });
    }
  });

  // ================== Rotas para Portal do Aluno ==================
  // Rotas específicas para o Portal do Aluno estão implementadas abaixo usando o middleware requireStudent

  // ================== Rotas para Conteúdo de Disciplinas ==================
  // Atualizar conteúdo de uma disciplina
  app.put("/api/admin/disciplines/:id/content", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingDiscipline = await storage.getDiscipline(id);
      
      if (!existingDiscipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Validar os dados de conteúdo
      const contentData = insertDisciplineSchema.partial().pick({
        videoAula1Url: true,
        videoAula1Source: true,
        videoAula2Url: true,
        videoAula2Source: true,
        apostilaPdfUrl: true,
        ebookInterativoUrl: true,
        contentStatus: true,
      }).parse(req.body);
      
      const updatedDiscipline = await storage.updateDisciplineContent(id, contentData);
      
      if (!updatedDiscipline) {
        return res.status(500).json({ message: "Erro ao atualizar conteúdo da disciplina" });
      }
      
      // Verificar completude após atualização
      const isComplete = await storage.checkDisciplineCompleteness(id);
      
      res.json({
        discipline: updatedDiscipline,
        isComplete
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating discipline content:", error);
      res.status(500).json({ message: "Erro ao atualizar conteúdo da disciplina" });
    }
  });

  // Verificar completude de uma disciplina
  app.get("/api/admin/disciplines/:id/completeness", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const discipline = await storage.getDiscipline(id);
      
      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      const isComplete = await storage.checkDisciplineCompleteness(id);
      res.json({ isComplete });
    } catch (error) {
      console.error("Error checking discipline completeness:", error);
      res.status(500).json({ message: "Erro ao verificar completude da disciplina" });
    }
  });

  // ================== Rotas para Questões ==================
  // Listar questões de uma disciplina
  app.get("/api/admin/disciplines/:disciplineId/questions", requireAdmin, async (req, res) => {
    try {
      const disciplineId = parseInt(req.params.disciplineId);
      const questions = await storage.getQuestionsByDiscipline(disciplineId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Erro ao buscar questões" });
    }
  });

  // Obter uma questão específica
  app.get("/api/admin/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const question = await storage.getQuestion(id);
      
      if (!question) {
        return res.status(404).json({ message: "Questão não encontrada" });
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ message: "Erro ao buscar questão" });
    }
  });

  // Criar uma nova questão
  app.post("/api/admin/disciplines/:disciplineId/questions", requireAdmin, async (req, res) => {
    try {
      const disciplineId = parseInt(req.params.disciplineId);
      
      // Verificar se a disciplina existe
      const discipline = await storage.getDiscipline(disciplineId);
      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Validar os dados da questão
      const questionData = insertQuestionSchema.parse({
        ...req.body,
        disciplineId,
        createdById: req.user.id
      });
      
      const question = await storage.createQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Erro ao criar questão" });
    }
  });

  // Atualizar uma questão
  app.put("/api/admin/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingQuestion = await storage.getQuestion(id);
      
      if (!existingQuestion) {
        return res.status(404).json({ message: "Questão não encontrada" });
      }
      
      // Validar os dados da atualização
      const updateData = insertQuestionSchema.partial().parse(req.body);
      
      const updatedQuestion = await storage.updateQuestion(id, updateData);
      res.json(updatedQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Erro ao atualizar questão" });
    }
  });

  // Excluir uma questão
  app.delete("/api/admin/questions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteQuestion(id);
      
      if (!success) {
        return res.status(404).json({ message: "Questão não encontrada ou não pode ser excluída" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Erro ao excluir questão" });
    }
  });

  // ================== Rotas para Avaliações ==================
  // Listar avaliações de uma disciplina
  app.get("/api/admin/disciplines/:disciplineId/assessments", requireAdmin, async (req, res) => {
    try {
      const disciplineId = parseInt(req.params.disciplineId);
      const type = req.query.type?.toString();
      const assessments = await storage.getAssessmentsByDiscipline(disciplineId, type);
      res.json(assessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      res.status(500).json({ message: "Erro ao buscar avaliações" });
    }
  });

  // Obter uma avaliação específica
  app.get("/api/admin/assessments/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assessment = await storage.getAssessment(id);
      
      if (!assessment) {
        return res.status(404).json({ message: "Avaliação não encontrada" });
      }
      
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Erro ao buscar avaliação" });
    }
  });

  // Criar uma nova avaliação
  app.post("/api/admin/disciplines/:disciplineId/assessments", requireAdmin, async (req, res) => {
    try {
      const disciplineId = parseInt(req.params.disciplineId);
      
      // Verificar se a disciplina existe
      const discipline = await storage.getDiscipline(disciplineId);
      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Validar os dados da avaliação
      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        disciplineId,
        createdById: req.user.id
      });
      
      const assessment = await storage.createAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error creating assessment:", error);
      res.status(500).json({ message: "Erro ao criar avaliação" });
    }
  });

  // Atualizar uma avaliação
  app.put("/api/admin/assessments/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingAssessment = await storage.getAssessment(id);
      
      if (!existingAssessment) {
        return res.status(404).json({ message: "Avaliação não encontrada" });
      }
      
      // Validar os dados da atualização
      const updateData = insertAssessmentSchema.partial().parse(req.body);
      
      const updatedAssessment = await storage.updateAssessment(id, updateData);
      res.json(updatedAssessment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating assessment:", error);
      res.status(500).json({ message: "Erro ao atualizar avaliação" });
    }
  });

  // Excluir uma avaliação
  app.delete("/api/admin/assessments/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAssessment(id);
      
      if (!success) {
        return res.status(404).json({ message: "Avaliação não encontrada ou não pode ser excluída" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting assessment:", error);
      res.status(500).json({ message: "Erro ao excluir avaliação" });
    }
  });

  // ================== Rotas para Questões em Avaliações ==================
  // Listar questões de uma avaliação
  app.get("/api/admin/assessments/:assessmentId/questions", requireAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      const assessmentQuestions = await storage.getAssessmentQuestions(assessmentId);
      res.json(assessmentQuestions);
    } catch (error) {
      console.error("Error fetching assessment questions:", error);
      res.status(500).json({ message: "Erro ao buscar questões da avaliação" });
    }
  });

  // Adicionar uma questão a uma avaliação
  app.post("/api/admin/assessments/:assessmentId/questions", requireAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      
      // Validar os dados
      const assessmentQuestionData = insertAssessmentQuestionSchema.parse({
        ...req.body,
        assessmentId,
      });
      
      const assessmentQuestion = await storage.addQuestionToAssessment(assessmentQuestionData);
      res.status(201).json(assessmentQuestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error adding question to assessment:", error);
      res.status(500).json({ message: "Erro ao adicionar questão à avaliação" });
    }
  });

  // Remover uma questão de uma avaliação
  app.delete("/api/admin/assessments/:assessmentId/questions/:questionId", requireAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      const questionId = parseInt(req.params.questionId);
      
      const success = await storage.removeQuestionFromAssessment(assessmentId, questionId);
      
      if (!success) {
        return res.status(404).json({ 
          message: "Questão não encontrada na avaliação ou não pode ser removida" 
        });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error removing question from assessment:", error);
      res.status(500).json({ message: "Erro ao remover questão da avaliação" });
    }
  });

  // Reordenar questões em uma avaliação
  app.put("/api/admin/assessments/:assessmentId/questions/reorder", requireAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.assessmentId);
      const { questionOrder } = req.body;
      
      if (!Array.isArray(questionOrder)) {
        return res.status(400).json({ 
          message: "O corpo da requisição deve conter um array 'questionOrder'"
        });
      }
      
      const success = await storage.reorderAssessmentQuestions(assessmentId, questionOrder);
      
      if (!success) {
        return res.status(500).json({ 
          message: "Erro ao reordenar questões"
        });
      }
      
      res.status(200).json({ message: "Questões reordenadas com sucesso" });
    } catch (error) {
      console.error("Error reordering assessment questions:", error);
      res.status(500).json({ message: "Erro ao reordenar questões da avaliação" });
    }
  });

  // === ROTAS DO PORTAL DO ALUNO ===

  // Middleware para autenticar estudantes
  const requireStudent = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    
    if (req.user?.portalType !== "student") {
      return res.status(403).json({ message: "Acesso permitido apenas para estudantes" });
    }
    
    next();
  };

  // Obter todos os cursos do estudante
  app.get("/api/student/courses", requireStudent, async (req, res) => {
    try {
      // Em uma implementação real, filtrar apenas os cursos em que o estudante está matriculado
      // Para este protótipo, retornaremos todos os cursos publicados
      const courses = await storage.getCourses(undefined, "published");
      
      // Adicionar informações de progresso simuladas
      const coursesWithProgress = courses.map(course => ({
        ...course,
        // Simular um progresso aleatório por enquanto
        progress: Math.floor(Math.random() * 101),
        enrolledAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        // Adicionar data da última atualização simulada para ordenação
        updatedAt: new Date(Date.now() - Math.random() * 1000000000).toISOString()
      }));
      
      res.json(coursesWithProgress);
    } catch (error) {
      console.error("Error fetching student courses:", error);
      res.status(500).json({ message: "Erro ao buscar cursos do estudante" });
    }
  });

  // Obter detalhes de um curso específico com suas disciplinas
  app.get("/api/student/courses/:id", requireStudent, async (req, res) => {
    try {
      const courseId = parseInt(req.params.id);
      const course = await storage.getCourse(courseId);
      
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      if (course.status !== "published") {
        return res.status(403).json({ message: "Este curso não está disponível" });
      }
      
      // Buscar disciplinas do curso
      const courseDisciplines = await storage.getCourseDisciplines(courseId);
      
      // Buscar detalhes completos de cada disciplina
      const disciplinePromises = courseDisciplines.map(async (cd) => {
        const discipline = await storage.getDiscipline(cd.disciplineId);
        return {
          ...discipline,
          order: cd.order,
          // Simular progresso para cada disciplina
          progress: Math.floor(Math.random() * 101)
        };
      });
      
      const disciplines = await Promise.all(disciplinePromises);
      
      // Calcular o progresso geral com base no progresso das disciplinas
      const totalProgress = disciplines.length > 0
        ? Math.floor(disciplines.reduce((sum, disc) => sum + (disc.progress || 0), 0) / disciplines.length)
        : 0;
      
      // Retornar curso com detalhes adicionais
      res.json({
        ...course,
        disciplines: disciplines.sort((a, b) => a.order - b.order),
        // Dados simulados para o protótipo
        progress: totalProgress,
        enrolledAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
      });
    } catch (error) {
      console.error("Error fetching student course details:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes do curso" });
    }
  });
  
  // Obter detalhes de uma disciplina específica para o aluno
  app.get("/api/student/disciplines/:id", requireStudent, async (req, res) => {
    try {
      const disciplineId = parseInt(req.params.id);
      const discipline = await storage.getDiscipline(disciplineId);
      
      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      
      // Simular progresso do aluno nesta disciplina
      const progress = Math.floor(Math.random() * 101);
      
      // Retornar disciplina com dados adicionais
      res.json({
        ...discipline,
        progress,
      });
    } catch (error) {
      console.error("Error fetching student discipline:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes da disciplina" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
