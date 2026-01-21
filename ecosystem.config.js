module.exports = {
  apps: [
    {
      name: "pgs-dashboard",
      script: "./server.js",
      node_args: "--max-old-space-size=768",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
