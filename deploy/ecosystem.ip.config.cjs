/** PM2 — acesso só por IP, sem SSL (cookies sem secure) */
module.exports = {
  apps: [
    {
      name: "sillion",
      cwd: "/opt/sillion",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        HOSTNAME: "127.0.0.1",
        COOKIE_SECURE: "false",
      },
    },
  ],
};
