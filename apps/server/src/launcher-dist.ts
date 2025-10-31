#!/usr/bin/env bun
// # ADDED: Launcher using built dist files
import "dotenv/config";
import { serve } from "bun";
// Import the built app from dist
const appModule = await import("../dist/index.js");
const app = appModule.default;

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

console.log(`🚀 BORTtheBOT Server starting on http://${HOST}:${PORT}`);
console.log(`📁 Bot storage: ${process.env.BOT_STORAGE_DIR || process.cwd() + "/bot_storage"}`);

serve({
  fetch: app.fetch,
  port: PORT,
  hostname: HOST,
});

console.log(`✅ Server running at http://localhost:${PORT}`);
console.log(`🔗 API: http://localhost:${PORT}/trpc`);
console.log(`📝 Press Ctrl+C to stop`);

// Keep process alive
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  process.exit(0);
});

