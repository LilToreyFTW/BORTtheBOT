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


