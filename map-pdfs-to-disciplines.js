// Mapeamento de nomes de arquivos PDF para IDs de disciplinas
const mapping = [
  { pdfFile: "curriculos-e-projetos-pedagogicos (1).pdf", disciplineId: 17, disciplineName: "Currículos Programas e Projetos Pedagógicos" },
  { pdfFile: "didatica-e-metodologia-do-ensino-superior (1).pdf", disciplineId: 13, disciplineName: "Didática do Ensino Superior" },
  { pdfFile: "Direcao de Grupos Vocais eou Instrumentais (1).pdf", disciplineId: 25, disciplineName: "Direção de Grupos Vocais e/ou Instrumentais" },
  { pdfFile: "EDUCACAO A DISTANCIA E AS NOVAS MODALIDADES DE ENSINO.pdf", disciplineId: 14, disciplineName: "Educação a Distância e as Novas Modalidades de Ensino" },
  { pdfFile: "EDUCACAO ESPECIAL E INCLUSIVA.pdf", disciplineId: 20, disciplineName: "Educação Inclusiva" },
  { pdfFile: "educacao-de-jovens-e-adultos (1).pdf", disciplineId: 16, disciplineName: "Educação de Jovens e Adultos" },
  { pdfFile: "educacao-em-direitos-humanos (1).pdf", disciplineId: 19, disciplineName: "Educação em Direitos Humanos" },
  { pdfFile: "FILOSOFIA DA EDUCACAO.pdf", disciplineId: 23, disciplineName: "Filosofia da Educação" },
  { pdfFile: "FUNDAMENTOS TEORICOS MUSICAIS.pdf", disciplineId: 3, disciplineName: "Fundamentos Teóricos Musicais" },
  { pdfFile: "HISTORIA DA MUSICA.pdf", disciplineId: 4, disciplineName: "História da Música Ocidental e Brasileira" },
  { pdfFile: "Instrumentos Pedagogicos (2).pdf", disciplineId: 8, disciplineName: "Instrumentos Pedagógicos para Educação Musical" },
  { pdfFile: "MEIO AMBIENTE E QUALIDADE DE VIDA.pdf", disciplineId: 15, disciplineName: "Meio Ambiente e Qualidade de Vida" },
  { pdfFile: "1-METODOLOGIA DA PESQUISA CIENTIFICA.pdf", disciplineId: 22, disciplineName: "Metodologia de Pesquisa Científica" },
  { pdfFile: "Metodologia do Ensino de Musica (1).pdf", disciplineId: 21, disciplineName: "Metodologias Ativas em Educação Musical" },
  { pdfFile: "psicologia-da-aprendizagem (1).pdf", disciplineId: 18, disciplineName: "Psicologia da Aprendizagem" },
  { pdfFile: "PSICOLOGIA DA MUSICA.pdf", disciplineId: 24, disciplineName: "Psicologia da Música" },
  { pdfFile: "TOPICOS ESPECIAIS EM EDUCACAO MUSICAL E TECNOLOGIAS (1).pdf", disciplineId: 10, disciplineName: "Tópicos Avançados em Educação Musical e Tecnologias" }
];

// Imprimir informações para verificação
console.log("Total de mapeamentos:", mapping.length);
mapping.forEach(item => {
  console.log(`${item.disciplineId} - ${item.disciplineName} => ${item.pdfFile}`);
});