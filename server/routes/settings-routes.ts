import express from "express";
import fs from "fs";
import path from "path";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router();

// Obter configurações gerais
router.get("/", requireAuth, (req, res) => {
  // Mock para demonstração
  const settings = {
    siteName: "EdunexIA",
    siteUrl: "https://app.edunexia.com.br",
    adminEmail: "admin@edunexia.com.br",
    supportEmail: "suporte@edunexia.com.br",
    timezone: "America/Sao_Paulo",
    dateFormat: "DD/MM/YYYY",
    features: {
      blog: true,
      forum: true,
      certificates: true,
      maintenance: false
    }
  };
  
  res.json(settings);
});

// Obter configurações de tema
router.get("/theme", requireAuth, (req, res) => {
  // Verificar se há um arquivo existente com as configurações do tema
  try {
    // Ler configurações do arquivo theme.json
    const themeFilePath = path.resolve('./theme.json');
    
    if (fs.existsSync(themeFilePath)) {
      const themeConfig = JSON.parse(fs.readFileSync(themeFilePath, 'utf8'));
      res.json({ success: true, theme: themeConfig });
    } else {
      res.status(404).json({ 
        success: false, 
        message: "Arquivo de tema não encontrado",
        theme: {
          variant: "vibrant",
          primary: "hsl(230, 70%, 55%)",
          appearance: "light",
          radius: 0.75
        }
      });
    }
  } catch (error) {
    console.error("Erro ao ler configurações de tema:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao ler configurações de tema",
      error: String(error)
    });
  }
});

// Atualizar configurações de tema
router.post("/theme", requireAuth, requireAdmin, (req, res) => {
  try {
    // Validar entrada
    const { theme } = req.body;
    
    if (!theme || typeof theme !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: "Dados de tema inválidos" 
      });
    }
    
    // Validar propriedades obrigatórias
    const requiredProps = ['variant', 'primary', 'appearance', 'radius'];
    const missingProps = requiredProps.filter(prop => !(prop in theme));
    
    if (missingProps.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Propriedades obrigatórias ausentes: ${missingProps.join(', ')}`
      });
    }
    
    // Caminho para o arquivo theme.json
    const themeFilePath = path.resolve('./theme.json');
    
    // Salvar configurações no arquivo
    fs.writeFileSync(themeFilePath, JSON.stringify(theme, null, 2));
    
    res.json({ 
      success: true, 
      message: "Configurações de tema atualizadas com sucesso",
      theme
    });
  } catch (error) {
    console.error("Erro ao salvar configurações de tema:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao salvar configurações de tema",
      error: String(error)
    });
  }
});

// Configurações de aparência adicionais
router.get("/appearance", requireAuth, (req, res) => {
  try {
    // Mock para demonstração - no futuro isso poderia vir do banco de dados
    const appearance = {
      colors: {
        primary: "hsl(230, 70%, 55%)",
        secondary: "#ff6600",
        background: "#f0f9ff",
        text: "#1e293b"
      },
      gradients: {
        sidebar: {
          from: "#f0f9ff",
          to: "#e0f2fe"
        },
        header: {
          from: "#ffffff",
          to: "#f8fafc"
        },
        footer: {
          from: "#1e3a8a",
          to: "#3451b2"
        }
      },
      fonts: {
        primary: "Inter",
        size: "medium"
      },
      borderRadius: 0.75
    };
    
    res.json({ success: true, appearance });
  } catch (error) {
    console.error("Erro ao obter configurações de aparência:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao obter configurações de aparência",
      error: String(error)
    });
  }
});

// Obter tema atual
router.get("/theme", requireAuth, requireAdmin, (req, res) => {
  try {
    // Leia o arquivo theme.json
    const themeFile = fs.readFileSync(path.join(process.cwd(), 'theme.json'), 'utf8');
    const theme = JSON.parse(themeFile);
    
    // Retorne o tema atual
    res.json({
      success: true,
      message: "Tema obtido com sucesso",
      theme
    });
  } catch (error) {
    console.error("Erro ao obter tema:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao obter tema",
      error: String(error)
    });
  }
});

// Atualizar configurações de tema
router.post("/theme", requireAuth, requireAdmin, (req, res) => {
  try {
    const { theme } = req.body;
    
    if (!theme || typeof theme !== 'object') {
      return res.status(400).json({ 
        success: false, 
        message: "Dados de tema inválidos" 
      });
    }
    
    // Validar estrutura do tema
    if (typeof theme.primary !== 'string' || 
        !['light', 'dark', 'system'].includes(theme.appearance) ||
        !['vibrant', 'professional', 'tint'].includes(theme.variant) ||
        typeof theme.radius !== 'number') {
      return res.status(400).json({ 
        success: false, 
        message: "Estrutura de tema inválida" 
      });
    }
    
    // Atualizar arquivo theme.json
    fs.writeFileSync(
      path.join(process.cwd(), 'theme.json'), 
      JSON.stringify(theme, null, 2)
    );
    
    res.json({
      success: true,
      message: "Tema atualizado com sucesso",
      theme
    });
  } catch (error) {
    console.error("Erro ao salvar tema:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao salvar tema",
      error: String(error)
    });
  }
});

export default router;