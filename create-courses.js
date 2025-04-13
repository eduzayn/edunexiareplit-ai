// Script para criar cursos de pós-graduação na área da educação
import { db } from './server/db.js';
import { courses } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const today = new Date();
const startDate = new Date('2025-04-13');
const endDate = new Date('2026-10-13');
const enrollmentStartDate = new Date(today);
const enrollmentEndDate = new Date('2025-04-05');

// Lista de cursos de pós-graduação na área da educação
const educationCourses = [
  "ALFABETIZAÇÃO E LETRAMENTO",
  "ALFABETIZAÇÃO E LETRAMENTO E A PSICOPEDAGOGIA",
  "ARTETERAPIA",
  "ATENDIMENTO EDUCACIONAL ESPECIALIZADO COM ÊNFASE EM EDUCAÇÃO ESPECIAL E INCLUSIVA",
  "BIBLIOTECONOMIA",
  "COORDENAÇÃO E ORIENTAÇÃO ESCOLAR",
  "COORDENAÇÃO EDUCACIONAL",
  "EDUCAÇÃO 5.0",
  "EDUCAÇÃO AMBIENTAL E SUSTENTABILIDADE",
  "EDUCAÇÃO DE JOVENS E ADULTOS",
  "EDUCAÇÃO E DIREITOS HUMANOS",
  "EDUCAÇÃO ESPECIAL E INCLUSIVA",
  "EDUCAÇÃO FINANCEIRA",
  "EDUCAÇÃO INCLUSIVA E DIVERSIDADE",
  "EDUCAÇÃO INFANTIL",
  "EDUCAÇÃO MUSICAL",
  "ENSINO DA LÍNGUA ESPANHOLA",
  "ENSINO DA LÍNGUA INGLESA",
  "ENSINO DA LÍNGUA PORTUGUESA",
  "ENSINO DE LITERATURA E PRODUÇÃO DE TEXTOS EM LÍNGUA ESPANHOLA",
  "ENSINO DE LITERATURA E PRODUÇÃO DE TEXTOS EM LÍNGUA INGLESA",
  "ENSINO DE LITERATURA E PRODUÇÃO DE TEXTOS EM LÍNGUA PORTUGUESA",
  "ENSINO DE ARTES",
  "ENSINO DE CIÊNCIAS",
  "ENSINO DE GEOGRAFIA",
  "ENSINO DE HISTÓRIA",
  "ENSINO DE HISTÓRIA E GEOGRAFIA",
  "ENSINO DE MATEMÁTICA",
  "ENSINO RELIGIOSO",
  "GESTÃO E ORIENTAÇÃO ESCOLAR",
  "GESTÃO EDUCACIONAL",
  "GESTÃO EDUCACIONAL PÚBLICA",
  "GESTÃO ESCOLAR INTEGRADORA COM ÊNFASE EM SUPERVISÃO, ORIENTAÇÃO ADMINISTRATIVA E INSPEÇÃO",
  "LETRAS COM ÊNFASE EM LINGUÍSTICA",
  "LIBRAS",
  "LÍNGUA PORTUGUESA - REDAÇÃO E ORATÓRIA",
  "METODOLOGIA DO ENSINO DA MATEMÁTICA",
  "METODOLOGIA DO ENSINO DE MATEMÁTICA E FÍSICA",
  "METODOLOGIA DO ENSINO DE FILOSOFIA E SOCIOLOGIA",
  "METODOLOGIA DO ENSINO DE FILOSOFIA",
  "METODOLOGIA DO ENSINO DE LITERATURA AFRICANA E INDÍGENA",
  "METODOLOGIA DO ENSINO DE SOCIOLOGIA",
  "METODOLOGIA DO ENSINO SUPERIOR E AS VÁRIAS MODALIDADES",
  "METODOLOGIAS ATIVAS E TECNOLOGIAS EDUCACIONAIS",
  "MUSICOTERAPIA",
  "NEUROCIÊNCIAS E APRENDIZAGEM",
  "NEUROEDUCAÇÃO",
  "NEUROPSICOLOGIA CLÍNICA",
  "NEUROPSICOLOGIA",
  "NEUROPSICOPEDAGOGIA CLÍNICA E INSTITUCIONAL",
  "NEUROPSICOPEDAGOGIA CLÍNICA",
  "ORIENTAÇÃO EDUCACIONAL",
  "ORIENTAÇÃO ESCOLAR",
  "PRÁTICAS PSICOPEDAGÓGICAS",
  "PSICOMOTRICIDADE",
  "PSICOMOTRICIDADE E EDUCAÇÃO ESPECIAL",
  "PSICOMOTRICIDADE NA EDUCAÇÃO INFANTIL",
  "PSICOPEDAGOGIA E EDUCAÇÃO ESPECIAL",
  "PSICOPEDAGOGIA ESCOLAR",
  "SECRETARIADO ESCOLAR",
  "SOCIOLOGIA",
  "SUPERVISÃO E ORIENTAÇÃO EM EDUCAÇÃO INFANTIL",
  "SUPERVISÃO ESCOLAR",
  "SUPERVISÃO, ORIENTAÇÃO E INSPEÇÃO ESCOLAR",
  "TDAH - TRANSTORNO DO DEFICIT DE ATENÇÃO E HIPERATIVIDADE",
  "TECNOLOGIAS EDUCACIONAIS"
];

async function createCourses() {
  try {
    // Criar cursos um por um
    for (let i = 0; i < educationCourses.length; i++) {
      const name = educationCourses[i];
      const code = `POS-${name.substring(0, 3)}-${i + 1}`.toUpperCase();
      
      // Verificar se o curso já existe
      const existing = await db.select().from(courses).where(eq(courses.name, name));
      
      if (existing.length === 0) {
        // Inserir o curso se não existir
        await db.insert(courses).values({
          name,
          code,
          description: `Pós-graduação em ${name} com o objetivo de formar profissionais especializados para atuar na área educacional. O curso oferece uma formação completa com disciplinas teóricas e práticas.`,
          status: "published",
          workload: 580,
          enrollmentStartDate,
          enrollmentEndDate,
          startDate,
          endDate,
          price: 1800 + (Math.random() * 1200), // Preço entre 1800 e 3000
          modality: "ead",
          evaluationMethod: "mixed",
          requirements: "Graduação completa em qualquer área",
          objectives: `Especializar profissionais para atuarem na área de ${name.toLowerCase()}, aprofundando conhecimentos teóricos e práticos.`,
          category: "Pós-Graduação",
          thumbnail: "",
          createdById: 5, // ID do usuário administrador
        });
        
        console.log(`Curso criado: ${name}`);
      } else {
        console.log(`Curso já existe: ${name}`);
      }
    }
    
    console.log('Todos os cursos foram processados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar cursos:', error);
  } finally {
    process.exit(0);
  }
}

createCourses();