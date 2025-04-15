import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, pgEnum, date } from "drizzle-orm/pg-core";
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

// Enums para o módulo CRM e Gestão
export const leadStatusEnum = pgEnum("lead_status", ["novo", "contatado", "qualificado", "negociacao", "convertido", "perdido"]);
export const clientTypeEnum = pgEnum("client_type", ["pf", "pj"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "pending", "paid", "overdue", "cancelled", "partial"]);
export const paymentStatusEnum = pgEnum("payment_status", ["completed", "pending", "failed", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["credit_card", "debit_card", "bank_slip", "bank_transfer", "pix", "cash", "other"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "cancelled", "expired"]);

// Enums para o sistema de permissões
export const permissionResourceEnum = pgEnum("permission_resource", [
  "matricula", "pagamento", "curso", "disciplina", "polo", 
  "usuario", "papel", "relatorio", "configuracao", "instituicao",
  "lead", "cliente", "contato", "fatura", "assinatura", "certificado"
]);
export const permissionActionEnum = pgEnum("permission_action", [
  "criar", "ler", "atualizar", "deletar", "listar", "aprovar", 
  "rejeitar", "cancelar", "gerar_cobranca", "confirmar", "ler_historico", 
  "editar_grade", "publicar", "definir_comissao", "convidar", 
  "atribuir", "gerar_financeiro", "editar_instituicao"
]);

// Tipos de curso
export const courseTypes = pgTable("course_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  cpf: text("cpf"), // CPF do usuário (obrigatório para alunos)
  phone: text("phone"), // Telefone de contato do usuário
  address: text("address"), // Endereço completo
  city: text("city"), // Cidade
  state: text("state"), // Estado (UF)
  zipCode: text("zip_code"), // CEP
  birthDate: text("birth_date"), // Data de nascimento
  portalType: text("portal_type").notNull(),
  poloId: integer("polo_id").references(() => polos.id), // Referência ao polo (para usuários do tipo "polo")
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
  
  // Rastreamento e Auditoria
  sourceChannel: text("source_channel"), // Canal de origem: admin, polo_portal, website, app, etc.
  referenceCode: text("reference_code"), // Código de referência para rastreamento de campanhas  
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id), // Quem criou a matrícula
  updatedById: integer("updated_by_id").references(() => users.id), // Quem atualizou por último
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
  poloId: integer("polo_id").references(() => polos.id), // Qual polo realizou a operação (se aplicável)
  sourceChannel: text("source_channel"), // Canal de origem da operação (admin, polo, website)
  ipAddress: text("ip_address"), // Endereço IP de onde veio a requisição
  userAgent: text("user_agent"), // Informações do navegador/dispositivo
});

// Auditoria de matrículas (mais abrangente que o histórico de status)
export const enrollmentAudits = pgTable("enrollment_audits", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  actionType: text("action_type").notNull(), // create, update, status_change, payment_update
  performedById: integer("performed_by_id").references(() => users.id),
  performedByType: text("performed_by_type").notNull(), // admin, polo, system, student
  poloId: integer("polo_id").references(() => polos.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: json("details"), // Detalhes específicos da ação
  beforeState: json("before_state"), // Estado antes da alteração
  afterState: json("after_state"), // Estado após a alteração
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
  
  // Campos para gerenciamento do trial
  isOnTrial: boolean("is_on_trial").default(false),
  trialStartDate: timestamp("trial_start_date"),
  trialEndDate: timestamp("trial_end_date"),
  
  // Plano atual
  currentPlanId: integer("current_plan_id").references(() => subscriptionPlans.id),
  
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Módulo CRM
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  source: text("source"), // Como o cliente conheceu a empresa (site, indicação, etc.)
  interest: text("interest"), // Área de interesse (ex: graduação, pós-graduação)
  status: leadStatusEnum("status").default("novo").notNull(),
  notes: text("notes"),
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: clientTypeEnum("type").default("pj").notNull(), // Pessoa física ou jurídica
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  
  // Documentos
  cpfCnpj: text("cpf_cnpj").notNull(), // CPF ou CNPJ
  rgIe: text("rg_ie"), // RG ou Inscrição Estadual
  
  // Endereço
  zipCode: text("zip_code").notNull(),
  street: text("street").notNull(),
  number: text("number").notNull(),
  complement: text("complement"),
  neighborhood: text("neighborhood").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  
  // Informações adicionais
  segment: text("segment"), // Segmento de atuação
  website: text("website"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Integrações
  asaasId: text("asaas_id"), // ID do cliente no Asaas
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  position: text("position").notNull(), // Cargo
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // Papel no processo de compra (decisor, influenciador, etc.)
  department: text("department"), // Departamento
  notes: text("notes"),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Módulo Finanças
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  type: text("type").notNull(), // course ou service
  category: text("category").notNull(),
  description: text("description").notNull(),
  
  // Detalhes específicos
  workload: integer("workload"), // Carga horária (para cursos)
  duration: integer("duration"), // Duração
  durationUnit: text("duration_unit").default("months"), // Unidade de duração (dias, semanas, meses, anos)
  tags: text("tags"), // Tags para busca
  
  // Preços
  price: doublePrecision("price").notNull(),
  costPrice: doublePrecision("cost_price"), // Custo interno
  taxRate: doublePrecision("tax_rate"), // Taxa de imposto (%)
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isDigital: boolean("is_digital").default(true).notNull(),
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  contractId: integer("contract_id").references(() => contracts.id),
  
  // Datas
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  
  // Status e valores
  status: invoiceStatusEnum("status").default("draft").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  
  // Notas e metadados
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  productId: integer("product_id").notNull().references(() => products.id),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  discount: doublePrecision("discount").default(0).notNull(),
  tax: doublePrecision("tax").default(0).notNull(),
  
  // Metadados
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  amount: doublePrecision("amount").notNull(),
  method: paymentMethodEnum("method").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  status: paymentStatusEnum("status").default("completed").notNull(),
  transactionId: text("transaction_id"), // ID da transação (para métodos eletrônicos)
  notes: text("notes"),
  
  // Campos de integração com Asaas
  asaasId: text("asaas_id"), // ID do pagamento no Asaas
  paymentUrl: text("payment_url"), // URL para pagamento
  paymentLinkUrl: text("payment_link_url"), // URL do link de pagamento
  bankSlipUrl: text("bank_slip_url"), // URL do boleto bancário
  pixQrCodeUrl: text("pix_qr_code_url"), // URL da imagem do QR Code PIX
  pixCodeText: text("pix_code_text"), // Código PIX para copia e cola
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enums para certificados
export const certificateStatusEnum = pgEnum("certificate_status", ["draft", "issued", "revoked"]);
export const certificateTemplateTypeEnum = pgEnum("certificate_template_type", ["default", "custom"]);
export const teacherTitleEnum = pgEnum("teacher_title", ["Especialista", "Mestre", "Doutor", "Pós-Doutor"]);

// Templates de certificados
export const certificateTemplates = pgTable("certificate_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: certificateTemplateTypeEnum("type").default("default").notNull(),
  htmlTemplate: text("html_template").notNull(), // Template HTML para renderização do certificado
  cssStyles: text("css_styles"), // Estilos CSS para o template
  defaultTitle: text("default_title").default("Certificado").notNull(), // Título padrão (pode ser sobrescrito)
  isActive: boolean("is_active").default(true).notNull(),
  previewImageUrl: text("preview_image_url"), // URL da imagem de preview do template
  institutionId: integer("institution_id").references(() => institutions.id), // Opcional, para templates específicos de instituição
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Signatários (pessoas que assinam os certificados)
export const certificateSigners = pgTable("certificate_signers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // Cargo (Diretor, Coordenador, etc.)
  signatureImageUrl: text("signature_image_url"), // URL da imagem da assinatura
  isActive: boolean("is_active").default(true).notNull(),
  institutionId: integer("institution_id").references(() => institutions.id), // Opcional, para signatários específicos de instituição
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Certificados emitidos
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Código único para validação e consultas
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  institutionId: integer("institution_id").notNull().references(() => institutions.id),
  
  // Dados do certificado
  templateId: integer("template_id").notNull().references(() => certificateTemplates.id),
  title: text("title").notNull(), // Título do certificado (ex: Certificado, Diploma)
  
  // Dados do aluno
  studentName: text("student_name").notNull(),
  studentCpf: text("student_cpf").notNull(),
  studentBirthDate: date("student_birth_date"),
  studentNationality: text("student_nationality"), // Naturalidade
  
  // Dados do curso
  courseName: text("course_name").notNull(),
  courseWorkload: integer("course_workload").notNull(), // Carga horária total
  knowledgeArea: text("knowledge_area"), // Área de conhecimento
  courseStartDate: date("course_start_date"),
  courseEndDate: date("course_end_date"),
  
  // Assinatura do certificado
  signerId: integer("signer_id").references(() => certificateSigners.id),
  signerName: text("signer_name"), // Redundância para preservar o nome mesmo se o signatário for excluído
  signerRole: text("signer_role"), // Cargo do signatário
  
  // Metadados do certificado
  pdfUrl: text("pdf_url"), // URL do arquivo PDF gerado
  status: certificateStatusEnum("status").default("draft").notNull(),
  issueDate: timestamp("issue_date"), // Data de emissão
  expirationDate: timestamp("expiration_date"), // Data de expiração (opcional)
  verificationUrl: text("verification_url"), // URL para verificação pública
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Disciplinas cursadas (para serem incluídas no certificado)
export const certificateDisciplines = pgTable("certificate_disciplines", {
  id: serial("id").primaryKey(),
  certificateId: integer("certificate_id").notNull().references(() => certificates.id, { onDelete: 'cascade' }),
  disciplineName: text("discipline_name").notNull(),
  teacherName: text("teacher_name").notNull(),
  teacherTitle: teacherTitleEnum("teacher_title").notNull(),
  workload: integer("workload").notNull(), // Carga horária da disciplina
  frequency: integer("frequency"), // Frequência em porcentagem
  performance: text("performance"), // Desempenho/aproveitamento
  order: integer("order").default(0).notNull(), // Ordem de exibição
});

// Histórico de operações com certificados
export const certificateHistory = pgTable("certificate_history", {
  id: serial("id").primaryKey(),
  certificateId: integer("certificate_id").notNull().references(() => certificates.id),
  action: text("action").notNull(), // create, issue, revoke, verify
  performedById: integer("performed_by_id").references(() => users.id),
  performedByType: text("performed_by_type").notNull(), // admin, system
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: json("details"), // Detalhes da operação
});

// Relações
export const usersRelations = relations(users, ({ many, one }) => ({
  coursesCreated: many(courses),
  disciplinesCreated: many(disciplines),
  institutionsCreated: many(institutions),
  polosCreated: many(polos),
  userRoles: many(userRoles), // Relação com papéis (roles) atribuídos ao usuário
  userPermissions: many(userPermissions), // Relação com permissões atribuídas diretamente ao usuário
  polo: one(polos, { // Relação com o polo associado ao usuário (para usuários do tipo "polo")
    fields: [users.poloId],
    references: [polos.id],
  }),
  financialTransactionsCreated: many(financialTransactions),
  financialCategoriesCreated: many(financialCategories),
  enrollments: many(enrollments, { relationName: "studentEnrollments" }),
  partnerEnrollments: many(enrollments, { relationName: "partnerEnrollments" }),
  createdEnrollments: many(enrollments, { relationName: "createdEnrollments" }),
  updatedEnrollments: many(enrollments, { relationName: "updatedEnrollments" }),
  integrationsCreated: many(integrations),
  certificatesReceived: many(certificates, { relationName: "studentCertificates" }), // Certificados em que este usuário é o aluno
  certificatesCreated: many(certificates, { relationName: "createdCertificates" }), // Certificados criados por este usuário
  certificateTemplatesCreated: many(certificateTemplates),
  certificateSignersCreated: many(certificateSigners),
  leadsCreated: many(leads),
  clientsCreated: many(clients),
  productsCreated: many(products),
  invoicesCreated: many(invoices),
  paymentsCreated: many(payments),
}));

// Declaração adiantada para evitar referência circular
// Estrutura de planos de assinatura será definida após as tabelas instituições
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  
  // Preço e período
  price: doublePrecision("price").notNull(),
  billingCycle: text("billing_cycle").notNull(), // monthly, annual
  trialDays: integer("trial_days").default(0), // Dias de trial (0 = sem trial)
  
  // Limites
  maxStudents: integer("max_students").notNull(), // Número máximo de alunos
  maxCourses: integer("max_courses"), // Número máximo de cursos
  maxPolos: integer("max_polos"), // Número máximo de polos
  
  // Features disponíveis
  hasFinanceModule: boolean("has_finance_module").default(false),
  hasCrmModule: boolean("has_crm_module").default(false),
  hasMultiChannelChat: boolean("has_multi_channel_chat").default(false),
  hasAdvancedReports: boolean("has_advanced_reports").default(false),
  hasApiAccess: boolean("has_api_access").default(false),
  hasPrioritySupportl: boolean("has_priority_support").default(false),
  
  // Status e destaque
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false),
  displayOrder: integer("display_order").default(0),
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Declaração adiantada para evitar referência circular
// A tabela de assinaturas será populada mais tarde
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  institutionId: integer("institution_id"), // Será definido após declaração da tabela institutions
  planId: integer("plan_id").references(() => subscriptionPlans.id),
  
  // Status e datas
  status: subscriptionStatusEnum("status").default("trial").notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  
  // Pagamentos
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  
  // Detalhes financeiros
  price: doublePrecision("price").notNull(),
  
  // Integração com gateway de pagamento
  asaasId: text("asaas_id"), // ID da assinatura no Asaas
  
  // Metadados
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const institutionsRelations = relations(institutions, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [institutions.createdById],
    references: [users.id],
  }),
  currentPlan: one(subscriptionPlans, {
    fields: [institutions.currentPlanId],
    references: [subscriptionPlans.id],
  }),
  subscriptions: many(subscriptions),
  polos: many(polos),
  financialTransactions: many(financialTransactions),
  financialCategories: many(financialCategories),
  enrollments: many(enrollments),
  integrations: many(integrations),
  certificateTemplates: many(certificateTemplates),
  certificateSigners: many(certificateSigners),
  certificates: many(certificates),
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
  updatedBy: one(users, {
    fields: [enrollments.updatedById],
    references: [users.id],
    relationName: "updatedEnrollments",
  }),
  statusHistory: many(enrollmentStatusHistory),
  audits: many(enrollmentAudits),
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
  polo: one(polos, {
    fields: [enrollmentStatusHistory.poloId],
    references: [polos.id],
  }),
}));

// Relações de Auditoria de Matrículas
export const enrollmentAuditsRelations = relations(enrollmentAudits, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [enrollmentAudits.enrollmentId],
    references: [enrollments.id],
  }),
  performedBy: one(users, {
    fields: [enrollmentAudits.performedById],
    references: [users.id],
  }),
  polo: one(polos, {
    fields: [enrollmentAudits.poloId],
    references: [polos.id],
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

// Relações de Templates de Certificados
export const certificateTemplatesRelations = relations(certificateTemplates, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [certificateTemplates.institutionId],
    references: [institutions.id],
  }),
  createdBy: one(users, {
    fields: [certificateTemplates.createdById],
    references: [users.id],
  }),
  certificates: many(certificates),
}));

// Relações de Signatários de Certificados
export const certificateSignersRelations = relations(certificateSigners, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [certificateSigners.institutionId],
    references: [institutions.id],
  }),
  createdBy: one(users, {
    fields: [certificateSigners.createdById],
    references: [users.id],
  }),
  certificates: many(certificates),
}));

// Relações de CRM
export const leadsRelations = relations(leads, ({ one }) => ({
  createdBy: one(users, {
    fields: [leads.createdById],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  contacts: many(contacts),
  invoices: many(invoices),
  contracts: many(contracts),
  createdBy: one(users, {
    fields: [clients.createdById],
    references: [users.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  client: one(clients, {
    fields: [contacts.clientId],
    references: [clients.id],
  }),
}));

// Relações de Finanças
export const productsRelations = relations(products, ({ one, many }) => ({
  invoiceItems: many(invoiceItems),
  createdBy: one(users, {
    fields: [products.createdById],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  contract: one(contracts, {
    fields: [invoices.contractId],
    references: [contracts.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  createdBy: one(users, {
    fields: [invoices.createdById],
    references: [users.id],
  }),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdById],
    references: [users.id],
  }),
}));

// Relações de Certificados
export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  enrollment: one(enrollments, {
    fields: [certificates.enrollmentId],
    references: [enrollments.id],
  }),
  student: one(users, {
    fields: [certificates.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [certificates.courseId],
    references: [courses.id],
  }),
  institution: one(institutions, {
    fields: [certificates.institutionId],
    references: [institutions.id],
  }),
  template: one(certificateTemplates, {
    fields: [certificates.templateId],
    references: [certificateTemplates.id],
  }),
  signer: one(certificateSigners, {
    fields: [certificates.signerId],
    references: [certificateSigners.id],
  }),
  createdBy: one(users, {
    fields: [certificates.createdById],
    references: [users.id],
  }),
  disciplines: many(certificateDisciplines),
  history: many(certificateHistory),
}));

// Relações de Disciplinas de Certificados
export const certificateDisciplinesRelations = relations(certificateDisciplines, ({ one }) => ({
  certificate: one(certificates, {
    fields: [certificateDisciplines.certificateId],
    references: [certificates.id],
  }),
}));

// Relações de Histórico de Certificados
export const certificateHistoryRelations = relations(certificateHistory, ({ one }) => ({
  certificate: one(certificates, {
    fields: [certificateHistory.certificateId],
    references: [certificates.id],
  }),
  performedBy: one(users, {
    fields: [certificateHistory.performedById],
    references: [users.id],
  }),
}));

// Schemas para inserção
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  cpf: true,
  phone: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  birthDate: true,
  portalType: true,
  poloId: true,
}).transform(data => {
  // CPF obrigatório apenas para alunos
  if (data.portalType === 'student' && !data.cpf) {
    throw new Error('CPF é obrigatório para alunos');
  }
  
  // poloId obrigatório apenas para usuários do tipo polo
  if (data.portalType === 'polo' && !data.poloId) {
    throw new Error('É necessário associar este usuário a um polo');
  }
  
  return data;
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
  poloId: true,
  sourceChannel: true,
  ipAddress: true,
  userAgent: true,
});
export type InsertEnrollmentStatusHistory = z.infer<typeof insertEnrollmentStatusHistorySchema>;
export type EnrollmentStatusHistory = typeof enrollmentStatusHistory.$inferSelect;

// Schemas e tipos para Auditoria de Matrículas
export const insertEnrollmentAuditSchema = createInsertSchema(enrollmentAudits).pick({
  enrollmentId: true,
  actionType: true,
  performedById: true,
  performedByType: true,
  poloId: true,
  timestamp: true,
  ipAddress: true,
  userAgent: true,
  details: true,
  beforeState: true,
  afterState: true,
});
export type InsertEnrollmentAudit = z.infer<typeof insertEnrollmentAuditSchema>;
export type EnrollmentAudit = typeof enrollmentAudits.$inferSelect;

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

// Enum para status de contratos
export const contractStatusEnum = pgEnum("contract_status", ["pending", "signed", "cancelled", "expired"]);

// Templates de Contrato
export const contractTemplates = pgTable("contract_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(), // Conteúdo do template em formato HTML ou Markdown
  version: text("version").notNull(),
  courseTypeId: integer("course_type_id").references(() => courseTypes.id),
  institutionId: integer("institution_id").notNull().references(() => institutions.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contratos gerados para alunos
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Código único do contrato, ex: CTR2025001
  enrollmentId: integer("enrollment_id").notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  templateId: integer("template_id").references(() => contractTemplates.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => courses.id),
  content: text("content").notNull(), // Conteúdo final do contrato após preenchimento de variáveis
  signatureRequired: boolean("signature_required").default(true).notNull(),
  studentSignedAt: timestamp("student_signed_at"),
  institutionSignedAt: timestamp("institution_signed_at"),
  status: contractStatusEnum("status").default("pending").notNull(),
  additionalNotes: text("additional_notes"),
  generatedById: integer("generated_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relações para Templates de Contrato
export const contractTemplatesRelations = relations(contractTemplates, ({ one }) => ({
  institution: one(institutions, {
    fields: [contractTemplates.institutionId],
    references: [institutions.id],
  }),
  courseType: one(courseTypes, {
    fields: [contractTemplates.courseTypeId],
    references: [courseTypes.id],
  }),
  createdBy: one(users, {
    fields: [contractTemplates.createdById],
    references: [users.id],
  }),
}));

// Relações para Contratos
export const contractsRelations = relations(contracts, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [contracts.enrollmentId],
    references: [enrollments.id],
  }),
  template: one(contractTemplates, {
    fields: [contracts.templateId],
    references: [contractTemplates.id],
  }),
  student: one(users, {
    fields: [contracts.studentId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [contracts.courseId],
    references: [courses.id],
  }),
  generatedBy: one(users, {
    fields: [contracts.generatedById],
    references: [users.id],
  }),
}));

// Schemas para Contract Templates
export const insertContractTemplateSchema = createInsertSchema(contractTemplates).pick({
  name: true,
  description: true,
  content: true,
  version: true,
  courseTypeId: true,
  institutionId: true,
  isActive: true,
  createdById: true,
});
export type InsertContractTemplate = z.infer<typeof insertContractTemplateSchema>;
export type ContractTemplate = typeof contractTemplates.$inferSelect;

// Schemas para Contracts
export const insertContractSchema = createInsertSchema(contracts).pick({
  code: true,
  enrollmentId: true,
  templateId: true,
  studentId: true,
  courseId: true,
  content: true,
  signatureRequired: true,
  studentSignedAt: true,
  institutionSignedAt: true,
  status: true,
  additionalNotes: true,
  generatedById: true,
});
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// Schemas para Templates de Certificados
export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates).pick({
  name: true,
  description: true,
  type: true,
  htmlTemplate: true,
  cssStyles: true,
  defaultTitle: true,
  isActive: true,
  previewImageUrl: true,
  institutionId: true,
  createdById: true,
});
export type InsertCertificateTemplate = z.infer<typeof insertCertificateTemplateSchema>;
export type CertificateTemplate = typeof certificateTemplates.$inferSelect;

// Schemas para Signatários de Certificados
export const insertCertificateSignerSchema = createInsertSchema(certificateSigners).pick({
  name: true,
  role: true,
  signatureImageUrl: true,
  isActive: true,
  institutionId: true,
  createdById: true,
});
export type InsertCertificateSigner = z.infer<typeof insertCertificateSignerSchema>;
export type CertificateSigner = typeof certificateSigners.$inferSelect;

// Schemas para Certificados
export const insertCertificateSchema = createInsertSchema(certificates).pick({
  code: true,
  enrollmentId: true,
  studentId: true,
  courseId: true,
  institutionId: true,
  templateId: true,
  title: true,
  studentName: true,
  studentCpf: true,
  studentBirthDate: true,
  studentNationality: true,
  courseName: true,
  courseWorkload: true,
  knowledgeArea: true,
  courseStartDate: true,
  courseEndDate: true,
  signerId: true,
  signerName: true,
  signerRole: true,
  pdfUrl: true,
  status: true,
  issueDate: true,
  expirationDate: true,
  verificationUrl: true,
  createdById: true,
});
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificates.$inferSelect;

// Schemas para Disciplinas de Certificados
export const insertCertificateDisciplineSchema = createInsertSchema(certificateDisciplines).pick({
  certificateId: true,
  disciplineName: true,
  teacherName: true,
  teacherTitle: true,
  workload: true,
  frequency: true,
  performance: true,
  order: true,
});
export type InsertCertificateDiscipline = z.infer<typeof insertCertificateDisciplineSchema>;
export type CertificateDiscipline = typeof certificateDisciplines.$inferSelect;

// Schemas para Histórico de Certificados
export const insertCertificateHistorySchema = createInsertSchema(certificateHistory).pick({
  certificateId: true,
  action: true,
  performedById: true,
  performedByType: true,
  timestamp: true,
  ipAddress: true,
  userAgent: true,
  details: true,
});
export type InsertCertificateHistory = z.infer<typeof insertCertificateHistorySchema>;
export type CertificateHistory = typeof certificateHistory.$inferSelect;

// Schemas para o módulo CRM
export const insertLeadSchema = createInsertSchema(leads).pick({
  name: true,
  email: true,
  phone: true,
  company: true,
  source: true,
  interest: true,
  status: true,
  notes: true,
  createdById: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export const insertClientSchema = createInsertSchema(clients).pick({
  name: true,
  type: true,
  email: true,
  phone: true,
  cpfCnpj: true,
  rgIe: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  segment: true,
  website: true,
  notes: true,
  isActive: true,
  createdById: true,
});
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  email: true,
  phone: true,
  position: true,
  clientId: true,
  role: true,
  department: true,
  notes: true,
});
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Schemas para o módulo Financeiro
export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  code: true,
  type: true,
  category: true,
  description: true,
  workload: true,
  duration: true,
  durationUnit: true,
  tags: true,
  price: true,
  costPrice: true,
  taxRate: true,
  isActive: true,
  isFeatured: true,
  isDigital: true,
  createdById: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  invoiceNumber: true,
  clientId: true,
  contractId: true,
  issueDate: true,
  dueDate: true,
  status: true,
  totalAmount: true,
  notes: true,
  createdById: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).pick({
  invoiceId: true,
  productId: true,
  description: true,
  quantity: true,
  unitPrice: true,
  discount: true,
  tax: true,
});
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export const insertPaymentSchema = createInsertSchema(payments).pick({
  invoiceId: true,
  amount: true,
  method: true,
  paymentDate: true,
  status: true,
  transactionId: true,
  notes: true,
  createdById: true,
});
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// -------------------- Sistema de Permissões --------------------

// Tabela de papéis (roles)
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(), // Papel do sistema não pode ser excluído
  scope: text("scope").notNull(), // 'global', 'institution', 'polo'
  institutionId: integer("institution_id").references(() => institutions.id), // Nulo para papéis globais
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de permissões
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  resource: permissionResourceEnum("resource").notNull(), // matricula, pagamento, curso, etc.
  action: permissionActionEnum("action").notNull(), // criar, ler, atualizar, etc.
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de atribuição de permissões a papéis
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de atribuição de papéis a usuários
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
  institutionId: integer("institution_id").references(() => institutions.id),
  poloId: integer("polo_id").references(() => polos.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de atribuição de permissões diretamente a usuários
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  institutionId: integer("institution_id").references(() => institutions.id),
  poloId: integer("polo_id").references(() => polos.id),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Permissão temporária, se aplicável
});

// Tabela de registros de auditoria de permissões
export const permissionAudits = pgTable("permission_audits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // 'grant', 'revoke', 'modify_role'
  resource: text("resource").notNull(), // Nome do recurso afetado
  details: json("details"), // Detalhes específicos da ação
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Schemas de inserção
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof roles.$inferSelect;

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissions.$inferSelect;

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
});
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
});
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type UserPermission = typeof userPermissions.$inferSelect;

// -------------------- Relacionamentos do Sistema de Permissões --------------------

// Relações de papéis
export const rolesRelations = relations(roles, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [roles.institutionId],
    references: [institutions.id],
  }),
  createdBy: one(users, {
    fields: [roles.createdById],
    references: [users.id],
  }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

// Relações de permissões
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
}));

// Relações de atribuição de permissões a papéis
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
  createdBy: one(users, {
    fields: [rolePermissions.createdById],
    references: [users.id],
  }),
}));

// Relações de atribuição de permissões diretas a usuários
export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissions, {
    fields: [userPermissions.permissionId],
    references: [permissions.id],
  }),
  institution: one(institutions, {
    fields: [userPermissions.institutionId],
    references: [institutions.id],
  }),
  polo: one(polos, {
    fields: [userPermissions.poloId],
    references: [polos.id],
  }),
  createdBy: one(users, {
    fields: [userPermissions.createdById],
    references: [users.id],
  }),
}));

// Relações de atribuição de papéis a usuários
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  institution: one(institutions, {
    fields: [userRoles.institutionId],
    references: [institutions.id],
  }),
  polo: one(polos, {
    fields: [userRoles.poloId],
    references: [polos.id],
  }),
  createdBy: one(users, {
    fields: [userRoles.createdById],
    references: [users.id],
  }),
}));

// Relações de registros de auditoria de permissões
export const permissionAuditsRelations = relations(permissionAudits, ({ one }) => ({
  user: one(users, {
    fields: [permissionAudits.userId],
    references: [users.id],
  }),
}));
