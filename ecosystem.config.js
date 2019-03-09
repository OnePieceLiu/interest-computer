module.exports = {
  apps: [{
    name: 'interest-computer',
    script: 'server/index.js',
    args: 'one two',
    instances: 1,
    autorestart: true,
    watch: true,
    ignore_watch: ['node_modules', 'client', 'sql'],
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
