/**
 * Serviço para gerenciar configurações específicas de cada instituição
 * Inclui suporte para armazenamento criptografado de informações sensíveis
 */
import { db } from '../db';
import { institutionSettings } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';

// Cache em memória para configurações (evita consultas desnecessárias ao banco)
const configCache = new Map<string, Map<string, string>>();

/**
 * Criptografa uma string
 * @param text Texto a ser criptografado
 * @returns Texto criptografado
 */
function encrypt(text: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retorna iv:encrypted para que possamos descriptografar depois
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Erro ao criptografar valor:', error);
    throw new Error('Falha ao criptografar configuração');
  }
}

/**
 * Descriptografa uma string
 * @param text Texto criptografado (no formato iv:encrypted)
 * @returns Texto descriptografado
 */
function decrypt(text: string): string {
  try {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
    
    // Separa o IV do texto criptografado
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar valor:', error);
    throw new Error('Falha ao descriptografar configuração');
  }
}

/**
 * Valida se há uma chave de criptografia disponível no ambiente
 */
function validateEncryptionKey(): boolean {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn('AVISO: ENCRYPTION_KEY não definida. Valores encriptados não serão seguros!');
    return false;
  }
  
  // Verifica se a chave possui o tamanho adequado (32 bytes em formato hexadecimal = 64 caracteres)
  if (key.length !== 64) {
    console.warn(`AVISO: ENCRYPTION_KEY deve ter 64 caracteres hexadecimais (32 bytes). Tamanho atual: ${key.length}`);
    return false;
  }
  
  console.log('Chave de criptografia configurada corretamente.');
  return true;
}

export class InstitutionSettingsService {
  constructor() {
    // Verifica se a chave de criptografia está disponível
    validateEncryptionKey();
  }
  
  /**
   * Obtém uma configuração para uma instituição específica
   * @param institutionId ID da instituição
   * @param key Chave da configuração
   * @returns Valor da configuração ou null se não encontrada
   */
  async getSetting(institutionId: number, key: string): Promise<string | null> {
    // Verificar primeiro no cache
    const cacheKey = `${institutionId}:${key}`;
    const institutionCache = configCache.get(String(institutionId));
    
    if (institutionCache && institutionCache.has(key)) {
      return institutionCache.get(key) || null;
    }
    
    // Se não estiver no cache, buscar no banco
    try {
      const setting = await db.query.institutionSettings.findFirst({
        where: and(
          eq(institutionSettings.institution_id, institutionId),
          eq(institutionSettings.key, key)
        )
      });
      
      if (!setting) return null;
      
      // Descriptografar se necessário
      let value = setting.value;
      if (setting.encrypted) {
        value = decrypt(setting.value);
      }
      
      // Atualizar o cache
      if (!configCache.has(String(institutionId))) {
        configCache.set(String(institutionId), new Map());
      }
      configCache.get(String(institutionId))!.set(key, value);
      
      return value;
    } catch (error) {
      console.error(`Erro ao buscar configuração ${key} para instituição ${institutionId}:`, error);
      return null;
    }
  }
  
  /**
   * Define uma configuração para uma instituição
   * @param institutionId ID da instituição
   * @param key Chave da configuração
   * @param value Valor da configuração
   * @param shouldEncrypt Se o valor deve ser criptografado
   */
  async setSetting(institutionId: number, key: string, value: string, shouldEncrypt = false): Promise<void> {
    try {
      const encryptedValue = shouldEncrypt ? encrypt(value) : value;
      
      // Inserir ou atualizar
      await db
        .insert(institutionSettings)
        .values({
          institution_id: institutionId,
          key,
          value: encryptedValue,
          encrypted: shouldEncrypt,
          updated_at: new Date()
        })
        .onConflictDoUpdate({
          target: [institutionSettings.institution_id, institutionSettings.key],
          set: { 
            value: encryptedValue,
            encrypted: shouldEncrypt,
            updated_at: new Date()
          }
        });
      
      // Atualizar o cache
      if (!configCache.has(String(institutionId))) {
        configCache.set(String(institutionId), new Map());
      }
      configCache.get(String(institutionId))!.set(key, value);
      
    } catch (error) {
      console.error(`Erro ao definir configuração ${key} para instituição ${institutionId}:`, error);
      throw new Error(`Falha ao salvar configuração: ${error}`);
    }
  }
  
  /**
   * Remove uma configuração
   * @param institutionId ID da instituição
   * @param key Chave da configuração
   */
  async deleteSetting(institutionId: number, key: string): Promise<void> {
    try {
      await db
        .delete(institutionSettings)
        .where(
          and(
            eq(institutionSettings.institution_id, institutionId),
            eq(institutionSettings.key, key)
          )
        );
      
      // Remover do cache
      const institutionCache = configCache.get(String(institutionId));
      if (institutionCache) {
        institutionCache.delete(key);
      }
    } catch (error) {
      console.error(`Erro ao excluir configuração ${key} para instituição ${institutionId}:`, error);
      throw new Error(`Falha ao excluir configuração: ${error}`);
    }
  }
  
  /**
   * Lista todas as configurações de uma instituição
   * @param institutionId ID da instituição
   * @param includeEncrypted Se deve incluir valores criptografados (que serão descriptografados)
   * @returns Lista de configurações
   */
  async listSettings(institutionId: number, includeEncrypted = false): Promise<Array<{key: string, value: string, encrypted: boolean}>> {
    try {
      const settings = await db.query.institutionSettings.findMany({
        where: eq(institutionSettings.institution_id, institutionId),
      });
      
      return settings.map(setting => {
        // Para valores criptografados, retornar valor original ou descriptografado conforme solicitado
        let value = setting.value;
        if (setting.encrypted && includeEncrypted) {
          value = decrypt(setting.value);
        } else if (setting.encrypted && !includeEncrypted) {
          value = "[VALOR CRIPTOGRAFADO]";
        }
        
        return {
          key: setting.key,
          value,
          encrypted: setting.encrypted
        };
      });
    } catch (error) {
      console.error(`Erro ao listar configurações para instituição ${institutionId}:`, error);
      throw new Error(`Falha ao listar configurações: ${error}`);
    }
  }
  
  /**
   * Limpa o cache para uma instituição ou para todas
   * @param institutionId ID da instituição (opcional)
   */
  clearCache(institutionId?: number): void {
    if (institutionId) {
      configCache.delete(String(institutionId));
    } else {
      configCache.clear();
    }
  }
  
  /**
   * Obtém configuração da API do Asaas para uma instituição
   * @param institutionId ID da instituição
   * @returns Chave da API Asaas ou null se não configurada
   */
  async getAsaasApiKey(institutionId: number): Promise<string | null> {
    return this.getSetting(institutionId, 'ASAAS_API_KEY');
  }
  
  /**
   * Define configuração da API do Asaas para uma instituição
   * @param institutionId ID da instituição
   * @param apiKey Chave da API Asaas
   */
  async setAsaasApiKey(institutionId: number, apiKey: string): Promise<void> {
    return this.setSetting(institutionId, 'ASAAS_API_KEY', apiKey, true);
  }
}

// Exporta uma instância única do serviço
export const institutionSettingsService = new InstitutionSettingsService();