import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for game players
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  gamesPlayed: integer("games_played").default(0),
  isOnline: boolean("is_online").default(false),
  lastActive: timestamp("last_active").defaultNow()
});

// Game state model 
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  player1Id: integer("player1_id").notNull(),
  player2Id: integer("player2_id").notNull(),
  player1Score: integer("player1_score").default(0),
  player2Score: integer("player2_score").default(0),
  currentRound: integer("current_round").default(1),
  winner: integer("winner"),
  createdAt: timestamp("created_at").defaultNow()
});

// Email signup model
export const emailSignups = pgTable("email_signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  displayName: true
});

export const insertEmailSignupSchema = createInsertSchema(emailSignups).pick({
  email: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Game = typeof games.$inferSelect;
export type EmailSignup = typeof emailSignups.$inferSelect;
