import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setUserOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  updateUserGameCount(id: number): Promise<void>;
  getOnlineUsers(): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async setUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline,
        lastActive: new Date()
      })
      .where(eq(users.id, id));
  }

  async updateUserGameCount(id: number): Promise<void> {
    await db
      .update(users)
      .set({ 
        gamesPlayed: sql`${users.gamesPlayed} + 1`
      })
      .where(eq(users.id, id));
  }

  async getOnlineUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.isOnline, true));
  }
}

export const storage = new DatabaseStorage();