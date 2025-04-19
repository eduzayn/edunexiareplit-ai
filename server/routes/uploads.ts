import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Importação do middleware de autenticação
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || req.user?.portalType !== "admin") {
    return res.status(403).json({ message: "Acesso restrito a administradores" });
  }
  next();
};

const router = express.Router();

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determinar o diretório de destino com base no tipo de arquivo
    let uploadDir = 'uploads/apostilas';
    if (file.mimetype.includes('video')) {
      uploadDir = 'uploads/videos';
    }
    
    // Criar o diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Preservar o nome original do arquivo mas remover caracteres problemáticos
    const originalName = file.originalname.replace(/[^a-zA-Z0-9. \-()]/g, '');
    cb(null, originalName);
  }
});

// Filtro para permitir apenas arquivos PDF ou vídeo
const fileFilter = (req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Apenas PDF, MP4, WebM e QuickTime são permitidos.'));
  }
};

// Inicializar o upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limite
  }
});

// Rota para upload de PDFs
router.post('/pdf', requireAdmin, upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado ou o arquivo não é um PDF válido.'
      });
    }
    
    const file = req.file;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${req.headers.host}`
      : `http://${req.headers.host}`;
    
    const filepath = file.path.replace(/\\/g, '/'); // Normalizar caminho para formato URL
    const fileUrl = `${baseUrl}/${filepath}`;
    
    res.json({
      success: true,
      file: {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: filepath,
        url: fileUrl
      }
    });
  } catch (error: any) {
    console.error('Erro no upload de PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erro ao processar o upload do arquivo PDF.'
    });
  }
});

// Rota para upload de vídeos
router.post('/video', requireAdmin, upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nenhum arquivo foi enviado ou o arquivo não é um vídeo válido.'
      });
    }
    
    const file = req.file;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${req.headers.host}`
      : `http://${req.headers.host}`;
    
    const filepath = file.path.replace(/\\/g, '/'); // Normalizar caminho para formato URL
    const fileUrl = `${baseUrl}/${filepath}`;
    
    res.json({
      success: true,
      file: {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: filepath,
        url: fileUrl
      }
    });
  } catch (error: any) {
    console.error('Erro no upload de vídeo:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Erro ao processar o upload do arquivo de vídeo.'
    });
  }
});

// Rota para listar os arquivos PDF disponíveis
router.get('/pdfs', requireAdmin, (req, res) => {
  const pdfDir = path.join(process.cwd(), 'uploads/apostilas');
  
  // Verificar se o diretório existe
  if (!fs.existsSync(pdfDir)) {
    return res.json({ 
      success: true, 
      files: [] 
    });
  }
  
  try {
    const files = fs.readdirSync(pdfDir)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(file => {
        const stats = fs.statSync(path.join(pdfDir, file));
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? `https://${req.headers.host}`
          : `http://${req.headers.host}`;
          
        return {
          name: file,
          size: stats.size,
          lastModified: stats.mtime,
          url: `${baseUrl}/uploads/apostilas/${file}`
        };
      });
    
    res.json({
      success: true,
      files
    });
  } catch (error: any) {
    console.error('Erro ao listar PDFs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao listar arquivos PDF disponíveis.'
    });
  }
});

export default router;