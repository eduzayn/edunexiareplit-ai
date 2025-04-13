import { db } from './server/db'; 
import { users } from './shared/schema'; 
import { eq } from 'drizzle-orm'; 
import { scrypt, randomBytes } from 'crypto'; 
import { promisify } from 'util'; 

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  const hashedPassword = await hashPassword('123456');
  
  const [updatedUser] = await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.username, 'polo'))
    .returning();
  
  console.log('Senha atualizada para usuário polo:', updatedUser.id);
  process.exit();
}

main().catch(console.error);