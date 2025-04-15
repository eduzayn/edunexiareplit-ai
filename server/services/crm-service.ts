/**
 * Serviço para o módulo CRM - TEMPORARIAMENTE INDISPONÍVEL
 * Este módulo está sendo reconstruído e não está disponível no momento.
 * 
 * Esta é uma versão stub do serviço que retorna erros ou dados vazios
 * para evitar erros de compilação enquanto o módulo é reconstruído.
 */

import { db } from '../db';
import { users } from '@shared/schema';

// Tipos temporários para compatibilidade
type Lead = any;
type Client = any;
type Contact = any;
type InsertLead = any;
type InsertClient = any;
type InsertContact = any;

// Função helper para simular erros
function crmNotAvailable(method: string): never {
  console.error(`CRM método temporariamente indisponível: ${method}`);
  throw new Error("CRM em reconstrução - Módulo temporariamente indisponível");
}

// ==================== LEADS ====================

/**
 * Obtém todos os leads com paginação e filtros
 */
export async function getLeads(
  search?: string,
  status?: string,
  userId?: number,
  limit = 50,
  offset = 0
): Promise<Lead[]> {
  return crmNotAvailable('getLeads');
}

/**
 * Obtém um lead específico pelo ID
 */
export async function getLead(id: number): Promise<Lead | null> {
  return crmNotAvailable('getLead');
}

/**
 * Cria um novo lead
 */
export async function createLead(data: InsertLead): Promise<Lead> {
  return crmNotAvailable('createLead');
}

/**
 * Atualiza um lead existente
 */
export async function updateLead(id: number, data: Partial<InsertLead>): Promise<Lead> {
  return crmNotAvailable('updateLead');
}

/**
 * Exclui um lead
 */
export async function deleteLead(id: number): Promise<boolean> {
  return crmNotAvailable('deleteLead');
}

/**
 * Converte um lead para cliente e contato
 */
export async function convertLeadToClient(
  leadId: number,
  clientData: Partial<InsertClient>
): Promise<{ client: Client, contact?: Contact }> {
  return crmNotAvailable('convertLeadToClient');
}

// ==================== CLIENTES ====================

/**
 * Obtém todos os clientes com paginação e filtros
 */
export async function getClients(
  search?: string,
  status?: string,
  userId?: number,
  limit = 50,
  offset = 0
): Promise<Client[]> {
  return crmNotAvailable('getClients');
}

/**
 * Obtém um cliente específico pelo ID com seus contatos
 */
export async function getClient(id: number): Promise<Client | null> {
  return crmNotAvailable('getClient');
}

/**
 * Busca cliente por CPF/CNPJ
 */
export async function getClientByCPFCNPJ(cpfCnpj: string): Promise<Client | null> {
  return crmNotAvailable('getClientByCPFCNPJ');
}

/**
 * Cria um novo cliente
 */
export async function createClient(data: InsertClient): Promise<Client> {
  return crmNotAvailable('createClient');
}

/**
 * Atualiza um cliente existente
 */
export async function updateClient(id: number, data: Partial<InsertClient>): Promise<Client> {
  return crmNotAvailable('updateClient');
}

/**
 * Exclui um cliente
 */
export async function deleteClient(id: number): Promise<boolean> {
  return crmNotAvailable('deleteClient');
}

// ==================== CONTATOS ====================

/**
 * Obtém um contato específico pelo ID
 */
export async function getContact(id: number): Promise<Contact | null> {
  return crmNotAvailable('getContact');
}

/**
 * Obtém todos os contatos de um cliente
 */
export async function getContactsByClient(clientId: number): Promise<Contact[]> {
  return crmNotAvailable('getContactsByClient');
}

/**
 * Cria um novo contato
 */
export async function createContact(data: InsertContact): Promise<Contact> {
  return crmNotAvailable('createContact');
}

/**
 * Atualiza um contato existente
 */
export async function updateContact(id: number, data: Partial<InsertContact>): Promise<Contact> {
  return crmNotAvailable('updateContact');
}

/**
 * Exclui um contato
 */
export async function deleteContact(id: number): Promise<boolean> {
  return crmNotAvailable('deleteContact');
}