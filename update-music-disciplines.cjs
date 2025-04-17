/**
 * Script para atualizar o curso de Segunda Licenciatura em Música com as disciplinas específicas
 * conforme a imagem compartilhada
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateMusicDegree() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Localizar o ID do curso de Segunda Licenciatura em Música
    const courseResult = await client.query(`
      SELECT id FROM courses WHERE code = 'SEG-LIC-MUS' AND name = 'Segunda Licenciatura em Música'
    `);
    
    if (courseResult.rows.length === 0) {
      throw new Error('Curso de Segunda Licenciatura em Música não encontrado');
    }
    
    const courseId = courseResult.rows[0].id;
    console.log(`ID do curso encontrado: ${courseId}`);
    
    // Remover todas as disciplinas atuais do curso
    console.log('Removendo disciplinas anteriores do curso...');
    await client.query(`
      DELETE FROM course_disciplines WHERE course_id = $1
    `, [courseId]);
    
    // Atualizar a carga horária total do curso
    console.log('Atualizando carga horária total do curso para 1200 horas...');
    await client.query(`
      UPDATE courses SET workload = 1200 WHERE id = $1
    `, [courseId]);
    
    // Lista de disciplinas conforme a imagem
    const disciplines = [
      // NÚCLEO COMUM
      {
        code: 'MUS-DID-SUP-001',
        name: 'Didática do Ensino Superior',
        description: 'Estudo dos princípios didáticos aplicados ao ensino superior, com foco em metodologias de ensino e processos avaliativos no contexto universitário.',
        workload: 30,
        syllabus: 'Princípios didáticos do ensino superior; Metodologias ativas; Planejamento de ensino; Avaliação da aprendizagem; Relação professor-aluno.',
        contentStatus: 'complete',
        order: 1
      },
      {
        code: 'MUS-EAD-001',
        name: 'Educação a Distância e as Novas Modalidades de Ensino',
        description: 'Análise das características, fundamentos e metodologias da educação a distância e das novas modalidades de ensino mediadas por tecnologias.',
        workload: 30,
        syllabus: 'Histórico da EAD; Ambientes virtuais de aprendizagem; Mediação pedagógica; Design instrucional; Avaliação em EAD.',
        contentStatus: 'complete',
        order: 2
      },
      {
        code: 'MUS-MAMB-001',
        name: 'Meio Ambiente e Qualidade de Vida',
        description: 'Estudo das relações entre meio ambiente, sociedade e qualidade de vida, com ênfase na sustentabilidade e educação ambiental.',
        workload: 30,
        syllabus: 'Educação ambiental; Desenvolvimento sustentável; Impactos ambientais; Políticas ambientais; Qualidade de vida e meio ambiente.',
        contentStatus: 'complete',
        order: 3
      },
      {
        code: 'MUS-EJA-001',
        name: 'Educação de Jovens e Adultos',
        description: 'Estudo dos fundamentos, políticas e práticas pedagógicas da educação de jovens e adultos no Brasil.',
        workload: 30,
        syllabus: 'História da EJA no Brasil; Políticas públicas para EJA; Andragogia; Metodologias para EJA; Alfabetização de adultos.',
        contentStatus: 'complete',
        order: 4
      },
      {
        code: 'MUS-CURR-001',
        name: 'Currículos Programas e Projetos Pedagógicos',
        description: 'Estudo da concepção, desenvolvimento e avaliação de currículos, programas e projetos pedagógicos em diferentes contextos educacionais.',
        workload: 30,
        syllabus: 'Teorias do currículo; Elaboração de projetos pedagógicos; Base Nacional Comum Curricular; Avaliação curricular; Interdisciplinaridade.',
        contentStatus: 'complete',
        order: 5
      },
      {
        code: 'MUS-PSIC-001',
        name: 'Psicologia da Aprendizagem',
        description: 'Estudo das principais teorias psicológicas que fundamentam os processos de aprendizagem e suas aplicações no campo educacional.',
        workload: 30,
        syllabus: 'Teorias da aprendizagem; Desenvolvimento cognitivo; Motivação; Dificuldades de aprendizagem; Processos de memória e atenção.',
        contentStatus: 'complete',
        order: 6
      },
      {
        code: 'MUS-EDH-001',
        name: 'Educação em Direitos Humanos',
        description: 'Estudo dos princípios, políticas e práticas de educação em direitos humanos e sua implementação nos espaços educativos.',
        workload: 30,
        syllabus: 'Fundamentos dos direitos humanos; Educação como direito; Legislação internacional e nacional; Cultura de paz; Diversidade e inclusão.',
        contentStatus: 'complete',
        order: 7
      },
      {
        code: 'MUS-INCL-001',
        name: 'Educação Inclusiva',
        description: 'Estudo dos fundamentos teóricos e práticos da educação inclusiva, com foco nas políticas, estratégias pedagógicas e adaptações curriculares.',
        workload: 30,
        syllabus: 'Histórico da educação inclusiva; Políticas de inclusão; Acessibilidade; Adaptações curriculares; Tecnologias assistivas.',
        contentStatus: 'complete',
        order: 8
      },
      
      // NÚCLEO ESPECÍFICO
      {
        code: 'MUS-METATIV-001',
        name: 'Metodologias Ativas em Educação Musical',
        description: 'Estudo e aplicação de metodologias ativas no ensino de música, com foco na participação efetiva dos estudantes no processo de aprendizagem musical.',
        workload: 100,
        syllabus: 'Metodologias ativas; Aprendizagem baseada em projetos; Sala de aula invertida; Aprendizagem colaborativa; Avaliação em metodologias ativas.',
        contentStatus: 'complete',
        order: 9
      },
      {
        code: 'MUS-TECNO-001',
        name: 'Tópicos Avançados em Educação Musical e Tecnologias',
        description: 'Estudo aprofundado das tecnologias aplicadas à educação musical, incluindo softwares, aplicativos e plataformas digitais para ensino e produção musical.',
        workload: 100,
        syllabus: 'Tecnologias digitais para educação musical; Produção musical digital; Ambientes virtuais para ensino de música; Metodologias híbridas; Avaliação digital.',
        contentStatus: 'complete',
        order: 10
      },
      {
        code: 'MUS-HIST-001',
        name: 'História da Música Ocidental e Brasileira',
        description: 'Estudo da evolução histórica da música ocidental e brasileira, seus principais períodos, compositores e obras representativas.',
        workload: 90,
        syllabus: 'Música na antiguidade; Música medieval, renascentista e barroca; Classicismo e romantismo; Música no século XX; Música brasileira erudita e popular.',
        contentStatus: 'complete',
        order: 11
      },
      {
        code: 'MUS-INST-001',
        name: 'Instrumentos Pedagógicos para Educação Musical',
        description: 'Estudo dos diversos instrumentos e recursos pedagógicos utilizados no ensino de música, com foco em sua aplicação prática em sala de aula.',
        workload: 90,
        syllabus: 'Flauta doce como instrumento pedagógico; Percussão corporal; Instrumentos alternativos; Jogos musicais; Materiais didáticos para educação musical.',
        contentStatus: 'complete',
        order: 12
      },
      {
        code: 'MUS-PESQ-001',
        name: 'Metodologia de Pesquisa Científica',
        description: 'Estudo dos princípios e métodos da pesquisa científica aplicados à área de educação musical.',
        workload: 50,
        syllabus: 'Fundamentos da pesquisa científica; Tipos de pesquisa; Metodologias qualitativas e quantitativas; Elaboração de projeto de pesquisa; Redação científica.',
        contentStatus: 'complete',
        order: 13
      },
      {
        code: 'MUS-FUND-001',
        name: 'Fundamentos Teóricos Musicais',
        description: 'Estudo dos fundamentos teóricos da música, incluindo notação, teoria, harmonia e análise musical.',
        workload: 90,
        syllabus: 'Teoria musical básica e avançada; Harmonia tonal; Análise musical; Contraponto; Formas musicais.',
        contentStatus: 'complete',
        order: 14
      },
      {
        code: 'MUS-FILO-001',
        name: 'Filosofia da Educação',
        description: 'Estudo das principais correntes filosóficas que fundamentam as teorias e práticas educacionais, com enfoque na educação musical.',
        workload: 50,
        syllabus: 'Filosofia e educação; Correntes filosóficas educacionais; Ética na educação; Estética e educação musical; Filosofia da arte.',
        contentStatus: 'complete',
        order: 15
      },
      {
        code: 'MUS-PSIC-MUS-001',
        name: 'Psicologia da Música',
        description: 'Estudo dos processos psicológicos envolvidos na percepção, cognição, criação e resposta emocional à música.',
        workload: 100,
        syllabus: 'Percepção musical; Desenvolvimento musical; Cognição musical; Emoção e música; Neuropsicologia da música.',
        contentStatus: 'complete',
        order: 16
      },
      {
        code: 'MUS-COND-001',
        name: 'Direção de Grupos Vocais e/ou Instrumentais',
        description: 'Estudo teórico e prático dos princípios de regência e direção de grupos vocais e instrumentais em contextos educacionais.',
        workload: 90,
        syllabus: 'Técnicas de regência; Preparação de ensaios; Repertório para grupos escolares; Arranjos musicais; Apresentações musicais.',
        contentStatus: 'complete',
        order: 17
      },
      {
        code: 'MUS-PRAT-001',
        name: 'Práticas Pedagógicas',
        description: 'Desenvolvimento de práticas pedagógicas em educação musical, com planejamento, execução e avaliação de atividades de ensino.',
        workload: 200,
        syllabus: 'Observação em espaços educativos; Planejamento de aulas de música; Regência de classe; Avaliação musical; Relatório de práticas.',
        contentStatus: 'complete',
        order: 18
      }
    ];

    // Inserir novas disciplinas e vinculá-las ao curso
    for (const discipline of disciplines) {
      // Verificar se a disciplina já existe pelo código
      const existingDisciplineResult = await client.query(`
        SELECT id FROM disciplines WHERE code = $1
      `, [discipline.code]);
      
      let disciplineId;
      
      if (existingDisciplineResult.rows.length > 0) {
        // Atualizar disciplina existente
        disciplineId = existingDisciplineResult.rows[0].id;
        await client.query(`
          UPDATE disciplines 
          SET name = $1, 
              description = $2, 
              workload = $3, 
              syllabus = $4, 
              content_status = $5
          WHERE id = $6
        `, [discipline.name, discipline.description, discipline.workload, 
            discipline.syllabus, discipline.contentStatus, disciplineId]);
        
        console.log(`Disciplina "${discipline.name}" atualizada com ID: ${disciplineId}`);
      } else {
        // Criar nova disciplina
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
        `, [discipline.code, discipline.name, discipline.description, 
            discipline.workload, discipline.syllabus, discipline.contentStatus]);
        
        disciplineId = disciplineResult.rows[0].id;
        console.log(`Disciplina "${discipline.name}" criada com ID: ${disciplineId}`);
      }
      
      // Vincular disciplina ao curso
      await client.query(`
        INSERT INTO course_disciplines (
          course_id, 
          discipline_id, 
          "order"
        ) VALUES (
          $1, $2, $3
        );
      `, [courseId, disciplineId, discipline.order]);
      
      console.log(`Disciplina "${discipline.name}" vinculada ao curso com ordem ${discipline.order}`);
    }
    
    await client.query('COMMIT');
    console.log('Curso de Segunda Licenciatura em Música atualizado com sucesso!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar curso:', error);
  } finally {
    client.release();
    pool.end();
  }
}

updateMusicDegree().catch(console.error);