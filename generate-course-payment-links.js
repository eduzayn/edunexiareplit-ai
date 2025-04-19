/**
 * Script para gerar links de pagamento em massa para cursos de pós-graduação
 * 
 * Este script cria três tipos de links de pagamento para cada curso:
 * 1. Boleto/PIX parcelado: R$ 1.118,40 em 16x de R$ 69,90
 * 2. Cartão de Crédito: R$ 899,00 em até 10x sem juros
 * 3. Boleto/PIX à vista: R$ 799,00
 */

const { db } = require('./server/storage');
const { eq } = require('drizzle-orm');
const { courses } = require('./shared/schema');
const AsaasCoursePaymentService = require('./server/services/asaas-course-payment-service');

// Configuração das opções de pagamento
const PAYMENT_OPTIONS = [
  {
    type: 'boleto-pix-parcelado',
    name: 'Boleto ou PIX Parcelado',
    description: 'Pagamento em até 16x de R$ 69,90',
    value: 1118.40,
    installments: 16,
    installmentValue: 69.90,
    billingType: 'BOLETO' // No Asaas, boleto pode ser pago como PIX também
  },
  {
    type: 'cartao-credito',
    name: 'Cartão de Crédito',
    description: 'Pagamento em até 10x sem juros',
    value: 899.00,
    installments: 10,
    installmentValue: 89.90,
    billingType: 'CREDIT_CARD'
  },
  {
    type: 'boleto-pix-avista',
    name: 'Boleto ou PIX à Vista',
    description: 'Pagamento único com desconto',
    value: 799.00,
    installments: 1,
    installmentValue: 799.00,
    billingType: 'BOLETO' // No Asaas, boleto pode ser pago como PIX também
  }
];

// Função auxiliar para esperar um tempo determinado
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Função principal para gerar os links de pagamento para um curso
 */
async function generateCoursePaymentLinks(course) {
  console.log(`\nProcessando curso: ${course.name} (ID: ${course.id})`);
  
  const courseService = new AsaasCoursePaymentService();
  const paymentLinks = [];
  
  for (const option of PAYMENT_OPTIONS) {
    try {
      console.log(`- Gerando link para opção ${option.type}...`);
      
      // Definindo dados do link de pagamento
      const paymentLinkData = {
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        description: `${option.name} - ${course.name} - ${option.description}`,
        value: option.value,
        billingType: option.billingType,
        maxInstallments: option.installments,
        paymentType: option.type
      };
      
      // Chamando o serviço do Asaas para criar o link
      const paymentLink = await courseService.createCoursePaymentLink(paymentLinkData);
      
      if (paymentLink) {
        console.log(`  ✅ Link gerado com sucesso: ${paymentLink.url}`);
        paymentLinks.push({
          paymentLinkId: paymentLink.id,
          paymentLinkUrl: paymentLink.url,
          paymentType: option.type,
          name: option.name,
          description: option.description,
          value: option.value,
          installments: option.installments
        });
      } else {
        console.error(`  ❌ Falha ao gerar link para ${option.type}`);
      }
      
      // Aguardar um pouco entre as requisições para evitar limitações de API
      await wait(1000);
      
    } catch (error) {
      console.error(`  ❌ Erro ao gerar link para ${option.type}:`, error.message);
    }
  }
  
  return paymentLinks;
}

/**
 * Função para salvar os links de pagamento para um curso no banco de dados
 */
async function savePaymentLinksToDatabase(courseId, paymentLinks) {
  try {
    console.log(`- Atualizando curso ID ${courseId} com links gerados...`);
    
    // Para simplificar, salvamos apenas o primeiro link no campo principal do curso
    // e todos os links em um campo JSON de metadados
    if (paymentLinks.length > 0) {
      const mainLink = paymentLinks.find(link => link.paymentType === 'boleto-pix-parcelado') || paymentLinks[0];
      
      await db.update(courses)
        .set({
          paymentLinkId: mainLink.paymentLinkId,
          paymentLinkUrl: mainLink.paymentLinkUrl,
          paymentOptions: JSON.stringify(paymentLinks)
        })
        .where(eq(courses.id, courseId));
        
      console.log(`  ✅ Links salvos com sucesso no banco de dados`);
    } else {
      console.log(`  ⚠️ Nenhum link para salvar`);
    }
  } catch (error) {
    console.error(`  ❌ Erro ao salvar links no banco de dados:`, error.message);
  }
}

/**
 * Função principal para executar o processamento em massa
 */
async function main() {
  try {
    console.log('🔄 Iniciando geração de links de pagamento em massa para cursos de pós-graduação...');
    
    // Buscar todos os cursos (ajustar filtro conforme necessário para identificar apenas pós-graduação)
    const postGraduationCourses = await db.select()
      .from(courses)
      .where(
        // Aqui você pode adicionar condições para filtrar apenas cursos de pós-graduação
        // Por exemplo: eq(courses.category, 'posgraduacao')
        // Ou: like(courses.name, '%Pós-Graduação%')
      );
    
    console.log(`📋 Encontrados ${postGraduationCourses.length} cursos para processamento`);
    
    // Processar cada curso
    let successCount = 0;
    for (let i = 0; i < postGraduationCourses.length; i++) {
      const course = postGraduationCourses[i];
      console.log(`\n[${i+1}/${postGraduationCourses.length}] Processando: ${course.name}`);
      
      const paymentLinks = await generateCoursePaymentLinks(course);
      
      if (paymentLinks.length > 0) {
        await savePaymentLinksToDatabase(course.id, paymentLinks);
        successCount++;
      }
      
      // Aguardar um pouco entre os processamentos de cursos
      await wait(2000);
    }
    
    console.log(`\n✅ Processamento concluído!`);
    console.log(`📊 Resumo: ${successCount} de ${postGraduationCourses.length} cursos atualizados com links de pagamento`);
    
  } catch (error) {
    console.error('❌ Erro durante o processamento:', error);
  }
}

// Executar o script
main()
  .then(() => {
    console.log('🏁 Script finalizado com sucesso');
    process.exit(0);
  })
  .catch(error => {
    console.error('🛑 Erro fatal durante a execução do script:', error);
    process.exit(1);
  });