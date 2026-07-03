import { readFileSync, existsSync } from "fs";
import path from "path";

const password = process.argv[2];
const username = process.argv[3] ?? "MatheusBraga";

function detectPort() {
  if (process.env.PORT) return process.env.PORT;
  const ecoPath = path.join(process.cwd(), "deploy/ecosystem.ip.config.cjs");
  if (existsSync(ecoPath)) {
    const m = readFileSync(ecoPath, "utf-8").match(/-p\s+(\d+)/);
    if (m) return m[1];
  }
  return "3003";
}

const port = detectPort();
const url = `http://127.0.0.1:${port}/api/master/login`;

if (!password) {
  console.error("Uso: npm run master:test-login -- SUA_SENHA [USUARIO]");
  process.exit(1);
}

console.log(`Testando POST ${url} ...`);

async function tryLogin(attempt) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  } catch (err) {
    if (attempt < 15) {
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, 2000));
      return tryLogin(attempt + 1);
    }
    throw err;
  }
}

try {
  const { res, data } = await tryLogin(1);
  console.log("\nHTTP", res.status, data);

  if (res.ok) {
    console.log("Login OK — o app está autenticando corretamente.");
    process.exit(0);
  }

  console.error("Login FALHOU — credenciais rejeitadas pelo servidor.");
  process.exit(1);
} catch (err) {
  console.error(
    `\nErro: app não responde em 127.0.0.1:${port} — rode: npm run deploy:restart-ip`
  );
  console.error(err.cause?.message ?? err.message);
  process.exit(1);
}
