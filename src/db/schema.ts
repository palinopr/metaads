import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  primaryKey,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core"
import type { AdapterAccount } from "next-auth/adapters"

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
)

export const agentConfigs = pgTable("agent_configs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  model: text("model").notNull().default("gpt-4"),
  temperature: integer("temperature").notNull().default(7), // Stored as int (0-20) divided by 10
  maxTokens: integer("max_tokens").notNull().default(2000),
  systemPrompt: text("system_prompt"),
  tools: jsonb("tools").$type<string[]>().default([]),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Meta (Facebook) connection tables
export const metaConnections = pgTable("meta_connections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const metaAdAccounts = pgTable("meta_ad_accounts", {
  id: text("id").primaryKey(), // This should be the Meta account ID, not UUID
  accountId: text("account_id"), // Numeric Meta account ID (without act_ prefix)
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectionId: text("connection_id").notNull().references(() => metaConnections.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  timezone: text("timezone_name").notNull(),
  accountStatus: integer("account_status"),
  isSelected: boolean("is_selected").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Campaign management tables
export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  metaId: text("meta_id").unique(), // Meta's campaign ID
  adAccountId: text("ad_account_id").notNull().references(() => metaAdAccounts.id),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull(), // ACTIVE, PAUSED, DELETED, ARCHIVED
  objective: text("objective").notNull(), // SALES, TRAFFIC, AWARENESS, ENGAGEMENT
  budgetType: text("budget_type").notNull(), // DAILY, LIFETIME
  budgetAmount: integer("budget_amount").notNull(), // In cents
  spendCap: integer("spend_cap"), // In cents
  startTime: timestamp("start_time", { mode: "date" }),
  endTime: timestamp("end_time", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  syncedAt: timestamp("synced_at", { mode: "date" }),
})

export const adSets = pgTable("ad_sets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  metaId: text("meta_id").unique(), // Meta's ad set ID
  campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull(),
  targetingSpec: jsonb("targeting_spec").$type<Record<string, any>>(),
  dailyBudget: integer("daily_budget"), // In cents
  lifetimeBudget: integer("lifetime_budget"), // In cents
  bidStrategy: text("bid_strategy"),
  bidAmount: integer("bid_amount"), // In cents
  startTime: timestamp("start_time", { mode: "date" }),
  endTime: timestamp("end_time", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const ads = pgTable("ads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  metaId: text("meta_id").unique(), // Meta's ad ID
  adSetId: text("ad_set_id").notNull().references(() => adSets.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  status: text("status").notNull(),
  creative: jsonb("creative").$type<Record<string, any>>(),
  trackingSpecs: jsonb("tracking_specs").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const campaignInsights = pgTable("campaign_insights", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  spend: integer("spend").notNull().default(0), // In cents
  conversions: integer("conversions").notNull().default(0),
  revenue: integer("revenue").notNull().default(0), // In cents
  ctr: integer("ctr"), // Click-through rate * 10000 (for precision)
  cpc: integer("cpc"), // Cost per click in cents
  cpm: integer("cpm"), // Cost per mille in cents
  roas: integer("roas"), // Return on ad spend * 100 (for precision)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const optimizationLogs = pgTable("optimization_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  agentId: text("agent_id").notNull(),
  action: text("action").notNull(), // BUDGET_INCREASE, BUDGET_DECREASE, PAUSE, RESUME, etc.
  previousValue: jsonb("previous_value").$type<Record<string, any>>(),
  newValue: jsonb("new_value").$type<Record<string, any>>(),
  reason: text("reason").notNull(),
  impact: jsonb("impact").$type<Record<string, any>>(), // Predicted or actual impact
  requiresApproval: boolean("requires_approval").notNull().default(false),
  approvalStatus: text("approval_status"), // PENDING, APPROVED, REJECTED
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { mode: "date" }),
  executedAt: timestamp("executed_at", { mode: "date" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})