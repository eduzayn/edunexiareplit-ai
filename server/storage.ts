import { users, type User, type InsertUser,
  disciplines, type Discipline, type InsertDiscipline,
  courses, type Course, type InsertCourse,
  courseDisciplines, type CourseDiscipline, type InsertCourseDiscipline,
  questions, type Question, type InsertQuestion,
  assessments, type Assessment, type InsertAssessment,
  assessmentQuestions, type AssessmentQuestion, type InsertAssessmentQuestion,
  institutions, type Institution, type InsertInstitution,
  polos, type Polo, type InsertPolo,
  financialTransactions, type FinancialTransaction, type InsertFinancialTransaction,
  financialCategories, type FinancialCategory, type InsertFinancialCategory,
  enrollments, type Enrollment, type InsertEnrollment,
  enrollmentStatusHistory, type EnrollmentStatusHistory, type InsertEnrollmentStatusHistory,
  contractTemplates, type ContractTemplate, type InsertContractTemplate,
  contracts, type Contract, type InsertContract,
  // CRM
  clients, type Client, type InsertClient,
  contacts, type Contact, type InsertContact,
  // Finanças
  products, type Product, type InsertProduct,
  invoices, type Invoice, type InsertInvoice,
  invoiceItems, type InvoiceItem, type InsertInvoiceItem,
  payments, type Payment, type InsertPayment
} from "@shared/schema";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and, or, like, asc, desc, gte, lte } from "drizzle-orm";

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
  getAllCourses(): Promise<Course[]>;
  getPublishedCourses(): Promise<Course[]>;
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
  getPoloByUserId(userId: number): Promise<Polo | undefined>;
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
  
  // Matrículas
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentByCode(code: string): Promise<Enrollment | undefined>;
  getEnrollments(
    search?: string, 
    status?: string, 
    studentId?: number,
    courseId?: number,
    poloId?: number,
    institutionId?: number,
    partnerId?: number,
    startDate?: Date,
    endDate?: Date,
    paymentGateway?: string,
    limit?: number, 
    offset?: number
  ): Promise<Enrollment[]>;
  getStudentEnrollments(studentId: number): Promise<Enrollment[]>;
  getCourseEnrollments(courseId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<InsertEnrollment>): Promise<Enrollment | undefined>;
  updateEnrollmentStatus(id: number, status: string, reason?: string, changedById?: number, metadata?: any): Promise<Enrollment | undefined>;
  deleteEnrollment(id: number): Promise<boolean>;
  
  // Histórico de Status de Matrículas
  getEnrollmentStatusHistory(enrollmentId: number): Promise<EnrollmentStatusHistory[]>;
  addEnrollmentStatusHistory(historyEntry: InsertEnrollmentStatusHistory): Promise<EnrollmentStatusHistory>;
  
  // Templates de Contrato
  getContractTemplate(id: number): Promise<ContractTemplate | undefined>;
  getContractTemplates(institutionId?: number): Promise<ContractTemplate[]>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  updateContractTemplate(id: number, template: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined>;
  deleteContractTemplate(id: number): Promise<boolean>;
  
  // Contratos
  getContract(id: number): Promise<Contract | undefined>;
  getContractByCode(code: string): Promise<Contract | undefined>;
  getContractsByEnrollment(enrollmentId: number): Promise<Contract[]>;
  getContractsByStudent(studentId: number): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  updateContractStatus(id: number, status: string): Promise<Contract | undefined>;
  deleteContract(id: number): Promise<boolean>;
  
  // Gateway de pagamento
  createPayment(enrollment: Enrollment, gateway: string): Promise<{externalId: string, paymentUrl: string}>;
  getPaymentStatus(externalId: string, gateway: string): Promise<string>;
  
  // CRM - Clients and Contacts
  
  // CRM - Clientes
  getClient(id: number): Promise<Client | undefined>;
  getClientByDocument(document: string): Promise<Client | undefined>;
  getClients(search?: string, status?: string, limit?: number, offset?: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // CRM - Contatos
  getContact(id: number): Promise<Contact | undefined>;
  getContactsByClient(clientId: number): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Finanças - Produtos/Serviços
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(search?: string, type?: string, category?: string, limit?: number, offset?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Finanças - Faturas
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  getInvoices(search?: string, status?: string, clientId?: number, limit?: number, offset?: number): Promise<Invoice[]>;
  createInvoiceWithItems(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Finanças - Itens de Fatura
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  
  // Finanças - Pagamentos
  getPayment(id: number): Promise<Payment | undefined>;
  getPayments(invoiceId?: number, status?: string, method?: string, limit?: number, offset?: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
  deletePayment(id: number): Promise<boolean>;
  updateInvoiceAfterPayment(invoiceId: number): Promise<Invoice | undefined>;
  
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
  
  async getAllCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .orderBy(desc(courses.createdAt));
  }
  
  async getPublishedCourses(): Promise<Course[]> {
    return await db
      .select()
      .from(courses)
      .where(eq(courses.status, 'published'))
      .orderBy(desc(courses.createdAt));
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

  async getPoloByUserId(userId: number): Promise<Polo | undefined> {
    // Primeiro, obtém o usuário para verificar se ele tem um poloId associado
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || !user.poloId) {
      return undefined;
    }
    
    // Em seguida, obtém o polo com base no poloId do usuário
    const [polo] = await db.select().from(polos).where(eq(polos.id, user.poloId));
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
  
  // ==================== Matrículas ====================
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select()
      .from(enrollments)
      .where(eq(enrollments.id, id));
    return enrollment || undefined;
  }
  
  async getEnrollmentByCode(code: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select()
      .from(enrollments)
      .where(eq(enrollments.code, code));
    return enrollment || undefined;
  }
  
  async getEnrollments(
    search?: string, 
    status?: string, 
    studentId?: number,
    courseId?: number,
    poloId?: number,
    institutionId?: number,
    partnerId?: number,
    startDate?: Date,
    endDate?: Date,
    paymentGateway?: string,
    limit: number = 50, 
    offset: number = 0
  ): Promise<Enrollment[]> {
    let query = db.select()
      .from(enrollments)
      .limit(limit)
      .offset(offset);
      
    if (search) {
      query = query.where(
        or(
          like(enrollments.code, `%${search}%`),
          like(enrollments.observations, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(enrollments.status, status));
    }
    
    if (studentId) {
      query = query.where(eq(enrollments.studentId, studentId));
    }
    
    if (courseId) {
      query = query.where(eq(enrollments.courseId, courseId));
    }
    
    if (poloId) {
      query = query.where(eq(enrollments.poloId, poloId));
    }
    
    if (institutionId) {
      query = query.where(eq(enrollments.institutionId, institutionId));
    }
    
    if (partnerId) {
      query = query.where(eq(enrollments.partnerId, partnerId));
    }
    
    if (paymentGateway) {
      query = query.where(eq(enrollments.paymentGateway, paymentGateway));
    }
    
    if (startDate) {
      query = query.where(gte(enrollments.enrollmentDate, startDate));
    }
    
    if (endDate) {
      query = query.where(lte(enrollments.enrollmentDate, endDate));
    }
    
    return await query.orderBy(desc(enrollments.enrollmentDate));
  }
  
  async getStudentEnrollments(studentId: number): Promise<Enrollment[]> {
    return await db.select()
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId))
      .orderBy(desc(enrollments.enrollmentDate));
  }
  
  async getCourseEnrollments(courseId: number): Promise<Enrollment[]> {
    return await db.select()
      .from(enrollments)
      .where(eq(enrollments.courseId, courseId))
      .orderBy(desc(enrollments.enrollmentDate));
  }
  
  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    // Gerar código único para matrícula (formato: MAT-XXXXXX)
    const uniqueCode = `MAT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const enrollmentWithCode = {
      ...enrollment,
      code: uniqueCode
    };
    
    const [newEnrollment] = await db
      .insert(enrollments)
      .values(enrollmentWithCode)
      .returning();
      
    // Criar registro de histórico de status
    await this.addEnrollmentStatusHistory({
      enrollmentId: newEnrollment.id,
      previousStatus: null,
      newStatus: newEnrollment.status,
      changeReason: 'Matrícula criada',
      changedById: enrollment.createdById
    });
      
    return newEnrollment;
  }
  
  async updateEnrollment(id: number, enrollmentData: Partial<InsertEnrollment>): Promise<Enrollment | undefined> {
    // Se houver mudança de status, registrar no histórico
    const currentEnrollment = await this.getEnrollment(id);
    if (!currentEnrollment) return undefined;
    
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({
        ...enrollmentData,
        updatedAt: new Date()
      })
      .where(eq(enrollments.id, id))
      .returning();
      
    // Se o status foi alterado, registrar no histórico
    if (enrollmentData.status && currentEnrollment.status !== enrollmentData.status) {
      await this.addEnrollmentStatusHistory({
        enrollmentId: id,
        previousStatus: currentEnrollment.status,
        newStatus: enrollmentData.status,
        changeReason: enrollmentData.observations || 'Atualização manual',
        changedById: enrollmentData.createdById
      });
    }
      
    return updatedEnrollment;
  }
  
  async updateEnrollmentStatus(
    id: number, 
    status: string, 
    reason?: string, 
    changedById?: number,
    metadata?: any,
    sourceChannel?: string
  ): Promise<Enrollment | undefined> {
    const currentEnrollment = await this.getEnrollment(id);
    if (!currentEnrollment) return undefined;
    
    // Atualizar status na matrícula
    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({
        status: status as any,
        updatedAt: new Date(),
        updatedById: changedById,
        sourceChannel: sourceChannel || 'system'
      })
      .where(eq(enrollments.id, id))
      .returning();
      
    // Registrar mudança no histórico
    await this.addEnrollmentStatusHistory({
      enrollmentId: id,
      previousStatus: currentEnrollment.status,
      newStatus: status as any,
      changeReason: reason || 'Atualização de status',
      changedById,
      metadata: metadata ? JSON.stringify(metadata) : null,
      sourceChannel: sourceChannel || 'system',
      poloId: currentEnrollment.poloId
    });
    
    // Ações específicas por tipo de mudança de status
    if (status === 'active' && currentEnrollment.status === 'pending_payment') {
      // Quando uma matrícula é ativada após pagamento
      // Definir data de início e data prevista de término
      const startDate = new Date();
      
      // Buscar duração do curso para calcular data prevista de término
      const course = await this.getCourse(currentEnrollment.courseId);
      let durationMonths = 6; // Padrão: 6 meses
      
      if (course && course.durationMonths) {
        durationMonths = course.durationMonths;
      }
      
      const expectedEndDate = new Date();
      expectedEndDate.setMonth(expectedEndDate.getMonth() + durationMonths);
      
      await db
        .update(enrollments)
        .set({
          startDate,
          expectedEndDate,
          updatedAt: new Date()
        })
        .where(eq(enrollments.id, id));
    }
    
    return updatedEnrollment;
  }
  
  async deleteEnrollment(id: number, deletedById?: number, sourceChannel?: string): Promise<boolean> {
    try {
      // Em vez de excluir permanentemente, podemos marcar como cancelada
      const [updatedEnrollment] = await db
        .update(enrollments)
        .set({ 
          status: 'cancelled',
          updatedAt: new Date(),
          updatedById: deletedById,
          sourceChannel: sourceChannel || 'admin_portal'
        })
        .where(eq(enrollments.id, id))
        .returning();
        
      // Registrar a exclusão no histórico
      if (updatedEnrollment) {
        await this.addEnrollmentStatusHistory({
          enrollmentId: id,
          previousStatus: updatedEnrollment.status,
          newStatus: 'cancelled',
          changeReason: 'Matrícula excluída manualmente',
          changedById: deletedById,
          sourceChannel: sourceChannel || 'admin_portal'
        });
      }
      
      return !!updatedEnrollment;
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      return false;
    }
  }
  
  // ==================== Histórico de Status de Matrículas ====================
  async getEnrollmentStatusHistory(enrollmentId: number): Promise<EnrollmentStatusHistory[]> {
    return await db.select()
      .from(enrollmentStatusHistory)
      .where(eq(enrollmentStatusHistory.enrollmentId, enrollmentId))
      .orderBy(desc(enrollmentStatusHistory.changeDate));
  }
  
  async addEnrollmentStatusHistory(historyEntry: InsertEnrollmentStatusHistory): Promise<EnrollmentStatusHistory> {
    const [newHistoryEntry] = await db
      .insert(enrollmentStatusHistory)
      .values({
        ...historyEntry,
        changeDate: new Date()
      })
      .returning();
    return newHistoryEntry;
  }
  
  // ==================== Templates de Contratos ====================
  async getContractTemplate(id: number): Promise<ContractTemplate | undefined> {
    const [template] = await db.select().from(contractTemplates).where(eq(contractTemplates.id, id));
    return template || undefined;
  }
  
  async getContractTemplates(institutionId?: number): Promise<ContractTemplate[]> {
    let query = db.select().from(contractTemplates);
    
    if (institutionId) {
      query = query.where(eq(contractTemplates.institutionId, institutionId));
    }
    
    return await query.orderBy(asc(contractTemplates.name));
  }
  
  async createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate> {
    const [newTemplate] = await db
      .insert(contractTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }
  
  async updateContractTemplate(id: number, template: Partial<InsertContractTemplate>): Promise<ContractTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(contractTemplates)
      .set(template)
      .where(eq(contractTemplates.id, id))
      .returning();
    return updatedTemplate;
  }
  
  async deleteContractTemplate(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(contractTemplates)
        .where(eq(contractTemplates.id, id))
        .returning({ id: contractTemplates.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting contract template:", error);
      return false;
    }
  }
  
  // ==================== Contratos ====================
  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }
  
  async getContractByCode(code: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.code, code));
    return contract || undefined;
  }
  
  async getContractsByEnrollment(enrollmentId: number): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.enrollmentId, enrollmentId))
      .orderBy(desc(contracts.createdAt));
  }
  
  async getContractsByStudent(studentId: number): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.studentId, studentId))
      .orderBy(desc(contracts.createdAt));
  }
  
  async createContract(contract: InsertContract): Promise<Contract> {
    // Gera um código único para o contrato
    const code = `CONT${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    const [newContract] = await db
      .insert(contracts)
      .values({
        ...contract,
        code,
      })
      .returning();
    return newContract;
  }
  
  async updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const [updatedContract] = await db
      .update(contracts)
      .set(contract)
      .where(eq(contracts.id, id))
      .returning();
    return updatedContract;
  }
  
  async updateContractStatus(id: number, status: string): Promise<Contract | undefined> {
    const [updatedContract] = await db
      .update(contracts)
      .set({
        status: status as any, // Permitir qualquer status que esteja no enum
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id))
      .returning();
    return updatedContract;
  }
  
  async deleteContract(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(contracts)
        .where(eq(contracts.id, id))
        .returning({ id: contracts.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting contract:", error);
      return false;
    }
  }
  
  // ==================== Gateway de pagamento ====================
  async createPayment(enrollment: Enrollment, gateway: string): Promise<{externalId: string, paymentUrl: string}> {
    const { createPaymentGateway } = await import('./services/payment-gateways');
    
    try {
      console.log(`[STORAGE] Iniciando criação de pagamento para matrícula ${enrollment.code} usando gateway ${gateway}`);
      
      // Buscar dados completos do aluno para o pagamento
      const student = await db.query.users.findFirst({
        where: eq(users.id, enrollment.studentId)
      });
      
      if (!student) {
        console.error(`[STORAGE] Aluno não encontrado: ID ${enrollment.studentId}`);
        throw new Error(`Estudante com ID ${enrollment.studentId} não encontrado`);
      }
      
      console.log(`[STORAGE] Dados do aluno: ${student.fullName}, CPF: ${student.cpf || 'N/A'}, Email: ${student.email || 'N/A'}`);
      
      // Verificar se o CPF e email do aluno estão preenchidos (importantes para Lytex)
      if (gateway === 'lytex' && (!student.cpf || !student.email)) {
        console.error(`[STORAGE] Dados obrigatórios do aluno faltando para gateway Lytex. CPF: ${student.cpf ? 'OK' : 'FALTANDO'}, Email: ${student.email ? 'OK' : 'FALTANDO'}`);
        throw new Error('Para pagamentos Lytex, o CPF e email do aluno são obrigatórios');
      }
      
      // Verificar se o valor da matrícula está preenchido
      if (!enrollment.amount || enrollment.amount <= 0) {
        console.error(`[STORAGE] Valor da matrícula inválido: ${enrollment.amount}`);
        throw new Error('O valor da matrícula é obrigatório e deve ser maior que zero');
      }
      
      console.log(`[STORAGE] Gateway ${gateway} inicializado, chamando createPayment...`);
      
      const paymentGateway = createPaymentGateway(gateway);
      
      // Passar os dados da matrícula respeitando a interface original
      // Não podemos adicionar campos extras como studentData
      const paymentResult = await paymentGateway.createPayment(enrollment);
      
      console.log(`[STORAGE] Pagamento criado com sucesso: ${JSON.stringify(paymentResult)}`);
      
      // Atualizar a matrícula com os dados do pagamento
      await db
        .update(enrollments)
        .set({
          paymentExternalId: paymentResult.externalId,
          paymentUrl: paymentResult.paymentUrl,
          updatedAt: new Date()
        })
        .where(eq(enrollments.id, enrollment.id));
      
      return paymentResult;
    } catch (error) {
      console.error(`[STORAGE] Erro detalhado ao criar pagamento no gateway ${gateway}:`, error);
      if (error.response) {
        console.error(`[STORAGE] Resposta da API: ${error.response.status}`, error.response.data);
      }
      throw error; // Repassar o erro original para tratamento adequado na camada superior
    }
  }
  
  async getPaymentStatus(externalId: string, gateway: string): Promise<string> {
    const { createPaymentGateway } = await import('./services/payment-gateways');
    
    try {
      const paymentGateway = createPaymentGateway(gateway);
      return await paymentGateway.getPaymentStatus(externalId);
    } catch (error) {
      console.error(`Erro ao consultar status do pagamento no gateway ${gateway}:`, error);
      throw new Error(`Falha ao consultar status do pagamento no gateway ${gateway}`);
    }
  }

  // ==================== CRM - Leads ====================
  
  // ==================== CRM - Clients and Contacts ====================
  
  // ==================== CRM - Clientes ====================
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id));
    return client || undefined;
  }
  
  async getClientByDocument(document: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.document, document));
    return client || undefined;
  }
  
  async getClients(search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<Client[]> {
    let query = db
      .select()
      .from(clients)
      .limit(limit)
      .offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(clients.name, `%${search}%`),
          like(clients.email, `%${search}%`),
          like(clients.phone, `%${search}%`),
          like(clients.document, `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(clients.status, status));
    }
    
    return await query.orderBy(desc(clients.createdAt));
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }
  
  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<boolean> {
    try {
      // Primeiro vamos verificar se o cliente existe
      const [client] = await db.select().from(clients).where(eq(clients.id, id));
      if (!client) {
        console.warn(`Cliente com ID ${id} não encontrado`);
        return false;
      }
      
      try {
        // Excluir os contatos do cliente
        const clientContacts = await this.getContactsByClient(id);
        for (const contact of clientContacts) {
          try {
            await db.delete(contacts).where(eq(contacts.id, contact.id));
          } catch (contactError) {
            console.warn(`Erro ao excluir contato ${contact.id} do cliente ${id}:`, contactError);
            // Continua mesmo se houver erro ao excluir um contato
          }
        }
      } catch (contactsError) {
        console.warn(`Erro ao obter/excluir contatos do cliente ${id}:`, contactsError);
        // Continua mesmo se houver erro com os contatos
      }
      
      // Verificar se o cliente tem faturas - apenas para log, não vamos impedir a exclusão
      try {
        const clientInvoices = await this.getInvoicesByClient(id);
        if (clientInvoices.length > 0) {
          console.warn(`Cliente ${id} possui ${clientInvoices.length} faturas que ficarão sem referência após a exclusão`);
        }
      } catch (invoicesError) {
        console.warn(`Erro ao verificar faturas do cliente ${id}:`, invoicesError);
      }
      
      // Excluir o cliente
      try {
        const result = await db
          .delete(clients)
          .where(eq(clients.id, id))
          .returning({ id: clients.id });
        return result.length > 0;
      } catch (deleteError) {
        console.error(`Erro ao excluir cliente ${id}:`, deleteError);
        
        // Se estiver em modo de desenvolvimento, tentamos forçar a exclusão diretamente pelo SQL
        if (process.env.NODE_ENV === 'development') {
          try {
            const { neonConfig, neon } = await import('@neondatabase/serverless');
            const sql = neon(process.env.DATABASE_URL);
            await sql`DELETE FROM clients WHERE id = ${id}`;
            console.log(`Cliente ${id} excluído via SQL direto em modo de desenvolvimento`);
            return true;
          } catch (directDeleteError) {
            console.error(`Falha ao excluir cliente ${id} via SQL direto:`, directDeleteError);
            throw directDeleteError;
          }
        } else {
          throw deleteError;
        }
      }
    } catch (error) {
      console.error(`Erro completo ao excluir cliente ${id}:`, error);
      return false;
    }
  }
  
  // ==================== CRM - Contatos ====================
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(eq(contacts.id, id));
    return contact || undefined;
  }
  
  async getContactsByClient(clientId: number): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.clientId, clientId))
      .orderBy(asc(contacts.name));
  }
  
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }
  
  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updatedContact] = await db
      .update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    return updatedContact;
  }
  
  async deleteContact(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(contacts)
        .where(eq(contacts.id, id))
        .returning({ id: contacts.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting contact:", error);
      return false;
    }
  }
  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProducts(search?: string, type?: string, category?: string, limit: number = 50, offset: number = 0): Promise<Product[]> {
    let query = db.select().from(products).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(products.name, `%${search}%`),
          like(products.code, `%${search}%`),
          like(products.description, `%${search}%`)
        )
      );
    }
    
    if (type) {
      query = query.where(eq(products.type, type));
    }
    
    if (category) {
      query = query.where(eq(products.category, category));
    }
    
    return await query.orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values({
        ...product,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(products)
        .where(eq(products.id, id))
        .returning({ id: products.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  }

  // ==================== Finanças - Faturas ====================
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    try {
      // Usando SQL direto para compatibilidade com o banco de dados atual
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL);
      const result = await sql`
        SELECT 
          id, 
          invoice_number as "invoiceNumber", 
          client_id as "clientId", 
          issue_date as "issueDate", 
          due_date as "dueDate", 
          status,
          total as "totalAmount", 
          notes, 
          created_by_id as "createdById", 
          created_at as "createdAt", 
          updated_at as "updatedAt"
        FROM invoices 
        WHERE client_id = ${clientId}
        ORDER BY created_at DESC
      `;
      return result;
    } catch (error) {
      console.error(`Erro ao buscar faturas do cliente ${clientId}:`, error);
      // Se ocorrer erro, retornamos array vazio para evitar bloqueio do processo
      return []; 
    }
  }

  async getInvoices(search?: string, status?: string, clientId?: number, limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    let query = db.select().from(invoices).limit(limit).offset(offset);
    
    if (search) {
      query = query.where(
        or(
          like(invoices.invoiceNumber, `%${search}%`),
          like(invoices.notes || '', `%${search}%`)
        )
      );
    }
    
    if (status) {
      query = query.where(eq(invoices.status, status));
    }
    
    if (clientId) {
      query = query.where(eq(invoices.clientId, clientId));
    }
    
    return await query.orderBy(desc(invoices.createdAt));
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(asc(invoiceItems.id));
  }

  async createInvoiceWithItems(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    // Iniciar transação
    return await db.transaction(async (tx) => {
      // Inserir a fatura
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          ...invoice,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      // Inserir os itens da fatura
      if (items && items.length > 0) {
        for (const item of items) {
          await tx
            .insert(invoiceItems)
            .values({
              ...item,
              invoiceId: newInvoice.id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
        }
      }
      
      return newInvoice;
    });
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    try {
      // Excluir em transação para garantir integridade
      return await db.transaction(async (tx) => {
        // Primeiro exclui os itens
        await tx
          .delete(invoiceItems)
          .where(eq(invoiceItems.invoiceId, id));
        
        // Depois exclui a fatura
        const result = await tx
          .delete(invoices)
          .where(eq(invoices.id, id))
          .returning({ id: invoices.id });
        
        return result.length > 0;
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      return false;
    }
  }

  // ==================== Finanças - Pagamentos ====================
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }
  
  async getPaymentByAsaasId(asaasId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.asaasId, asaasId));
    return payment || undefined;
  }

  async getPayments(invoiceId?: number, status?: string, method?: string, limit: number = 50, offset: number = 0): Promise<Payment[]> {
    let query = db.select().from(payments).limit(limit).offset(offset);
    
    if (invoiceId) {
      query = query.where(eq(payments.invoiceId, invoiceId));
    }
    
    if (status) {
      query = query.where(eq(payments.status, status));
    }
    
    if (method) {
      query = query.where(eq(payments.method, method));
    }
    
    return await query.orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values({
        ...payment,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newPayment;
  }

  async updatePayment(id: number, paymentData: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        ...paymentData,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }

  async deletePayment(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(payments)
        .where(eq(payments.id, id))
        .returning({ id: payments.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting payment:", error);
      return false;
    }
  }
  
  /**
   * Cria um pagamento para uma fatura usando o gateway Asaas
   */
  async createAsaasPayment(
    invoiceId: number, 
    method: string, 
    autoProcess: boolean = true
  ): Promise<Payment | undefined> {
    try {
      // Importar serviço do Asaas
      const { AsaasPaymentService } = require('./services/asaas-payment-service');
      
      // Buscar a fatura
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) {
        throw new Error(`Fatura não encontrada: ${invoiceId}`);
      }
      
      // Buscar os itens da fatura
      const invoiceItems = await this.getInvoiceItems(invoiceId);
      
      // Buscar o cliente
      const client = await this.getClient(invoice.clientId);
      if (!client) {
        throw new Error(`Cliente não encontrado: ${invoice.clientId}`);
      }
      
      // Verificar se o cliente tem asaasId
      if (!client.asaasId) {
        throw new Error(`Cliente não possui ID do Asaas: ${client.name}`);
      }
      
      // Criar pagamento no Asaas
      const asaasPayment = await AsaasPaymentService.createPayment(
        client.asaasId,
        invoice,
        invoiceItems,
        method
      );
      
      // Criar registro de pagamento no sistema
      const payment = await this.createPayment({
        invoiceId,
        amount: invoice.totalAmount,
        method: method as any, // Necessário por enquanto para evitar erro de tipagem
        paymentDate: new Date(),
        status: 'pending',
        asaasId: asaasPayment.id,
        paymentUrl: asaasPayment.invoiceUrl,
        bankSlipUrl: asaasPayment.bankSlipUrl,
        pixQrCodeUrl: asaasPayment.pixQrCodeUrl
      });
      
      // Se o método for PIX, gerar o QR Code
      if (method === 'pix') {
        try {
          const pixData = await AsaasPaymentService.generatePixQrCode(asaasPayment.id);
          
          // Atualizar o pagamento com os dados do PIX
          await this.updatePayment(payment.id, {
            pixCodeText: pixData.payload as any // Necessário cast temporário devido à interface
          });
        } catch (pixError) {
          console.error('Erro ao gerar QR Code PIX:', pixError);
        }
      }
      
      // Se autoProcess for true, atualizar o status da fatura
      if (autoProcess) {
        await this.updateInvoiceAfterPayment(invoiceId);
      }
      
      return payment;
    } catch (error) {
      console.error('Erro ao criar pagamento via Asaas:', error);
      return undefined;
    }
  }
  
  /**
   * Atualiza o status de um pagamento via Asaas
   */
  async updateAsaasPaymentStatus(paymentId: number): Promise<Payment | undefined> {
    try {
      // Importar serviço do Asaas
      const { AsaasPaymentService } = require('./services/asaas-payment-service');
      
      // Buscar o pagamento
      const payment = await this.getPayment(paymentId);
      if (!payment || !payment.asaasId) {
        throw new Error(`Pagamento não encontrado ou sem ID do Asaas: ${paymentId}`);
      }
      
      // Buscar status atualizado no Asaas
      const { status } = await AsaasPaymentService.updatePaymentStatus(payment.asaasId);
      
      // Atualizar status do pagamento
      const updatedPayment = await this.updatePayment(paymentId, { status });
      
      // Atualizar status da fatura
      if (updatedPayment) {
        await this.updateInvoiceAfterPayment(updatedPayment.invoiceId);
      }
      
      return updatedPayment;
    } catch (error) {
      console.error('Erro ao atualizar status do pagamento via Asaas:', error);
      return undefined;
    }
  }
  
  /**
   * Cancela um pagamento via Asaas
   */
  async cancelAsaasPayment(paymentId: number): Promise<boolean> {
    try {
      // Importar serviço do Asaas
      const { AsaasPaymentService } = require('./services/asaas-payment-service');
      
      // Buscar o pagamento
      const payment = await this.getPayment(paymentId);
      if (!payment || !payment.asaasId) {
        throw new Error(`Pagamento não encontrado ou sem ID do Asaas: ${paymentId}`);
      }
      
      // Cancelar no Asaas
      await AsaasPaymentService.cancelPayment(payment.asaasId);
      
      // Atualizar status do pagamento
      await this.updatePayment(paymentId, { status: 'failed' });
      
      // Atualizar status da fatura
      await this.updateInvoiceAfterPayment(payment.invoiceId);
      
      return true;
    } catch (error) {
      console.error('Erro ao cancelar pagamento via Asaas:', error);
      return false;
    }
  }

  async updateInvoiceAfterPayment(invoiceId: number): Promise<Invoice | undefined> {
    // Obter todos os pagamentos da fatura
    const invoicePayments = await this.getPayments(invoiceId, "completed");
    
    // Obter a fatura
    const invoice = await this.getInvoice(invoiceId);
    
    if (!invoice) {
      return undefined;
    }
    
    // Calcular o total pago
    const totalPaid = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Verificar se o valor total foi pago
    let newStatus;
    if (totalPaid >= invoice.totalAmount) {
      newStatus = "paid";
    } else if (totalPaid > 0) {
      newStatus = "partial";
    } else {
      newStatus = "pending";
    }
    
    // Atualizar o status da fatura
    return await this.updateInvoiceStatus(invoiceId, newStatus);
  }
}

export const storage = new DatabaseStorage();
