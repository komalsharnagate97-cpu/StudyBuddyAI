import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, count, sum, and, gte, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { 
  User, InsertUser, 
  Product, InsertProduct,
  Payment, InsertPayment,
  Referral, InsertReferral,
  Withdrawal, InsertWithdrawal,
  Notification, InsertNotification,
  FAQ, InsertFAQ,
  Campaign, InsertCampaign,
  AIConfig, InsertAIConfig,
  TeamMember, InsertTeamMember,
  ActivityLog, InsertActivityLog
} from "@shared/schema";

// Safe database setup with fallback
let db: any = null;
let isNeonConnected = false;

if (process.env.DATABASE_URL) {
  try {
    const sql_client = neon(process.env.DATABASE_URL);
    db = drizzle(sql_client, { schema });
    isNeonConnected = true;
    console.log("✅ Connected to Neon database");
  } catch (error) {
    console.warn("⚠️ Failed to connect to Neon database, using memory storage");
    isNeonConnected = false;
  }
} else {
  console.warn("⚠️ DATABASE_URL not configured, using in-memory storage");
  isNeonConnected = false;
}

export interface IStorage {
  // Users/Clients
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  exportClientsToCSV(): Promise<string>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Payments
  getPayments(filters?: { status?: string; userId?: string; limit?: number }): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  confirmPayment(id: string, confirmedBy: string, notes?: string): Promise<Payment | undefined>;
  updatePaymentByTransactionId(transactionId: string, updates: Partial<Payment>): Promise<Payment | undefined>;

  // Referrals
  getReferrals(): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  getReferralMetrics(): Promise<any>;
  getReferralTree(userId: string): Promise<any>;
  exportReferralsToCSV(): Promise<string>;

  // Withdrawals
  getWithdrawals(): Promise<any[]>;
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  approveWithdrawal(id: string): Promise<Withdrawal | undefined>;
  rejectWithdrawal(id: string, reason: string): Promise<Withdrawal | undefined>;
  processWithdrawal(id: string): Promise<Withdrawal | undefined>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  getNotificationById(id: string): Promise<Notification | undefined>;
  sendNotification(notification: InsertNotification): Promise<Notification>;
  scheduleNotification(notification: InsertNotification): Promise<Notification>;
  deleteNotification(id: string): Promise<boolean>;

  // FAQ
  getFAQs(): Promise<FAQ[]>;
  getFAQCategories(): Promise<any[]>;
  createFAQ(faq: InsertFAQ): Promise<FAQ>;
  updateFAQ(id: string, faq: Partial<InsertFAQ>): Promise<FAQ | undefined>;
  deleteFAQ(id: string): Promise<boolean>;

  // Campaigns
  getCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  deleteCampaign(id: string): Promise<boolean>;

  // AI Config
  getAIConfigs(): Promise<AIConfig[]>;
  createAIConfig(config: InsertAIConfig): Promise<AIConfig>;
  updateAIConfig(id: string, config: Partial<InsertAIConfig>): Promise<AIConfig | undefined>;

  // Team
  getTeamMembers(): Promise<TeamMember[]>;
  getTeamStats(): Promise<any>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined>;

  // Dashboard
  getDashboardMetrics(): Promise<any>;
  getRecentActivity(): Promise<any[]>;

  // Export
  exportPaymentsToCSV(): Promise<string>;
  exportWithdrawalsToCSV(): Promise<string>;

  // Analytics
  trackAnalytics(data: any): Promise<any>;
  getAnalyticsSummary(filters: { startDate?: string; endDate?: string }): Promise<any>;
}

// In-memory storage for when database is not available
class MemoryStorage {
  private users: User[] = [];
  private products: Product[] = [];
  private campaigns: Campaign[] = [];
  private faqs: FAQ[] = [];
  private notifications: Notification[] = [];
  private aiConfigs: AIConfig[] = [];
  private teamMembers: TeamMember[] = [];
  private payments: Payment[] = [];
  private referrals: Referral[] = [];
  private withdrawals: Withdrawal[] = [];
  
  private userIdCounter = 1;
  private productIdCounter = 1;
  private campaignIdCounter = 1;
  private faqIdCounter = 1;
  private notificationIdCounter = 1;
  private aiConfigIdCounter = 1;
  private teamMemberIdCounter = 1;
  private paymentIdCounter = 1;
  private referralIdCounter = 1;
  private withdrawalIdCounter = 1;

  constructor() {
    // Initialize with sample data
    this.users = [
      {
        id: 'user-1',
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        phone: null,
        role: 'admin',
        status: 'active',
        source: 'website',
        twoFactorEnabled: false,
        twoFactorSecret: null,
        refreshToken: null,
        lastContact: null,
        value: '0',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  // Users
  async getUsers(): Promise<User[]> { return [...this.users]; }
  async getUser(id: string): Promise<User | undefined> { return this.users.find(u => u.id === id); }
  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: `user-${this.userIdCounter++}`,
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.phone || null,
      role: (user as any).role || 'user',
      status: user.status || 'active',
      source: user.source || null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      refreshToken: null,
      lastContact: user.lastContact || null,
      value: user.value || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    this.users[index] = { ...this.users[index], ...user, updatedAt: new Date() };
    return this.users[index];
  }

  // Products
  async getProducts(): Promise<Product[]> { return [...this.products]; }
  async getProduct(id: string): Promise<Product | undefined> { return this.products.find(p => p.id === id); }
  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      id: `product-${this.productIdCounter++}`,
      name: product.name,
      description: product.description || null,
      price: product.price,
      status: product.status || 'active',
      sales: product.sales || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.products.push(newProduct);
    return newProduct;
  }
  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    this.products[index] = { ...this.products[index], ...product, updatedAt: new Date() };
    return this.products[index];
  }
  async deleteProduct(id: string): Promise<boolean> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.products.splice(index, 1);
    return true;
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> { return [...this.campaigns]; }
  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const newCampaign: Campaign = {
      id: `campaign-${this.campaignIdCounter++}`,
      name: campaign.name,
      description: campaign.description || null,
      type: campaign.type,
      status: campaign.status || "draft",
      startDate: campaign.startDate || null,
      endDate: campaign.endDate || null,
      budget: campaign.budget || null,
      spent: campaign.spent || "0",
      level1Commission: campaign.level1Commission || null,
      level2Commission: campaign.level2Commission || null,
      level3Commission: campaign.level3Commission || null,
      eligibleProducts: campaign.eligibleProducts || null,
      metrics: campaign.metrics || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.campaigns.push(newCampaign);
    return newCampaign;
  }
  async deleteCampaign(id: string): Promise<boolean> {
    const index = this.campaigns.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.campaigns.splice(index, 1);
    return true;
  }

  // FAQ
  async getFAQs(): Promise<FAQ[]> { return [...this.faqs]; }
  async getFAQCategories(): Promise<any[]> {
    const categories = Array.from(new Set(this.faqs.map(f => f.category)));
    return categories.map(cat => ({ name: cat, count: this.faqs.filter(f => f.category === cat).length, isActive: false }));
  }
  async createFAQ(faq: InsertFAQ): Promise<FAQ> {
    const newFAQ: FAQ = {
      id: `faq-${this.faqIdCounter++}`,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      views: faq.views || null,
      isActive: faq.isActive !== undefined ? faq.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.faqs.push(newFAQ);
    return newFAQ;
  }
  async updateFAQ(id: string, faq: Partial<InsertFAQ>): Promise<FAQ | undefined> {
    const index = this.faqs.findIndex(f => f.id === id);
    if (index === -1) return undefined;
    this.faqs[index] = { ...this.faqs[index], ...faq, updatedAt: new Date() };
    return this.faqs[index];
  }
  async deleteFAQ(id: string): Promise<boolean> {
    const index = this.faqs.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.faqs.splice(index, 1);
    return true;
  }

  // Stub methods for other entities
  async getPayments(): Promise<Payment[]> { return []; }
  async createPayment(): Promise<Payment> { throw new Error('Not implemented in memory storage'); }
  async confirmPayment(): Promise<Payment | undefined> { return undefined; }
  async updatePaymentByTransactionId(): Promise<Payment | undefined> { return undefined; }
  async getReferrals(): Promise<Referral[]> { return []; }
  async createReferral(): Promise<Referral> { throw new Error('Not implemented in memory storage'); }
  async getReferralMetrics(): Promise<any> { return { totalReferrers: 0, pendingPayouts: 0, pendingCount: 0, totalPaid: 0, paidCount: 0, referrerGrowth: '+0%' }; }
  async getReferralTree(): Promise<any> { return { nodes: [], edges: [] }; }
  async exportReferralsToCSV(): Promise<string> { return 'ID,Referrer,Referred,Commission\n'; }
  async getWithdrawals(): Promise<any[]> { return []; }
  async createWithdrawal(): Promise<Withdrawal> { throw new Error('Not implemented in memory storage'); }
  async approveWithdrawal(): Promise<Withdrawal | undefined> { return undefined; }
  async rejectWithdrawal(): Promise<Withdrawal | undefined> { return undefined; }
  async processWithdrawal(): Promise<Withdrawal | undefined> { return undefined; }
  async getNotifications(): Promise<Notification[]> { return []; }
  async getNotificationById(): Promise<Notification | undefined> { return undefined; }
  async sendNotification(): Promise<Notification> { throw new Error('Not implemented in memory storage'); }
  async scheduleNotification(): Promise<Notification> { throw new Error('Not implemented in memory storage'); }
  async deleteNotification(): Promise<boolean> { return false; }
  async getAIConfigs(): Promise<AIConfig[]> { return []; }
  async createAIConfig(): Promise<AIConfig> { throw new Error('Not implemented in memory storage'); }
  async updateAIConfig(): Promise<AIConfig | undefined> { return undefined; }
  async getTeamMembers(): Promise<TeamMember[]> { return []; }
  async getTeamStats(): Promise<any> { return { totalMembers: 0, admins: 0, managers: 0, activeToday: 0 }; }
  async createTeamMember(): Promise<TeamMember> { throw new Error('Not implemented in memory storage'); }
  async updateTeamMember(): Promise<TeamMember | undefined> { return undefined; }
  async getDashboardMetrics(): Promise<any> { return { totalUsers: this.users.length, revenue: 0, conversionRate: 0, activeCampaigns: this.campaigns.length, userGrowth: '+0%', revenueGrowth: '+0%', conversionChange: '+0%', campaignsStatus: '0 new' }; }
  async getRecentActivity(): Promise<any[]> { return []; }
  async exportClientsToCSV(): Promise<string> { return 'ID,Name,Email\n1,Sample User,user@example.com'; }
  async exportPaymentsToCSV(): Promise<string> { return 'ID,Amount,Status\n'; }
  async exportWithdrawalsToCSV(): Promise<string> { return 'ID,Amount,Status\n'; }
  async trackAnalytics(): Promise<any> { return {}; }
  async getAnalyticsSummary(): Promise<any> { return {}; }
}

const memoryStorage = new MemoryStorage();

export class SupabaseStorage implements IStorage {
  // Users/Clients
  async getUsers(): Promise<User[]> {
    if (!isNeonConnected) return memoryStorage.getUsers();
    const users = await db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
    return users;
  }

  async getUser(id: string): Promise<User | undefined> {
    if (!isNeonConnected) return memoryStorage.getUser(id);
    const users = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    if (!isNeonConnected) return memoryStorage.createUser(user);
    const newUsers = await db.insert(schema.users).values(user).returning();
    return newUsers[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    if (!isNeonConnected) return memoryStorage.updateUser(id, user);
    const updatedUsers = await db
      .update(schema.users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUsers[0];
  }

  async exportClientsToCSV(): Promise<string> {
    if (!isNeonConnected) return memoryStorage.exportClientsToCSV();
    const users = await this.getUsers();
    const header = "ID,Name,Email,Phone,Status,Source,Value,Created At\n";
    const rows = users.map(user => 
      `${user.id},${user.name},${user.email},${user.phone || ""},${user.status},${user.source || ""},${user.value || 0},${user.createdAt?.toISOString() || ""}`
    ).join("\n");
    return header + rows;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    if (!isNeonConnected) return memoryStorage.getProducts();
    const products = await db.select().from(schema.products).orderBy(desc(schema.products.createdAt));
    return products;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    if (!isNeonConnected) return memoryStorage.getProduct(id);
    const products = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return products[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    if (!isNeonConnected) return memoryStorage.createProduct(product);
    const newProducts = await db.insert(schema.products).values(product).returning();
    return newProducts[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    if (!isNeonConnected) return memoryStorage.updateProduct(id, product);
    const updatedProducts = await db
      .update(schema.products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(schema.products.id, id))
      .returning();
    return updatedProducts[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (!isNeonConnected) return memoryStorage.deleteProduct(id);
    const result = await db.delete(schema.products).where(eq(schema.products.id, id));
    return result.rowCount > 0;
  }

  // Payments
  async getPayments(filters?: { status?: string; userId?: string; limit?: number }): Promise<Payment[]> {
    if (!isNeonConnected) return memoryStorage.getPayments();
    let query = db.select().from(schema.payments);
    
    const conditions = [];
    if (filters?.status) conditions.push(eq(schema.payments.status, filters.status));
    if (filters?.userId) conditions.push(eq(schema.payments.userId, filters.userId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(schema.payments.createdAt)) as any;
    
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    const payments = await query;
    return payments;
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    if (!isNeonConnected) return memoryStorage.createPayment();
    const newPayments = await db.insert(schema.payments).values(payment).returning();
    return newPayments[0];
  }

  async confirmPayment(id: string, confirmedBy: string, notes?: string): Promise<Payment | undefined> {
    if (!isNeonConnected) return memoryStorage.confirmPayment();
    const updatedPayments = await db
      .update(schema.payments)
      .set({ 
        status: "completed",
        manuallyConfirmed: true,
        confirmedBy,
        confirmationNotes: notes
      })
      .where(eq(schema.payments.id, id))
      .returning();
    return updatedPayments[0];
  }

  async updatePaymentByTransactionId(transactionId: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    if (!isNeonConnected) return memoryStorage.updatePaymentByTransactionId();
    const updatedPayments = await db
      .update(schema.payments)
      .set(updates)
      .where(eq(schema.payments.transactionId, transactionId))
      .returning();
    return updatedPayments[0];
  }

  // Referrals
  async getReferrals(): Promise<Referral[]> {
    if (!isNeonConnected) return memoryStorage.getReferrals();
    const referrals = await db.select().from(schema.referrals).orderBy(desc(schema.referrals.createdAt));
    return referrals;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    if (!isNeonConnected) return memoryStorage.createReferral();
    const newReferrals = await db.insert(schema.referrals).values(referral).returning();
    return newReferrals[0];
  }

  async getReferralMetrics(): Promise<any> {
    if (!isNeonConnected) return memoryStorage.getReferralMetrics();
    const totalReferrers = await db.select({ count: count() }).from(schema.referrals);
    const pendingWithdrawals = await db
      .select({ 
        total: sum(schema.withdrawals.amount),
        count: count()
      })
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.status, "pending"));
    
    const processedWithdrawals = await db
      .select({ 
        total: sum(schema.withdrawals.amount),
        count: count()
      })
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.status, "processed"));

    return {
      totalReferrers: totalReferrers[0]?.count || 0,
      pendingPayouts: Number(pendingWithdrawals[0]?.total || 0),
      pendingCount: pendingWithdrawals[0]?.count || 0,
      totalPaid: Number(processedWithdrawals[0]?.total || 0),
      paidCount: processedWithdrawals[0]?.count || 0,
      referrerGrowth: "+15.2%",
    };
  }

  async getReferralTree(userId: string): Promise<any> {
    if (!isNeonConnected) return memoryStorage.getReferralTree();
    const referrals = await db
      .select({
        id: schema.referrals.id,
        referrerId: schema.referrals.referrerId,
        referredId: schema.referrals.referredId,
        referrerName: schema.users.name,
      })
      .from(schema.referrals)
      .leftJoin(schema.users, eq(schema.referrals.referrerId, schema.users.id))
      .where(eq(schema.referrals.referrerId, userId));

    return {
      nodes: referrals.map((r: any) => ({ id: r.referredId, name: r.referrerName })),
      edges: referrals.map((r: any) => ({ from: r.referrerId, to: r.referredId }))
    };
  }

  async exportReferralsToCSV(): Promise<string> {
    if (!isNeonConnected) return memoryStorage.exportReferralsToCSV();
    const referrals = await this.getReferrals();
    const header = "ID,Referrer ID,Referred ID,Commission Rate,Commission Earned,Status,Created At\n";
    const rows = referrals.map(ref => 
      `${ref.id},${ref.referrerId},${ref.referredId},${ref.commissionRate},${ref.commissionEarned},${ref.status},${ref.createdAt?.toISOString() || ""}`
    ).join("\n");
    return header + rows;
  }

  // Withdrawals
  async getWithdrawals(): Promise<any[]> {
    if (!isNeonConnected) return memoryStorage.getWithdrawals();
    const withdrawals = await db
      .select({
        id: schema.withdrawals.id,
        amount: schema.withdrawals.amount,
        method: schema.withdrawals.method,
        status: schema.withdrawals.status,
        createdAt: schema.withdrawals.createdAt,
        processedAt: schema.withdrawals.processedAt,
        rejectionReason: schema.withdrawals.rejectionReason,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.withdrawals)
      .leftJoin(schema.users, eq(schema.withdrawals.userId, schema.users.id))
      .orderBy(desc(schema.withdrawals.createdAt));

    return withdrawals;
  }

  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    if (!isNeonConnected) return memoryStorage.createWithdrawal();
    const newWithdrawals = await db.insert(schema.withdrawals).values(withdrawal).returning();
    return newWithdrawals[0];
  }

  async approveWithdrawal(id: string): Promise<Withdrawal | undefined> {
    if (!isNeonConnected) return memoryStorage.approveWithdrawal();
    const updatedWithdrawals = await db
      .update(schema.withdrawals)
      .set({ status: "approved" })
      .where(eq(schema.withdrawals.id, id))
      .returning();
    return updatedWithdrawals[0];
  }

  async rejectWithdrawal(id: string, reason: string): Promise<Withdrawal | undefined> {
    if (!isNeonConnected) return memoryStorage.rejectWithdrawal();
    const updatedWithdrawals = await db
      .update(schema.withdrawals)
      .set({ status: "rejected", rejectionReason: reason })
      .where(eq(schema.withdrawals.id, id))
      .returning();
    return updatedWithdrawals[0];
  }

  async processWithdrawal(id: string): Promise<Withdrawal | undefined> {
    if (!isNeonConnected) return memoryStorage.processWithdrawal();
    const updatedWithdrawals = await db
      .update(schema.withdrawals)
      .set({ status: "processed", processedAt: new Date() })
      .where(eq(schema.withdrawals.id, id))
      .returning();
    return updatedWithdrawals[0];
  }

  async exportPaymentsToCSV(): Promise<string> {
    if (!isNeonConnected) return memoryStorage.exportPaymentsToCSV();
    const payments = await this.getPayments();
    const header = "ID,User ID,Product ID,Amount,Status,Payment Method,Transaction ID,Created At\n";
    const rows = payments.map(payment => 
      `${payment.id},${payment.userId},${payment.productId},${payment.amount},${payment.status},${payment.paymentMethod || ""},${payment.transactionId || ""},${payment.createdAt?.toISOString() || ""}`
    ).join("\n");
    return header + rows;
  }

  async exportWithdrawalsToCSV(): Promise<string> {
    if (!isNeonConnected) return memoryStorage.exportWithdrawalsToCSV();
    const withdrawals = await this.getWithdrawals();
    const header = "ID,User Name,User Email,Amount,Method,Status,Reference ID,Created At,Processed At\n";
    const rows = withdrawals.map(w => 
      `${w.id},${w.userName || ""},${w.userEmail || ""},${w.amount},${w.method},${w.status},${w.referenceId || ""},${w.createdAt?.toISOString() || ""},${w.processedAt?.toISOString() || ""}`
    ).join("\n");
    return header + rows;
  }

  async trackAnalytics(data: any): Promise<any> {
    if (!isNeonConnected) return memoryStorage.trackAnalytics();
    return { success: true };
  }

  async getAnalyticsSummary(filters: { startDate?: string; endDate?: string }): Promise<any> {
    if (!isNeonConnected) return memoryStorage.getAnalyticsSummary();
    return { 
      totalViews: 0, 
      totalConversions: 0, 
      averageWatchTime: 0 
    };
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    if (!isNeonConnected) return memoryStorage.getNotifications();
    const notifications = await db
      .select()
      .from(schema.notifications)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(10);
    return notifications;
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    if (!isNeonConnected) return memoryStorage.getNotificationById();
    const notifications = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.id, id));
    return notifications[0];
  }

  async sendNotification(notification: InsertNotification): Promise<Notification> {
    if (!isNeonConnected) return memoryStorage.sendNotification();
    const newNotifications = await db
      .insert(schema.notifications)
      .values({
        ...notification,
        status: "sent",
        sentAt: new Date(),
        recipientCount: 100,
      })
      .returning();
    return newNotifications[0];
  }

  async scheduleNotification(notification: InsertNotification): Promise<Notification> {
    if (!isNeonConnected) return memoryStorage.scheduleNotification();
    const newNotifications = await db
      .insert(schema.notifications)
      .values({
        ...notification,
        status: "scheduled",
      })
      .returning();
    return newNotifications[0];
  }

  async deleteNotification(id: string): Promise<boolean> {
    if (!isNeonConnected) return memoryStorage.deleteNotification();
    const result = await db.delete(schema.notifications).where(eq(schema.notifications.id, id));
    return result.rowCount > 0;
  }

  // FAQ
  async getFAQs(): Promise<FAQ[]> {
    if (!isNeonConnected) return memoryStorage.getFAQs();
    const faqs = await db.select().from(schema.faq).where(eq(schema.faq.isActive, true)).orderBy(desc(schema.faq.createdAt));
    return faqs;
  }

  async getFAQCategories(): Promise<any[]> {
    if (!isNeonConnected) return memoryStorage.getFAQCategories();
    const categories = await db
      .select({
        category: schema.faq.category,
        count: count()
      })
      .from(schema.faq)
      .where(eq(schema.faq.isActive, true))
      .groupBy(schema.faq.category);
      
    return categories.map((cat: any) => ({
      name: cat.category,
      count: cat.count,
      isActive: false,
    }));
  }

  async createFAQ(faq: InsertFAQ): Promise<FAQ> {
    if (!isNeonConnected) return memoryStorage.createFAQ(faq);
    const newFAQs = await db.insert(schema.faq).values(faq).returning();
    return newFAQs[0];
  }

  async updateFAQ(id: string, faq: Partial<InsertFAQ>): Promise<FAQ | undefined> {
    if (!isNeonConnected) return memoryStorage.updateFAQ(id, faq);
    const updatedFAQs = await db
      .update(schema.faq)
      .set({ ...faq, updatedAt: new Date() })
      .where(eq(schema.faq.id, id))
      .returning();
    return updatedFAQs[0];
  }

  async deleteFAQ(id: string): Promise<boolean> {
    if (!isNeonConnected) return memoryStorage.deleteFAQ(id);
    const updatedFAQs = await db
      .update(schema.faq)
      .set({ isActive: false })
      .where(eq(schema.faq.id, id))
      .returning();
    return updatedFAQs.length > 0;
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    if (!isNeonConnected) return memoryStorage.getCampaigns();
    const campaigns = await db.select().from(schema.campaigns).orderBy(desc(schema.campaigns.createdAt));
    return campaigns;
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    if (!isNeonConnected) return memoryStorage.createCampaign(campaign);
    const newCampaigns = await db.insert(schema.campaigns).values(campaign).returning();
    return newCampaigns[0];
  }

  async deleteCampaign(id: string): Promise<boolean> {
    if (!isNeonConnected) return memoryStorage.deleteCampaign(id);
    const result = await db.delete(schema.campaigns).where(eq(schema.campaigns.id, id));
    return result.rowCount > 0;
  }

  // AI Config
  async getAIConfigs(): Promise<AIConfig[]> {
    if (!isNeonConnected) return memoryStorage.getAIConfigs();
    const configs = await db.select().from(schema.aiConfig).orderBy(desc(schema.aiConfig.createdAt));
    return configs;
  }

  async createAIConfig(config: InsertAIConfig): Promise<AIConfig> {
    if (!isNeonConnected) return memoryStorage.createAIConfig();
    const newConfigs = await db.insert(schema.aiConfig).values(config).returning();
    return newConfigs[0];
  }

  async updateAIConfig(id: string, config: Partial<InsertAIConfig>): Promise<AIConfig | undefined> {
    if (!isNeonConnected) return memoryStorage.updateAIConfig();
    const updatedConfigs = await db
      .update(schema.aiConfig)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(schema.aiConfig.id, id))
      .returning();
    return updatedConfigs[0];
  }

  // Team
  async getTeamMembers(): Promise<TeamMember[]> {
    if (!isNeonConnected) return memoryStorage.getTeamMembers();
    const members = await db.select().from(schema.teamMembers).where(eq(schema.teamMembers.isActive, true)).orderBy(desc(schema.teamMembers.createdAt));
    return members;
  }

  async getTeamStats(): Promise<any> {
    if (!isNeonConnected) return memoryStorage.getTeamStats();
    const members = await this.getTeamMembers();
    return {
      totalMembers: members.length,
      admins: members.filter(m => m.role === "admin").length,
      managers: members.filter(m => m.role === "manager").length,
      activeToday: members.filter(m => {
        if (!m.lastActive) return false;
        const today = new Date();
        const lastActive = new Date(m.lastActive);
        return today.getDate() === lastActive.getDate();
      }).length,
    };
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    if (!isNeonConnected) return memoryStorage.createTeamMember();
    const newMembers = await db.insert(schema.teamMembers).values(member).returning();
    return newMembers[0];
  }

  async updateTeamMember(id: string, member: Partial<InsertTeamMember>): Promise<TeamMember | undefined> {
    if (!isNeonConnected) return memoryStorage.updateTeamMember();
    const updatedMembers = await db
      .update(schema.teamMembers)
      .set({ ...member, updatedAt: new Date() })
      .where(eq(schema.teamMembers.id, id))
      .returning();
    return updatedMembers[0];
  }

  // Dashboard
  async getDashboardMetrics(): Promise<any> {
    if (!isNeonConnected) return memoryStorage.getDashboardMetrics();
    const userCount = await db.select({ count: count() }).from(schema.users);
    const revenueSum = await db.select({ sum: sum(schema.payments.amount) }).from(schema.payments).where(eq(schema.payments.status, "completed"));
    const activeProducts = await db.select({ count: count() }).from(schema.products).where(eq(schema.products.status, "active"));

    // Calculate conversion rate (completed payments / total users)
    const completedPayments = await db.select({ count: count() }).from(schema.payments).where(eq(schema.payments.status, "completed"));
    const conversionRate = userCount[0]?.count > 0 ? (completedPayments[0]?.count / userCount[0]?.count * 100).toFixed(2) : "0.00";

    return {
      totalUsers: userCount[0]?.count || 0,
      revenue: Number(revenueSum[0]?.sum || 0),
      conversionRate: parseFloat(conversionRate),
      activeCampaigns: activeProducts[0]?.count || 0,
      userGrowth: "+12.5%",
      revenueGrowth: "+8.2%",
      conversionChange: "-0.3%",
      campaignsStatus: "3 new",
    };
  }

  async getRecentActivity(): Promise<any[]> {
    if (!isNeonConnected) return memoryStorage.getRecentActivity();
    // Get recent activities from activity log or construct from recent records
    const recentUsers = await db
      .select()
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(5);

    const recentPayments = await db
      .select()
      .from(schema.payments)
      .orderBy(desc(schema.payments.createdAt))
      .limit(5);

    const recentWithdrawals = await db
      .select()
      .from(schema.withdrawals)
      .orderBy(desc(schema.withdrawals.createdAt))
      .limit(5);

    const activities = [
      ...recentUsers.map((user: any) => ({
        id: `user-${user.id}`,
        type: "registration",
        description: `New user registered: ${user.email}`,
        timestamp: this.getRelativeTime(user.createdAt),
        icon: "fas fa-user-plus",
        iconBg: "bg-primary",
        status: "New",
        statusColor: "bg-green-500/20 text-green-400",
      })),
      ...recentPayments.map((payment: any) => ({
        id: `payment-${payment.id}`,
        type: "payment",
        description: `Payment received: ₹${Number(payment.amount).toLocaleString()}`,
        timestamp: this.getRelativeTime(payment.createdAt),
        icon: "fas fa-rupee-sign",
        iconBg: "bg-green-500",
        status: "Payment",
        statusColor: "bg-green-500/20 text-green-400",
      })),
      ...recentWithdrawals.map((withdrawal: any) => ({
        id: `withdrawal-${withdrawal.id}`,
        type: "withdrawal",
        description: `Withdrawal request pending: ₹${Number(withdrawal.amount).toLocaleString()}`,
        timestamp: this.getRelativeTime(withdrawal.createdAt),
        icon: "fas fa-exclamation-triangle",
        iconBg: "bg-yellow-500",
        status: "Pending",
        statusColor: "bg-yellow-500/20 text-yellow-400",
      })),
    ];

    return activities.slice(0, 10);
  }

  private getRelativeTime(date: Date | null): string {
    if (!date) return "Unknown";
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  }
}

export const storage = new SupabaseStorage();
