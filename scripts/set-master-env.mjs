import bcrypt from "bcryptjs";
import path from "path";
import {
  stripMasterKeysFromLocal,
  writeEnvFile,
} from "./lib/env-files.mjs";

const password = process.argv[2];
const cwd = process.cwd();
const productionPath = path.join(cwd, ".env.production");

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

writeEnvFile(productionPath, {
  MASTER_USERNAME: "MatheusBraga",
  MASTER_PASSWORD_HASH: `"${hash}"`,
  COOKIE_SECURE: "false",
});

const removedFromLocal = stripMasterKeysFromLocal(cwd);

console.log("OK — .env.production atualizado:");
console.log(`  MASTER_USERNAME=MatheusBraga`);
console.log(`  MASTER_PASSWORD_HASH="${hash}"`);
console.log(`  COOKIE_SECURE=false`);

if (removedFromLocal) {
  console.log("\nRemovido MASTER_* de .env.local (ele sobrescrevia .env.production).");
}

console.log("\nReinicie o app: pm2 restart sillion --update-env");
