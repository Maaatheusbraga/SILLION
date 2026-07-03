import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

/** Mesma ordem de prioridade do Next.js em produção (.env.local sobrescreve .env.production). */
export function loadMergedProductionEnv(cwd = process.cwd()) {
  const merged = {};
  for (const file of [".env.production", ".env.local"]) {
    const filePath = path.join(cwd, file);
    if (!existsSync(filePath)) continue;
    Object.assign(merged, parseEnvFile(readFileSync(filePath, "utf-8")));
  }
  return merged;
}

export function parseEnvFile(content) {
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    vars[key] = parseEnvValue(trimmed.slice(eq + 1).trim());
  }
  return vars;
}

export function parseEnvValue(raw) {
  let val = raw.trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  return val;
}

const MASTER_KEYS = ["MASTER_USERNAME", "MASTER_PASSWORD_HASH", "MASTER_JWT_SECRET"];

export function writeEnvFile(filePath, updates, removeKeys = []) {
  const lines = existsSync(filePath)
    ? readFileSync(filePath, "utf-8").split(/\r?\n/)
    : [];

  const remove = new Set(removeKeys);
  const seen = new Set();

  const out = lines
    .filter((line) => {
      const m = line.match(/^([A-Z_]+)=/);
      if (m && remove.has(m[1])) return false;
      return true;
    })
    .map((line) => {
      const m = line.match(/^([A-Z_]+)=/);
      if (!m || !(m[1] in updates)) return line;
      seen.add(m[1]);
      return `${m[1]}=${updates[m[1]]}`;
    })
    .filter((line, i, arr) => !(line === "" && i === arr.length - 1));

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) out.push(`${key}=${value}`);
  }

  writeFileSync(filePath, out.join("\n") + "\n", "utf-8");
}

export function stripMasterKeysFromLocal(cwd = process.cwd()) {
  const localPath = path.join(cwd, ".env.local");
  if (!existsSync(localPath)) return false;

  const before = readFileSync(localPath, "utf-8");
  const lines = before.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const m = line.match(/^([A-Z_]+)=/);
    return !(m && MASTER_KEYS.includes(m[1]));
  });

  if (filtered.length === lines.length) return false;

  writeFileSync(
    localPath,
    filtered.join("\n").replace(/\n+$/, "") + "\n",
    "utf-8"
  );
  return true;
}
