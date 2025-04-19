// Script para atualizar as URLs de apostilas PDF para as disciplinas correspondentes
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const express = require('express');

// Mapeamento de nomes de arquivos PDF para IDs de disciplinas
const mapping = [
  { pdfFile: "curriculos-e-projetos-pedagogicos (1).pdf", disciplineId: 17, disciplineName: "Currículos Programas e Projetos Pedagógicos" },
  { pdfFile: "didatica-e-metodologia-do-ensino-superior (1).pdf", disciplineId: 13, disciplineName: "Didática do Ensino Superior" },
  { pdfFile: "Direcao de Grupos Vocais eou Instrumentais (1).pdf", disciplineId: 25, disciplineName: "Direção de Grupos Vocais e/ou Instrumentais" },
  { pdfFile: "EDUCACAO A DISTANCIA E AS NOVAS MODALIDADES DE ENSINO.pdf", disciplineId: 14, disciplineName: "Educação a Distância e as Novas Modalidades de Ensino" },
  { pdfFile: "EDUCACAO ESPECIAL E INCLUSIVA.pdf", disciplineId: 20, disciplineName: "Educação Inclusiva" },
  { pdfFile: "educacao-de-jovens-e-adultos (1).pdf", disciplineId: 16, disciplineName: "Educação de Jovens e Adultos" },
  { pdfFile: "educacao-em-direitos-humanos (1).pdf", disciplineId: 19, disciplineName: "Educação em Direitos Humanos" },
  { pdfFile: "FILOSOFIA DA EDUCACAO.pdf", disciplineId: 23, disciplineName: "Filosofia da Educação" },
  { pdfFile: "FUNDAMENTOS TEORICOS MUSICAIS.pdf", disciplineId: 3, disciplineName: "Fundamentos Teóricos Musicais" },
  { pdfFile: "HISTORIA DA MUSICA.pdf", disciplineId: 4, disciplineName: "História da Música Ocidental e Brasileira" },
  { pdfFile: "Instrumentos Pedagogicos (2).pdf", disciplineId: 8, disciplineName: "Instrumentos Pedagógicos para Educação Musical" },
  { pdfFile: "MEIO AMBIENTE E QUALIDADE DE VIDA.pdf", disciplineId: 15, disciplineName: "Meio Ambiente e Qualidade de Vida" },
  { pdfFile: "1-METODOLOGIA DA PESQUISA CIENTIFICA.pdf", disciplineId: 22, disciplineName: "Metodologia de Pesquisa Científica" },
  { pdfFile: "Metodologia do Ensino de Musica (1).pdf", disciplineId: 21, disciplineName: "Metodologias Ativas em Educação Musical" },
  { pdfFile: "psicologia-da-aprendizagem (1).pdf", disciplineId: 18, disciplineName: "Psicologia da Aprendizagem" },
  { pdfFile: "PSICOLOGIA DA MUSICA.pdf", disciplineId: 24, disciplineName: "Psicologia da Música" },
  { pdfFile: "TOPICOS ESPECIAIS EM EDUCACAO MUSICAL E TECNOLOGIAS (1).pdf", disciplineId: 10, disciplineName: "Tópicos Avançados em Educação Musical e Tecnologias" }
];

// Função para ler o cookie de sessão do arquivo
function getSessionCookie() {
  try {
    const cookiesContent = fs.readFileSync('cookies.txt', 'utf8');
    
    // Formato específico do arquivo de cookies curl
    const match = cookiesContent.match(/connect\.sid\s+([^\s]+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    throw new Error('Sessão não encontrada no arquivo cookies.txt');
  } catch (error) {
    console.error('Erro ao ler o cookie de sessão:', error.message);
    console.log('Conteúdo do arquivo cookies.txt:');
    console.log(fs.readFileSync('cookies.txt', 'utf8'));
    process.exit(1);
  }
}

// Configuração do cliente axios com o cookie de sessão
const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': `connect.sid=${getSessionCookie()}`
  }
});

// Criar uma rota para servir os PDFs
function setupStaticFileServer() {
  const app = express();

  // Configurar o servidor para servir arquivos estáticos da pasta uploads/apostilas
  app.use('/uploads/apostilas', express.static(path.join(process.cwd(), 'uploads/apostilas')));

  // Iniciar o servidor na porta 3001
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Servidor de arquivos estáticos iniciado na porta ${PORT}`);
    console.log(`Arquivos PDF disponíveis em: http://localhost:${PORT}/uploads/apostilas/`);
  });

  return app;
}

// Função para atualizar uma disciplina com a URL do PDF
async function updateDisciplinePdf(disciplineId, pdfFileName) {
  try {
    // Constrói a URL relativa do PDF
    // Usando o domínio da Replit para acesso aos arquivos
    const pdfUrl = `/uploads/apostilas/${pdfFileName}`;
    
    // Atualiza a disciplina com a URL do PDF
    const response = await apiClient.put(`/api/admin/disciplines/${disciplineId}/content`, {
      apostilaPdfUrl: pdfUrl,
      contentStatus: 'complete'
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar a disciplina ${disciplineId}:`, error.message);
    if (error.response) {
      console.error('Detalhes da resposta:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw error;
  }
}

// Função principal para atualizar todas as disciplinas
async function updateAllDisciplines() {
  console.log(`Iniciando atualização de ${mapping.length} disciplinas...`);
  
  // Iniciar o servidor para arquivos estáticos
  const staticServer = setupStaticFileServer();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const item of mapping) {
    try {
      console.log(`Processando: ${item.disciplineId} - ${item.disciplineName}`);
      
      // Verifica se o arquivo existe
      const filePath = path.join('uploads', 'apostilas', item.pdfFile);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Arquivo não encontrado: ${filePath}`);
        errorCount++;
        continue;
      }
      
      // Atualiza a disciplina
      const result = await updateDisciplinePdf(item.disciplineId, item.pdfFile);
      console.log(`✅ Disciplina atualizada: ${item.disciplineName}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Falha ao atualizar: ${item.disciplineName}`);
      errorCount++;
    }
  }
  
  console.log('🏁 Atualização finalizada');
  console.log(`📊 Resumo: ${successCount} sucesso(s), ${errorCount} falha(s)`);
}

// Executa a função principal
updateAllDisciplines().catch(error => {
  console.error('Erro fatal durante a execução:', error);
});