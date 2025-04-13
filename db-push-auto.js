// Automatiza a migração do banco de dados sem intervenção do usuário
import { exec } from 'child_process';
import { writeFileSync } from 'fs';

// Cria um arquivo de configuração temporário para o drizzle-kit
const tempConfig = `
module.exports = {
  autoApplyChanges: true,
  default: true,
};
`;

// Escreve o arquivo de configuração temporário
writeFileSync('drizzle-auto.config.js', tempConfig);

// Executa o comando de migração com o arquivo de configuração temporário
const command = 'npx drizzle-kit push --config=drizzle-auto.config.js';

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao executar migração: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Erro na migração: ${stderr}`);
    return;
  }
  
  console.log(`Migração concluída com sucesso:\n${stdout}`);
});