import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Tipos de portal
export const portalTypes = ["student", "partner", "polo", "admin"] as const;
export type PortalType = typeof portalTypes[number];

// Enums
export const courseStatusEnum = pgEnum("course_status", ["draft", "published", "archived"]);
export const evaluationMethodEnum = pgEnum("evaluation_method", ["quiz", "exam", "project", "mixed"]);
export const courseModalityEnum = pgEnum("course_modality", ["ead", "hybrid", "presential"]);
export const videoSourceEnum = pgEnum("video_source", ["youtube", "onedrive", "google_drive", "vimeo", "upload"]);
export const contentCompletionStatusEnum = pgEnum("content_completion_status", ["incomplete", "complete"]);
export const assessmentTypeEnum = pgEnum("assessment_type", ["simulado", "avaliacao_final"]);
export const institutionStatusEnum = pgEnum("institution_status", ["active", "inactive", "pending"]);
export const poloStatusEnum = pgEnum("polo_status", ["active", "inactive"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["pending_payment", "active", "completed", "cancelled", "suspended"]);
export const paymentGatewayEnum = pgEnum("payment_gateway", ["asaas", "lytex"]);
export const integrationTypeEnum = pgEnum("integration_type", ["asaas", "lytex", "openai", "elevenlabs", "zapi"]);

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  portalType: text("portal_type").notNull(),
});

// Disciplinas (blocos de construção dos cursos)
export const disciplines = pgTable("disciplines", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  workload: integer("workload").notNull(), // Em horas
  syllabus: text("syllabus").notNull(), // Ementa da disciplina
  
  // Elementos de conteúdo
  videoAula1Url: text("video_aula1_url"), // URL do vídeo 1
  videoAula1Source: videoSourceEnum("video_aula1_source"), // Fonte do vídeo 1
  videoAula2Url: text("video_aula2_url"), // URL do vídeo 2
  videoAula2Source: videoSourceEnum("video_aula2_source"), // Fonte do vídeo 2
  apostilaPdfUrl: text("apostila_pdf_url"), // URL da apostila PDF
  ebookInterativoUrl: text("ebook_interativo_url"), // URL do e-book interativo
  
  // Status de completude
  contentStatus: contentCompletionStatusEnum("content_status").default("incomplete").notNull(),
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cursos (compostos por várias disciplinas)
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: courseStatusEnum("status").default("draft").notNull(),
  workload: integer("workload").notNull(), // Em horas
  price: doublePrecision("price"), // Preço do curso
  thumbnail: text("thumbnail"), // URL da imagem de capa
  requirements: text("requirements"), // Pré-requisitos (opcional)
  objectives: text("objectives"), // Objetivos do curso
  category: text("category"), // Categoria do curso
  modality: courseModalityEnum("modality").default("ead").notNull(), // Modalidade (EAD, híbrido, presencial)
  evaluationMethod: evaluationMethodEnum("evaluation_method").default("mixed"),
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"), // Data de publicação
});

// Tabela de junção entre cursos e disciplinas
export const courseDisciplines = pgTable("course_disciplines", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  disciplineId: integer("discipline_id").notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  order: integer("order").notNull(), // Ordem da disciplina no curso
  isRequired: boolean("is_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Questões para simulados e avaliações
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  disciplineId: integer("discipline_id").notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  statement: text("statement").notNull(), // Enunciado da questão
  options: json("options").$type<string[]>().notNull(), // Alternativas
  correctOption: integer("correct_option").notNull(), // Índice da alternativa correta
  explanation: text("explanation"), // Explicação para feedback
  questionType: text("question_type").default("multiple_choice").notNull(), // Tipo de questão
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Avaliações (simulados e avaliações finais)
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  disciplineId: integer("discipline_id").notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  title: text("title").notNull(), // Título da atividade
  description: text("description"), // Descrição da atividade
  type: assessmentTypeEnum("type").notNull(), // Tipo: simulado ou avaliação final
  passingScore: integer("passing_score").default(60).notNull(), // Nota mínima para aprovação (%)
  timeLimit: integer("time_limit"), // Tempo limite em minutos (opcional)
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relação entre atividades avaliativas e questões
export const assessmentQuestions = pgTable("assessment_questions", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: 'cascade' }),
  order: integer("order").notNull(), // Ordem da questão na atividade
  weight: doublePrecision("weight").default(1).notNull(), // Peso da questão na nota final
});

// Instituições
// Polos (unidades físicas da instituição)
export const polos = pgTable("polos", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  institutionId: integer("institution_id").notNull().references(() => institutions.id, { onDelete: 'cascade' }),
  managerName: text("manager_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  status: poloStatusEnum("status").default("active").notNull(),
  capacity: integer("capacity"), // Capacidade de alunos
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transações financeiras
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // entrada ou saida
  amount: doublePrecision("amount").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: text("status").notNull(), // concluído, pendente, agendado
  institutionId: integer("institution_id").references(() => institutions.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categorias financeiras
export const financialCategories = pgTable("financial_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // entrada ou saida
  description: text("description"),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Matrículas
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Código único da matrícula, ex: MAT2025001
  studentId: integer("student_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  poloId: integer("polo_id").references(() => polos.id), // Opcional
  institutionId: integer("institution_id").notNull().references(() => institutions.id),
  partnerId: integer("partner_id").references(() => users.id), // Opcional, para comissões
  
  // Dados financeiros
  amount: doublePrecision("amount").notNull(), // Valor total da matrícula
  paymentGateway: paymentGatewayEnum("payment_gateway").notNull(), // Asaas ou Lytex
  paymentExternalId: text("payment_external_id"), // ID da cobrança no gateway
  paymentUrl: text("payment_url"), // URL de pagamento
  paymentMethod: text("payment_method"), // boleto, pix, cartão, etc
  
  // Datas importantes
  enrollmentDate: timestamp("enrollment_date").defaultNow().notNull(), // Data da matrícula
  startDate: timestamp("start_date"), // Data de início do curso
  expectedEndDate: timestamp("expected_end_date"), // Data prevista de conclusão
  actualEndDate: timestamp("actual_end_date"), // Data efetiva de conclusão
  
  // Status e informações adicionais
  status: enrollmentStatusEnum("status").default("pending_payment").notNull(),
  observations: text("observations"),
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Histórico de status das matrículas
export const enrollmentStatusHistory = pgTable("enrollment_status_history", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  previousStatus: enrollmentStatusEnum("previous_status"),
  newStatus: enrollmentStatusEnum("new_status").notNull(),
  changeDate: timestamp("change_date").defaultNow().notNull(),
  changeReason: text("change_reason"),
  changedById: integer("changed_by_id").references(() => users.id),
  metadata: json("metadata"), // Pode armazenar payloads de webhooks ou informações adicionais
});

// Integrações com APIs externas
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  type: integrationTypeEnum("type").notNull(), // asaas, lytex, openai, elevenlabs, zapi
  name: text("name").notNull(), // Nome para identificação da integração
  apiKey: text("api_key").notNull(), // Chave de API (criptografada)
  apiSecret: text("api_secret"), // Secret opcional (criptografado)
  additionalConfig: json("additional_config"), // Configurações adicionais específicas da integração
  isActive: boolean("is_active").default(true).notNull(),
  institutionId: integer("institution_id").references(() => institutions.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const institutions = pgTable("institutions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull().unique(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  status: institutionStatusEnum("status").default("active").notNull(),
  logo: text("logo"), // URL do logo
  primaryColor: text("primary_color").default("#4CAF50"),
  website: text("website"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relações
export const usersRelations = relations(users, ({ many }) => ({
  coursesCreated: many(courses),
  disciplinesCreated: many(disciplines),
  institutionsCreated: many(institutions),
  polosCreated: many(polos),
  financialTransactionsCreated: many(financialTransactions),
  financialCategoriesCreated: many(financialCategories),
  enrollments: many(enrollments, { relationName: "studentEnrollments" }),
  partnerEnrollments: many(enrollments, { relationName: "partnerEnrollments" }),
  integrationsCreated: many(integrations),
}));

export const institutionsRelations = relations(institutions, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [institutions.createdById],
    references: [users.id],
  }),
  polos: many(polos),
  financialTransactions: many(financialTransactions),
  financialCategories: many(financialCategories),
  enrollments: many(enrollments),
  integrations: many(integrations),
}));

export const polosRelations = relations(polos, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [polos.institutionId],
    references: [institutions.id],
  }),
  enrollments: many(enrollments),
  createdBy: one(users, {
    fields: [polos.createdById],
    references: [users.id],
  }),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  institution: one(institutions, {
    fields: [financialTransactions.institutionId],
    references: [institutions.id],
  }),
  createdBy: one(users, {
    fields: [financialTransactions.createdById],
    references: [users.id],
  }),
}));

export const financialCategoriesRelations = relations(financialCategories, ({ one }) => ({
  institution: one(institutions, {
    fields: [financialCategories.institutionId],
    references: [institutions.id],
  }),
  createdBy: one(users, {
    fields: [financialCategories.createdById],
    references: [users.id],
  }),
}));

export const disciplinesRelations = relations(disciplines, ({ many, one }) => ({
  courseDisciplines: many(courseDisciplines),
  questions: many(questions),
  assessments: many(assessments),
  createdBy: one(users, {
    fields: [disciplines.createdById],
    references: [users.id],
  }),
}));

export const coursesRelations = relations(courses, ({ many, one }) => ({
  courseDisciplines: many(courseDisciplines),
  enrollments: many(enrollments),
  createdBy: one(users, {
    fields: [courses.createdById],
    references: [users.id],
  }),
}));

export const courseDisciplinesRelations = relations(courseDisciplines, ({ one }) => ({
  course: one(courses, {
    fields: [courseDisciplines.courseId],
    references: [courses.id],
  }),
  discipline: one(disciplines, {
    fields: [courseDisciplines.disciplineId],
    references: [disciplines.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  discipline: one(disciplines, {
    fields: [questions.disciplineId],
    references: [disciplines.id],
  }),
  assessmentQuestions: many(assessmentQuestions),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  discipline: one(disciplines, {
    fields: [assessments.disciplineId],
    references: [disciplines.id],
  }),
  assessmentQuestions: many(assessmentQuestions),
}));

export const assessmentQuestionsRelations = relations(assessmentQuestions, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentQuestions.assessmentId],
    references: [assessments.id],
  }),
  question: one(questions, {
    fields: [assessmentQuestions.questionId],
    references: [questions.id],
  }),
}));

// Relações de Matrículas
export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id],
    relationName: "studentEnrollments",
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
  polo: one(polos, {
    fields: [enrollments.poloId],
    references: [polos.id],
  }),
  institution: one(institutions, {
    fields: [enrollments.institutionId],
    references: [institutions.id],
  }),
  partner: one(users, {
    fields: [enrollments.partnerId],
    references: [users.id],
    relationName: "partnerEnrollments",
  }),
  createdBy: one(users, {
    fields: [enrollments.createdById],
    references: [users.id],
  }),
  statusHistory: many(enrollmentStatusHistory),
}));

// Relações de Histórico de Status de Matrículas
export const enrollmentStatusHistoryRelations = relations(enrollmentStatusHistory, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [enrollmentStatusHistory.enrollmentId],
    references: [enrollments.id],
  }),
  changedBy: one(users, {
    fields: [enrollmentStatusHistory.changedById],
    references: [users.id],
  }),
}));

// Relações de Integrações
export const integrationsRelations = relations(integrations, ({ one }) => ({
  institution: one(institutions, {
    fields: [integrations.institutionId],
    references: [institutions.id],
  }),
  createdBy: one(users, {
    fields: [integrations.createdById],
    references: [users.id],
  }),
}));

// Schemas para inserção
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  portalType: true,
});

export const insertDisciplineSchema = createInsertSchema(disciplines).pick({
  code: true,
  name: true,
  description: true,
  workload: true,
  syllabus: true,
  videoAula1Url: true,
  videoAula1Source: true,
  videoAula2Url: true,
  videoAula2Source: true,
  apostilaPdfUrl: true,
  ebookInterativoUrl: true,
  contentStatus: true,
  createdById: true,
});

export const insertCourseSchema = createInsertSchema(courses).pick({
  code: true,
  name: true,
  description: true,
  status: true,
  workload: true,
  price: true,
  thumbnail: true,
  requirements: true,
  objectives: true,
  category: true,
  modality: true,
  evaluationMethod: true,
  createdById: true,
});

export const insertCourseDisciplineSchema = createInsertSchema(courseDisciplines, {
  isRequired: z.boolean().default(true),
}).pick({
  courseId: true,
  disciplineId: true,
  order: true,
  isRequired: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  disciplineId: true,
  statement: true,
  options: true,
  correctOption: true,
  explanation: true,
  questionType: true,
  createdById: true,
});

export const insertAssessmentSchema = createInsertSchema(assessments).pick({
  disciplineId: true,
  title: true,
  description: true,
  type: true,
  passingScore: true,
  timeLimit: true,
  createdById: true,
});

export const insertAssessmentQuestionSchema = createInsertSchema(assessmentQuestions).pick({
  assessmentId: true,
  questionId: true,
  order: true,
  weight: true,
});

export const insertInstitutionSchema = createInsertSchema(institutions).pick({
  code: true,
  name: true,
  cnpj: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  status: true,
  logo: true,
  primaryColor: true,
  website: true,
  createdById: true,
});

// Schema para autenticação
export const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  portalType: z.enum(portalTypes),
});

// Tipos exportados
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;

export type InsertDiscipline = z.infer<typeof insertDisciplineSchema>;
export type Discipline = typeof disciplines.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertCourseDiscipline = z.infer<typeof insertCourseDisciplineSchema>;
export type CourseDiscipline = typeof courseDisciplines.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

export type InsertAssessmentQuestion = z.infer<typeof insertAssessmentQuestionSchema>;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;

export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutions.$inferSelect;

// Schemas e tipos para Polos
export const insertPoloSchema = createInsertSchema(polos).pick({
  code: true,
  name: true,
  institutionId: true,
  managerName: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  postalCode: true,
  status: true,
  capacity: true,
  createdById: true,
});
export type InsertPolo = z.infer<typeof insertPoloSchema>;
export type Polo = typeof polos.$inferSelect;

// Schemas e tipos para Transações Financeiras
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).pick({
  type: true,
  amount: true,
  description: true,
  category: true,
  date: true,
  status: true,
  institutionId: true,
  createdById: true,
});
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

// Schemas e tipos para Categorias Financeiras
export const insertFinancialCategorySchema = createInsertSchema(financialCategories).pick({
  name: true,
  type: true,
  description: true,
  institutionId: true,
  createdById: true,
});
export type InsertFinancialCategory = z.infer<typeof insertFinancialCategorySchema>;
export type FinancialCategory = typeof financialCategories.$inferSelect;

// Schemas e tipos para Matrículas
export const insertEnrollmentSchema = createInsertSchema(enrollments).pick({
  code: true,
  studentId: true,
  courseId: true,
  poloId: true,
  institutionId: true,
  partnerId: true,
  amount: true,
  paymentGateway: true,
  paymentExternalId: true,
  paymentUrl: true,
  paymentMethod: true,
  enrollmentDate: true,
  startDate: true,
  expectedEndDate: true,
  actualEndDate: true,
  status: true,
  observations: true,
  createdById: true,
});
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Schemas e tipos para Histórico de Status de Matrículas
export const insertEnrollmentStatusHistorySchema = createInsertSchema(enrollmentStatusHistory).pick({
  enrollmentId: true,
  previousStatus: true,
  newStatus: true,
  changeDate: true,
  changeReason: true,
  changedById: true,
  metadata: true,
});
export type InsertEnrollmentStatusHistory = z.infer<typeof insertEnrollmentStatusHistorySchema>;
export type EnrollmentStatusHistory = typeof enrollmentStatusHistory.$inferSelect;

// Schemas e tipos para Integrações
export const insertIntegrationSchema = createInsertSchema(integrations).pick({
  type: true,
  name: true,
  apiKey: true,
  apiSecret: true,
  additionalConfig: true,
  isActive: true,
  institutionId: true,
  createdById: true,
});
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;
