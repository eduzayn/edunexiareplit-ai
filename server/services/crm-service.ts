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
    console.log('Usando consulta SQL segura para buscar clientes');
    
    // Construir a consulta SQL manualmente para evitar o erro de coluna ausente
    let queryStr = `
      SELECT 
        id, name, type, email, phone, cpf_cnpj, rg_ie,
        zip_code, street, number, complement, neighborhood, city, state,
        notes, is_active, asaas_id, created_by_id, created_at, updated_at
      FROM clients
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // Adicionar filtro por status se fornecido
    if (status) {
      const isActive = status === 'active';
      queryStr += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    // Adicionar filtro por criador se fornecido
    if (userId) {
      queryStr += ` AND created_by_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    // Adicionar filtro por termo de busca se fornecido
    if (search) {
      const searchTerm = `%${search}%`;
      queryStr += ` AND (
        name ILIKE $${paramIndex} OR 
        email ILIKE $${paramIndex} OR 
        phone ILIKE $${paramIndex} OR 
        cpf_cnpj ILIKE $${paramIndex}
      )`;
      params.push(searchTerm);
      paramIndex++;
    }
    
    // Adicionar ordenação, limite e offset
    queryStr += ` ORDER BY updated_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    console.log('Query SQL:', queryStr);
    console.log('Parâmetros:', params);
    
    const result = await db.execute(sql.raw(queryStr, ...params));
    
    // Verificar e formatar resultados
    if (Array.isArray(result) && result.length > 0) {
      console.log(`${result.length} clientes encontrados`);
      
      // Converter os nomes das colunas snake_case para camelCase
      return result.map(client => ({
        id: client.id,
        name: client.name,
        type: client.type,
        email: client.email,
        phone: client.phone,
        cpfCnpj: client.cpf_cnpj,
        rgIe: client.rg_ie,
        zipCode: client.zip_code,
        street: client.street,
        number: client.number,
        complement: client.complement,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        // segment já não é mais usado aqui
        website: client.website,
        notes: client.notes,
        isActive: client.is_active,
        asaasId: client.asaas_id,
        createdById: client.created_by_id,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      }));
    }
    
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
    console.log('Usando consulta SQL segura para obter cliente por ID:', id);
    
    // Usar SQL customizado para evitar o campo segment e website
    const queryStr = `
      SELECT 
        id, name, type, email, phone, cpf_cnpj, rg_ie,
        zip_code, street, number, complement, neighborhood, city, state,
        notes, is_active, asaas_id, created_by_id, created_at, updated_at
      FROM clients
      WHERE id = $1
      LIMIT 1
    `;
    
    const result = await db.execute(sql.raw(queryStr, id));
    
    if (!Array.isArray(result) || result.length === 0) {
      console.log('Cliente não encontrado');
      return null;
    }
    
    console.log('Cliente encontrado, ID:', result[0].id);
    
    // Criar o objeto cliente no formato camelCase
    const client = {
      id: result[0].id,
      name: result[0].name,
      type: result[0].type,
      email: result[0].email,
      phone: result[0].phone,
      cpfCnpj: result[0].cpf_cnpj,
      rgIe: result[0].rg_ie,
      zipCode: result[0].zip_code,
      street: result[0].street,
      number: result[0].number,
      complement: result[0].complement,
      neighborhood: result[0].neighborhood,
      city: result[0].city,
      state: result[0].state,
      // segment e website não existem
      notes: result[0].notes,
      isActive: result[0].is_active,
      asaasId: result[0].asaas_id,
      createdById: result[0].created_by_id,
      createdAt: result[0].created_at,
      updatedAt: result[0].updated_at
    } as Client;
    
    // Obter os contatos do cliente
    try {
      const clientContacts = await db.select().from(contacts).where(eq(contacts.clientId, id));
      console.log(`${clientContacts.length} contatos encontrados para o cliente`);
      
      return {
        ...client,
        contacts: clientContacts
      };
    } catch (contactError) {
      console.error("Erro ao obter contatos:", contactError);
      // Retornar o cliente mesmo sem os contatos
      return {
        ...client,
        contacts: []
      };
    }
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
    console.log('Usando consulta SQL segura para criar cliente');
    
    // Remover a propriedade segment se existir para evitar erro
    const { segment, ...clientData } = data as any;
    
    console.log('Dados do cliente para inserção:', clientData);
    
    // Usar SQL raw para inserir sem a coluna segment
    const columns = Object.keys(clientData).map(key => {
      // Converter camelCase para snake_case
      return key.replace(/([A-Z])/g, '_$1').toLowerCase();
    });
    
    const values = Object.values(clientData);
    
    const placeholders = values.map((_, index) => `$${index + 1}`);
    
    const queryStr = `
      INSERT INTO clients (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING 
        id, name, type, email, phone, cpf_cnpj, rg_ie,
        zip_code, street, number, complement, neighborhood, city, state,
        notes, is_active, asaas_id, created_by_id, created_at, updated_at
    `;
    
    console.log('Query SQL para inserção:', queryStr);
    console.log('Valores:', values);
    
    const result = await db.execute(sql.raw(queryStr, ...values));
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('Cliente criado com sucesso, ID:', result[0].id);
      
      // Converter nomes das colunas de snake_case para camelCase
      return {
        id: result[0].id,
        name: result[0].name,
        type: result[0].type,
        email: result[0].email,
        phone: result[0].phone,
        cpfCnpj: result[0].cpf_cnpj,
        rgIe: result[0].rg_ie,
        zipCode: result[0].zip_code,
        street: result[0].street,
        number: result[0].number,
        complement: result[0].complement,
        neighborhood: result[0].neighborhood,
        city: result[0].city,
        state: result[0].state,
        // segment e website não existem
        notes: result[0].notes,
        isActive: result[0].is_active,
        asaasId: result[0].asaas_id,
        createdById: result[0].created_by_id,
        createdAt: result[0].created_at,
        updatedAt: result[0].updated_at
      } as Client;
    }
    
    throw new Error("Falha ao criar cliente - nenhum resultado retornado");
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    throw new Error("Falha ao criar cliente: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Atualiza um cliente existente
 */
export async function updateClient(id: number, data: Partial<InsertClient>): Promise<Client> {
  try {
    console.log('Usando consulta SQL segura para atualizar cliente ID:', id);
    
    // Remover a propriedade segment se existir para evitar erro
    const { segment, ...clientData } = data as any;
    
    // Adicionar timestamp de atualização
    const updateData = {
      ...clientData,
      updatedAt: new Date()
    };
    
    console.log('Dados de atualização do cliente:', updateData);
    
    // Preparar os pares chave-valor para a atualização
    const updatePairs: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    Object.entries(updateData).forEach(([key, value]) => {
      // Converter camelCase para snake_case
      const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updatePairs.push(`${columnName} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });
    
    // Adicionar o ID como último parâmetro para a cláusula WHERE
    values.push(id);
    
    const queryStr = `
      UPDATE clients
      SET ${updatePairs.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, name, type, email, phone, cpf_cnpj, rg_ie,
        zip_code, street, number, complement, neighborhood, city, state,
        notes, is_active, asaas_id, created_by_id, created_at, updated_at
    `;
    
    console.log('Query SQL para atualização:', queryStr);
    console.log('Valores:', values);
    
    const result = await db.execute(sql.raw(queryStr, ...values));
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('Cliente atualizado com sucesso');
      
      // Converter nomes das colunas de snake_case para camelCase
      return {
        id: result[0].id,
        name: result[0].name,
        type: result[0].type,
        email: result[0].email,
        phone: result[0].phone,
        cpfCnpj: result[0].cpf_cnpj,
        rgIe: result[0].rg_ie,
        zipCode: result[0].zip_code,
        street: result[0].street,
        number: result[0].number,
        complement: result[0].complement,
        neighborhood: result[0].neighborhood,
        city: result[0].city,
        state: result[0].state,
        // segment e website não existem
        notes: result[0].notes,
        isActive: result[0].is_active,
        asaasId: result[0].asaas_id,
        createdById: result[0].created_by_id,
        createdAt: result[0].created_at,
        updatedAt: result[0].updated_at
      } as Client;
    }
    
    throw new Error("Falha ao atualizar cliente - cliente não encontrado ou nenhum dado para atualizar");
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw new Error("Falha ao atualizar cliente: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Exclui um cliente
 */
export async function deleteClient(id: number): Promise<boolean> {
  try {
    console.log('Usando consulta SQL segura para excluir cliente ID:', id);
    
    const queryStr = `
      DELETE FROM clients
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await db.execute(sql.raw(queryStr, id));
    
    const success = Array.isArray(result) && result.length > 0;
    console.log('Cliente excluído com sucesso:', success);
    
    return success;
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    throw new Error("Falha ao excluir cliente: " + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Busca cliente por CPF/CNPJ
 */
export async function findClientByCpfCnpj(cpfCnpj: string): Promise<Client | null> {
  try {
    console.log('Usando consulta SQL segura para buscar cliente por CPF/CNPJ:', cpfCnpj);
    
    const queryStr = `
      SELECT 
        id, name, type, email, phone, cpf_cnpj, rg_ie,
        zip_code, street, number, complement, neighborhood, city, state,
        notes, is_active, asaas_id, created_by_id, created_at, updated_at
      FROM clients
      WHERE cpf_cnpj = $1
      LIMIT 1
    `;
    
    const result = await db.execute(sql.raw(queryStr, cpfCnpj));
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('Cliente encontrado por CPF/CNPJ');
      
      // Converter de snake_case para camelCase
      return {
        id: result[0].id,
        name: result[0].name,
        type: result[0].type,
        email: result[0].email,
        phone: result[0].phone,
        cpfCnpj: result[0].cpf_cnpj,
        rgIe: result[0].rg_ie,
        zipCode: result[0].zip_code,
        street: result[0].street,
        number: result[0].number,
        complement: result[0].complement,
        neighborhood: result[0].neighborhood,
        city: result[0].city,
        state: result[0].state,
        // segment e website não existem
        notes: result[0].notes,
        isActive: result[0].is_active,
        asaasId: result[0].asaas_id,
        createdById: result[0].created_by_id,
        createdAt: result[0].created_at,
        updatedAt: result[0].updated_at
      } as Client;
    }
    
    console.log('Nenhum cliente encontrado com CPF/CNPJ:', cpfCnpj);
    return null;
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
    console.log('Usando consulta SQL segura para excluir contato ID:', id);
    
    const queryStr = `
      DELETE FROM contacts
      WHERE id = $1
      RETURNING id
    `;
    
    const result = await db.execute(sql.raw(queryStr, id));
    
    const success = Array.isArray(result) && result.length > 0;
    console.log('Contato excluído com sucesso:', success);
    
    return success;
  } catch (error) {
    console.error("Erro ao excluir contato:", error);
    throw new Error("Falha ao excluir contato: " + (error instanceof Error ? error.message : String(error)));
  }
}