/**
 * Script para remover temporariamente definições do schema.ts do CRM
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const schemaFilePath = path.join(__dirname, 'shared', 'schema.ts');

async function updateSchema() {
  try {
    console.log('Lendo arquivo schema.ts...');
    let schemaContent = fs.readFileSync(schemaFilePath, 'utf8');
    
    // Remove leads table definition
    console.log('Removendo definição de leads...');
    const leadsStart = schemaContent.indexOf('export const leads = pgTable("leads", {');
    if (leadsStart > 0) {
      // Find the end of the table definition (closing '})')
      let depth = 0;
      let endIndex = leadsStart;
      let inString = false;
      let inComment = false;
      let prevChar = '';
      
      for (let i = leadsStart; i < schemaContent.length; i++) {
        const char = schemaContent[i];
        
        // Handle string literals
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
        }
        
        // Skip content inside strings
        if (inString) {
          prevChar = char;
          continue;
        }
        
        // Handle comments
        if (char === '/' && schemaContent[i+1] === '/') {
          inComment = true;
        } else if (inComment && char === '\n') {
          inComment = false;
        }
        
        // Skip content inside comments
        if (inComment) {
          prevChar = char;
          continue;
        }
        
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0 && schemaContent[i+1] === ')') {
            endIndex = i + 2;
            break;
          }
        }
        
        prevChar = char;
      }
      
      // Replace the leads table definition with a comment
      schemaContent = schemaContent.substring(0, leadsStart) + 
                    '// Leads table removed temporarily' + 
                    schemaContent.substring(endIndex);
    }
    
    // Remove clients table definition
    console.log('Removendo definição de clients...');
    const clientsStart = schemaContent.indexOf('export const clients = pgTable("clients", {');
    if (clientsStart > 0) {
      // Find the end of the table definition (closing '})')
      let depth = 0;
      let endIndex = clientsStart;
      let inString = false;
      let inComment = false;
      let prevChar = '';
      
      for (let i = clientsStart; i < schemaContent.length; i++) {
        const char = schemaContent[i];
        
        // Handle string literals
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
        }
        
        // Skip content inside strings
        if (inString) {
          prevChar = char;
          continue;
        }
        
        // Handle comments
        if (char === '/' && schemaContent[i+1] === '/') {
          inComment = true;
        } else if (inComment && char === '\n') {
          inComment = false;
        }
        
        // Skip content inside comments
        if (inComment) {
          prevChar = char;
          continue;
        }
        
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0 && schemaContent[i+1] === ')') {
            endIndex = i + 2;
            break;
          }
        }
        
        prevChar = char;
      }
      
      // Replace the clients table definition with a comment
      schemaContent = schemaContent.substring(0, clientsStart) + 
                    '// Clients table removed temporarily' + 
                    schemaContent.substring(endIndex);
    }
    
    // Remove contacts table definition
    console.log('Removendo definição de contacts...');
    const contactsStart = schemaContent.indexOf('export const contacts = pgTable("contacts", {');
    if (contactsStart > 0) {
      // Find the end of the table definition (closing '})')
      let depth = 0;
      let endIndex = contactsStart;
      let inString = false;
      let inComment = false;
      let prevChar = '';
      
      for (let i = contactsStart; i < schemaContent.length; i++) {
        const char = schemaContent[i];
        
        // Handle string literals
        if (char === '"' && prevChar !== '\\') {
          inString = !inString;
        }
        
        // Skip content inside strings
        if (inString) {
          prevChar = char;
          continue;
        }
        
        // Handle comments
        if (char === '/' && schemaContent[i+1] === '/') {
          inComment = true;
        } else if (inComment && char === '\n') {
          inComment = false;
        }
        
        // Skip content inside comments
        if (inComment) {
          prevChar = char;
          continue;
        }
        
        if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0 && schemaContent[i+1] === ')') {
            endIndex = i + 2;
            break;
          }
        }
        
        prevChar = char;
      }
      
      // Replace the contacts table definition with a comment
      schemaContent = schemaContent.substring(0, contactsStart) + 
                    '// Contacts table removed temporarily' + 
                    schemaContent.substring(endIndex);
    }
    
    // Remove CRM schemas from insertSchema definitions and exports
    // This is a simplistic approach and might need manual inspection later
    [
      'export const insertLeadSchema',
      'export type InsertLead',
      'export type Lead',
      'export const insertClientSchema',
      'export type InsertClient',
      'export type Client',
      'export const insertContactSchema',
      'export type InsertContact',
      'export type Contact',
      'export const leadsRelations',
      'export const clientsRelations',
      'export const contactsRelations'
    ].forEach(pattern => {
      console.log(`Removendo padrão: ${pattern}...`);
      const patternStart = schemaContent.indexOf(pattern);
      if (patternStart > 0) {
        // Find the end of the section (next export statement or end of file)
        let endIndex = schemaContent.indexOf('export', patternStart + 1);
        if (endIndex === -1) {
          endIndex = schemaContent.length;
        }
        
        // Replace with comment
        schemaContent = schemaContent.substring(0, patternStart) + 
                      `// ${pattern} - removed temporarily\n` + 
                      schemaContent.substring(endIndex);
      }
    });
    
    console.log('Gravando alterações...');
    fs.writeFileSync(schemaFilePath, schemaContent, 'utf8');
    console.log('Arquivo schema.ts atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar o arquivo schema.ts:', error);
  }
}

// Executar a função
updateSchema().then(() => {
  console.log('Script finalizado.');
}).catch(err => {
  console.error('Erro fatal:', err);
});