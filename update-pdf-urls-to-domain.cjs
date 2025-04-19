// Script para atualizar as URLs das disciplinas para usar a URL completa do domínio Replit
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Obter o domínio do Replit
const REPLIT_DOMAIN = process.env.REPLIT_DOMAINS || 'edunexia.replit.app';

// Função para autenticar
async function authenticate() {
  try {
    const response = await axios.post('http://localhost:5000/api/login', {
      username: 'admin',
      password: '123456'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const cookie = response.headers['set-cookie'][0].split(';')[0].split('=')[1];
    console.log('Autenticação bem-sucedida, cookie obtido');
    return cookie;
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    process.exit(1);
  }
}

// Buscar disciplinas
async function getDisciplines(sessionCookie) {
  try {
    const response = await axios.get('http://localhost:5000/api/admin/disciplines', {
      headers: {
        'Cookie': `connect.sid=${sessionCookie}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error.message);
    process.exit(1);
  }
}

// Atualizar a URL do PDF de uma disciplina
async function updateDisciplinePdfUrl(disciplineId, oldUrl, sessionCookie) {
  if (!oldUrl || !oldUrl.includes('/pdf/')) {
    return { updated: false, reason: 'Não possui URL de apostila ou URL não corresponde ao padrão esperado' };
  }
  
  // Extrair o nome do arquivo da URL antiga
  const fileName = oldUrl.split('/pdf/')[1];
  
  // Construir a nova URL com o domínio Replit
  const newUrl = `https://${REPLIT_DOMAIN}/uploads/apostilas/${fileName}`;
  
  try {
    // Atualizar a disciplina
    const response = await axios.put(`http://localhost:5000/api/admin/disciplines/${disciplineId}/content`, {
      apostilaPdfUrl: newUrl,
      contentStatus: 'complete'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `connect.sid=${sessionCookie}`
      }
    });
    
    return { 
      updated: true, 
      oldUrl, 
      newUrl,
      response: response.data
    };
  } catch (error) {
    console.error(`Erro ao atualizar disciplina ${disciplineId}:`, error.message);
    return { updated: false, reason: error.message };
  }
}

// Função principal
async function main() {
  console.log(`Domínio Replit: ${REPLIT_DOMAIN}`);
  
  // Autenticar
  const sessionCookie = await authenticate();
  
  // Buscar disciplinas
  const disciplines = await getDisciplines(sessionCookie);
  console.log(`Total de disciplinas encontradas: ${disciplines.length}`);
  
  // Filtrar disciplinas com PDF
  const disciplinesWithPdf = disciplines.filter(d => d.apostilaPdfUrl);
  console.log(`Disciplinas com PDF: ${disciplinesWithPdf.length}`);
  
  // Atualizar URLs
  let successCount = 0;
  let errorCount = 0;
  
  for (const discipline of disciplinesWithPdf) {
    console.log(`Processando: ${discipline.id} - ${discipline.name}`);
    console.log(`  URL atual: ${discipline.apostilaPdfUrl}`);
    
    const result = await updateDisciplinePdfUrl(discipline.id, discipline.apostilaPdfUrl, sessionCookie);
    
    if (result.updated) {
      console.log(`  ✅ URL atualizada: ${result.newUrl}`);
      successCount++;
    } else {
      console.log(`  ❌ Falha: ${result.reason}`);
      errorCount++;
    }
  }
  
  console.log('🏁 Atualização finalizada');
  console.log(`📊 Resumo: ${successCount} sucesso(s), ${errorCount} falha(s)`);
}

// Executar a função principal
main().catch(error => {
  console.error('Erro durante a execução:', error);
});