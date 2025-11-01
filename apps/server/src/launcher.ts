#!/usr/bin/env bun
// # ADDED: Standalone launcher for creating executable
import "dotenv/config";
import { serve } from "bun";
import app from "./index";

const PORT = Number(process.env.PORT || 3000);
// # UPDATED: Use WireGuard tunnel IP for robot printer network hosting
const HOST = process.env.HOST || "10.2.0.2";

console.log(`🚀 BORTtheBOT Server starting on http://${HOST}:${PORT}`);
console.log(`📁 Bot storage: ${process.env.BOT_STORAGE_DIR || process.cwd() + "/bot_storage"}`);
console.log(`🌐 Network: WireGuard Tunnel (10.2.0.2)`);

serve({
  fetch: app.fetch,
  port: PORT,
  hostname: HOST,
});

console.log(`✅ Server running at http://${HOST}:${PORT}`);
console.log(`🔗 API: http://${HOST}:${PORT}/trpc`);
console.log(`🌐 Web App: http://${HOST}:3001`);
console.log(`📝 Press Ctrl+C to stop`);

// Keep process alive
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  process.exit(0);
});

