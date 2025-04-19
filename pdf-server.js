// Micro-serviço para servir arquivos PDF com o tipo MIME correto
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar CORS para permitir acesso da aplicação principal
app.use(cors());

// Estatísticas
let requestCount = 0;

// Rota para a página inicial
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Servidor de PDFs</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          ul { list-style-type: none; padding: 0; }
          li { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .stats { background: #e9f7fe; padding: 10px; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Servidor de PDFs Edunexia</h1>
        <p>Este servidor fornece acesso aos PDFs das disciplinas com o tipo MIME correto.</p>
        
        <h2>PDFs disponíveis:</h2>
        <ul>
          ${fs.readdirSync(path.join(__dirname, 'uploads/apostilas'))
            .filter(file => file.endsWith('.pdf'))
            .map(file => `<li><a href="/${file}" target="_blank">${file}</a></li>`)
            .join('')}
        </ul>
        
        <div class="stats">
          <p>Total de requisições atendidas: ${requestCount}</p>
        </div>
      </body>
    </html>
  `);
});

// Rota para servir PDFs
app.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads/apostilas', filename);
  
  requestCount++;
  
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

// Porta para o servidor de PDFs
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor de PDFs rodando na porta ${PORT}`);
  console.log(`Acesse PDFs em: http://localhost:${PORT}/nome-do-arquivo.pdf`);
  console.log(`Para ver a lista de PDFs disponíveis, acesse: http://localhost:${PORT}/`);
});