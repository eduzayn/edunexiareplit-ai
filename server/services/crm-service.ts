/**
 * Serviço para o módulo CRM
 * Gerencia leads, clientes e contatos
 */

import { eq, and, like, desc, sql, or } from 'drizzle-orm';
import { db } from '../db';
import {
  leads,
  clients,
  contacts,
  users,
  InsertLead,
  InsertClient,
  InsertContact,
  Lead,
  Client,
  Contact
} from '@shared/schema';

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
) {
  try {
    let query = db.select().from(leads)
      .orderBy(desc(leads.updatedAt))
      .limit(limit)
      .offset(offset);

    // Adicionar filtro por status se fornecido
    if (status) {
      query = query.where(eq(leads.status, status));
    }

    // Adicionar filtro por criador se fornecido
    if (userId) {
      query = query.where(eq(leads.createdById, userId));
    }

    // Adicionar filtro por termo de busca se fornecido
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(leads.name, searchTerm),
          like(leads.email, searchTerm),
          like(leads.phone, searchTerm),
          like(leads.company, searchTerm)
        )
      );
    }

    const result = await query;
    return result;
  } catch (error) {
    console.error("Erro ao obter leads:", error);
    throw new Error("Falha ao buscar leads");
  }
}

/**
 * Obtém um lead específico pelo ID
 */
export async function getLead(id: number) {
  try {
    const result = await db.select().from(leads).where(eq(leads.id, id));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Erro ao obter lead:", error);
    throw new Error("Falha ao buscar lead");
  }
}

/**
 * Cria um novo lead
 */
export async function createLead(data: InsertLead): Promise<Lead> {
  try {
    const result = await db.insert(leads).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    throw new Error("Falha ao criar lead");
  }
}

/**
 * Atualiza um lead existente
 */
export async function updateLead(id: number, data: Partial<InsertLead>): Promise<Lead> {
  try {
    // Adicionar timestamp de atualização
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const result = await db.update(leads)
      .set(updateData)
      .where(eq(leads.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    throw new Error("Falha ao atualizar lead");
  }
}

/**
 * Exclui um lead
 */
export async function deleteLead(id: number): Promise<boolean> {
  try {
    const result = await db.delete(leads)
      .where(eq(leads.id, id));

    return result.count > 0;
  } catch (error) {
    console.error("Erro ao excluir lead:", error);
    throw new Error("Falha ao excluir lead");
  }
}

/**
 * Converte um lead para cliente e contato
 */
export async function convertLeadToClient(
  leadId: number,
  clientData: Partial<InsertClient>
): Promise<{ client: Client, contact?: Contact }> {
  try {
    // Obter o lead
    const lead = await getLead(leadId);
    if (!lead) {
      throw new Error("Lead não encontrado");
    }

    // Começar uma transação
    const result = await db.transaction(async (tx) => {
      // Criar o cliente
      const newClient: InsertClient = {
        name: clientData.name || lead.name,
        type: clientData.type || "pj",
        email: clientData.email || lead.email,
        phone: clientData.phone || lead.phone || "",
        cpfCnpj: clientData.cpfCnpj || "",
        zipCode: clientData.zipCode || "",
        street: clientData.street || "",
        number: clientData.number || "",
        neighborhood: clientData.neighborhood || "",
        city: clientData.city || "",
        state: clientData.state || "",
        createdById: lead.createdById,
      };

      const insertedClient = await tx.insert(clients).values(newClient).returning();
      const client = insertedClient[0];

      // Criar contato (opcional, somente se fornecer informações adicionais)
      let contact: Contact | undefined;
      if (lead.name || lead.email || lead.phone) {
        const newContact: InsertContact = {
          name: lead.name,
          email: lead.email,
          phone: lead.phone || "",
          position: "Contato Principal",
          clientId: client.id,
          role: "Decisor",
        };

        const insertedContact = await tx.insert(contacts).values(newContact).returning();
        contact = insertedContact[0];
      }

      // Atualizar o status do lead para "convertido"
      await tx.update(leads)
        .set({
          status: "convertido",
          updatedAt: new Date()
        })
        .where(eq(leads.id, leadId));

      return { client, contact };
    });

    return result;
  } catch (error) {
    console.error("Erro ao converter lead:", error);
    throw new Error("Falha ao converter lead para cliente");
  }
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
) {
  try {
    let query = db.select().from(clients)
      .orderBy(desc(clients.updatedAt))
      .limit(limit)
      .offset(offset);

    // Adicionar filtro por status se fornecido
    if (status) {
      const isActive = status === 'active';
      query = query.where(eq(clients.isActive, isActive));
    }

    // Adicionar filtro por criador se fornecido
    if (userId) {
      query = query.where(eq(clients.createdById, userId));
    }

    // Adicionar filtro por termo de busca se fornecido
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(clients.name, searchTerm),
          like(clients.email, searchTerm),
          like(clients.phone, searchTerm),
          like(clients.cpfCnpj, searchTerm)
        )
      );
    }

    const result = await query;
    return result;
  } catch (error) {
    console.error("Erro ao obter clientes:", error);
    throw new Error("Falha ao buscar clientes");
  }
}

/**
 * Obtém um cliente específico pelo ID com seus contatos
 */
export async function getClient(id: number) {
  try {
    const clientResult = await db.select().from(clients).where(eq(clients.id, id));
    
    if (clientResult.length === 0) {
      return null;
    }
    
    const client = clientResult[0];
    
    // Obter os contatos do cliente
    const clientContacts = await db.select().from(contacts).where(eq(contacts.clientId, id));
    
    return {
      ...client,
      contacts: clientContacts
    };
  } catch (error) {
    console.error("Erro ao obter cliente:", error);
    throw new Error("Falha ao buscar cliente");
  }
}

/**
 * Cria um novo cliente
 */
export async function createClient(data: InsertClient): Promise<Client> {
  try {
    const result = await db.insert(clients).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    throw new Error("Falha ao criar cliente");
  }
}

/**
 * Atualiza um cliente existente
 */
export async function updateClient(id: number, data: Partial<InsertClient>): Promise<Client> {
  try {
    // Adicionar timestamp de atualização
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const result = await db.update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw new Error("Falha ao atualizar cliente");
  }
}

/**
 * Exclui um cliente
 */
export async function deleteClient(id: number): Promise<boolean> {
  try {
    const result = await db.delete(clients)
      .where(eq(clients.id, id));

    return result.count > 0;
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    throw new Error("Falha ao excluir cliente");
  }
}

/**
 * Busca cliente por CPF/CNPJ
 */
export async function findClientByCpfCnpj(cpfCnpj: string): Promise<Client | null> {
  try {
    const result = await db.select().from(clients).where(eq(clients.cpfCnpj, cpfCnpj));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Erro ao buscar cliente por CPF/CNPJ:", error);
    throw new Error("Falha ao buscar cliente por CPF/CNPJ");
  }
}

// ==================== CONTATOS ====================

/**
 * Obtém todos os contatos de um cliente
 */
export async function getContacts(clientId: number) {
  try {
    const result = await db.select().from(contacts)
      .where(eq(contacts.clientId, clientId))
      .orderBy(contacts.name);

    return result;
  } catch (error) {
    console.error("Erro ao obter contatos:", error);
    throw new Error("Falha ao buscar contatos");
  }
}

/**
 * Obtém um contato específico pelo ID
 */
export async function getContact(id: number) {
  try {
    const result = await db.select().from(contacts).where(eq(contacts.id, id));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Erro ao obter contato:", error);
    throw new Error("Falha ao buscar contato");
  }
}

/**
 * Cria um novo contato
 */
export async function createContact(data: InsertContact): Promise<Contact> {
  try {
    const result = await db.insert(contacts).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Erro ao criar contato:", error);
    throw new Error("Falha ao criar contato");
  }
}

/**
 * Atualiza um contato existente
 */
export async function updateContact(id: number, data: Partial<InsertContact>): Promise<Contact> {
  try {
    // Adicionar timestamp de atualização
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const result = await db.update(contacts)
      .set(updateData)
      .where(eq(contacts.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao atualizar contato:", error);
    throw new Error("Falha ao atualizar contato");
  }
}

/**
 * Exclui um contato
 */
export async function deleteContact(id: number): Promise<boolean> {
  try {
    const result = await db.delete(contacts)
      .where(eq(contacts.id, id));

    return result.count > 0;
  } catch (error) {
    console.error("Erro ao excluir contato:", error);
    throw new Error("Falha ao excluir contato");
  }
}