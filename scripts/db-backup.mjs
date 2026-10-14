// npm run db:backup: a full copy of the SCAS database in backups/ (pg_dump custom format).
// NFR10, see docs/BACKUP.md. The connection string is read from .env and never printed.
import "dotenv/config";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// libpq only understands its own URI parameters; Prisma-only ones (schema, pgbouncer, ...) would make pg_dump fail.
const LIBPQ_PARAMS = new Set(["sslmode", "channel_binding", "sslrootcert", "connect_timeout", "options", "application_name"]);

function fail(message) {
  console.error(`db:backup failed: ${message}`);
  process.exit(1);
}

/** pg_dump from PATH, or PG_DUMP, or the newest PostgreSQL install on Windows. */
function findPgDump() {
  if (process.env.PG_DUMP) return process.env.PG_DUMP;
  const base = "C:\\Program Files\\PostgreSQL";
  if (process.platform === "win32" && existsSync(base)) {
    const versions = readdirSync(base).filter((v) => /^\d+$/.test(v)).sort((a, b) => Number(b) - Number(a));
    for (const v of versions) {
      const exe = path.join(base, v, "bin", "pg_dump.exe");
      if (existsSync(exe)) return exe;
    }
  }
  return "pg_dump";
}

const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!raw) fail("DATABASE_URL is not set in .env.");

const url = new URL(raw);
// Neon: dump through the direct endpoint, not the connection pooler.
url.hostname = url.hostname.replace("-pooler.", ".");
for (const key of [...url.searchParams.keys()]) if (!LIBPQ_PARAMS.has(key)) url.searchParams.delete(key);
// The password goes in PGPASSWORD, so it is not on the command line either.
const password = decodeURIComponent(url.password);
url.password = "";
const secrets = [password, url.username, url.hostname].filter(Boolean);
const redact = (text) => secrets.reduce((t, s) => t.split(s).join("***"), text);

const dir = path.resolve("backups");
mkdirSync(dir, { recursive: true });
const stamp = new Date(Date.now() + 8 * 3600_000).toISOString().replace(/\..+/, "").replace("T", "_").replace(/:/g, ""); // Malaysian time
const file = path.join(dir, `scas_${stamp}.dump`);

const started = Date.now();
// Only the SCAS schema (the 9 tables, enums and Prisma's migration history). Neon adds its own schemas
// (neon_auth, pgrst) and a pg_session_jwt extension that SCAS doesn't use and other servers can't restore.
const args = ["--format=custom", "--no-owner", "--no-privileges", "--schema=public", "--exclude-extension=pg_session_jwt", "--file", file, "--dbname", url.toString()];
const child = spawn(findPgDump(), args, {
  env: { ...process.env, PGPASSWORD: password },
  stdio: ["ignore", "ignore", "pipe"],
});
let stderr = "";
child.stderr.on("data", (d) => (stderr += d));
child.on("error", (e) => fail(e.code === "ENOENT" ? "pg_dump was not found. Install PostgreSQL client tools or set PG_DUMP." : redact(e.message)));
child.on("close", (code) => {
  if (code !== 0) fail(redact(stderr.trim()) || `pg_dump exited with code ${code}`);
  const kb = Math.round(statSync(file).size / 1024);
  console.log(`Backup saved: backups/${path.basename(file)} (${kb} KB, ${((Date.now() - started) / 1000).toFixed(1)} s)`);
});
