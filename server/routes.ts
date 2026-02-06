import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import cors from "cors";
import { pool } from "./db";
import { storage } from "./storage";
import { loginSchema, insertServiceRequestSchema, insertPropertySchema, insertContractSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  const PgStore = pgSession(session);
  
  app.set('trust proxy', 1);
  
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  
  const isProduction = process.env.NODE_ENV === "production";
  app.use(
    session({
      store: new PgStore({
        pool: pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "abc-real-estate-secret-key",
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
      },
    })
  );

  // Token-based auth lookup for fallback when cookies don't work
  async function getUserIdFromToken(token: string): Promise<string | null> {
    try {
      const result = await pool.query(
        "SELECT sess FROM user_sessions WHERE sid = $1 AND expire > NOW()",
        [token]
      );
      if (result.rows.length > 0) {
        const sess = result.rows[0].sess;
        return typeof sess === 'string' ? JSON.parse(sess).userId : sess.userId;
      }
    } catch (e) {
      console.error("Token lookup error:", e);
    }
    return null;
  }

  function requireAuth(req: any, res: any, next: any) {
    // First check session cookie
    if (req.session.userId) {
      return next();
    }
    
    // Fallback: check X-Auth-Token header
    const token = req.headers["x-auth-token"];
    if (token) {
      getUserIdFromToken(token).then((userId) => {
        if (userId) {
          req.session.userId = userId;
          return next();
        }
        return res.status(401).json({ message: "Unauthorized" });
      }).catch(() => {
        return res.status(401).json({ message: "Unauthorized" });
      });
      return;
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  }

  async function requireRole(roles: string[]) {
    return async (req: any, res: any, next: any) => {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(req.session.userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      req.user = user;
      next();
    };
  }

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        // Return session ID as token for localStorage fallback
        res.json({ 
          user: { ...user, password: undefined },
          token: req.sessionID 
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    // Check X-Auth-Token header as fallback
    const token = req.headers["x-auth-token"] as string | undefined;
    
    let userId: string | undefined = req.session.userId;
    
    if (!userId && token) {
      const tokenUserId = await getUserIdFromToken(token);
      if (tokenUserId) {
        userId = tokenUserId;
        req.session.userId = userId;
      }
    }
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    res.json({ 
      user: { ...user, password: undefined },
      token: req.sessionID
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  // Customer routes
  app.get("/api/customer/contracts", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const contracts = await storage.getContractsByCustomerId(user.id);
    res.json(contracts);
  });

  app.get("/api/customer/bills", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const bills = await storage.getBillsByCustomerId(user.id);
    res.json(bills);
  });

  app.get("/api/customer/documents", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const documents = await storage.getDocumentsByCustomerId(user.id);
    res.json(documents);
  });

  app.get("/api/customer/notifications", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const notifications = await storage.getNotificationsByUserId(user.id);
    res.json(notifications);
  });

  app.patch("/api/customer/notifications/:id/read", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.markNotificationRead(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/customer/notifications/mark-all-read", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.markAllNotificationsRead(user.id);
    res.json({ success: true });
  });

  app.get("/api/customer/service-requests", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const requests = await storage.getServiceRequestsByCustomerId(user.id);
    res.json(requests);
  });

  app.post("/api/customer/service-requests", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "customer") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const data = {
        ...req.body,
        customerId: user.id,
        status: "new",
      };

      const request = await storage.createServiceRequest(data);
      res.json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/customer/rm", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "customer") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const contractId = req.query.contractId as string;
    if (contractId) {
      const rm = await storage.getRMForContract(contractId);
      if (rm) {
        return res.json({ ...rm, password: undefined });
      }
    }
    
    if (user.assignedRmId) {
      const rm = await storage.getUser(user.assignedRmId);
      if (rm) {
        return res.json({ ...rm, password: undefined });
      }
    }
    
    res.json(null);
  });

  // RM routes
  app.get("/api/rm/stats", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "rm") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const stats = await storage.getRMStats(user.id);
    res.json(stats);
  });

  app.get("/api/rm/customers", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "rm") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const customers = await storage.getCustomersByRmId(user.id);
    res.json(customers.map((c) => ({ ...c, password: undefined })));
  });

  app.get("/api/rm/service-requests", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "rm") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const requests = await storage.getServiceRequestsByRmId(user.id);
    res.json(requests);
  });

  app.patch("/api/rm/service-requests/:id", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "rm") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const { status, rmNote } = req.body;
    await storage.updateServiceRequest(req.params.id, status, rmNote);
    res.json({ success: true });
  });

  // Admin routes
  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  app.get("/api/admin/users", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const users = await storage.getAllUsers();
    res.json(users.map((u) => ({ ...u, password: undefined })));
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const newUser = await storage.createUser(req.body);
      res.json({ ...newUser, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { password, ...updateData } = req.body;
      const validatedData = insertUserSchema.partial().parse(updateData);
      const updates = password ? { ...validatedData, password } : validatedData;
      const updated = await storage.updateUser(req.params.id, updates);
      res.json({ ...updated, password: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/bulk", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { users: usersData } = req.body;
      if (!Array.isArray(usersData)) {
        return res.status(400).json({ message: "Invalid data format" });
      }
      const errors: { row: number; error: string }[] = [];
      const validatedData = usersData.map((userData, index) => {
        try {
          return insertUserSchema.parse(userData);
        } catch (err) {
          if (err instanceof z.ZodError) {
            errors.push({ row: index + 1, error: err.errors[0].message });
          }
          return null;
        }
      }).filter(Boolean);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors });
      }
      const created = await storage.bulkCreateUsers(validatedData as any);
      res.json({ created: created.length, users: created.map(u => ({ ...u, password: undefined })) });
    } catch (error) {
      console.error("Bulk create users error:", error);
      res.status(500).json({ message: "Failed to bulk create users" });
    }
  });

  app.get("/api/admin/properties", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const properties = await storage.getAllProperties();
    res.json(properties);
  });

  app.post("/api/admin/properties", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const validatedData = insertPropertySchema.parse(req.body);
      const newProperty = await storage.createProperty(validatedData);
      res.json(newProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create property error:", error);
      res.status(500).json({ message: "Failed to create property" });
    }
  });

  app.put("/api/admin/properties/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const validatedData = insertPropertySchema.partial().parse(req.body);
      const updated = await storage.updateProperty(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Update property error:", error);
      res.status(500).json({ message: "Failed to update property" });
    }
  });

  app.delete("/api/admin/properties/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteProperty(req.params.id);
      res.json({ message: "Property deleted" });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ message: "Failed to delete property" });
    }
  });

  app.post("/api/admin/properties/bulk", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { properties: propertiesData } = req.body;
      if (!Array.isArray(propertiesData)) {
        return res.status(400).json({ message: "Invalid data format" });
      }
      const errors: { row: number; error: string }[] = [];
      const validatedData = propertiesData.map((propData, index) => {
        try {
          return insertPropertySchema.parse(propData);
        } catch (err) {
          if (err instanceof z.ZodError) {
            errors.push({ row: index + 1, error: err.errors[0].message });
          }
          return null;
        }
      }).filter(Boolean);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors });
      }
      const created = await storage.bulkCreateProperties(validatedData as any);
      res.json({ created: created.length, properties: created });
    } catch (error) {
      console.error("Bulk create properties error:", error);
      res.status(500).json({ message: "Failed to bulk create properties" });
    }
  });

  app.get("/api/admin/contracts", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const contracts = await storage.getAllContractsWithDetails();
    res.json(contracts);
  });

  app.post("/api/admin/contracts", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Parse dates if they're strings
      const body = { ...req.body };
      if (typeof body.startDate === 'string') {
        body.startDate = new Date(body.startDate);
      }
      if (typeof body.endDate === 'string') {
        body.endDate = new Date(body.endDate);
      }
      if (body.renewalDate && typeof body.renewalDate === 'string') {
        body.renewalDate = new Date(body.renewalDate);
      }
      
      const validatedData = insertContractSchema.parse(body);
      const newContract = await storage.createContract(validatedData);
      res.json(newContract);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create contract error:", error);
      res.status(500).json({ message: "Failed to create contract" });
    }
  });

  app.put("/api/admin/contracts/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Parse dates if they're strings
      const body = { ...req.body };
      if (typeof body.startDate === 'string') {
        body.startDate = new Date(body.startDate);
      }
      if (typeof body.endDate === 'string') {
        body.endDate = new Date(body.endDate);
      }
      if (body.renewalDate && typeof body.renewalDate === 'string') {
        body.renewalDate = new Date(body.renewalDate);
      }
      
      const validatedData = insertContractSchema.partial().parse(body);
      const updated = await storage.updateContract(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Update contract error:", error);
      res.status(500).json({ message: "Failed to update contract" });
    }
  });

  app.delete("/api/admin/contracts/:id", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteContract(req.params.id);
      res.json({ message: "Contract deleted" });
    } catch (error) {
      console.error("Delete contract error:", error);
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });

  app.post("/api/admin/contracts/bulk", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { contracts: contractsData } = req.body;
      if (!Array.isArray(contractsData)) {
        return res.status(400).json({ message: "Invalid data format" });
      }
      const errors: { row: number; error: string }[] = [];
      const validatedData = contractsData.map((contractData, index) => {
        try {
          const body = { ...contractData };
          if (typeof body.startDate === 'string') body.startDate = new Date(body.startDate);
          if (typeof body.endDate === 'string') body.endDate = new Date(body.endDate);
          if (body.renewalDate && typeof body.renewalDate === 'string') body.renewalDate = new Date(body.renewalDate);
          return insertContractSchema.parse(body);
        } catch (err) {
          if (err instanceof z.ZodError) {
            errors.push({ row: index + 1, error: err.errors[0].message });
          }
          return null;
        }
      }).filter(Boolean);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors });
      }

      const allUsers = await storage.getAllUsers();
      const allProperties = await storage.getAllProperties();
      const userIds = new Set(allUsers.map(u => u.id));
      const propertyIds = new Set(allProperties.map(p => p.id));

      for (let i = 0; i < validatedData.length; i++) {
        const c = validatedData[i] as any;
        if (!userIds.has(c.customerId)) {
          errors.push({ row: i + 1, error: `Customer ID "${c.customerId}" does not exist` });
        }
        if (!propertyIds.has(c.propertyId)) {
          errors.push({ row: i + 1, error: `Property ID "${c.propertyId}" does not exist` });
        }
        if (c.rmId && !userIds.has(c.rmId)) {
          errors.push({ row: i + 1, error: `RM ID "${c.rmId}" does not exist` });
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: "Validation errors", errors });
      }

      const created = await storage.bulkCreateContracts(validatedData as any);
      res.json({ created: created.length, contracts: created });
    } catch (error) {
      console.error("Bulk create contracts error:", error);
      res.status(500).json({ message: "Failed to bulk create contracts" });
    }
  });

  app.get("/api/admin/service-requests", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const requests = await storage.getAllServiceRequests();
    res.json(requests);
  });

  return httpServer;
}
