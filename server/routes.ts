import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertDisciplineSchema, insertCourseSchema, insertCourseDisciplineSchema } from "@shared/schema";
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

  const httpServer = createServer(app);

  return httpServer;
}
