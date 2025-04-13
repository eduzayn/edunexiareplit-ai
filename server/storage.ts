import { users, type User, type InsertUser,
  disciplines, type Discipline, type InsertDiscipline,
  courses, type Course, type InsertCourse,
  courseDisciplines, type CourseDiscipline, type InsertCourseDiscipline,
  questions, type Question, type InsertQuestion,
  assessments, type Assessment, type InsertAssessment,
  assessmentQuestions, type AssessmentQuestion, type InsertAssessmentQuestion,
  institutions, type Institution, type InsertInstitution
} from "@shared/schema";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, or, like, asc, desc } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByPortalType(portalType: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Disciplinas
  getDiscipline(id: number): Promise<Discipline | undefined>;
  getDisciplineByCode(code: string): Promise<Discipline | undefined>;
  getDisciplines(search?: string, limit?: number, offset?: number): Promise<Discipline[]>;
  createDiscipline(discipline: InsertDiscipline): Promise<Discipline>;
  updateDiscipline(id: number, discipline: Partial<InsertDiscipline>): Promise<Discipline | undefined>;
  deleteDiscipline(id: number): Promise<boolean>;
  updateDisciplineContent(id: number, contentData: Partial<InsertDiscipline>): Promise<Discipline | undefined>;
  checkDisciplineCompleteness(id: number): Promise<boolean>;
  
  // Cursos
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  getCourses(search?: string, status?: string, limit?: number, offset?: number): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  publishCourse(id: number): Promise<Course | undefined>;
  
  // Disciplinas em Cursos
  getCourseDisciplines(courseId: number): Promise<CourseDiscipline[]>;
  addDisciplineToCourse(courseDiscipline: InsertCourseDiscipline): Promise<CourseDiscipline>;
  removeDisciplineFromCourse(courseId: number, disciplineId: number): Promise<boolean>;
  reorderCourseDisciplines(courseId: number, disciplineOrder: { disciplineId: number, order: number }[]): Promise<boolean>;
  
  // Questões
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByDiscipline(disciplineId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: number): Promise<boolean>;
  
  // Avaliações
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessmentsByDiscipline(disciplineId: number, type?: string): Promise<Assessment[]>;
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined>;
  deleteAssessment(id: number): Promise<boolean>;
  
  // Questões em Avaliações
  getAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]>;
  addQuestionToAssessment(assessmentQuestion: InsertAssessmentQuestion): Promise<AssessmentQuestion>;
  removeQuestionFromAssessment(assessmentId: number, questionId: number): Promise<boolean>;
  reorderAssessmentQuestions(assessmentId: number, questionOrder: { questionId: number, order: number }[]): Promise<boolean>;
  
  // Instituições
  getInstitution(id: number): Promise<Institution | undefined>;
  getInstitutionByCode(code: string): Promise<Institution | undefined>;
  getInstitutionByCNPJ(cnpj: string): Promise<Institution | undefined>;
  getInstitutions(search?: string, status?: string, limit?: number, offset?: number): Promise<Institution[]>;
  createInstitution(institution: InsertInstitution): Promise<Institution>;
  updateInstitution(id: number, institution: Partial<InsertInstitution>): Promise<Institution | undefined>;
  deleteInstitution(id: number): Promise<boolean>;
  
  // Polos
  getPolo(id: number): Promise<Polo | undefined>;
  getPoloByCode(code: string): Promise<Polo | undefined>;
  getPolos(search?: string, status?: string, institutionId?: number, limit?: number, offset?: number): Promise<Polo[]>;
  createPolo(polo: InsertPolo): Promise<Polo>;
  updatePolo(id: number, polo: Partial<InsertPolo>): Promise<Polo | undefined>;
  deletePolo(id: number): Promise<boolean>;
  
  // Transações Financeiras
  getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined>;
  getFinancialTransactions(
    type?: string, 
    category?: string, 
    search?: string, 
    startDate?: Date, 
    endDate?: Date, 
    institutionId?: number,
    limit?: number, 
    offset?: number
  ): Promise<FinancialTransaction[]>;
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  updateFinancialTransaction(id: number, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined>;
  deleteFinancialTransaction(id: number): Promise<boolean>;
  
  // Categorias Financeiras
  getFinancialCategory(id: number): Promise<FinancialCategory | undefined>;
  getFinancialCategories(type?: string, institutionId?: number, limit?: number, offset?: number): Promise<FinancialCategory[]>;
  createFinancialCategory(category: InsertFinancialCategory): Promise<FinancialCategory>;
  updateFinancialCategory(id: number, category: Partial<InsertFinancialCategory>): Promise<FinancialCategory | undefined>;
  deleteFinancialCategory(id: number): Promise<boolean>;
  
  sessionStore: SessionStore;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // ==================== Usuários ====================
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUsersByPortalType(portalType: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.portalType, portalType));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // ==================== Disciplinas ====================
  async getDiscipline(id: number): Promise<Discipline | undefined> {
    const [discipline] = await db.select().from(disciplines).where(eq(disciplines.id, id));
    return discipline || undefined;
  }

  async getDisciplineByCode(code: string): Promise<Discipline | undefined> {
    const [discipline] = await db.select().from(disciplines).where(eq(disciplines.code, code));
    return discipline || undefined;
  }

  async getDisciplines(search?: string, limit: number = 50, offset: number = 0): Promise<Discipline[]> {
    let query = db.select().from(disciplines).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(disciplines.name, `%${search}%`),
          like(disciplines.code, `%${search}%`)
        )
      );
    }
    
    return await query.orderBy(asc(disciplines.name));
  }

  async createDiscipline(discipline: InsertDiscipline): Promise<Discipline> {
    const [newDiscipline] = await db
      .insert(disciplines)
      .values(discipline)
      .returning();
    return newDiscipline;
  }

  async updateDiscipline(id: number, discipline: Partial<InsertDiscipline>): Promise<Discipline | undefined> {
    const [updatedDiscipline] = await db
      .update(disciplines)
      .set(discipline)
      .where(eq(disciplines.id, id))
      .returning();
    return updatedDiscipline;
  }

  async deleteDiscipline(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(disciplines)
        .where(eq(disciplines.id, id))
        .returning({ id: disciplines.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting discipline:", error);
      return false;
    }
  }
  
  async updateDisciplineContent(id: number, contentData: Partial<InsertDiscipline>): Promise<Discipline | undefined> {
    try {
      // Filtra apenas os campos de conteúdo
      const contentFields = {
        videoAula1Url: contentData.videoAula1Url,
        videoAula1Source: contentData.videoAula1Source,
        videoAula2Url: contentData.videoAula2Url,
        videoAula2Source: contentData.videoAula2Source,
        apostilaPdfUrl: contentData.apostilaPdfUrl,
        ebookInterativoUrl: contentData.ebookInterativoUrl,
      };
      
      // Atualiza os campos de conteúdo
      const [updatedDiscipline] = await db
        .update(disciplines)
        .set(contentFields)
        .where(eq(disciplines.id, id))
        .returning();
        
      // Verifica a completude após a atualização
      const isComplete = await this.checkDisciplineCompleteness(id);
      
      if (isComplete) {
        await db
          .update(disciplines)
          .set({ contentStatus: 'complete' })
          .where(eq(disciplines.id, id));
      }
      
      return updatedDiscipline;
    } catch (error) {
      console.error("Error updating discipline content:", error);
      return undefined;
    }
  }
  
  async checkDisciplineCompleteness(id: number): Promise<boolean> {
    const [discipline] = await db
      .select()
      .from(disciplines)
      .where(eq(disciplines.id, id));
      
    if (!discipline) return false;
    
    // Verifica se todos os elementos de conteúdo estão preenchidos
    const hasVideo1 = !!discipline.videoAula1Url && !!discipline.videoAula1Source;
    const hasVideo2 = !!discipline.videoAula2Url && !!discipline.videoAula2Source;
    const hasApostila = !!discipline.apostilaPdfUrl;
    const hasEbook = !!discipline.ebookInterativoUrl;
    
    // Verifica se existem simulado e avaliação final associados
    const simulados = await this.getAssessmentsByDiscipline(id, 'simulado');
    const avaliacoes = await this.getAssessmentsByDiscipline(id, 'avaliacao_final');
    
    const hasSimulado = simulados.length > 0;
    const hasAvaliacao = avaliacoes.length > 0;
    
    // Uma disciplina está completa se tiver todos os elementos obrigatórios
    return hasVideo1 && hasVideo2 && hasApostila && hasEbook && hasSimulado && hasAvaliacao;
  }

  // ==================== Cursos ====================
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course || undefined;
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.code, code));
    return course || undefined;
  }

  async getCourses(search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<Course[]> {
    let query = db.select().from(courses).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(courses.name, `%${search}%`),
          like(courses.code, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(courses.status, status));
    }
    
    return await query.orderBy(desc(courses.createdAt));
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db
      .insert(courses)
      .values(course)
      .returning();
    return newCourse;
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updatedCourse] = await db
      .update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(courses)
        .where(eq(courses.id, id))
        .returning({ id: courses.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting course:", error);
      return false;
    }
  }

  async publishCourse(id: number): Promise<Course | undefined> {
    const [publishedCourse] = await db
      .update(courses)
      .set({
        status: 'published',
        publishedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();
    return publishedCourse;
  }

  // ==================== Disciplinas em Cursos ====================
  async getCourseDisciplines(courseId: number): Promise<CourseDiscipline[]> {
    return await db
      .select()
      .from(courseDisciplines)
      .where(eq(courseDisciplines.courseId, courseId))
      .orderBy(asc(courseDisciplines.order));
  }

  async addDisciplineToCourse(courseDiscipline: InsertCourseDiscipline): Promise<CourseDiscipline> {
    const [newCourseDiscipline] = await db
      .insert(courseDisciplines)
      .values(courseDiscipline)
      .returning();
    return newCourseDiscipline;
  }

  async removeDisciplineFromCourse(courseId: number, disciplineId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(courseDisciplines)
        .where(
          and(
            eq(courseDisciplines.courseId, courseId),
            eq(courseDisciplines.disciplineId, disciplineId)
          )
        )
        .returning({ id: courseDisciplines.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error removing discipline from course:", error);
      return false;
    }
  }

  async reorderCourseDisciplines(
    courseId: number, 
    disciplineOrder: { disciplineId: number, order: number }[]
  ): Promise<boolean> {
    try {
      // Atualizar cada ordem de disciplina
      for (const item of disciplineOrder) {
        await db
          .update(courseDisciplines)
          .set({ order: item.order })
          .where(
            and(
              eq(courseDisciplines.courseId, courseId),
              eq(courseDisciplines.disciplineId, item.disciplineId)
            )
          );
      }
      return true;
    } catch (error) {
      console.error("Error reordering disciplines:", error);
      return false;
    }
  }
  
  // ==================== Questões ====================
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question || undefined;
  }
  
  async getQuestionsByDiscipline(disciplineId: number): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.disciplineId, disciplineId))
      .orderBy(desc(questions.createdAt));
  }
  
  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db
      .insert(questions)
      .values(question)
      .returning();
    return newQuestion;
  }
  
  async updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [updatedQuestion] = await db
      .update(questions)
      .set(question)
      .where(eq(questions.id, id))
      .returning();
    return updatedQuestion;
  }
  
  async deleteQuestion(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(questions)
        .where(eq(questions.id, id))
        .returning({ id: questions.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting question:", error);
      return false;
    }
  }
  
  // ==================== Avaliações ====================
  async getAssessment(id: number): Promise<Assessment | undefined> {
    const [assessment] = await db.select().from(assessments).where(eq(assessments.id, id));
    return assessment || undefined;
  }
  
  async getAssessmentsByDiscipline(disciplineId: number, type?: string): Promise<Assessment[]> {
    let query = db
      .select()
      .from(assessments)
      .where(eq(assessments.disciplineId, disciplineId));
      
    if (type) {
      query = query.where(eq(assessments.type, type));
    }
    
    return await query.orderBy(desc(assessments.createdAt));
  }
  
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const [newAssessment] = await db
      .insert(assessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }
  
  async updateAssessment(id: number, assessment: Partial<InsertAssessment>): Promise<Assessment | undefined> {
    const [updatedAssessment] = await db
      .update(assessments)
      .set(assessment)
      .where(eq(assessments.id, id))
      .returning();
    return updatedAssessment;
  }
  
  async deleteAssessment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(assessments)
        .where(eq(assessments.id, id))
        .returning({ id: assessments.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting assessment:", error);
      return false;
    }
  }
  
  // ==================== Questões em Avaliações ====================
  async getAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]> {
    return await db
      .select()
      .from(assessmentQuestions)
      .where(eq(assessmentQuestions.assessmentId, assessmentId))
      .orderBy(asc(assessmentQuestions.order));
  }
  
  async addQuestionToAssessment(assessmentQuestion: InsertAssessmentQuestion): Promise<AssessmentQuestion> {
    const [newAssessmentQuestion] = await db
      .insert(assessmentQuestions)
      .values(assessmentQuestion)
      .returning();
    return newAssessmentQuestion;
  }
  
  async removeQuestionFromAssessment(assessmentId: number, questionId: number): Promise<boolean> {
    try {
      const result = await db
        .delete(assessmentQuestions)
        .where(
          and(
            eq(assessmentQuestions.assessmentId, assessmentId),
            eq(assessmentQuestions.questionId, questionId)
          )
        )
        .returning({ id: assessmentQuestions.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error removing question from assessment:", error);
      return false;
    }
  }
  
  async reorderAssessmentQuestions(
    assessmentId: number, 
    questionOrder: { questionId: number, order: number }[]
  ): Promise<boolean> {
    try {
      // Atualizar cada ordem de questão
      for (const item of questionOrder) {
        await db
          .update(assessmentQuestions)
          .set({ order: item.order })
          .where(
            and(
              eq(assessmentQuestions.assessmentId, assessmentId),
              eq(assessmentQuestions.questionId, item.questionId)
            )
          );
      }
      return true;
    } catch (error) {
      console.error("Error reordering assessment questions:", error);
      return false;
    }
  }
  
  // ==================== Instituições ====================
  async getInstitution(id: number): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.id, id));
    return institution || undefined;
  }
  
  async getInstitutionByCode(code: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.code, code));
    return institution || undefined;
  }
  
  async getInstitutionByCNPJ(cnpj: string): Promise<Institution | undefined> {
    const [institution] = await db.select().from(institutions).where(eq(institutions.cnpj, cnpj));
    return institution || undefined;
  }
  
  async getInstitutions(search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<Institution[]> {
    let query = db.select().from(institutions).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(institutions.name, `%${search}%`),
          like(institutions.code, `%${search}%`),
          like(institutions.cnpj, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(institutions.status, status as any));
    }
    
    return await query.orderBy(asc(institutions.name));
  }
  
  async createInstitution(institution: InsertInstitution): Promise<Institution> {
    const [newInstitution] = await db
      .insert(institutions)
      .values(institution)
      .returning();
    return newInstitution;
  }
  
  async updateInstitution(id: number, institution: Partial<InsertInstitution>): Promise<Institution | undefined> {
    const [updatedInstitution] = await db
      .update(institutions)
      .set(institution)
      .where(eq(institutions.id, id))
      .returning();
    return updatedInstitution;
  }
  
  async deleteInstitution(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(institutions)
        .where(eq(institutions.id, id))
        .returning({ id: institutions.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting institution:", error);
      return false;
    }
  }

  // ==================== Polos ====================
  async getPolo(id: number): Promise<Polo | undefined> {
    const [polo] = await db.select().from(polos).where(eq(polos.id, id));
    return polo || undefined;
  }

  async getPoloByCode(code: string): Promise<Polo | undefined> {
    const [polo] = await db.select().from(polos).where(eq(polos.code, code));
    return polo || undefined;
  }

  async getPolos(search?: string, status?: string, institutionId?: number, limit: number = 50, offset: number = 0): Promise<Polo[]> {
    let query = db.select().from(polos).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(polos.name, `%${search}%`),
          like(polos.code, `%${search}%`),
          like(polos.city, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(polos.status, status as any));
    }
    
    if (institutionId) {
      query = query.where(eq(polos.institutionId, institutionId));
    }
    
    return await query.orderBy(asc(polos.name));
  }

  async createPolo(polo: InsertPolo): Promise<Polo> {
    const [newPolo] = await db
      .insert(polos)
      .values(polo)
      .returning();
    return newPolo;
  }

  async updatePolo(id: number, polo: Partial<InsertPolo>): Promise<Polo | undefined> {
    const [updatedPolo] = await db
      .update(polos)
      .set({
        ...polo,
        updatedAt: new Date()
      })
      .where(eq(polos.id, id))
      .returning();
    return updatedPolo;
  }

  async deletePolo(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(polos)
        .where(eq(polos.id, id))
        .returning({ id: polos.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting polo:", error);
      return false;
    }
  }

  // ==================== Transações Financeiras ====================
  async getFinancialTransaction(id: number): Promise<FinancialTransaction | undefined> {
    const [transaction] = await db.select().from(financialTransactions).where(eq(financialTransactions.id, id));
    return transaction || undefined;
  }

  async getFinancialTransactions(
    type?: string, 
    category?: string, 
    search?: string, 
    startDate?: Date, 
    endDate?: Date, 
    institutionId?: number,
    limit: number = 50, 
    offset: number = 0
  ): Promise<FinancialTransaction[]> {
    let query = db.select().from(financialTransactions).limit(limit).offset(offset);
    
    if (type) {
      query = query.where(eq(financialTransactions.type, type));
    }
    
    if (category) {
      query = query.where(eq(financialTransactions.category, category));
    }
    
    if (search) {
      query = query.where(like(financialTransactions.description, `%${search}%`));
    }
    
    if (startDate) {
      query = query.where(gte(financialTransactions.date, startDate));
    }
    
    if (endDate) {
      query = query.where(lte(financialTransactions.date, endDate));
    }
    
    if (institutionId) {
      query = query.where(eq(financialTransactions.institutionId, institutionId));
    }
    
    return await query.orderBy(desc(financialTransactions.date));
  }

  async createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [newTransaction] = await db
      .insert(financialTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateFinancialTransaction(id: number, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction | undefined> {
    const [updatedTransaction] = await db
      .update(financialTransactions)
      .set({
        ...transaction,
        updatedAt: new Date()
      })
      .where(eq(financialTransactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteFinancialTransaction(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(financialTransactions)
        .where(eq(financialTransactions.id, id))
        .returning({ id: financialTransactions.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting financial transaction:", error);
      return false;
    }
  }

  // ==================== Categorias Financeiras ====================
  async getFinancialCategory(id: number): Promise<FinancialCategory | undefined> {
    const [category] = await db.select().from(financialCategories).where(eq(financialCategories.id, id));
    return category || undefined;
  }

  async getFinancialCategories(type?: string, institutionId?: number, limit: number = 50, offset: number = 0): Promise<FinancialCategory[]> {
    let query = db.select().from(financialCategories).limit(limit).offset(offset);
    
    if (type) {
      query = query.where(eq(financialCategories.type, type));
    }
    
    if (institutionId) {
      query = query.where(eq(financialCategories.institutionId, institutionId));
    }
    
    return await query.orderBy(asc(financialCategories.name));
  }

  async createFinancialCategory(category: InsertFinancialCategory): Promise<FinancialCategory> {
    const [newCategory] = await db
      .insert(financialCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateFinancialCategory(id: number, category: Partial<InsertFinancialCategory>): Promise<FinancialCategory | undefined> {
    const [updatedCategory] = await db
      .update(financialCategories)
      .set({
        ...category,
        updatedAt: new Date()
      })
      .where(eq(financialCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteFinancialCategory(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(financialCategories)
        .where(eq(financialCategories.id, id))
        .returning({ id: financialCategories.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting financial category:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
