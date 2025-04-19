// Servidor para servir arquivos PDF com o tipo MIME correto
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Configurar CORS para permitir acesso da aplicação principal
app.use(cors());

// Rota para servir PDFs
app.get('/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'uploads/apostilas', filename);
  
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
});