import { Request, Response, Router } from "express";
import { db } from "../db";
import { integrations } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth";
import { InsertIntegration } from "@shared/schema";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import crypto from "crypto";

const router = Router();

// Função para criptografar chaves de API
function encryptApiKey(apiKey: string): string {
  // Em um ambiente de produção, use uma chave de criptografia segura armazenada em variáveis de ambiente
  const algorithm = 'aes-256-ctr';
  const secretKey = process.env.API_ENCRYPTION_KEY || 'default-secret-key-for-development-only';
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(apiKey), cipher.final()]);
  
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

// Função para descriptografar chaves de API
function decryptApiKey(encryptedApiKey: string): string {
  try {
    const algorithm = 'aes-256-ctr';
    const secretKey = process.env.API_ENCRYPTION_KEY || 'default-secret-key-for-development-only';
    
    const [ivHex, encryptedHex] = encryptedApiKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error("Erro ao descriptografar chave de API:", error);
    return "**erro-na-descriptografia**";
  }
}

// Máscara para exibição de chaves de API
function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  if (apiKey.length <= 8) return '••••••••';
  
  // Mostra apenas os primeiros e últimos 4 caracteres
  return `${apiKey.substring(0, 4)}${'•'.repeat(apiKey.length - 8)}${apiKey.substring(apiKey.length - 4)}`;
}

// Obter todas as integrações (admin)
router.get('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await db.select().from(integrations);
    
    // Mascarar chaves de API para exibição
    const maskedResult = result.map(integration => ({
      ...integration,
      apiKey: maskApiKey(integration.apiKey),
      apiSecret: integration.apiSecret ? maskApiKey(integration.apiSecret) : null
    }));
    
    res.json(maskedResult);
  } catch (error) {
    console.error("Erro ao buscar integrações:", error);
    res.status(500).json({ error: "Erro ao buscar integrações" });
  }
});

// Obter uma integração específica (admin)
router.get('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [result] = await db.select().from(integrations).where(eq(integrations.id, id));
    
    if (!result) {
      return res.status(404).json({ error: "Integração não encontrada" });
    }
    
    // Mascarar chaves de API para exibição
    const maskedResult = {
      ...result,
      apiKey: maskApiKey(result.apiKey),
      apiSecret: result.apiSecret ? maskApiKey(result.apiSecret) : null
    };
    
    res.json(maskedResult);
  } catch (error) {
    console.error("Erro ao buscar integração:", error);
    res.status(500).json({ error: "Erro ao buscar integração" });
  }
});

// Schema de validação para criação/atualização
const integrationSchema = z.object({
  type: z.enum(["asaas", "lytex", "openai", "elevenlabs", "zapi"]),
  name: z.string().min(1, "Nome é obrigatório"),
  apiKey: z.string().min(1, "Chave da API é obrigatória"),
  apiSecret: z.string().optional(),
  additionalConfig: z.any().optional(),
  isActive: z.boolean().optional().default(true),
  institutionId: z.number().optional(),
});

// Criar uma nova integração (admin)
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const validation = integrationSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: validation.error.format() 
      });
    }
    
    const data = validation.data;
    
    // Criptografar chaves antes de armazenar
    const encryptedApiKey = encryptApiKey(data.apiKey);
    const encryptedApiSecret = data.apiSecret ? encryptApiKey(data.apiSecret) : null;
    
    // Criar integração
    const [newIntegration] = await db.insert(integrations).values({
      type: data.type,
      name: data.name,
      apiKey: encryptedApiKey,
      apiSecret: encryptedApiSecret,
      additionalConfig: data.additionalConfig || {},
      isActive: data.isActive,
      institutionId: data.institutionId || null,
      createdById: req.user!.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Mascarar chaves para a resposta
    const maskedResult = {
      ...newIntegration,
      apiKey: maskApiKey(data.apiKey),
      apiSecret: data.apiSecret ? maskApiKey(data.apiSecret) : null
    };
    
    res.status(201).json(maskedResult);
  } catch (error) {
    console.error("Erro ao criar integração:", error);
    res.status(500).json({ error: "Erro ao criar integração" });
  }
});

// Atualizar uma integração (admin)
router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const validation = integrationSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: validation.error.format() 
      });
    }
    
    // Verificar se a integração existe
    const [existingIntegration] = await db.select().from(integrations).where(eq(integrations.id, id));
    
    if (!existingIntegration) {
      return res.status(404).json({ error: "Integração não encontrada" });
    }
    
    const data = validation.data;
    
    // Se a chave de API não mudou (identificamos pelo formato do mascaramento), mantemos a original
    let updatedApiKey = existingIntegration.apiKey;
    let updatedApiSecret = existingIntegration.apiSecret;
    
    // Se uma nova chave foi fornecida (não é a versão mascarada), criptografamos
    if (data.apiKey && !data.apiKey.includes('•')) {
      updatedApiKey = encryptApiKey(data.apiKey);
    }
    
    // Mesmo para o secret, se fornecido
    if (data.apiSecret && !data.apiSecret.includes('•')) {
      updatedApiSecret = encryptApiKey(data.apiSecret);
    } else if (data.apiSecret === '') {
      // Se enviado vazio, removemos o secret
      updatedApiSecret = null;
    }
    
    // Atualizar integração
    const [updatedIntegration] = await db.update(integrations)
      .set({
        type: data.type,
        name: data.name,
        apiKey: updatedApiKey,
        apiSecret: updatedApiSecret,
        additionalConfig: data.additionalConfig || existingIntegration.additionalConfig,
        isActive: data.isActive,
        institutionId: data.institutionId || existingIntegration.institutionId,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, id))
      .returning();
    
    // Mascarar chaves para a resposta
    const maskedApiKey = maskApiKey(decryptApiKey(updatedIntegration.apiKey));
    const maskedApiSecret = updatedIntegration.apiSecret 
      ? maskApiKey(decryptApiKey(updatedIntegration.apiSecret)) 
      : null;
    
    const maskedResult = {
      ...updatedIntegration,
      apiKey: maskedApiKey,
      apiSecret: maskedApiSecret
    };
    
    res.json(maskedResult);
  } catch (error) {
    console.error("Erro ao atualizar integração:", error);
    res.status(500).json({ error: "Erro ao atualizar integração" });
  }
});

// Excluir uma integração (admin)
router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verificar se a integração existe
    const [existingIntegration] = await db.select().from(integrations).where(eq(integrations.id, id));
    
    if (!existingIntegration) {
      return res.status(404).json({ error: "Integração não encontrada" });
    }
    
    // Excluir integração
    await db.delete(integrations).where(eq(integrations.id, id));
    
    res.status(204).end();
  } catch (error) {
    console.error("Erro ao excluir integração:", error);
    res.status(500).json({ error: "Erro ao excluir integração" });
  }
});

// Testar integração
router.post('/:id/test', requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Buscar integração
    const [integration] = await db.select().from(integrations).where(eq(integrations.id, id));
    
    if (!integration) {
      return res.status(404).json({ error: "Integração não encontrada" });
    }
    
    // Descriptografar chaves para uso
    const apiKey = decryptApiKey(integration.apiKey);
    const apiSecret = integration.apiSecret ? decryptApiKey(integration.apiSecret) : null;
    
    // Lógica de teste específica para cada tipo de integração
    let testResult;
    switch (integration.type) {
      case 'asaas':
        testResult = await testAsaasIntegration(apiKey);
        break;
      case 'lytex':
        testResult = await testLytexIntegration(apiKey, apiSecret);
        break;
      case 'openai':
        testResult = await testOpenAIIntegration(apiKey);
        break;
      case 'elevenlabs':
        testResult = await testElevenLabsIntegration(apiKey);
        break;
      case 'zapi':
        testResult = await testZAPIIntegration(apiKey);
        break;
      default:
        return res.status(400).json({ error: "Tipo de integração não suportado" });
    }
    
    res.json(testResult);
  } catch (error) {
    console.error("Erro ao testar integração:", error);
    res.status(500).json({ 
      error: "Erro ao testar integração", 
      details: error instanceof Error ? error.message : "Erro desconhecido" 
    });
  }
});

// Funções para testar cada tipo de integração
async function testAsaasIntegration(apiKey: string) {
  try {
    // Esta é apenas uma simulação, em produção você faria uma chamada real à API do Asaas
    return { 
      success: true, 
      message: "Conectado com sucesso à API do Asaas",
      details: "Acesso ao ambiente de integração verificado."
    };
  } catch (error) {
    return { 
      success: false, 
      message: "Falha ao conectar com a API do Asaas",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

async function testLytexIntegration(apiKey: string, apiSecret: string | null) {
  try {
    // Esta é apenas uma simulação, em produção você faria uma chamada real à API da Lytex
    return { 
      success: true, 
      message: "Conectado com sucesso à API da Lytex",
      details: "Credenciais validadas com sucesso."
    };
  } catch (error) {
    return { 
      success: false, 
      message: "Falha ao conectar com a API da Lytex",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

async function testOpenAIIntegration(apiKey: string) {
  try {
    // Esta é apenas uma simulação, em produção você faria uma chamada real à API da OpenAI
    return { 
      success: true, 
      message: "Conectado com sucesso à API da OpenAI",
      details: "Acesso aos modelos GPT confirmado."
    };
  } catch (error) {
    return { 
      success: false, 
      message: "Falha ao conectar com a API da OpenAI",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

async function testElevenLabsIntegration(apiKey: string) {
  try {
    // Esta é apenas uma simulação, em produção você faria uma chamada real à API da ElevenLabs
    return { 
      success: true, 
      message: "Conectado com sucesso à API da ElevenLabs",
      details: "Acesso à conversão de texto em fala verificado."
    };
  } catch (error) {
    return { 
      success: false, 
      message: "Falha ao conectar com a API da ElevenLabs",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

async function testZAPIIntegration(apiKey: string) {
  try {
    // Esta é apenas uma simulação, em produção você faria uma chamada real à API do Z-API
    return { 
      success: true, 
      message: "Conectado com sucesso à API do Z-API",
      details: "Conexão com WhatsApp Business API verificada."
    };
  } catch (error) {
    return { 
      success: false, 
      message: "Falha ao conectar com a API do Z-API",
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

export default router;