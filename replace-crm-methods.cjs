/**
 * Script para substituir os métodos de CRM no storage.ts
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const storageFilePath = path.join(__dirname, 'server', 'storage.ts');

async function replaceCRMMethods() {
  try {
    console.log('Lendo arquivo storage.ts...');
    let storageContent = fs.readFileSync(storageFilePath, 'utf8');
    
    // Procura a localização dos métodos CRM
    const leadMethodStartIdx = storageContent.indexOf('async getLead(id: number):');
    const clientMethodStartIdx = storageContent.indexOf('async getClient(id: number):');
    const contactMethodStartIdx = storageContent.indexOf('async getContact(id: number):');
    
    if (leadMethodStartIdx > 0 && clientMethodStartIdx > 0 && contactMethodStartIdx > 0) {
      console.log('Métodos CRM encontrados. Substituindo...');
      
      // Substituir os métodos de Lead
      const leadMethodsEndIdx = clientMethodStartIdx;
      
      // Substituir os métodos de Client
      const clientMethodsEndIdx = contactMethodStartIdx;
      
      // Substituir os métodos de Contact
      // Encontra a posição de onde termina os métodos de Contact (próximo // ou async)
      let contactMethodsEndIdx = storageContent.indexOf('// Finanças - Produtos', contactMethodStartIdx);
      if (contactMethodsEndIdx === -1) {
        contactMethodsEndIdx = storageContent.indexOf('async getProduct', contactMethodStartIdx);
      }
      
      // Substituir todos os métodos de CRM com stubs temporários
      const crmStubs = `
  // CRM - Métodos removidos temporariamente
  // Leads
  async getLead(id: number): Promise<any> {
    console.log("CRM método temporariamente indisponível: getLead");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async getLeads(search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    console.log("CRM método temporariamente indisponível: getLeads");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async createLead(lead: any): Promise<any> {
    console.log("CRM método temporariamente indisponível: createLead");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async updateLead(id: number, lead: any): Promise<any> {
    console.log("CRM método temporariamente indisponível: updateLead");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async deleteLead(id: number): Promise<boolean> {
    console.log("CRM método temporariamente indisponível: deleteLead");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async convertLeadToClient(leadId: number, additionalData: any, createdById: number): Promise<any> {
    console.log("CRM método temporariamente indisponível: convertLeadToClient");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  // Clientes
  async getClient(id: number): Promise<any> {
    console.log("CRM método temporariamente indisponível: getClient");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async getClientByCPFCNPJ(cpfCnpj: string): Promise<any> {
    console.log("CRM método temporariamente indisponível: getClientByCPFCNPJ");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async getClients(search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    console.log("CRM método temporariamente indisponível: getClients");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async createClient(client: any): Promise<any> {
    console.log("CRM método temporariamente indisponível: createClient");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async updateClient(id: number, client: any): Promise<any> {
    console.log("CRM método temporariamente indisponível: updateClient");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async deleteClient(id: number): Promise<boolean> {
    console.log("CRM método temporariamente indisponível: deleteClient");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  // Contatos
  async getContact(id: number): Promise<any> {
    console.log("CRM método temporariamente indisponível: getContact");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async getContactsByClient(clientId: number): Promise<any[]> {
    console.log("CRM método temporariamente indisponível: getContactsByClient");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async createContact(contact: any): Promise<any> {
    console.log("CRM método temporariamente indisponível: createContact");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async updateContact(id: number, contact: any): Promise<any> {
    console.log("CRM método temporariamente indisponível: updateContact");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  
  async deleteContact(id: number): Promise<boolean> {
    console.log("CRM método temporariamente indisponível: deleteContact");
    return Promise.reject("Método não implementado - CRM em reconstrução");
  }
  `;
      
      // Verificando se podemos localizar todos os pontos de início e fim
      if (leadMethodStartIdx > 0 && clientMethodStartIdx > 0 && 
          contactMethodStartIdx > 0 && contactMethodsEndIdx > 0) {
        
        // Substituir todos os métodos de CRM de uma vez
        const storageBeforeCRM = storageContent.substring(0, leadMethodStartIdx);
        const storageAfterCRM = storageContent.substring(contactMethodsEndIdx);
        
        storageContent = storageBeforeCRM + crmStubs + storageAfterCRM;
        
        console.log('Gravando alterações...');
        fs.writeFileSync(storageFilePath, storageContent, 'utf8');
        console.log('Arquivo storage.ts atualizado com sucesso!');
      } else {
        console.error('Não foi possível identificar todos os pontos de início e fim dos métodos CRM.');
        console.log('leadMethodStartIdx:', leadMethodStartIdx);
        console.log('clientMethodStartIdx:', clientMethodStartIdx);
        console.log('contactMethodStartIdx:', contactMethodStartIdx);
        console.log('contactMethodsEndIdx:', contactMethodsEndIdx);
      }
    } else {
      console.log('Métodos CRM não encontrados. Verificando pontos de referência:');
      console.log('leadMethodStartIdx:', leadMethodStartIdx);
      console.log('clientMethodStartIdx:', clientMethodStartIdx);
      console.log('contactMethodStartIdx:', contactMethodStartIdx);
    }
  } catch (error) {
    console.error('Erro ao atualizar o arquivo storage.ts:', error);
  }
}

// Executar a função
replaceCRMMethods().then(() => {
  console.log('Script finalizado.');
}).catch(err => {
  console.error('Erro fatal:', err);
});