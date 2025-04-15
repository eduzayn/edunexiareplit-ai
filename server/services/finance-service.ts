/**
 * Serviço para o módulo Financeiro
 * Gerencia produtos, faturas, itens de faturas e pagamentos
 */

import { eq, and, like, desc, sql, or } from 'drizzle-orm';
import { db } from '../db';
import {
  products,
  invoices,
  invoiceItems,
  payments,
  clients,
  contracts,
  InsertProduct,
  InsertInvoice,
  InsertInvoiceItem,
  InsertPayment,
  Product,
  Invoice,
  InvoiceItem,
  Payment
} from '@shared/schema';

// ==================== PRODUTOS ====================

/**
 * Obtém todos os produtos com paginação e filtros
 */
export async function getProducts(
  search?: string,
  active?: boolean,
  limit = 50,
  offset = 0
) {
  try {
    let query = db.select().from(products)
      .orderBy(desc(products.updatedAt))
      .limit(limit)
      .offset(offset);

    // Adicionar filtro por status se fornecido
    if (active !== undefined) {
      query = query.where(eq(products.isActive, active));
    }

    // Adicionar filtro por termo de busca se fornecido
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(products.name, searchTerm),
          like(products.code, searchTerm),
          like(products.description, searchTerm),
          like(products.category, searchTerm)
        )
      );
    }

    const result = await query;
    return result;
  } catch (error) {
    console.error("Erro ao obter produtos:", error);
    throw new Error("Falha ao buscar produtos");
  }
}

/**
 * Obtém um produto específico pelo ID
 */
export async function getProduct(id: number) {
  try {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Erro ao obter produto:", error);
    throw new Error("Falha ao buscar produto");
  }
}

/**
 * Cria um novo produto
 */
export async function createProduct(data: InsertProduct): Promise<Product> {
  try {
    const result = await db.insert(products).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    throw new Error("Falha ao criar produto");
  }
}

/**
 * Atualiza um produto existente
 */
export async function updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product> {
  try {
    // Adicionar timestamp de atualização
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const result = await db.update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    throw new Error("Falha ao atualizar produto");
  }
}

/**
 * Exclui um produto
 */
export async function deleteProduct(id: number): Promise<boolean> {
  try {
    const result = await db.delete(products)
      .where(eq(products.id, id));

    return result.count > 0;
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    throw new Error("Falha ao excluir produto");
  }
}

// ==================== FATURAS ====================

/**
 * Obtém todas as faturas com paginação e filtros
 */
export async function getInvoices(
  search?: string,
  status?: string,
  clientId?: number,
  userId?: number,
  limit = 50,
  offset = 0
) {
  try {
    let query = db.select({
      invoice: invoices,
      clientName: clients.name,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.updatedAt))
    .limit(limit)
    .offset(offset);

    // Adicionar filtro por status se fornecido
    if (status) {
      query = query.where(eq(invoices.status, status));
    }

    // Adicionar filtro por cliente se fornecido
    if (clientId) {
      query = query.where(eq(invoices.clientId, clientId));
    }

    // Adicionar filtro por criador se fornecido
    if (userId) {
      query = query.where(eq(invoices.createdById, userId));
    }

    // Adicionar filtro por termo de busca se fornecido
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(invoices.invoiceNumber, searchTerm),
          like(clients.name, searchTerm)
        )
      );
    }

    const result = await query;
    
    // Transformar o resultado para o formato esperado
    return result.map(row => ({
      ...row.invoice,
      clientName: row.clientName
    }));
  } catch (error) {
    console.error("Erro ao obter faturas:", error);
    throw new Error("Falha ao buscar faturas");
  }
}

/**
 * Obtém uma fatura específica pelo ID com seus itens e pagamentos
 */
export async function getInvoice(id: number) {
  try {
    const invoiceResult = await db.select().from(invoices).where(eq(invoices.id, id));
    
    if (invoiceResult.length === 0) {
      return null;
    }
    
    const invoice = invoiceResult[0];
    
    // Obter os itens da fatura
    const items = await db.select({
      item: invoiceItems,
      productName: products.name
    })
    .from(invoiceItems)
    .leftJoin(products, eq(invoiceItems.productId, products.id))
    .where(eq(invoiceItems.invoiceId, id));
    
    // Obter os pagamentos da fatura
    const invoicePayments = await db.select().from(payments).where(eq(payments.invoiceId, id));
    
    // Obter os detalhes do cliente
    const clientResult = invoice.clientId 
      ? await db.select().from(clients).where(eq(clients.id, invoice.clientId))
      : [];
      
    const client = clientResult.length > 0 ? clientResult[0] : null;
    
    return {
      ...invoice,
      items: items.map(row => ({
        ...row.item,
        productName: row.productName
      })),
      payments: invoicePayments,
      client
    };
  } catch (error) {
    console.error("Erro ao obter fatura:", error);
    throw new Error("Falha ao buscar fatura");
  }
}

/**
 * Gera um número único para a fatura
 */
async function generateInvoiceNumber(): Promise<string> {
  try {
    // Obter o último número de fatura
    const lastInvoice = await db.select()
      .from(invoices)
      .orderBy(desc(invoices.id))
      .limit(1);
    
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    
    let nextNumber = 1;
    
    if (lastInvoice.length > 0) {
      // Se houver uma fatura existente, incrementar o número
      const lastNumber = lastInvoice[0].invoiceNumber;
      const regex = /\d+$/;
      const match = lastNumber.match(regex);
      
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    
    // Formatar o número da fatura: FAT-YYYYMM-0001
    const invoiceNumber = `FAT-${year}${month}-${nextNumber.toString().padStart(4, '0')}`;
    return invoiceNumber;
  } catch (error) {
    console.error("Erro ao gerar número de fatura:", error);
    throw new Error("Falha ao gerar número de fatura");
  }
}

/**
 * Calcula o valor total de uma fatura com base nos itens
 */
async function calculateInvoiceTotal(invoiceId: number): Promise<number> {
  try {
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
    
    const total = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice) - item.discount;
    }, 0);
    
    return total;
  } catch (error) {
    console.error("Erro ao calcular total da fatura:", error);
    throw new Error("Falha ao calcular total da fatura");
  }
}

/**
 * Cria uma nova fatura
 */
export async function createInvoice(data: Omit<InsertInvoice, 'invoiceNumber' | 'totalAmount'>, items?: Array<Omit<InsertInvoiceItem, 'invoiceId'>>): Promise<Invoice> {
  try {
    return await db.transaction(async (tx) => {
      // Gerar número da fatura
      const invoiceNumber = await generateInvoiceNumber();
      
      // Calcular valor total inicial (0 se não houver itens ainda)
      const totalAmount = 0;
      
      // Criar a fatura
      const invoiceData: InsertInvoice = {
        ...data,
        invoiceNumber,
        totalAmount
      };
      
      const insertedInvoice = await tx.insert(invoices).values(invoiceData).returning();
      const invoice = insertedInvoice[0];
      
      // Se houver itens, adicioná-los à fatura
      if (items && items.length > 0) {
        for (const item of items) {
          await tx.insert(invoiceItems).values({
            ...item,
            invoiceId: invoice.id
          });
        }
        
        // Recalcular o total da fatura
        const newTotal = await calculateInvoiceTotal(invoice.id);
        
        // Atualizar o total da fatura
        await tx.update(invoices)
          .set({ totalAmount: newTotal })
          .where(eq(invoices.id, invoice.id));
          
        invoice.totalAmount = newTotal;
      }
      
      return invoice;
    });
  } catch (error) {
    console.error("Erro ao criar fatura:", error);
    throw new Error("Falha ao criar fatura");
  }
}

/**
 * Atualiza uma fatura existente
 */
export async function updateInvoice(id: number, data: Partial<InsertInvoice>): Promise<Invoice> {
  try {
    // Não permitir alteração do número da fatura
    const { invoiceNumber, ...updateData } = data;
    
    // Adicionar timestamp de atualização
    const finalUpdateData = {
      ...updateData,
      updatedAt: new Date()
    };

    const result = await db.update(invoices)
      .set(finalUpdateData)
      .where(eq(invoices.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao atualizar fatura:", error);
    throw new Error("Falha ao atualizar fatura");
  }
}

/**
 * Exclui uma fatura
 * Só permite excluir faturas com status 'draft'
 */
export async function deleteInvoice(id: number): Promise<boolean> {
  try {
    // Verificar se a fatura existe e está com status 'draft'
    const invoiceResult = await db.select().from(invoices).where(eq(invoices.id, id));
    
    if (invoiceResult.length === 0) {
      return false;
    }
    
    const invoice = invoiceResult[0];
    
    if (invoice.status !== 'draft') {
      throw new Error("Somente faturas em rascunho podem ser excluídas");
    }
    
    // Excluir todos os itens da fatura
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    
    // Excluir a fatura
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    
    return result.count > 0;
  } catch (error) {
    console.error("Erro ao excluir fatura:", error);
    throw error;
  }
}

// ==================== ITENS DE FATURA ====================

/**
 * Adiciona um item a uma fatura
 */
export async function addInvoiceItem(data: InsertInvoiceItem): Promise<InvoiceItem> {
  try {
    return await db.transaction(async (tx) => {
      // Validar se a fatura existe e está com status 'draft'
      const invoiceResult = await tx.select().from(invoices).where(eq(invoices.id, data.invoiceId));
      
      if (invoiceResult.length === 0) {
        throw new Error("Fatura não encontrada");
      }
      
      const invoice = invoiceResult[0];
      
      if (invoice.status !== 'draft') {
        throw new Error("Somente faturas em rascunho podem ter itens adicionados");
      }
      
      // Inserir o item
      const result = await tx.insert(invoiceItems).values(data).returning();
      const item = result[0];
      
      // Recalcular o total da fatura
      const newTotal = await calculateInvoiceTotal(data.invoiceId);
      
      // Atualizar o total da fatura
      await tx.update(invoices)
        .set({ totalAmount: newTotal })
        .where(eq(invoices.id, data.invoiceId));
      
      return item;
    });
  } catch (error) {
    console.error("Erro ao adicionar item à fatura:", error);
    throw error;
  }
}

/**
 * Atualiza um item de fatura
 */
export async function updateInvoiceItem(id: number, data: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
  try {
    return await db.transaction(async (tx) => {
      // Obter o item
      const itemResult = await tx.select().from(invoiceItems).where(eq(invoiceItems.id, id));
      
      if (itemResult.length === 0) {
        throw new Error("Item não encontrado");
      }
      
      const item = itemResult[0];
      
      // Validar se a fatura está com status 'draft'
      const invoiceResult = await tx.select().from(invoices).where(eq(invoices.id, item.invoiceId));
      
      if (invoiceResult.length === 0) {
        throw new Error("Fatura não encontrada");
      }
      
      const invoice = invoiceResult[0];
      
      if (invoice.status !== 'draft') {
        throw new Error("Somente itens de faturas em rascunho podem ser atualizados");
      }
      
      // Adicionar timestamp de atualização
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      // Atualizar o item
      const result = await tx.update(invoiceItems)
        .set(updateData)
        .where(eq(invoiceItems.id, id))
        .returning();
      
      // Recalcular o total da fatura
      const newTotal = await calculateInvoiceTotal(item.invoiceId);
      
      // Atualizar o total da fatura
      await tx.update(invoices)
        .set({ totalAmount: newTotal })
        .where(eq(invoices.id, item.invoiceId));
      
      return result[0];
    });
  } catch (error) {
    console.error("Erro ao atualizar item de fatura:", error);
    throw error;
  }
}

/**
 * Exclui um item de fatura
 */
export async function deleteInvoiceItem(id: number): Promise<boolean> {
  try {
    return await db.transaction(async (tx) => {
      // Obter o item
      const itemResult = await tx.select().from(invoiceItems).where(eq(invoiceItems.id, id));
      
      if (itemResult.length === 0) {
        return false;
      }
      
      const item = itemResult[0];
      
      // Validar se a fatura está com status 'draft'
      const invoiceResult = await tx.select().from(invoices).where(eq(invoices.id, item.invoiceId));
      
      if (invoiceResult.length === 0) {
        throw new Error("Fatura não encontrada");
      }
      
      const invoice = invoiceResult[0];
      
      if (invoice.status !== 'draft') {
        throw new Error("Somente itens de faturas em rascunho podem ser excluídos");
      }
      
      // Excluir o item
      const result = await tx.delete(invoiceItems).where(eq(invoiceItems.id, id));
      
      // Recalcular o total da fatura
      const newTotal = await calculateInvoiceTotal(item.invoiceId);
      
      // Atualizar o total da fatura
      await tx.update(invoices)
        .set({ totalAmount: newTotal })
        .where(eq(invoices.id, item.invoiceId));
      
      return result.count > 0;
    });
  } catch (error) {
    console.error("Erro ao excluir item de fatura:", error);
    throw error;
  }
}

// ==================== PAGAMENTOS ====================

/**
 * Registra um novo pagamento
 */
export async function createPayment(data: InsertPayment): Promise<Payment> {
  try {
    return await db.transaction(async (tx) => {
      // Validar se a fatura existe
      const invoiceResult = await tx.select().from(invoices).where(eq(invoices.id, data.invoiceId));
      
      if (invoiceResult.length === 0) {
        throw new Error("Fatura não encontrada");
      }
      
      const invoice = invoiceResult[0];
      
      // Inserir o pagamento
      const result = await tx.insert(payments).values(data).returning();
      const payment = result[0];
      
      // Calcular o total pago para esta fatura
      const paymentsResult = await tx.select({
        totalPaid: sql`SUM(${payments.amount})`
      })
      .from(payments)
      .where(eq(payments.invoiceId, data.invoiceId));
      
      const totalPaid = paymentsResult[0]?.totalPaid || 0;
      
      // Atualizar o status da fatura com base no pagamento
      let newStatus = invoice.status;
      
      if (totalPaid >= invoice.totalAmount) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      }
      
      // Atualizar o status da fatura se necessário
      if (newStatus !== invoice.status) {
        await tx.update(invoices)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(invoices.id, data.invoiceId));
      }
      
      return payment;
    });
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    throw error;
  }
}

/**
 * Obtém pagamentos de uma fatura
 */
export async function getInvoicePayments(invoiceId: number) {
  try {
    const result = await db.select().from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.paymentDate));
    
    return result;
  } catch (error) {
    console.error("Erro ao obter pagamentos da fatura:", error);
    throw new Error("Falha ao buscar pagamentos");
  }
}

/**
 * Atualiza um pagamento
 */
export async function updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment> {
  try {
    return await db.transaction(async (tx) => {
      // Obter o pagamento
      const paymentResult = await tx.select().from(payments).where(eq(payments.id, id));
      
      if (paymentResult.length === 0) {
        throw new Error("Pagamento não encontrado");
      }
      
      const payment = paymentResult[0];
      
      // Adicionar timestamp de atualização
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      
      // Atualizar o pagamento
      const result = await tx.update(payments)
        .set(updateData)
        .where(eq(payments.id, id))
        .returning();
      
      // Recalcular o status da fatura
      const paymentsResult = await tx.select({
        totalPaid: sql`SUM(${payments.amount})`
      })
      .from(payments)
      .where(eq(payments.invoiceId, payment.invoiceId));
      
      const totalPaid = paymentsResult[0]?.totalPaid || 0;
      
      // Obter os dados da fatura
      const invoiceResult = await tx.select().from(invoices).where(eq(invoices.id, payment.invoiceId));
      
      if (invoiceResult.length > 0) {
        const invoice = invoiceResult[0];
        
        // Determinar o novo status
        let newStatus = invoice.status;
        
        if (totalPaid >= invoice.totalAmount) {
          newStatus = 'paid';
        } else if (totalPaid > 0) {
          newStatus = 'partial';
        } else {
          newStatus = 'pending';
        }
        
        // Atualizar o status da fatura se necessário
        if (newStatus !== invoice.status) {
          await tx.update(invoices)
            .set({ status: newStatus, updatedAt: new Date() })
            .where(eq(invoices.id, payment.invoiceId));
        }
      }
      
      return result[0];
    });
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    throw error;
  }
}

/**
 * Exclui um pagamento
 */
export async function deletePayment(id: number): Promise<boolean> {
  try {
    return await db.transaction(async (tx) => {
      // Obter o pagamento
      const paymentResult = await tx.select().from(payments).where(eq(payments.id, id));
      
      if (paymentResult.length === 0) {
        return false;
      }
      
      const payment = paymentResult[0];
      
      // Excluir o pagamento
      const result = await tx.delete(payments).where(eq(payments.id, id));
      
      // Recalcular o status da fatura
      const paymentsResult = await tx.select({
        totalPaid: sql`SUM(${payments.amount})`
      })
      .from(payments)
      .where(eq(payments.invoiceId, payment.invoiceId));
      
      const totalPaid = paymentsResult[0]?.totalPaid || 0;
      
      // Obter os dados da fatura
      const invoiceResult = await tx.select().from(invoices).where(eq(invoices.id, payment.invoiceId));
      
      if (invoiceResult.length > 0) {
        const invoice = invoiceResult[0];
        
        // Determinar o novo status
        let newStatus = invoice.status;
        
        if (totalPaid >= invoice.totalAmount) {
          newStatus = 'paid';
        } else if (totalPaid > 0) {
          newStatus = 'partial';
        } else {
          newStatus = 'pending';
        }
        
        // Atualizar o status da fatura
        if (newStatus !== invoice.status) {
          await tx.update(invoices)
            .set({ status: newStatus, updatedAt: new Date() })
            .where(eq(invoices.id, payment.invoiceId));
        }
      }
      
      return result.count > 0;
    });
  } catch (error) {
    console.error("Erro ao excluir pagamento:", error);
    throw error;
  }
}