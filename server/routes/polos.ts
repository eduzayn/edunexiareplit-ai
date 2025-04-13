import { Router } from "express";
import { storage } from "../storage";
import { insertPoloSchema } from "@shared/schema";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// Listar polos com filtros opcionais
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const { search, status, institutionId, limit, offset } = req.query;
    
    const polos = await storage.getPolos(
      search as string,
      status as string,
      institutionId ? parseInt(institutionId as string) : undefined,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );
    
    res.json(polos);
  } catch (error) {
    console.error("Erro ao listar polos:", error);
    res.status(500).json({ message: "Erro ao listar polos" });
  }
});

// Obter polo por ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const polo = await storage.getPolo(id);
    
    if (!polo) {
      return res.status(404).json({ message: "Polo não encontrado" });
    }
    
    res.json(polo);
  } catch (error) {
    console.error("Erro ao obter polo:", error);
    res.status(500).json({ message: "Erro ao obter polo" });
  }
});

// Criar polo
router.post("/", async (req, res) => {
  try {
    const poloData = insertPoloSchema.parse(req.body);
    
    // Verifica se o código já existe
    const existingPolo = await storage.getPoloByCode(poloData.code);
    if (existingPolo) {
      return res.status(400).json({ message: "Código de polo já está em uso" });
    }
    
    // Cria o novo polo
    const newPolo = await storage.createPolo({
      ...poloData,
      createdById: req.user?.id
    });
    
    res.status(201).json(newPolo);
  } catch (error) {
    console.error("Erro ao criar polo:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar polo" });
  }
});

// Atualizar polo
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verifica se o polo existe
    const existingPolo = await storage.getPolo(id);
    if (!existingPolo) {
      return res.status(404).json({ message: "Polo não encontrado" });
    }
    
    // Verifica se o código não está em uso por outro polo
    if (req.body.code && req.body.code !== existingPolo.code) {
      const poloWithCode = await storage.getPoloByCode(req.body.code);
      if (poloWithCode && poloWithCode.id !== id) {
        return res.status(400).json({ message: "Código de polo já está em uso" });
      }
    }
    
    // Atualiza o polo
    const updatedPolo = await storage.updatePolo(id, req.body);
    
    res.json(updatedPolo);
  } catch (error) {
    console.error("Erro ao atualizar polo:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao atualizar polo" });
  }
});

// Excluir polo
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verifica se o polo existe
    const existingPolo = await storage.getPolo(id);
    if (!existingPolo) {
      return res.status(404).json({ message: "Polo não encontrado" });
    }
    
    // Exclui o polo
    const deleted = await storage.deletePolo(id);
    
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ message: "Erro ao excluir polo" });
    }
  } catch (error) {
    console.error("Erro ao excluir polo:", error);
    res.status(500).json({ message: "Erro ao excluir polo" });
  }
});

export default router;