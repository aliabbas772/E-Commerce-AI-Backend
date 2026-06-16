module.exports = {
  apps: [
    {
      name: "ecommerce-server",
      script: "dist/server.js",

      // Cluster mode — one instance per CPU core
      // Why: Node is single-threaded. 4 cores = 4x throughput
      instances: "max",
      exec_mode: "cluster",

      // Auto restart on crash
      watch: false,
      max_memory_restart: "500M",

      // Restart delay between crashes
      // Prevents restart loop burning CPU
      restart_delay: 3000,
      max_restarts: 10,

      env_development: {
        NODE_ENV: "development",
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },

      // Logs
      error_file: "logs/server-error.log",
      out_file: "logs/server-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      merge_logs: true,
    },
    {
      name: "ecommerce-worker",
      script: "dist/worker.js",

      // Fork mode for worker — single instance
      // Why not cluster: Kafka consumer groups need controlled instances
      // Multiple worker instances = duplicate message processing
      instances: 1,
      exec_mode: "fork",

      max_memory_restart: "300M",
      restart_delay: 5000,

      env_development: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },

      error_file: "logs/worker-error.log",
      out_file: "logs/worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
