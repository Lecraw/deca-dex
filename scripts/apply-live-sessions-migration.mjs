#!/usr/bin/env node
// One-off: apply the DUZZ live-session migration against Turso.
// Usage:
//   node scripts/apply-live-sessions-migration.mjs
// Requires DATABASE_URL + TURSO_AUTH_TOKEN in your shell (or .env.local).

import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sqlPath = path.join(
  process.cwd(),
  "prisma/migrations/20260416120000_add_live_sessions/migration.sql"
);
const sql = fs.readFileSync(sqlPath, "utf8");

const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

const client = createClient({ url, authToken });

for (const s of statements) {
  try {
    await client.execute(s);
    console.log("✓", s.split("\n")[0].slice(0, 80));
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (/already exists/i.test(msg)) {
      console.log("• skip (exists):", s.split("\n")[0].slice(0, 80));
      continue;
    }
    console.error("✗", s.split("\n")[0].slice(0, 80));
    console.error("  ", msg);
    process.exit(1);
  }
}

console.log("Done.");
