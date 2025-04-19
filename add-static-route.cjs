// Script para adicionar rota estática para servir arquivos PDF no Express
const fs = require('fs');
const path = require('path');

// Caminho do arquivo routes.ts
const routesPath = './server/routes.ts';

// Ler o conteúdo do arquivo
let routesContent = fs.readFileSync(routesPath, 'utf8');

// Verificar se a rota já existe
if (routesContent.includes('app.use(\'/uploads/\', express.static(path.join(__dirname, \'../uploads\'))')) {
  console.log('✅ Rota estática para arquivos já existe!');
} else {
  // Encontrar a linha antes do "return httpServer" no final da função
  const insertPosition = routesContent.lastIndexOf('return httpServer');
  
  // Código da rota estática para inserir
  const staticRouteCode = `
  // Rota estática para servir arquivos de upload
  app.use('/uploads/', express.static(path.join(__dirname, '../uploads')));

  `;
  
  // Inserir o código
  const newRoutesContent = routesContent.slice(0, insertPosition) + staticRouteCode + routesContent.slice(insertPosition);
  
  // Salvar o arquivo atualizado
  fs.writeFileSync(routesPath, newRoutesContent);
  console.log('✅ Rota estática para uploads adicionada com sucesso!');
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

console.log('🎉 Configuração concluída! O servidor agora pode servir arquivos estáticos da pasta uploads.');