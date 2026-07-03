import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import path from "path";

const password = process.argv[2];
const envPath = path.join(process.cwd(), ".env.production");

function parseEnv(content) {
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

if (!existsSync(envPath)) {
  console.error("Arquivo .env.production não encontrado.");
  process.exit(1);
}

const vars = parseEnv(readFileSync(envPath, "utf-8"));
const username = vars.MASTER_USERNAME ?? "(não definido)";
const hash = vars.MASTER_PASSWORD_HASH ?? "";

console.log("MASTER_USERNAME:", username);
console.log("MASTER_PASSWORD_HASH length:", hash.length);
console.log("MASTER_PASSWORD_HASH prefix:", hash.slice(0, 7) || "(vazio)");
console.log("COOKIE_SECURE:", vars.COOKIE_SECURE ?? "(não definido)");

if (!hash.startsWith("$2")) {
  console.error(
    "\nERRO: hash inválido — o Next.js corrompe bcrypt sem aspas no .env."
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
  console.log("\nTeste de senha:", valid ? "OK" : "FALHOU");
  process.exit(valid ? 0 : 1);
}

console.log("\nHash parece válido. Para testar a senha:");
console.log("  npm run master:verify -- SUA_SENHA");
