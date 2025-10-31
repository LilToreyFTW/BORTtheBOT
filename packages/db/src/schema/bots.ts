import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const bot = sqliteTable("bot", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    // JSON string of specs (UI config, capabilities, etc.)
    specsJson: text("specs_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// # ADDED: Bot program storage (e.g., Python code) per bot
export const botProgram = sqliteTable("bot_program", {
    id: text("id").primaryKey(),
    botId: text("bot_id").notNull(),
    language: text("language").notNull(), // e.g., "python"
    code: text("code").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});


