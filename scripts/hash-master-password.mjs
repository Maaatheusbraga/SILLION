import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Uso: npm run master:hash -- SUA_SENHA");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
console.log(hash);
console.log("\nCole no .env.production (com aspas):");
console.log(`MASTER_PASSWORD_HASH="${hash}"`);
