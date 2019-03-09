module.exports = {
  apps: [{
    name: 'interest-computer',
    script: 'server/index.js',
    args: 'one two',
    instances: 1,
    autorestart: true,
    watch: false,
    // watch 意义不大，通常更新，都是需要重跑 npm install
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
