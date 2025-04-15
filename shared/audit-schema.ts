import { pgTable, text, serial, integer, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums para auditoria
export const auditActionEnum = pgEnum("audit_action_type", [
  "create", "update", "delete", "grant", "revoke", "login", "logout", "view", "assign", "unassign"
]);

export const auditEntityTypeEnum = pgEnum("audit_entity_type", [
  "user", "role", "permission", "role_permission", "user_role", "user_permission",
  "institution", "polo", "lead", "client", "invoice", "payment", "contract", "subscription"
]);

// Tabela de auditoria de permissões
export const permissionAudit = pgTable("permission_audit", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Usuário que realizou a ação
  actionType: auditActionEnum("action_type").notNull(), // Tipo de ação realizada
  entityType: auditEntityTypeEnum("entity_type").notNull(), // Tipo de entidade afetada
  entityId: integer("entity_id").notNull(), // ID da entidade afetada
  resourceType: text("resource_type"), // Tipo de recurso (se aplicável)
  description: text("description").notNull(), // Descrição da ação
  oldValue: json("old_value"), // Valor antigo (se aplicável)
  newValue: json("new_value"), // Novo valor (se aplicável)
  metadata: json("metadata"), // Metadados adicionais
  ipAddress: text("ip_address"), // Endereço IP do usuário
  userAgent: text("user_agent"), // User agent do navegador
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relações
export const permissionAuditRelations = relations(permissionAudit, ({ one }) => ({
  // Descomentado quando conectar com a tabela de usuários
  // user: one(userTable, { fields: [permissionAudit.userId], references: [userTable.id] }),
}));

// Schemas para validação
export const insertPermissionAuditSchema = createInsertSchema(permissionAudit, {
  // Adicionar validação personalizada se necessário
}).omit({ id: true, createdAt: true });

export type InsertPermissionAudit = z.infer<typeof insertPermissionAuditSchema>;
export type SelectPermissionAudit = typeof permissionAudit.$inferSelect;