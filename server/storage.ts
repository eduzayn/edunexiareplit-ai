import { users, type User, type InsertUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsersByPortalType(portalType: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: session.SessionStore;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired entries every 24h
    });

    // Seed with default users for each portal type
    this.seedUsers();
  }

  private async seedUsers() {
    // Only seed if no users exist
    if (this.users.size === 0) {
      const defaultPassword = await this.hashPassword("password123");
      
      this.createUser({
        username: "student",
        password: defaultPassword,
        fullName: "Student User",
        email: "student@example.com",
        portalType: "student"
      });
      
      this.createUser({
        username: "partner",
        password: defaultPassword,
        fullName: "Partner User",
        email: "partner@example.com",
        portalType: "partner"
      });
      
      this.createUser({
        username: "polo",
        password: defaultPassword,
        fullName: "Polo Manager",
        email: "polo@example.com",
        portalType: "polo"
      });
      
      this.createUser({
        username: "admin",
        password: defaultPassword,
        fullName: "Admin User",
        email: "admin@example.com",
        portalType: "admin"
      });
    }
  }

  private async hashPassword(password: string): Promise<string> {
    // Simple hash for seeding - the real hashing happens in auth.ts
    return password;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUsersByPortalType(portalType: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.portalType === portalType,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
