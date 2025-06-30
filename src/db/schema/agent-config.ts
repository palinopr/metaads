import { pgTable, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core"

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