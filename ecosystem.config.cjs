/**
 * PM2 Ecosystem Configuration
 *
 * DEV and PROD run completely isolated:
 * - Separate ports
 * - Separate databases
 * - Separate environment variables
 */

module.exports = {
  apps: [
    // ============================================
    // DEV
    // ============================================
    {
      name: "app-dev",
      script: "npm",
      args: "run dev",
      cwd: process.cwd(),
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
        TZ: "UTC",
      },
      error_file: "logs/dev-error.log",
      out_file: "logs/dev-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      watch: ["src"],
      ignore_watch: ["node_modules", "logs", ".next"],
    },

    // ============================================
    // PROD
    // ============================================
    {
      name: "app-prod",
      script: "node",
      args: ".next-prod/standalone/server.js",
      cwd: process.cwd(),
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
        TZ: "UTC",
      },
      error_file: "logs/prod-error.log",
      out_file: "logs/prod-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};
