import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("user"), // user, admin, superadmin
  status: text("status").notNull().default("active"), // active, inactive, suspended
  source: text("source").default("website"), // website, referral, social_media
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  refreshToken: text("refresh_token"),
  lastContact: timestamp("last_contact"),
  value: decimal("value", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"), // active, draft, inactive
  sales: integer("sales").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  productId: uuid("product_id").references(() => products.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  paymentMethod: text("payment_method"), // card, upi, bank_transfer, wallet
  transactionId: text("transaction_id"),
  manuallyConfirmed: boolean("manually_confirmed").default(false),
  confirmedBy: uuid("confirmed_by").references(() => users.id),
  confirmationNotes: text("confirmation_notes"),
  webhookSignatureValid: boolean("webhook_signature_valid"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referrals table
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: uuid("referrer_id").references(() => users.id),
  referredId: uuid("referred_id").references(() => users.id),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionEarned: decimal("commission_earned", { precision: 10, scale: 2 }).default("0"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

// Withdrawals table
export const withdrawals = pgTable("withdrawals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(), // bank_transfer, upi, wallet
  accountDetails: jsonb("account_details"), // Bank details, UPI ID, etc.
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processed
  rejectionReason: text("rejection_reason"),
  referenceId: text("reference_id"),
  processedBy: uuid("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // in_app, email, push, all
  title: text("title").notNull(),
  message: text("message").notNull(),
  emoji: text("emoji"),
  targetAudience: text("target_audience").notNull(), // all_users, active_clients, leads, premium_users, custom
  customSegment: jsonb("custom_segment"), // For custom audience targeting
  status: text("status").notNull().default("draft"), // draft, scheduled, sent
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// FAQ table
export const faq = pgTable("faq", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull(),
  views: integer("views").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // referral, marketing, promotional
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  spent: decimal("spent", { precision: 10, scale: 2 }).default("0"),
  level1Commission: decimal("level1_commission", { precision: 5, scale: 2 }),
  level2Commission: decimal("level2_commission", { precision: 5, scale: 2 }),
  level3Commission: decimal("level3_commission", { precision: 5, scale: 2 }),
  eligibleProducts: jsonb("eligible_products"), // Array of product IDs
  metrics: jsonb("metrics"), // Campaign performance metrics
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Config table
export const aiConfig = pgTable("ai_config", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").references(() => products.id),
  isEnabled: boolean("is_enabled").default(false),
  mode: text("mode").notNull().default("chat"), // chat, voice, both
  systemPrompt: text("system_prompt"),
  welcomeMessage: text("welcome_message"),
  fallbackResponse: text("fallback_response"),
  settings: jsonb("settings"), // Additional AI settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Team Members table
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name").notNull(),
  role: text("role").notNull(), // superadmin, finance, support, content
  permissions: jsonb("permissions"), // Role-based permissions
  assignedLeads: integer("assigned_leads").default(0),
  performance: decimal("performance", { precision: 5, scale: 2 }).default("0"),
  lastActive: timestamp("last_active"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity Log table for audit trail
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => teamMembers.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Analytics table for tracking user behavior
export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  eventType: text("event_type").notNull(), // video_watch, signup, payment, page_view
  eventData: jsonb("event_data"), // Duration, drop-off point, etc.
  sessionId: text("session_id"),
  videoId: text("video_id"),
  watchDuration: integer("watch_duration"), // in seconds
  dropOffPoint: integer("drop_off_point"), // in seconds
  completionRate: decimal("completion_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertFAQSchema = createInsertSchema(faq).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAIConfigSchema = createInsertSchema(aiConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type FAQ = typeof faq.$inferSelect;
export type InsertFAQ = z.infer<typeof insertFAQSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type AIConfig = typeof aiConfig.$inferSelect;
export type InsertAIConfig = z.infer<typeof insertAIConfigSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
