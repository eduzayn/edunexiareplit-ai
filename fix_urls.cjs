const fs = require('fs');
const path = require('path');

// Ler o arquivo
const filePath = path.join('client/src/pages/polo/sales-links-page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Substituir o texto
const pattern = /Será usado no link: {window\.location\.origin}\/inscrever\?polo={field\.value \|\| "\[slug\]"}/g;
const replacement = 'Será usado no link: {new URL(`/inscrever?polo=${field.value || "[slug]"}`, window.location.origin).href}';

// Aplicar a substituição
const updatedContent = content.replace(pattern, replacement);

// Salvar o arquivo
fs.writeFileSync(filePath, updatedContent, 'utf8');

console.log('Substituições concluídas com sucesso!');
