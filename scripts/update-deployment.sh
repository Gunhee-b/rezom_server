#!/bin/bash

# Update Deployment Script for Existing Rezom EC2 Instance
set -e

echo "==================================="
echo "Updating Rezom Production Deployment"
echo "==================================="

# Configuration
REMOTE_HOST=${1:-}
REMOTE_USER=${2:-ubuntu}
KEY_PATH=${3:-}

if [ -z "$REMOTE_HOST" ]; then
    echo "Usage: ./update-deployment.sh <EC2-IP-or-domain> [username] [key-path]"
    echo "Example: ./update-deployment.sh ec2-xxx.compute.amazonaws.com ubuntu ~/.ssh/mykey.pem"
    exit 1
fi

SSH_CMD="ssh"
if [ ! -z "$KEY_PATH" ]; then
    SSH_CMD="ssh -i $KEY_PATH"
fi

echo "Connecting to: $REMOTE_USER@$REMOTE_HOST"

# Step 1: Build locally and create deployment package
echo "1. Creating deployment package..."
rm -rf dist-deploy
mkdir -p dist-deploy

# Build frontend
echo "Building frontend..."
cd frontend
npm ci
npm run build
cd ..
cp -r frontend/dist dist-deploy/frontend-dist

# Build admin
echo "Building admin panel..."
cd admin
npm ci
npm run build
cd ..
cp -r admin/dist dist-deploy/admin-dist

# Build backend
echo "Building backend..."
cd backend
npm ci
npm run build
cd ..
cp -r backend/dist dist-deploy/backend-dist
cp -r backend/prisma dist-deploy/prisma
cp backend/package*.json dist-deploy/

# Copy necessary files
cp -r nginx dist-deploy/
cp -r scripts dist-deploy/
cp docker-compose.production.yml dist-deploy/
cp Dockerfile.* dist-deploy/ 2>/dev/null || true

# Create tarball
echo "Creating deployment archive..."
tar -czf deploy.tar.gz dist-deploy

# Step 2: Upload to EC2
echo "2. Uploading to EC2..."
scp ${KEY_PATH:+-i $KEY_PATH} deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:/tmp/

# Step 3: Deploy on EC2
echo "3. Deploying on EC2..."
$SSH_CMD $REMOTE_USER@$REMOTE_HOST << 'ENDSSH'
cd /opt/rezom || cd ~/rezom || { echo "Error: Cannot find rezom directory"; exit 1; }

# Backup current deployment
echo "Creating backup of current deployment..."
sudo cp -r . ../rezom-backup-$(date +%Y%m%d-%H%M%S)

# Extract new deployment
echo "Extracting new deployment..."
tar -xzf /tmp/deploy.tar.gz
cp -r dist-deploy/* .

# Update Docker images
echo "Updating Docker containers..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Run database migrations
echo "Running database migrations..."
docker exec rezom-backend npx prisma migrate deploy

# Health check
echo "Performing health check..."
sleep 10
curl -f http://localhost:3000/health || echo "Backend health check failed"
curl -f http://localhost:8080 || echo "Frontend health check failed"
curl -f http://localhost:8081 || echo "Admin health check failed"

# Clean up
rm /tmp/deploy.tar.gz
rm -rf dist-deploy

echo "Deployment updated successfully!"
ENDSSH

# Clean up local files
rm -rf dist-deploy deploy.tar.gz

echo "==================================="
echo "Update completed successfully!"
echo "===================================" 