#!/bin/bash

# EC2 Setup Script for Rezom
set -e

echo "==================================="
echo "EC2 Setup for Rezom Production"
echo "==================================="

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install essential packages
echo "Installing essential packages..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw

# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
rm get-docker.sh

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for running migrations)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Setup firewall
echo "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Backend API (remove in production if using Nginx proxy)
sudo ufw --force enable

# Create application directory
echo "Creating application directory..."
sudo mkdir -p /opt/rezom
sudo chown ubuntu:ubuntu /opt/rezom
cd /opt/rezom

# Clone repository (replace with your repo URL)
echo "Please clone your repository manually:"
echo "git clone https://github.com/your-username/rezom.git ."

# Create swap file (recommended for t2.micro)
echo "Creating swap file..."
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Setup systemd service for auto-start
echo "Creating systemd service..."
sudo tee /etc/systemd/system/rezom.service > /dev/null << 'EOF'
[Unit]
Description=Rezom Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=ubuntu
WorkingDirectory=/opt/rezom
ExecStart=/usr/local/bin/docker-compose -f docker-compose.production.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.production.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable rezom

# Create backup cron job
echo "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/rezom/scripts/backup.sh") | crontab -

echo "==================================="
echo "EC2 setup completed!"
echo ""
echo "Next steps:"
echo "1. Clone your repository to /opt/rezom"
echo "2. Copy .env.production file"
echo "3. Run: cd /opt/rezom && ./scripts/deploy.sh"
echo "4. Configure SSL with: sudo certbot --nginx -d your-domain.com"
echo "===================================" 