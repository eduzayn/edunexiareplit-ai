// Script para adicionar rota específica para PDFs no Express
const fs = require('fs');
const path = require('path');

// Caminho do arquivo routes.ts
const routesPath = './server/routes.ts';

// Ler o conteúdo do arquivo
let routesContent = fs.readFileSync(routesPath, 'utf8');

// Verificar se a rota já existe
if (routesContent.includes('app.get(\'/pdf/:filename')) {
  console.log('✅ Rota específica para PDFs já existe!');
} else {
  // Encontrar a linha antes do "return httpServer" no final da função
  const insertPosition = routesContent.lastIndexOf('return httpServer');
  
  // Código da rota de PDF para inserir
  const pdfRouteCode = `
  // Rota específica para servir PDFs com o tipo MIME correto
  app.get('/pdf/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/apostilas', filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('PDF não encontrado');
    }
    
    // Configurar cabeçalhos para PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + filename + '"');
    
    // Servir o arquivo
    fs.createReadStream(filePath).pipe(res);
  });

  `;
  
  // Inserir o código
  const newRoutesContent = routesContent.slice(0, insertPosition) + pdfRouteCode + routesContent.slice(insertPosition);
  
  // Salvar o arquivo atualizado
  fs.writeFileSync(routesPath, newRoutesContent);
  console.log('✅ Rota específica para PDFs adicionada com sucesso!');
}

// Verificar se o módulo path já está importado
if (!routesContent.includes('import path from \'path\'')) {
  // Adicionar a importação do módulo path
  const importPosition = routesContent.indexOf('import');
  const pathImport = 'import path from \'path\';\n';
  
  const contentWithPathImport = routesContent.slice(0, importPosition) + pathImport + routesContent.slice(importPosition);
  
  // Salvar o arquivo atualizado
  fs.writeFileSync(routesPath, contentWithPathImport);
  console.log('✅ Import de path adicionado com sucesso!');
}

// Verificar se o módulo fs já está importado
if (!routesContent.includes('import fs from \'fs\'')) {
  // Adicionar a importação do módulo fs
  const importPosition = routesContent.indexOf('import');
  const fsImport = 'import fs from \'fs\';\n';
  
  const contentWithFsImport = routesContent.slice(0, importPosition) + fsImport + routesContent.slice(importPosition);
  
  // Salvar o arquivo atualizado
  fs.writeFileSync(routesPath, contentWithFsImport);
  console.log('✅ Import de fs adicionado com sucesso!');
}

console.log('🎉 Configuração concluída! O servidor agora pode servir arquivos PDF corretamente.');