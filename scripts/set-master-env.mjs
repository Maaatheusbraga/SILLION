import bcrypt from "bcryptjs";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const password = process.argv[2];
const envFile = path.join(process.cwd(), ".env.production");

if (!password) {
  console.error("Uso: npm run master:set -- SUA_SENHA");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const ok = await bcrypt.compare(password, hash);
if (!ok) {
  console.error("Erro interno: hash gerado não confere.");
  process.exit(1);
}

const lines = existsSync(envFile)
  ? readFileSync(envFile, "utf-8").split(/\r?\n/)
  : [];

const keys = {
  MASTER_USERNAME: "MatheusBraga",
  MASTER_PASSWORD_HASH: `"${hash}"`,
  COOKIE_SECURE: "false",
};

const seen = new Set();
const out = lines
  .map((line) => {
    const m = line.match(/^([A-Z_]+)=/);
    if (!m || !(m[1] in keys)) return line;
    seen.add(m[1]);
    return `${m[1]}=${keys[m[1]]}`;
  })
  .filter((line, i, arr) => {
    if (line === "" && i === arr.length - 1) return false;
    return true;
  });

for (const [key, value] of Object.entries(keys)) {
  if (!seen.has(key)) out.push(`${key}=${value}`);
}

writeFileSync(envFile, out.join("\n") + "\n", "utf-8");

console.log("OK — .env.production atualizado:");
console.log(`  MASTER_USERNAME=${keys.MASTER_USERNAME}`);
console.log(`  MASTER_PASSWORD_HASH="${hash}"`);
console.log(`  COOKIE_SECURE=false`);
console.log("\nReinicie o app: pm2 restart sillion --update-env");
