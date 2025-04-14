import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Middleware para validar o corpo da requisição baseado em um schema Zod
 * @param schema Schema Zod para validação
 */
export function validateBody<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        message: "Erro de validação", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  };
}

/**
 * Middleware para validar parâmetros de consulta baseado em um schema Zod
 * @param schema Schema Zod para validação
 */
export function validateQuery<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Parâmetros de consulta inválidos", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        message: "Erro de validação", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  };
}

/**
 * Middleware para validar parâmetros de rota baseado em um schema Zod
 * @param schema Schema Zod para validação
 */
export function validateParams<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Parâmetros de rota inválidos", 
          errors: error.errors 
        });
      }
      
      return res.status(500).json({ 
        message: "Erro de validação", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  };
}