import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { loadMergedProductionEnv, parseEnvFile } from "./lib/env-files.mjs";

const password = process.argv[2];
const cwd = process.cwd();
const productionPath = path.join(cwd, ".env.production");
const localPath = path.join(cwd, ".env.local");
const credentialsPath = path.join(cwd, "data", "master-auth.json");

let username = "";
let hash = "";
let source = "";

if (existsSync(credentialsPath)) {
  const file = JSON.parse(readFileSync(credentialsPath, "utf-8"));
  username = file.username?.trim() ?? "";
  hash = file.passwordHash?.trim() ?? "";
  source = "data/master-auth.json (usado pelo app)";
} else if (existsSync(productionPath)) {
  const merged = loadMergedProductionEnv(cwd);
  username = merged.MASTER_USERNAME ?? "";
  hash = merged.MASTER_PASSWORD_HASH ?? "";
  source = ".env (fallback — crie master-auth.json com npm run master:set)";
}

console.log("=== Fonte:", source, "===");
console.log("MASTER_USERNAME:", username || "(não definido)");
console.log("passwordHash length:", hash.length);
console.log("passwordHash prefix:", hash.slice(0, 7) || "(vazio)");

if (existsSync(localPath)) {
  const local = parseEnvFile(readFileSync(localPath, "utf-8"));
  const localMaster = ["MASTER_USERNAME", "MASTER_PASSWORD_HASH", "MASTER_JWT_SECRET"].filter(
    (k) => k in local
  );
  if (localMaster.length > 0) {
    console.warn(
      "\nAVISO: .env.local ainda define:",
      localMaster.join(", "),
      "— rode npm run master:set para limpar"
    );
  }
}

if (!hash.startsWith("$2") || hash.length < 59) {
  console.error("\nERRO: hash inválido. Rode: npm run master:set -- SUA_SENHA");
  process.exit(1);
}

if (password) {
  const valid = await bcrypt.compare(password, hash);
  console.log("\nTeste de senha:", valid ? "OK" : "FALHOU");
  process.exit(valid ? 0 : 1);
}

console.log("\nPara testar a senha: npm run master:verify -- SUA_SENHA");
console.log("Para testar a API:   npm run master:test-login -- SUA_SENHA");
