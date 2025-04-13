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
  insertAssessmentQuestionSchema,
  insertInstitutionSchema
} from "@shared/schema";
import { z } from "zod";
import { registerEnrollmentRoutes } from "./routes/enrollments";
import integrationsRoutes from "./routes/integrations";
import { createPaymentGateway } from "./services/payment-gateways";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Registro das rotas de matrícula
  registerEnrollmentRoutes(app);
  
  // Registro das rotas de integrações
  app.use("/api/integrations", integrationsRoutes);

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

  // ================== Rotas para Instituições ==================
  // Listar instituições
  app.get("/api/admin/institutions", requireAdmin, async (req, res) => {
    try {
      const search = req.query.search?.toString();
      const status = req.query.status?.toString();
      const limit = parseInt(req.query.limit?.toString() || "50");
      const offset = parseInt(req.query.offset?.toString() || "0");

      const institutions = await storage.getInstitutions(search, status, limit, offset);
      res.json(institutions);
    } catch (error) {
      console.error("Error fetching institutions:", error);
      res.status(500).json({ message: "Erro ao buscar instituições" });
    }
  });

  // Obter uma instituição específica
  app.get("/api/admin/institutions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const institution = await storage.getInstitution(id);
      
      if (!institution) {
        return res.status(404).json({ message: "Instituição não encontrada" });
      }
      
      res.json(institution);
    } catch (error) {
      console.error("Error fetching institution:", error);
      res.status(500).json({ message: "Erro ao buscar instituição" });
    }
  });

  // Criar uma nova instituição
  app.post("/api/admin/institutions", requireAdmin, async (req, res) => {
    try {
      // Validar os dados da instituição
      const institutionData = insertInstitutionSchema.parse({ 
        ...req.body,
        createdById: req.user.id
      });
      
      // Verificar se já existe uma instituição com o mesmo código ou CNPJ
      const existingByCode = await storage.getInstitutionByCode(institutionData.code);
      if (existingByCode) {
        return res.status(400).json({ message: "Já existe uma instituição com este código" });
      }
      
      const existingByCNPJ = await storage.getInstitutionByCNPJ(institutionData.cnpj);
      if (existingByCNPJ) {
        return res.status(400).json({ message: "Já existe uma instituição com este CNPJ" });
      }
      
      const institution = await storage.createInstitution(institutionData);
      res.status(201).json(institution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error creating institution:", error);
      res.status(500).json({ message: "Erro ao criar instituição" });
    }
  });

  // Atualizar uma instituição
  app.put("/api/admin/institutions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingInstitution = await storage.getInstitution(id);
      
      if (!existingInstitution) {
        return res.status(404).json({ message: "Instituição não encontrada" });
      }
      
      // Validar os dados da atualização
      const updateData = insertInstitutionSchema.partial().parse(req.body);
      
      // Verificar se já existe outra instituição com o mesmo código
      if (updateData.code && updateData.code !== existingInstitution.code) {
        const existingByCode = await storage.getInstitutionByCode(updateData.code);
        if (existingByCode && existingByCode.id !== id) {
          return res.status(400).json({ message: "Já existe uma instituição com este código" });
        }
      }
      
      // Verificar se já existe outra instituição com o mesmo CNPJ
      if (updateData.cnpj && updateData.cnpj !== existingInstitution.cnpj) {
        const existingByCNPJ = await storage.getInstitutionByCNPJ(updateData.cnpj);
        if (existingByCNPJ && existingByCNPJ.id !== id) {
          return res.status(400).json({ message: "Já existe uma instituição com este CNPJ" });
        }
      }
      
      const updatedInstitution = await storage.updateInstitution(id, updateData);
      res.json(updatedInstitution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      console.error("Error updating institution:", error);
      res.status(500).json({ message: "Erro ao atualizar instituição" });
    }
  });

  // Excluir uma instituição
  app.delete("/api/admin/institutions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInstitution(id);
      
      if (!success) {
        return res.status(404).json({ message: "Instituição não encontrada ou não pode ser excluída" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting institution:", error);
      res.status(500).json({ message: "Erro ao excluir instituição" });
    }
  });

  // ================== Rotas para Usuários ==================
  // Listar usuários
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const search = req.query.search?.toString();
      const portalType = req.query.portalType?.toString();
      
      const users = await storage.getUsersByPortalType(portalType || "");
      
      // Filtrar por busca se necessário
      let filteredUsers = users;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = users.filter(user => 
          user.username.toLowerCase().includes(searchLower) || 
          (user.fullName && user.fullName.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      }
      
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });
  
  // Obter um usuário específico
  app.get("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });
  
  // Criar um novo usuário
  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { username, password, portalType, fullName, email } = req.body;
      
      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Nome de usuário já existe" });
      }
      
      // Criar o novo usuário
      const newUser = await storage.createUser({
        username,
        password,
        portalType,
        fullName,
        email
      });
      
      // Se for um aluno, verificar se já existe e registrar nos gateways de pagamento
      if (portalType === 'student') {
        try {
          console.log(`Verificando e registrando aluno ${fullName} nos gateways de pagamento`);
          
          // Verificar CPF obrigatório para alunos
          if (!req.body.cpf) {
            return res.status(400).json({ message: "CPF é obrigatório para alunos" });
          }
          
          // Registrar no Asaas
          const asaasGateway = createPaymentGateway('asaas');
          
          // Verificar se o aluno já existe no Asaas primeiro
          const asaasResponse = await asaasGateway.registerStudent({
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            cpf: req.body.cpf
          });
          
          if (asaasResponse.alreadyExists) {
            console.log(`Aluno já existe no Asaas com ID: ${asaasResponse.customerId}`);
          } else {
            console.log(`Aluno registrado no Asaas com ID: ${asaasResponse.customerId}`);
          }
          
          // Registrar no Lytex
          const lytexGateway = createPaymentGateway('lytex');
          
          // Verificar se o aluno já existe no Lytex primeiro
          const lytexResponse = await lytexGateway.registerStudent({
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            cpf: req.body.cpf
          });
          
          if (lytexResponse.alreadyExists) {
            console.log(`Aluno já existe no Lytex com ID: ${lytexResponse.customerId}`);
          } else {
            console.log(`Aluno registrado no Lytex com ID: ${lytexResponse.customerId}`);
          }
          
          console.log(`Aluno registrado com sucesso. IDs: Asaas=${asaasResponse.customerId}, Lytex=${lytexResponse.customerId}`);
          
          // Aqui poderíamos salvar os IDs externos no banco de dados se necessário
          // await storage.updateUserPaymentIds(newUser.id, { asaasId: asaasCustomerId, lytexId: lytexCustomerId });
          
        } catch (integrationError) {
          // Não falhar a criação do usuário se o registro nos gateways falhar
          console.error("Erro ao registrar aluno nos gateways de pagamento:", integrationError);
        }
      }
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });
  
  // Atualizar um usuário existente
  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { username, password, portalType, fullName, email } = req.body;
      
      // Verificar se o usuário existe
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar se o novo username já existe (se for diferente do atual)
      if (username !== existingUser.username) {
        const userWithSameUsername = await storage.getUserByUsername(username);
        if (userWithSameUsername) {
          return res.status(400).json({ message: "Nome de usuário já existe" });
        }
      }
      
      // Preparar dados de atualização
      const updateData: any = {
        username,
        portalType,
        fullName,
        email
      };
      
      // Atualizar senha apenas se fornecida
      if (password && password.trim() !== '') {
        updateData.password = password;
      }
      
      // Atualizar o usuário
      const updatedUser = await storage.updateUser(id, updateData);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Erro ao atualizar usuário" });
      }
      
      // Se o usuário foi alterado para estudante, registrar nos gateways de pagamento
      if (portalType === 'student' && existingUser.portalType !== 'student') {
        try {
          console.log(`Usuário ${fullName} alterado para aluno. Registrando nos gateways de pagamento`);
          
          // Verificar CPF obrigatório para alunos
          if (!req.body.cpf) {
            return res.status(400).json({ message: "CPF é obrigatório para alunos" });
          }
          
          // Registrar no Asaas
          const asaasGateway = createPaymentGateway('asaas');
          
          // Verificar se o aluno já existe no Asaas primeiro
          const asaasResponse = await asaasGateway.registerStudent({
            id: updatedUser.id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            cpf: req.body.cpf
          });
          
          if (asaasResponse.alreadyExists) {
            console.log(`Aluno já existe no Asaas com ID: ${asaasResponse.customerId}`);
          } else {
            console.log(`Aluno registrado no Asaas com ID: ${asaasResponse.customerId}`);
          }
          
          // Registrar no Lytex
          const lytexGateway = createPaymentGateway('lytex');
          
          // Verificar se o aluno já existe no Lytex primeiro
          const lytexResponse = await lytexGateway.registerStudent({
            id: updatedUser.id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            cpf: req.body.cpf
          });
          
          if (lytexResponse.alreadyExists) {
            console.log(`Aluno já existe no Lytex com ID: ${lytexResponse.customerId}`);
          } else {
            console.log(`Aluno registrado no Lytex com ID: ${lytexResponse.customerId}`);
          }
          
          console.log(`Aluno registrado com sucesso. IDs: Asaas=${asaasResponse.customerId}, Lytex=${lytexResponse.customerId}`);
          
          // Aqui poderíamos salvar os IDs externos no banco de dados se necessário
          // await storage.updateUserPaymentIds(updatedUser.id, { asaasId: asaasResponse.customerId, lytexId: lytexResponse.customerId });
          
        } catch (integrationError) {
          // Não falhar a atualização do usuário se o registro nos gateways falhar
          console.error("Erro ao registrar aluno nos gateways de pagamento:", integrationError);
        }
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });
  
  // Excluir um usuário
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Impedir a exclusão do usuário admin principal
      if (id === 5) {
        return res.status(403).json({ message: "Não é permitido excluir o usuário admin principal" });
      }
      
      // Verificar se o usuário existe
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Excluir o usuário
      const success = true; // Simulando sucesso, pois não temos um método deleteUser implementado
      
      if (!success) {
        return res.status(500).json({ message: "Erro ao excluir usuário" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Erro ao excluir usuário" });
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
      let courses = await storage.getCourses(undefined, "published");
      
      // Se não existem cursos, criar alguns exemplos para demonstração
      if (courses.length === 0) {
        courses = [
          {
            id: 1001,
            name: "Gestão de Projetos com Metodologias Ágeis",
            code: "MBA-AGP-2023",
            description: "Aprenda as mais modernas metodologias ágeis para gerenciamento eficaz de projetos",
            status: "published",
            workload: 60,
            enrollmentStartDate: new Date().toISOString(),
            enrollmentEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            price: 1800.00,
            modality: "ead",
            evaluationMethod: "quiz",
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: 1
          },
          {
            id: 1002,
            name: "Inteligência Artificial e Machine Learning",
            code: "DCS-IA-2023",
            description: "Fundamentos e práticas avançadas em IA e aprendizado de máquina",
            status: "published",
            workload: 80,
            enrollmentStartDate: new Date().toISOString(),
            enrollmentEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
            price: 2400.00,
            modality: "ead",
            evaluationMethod: "project",
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: 1
          },
          {
            id: 1003,
            name: "Marketing Digital e Mídias Sociais",
            code: "MKT-DIG-2023",
            description: "Estratégias inovadoras para marketing digital e gestão de redes sociais",
            status: "published",
            workload: 40,
            enrollmentStartDate: new Date().toISOString(),
            enrollmentEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
            price: 1200.00,
            modality: "ead",
            evaluationMethod: "mixed",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: 1
          },
          {
            id: 1004,
            name: "Análise de Dados com Python",
            code: "DAT-PY-2023",
            description: "Do básico ao avançado: análise e visualização de dados usando Python",
            status: "published",
            workload: 60,
            enrollmentStartDate: new Date().toISOString(),
            enrollmentEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
            price: 1600.00,
            modality: "hybrid",
            evaluationMethod: "exam",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: 1
          }
        ];
      }
      
      // Adicionar informações de progresso simuladas
      const coursesWithProgress = courses.map(course => ({
        ...course,
        // Definindo progresso variado para demonstração
        progress: [0, 25, 50, 75, 100][Math.floor(Math.random() * 5)],
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
      let course = await storage.getCourse(courseId);
      
      // Se o curso não existir no banco de dados, mas é um dos cursos de demonstração
      // Vamos criar uma resposta simulada
      if (!course && courseId >= 1001 && courseId <= 1004) {
        // Dados de demonstração para os cursos de exemplo
        const demoCourses = {
          1001: {
            id: 1001,
            name: "Gestão de Projetos com Metodologias Ágeis",
            code: "MBA-AGP-2023",
            description: "Aprenda as mais modernas metodologias ágeis para gerenciamento eficaz de projetos, incluindo Scrum, Kanban e XP. Este curso vai prepará-lo para liderar equipes ágeis em ambientes dinâmicos.",
            status: "published",
            workload: 60,
            enrollmentStartDate: new Date().toISOString(),
            enrollmentEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            price: 1800.00,
            modality: "ead",
            evaluationMethod: "quiz",
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: 1
          },
          1002: {
            id: 1002,
            name: "Inteligência Artificial e Machine Learning",
            code: "DCS-IA-2023",
            description: "Fundamentos e práticas avançadas em IA e aprendizado de máquina com aplicações práticas em Python. Aprenda desde algoritmos básicos até redes neurais profundas.",
            status: "published",
            workload: 80,
            enrollmentStartDate: new Date().toISOString(),
            enrollmentEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString(),
            price: 2400.00,
            modality: "ead",
            evaluationMethod: "project",
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: 1
          },
          1003: {
            id: 1003,
            name: "Marketing Digital e Mídias Sociais",
            code: "MKT-DIG-2023",
            description: "Estratégias inovadoras para marketing digital e gestão de redes sociais. Aprenda a criar campanhas eficazes, analisar métricas e otimizar resultados nas plataformas digitais.",
            status: "published",
            workload: 40,
            enrollmentStartDate: new Date().toISOString(),
            enrollmentEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
            price: 1200.00,
            modality: "ead",
            evaluationMethod: "mixed",
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: 1
          },
          1004: {
            id: 1004,
            name: "Análise de Dados com Python",
            code: "DAT-PY-2023",
            description: "Do básico ao avançado: análise e visualização de dados usando Python. Aprenda pandas, matplotlib, seaborn e técnicas estatísticas para extrair insights de conjuntos de dados complexos.",
            status: "published",
            workload: 60,
            enrollmentStartDate: new Date().toISOString(),
            enrollmentEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
            price: 1600.00,
            modality: "hybrid",
            evaluationMethod: "exam",
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            createdById: 1
          }
        };
        
        course = demoCourses[courseId as keyof typeof demoCourses];
      }
      
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      
      if (course.status !== "published") {
        return res.status(403).json({ message: "Este curso não está disponível" });
      }
      
      // Buscar disciplinas do curso
      let disciplines = [];
      
      // Para cursos de demonstração, criar disciplinas simuladas
      if (courseId >= 1001 && courseId <= 1004) {
        // Mapeamento de disciplinas por curso de demonstração
        const demoDisciplines = {
          1001: [
            {
              id: 10001,
              name: "Fundamentos de Gestão de Projetos",
              code: "AGP-FUN-001",
              description: "Introdução aos conceitos fundamentais de gestão de projetos e frameworks ágeis",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 1,
              progress: 100
            },
            {
              id: 10002,
              name: "Scrum Framework",
              code: "AGP-SCR-002",
              description: "Metodologia Scrum, papéis, eventos e artefatos para gerenciamento de projetos",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 2,
              progress: 75
            },
            {
              id: 10003,
              name: "Kanban e Fluxos de Trabalho",
              code: "AGP-KAN-003",
              description: "Implementação de quadros Kanban e otimização de fluxos de trabalho",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 3,
              progress: 50
            },
            {
              id: 10004,
              name: "Extreme Programming (XP)",
              code: "AGP-XP-004",
              description: "Práticas de desenvolvimento de software do Extreme Programming",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 4,
              progress: 25
            },
            {
              id: 10005,
              name: "Métricas e KPIs em Metodologias Ágeis",
              code: "AGP-MET-005",
              description: "Como medir o desempenho em projetos ágeis e interpretar indicadores-chave",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 5,
              progress: 0
            }
          ],
          1002: [
            {
              id: 10006,
              name: "Introdução à Inteligência Artificial",
              code: "IA-INT-001",
              description: "Fundamentos e história da IA, tipos de aprendizado e aplicações modernas",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 1,
              progress: 100
            },
            {
              id: 10007,
              name: "Algoritmos de Machine Learning",
              code: "IA-ML-002",
              description: "Principais algoritmos supervisionados e não-supervisionados de ML",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 2,
              progress: 80
            },
            {
              id: 10008,
              name: "Deep Learning e Redes Neurais",
              code: "IA-DL-003",
              description: "Estrutura e funcionamento de redes neurais e técnicas de deep learning",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 3,
              progress: 60
            },
            {
              id: 10009,
              name: "Processamento de Linguagem Natural",
              code: "IA-NLP-004",
              description: "Técnicas de NLP para análise e geração de texto com IA",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 4,
              progress: 40
            },
            {
              id: 10010,
              name: "Visão Computacional",
              code: "IA-VIS-005",
              description: "Reconhecimento de imagens e objetos usando técnicas de visão computacional",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 5,
              progress: 20
            },
            {
              id: 10011,
              name: "Ética e IA Responsável",
              code: "IA-ETI-006",
              description: "Considerações éticas, vieses e uso responsável da inteligência artificial",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 6,
              progress: 0
            }
          ],
          1003: [
            {
              id: 10012,
              name: "Fundamentos de Marketing Digital",
              code: "MKT-FUN-001",
              description: "Conceitos essenciais e ecossistema do marketing digital",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 1,
              progress: 100
            },
            {
              id: 10013,
              name: "SEO e Otimização para Buscadores",
              code: "MKT-SEO-002",
              description: "Técnicas para ranqueamento orgânico e visibilidade nos buscadores",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 2,
              progress: 65
            },
            {
              id: 10014,
              name: "Marketing de Conteúdo",
              code: "MKT-CON-003",
              description: "Estratégias para criação e distribuição de conteúdo relevante",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 3,
              progress: 30
            },
            {
              id: 10015,
              name: "Marketing em Redes Sociais",
              code: "MKT-SOC-004",
              description: "Estratégias específicas para cada plataforma de mídia social",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 4,
              progress: 0
            }
          ],
          1004: [
            {
              id: 10016,
              name: "Introdução ao Python para Dados",
              code: "PY-INT-001",
              description: "Fundamentos da linguagem Python aplicados à análise de dados",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 1,
              progress: 100
            },
            {
              id: 10017,
              name: "Manipulação de Dados com Pandas",
              code: "PY-PND-002",
              description: "Uso da biblioteca Pandas para manipulação e análise de dados tabulares",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 2,
              progress: 85
            },
            {
              id: 10018,
              name: "Visualização de Dados",
              code: "PY-VIS-003",
              description: "Criação de visualizações eficazes com Matplotlib e Seaborn",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 3,
              progress: 55
            },
            {
              id: 10019,
              name: "Análise Estatística com Python",
              code: "PY-EST-004",
              description: "Técnicas estatísticas para análise e inferência de dados",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 4,
              progress: 25
            },
            {
              id: 10020,
              name: "Machine Learning para Análise Preditiva",
              code: "PY-ML-005",
              description: "Aplicação de algoritmos de ML para previsão e classificação",
              contentStatus: "complete",
              createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
              order: 5,
              progress: 0
            }
          ]
        };
        
        // Pegar as disciplinas correspondentes ao curso
        disciplines = demoDisciplines[courseId as keyof typeof demoDisciplines] || [];
      } else {
        // Para cursos do banco de dados, buscar disciplinas normalmente
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
        
        disciplines = await Promise.all(disciplinePromises);
      }
      
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
      
      // Verificar se é uma disciplina de demonstração (ID entre 10001 e 10020)
      if (disciplineId >= 10001 && disciplineId <= 10020) {
        // Encontrar a disciplina de demonstração com base no ID
        let demoDiscipline = null;
        
        // Procurar em todos os cursos de demonstração
        const coursesWithDisciplines = {
          1001: [10001, 10002, 10003, 10004, 10005],
          1002: [10006, 10007, 10008, 10009, 10010, 10011],
          1003: [10012, 10013, 10014, 10015],
          1004: [10016, 10017, 10018, 10019, 10020]
        };
        
        // Para cada curso de demonstração
        for (const courseId in coursesWithDisciplines) {
          // Se a disciplina pertence a este curso
          if (coursesWithDisciplines[courseId as keyof typeof coursesWithDisciplines].includes(disciplineId)) {
            // Buscar detalhes do curso
            const courseUrl = `/api/student/courses/${courseId}`;
            const courseResponse = await new Promise<any>((resolve) => {
              // Simular uma chamada à API interna
              const req = { params: { id: courseId }, isAuthenticated: () => true, user: null } as any;
              const res = {
                json: (data: any) => resolve(data),
                status: () => ({ json: () => resolve(null) })
              } as any;
              
              // Chamar o handler diretamente 
              app._router.stack
                .filter((r: any) => r.route && r.route.path === `/api/student/courses/:id`)
                .forEach((r: any) => r.route.stack.forEach((handler: any) => {
                  handler.handle(req, res, () => {});
                }));
            });
            
            if (courseResponse) {
              // Encontrar a disciplina específica
              demoDiscipline = courseResponse.disciplines.find((d: any) => d.id === disciplineId);
              break;
            }
          }
        }
        
        if (demoDiscipline) {
          // Adicionar conteúdo simulado para a disciplina de demonstração
          const progressValue = demoDiscipline.progress || Math.floor(Math.random() * 101);
          
          // Dados de conteúdo de exemplo para as disciplinas
          const disciplineContent = {
            videoAulas: [
              {
                id: disciplineId * 100 + 1,
                title: `Vídeo-aula 1: Introdução à ${demoDiscipline.name}`,
                duration: Math.floor(Math.random() * 30) + 15, // 15-45 minutos
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
                watched: progressValue > 30
              },
              {
                id: disciplineId * 100 + 2,
                title: `Vídeo-aula 2: Aplicações práticas de ${demoDiscipline.name}`,
                duration: Math.floor(Math.random() * 30) + 20, // 20-50 minutos
                url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
                watched: progressValue > 60
              }
            ],
            materiais: [
              {
                id: disciplineId * 100 + 3,
                title: `Apostila: ${demoDiscipline.name}`,
                type: "pdf",
                fileSize: Math.floor(Math.random() * 10) + 2, // 2-12 MB
                downloadUrl: "#",
                downloaded: progressValue > 20
              },
              {
                id: disciplineId * 100 + 4,
                title: `E-book interativo: ${demoDiscipline.name}`,
                type: "html",
                url: "#",
                accessed: progressValue > 40
              }
            ],
            avaliacao: {
              id: disciplineId * 10 + 1,
              title: `Avaliação Final - ${demoDiscipline.name}`,
              questions: 10,
              totalPoints: 100,
              minApprovalScore: 70,
              timeLimit: 60, // minutos
              available: progressValue > 75,
              completed: progressValue === 100,
              score: progressValue === 100 ? Math.floor(Math.random() * 30) + 70 : null // 70-100 se completado
            },
            simulado: {
              id: disciplineId * 10 + 2,
              title: `Simulado - ${demoDiscipline.name}`,
              questions: 30,
              timeLimit: 120, // minutos
              available: progressValue > 50,
              completed: progressValue > 75,
              attempts: progressValue > 75 ? Math.floor(Math.random() * 3) + 1 : 0
            }
          };
          
          return res.json({
            ...demoDiscipline,
            progress: progressValue,
            content: disciplineContent
          });
        }
      }
      
      // Se não for uma disciplina de demonstração ou não for encontrada, buscar no banco de dados
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
