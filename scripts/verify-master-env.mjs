import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { loadMergedProductionEnv, parseEnvFile } from "./lib/env-files.mjs";

const password = process.argv[2];
const cwd = process.cwd();
const productionPath = path.join(cwd, ".env.production");
const localPath = path.join(cwd, ".env.local");

if (!existsSync(productionPath)) {
  console.error("Arquivo .env.production não encontrado.");
  process.exit(1);
}

console.log("=== O que o Next.js realmente usa (produção) ===");
const merged = loadMergedProductionEnv(cwd);
const username = merged.MASTER_USERNAME ?? "(não definido)";
const hash = merged.MASTER_PASSWORD_HASH ?? "";

console.log("MASTER_USERNAME:", username);
console.log("MASTER_PASSWORD_HASH length:", hash.length);
console.log("MASTER_PASSWORD_HASH prefix:", hash.slice(0, 7) || "(vazio)");
console.log("COOKIE_SECURE:", merged.COOKIE_SECURE ?? "(não definido)");

if (existsSync(localPath)) {
  const local = parseEnvFile(readFileSync(localPath, "utf-8"));
  const localMaster = ["MASTER_USERNAME", "MASTER_PASSWORD_HASH", "MASTER_JWT_SECRET"].filter(
    (k) => k in local
  );
  if (localMaster.length > 0) {
    console.warn(
      "\nAVISO: .env.local ainda define:",
      localMaster.join(", "),
      "— isso SOBRESCREVE .env.production no next start."
    );
    console.warn("Rode: npm run master:set -- SUA_SENHA (remove automaticamente)");
  }
}

if (!hash.startsWith("$2")) {
  console.error(
    "\nERRO: hash inválido no runtime — provavelmente .env.local corrompeu o bcrypt."
  );
  console.error("Corrija com: npm run master:set -- SUA_SENHA");
  process.exit(1);
}

if (hash.length < 59) {
  console.error("\nERRO: hash truncado (esperado ~60 caracteres).");
  console.error("Corrija com: npm run master:set -- SUA_SENHA");
  process.exit(1);
}

if (password) {
  const valid = await bcrypt.compare(password, hash);
  console.log("\nTeste de senha (runtime):", valid ? "OK" : "FALHOU");
  process.exit(valid ? 0 : 1);
}

console.log("\nHash parece válido. Para testar a senha:");
console.log("  npm run master:verify -- SUA_SENHA");
