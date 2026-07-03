const password = process.argv[2];
const username = process.argv[3] ?? "MatheusBraga";
const port = process.env.PORT ?? "3003";
const url = `http://127.0.0.1:${port}/api/master/login`;

if (!password) {
  console.error("Uso: npm run master:test-login -- SUA_SENHA [USUARIO]");
  process.exit(1);
}

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});

const data = await res.json().catch(() => ({}));
console.log("HTTP", res.status, data);

if (res.ok) {
  console.log("Login OK — o app está autenticando corretamente.");
  process.exit(0);
}

console.error("Login FALHOU — problema no servidor, não no navegador.");
process.exit(1);
