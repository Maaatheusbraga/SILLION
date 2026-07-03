/** PM2 — app só em localhost; Nginx expõe na internet */
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
      },
    },
  ],
};
