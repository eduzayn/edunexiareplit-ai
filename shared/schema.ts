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

// Relações
export const usersRelations = relations(users, ({ many }) => ({
  coursesCreated: many(courses),
  disciplinesCreated: many(disciplines),
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
