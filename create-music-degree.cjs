/**
 * Script para criar o curso de Segunda Licenciatura em Música e suas disciplinas
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createMusicDegree() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Criar o curso
    const courseResult = await client.query(`
      INSERT INTO courses (
        code, 
        name, 
        description, 
        status, 
        workload, 
        price, 
        thumbnail, 
        requirements, 
        objectives, 
        category, 
        modality, 
        evaluation_method
      ) VALUES (
        'SEG-LIC-MUS', 
        'Segunda Licenciatura em Música', 
        'Curso de Segunda Licenciatura em Música, destinado a graduados que desejam obter uma segunda formação na área musical. O programa oferece uma formação abrangente em teoria musical, história da música, pedagogia musical e prática instrumental.', 
        'published', 
        1800, 
        3900.00, 
        'https://images.unsplash.com/photo-1514119412350-e174d90d280e?q=80&w=1470&auto=format&fit=crop', 
        'Diploma de graduação em qualquer área do conhecimento. Conhecimentos básicos de teoria musical são recomendados.', 
        'Formar profissionais capacitados para atuar no ensino de música em diversos níveis educacionais, com uma abordagem pedagógica contemporânea e inclusiva.', 
        'Licenciatura', 
        'ead', 
        'mixed'
      ) RETURNING id;
    `);
    
    const courseId = courseResult.rows[0].id;
    console.log(`Curso criado com ID: ${courseId}`);
    
    // 2. Criar disciplinas
    const disciplines = [
      {
        code: 'MUS-FUND-001',
        name: 'Fundamentos da Linguagem Musical',
        description: 'Estudo dos elementos básicos da teoria musical: notação, escalas, intervalos, acordes e ritmo.',
        workload: 80,
        syllabus: 'Notação musical; Escalas maiores e menores; Intervalos; Acordes e campo harmônico; Ritmo e métrica.',
        contentStatus: 'complete'
      },
      {
        code: 'MUS-HIST-001',
        name: 'História da Música Ocidental',
        description: 'Panorama histórico da música ocidental desde a antiguidade até o século XXI.',
        workload: 60,
        syllabus: 'Música na Antiguidade; Música Medieval; Renascimento; Barroco; Classicismo; Romantismo; Século XX; Música Contemporânea.',
        contentStatus: 'complete'
      },
      {
        code: 'MUS-HARM-001',
        name: 'Harmonia e Análise Musical',
        description: 'Estudo dos princípios harmônicos e técnicas de análise musical aplicadas a diferentes períodos históricos.',
        workload: 80,
        syllabus: 'Funções harmônicas; Progressões harmônicas; Modulação; Análise formal; Contraponto; Técnicas de composição.',
        contentStatus: 'complete'
      },
      {
        code: 'MUS-PERC-001',
        name: 'Percepção e Treinamento Auditivo',
        description: 'Desenvolvimento da percepção musical através de exercícios de escuta, ditado e solfejo.',
        workload: 60,
        syllabus: 'Reconhecimento de intervalos; Ditado rítmico; Ditado melódico; Solfejo; Reconhecimento de acordes; Transcrição musical.',
        contentStatus: 'complete'
      },
      {
        code: 'MUS-ETNO-001',
        name: 'Etnomusicologia e Música Brasileira',
        description: 'Estudo das manifestações musicais brasileiras e suas raízes culturais.',
        workload: 60,
        syllabus: 'Música indígena; Influências africanas; Música popular brasileira; Folclore musical; Música erudita brasileira.',
        contentStatus: 'complete'
      },
      {
        code: 'MUS-INST-001',
        name: 'Instrumento Melódico',
        description: 'Prática instrumental em instrumento melódico à escolha do aluno (flauta, violão, teclado).',
        workload: 80,
        syllabus: 'Técnica instrumental; Leitura musical; Repertório pedagógico; Prática de conjunto; Recital didático.',
        contentStatus: 'complete'
      },
      {
        code: 'MUS-DIDATIC-001',
        name: 'Didática do Ensino Musical',
        description: 'Metodologias e estratégias para o ensino de música em diferentes contextos e faixas etárias.',
        workload: 80,
        syllabus: 'Métodos ativos; Abordagens pedagógicas contemporâneas; Planejamento de aulas; Avaliação em música; Recursos didáticos.',
        contentStatus: 'complete'
      },
      {
        code: 'MUS-TECNO-001',
        name: 'Tecnologias Aplicadas à Educação Musical',
        description: 'Utilização de ferramentas tecnológicas para o ensino e produção musical.',
        workload: 60,
        syllabus: 'Softwares de notação musical; Gravação e edição de áudio; Recursos online; Educação musical assistida por computador; Produção de material didático digital.',
        contentStatus: 'complete'
      },
      {
        code: 'MUS-ESTAG-001',
        name: 'Estágio Supervisionado em Música',
        description: 'Prática docente supervisionada em espaços formais e não-formais de educação musical.',
        workload: 100,
        syllabus: 'Observação; Regência compartilhada; Regência plena; Elaboração de projetos; Relatório de estágio.',
        contentStatus: 'complete'
      },
      {
        code: 'MUS-TCC-001',
        name: 'Trabalho de Conclusão de Curso',
        description: 'Desenvolvimento de projeto de pesquisa em educação musical.',
        workload: 80,
        syllabus: 'Metodologia científica; Pesquisa em educação musical; Elaboração de projeto; Desenvolvimento da pesquisa; Redação e apresentação do trabalho.',
        contentStatus: 'complete'
      },
    ];

    // Inserir disciplinas e vinculá-las ao curso
    for (let i = 0; i < disciplines.length; i++) {
      const d = disciplines[i];
      
      // Criar disciplina
      const disciplineResult = await client.query(`
        INSERT INTO disciplines (
          code, 
          name, 
          description, 
          workload, 
          syllabus, 
          content_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6
        ) RETURNING id;
      `, [d.code, d.name, d.description, d.workload, d.syllabus, d.contentStatus]);
      
      const disciplineId = disciplineResult.rows[0].id;
      console.log(`Disciplina "${d.name}" criada com ID: ${disciplineId}`);
      
      // Vincular disciplina ao curso
      await client.query(`
        INSERT INTO course_disciplines (
          course_id, 
          discipline_id, 
          "order"
        ) VALUES (
          $1, $2, $3
        );
      `, [courseId, disciplineId, i + 1]);
      
      console.log(`Disciplina "${d.name}" vinculada ao curso com ordem ${i + 1}`);
    }
    
    await client.query('COMMIT');
    console.log('Curso de Segunda Licenciatura em Música criado com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar curso:', error);
  } finally {
    client.release();
    pool.end();
  }
}

createMusicDegree().catch(console.error);