import { Router } from "express";
import { storage } from "../storage";
import { insertFinancialCategorySchema } from "@shared/schema";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// Listar categorias financeiras com filtros opcionais
router.get("/", authenticateAdmin, async (req, res) => {
  try {
    const { type, institutionId, limit, offset } = req.query;
    
    const categories = await storage.getFinancialCategories(
      type as string,
      institutionId ? parseInt(institutionId as string) : undefined,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );
    
    res.json(categories);
  } catch (error) {
    console.error("Erro ao listar categorias financeiras:", error);
    res.status(500).json({ message: "Erro ao listar categorias financeiras" });
  }
});

// Obter categoria financeira por ID
router.get("/:id", authenticateAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const category = await storage.getFinancialCategory(id);
    
    if (!category) {
      return res.status(404).json({ message: "Categoria financeira não encontrada" });
    }
    
    res.json(category);
  } catch (error) {
    console.error("Erro ao obter categoria financeira:", error);
    res.status(500).json({ message: "Erro ao obter categoria financeira" });
  }
});

// Criar categoria financeira
router.post("/", authenticateAdmin, async (req, res) => {
  try {
    const categoryData = insertFinancialCategorySchema.parse(req.body);
    
    // Cria a nova categoria
    const newCategory = await storage.createFinancialCategory({
      ...categoryData,
      createdById: req.user?.id
    });
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error("Erro ao criar categoria financeira:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar categoria financeira" });
  }
});

// Atualizar categoria financeira
router.patch("/:id", authenticateAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verifica se a categoria financeira existe
    const existingCategory = await storage.getFinancialCategory(id);
    if (!existingCategory) {
      return res.status(404).json({ message: "Categoria financeira não encontrada" });
    }
    
    // Atualiza a categoria
    const updatedCategory = await storage.updateFinancialCategory(id, req.body);
    
    res.json(updatedCategory);
  } catch (error) {
    console.error("Erro ao atualizar categoria financeira:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao atualizar categoria financeira" });
  }
});

// Excluir categoria financeira
router.delete("/:id", authenticateAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verifica se a categoria financeira existe
    const existingCategory = await storage.getFinancialCategory(id);
    if (!existingCategory) {
      return res.status(404).json({ message: "Categoria financeira não encontrada" });
    }
    
    // Exclui a categoria
    const deleted = await storage.deleteFinancialCategory(id);
    
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ message: "Erro ao excluir categoria financeira" });
    }
  } catch (error) {
    console.error("Erro ao excluir categoria financeira:", error);
    res.status(500).json({ message: "Erro ao excluir categoria financeira" });
  }
});

export default router;