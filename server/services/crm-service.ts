/**
 * Serviço para o módulo CRM
 * Fornece funcionalidades para gerenciar leads, clientes e contatos
 */

import { storage } from '../storage';
import { 
  Lead, InsertLead,
  Client, InsertClient,
  Contact, InsertContact 
} from '@shared/schema';
import { AsaasService } from './asaas-service';

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
  try {
    return await storage.getLeads(search, status, limit, offset);
  } catch (error) {
    console.error("Erro ao obter leads:", error);
    throw new Error("Falha ao buscar leads");
  }
}

/**
 * Obtém um lead específico pelo ID
 */
export async function getLead(id: number): Promise<Lead | null> {
  try {
    const lead = await storage.getLead(id);
    return lead || null;
  } catch (error) {
    console.error(`Erro ao obter lead ${id}:`, error);
    throw new Error(`Falha ao buscar lead ${id}`);
  }
}

/**
 * Cria um novo lead
 */
export async function createLead(data: InsertLead): Promise<Lead> {
  try {
    return await storage.createLead(data);
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
    const updatedLead = await storage.updateLead(id, data);
    if (!updatedLead) {
      throw new Error(`Lead ${id} não encontrado`);
    }
    return updatedLead;
  } catch (error) {
    console.error(`Erro ao atualizar lead ${id}:`, error);
    throw new Error(`Falha ao atualizar lead ${id}`);
  }
}

/**
 * Exclui um lead
 */
export async function deleteLead(id: number): Promise<boolean> {
  try {
    return await storage.deleteLead(id);
  } catch (error) {
    console.error(`Erro ao excluir lead ${id}:`, error);
    throw new Error(`Falha ao excluir lead ${id}`);
  }
}

/**
 * Converte um lead para cliente e contato
 */
export async function convertLeadToClient(
  leadId: number,
  clientData: Partial<InsertClient>,
  createdById: number
): Promise<{ client: Client, contact?: Contact }> {
  try {
    // Buscar o lead
    const lead = await storage.getLead(leadId);
    if (!lead) {
      throw new Error(`Lead ${leadId} não encontrado`);
    }
    
    // Converter lead para cliente
    const client = await storage.convertLeadToClient(leadId, clientData, createdById);
    
    // Opcional: Criar contato para o cliente se houver dados de contato específicos
    let contact = undefined;
    if (clientData.contactName && clientData.contactEmail) {
      contact = await storage.createContact({
        clientId: client.id,
        name: clientData.contactName,
        email: clientData.contactEmail,
        phone: clientData.contactPhone || null,
        position: 'Contato Principal',
        isPrimary: true,
        createdById: createdById
      });
    }
    
    return { client, contact };
  } catch (error) {
    console.error(`Erro ao converter lead ${leadId} para cliente:`, error);
    throw new Error(`Falha ao converter lead ${leadId} para cliente`);
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
): Promise<Client[]> {
  try {
    return await storage.getClients(search, status, limit, offset);
  } catch (error) {
    console.error("Erro ao obter clientes:", error);
    throw new Error("Falha ao buscar clientes");
  }
}

/**
 * Obtém um cliente específico pelo ID com seus contatos
 */
export async function getClient(id: number): Promise<{client: Client | null, contacts: Contact[]}> {
  try {
    const client = await storage.getClient(id);
    
    // Se encontrou o cliente, buscar seus contatos
    const contacts = client ? await storage.getContactsByClient(id) : [];
    
    return { client: client || null, contacts };
  } catch (error) {
    console.error(`Erro ao obter cliente ${id}:`, error);
    throw new Error(`Falha ao buscar cliente ${id}`);
  }
}

/**
 * Busca cliente por CPF/CNPJ
 */
export async function getClientByDocument(document: string): Promise<Client | null> {
  try {
    const client = await storage.getClientByDocument(document);
    return client || null;
  } catch (error) {
    console.error(`Erro ao buscar cliente por documento ${document}:`, error);
    throw new Error(`Falha ao buscar cliente por documento ${document}`);
  }
}

/**
 * Cria um novo cliente
 */
export async function createClient(data: InsertClient): Promise<Client> {
  try {
    // Verificar se já existe cliente com o mesmo documento
    if (data.document) {
      const existingClient = await storage.getClientByDocument(data.document);
      if (existingClient) {
        throw new Error(`Já existe um cliente com o documento ${data.document}`);
      }
    }
    
    return await storage.createClient(data);
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    throw new Error("Falha ao criar cliente: " + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

/**
 * Atualiza um cliente existente
 */
export async function updateClient(id: number, data: Partial<InsertClient>): Promise<Client> {
  try {
    // Verificar se o cliente existe
    const existingClient = await storage.getClient(id);
    if (!existingClient) {
      throw new Error(`Cliente ${id} não encontrado`);
    }
    
    // Verificar se está tentando atualizar o documento para um que já existe
    if (data.document && data.document !== existingClient.document) {
      const clientWithSameDocument = await storage.getClientByDocument(data.document);
      if (clientWithSameDocument && clientWithSameDocument.id !== id) {
        throw new Error(`Já existe outro cliente com o documento ${data.document}`);
      }
    }
    
    const updatedClient = await storage.updateClient(id, data);
    if (!updatedClient) {
      throw new Error(`Falha ao atualizar cliente ${id}`);
    }
    
    return updatedClient;
  } catch (error) {
    console.error(`Erro ao atualizar cliente ${id}:`, error);
    throw new Error(`Falha ao atualizar cliente ${id}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

/**
 * Exclui um cliente
 */
export async function deleteClient(id: number): Promise<boolean> {
  try {
    return await storage.deleteClient(id);
  } catch (error) {
    console.error(`Erro ao excluir cliente ${id}:`, error);
    throw new Error(`Falha ao excluir cliente ${id}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

// ==================== CONTATOS ====================

/**
 * Obtém um contato específico pelo ID
 */
export async function getContact(id: number): Promise<Contact | null> {
  try {
    const contact = await storage.getContact(id);
    return contact || null;
  } catch (error) {
    console.error(`Erro ao obter contato ${id}:`, error);
    throw new Error(`Falha ao buscar contato ${id}`);
  }
}

/**
 * Obtém todos os contatos de um cliente
 */
export async function getContactsByClient(clientId: number): Promise<Contact[]> {
  try {
    return await storage.getContactsByClient(clientId);
  } catch (error) {
    console.error(`Erro ao obter contatos do cliente ${clientId}:`, error);
    throw new Error(`Falha ao buscar contatos do cliente ${clientId}`);
  }
}

/**
 * Cria um novo contato
 */
export async function createContact(data: InsertContact): Promise<Contact> {
  try {
    // Verificar se o cliente existe
    const client = await storage.getClient(data.clientId);
    if (!client) {
      throw new Error(`Cliente ${data.clientId} não encontrado`);
    }
    
    return await storage.createContact(data);
  } catch (error) {
    console.error("Erro ao criar contato:", error);
    throw new Error("Falha ao criar contato: " + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

/**
 * Atualiza um contato existente
 */
export async function updateContact(id: number, data: Partial<InsertContact>): Promise<Contact> {
  try {
    // Verificar se o contato existe
    const existingContact = await storage.getContact(id);
    if (!existingContact) {
      throw new Error(`Contato ${id} não encontrado`);
    }
    
    // Se está alterando o cliente, verificar se o novo cliente existe
    if (data.clientId && data.clientId !== existingContact.clientId) {
      const newClient = await storage.getClient(data.clientId);
      if (!newClient) {
        throw new Error(`Cliente ${data.clientId} não encontrado`);
      }
    }
    
    const updatedContact = await storage.updateContact(id, data);
    if (!updatedContact) {
      throw new Error(`Falha ao atualizar contato ${id}`);
    }
    
    return updatedContact;
  } catch (error) {
    console.error(`Erro ao atualizar contato ${id}:`, error);
    throw new Error(`Falha ao atualizar contato ${id}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}

/**
 * Exclui um contato
 */
export async function deleteContact(id: number): Promise<boolean> {
  try {
    return await storage.deleteContact(id);
  } catch (error) {
    console.error(`Erro ao excluir contato ${id}:`, error);
    throw new Error(`Falha ao excluir contato ${id}: ` + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
}