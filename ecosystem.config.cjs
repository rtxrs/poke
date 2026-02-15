module.exports = {
  apps: [
    {
      name: "poke",
      script: "./dist/server.js",
      node_args: "--max-old-space-size=768",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
