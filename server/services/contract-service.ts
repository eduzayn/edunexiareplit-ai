/**
 * Serviço para o módulo de Contratos
 * Gerencia contratos e templates de contratos
 */

import { eq, and, like, desc, sql, or } from 'drizzle-orm';
import { db } from '../db';
import {
  contractTemplates,
  contracts,
  clients,
  users,
  courses,
  InsertContractTemplate,
  InsertContract,
  ContractTemplate,
  Contract
} from '@shared/schema';

// ==================== TEMPLATES DE CONTRATO ====================

/**
 * Obtém todos os templates de contrato com paginação e filtros
 */
export async function getContractTemplates(
  search?: string,
  courseTypeId?: number,
  institutionId?: number,
  limit = 50,
  offset = 0
) {
  try {
    let query = db.select().from(contractTemplates)
      .orderBy(contractTemplates.name)
      .limit(limit)
      .offset(offset);

    // Adicionar filtro por tipo de curso se fornecido
    if (courseTypeId) {
      query = query.where(eq(contractTemplates.courseTypeId, courseTypeId));
    }

    // Adicionar filtro por instituição se fornecido
    if (institutionId) {
      query = query.where(eq(contractTemplates.institutionId, institutionId));
    }

    // Adicionar filtro por termo de busca se fornecido
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(contractTemplates.name, searchTerm),
          like(contractTemplates.description, searchTerm)
        )
      );
    }

    const result = await query;
    return result;
  } catch (error) {
    console.error("Erro ao obter templates de contrato:", error);
    throw new Error("Falha ao buscar templates de contrato");
  }
}

/**
 * Obtém um template de contrato específico pelo ID
 */
export async function getContractTemplate(id: number) {
  try {
    const result = await db.select().from(contractTemplates).where(eq(contractTemplates.id, id));
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Erro ao obter template de contrato:", error);
    throw new Error("Falha ao buscar template de contrato");
  }
}

/**
 * Cria um novo template de contrato
 */
export async function createContractTemplate(data: InsertContractTemplate): Promise<ContractTemplate> {
  try {
    const result = await db.insert(contractTemplates).values(data).returning();
    return result[0];
  } catch (error) {
    console.error("Erro ao criar template de contrato:", error);
    throw new Error("Falha ao criar template de contrato");
  }
}

/**
 * Atualiza um template de contrato existente
 */
export async function updateContractTemplate(id: number, data: Partial<InsertContractTemplate>): Promise<ContractTemplate> {
  try {
    // Adicionar timestamp de atualização
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const result = await db.update(contractTemplates)
      .set(updateData)
      .where(eq(contractTemplates.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao atualizar template de contrato:", error);
    throw new Error("Falha ao atualizar template de contrato");
  }
}

/**
 * Exclui um template de contrato
 */
export async function deleteContractTemplate(id: number): Promise<boolean> {
  try {
    // Verificar se o template está sendo usado por algum contrato
    const contractsUsingTemplate = await db.select()
      .from(contracts)
      .where(eq(contracts.templateId, id))
      .limit(1);

    if (contractsUsingTemplate.length > 0) {
      throw new Error("Não é possível excluir o template pois está sendo usado por contratos");
    }

    const result = await db.delete(contractTemplates)
      .where(eq(contractTemplates.id, id));

    return result.count > 0;
  } catch (error) {
    console.error("Erro ao excluir template de contrato:", error);
    throw error;
  }
}

// ==================== CONTRATOS ====================

/**
 * Gera um código único para o contrato
 */
async function generateContractCode(): Promise<string> {
  try {
    // Obter o último código de contrato
    const lastContract = await db.select()
      .from(contracts)
      .orderBy(desc(contracts.id))
      .limit(1);
    
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    
    let nextNumber = 1;
    
    if (lastContract.length > 0) {
      // Se houver um contrato existente, incrementar o número
      const lastCode = lastContract[0].code;
      const regex = /\d+$/;
      const match = lastCode.match(regex);
      
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }
    
    // Formatar o código do contrato: CTR2025001
    const contractCode = `CTR${year}${nextNumber.toString().padStart(3, '0')}`;
    return contractCode;
  } catch (error) {
    console.error("Erro ao gerar código de contrato:", error);
    throw new Error("Falha ao gerar código de contrato");
  }
}

/**
 * Processa o conteúdo do template substituindo variáveis pelos valores reais
 */
async function processContractTemplate(templateId: number, studentId: number, courseId: number): Promise<string> {
  try {
    // Obter o template
    const template = await getContractTemplate(templateId);
    if (!template) {
      throw new Error("Template de contrato não encontrado");
    }

    // Obter dados do aluno
    const studentResult = await db.select().from(users).where(eq(users.id, studentId));
    if (studentResult.length === 0) {
      throw new Error("Aluno não encontrado");
    }
    const student = studentResult[0];

    // Obter dados do curso
    const courseResult = await db.select().from(courses).where(eq(courses.id, courseId));
    if (courseResult.length === 0) {
      throw new Error("Curso não encontrado");
    }
    const course = courseResult[0];

    // Processar o template substituindo as variáveis
    let processedContent = template.templateContent;

    // Substituir variáveis do aluno
    processedContent = processedContent
      .replace(/{{aluno.nome}}/g, student.fullName || '')
      .replace(/{{aluno.email}}/g, student.email || '')
      .replace(/{{aluno.cpf}}/g, student.cpf || '')
      .replace(/{{aluno.telefone}}/g, student.phone || '')
      .replace(/{{aluno.endereco}}/g, student.address || '')
      .replace(/{{aluno.cidade}}/g, student.city || '')
      .replace(/{{aluno.estado}}/g, student.state || '')
      .replace(/{{aluno.cep}}/g, student.zipCode || '');

    // Substituir variáveis do curso
    processedContent = processedContent
      .replace(/{{curso.nome}}/g, course.name || '')
      .replace(/{{curso.codigo}}/g, course.code || '')
      .replace(/{{curso.duracao}}/g, course.duration?.toString() || '')
      .replace(/{{curso.cargaHoraria}}/g, course.workload?.toString() || '')
      .replace(/{{curso.valor}}/g, course.price?.toString() || '');

    // Substituir variáveis de data
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear().toString();

    processedContent = processedContent
      .replace(/{{data.dia}}/g, day)
      .replace(/{{data.mes}}/g, month)
      .replace(/{{data.ano}}/g, year)
      .replace(/{{data.completa}}/g, `${day}/${month}/${year}`);

    return processedContent;
  } catch (error) {
    console.error("Erro ao processar template de contrato:", error);
    throw new Error("Falha ao processar template de contrato");
  }
}

/**
 * Obtém todos os contratos com paginação e filtros
 */
export async function getContracts(
  search?: string,
  status?: string,
  studentId?: number,
  courseId?: number,
  limit = 50,
  offset = 0
) {
  try {
    let query = db.select({
      contract: contracts,
      studentName: users.fullName,
      courseName: courses.name
    })
    .from(contracts)
    .leftJoin(users, eq(contracts.studentId, users.id))
    .leftJoin(courses, eq(contracts.courseId, courses.id))
    .orderBy(desc(contracts.updatedAt))
    .limit(limit)
    .offset(offset);

    // Adicionar filtro por status se fornecido
    if (status) {
      query = query.where(eq(contracts.status, status));
    }

    // Adicionar filtro por aluno se fornecido
    if (studentId) {
      query = query.where(eq(contracts.studentId, studentId));
    }

    // Adicionar filtro por curso se fornecido
    if (courseId) {
      query = query.where(eq(contracts.courseId, courseId));
    }

    // Adicionar filtro por termo de busca se fornecido
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(contracts.code, searchTerm),
          like(users.fullName, searchTerm),
          like(courses.name, searchTerm)
        )
      );
    }

    const result = await query;
    
    // Transformar o resultado para o formato esperado
    return result.map(row => ({
      ...row.contract,
      studentName: row.studentName,
      courseName: row.courseName
    }));
  } catch (error) {
    console.error("Erro ao obter contratos:", error);
    throw new Error("Falha ao buscar contratos");
  }
}

/**
 * Obtém um contrato específico pelo ID
 */
export async function getContract(id: number) {
  try {
    const contractResult = await db.select({
      contract: contracts,
      studentName: users.fullName,
      studentEmail: users.email,
      courseName: courses.name,
      templateName: contractTemplates.name
    })
    .from(contracts)
    .leftJoin(users, eq(contracts.studentId, users.id))
    .leftJoin(courses, eq(contracts.courseId, courses.id))
    .leftJoin(contractTemplates, eq(contracts.templateId, contractTemplates.id))
    .where(eq(contracts.id, id));
    
    if (contractResult.length === 0) {
      return null;
    }
    
    // Transformar o resultado para o formato esperado
    return {
      ...contractResult[0].contract,
      studentName: contractResult[0].studentName,
      studentEmail: contractResult[0].studentEmail,
      courseName: contractResult[0].courseName,
      templateName: contractResult[0].templateName
    };
  } catch (error) {
    console.error("Erro ao obter contrato:", error);
    throw new Error("Falha ao buscar contrato");
  }
}

/**
 * Cria um novo contrato
 */
export async function createContract(data: Omit<InsertContract, 'code' | 'content'>): Promise<Contract> {
  try {
    // Gerar código do contrato
    const code = await generateContractCode();
    
    // Processar o template para gerar o conteúdo do contrato
    const content = await processContractTemplate(
      data.templateId || 0, 
      data.studentId,
      data.courseId
    );
    
    // Criar o contrato
    const contractData: InsertContract = {
      ...data,
      code,
      content
    };
    
    const result = await db.insert(contracts).values(contractData).returning();
    return result[0];
  } catch (error) {
    console.error("Erro ao criar contrato:", error);
    throw error;
  }
}

/**
 * Atualiza um contrato existente
 */
export async function updateContract(id: number, data: Partial<InsertContract>): Promise<Contract> {
  try {
    // Não permitir alteração do código do contrato
    const { code, ...updateData } = data;
    
    // Adicionar timestamp de atualização
    const finalUpdateData = {
      ...updateData,
      updatedAt: new Date()
    };

    const result = await db.update(contracts)
      .set(finalUpdateData)
      .where(eq(contracts.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao atualizar contrato:", error);
    throw new Error("Falha ao atualizar contrato");
  }
}

/**
 * Marca um contrato como assinado pelo aluno
 */
export async function signContractByStudent(id: number): Promise<Contract> {
  try {
    const result = await db.update(contracts)
      .set({ 
        studentSignedAt: new Date(),
        status: 'signed',
        updatedAt: new Date()
      })
      .where(eq(contracts.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao assinar contrato:", error);
    throw new Error("Falha ao assinar contrato");
  }
}

/**
 * Marca um contrato como assinado pela instituição
 */
export async function signContractByInstitution(id: number): Promise<Contract> {
  try {
    const result = await db.update(contracts)
      .set({ 
        institutionSignedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(contracts.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao assinar contrato pela instituição:", error);
    throw new Error("Falha ao assinar contrato pela instituição");
  }
}

/**
 * Cancela um contrato
 */
export async function cancelContract(id: number, additionalNotes?: string): Promise<Contract> {
  try {
    const updateData: any = { 
      status: 'cancelled',
      updatedAt: new Date()
    };
    
    if (additionalNotes) {
      updateData.additionalNotes = additionalNotes;
    }
    
    const result = await db.update(contracts)
      .set(updateData)
      .where(eq(contracts.id, id))
      .returning();

    return result[0];
  } catch (error) {
    console.error("Erro ao cancelar contrato:", error);
    throw new Error("Falha ao cancelar contrato");
  }
}