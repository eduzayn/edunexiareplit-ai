// Script para resetar a senha do administrador
import bcrypt from 'bcrypt';
import pg from 'pg';
const { Client } = pg;

async function resetAdminPassword() {
  try {
    // Conectar ao banco de dados
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    console.log('Conectado ao banco de dados PostgreSQL');

    // Gerar nova senha hash para '123456'
    const saltRounds = 10;
    const plainPassword = '123456';
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);
    
    console.log('Hash de senha gerado:', passwordHash);

    // Atualizar senha do administrador
    const result = await client.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username',
      [passwordHash, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('Senha resetada com sucesso para o usuário:', result.rows[0]);
    } else {
      console.error('Usuário admin não encontrado');
    }

    await client.end();
    console.log('Conexão com o banco de dados fechada');
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
  }
}

resetAdminPassword();