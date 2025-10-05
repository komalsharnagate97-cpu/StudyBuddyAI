import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertProductSchema, 
  insertPaymentSchema, 
  insertReferralSchema, 
  insertWithdrawalSchema, 
  insertNotificationSchema, 
  insertFAQSchema, 
  insertCampaignSchema, 
  insertAIConfigSchema, 
  insertTeamMemberSchema 
} from "@shared/schema";
import { z } from "zod";
import { 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken,
  generate2FASecret,
  generateQRCode,
  verify2FAToken,
  authMiddleware,
  adminMiddleware,
  roleMiddleware
} from "./auth";
import { setupSocketIO, broadcastNotification, broadcastMetricsUpdate } from "./socket";
import { verifyRazorpaySignature, verifyStripeSignature } from "./webhooks";
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many authentication attempts, please try again later' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = setupSocketIO(httpServer);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Authentication routes (with rate limiting)
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const { email, password, name, role } = req.body;
      
      if (!email || !password || !name) {
        res.status(400).json({ message: "Email, password, and name are required" });
        return;
      }
      
      const existingUsers = await storage.getUsers();
      const userExists = existingUsers.find(u => u.email === email);
      
      if (userExists) {
        res.status(400).json({ message: "User already exists with this email" });
        return;
      }
      
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role: role || 'user',
      });
      
      const accessToken = generateAccessToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
      const refreshToken = generateRefreshToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
      
      await storage.updateUser(user.id, { refreshToken });
      
      res.status(201).json({ 
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken,
        message: "Registration successful" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password, twoFactorToken } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }
      
      const users = await storage.getUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }
      
      const passwordValid = await comparePassword(password, user.password);
      if (!passwordValid) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }
      
      if (user.twoFactorEnabled) {
        if (!twoFactorToken) {
          res.status(200).json({ 
            requires2FA: true,
            userId: user.id 
          });
          return;
        }
        
        if (!user.twoFactorSecret) {
          res.status(500).json({ message: "2FA configuration error" });
          return;
        }
        
        const tokenValid = verify2FAToken(user.twoFactorSecret, twoFactorToken);
        if (!tokenValid) {
          res.status(401).json({ message: "Invalid 2FA token" });
          return;
        }
      }
      
      const accessToken = generateAccessToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
      const refreshToken = generateRefreshToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
      
      await storage.updateUser(user.id, { refreshToken });
      
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled 
        },
        accessToken,
        refreshToken,
        message: "Login successful" 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ message: "Refresh token required" });
        return;
      }
      
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }
      
      const users = await storage.getUsers();
      const user = users.find(u => u.id === decoded.id && u.refreshToken === refreshToken);
      
      if (!user) {
        res.status(401).json({ message: "Invalid refresh token" });
        return;
      }
      
      const newAccessToken = generateAccessToken({ 
        id: user.id, 
        email: user.email, 
        role: user.role 
      });
      
      res.json({ accessToken: newAccessToken });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh token" });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      await storage.updateUser(user.id, { refreshToken: null });
      res.json({ message: "Logout successful" });
    } catch (error) {
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  app.post("/api/auth/2fa/setup", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      const { secret, otpauth_url } = generate2FASecret(user.email);
      const qrCode = await generateQRCode(otpauth_url);
      
      await storage.updateUser(user.id, { twoFactorSecret: secret });
      
      res.json({ 
        secret, 
        qrCode,
        message: "2FA setup initiated. Scan QR code and verify to enable." 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  app.post("/api/auth/2fa/verify", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({ message: "2FA token required" });
        return;
      }
      
      const users = await storage.getUsers();
      const dbUser = users.find(u => u.id === user.id);
      
      if (!dbUser || !dbUser.twoFactorSecret) {
        res.status(400).json({ message: "2FA not setup" });
        return;
      }
      
      const tokenValid = verify2FAToken(dbUser.twoFactorSecret, token);
      if (!tokenValid) {
        res.status(401).json({ message: "Invalid 2FA token" });
        return;
      }
      
      await storage.updateUser(user.id, { twoFactorEnabled: true });
      
      res.json({ message: "2FA enabled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify 2FA" });
    }
  });

  app.post("/api/auth/2fa/disable", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      const { token } = req.body;
      
      if (!token) {
        res.status(400).json({ message: "2FA token required" });
        return;
      }
      
      const users = await storage.getUsers();
      const dbUser = users.find(u => u.id === user.id);
      
      if (!dbUser || !dbUser.twoFactorSecret) {
        res.status(400).json({ message: "2FA not enabled" });
        return;
      }
      
      const tokenValid = verify2FAToken(dbUser.twoFactorSecret, token);
      if (!tokenValid) {
        res.status(401).json({ message: "Invalid 2FA token" });
        return;
      }
      
      await storage.updateUser(user.id, { 
        twoFactorEnabled: false, 
        twoFactorSecret: null 
      });
      
      res.json({ message: "2FA disabled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/activity", async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // Users/Clients routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getUsers();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const client = await storage.createUser(userData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create client" });
      }
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userData = insertUserSchema.partial().parse(req.body);
      const client = await storage.updateUser(id, userData);
      if (!client) {
        res.status(404).json({ message: "Client not found" });
        return;
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update client" });
      }
    }
  });

  app.post("/api/clients/export", async (req, res) => {
    try {
      const csvData = await storage.exportClientsToCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=clients.csv');
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export clients" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update product" });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteProduct(id);
      if (!success) {
        res.status(404).json({ message: "Product not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Referrals routes
  app.get("/api/referrals/metrics", async (req, res) => {
    try {
      const metrics = await storage.getReferralMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referral metrics" });
    }
  });

  app.get("/api/withdrawals", async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  app.post("/api/withdrawals/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const withdrawal = await storage.approveWithdrawal(id);
      if (!withdrawal) {
        res.status(404).json({ message: "Withdrawal not found" });
        return;
      }
      res.json(withdrawal);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve withdrawal" });
    }
  });

  app.post("/api/withdrawals/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const withdrawal = await storage.rejectWithdrawal(id, reason);
      if (!withdrawal) {
        res.status(404).json({ message: "Withdrawal not found" });
        return;
      }
      res.json(withdrawal);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject withdrawal" });
    }
  });

  app.post("/api/withdrawals/:id/process", async (req, res) => {
    try {
      const { id } = req.params;
      const withdrawal = await storage.processWithdrawal(id);
      if (!withdrawal) {
        res.status(404).json({ message: "Withdrawal not found" });
        return;
      }
      res.json(withdrawal);
    } catch (error) {
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // FAQ routes
  app.get("/api/faq", async (req, res) => {
    try {
      const faqs = await storage.getFAQs();
      res.json(faqs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.get("/api/faq/categories", async (req, res) => {
    try {
      const categories = await storage.getFAQCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAQ categories" });
    }
  });

  app.post("/api/faq", async (req, res) => {
    try {
      const faqData = insertFAQSchema.parse(req.body);
      const faq = await storage.createFAQ(faqData);
      res.status(201).json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid FAQ data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create FAQ" });
      }
    }
  });

  app.put("/api/faq/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const faqData = insertFAQSchema.partial().parse(req.body);
      const faq = await storage.updateFAQ(id, faqData);
      if (!faq) {
        res.status(404).json({ message: "FAQ not found" });
        return;
      }
      res.json(faq);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid FAQ data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update FAQ" });
      }
    }
  });

  app.delete("/api/faq/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteFAQ(id);
      if (!success) {
        res.status(404).json({ message: "FAQ not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete FAQ" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/send", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.sendNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to send notification" });
      }
    }
  });

  app.post("/api/notifications/schedule", async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.scheduleNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to schedule notification" });
      }
    }
  });

  // Team routes
  app.get("/api/team/members", async (req, res) => {
    try {
      const members = await storage.getTeamMembers();
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  app.get("/api/team/stats", async (req, res) => {
    try {
      const stats = await storage.getTeamStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team stats" });
    }
  });

  app.post("/api/team/members", async (req, res) => {
    try {
      const memberData = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid member data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create team member" });
      }
    }
  });

  app.put("/api/team/members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const memberData = insertTeamMemberSchema.partial().parse(req.body);
      const member = await storage.updateTeamMember(id, memberData);
      if (!member) {
        res.status(404).json({ message: "Team member not found" });
        return;
      }
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid member data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update team member" });
      }
    }
  });

  // AI Config routes
  app.get("/api/ai-config", async (req, res) => {
    try {
      const configs = await storage.getAIConfigs();
      res.json(configs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI configs" });
    }
  });

  app.post("/api/ai-config", async (req, res) => {
    try {
      const configData = insertAIConfigSchema.parse(req.body);
      const config = await storage.createAIConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid AI config data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create AI config" });
      }
    }
  });

  app.put("/api/ai-config/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const configData = insertAIConfigSchema.partial().parse(req.body);
      const config = await storage.updateAIConfig(id, configData);
      if (!config) {
        res.status(404).json({ message: "AI config not found" });
        return;
      }
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid AI config data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update AI config" });
      }
    }
  });

  // Campaigns routes
  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create campaign" });
      }
    }
  });

  app.delete("/api/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCampaign(id);
      if (!success) {
        res.status(404).json({ message: "Campaign not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Payment Management routes
  app.get("/api/payments", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { status, userId, limit = '50' } = req.query;
      const payments = await storage.getPayments({ 
        status: status as string, 
        userId: userId as string,
        limit: parseInt(limit as string)
      });
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments/:id/confirm", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const user = (req as any).user;
      
      const payment = await storage.confirmPayment(id, user.id, notes);
      if (!payment) {
        res.status(404).json({ message: "Payment not found" });
        return;
      }
      
      await broadcastMetricsUpdate(io);
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  // Webhook endpoints
  app.post("/api/webhooks/razorpay", async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
      
      const isValid = verifyRazorpaySignature(
        JSON.stringify(req.body),
        signature,
        secret
      );

      if (!isValid) {
        res.status(400).json({ message: "Invalid webhook signature" });
        return;
      }

      const { event, payload } = req.body;
      
      if (event === 'payment.captured') {
        await storage.updatePaymentByTransactionId(payload.payment.entity.id, {
          status: 'completed',
          webhookSignatureValid: true
        });
        await broadcastMetricsUpdate(io);
      }

      res.json({ received: true });
    } catch (error) {
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
      
      const isValid = verifyStripeSignature(
        JSON.stringify(req.body),
        signature,
        secret
      );

      if (!isValid) {
        res.status(400).json({ message: "Invalid webhook signature" });
        return;
      }

      const { type, data } = req.body;
      
      if (type === 'payment_intent.succeeded') {
        await storage.updatePaymentByTransactionId(data.object.id, {
          status: 'completed',
          webhookSignatureValid: true
        });
        await broadcastMetricsUpdate(io);
      }

      res.json({ received: true });
    } catch (error) {
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Referral Tree API
  app.get("/api/referrals/tree/:userId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      const tree = await storage.getReferralTree(userId);
      res.json(tree);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referral tree" });
    }
  });

  // Export APIs
  app.post("/api/export/payments", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const csvData = await storage.exportPaymentsToCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=payments.csv');
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export payments" });
    }
  });

  app.post("/api/export/referrals", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const csvData = await storage.exportReferralsToCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=referrals.csv');
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export referrals" });
    }
  });

  app.post("/api/export/withdrawals", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const csvData = await storage.exportWithdrawalsToCSV();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=withdrawals.csv');
      res.send(csvData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export withdrawals" });
    }
  });

  // Analytics tracking
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const analyticsData = req.body;
      const record = await storage.trackAnalytics(analyticsData);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to track analytics" });
    }
  });

  app.get("/api/analytics/summary", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const summary = await storage.getAnalyticsSummary({
        startDate: startDate as string,
        endDate: endDate as string
      });
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics summary" });
    }
  });

  // Notification broadcast with Socket.IO
  app.post("/api/notifications/broadcast", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.sendNotification(notificationData);
      
      await broadcastNotification(io, notification);
      
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to broadcast notification" });
      }
    }
  });

  app.delete("/api/notifications/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteNotification(id);
      if (!success) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.post("/api/notifications/:id/resend", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.getNotificationById(id);
      
      if (!notification) {
        res.status(404).json({ message: "Notification not found" });
        return;
      }
      
      await broadcastNotification(io, notification);
      
      res.json({ message: "Notification resent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to resend notification" });
    }
  });

  return httpServer;
}
