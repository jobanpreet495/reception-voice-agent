module.exports = {
    apps: [{
      name: 'medical-reception-agent',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8001,
        HOSTNAME: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8001,
        HOSTNAME: '0.0.0.0'
      }
    }]
  };