/**
 * Schema para tabelas do ABAC (Attribute-Based Access Control)
 */

import { pgTable, serial, text, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { permissionResourceEnum, permissionActionEnum } from './schema';

/**
 * Enum para fase de instituição
 */
export const institutionPhaseEnum = [
  'prospecting', // Prospecção
  'onboarding',  // Onboarding
  'implementation', // Implementação
  'active',      // Ativa
  'suspended',   // Suspensa
  'canceled'     // Cancelada
] as const;

/**
 * Enum para tipo de período
 */
export const periodTypeEnum = [
  'financial',   // Período financeiro
  'academic',    // Período acadêmico
  'enrollment',  // Período de matrícula
  'certification' // Período de certificação
] as const;

/**
 * Enum para status de pagamento
 */
export const paymentStatusEnum = [
  'pending',     // Pendente
  'paid',        // Pago
  'overdue',     // Atrasado
  'refunded',    // Reembolsado
  'canceled'     // Cancelado
] as const;

/**
 * Tabela de permissões baseadas em fase de instituição
 */
export const institutionPhasePermissions = pgTable('institution_phase_permissions', {
  id: serial('id').primaryKey(),
  resource: permissionResourceEnum('resource').notNull(),
  action: permissionActionEnum('action').notNull(),
  phase: varchar('phase', { enum: institutionPhaseEnum }).notNull(),
  description: text('description').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Tabela de períodos financeiros/acadêmicos
 */
export const financialPeriods = pgTable('financial_periods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { enum: periodTypeEnum }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  institutionId: integer('institution_id'),
  poloId: integer('polo_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Tabela de regras de permissão baseadas em período
 */
export const periodPermissionRules = pgTable('period_permission_rules', {
  id: serial('id').primaryKey(),
  resource: permissionResourceEnum('resource').notNull(),
  action: permissionActionEnum('action').notNull(),
  periodType: varchar('period_type', { enum: periodTypeEnum }).notNull(),
  daysBeforeStart: integer('days_before_start').default(0).notNull(),
  daysAfterEnd: integer('days_after_end').default(0).notNull(),
  description: text('description').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/**
 * Tabela de permissões baseadas em status de pagamento
 */
export const paymentStatusPermissions = pgTable('payment_status_permissions', {
  id: serial('id').primaryKey(),
  resource: permissionResourceEnum('resource').notNull(),
  action: permissionActionEnum('action').notNull(),
  paymentStatus: varchar('payment_status', { enum: paymentStatusEnum }).notNull(),
  description: text('description').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Schemas de inserção
export const insertInstitutionPhasePermissionSchema = createInsertSchema(institutionPhasePermissions, {
  resource: (schema) => schema.resource,
  action: (schema) => schema.action,
  phase: (schema) => schema.phase,
  description: (schema) => schema.description,
  isActive: (schema) => schema.isActive
});

export const insertFinancialPeriodSchema = createInsertSchema(financialPeriods, {
  name: (schema) => schema.name,
  type: (schema) => schema.type,
  startDate: (schema) => schema.startDate,
  endDate: (schema) => schema.endDate,
  institutionId: (schema) => schema.institutionId,
  poloId: (schema) => schema.poloId,
  isActive: (schema) => schema.isActive
});

export const insertPeriodPermissionRuleSchema = createInsertSchema(periodPermissionRules, {
  resource: (schema) => schema.resource,
  action: (schema) => schema.action,
  periodType: (schema) => schema.periodType,
  daysBeforeStart: (schema) => schema.daysBeforeStart,
  daysAfterEnd: (schema) => schema.daysAfterEnd,
  description: (schema) => schema.description,
  isActive: (schema) => schema.isActive
});

export const insertPaymentStatusPermissionSchema = createInsertSchema(paymentStatusPermissions, {
  resource: (schema) => schema.resource,
  action: (schema) => schema.action,
  paymentStatus: (schema) => schema.paymentStatus,
  description: (schema) => schema.description,
  isActive: (schema) => schema.isActive
});

// Tipos de inserção
export type InsertInstitutionPhasePermission = z.infer<typeof insertInstitutionPhasePermissionSchema>;
export type InsertFinancialPeriod = z.infer<typeof insertFinancialPeriodSchema>;
export type InsertPeriodPermissionRule = z.infer<typeof insertPeriodPermissionRuleSchema>;
export type InsertPaymentStatusPermission = z.infer<typeof insertPaymentStatusPermissionSchema>;

// Tipos de seleção
export type InstitutionPhasePermission = typeof institutionPhasePermissions.$inferSelect;
export type FinancialPeriod = typeof financialPeriods.$inferSelect;
export type PeriodPermissionRule = typeof periodPermissionRules.$inferSelect;
export type PaymentStatusPermission = typeof paymentStatusPermissions.$inferSelect;