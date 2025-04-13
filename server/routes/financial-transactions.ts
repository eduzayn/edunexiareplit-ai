import { Router } from "express";
import { storage } from "../storage";
import { insertFinancialTransactionSchema } from "@shared/schema";

const router = Router();

// Listar transações financeiras com filtros opcionais
router.get("/", async (req, res) => {
  try {
    const { 
      type, 
      category, 
      search, 
      startDate, 
      endDate, 
      institutionId, 
      limit, 
      offset 
    } = req.query;
    
    const transactions = await storage.getFinancialTransactions(
      type as string,
      category as string,
      search as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      institutionId ? parseInt(institutionId as string) : undefined,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );
    
    res.json(transactions);
  } catch (error) {
    console.error("Erro ao listar transações financeiras:", error);
    res.status(500).json({ message: "Erro ao listar transações financeiras" });
  }
});

// Obter transação financeira por ID
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const transaction = await storage.getFinancialTransaction(id);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transação financeira não encontrada" });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error("Erro ao obter transação financeira:", error);
    res.status(500).json({ message: "Erro ao obter transação financeira" });
  }
});

// Criar transação financeira
router.post("/", async (req, res) => {
  try {
    const transactionData = insertFinancialTransactionSchema.parse(req.body);
    
    // Cria a nova transação
    const newTransaction = await storage.createFinancialTransaction({
      ...transactionData,
      date: new Date(transactionData.date), // Garante que é uma data válida
      createdById: req.user?.id
    });
    
    res.status(201).json(newTransaction);
  } catch (error) {
    console.error("Erro ao criar transação financeira:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao criar transação financeira" });
  }
});

// Atualizar transação financeira
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verifica se a transação financeira existe
    const existingTransaction = await storage.getFinancialTransaction(id);
    if (!existingTransaction) {
      return res.status(404).json({ message: "Transação financeira não encontrada" });
    }
    
    // Processa a data se for fornecida
    const updateData = { ...req.body };
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    
    // Atualiza a transação
    const updatedTransaction = await storage.updateFinancialTransaction(id, updateData);
    
    res.json(updatedTransaction);
  } catch (error) {
    console.error("Erro ao atualizar transação financeira:", error);
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
    }
    res.status(500).json({ message: "Erro ao atualizar transação financeira" });
  }
});

// Excluir transação financeira
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Verifica se a transação financeira existe
    const existingTransaction = await storage.getFinancialTransaction(id);
    if (!existingTransaction) {
      return res.status(404).json({ message: "Transação financeira não encontrada" });
    }
    
    // Exclui a transação
    const deleted = await storage.deleteFinancialTransaction(id);
    
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(500).json({ message: "Erro ao excluir transação financeira" });
    }
  } catch (error) {
    console.error("Erro ao excluir transação financeira:", error);
    res.status(500).json({ message: "Erro ao excluir transação financeira" });
  }
});

export default router;