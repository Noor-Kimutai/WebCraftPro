import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";

export function registerRoutes(app: Express): Server {
  // User creation/update endpoint
  app.post("/api/users", async (req, res) => {
    try {
      const parsed = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(parsed.email);

      if (existingUser) {
        // Update existing user's online status
        await storage.setUserOnlineStatus(existingUser.id, true);
        res.json(existingUser);
      } else {
        // Create new user
        const newUser = await storage.createUser(parsed);
        res.json(newUser);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User status update endpoint
  app.post("/api/users/status", async (req, res) => {
    try {
      const { email, isOnline } = req.body;
      const user = await storage.getUserByUsername(email);

      if (user) {
        await storage.setUserOnlineStatus(user.id, isOnline);
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}