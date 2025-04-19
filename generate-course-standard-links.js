/**
 * Script para gerar links de pagamento padrão para um curso específico
 * 
 * Este script cria três tipos de links de pagamento para o curso:
 * 1. Boleto/PIX parcelado: R$ 1.118,40 em 16x de R$ 69,90
 * 2. Cartão de Crédito: R$ 899,00 em até 10x sem juros
 * 3. Boleto/PIX à vista: R$ 799,00
 * 
 * Uso: 
 * node generate-course-standard-links.js <ID_DO_CURSO>
 */

import { db } from './server/db.js';
import { courses, eq } from './shared/schema.js';
import axios from 'axios';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar argumentos de linha de comando
const courseId = parseInt(process.argv[2]);
if (!courseId || isNaN(courseId)) {
  console.error('❌ Erro: Forneça o ID do curso como parâmetro.');
  console.log('📌 Uso: node generate-course-standard-links.js <ID_DO_CURSO>');
  process.exit(1);
}

// Configuração da API Asaas
const API_URL = process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
const ACCESS_TOKEN = process.env.ASAAS_ZAYN_KEY;

if (!ACCESS_TOKEN) {
  console.error('❌ Erro: Variável de ambiente ASAAS_ZAYN_KEY não está configurada');
  process.exit(1);
}

console.log('🔑 Usando token da API Asaas:', ACCESS_TOKEN.substring(0, 10) + '...');
console.log('🌐 URL da API Asaas:', API_URL);
console.log(`🎯 Processando curso ID: ${courseId}`);

/**
 * Gera um link de pagamento personalizado com as configurações especificadas
 */
async function createCustomPaymentLink(paymentData) {
  try {
    console.log(`\n📝 Criando link de pagamento (${paymentData.paymentType}) para curso [${paymentData.courseCode}] ${paymentData.courseName}`);
    
    // Formatando de acordo com a documentação oficial da Asaas
    const data = {
      name: `${paymentData.paymentType} - ${paymentData.courseName}`,
      description: paymentData.description,
      endDate: (() => {
        // Calcular data de expiração (1 ano a partir de agora)
        const expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        return expirationDate.toISOString().split('T')[0]; // formato YYYY-MM-DD
      })(),
      value: paymentData.value,
      billingType: paymentData.billingType,
      chargeType: 'DETACHED', // Link independente (não associado a um cliente específico)
      dueDateLimitDays: 30, // Pagamento expira após 30 dias
      subscriptionCycle: null,
      maxInstallments: paymentData.maxInstallments || null,
      notificationEnabled: true,
      callback: {
        autoRedirect: true,
        successUrl: `${process.env.REPLIT_DEV_DOMAIN || 'https://app.edu.ai'}/payment-success`,
        autoRedirectUrl: `${process.env.REPLIT_DEV_DOMAIN || 'https://app.edu.ai'}/payment-success`
      }
    };
    
    console.log('📤 Enviando requisição para a API...');
    
    // Fazer requisição para a API do Asaas
    const response = await axios.post(
      `${API_URL}/paymentLinks`, 
      data, 
      {
        headers: {
          'Content-Type': 'application/json',
          'access_token': ACCESS_TOKEN
        }
      }
    );
    
    // Verificar se houve erros
    if (response.data.errors && response.data.errors.length > 0) {
      console.error('❌ Erro ao gerar link de pagamento:', response.data.errors[0].description);
      return null;
    }
    
    if (!response.data.id || !response.data.url) {
      console.error('❌ Resposta inválida da API Asaas');
      return null;
    }
    
    console.log('✅ Link gerado com sucesso:', response.data.url);
    
    return {
      paymentLinkId: response.data.id,
      paymentLinkUrl: response.data.url
    };
  } catch (error) {
    console.error('❌ Erro ao gerar link de pagamento:', error.message);
    
    if (error.response) {
      console.error('📋 Detalhes da resposta:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    return null;
  }
}

/**
 * Gera três links de pagamento padrão para um curso
 */
async function generateStandardPaymentLinks(course) {
  console.log(`\n🎓 Processando curso: [${course.code}] ${course.name}`);
  
  const paymentOptions = [];
  
  try {
    // 1. Boleto/PIX parcelado: R$ 1.118,40 em 16x de R$ 69,90
    console.log('1️⃣ Gerando link para Boleto/PIX parcelado...');
    const boletoInstallmentLink = await createCustomPaymentLink({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      description: `Matrícula no curso ${course.name} via boleto ou PIX em até 16x de R$ 69,90`,
      value: 1118.40,
      billingType: 'BOLETO,PIX',
      maxInstallments: 16,
      paymentType: 'Parcelado Boleto/PIX'
    });
    
    if (boletoInstallmentLink) {
      paymentOptions.push({
        paymentLinkId: boletoInstallmentLink.paymentLinkId,
        paymentLinkUrl: boletoInstallmentLink.paymentLinkUrl,
        paymentType: 'Parcelado Boleto/PIX',
        name: `Boleto/PIX - ${course.name}`,
        description: 'Pagamento parcelado em até 16x',
        value: 1118.40,
        installments: 16,
        installmentValue: 69.90,
        billingType: 'BOLETO,PIX'
      });
    }
    
    // 2. Cartão de Crédito: R$ 899,00 em até 10x sem juros
    console.log('2️⃣ Gerando link para Cartão de Crédito...');
    const creditCardLink = await createCustomPaymentLink({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      description: `Matrícula no curso ${course.name} via cartão de crédito em até 10x sem juros`,
      value: 899.00,
      billingType: 'CREDIT_CARD',
      maxInstallments: 10,
      paymentType: 'Cartão de Crédito'
    });
    
    if (creditCardLink) {
      paymentOptions.push({
        paymentLinkId: creditCardLink.paymentLinkId,
        paymentLinkUrl: creditCardLink.paymentLinkUrl,
        paymentType: 'Cartão de Crédito',
        name: `Cartão de Crédito - ${course.name}`,
        description: 'Pagamento em até 10x sem juros',
        value: 899.00,
        installments: 10,
        installmentValue: 89.90,
        billingType: 'CREDIT_CARD'
      });
    }
    
    // 3. Boleto/PIX à vista: R$ 799,00
    console.log('3️⃣ Gerando link para Boleto/PIX à vista...');
    const boletoSingleLink = await createCustomPaymentLink({
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      description: `Matrícula no curso ${course.name} via boleto ou PIX à vista`,
      value: 799.00,
      billingType: 'BOLETO,PIX',
      maxInstallments: 1,
      paymentType: 'À vista Boleto/PIX'
    });
    
    if (boletoSingleLink) {
      paymentOptions.push({
        paymentLinkId: boletoSingleLink.paymentLinkId,
        paymentLinkUrl: boletoSingleLink.paymentLinkUrl,
        paymentType: 'À vista Boleto/PIX',
        name: `Boleto/PIX à vista - ${course.name}`,
        description: 'Pagamento à vista com desconto',
        value: 799.00,
        installments: 1,
        installmentValue: 799.00,
        billingType: 'BOLETO,PIX'
      });
    }
    
    // Atualizar o curso com as novas opções de pagamento
    await db.update(courses)
      .set({
        paymentOptions: JSON.stringify(paymentOptions),
        updatedAt: new Date()
      })
      .where(eq(courses.id, course.id));
    
    console.log(`✅ Curso atualizado com ${paymentOptions.length} opções de pagamento`);
    
    // Exibir sumário dos links gerados para facilitar testes
    console.log('\n📋 Sumário dos links gerados:');
    paymentOptions.forEach((option, index) => {
      console.log(`\n${index + 1}. ${option.name}`);
      console.log(`   Tipo: ${option.paymentType}`);
      console.log(`   Valor: R$ ${option.value.toFixed(2)}`);
      console.log(`   Link: ${option.paymentLinkUrl}`);
    });
    
    return paymentOptions;
  } catch (error) {
    console.error(`❌ Erro ao gerar links de pagamento para o curso ${course.id}:`, error.message);
    return [];
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log(`🔍 Buscando curso com ID ${courseId}...`);
    
    // Buscar o curso pelo ID
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId)
    });
    
    if (!course) {
      console.error(`❌ Erro: Curso com ID ${courseId} não encontrado.`);
      process.exit(1);
    }
    
    console.log(`✅ Curso encontrado: [${course.code}] ${course.name}`);
    
    // Gerar links de pagamento padrão para o curso
    await generateStandardPaymentLinks(course);
    
  } catch (error) {
    console.error('❌ Erro durante o processamento:', error.message);
  } finally {
    console.log('\n👋 Processamento finalizado.');
    process.exit(0);
  }
}

// Executar a função principal
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});