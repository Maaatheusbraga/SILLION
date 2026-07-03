/** PM2 — VPS compartilhada: porta 3003 (3000/3001/3002 já usadas) */
module.exports = {
  apps: [
    {
      name: "sillion",
      cwd: "/opt/sillion",
      script: "node_modules/.bin/next",
      args: "start -H 127.0.0.1 -p 3003",
      env: {
        NODE_ENV: "production",
        COOKIE_SECURE: "false",
      },
    },
  ],
};
