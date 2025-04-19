// Script para criar uma rota estática em server/routes.ts para servir arquivos PDFs

const fs = require('fs');
const path = require('path');

// Caminho para o arquivo routes.ts
const routesFilePath = path.join(process.cwd(), 'server', 'routes.ts');

// Lê o conteúdo original do arquivo
let routesContent = fs.readFileSync(routesFilePath, 'utf8');

// Nova rota a ser adicionada para servir arquivos estáticos
const newStaticRoute = `
  // ================== Rota para servir arquivos estáticos ==================
  // Configurar rota para servir arquivos da pasta uploads/apostilas
  app.use('/uploads/apostilas', express.static(path.join(process.cwd(), 'uploads/apostilas')));
  app.use('/uploads/ebook-images', express.static(path.join(process.cwd(), 'uploads/ebook-images')));
  app.use('/uploads/ebook-videos', express.static(path.join(process.cwd(), 'uploads/ebook-videos')));
`;

// Local onde inserir a nova rota (antes das rotas de API)
const insertMarker = "// ================== Rotas para Portal do Aluno ==================";

// Verifica se a rota já existe no arquivo
if (routesContent.includes('/uploads/apostilas')) {
  console.log('✅ Rota estática para PDFs já existe!');
} else {
  // Insere a nova rota antes do marcador
  const updatedContent = routesContent.replace(
    insertMarker,
    `${newStaticRoute}\n  ${insertMarker}`
  );

  // Escreve o conteúdo atualizado de volta no arquivo
  fs.writeFileSync(routesFilePath, updatedContent, 'utf8');
  
  console.log('✅ Rota estática para PDFs adicionada com sucesso!');
}

// Verifica se já temos o import de path no arquivo
if (!routesContent.includes("import path from 'path';")) {
  // Adiciona o import de path
  const pathImport = "import path from 'path';\n";
  // Insere o import após os imports existentes
  const updatedWithImport = routesContent.replace(
    "import { z } from 'zod';",
    "import { z } from 'zod';\n" + pathImport
  );
  
  // Escreve o conteúdo atualizado de volta no arquivo
  fs.writeFileSync(routesFilePath, updatedWithImport, 'utf8');
  
  console.log('✅ Import de path adicionado com sucesso!');
}

console.log('🎉 Configuração concluída! O servidor agora pode servir arquivos PDF.');