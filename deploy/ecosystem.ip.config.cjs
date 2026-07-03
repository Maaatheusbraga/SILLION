/** PM2 — acesso só por IP, sem SSL (cookies sem secure) */
module.exports = {
  apps: [
    {
      name: "sillion",
      cwd: "/opt/sillion",
      script: "node_modules/.bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      env: {
        NODE_ENV: "production",
        COOKIE_SECURE: "false",
      },
    },
  ],
};
