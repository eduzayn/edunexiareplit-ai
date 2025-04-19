#!/bin/bash

# Autenticar e salvar o cookie
echo "Autenticando no sistema..."
curl -s -c cookies.txt -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d '{"username":"admin","password":"123456"}' > /dev/null

# Extrair o cookie de sessão
SESSION_COOKIE=$(grep connect.sid cookies.txt | awk '{print $7}')
echo "Cookie de sessão obtido: $SESSION_COOKIE"

# Mapeamento de arquivos PDF para IDs de disciplinas
declare -A mapping=(
  ["1-METODOLOGIA DA PESQUISA CIENTIFICA.pdf"]=22
  ["curriculos-e-projetos-pedagogicos (1).pdf"]=17
  ["didatica-e-metodologia-do-ensino-superior (1).pdf"]=13
  ["Direcao de Grupos Vocais eou Instrumentais (1).pdf"]=25
  ["EDUCACAO A DISTANCIA E AS NOVAS MODALIDADES DE ENSINO.pdf"]=14
  ["EDUCACAO ESPECIAL E INCLUSIVA.pdf"]=20
  ["educacao-de-jovens-e-adultos (1).pdf"]=16
  ["educacao-em-direitos-humanos (1).pdf"]=19
  ["FILOSOFIA DA EDUCACAO.pdf"]=23
  ["FUNDAMENTOS TEORICOS MUSICAIS.pdf"]=3
  ["HISTORIA DA MUSICA.pdf"]=4
  ["Instrumentos Pedagogicos (2).pdf"]=8
  ["MEIO AMBIENTE E QUALIDADE DE VIDA.pdf"]=15
  ["Metodologia do Ensino de Musica (1).pdf"]=21
  ["psicologia-da-aprendizagem (1).pdf"]=18
  ["PSICOLOGIA DA MUSICA.pdf"]=24
  ["TOPICOS ESPECIAIS EM EDUCACAO MUSICAL E TECNOLOGIAS (1).pdf"]=10
)

echo "Iniciando atualização das disciplinas..."
echo "Total de disciplinas a serem atualizadas: ${#mapping[@]}"

# Contador para estatísticas
success_count=0
error_count=0

# Iterar pelo mapeamento e atualizar cada disciplina
for pdf_file in "${!mapping[@]}"; do
  discipline_id=${mapping[$pdf_file]}
  echo -n "Processando: ID $discipline_id - Arquivo: $pdf_file... "
  
  # Verificar se o arquivo existe
  if [ ! -f "uploads/apostilas/$pdf_file" ]; then
    echo "❌ Arquivo não encontrado!"
    ((error_count++))
    continue
  fi
  
  # Construir a URL relativa para o PDF
  pdf_url="/uploads/apostilas/$pdf_file"
  
  # Preparar o payload para a requisição
  json_payload="{\"apostilaPdfUrl\":\"$pdf_url\",\"contentStatus\":\"complete\"}"
  
  # Atualizar a disciplina com a URL do PDF
  response=$(curl -s -b cookies.txt -X PUT \
    "http://localhost:5000/api/admin/disciplines/$discipline_id/content" \
    -H "Content-Type: application/json" \
    -d "$json_payload")
  
  # Verificar se a atualização foi bem-sucedida
  if [[ $response == *"apostilaPdfUrl"* ]]; then
    echo "✅ Atualizado com sucesso!"
    ((success_count++))
  else
    echo "❌ Falha na atualização! Resposta: $response"
    ((error_count++))
  fi
done

echo "🏁 Atualização finalizada"
echo "📊 Resumo: $success_count sucesso(s), $error_count falha(s)"