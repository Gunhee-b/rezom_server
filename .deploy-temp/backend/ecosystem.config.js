module.exports = {
  apps: [{
    name: 'rezom-backend',
    script: 'dist/main.js',
    cwd: '/home/ec2-user/myapp/backend',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      FRONTEND_ORIGIN: 'https://rezom.org,https://admin.rezom.org',
    }
  }]
}
