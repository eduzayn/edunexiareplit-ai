import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { requireAuth } from "./middleware/auth";
import bcrypt from "bcrypt";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Exportação do middleware centralizado para verificar se o usuário está autenticado
export { requireAuth };

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // Verificar formato de senha
    if (stored.startsWith('$2b$') || stored.startsWith('$2a$')) {
      // Formato bcrypt - usar bcrypt para comparação
      return await bcrypt.compare(supplied, stored);
    }
    
    // Formato padrão (hash.salt)
    const [hashed, salt] = stored.split(".");
    
    // Verificar se temos os componentes necessários
    if (!hashed || !salt) {
      console.log("Formato de senha inválido");
      return false;
    }
    
    // Gerar hash da senha fornecida usando o mesmo salt
    const suppliedHash = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Para evitar erros de tamanho diferente, comparamos as strings em hex
    const hashedSupplied = suppliedHash.toString('hex');
    
    // Comparar os hashes em formato de string
    return hashed === hashedSupplied;
  } catch (error) {
    console.error("Erro na comparação de senhas:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Ambiente: ${isProd ? 'Produção' : 'Desenvolvimento'}`);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "edunexia-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax', // 'none' permite cookies em requisições cross-origin em produção
      secure: isProd, // Sempre usar HTTPS em produção
      path: '/',
    }
  };
  
  // Log para debug
  console.log('Configuração de cookies:', {
    sameSite: sessionSettings.cookie?.sameSite,
    secure: sessionSettings.cookie?.secure,
    httpOnly: sessionSettings.cookie?.httpOnly,
  });

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        console.log(`Usuário com id ${id} não encontrado. Invalidando sessão.`);
        // Em vez de um erro, retorna null sem erro para invalidar a sessão silenciosamente
        return done(null, null);
      }
      return done(null, user);
    } catch (error) {
      console.error("Error deserializing user:", error);
      // Em caso de erro, também invalidamos a sessão silenciosamente
      return done(null, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      res.status(400).json({ message: errorMessage });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Logs para debug
      console.log("Autenticação bem-sucedida para usuário:", user.username);
      console.log("Portal type atual:", user.portalType);
      console.log("Portal type solicitado:", req.body.portalType);
      
      // Sempre atualizar o portalType no banco de dados
      try {
        await storage.updateUser(user.id, { portalType: req.body.portalType });
        
        // Atualizar o objeto do usuário para a sessão
        user.portalType = req.body.portalType;
        
        console.log("Portal type atualizado para:", user.portalType);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error("Erro ao atualizar portalType:", errorMessage);
      }

      // Consultar o usuário atualizado do banco para garantir
      try {
        const updatedUser = await storage.getUser(user.id);
        console.log("Usuário atualizado do banco:", updatedUser);
        
        // Verificar se o usuário existe antes de fazer login
        if (updatedUser) {
          // Usar o usuário atualizado na sessão
          req.login(updatedUser, (err) => {
            if (err) return next(err);
            return res.status(200).json(updatedUser);
          });
        } else {
          // Se o usuário não for encontrado (improvável), use o original
          req.login(user, (err) => {
            if (err) return next(err);
            return res.status(200).json(user);
          });
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error("Erro ao buscar usuário atualizado:", errorMessage);
        
        // Fallback para o usuário original caso haja erro
        req.login(user, (err) => {
          if (err) return next(err);
          return res.status(200).json(user);
        });
      }
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ success: true, message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
