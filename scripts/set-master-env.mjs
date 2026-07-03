import bcrypt from "bcryptjs";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import {
  stripMasterKeysFromLocal,
  writeEnvFile,
} from "./lib/env-files.mjs";

const password = process.argv[2];
const cwd = process.cwd();
const productionPath = path.join(cwd, ".env.production");
const credentialsPath = path.join(cwd, "data", "master-auth.json");

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

const username = "MatheusBraga";

writeEnvFile(productionPath, {
  MASTER_USERNAME: username,
  MASTER_PASSWORD_HASH: `"${hash}"`,
  COOKIE_SECURE: "false",
});

mkdirSync(path.join(cwd, "data"), { recursive: true });
writeFileSync(
  credentialsPath,
  JSON.stringify({ username, passwordHash: hash }, null, 2) + "\n",
  "utf-8"
);

const removedFromLocal = stripMasterKeysFromLocal(cwd);

console.log("OK — credenciais gravadas:");
console.log(`  data/master-auth.json  (fonte usada pelo app)`);
console.log(`  .env.production        (backup)`);
console.log(`  MASTER_USERNAME=${username}`);
console.log(`  passwordHash="${hash}"`);

if (removedFromLocal) {
  console.log("\nRemovido MASTER_* de .env.local (ele sobrescrevia .env.production).");
}

console.log("\nReinicie o app: pm2 restart sillion --update-env");
