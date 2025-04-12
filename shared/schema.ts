import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, pgEnum, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const portalTypes = ["student", "partner", "polo", "admin"] as const;
export type PortalType = typeof portalTypes[number];

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  portalType: text("portal_type").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  coursesCreated: many(courses),
  disciplinesCreated: many(disciplines),
}));

// Tabela de disciplinas
export const courseStatusEnum = pgEnum("course_status", ["draft", "published", "archived"]);
export const evaluationMethodEnum = pgEnum("evaluation_method", ["quiz", "exam", "project", "mixed"]);

// Disciplinas (blocos de construção dos cursos)
export const disciplines = pgTable("disciplines", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  workload: integer("workload").notNull(), // Em horas
  syllabus: text("syllabus").notNull(), // Ementa da disciplina
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const disciplinesRelations = relations(disciplines, ({ many, one }) => ({
  courseDisciplines: many(courseDisciplines),
  createdBy: one(users, {
    fields: [disciplines.createdById],
    references: [users.id],
  }),
}));

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
  requirements: text("requirements"), // Pré-requisitos
  objectives: text("objectives"), // Objetivos
  evaluationMethod: evaluationMethodEnum("evaluation_method").default("mixed"),
  materialIds: json("material_ids").$type<number[]>(), // IDs dos materiais didáticos
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"), // Data de publicação
});

export const coursesRelations = relations(courses, ({ many, one }) => ({
  courseDisciplines: many(courseDisciplines),
  createdBy: one(users, {
    fields: [courses.createdById],
    references: [users.id],
  }),
}));

// Tabela de junção entre cursos e disciplinas
export const courseDisciplines = pgTable("course_disciplines", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  disciplineId: integer("discipline_id").notNull().references(() => disciplines.id, { onDelete: 'cascade' }),
  order: integer("order").notNull(), // Ordem da disciplina no curso
  isRequired: boolean("is_required").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
  evaluationMethod: true,
  materialIds: true,
  createdById: true,
});

export const insertCourseDisciplineSchema = createInsertSchema(courseDisciplines).pick({
  courseId: true,
  disciplineId: true,
  order: true,
  isRequired: true,
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
