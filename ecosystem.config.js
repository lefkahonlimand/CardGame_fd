module.exports = {
  apps: [{
    name: "card-estimation-game",
    script: "./server/server.js",
    watch: true,
    ignore_watch: ["node_modules", "client"],
    env: {
      "NODE_ENV": "production",
      "PORT": "3000"
    },
    env_development: {
      "NODE_ENV": "development",
      "PORT": "3000"
    },
    instances: 1,
    exec_mode: "fork",
    max_memory_restart: "300M",
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true
  }]
};
