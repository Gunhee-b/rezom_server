#!/bin/bash

# Quick deployment script with pre-configured settings
set -e

# Your EC2 settings
EC2_HOST="3.36.113.18"
EC2_USER="ec2-user"
KEY_PATH="/Users/baegeonhui/Documents/Programming/Rezom/rezom_upgrade_1.pem"
REMOTE_DIR="/home/ec2-user/myapp"

echo "==================================="
echo "Quick Rezom EC2 Deployment"
echo "==================================="
echo "EC2 Host: $EC2_HOST"
echo "User: $EC2_USER"
echo "Key: $KEY_PATH"
echo "Remote Dir: $REMOTE_DIR"
echo "==================================="

# Verify key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo "Error: Key file not found at $KEY_PATH"
    exit 1
fi

# Test SSH connection
echo "Testing SSH connection..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
    echo "✓ SSH connection successful"
else
    echo "✗ SSH connection failed. Please check your details."
    exit 1
fi

# Create deployment package
echo "Creating deployment package..."
rm -rf .deploy-temp
mkdir -p .deploy-temp

# Copy necessary files
cp -r backend .deploy-temp/
cp -r frontend .deploy-temp/
cp -r admin .deploy-temp/
cp -r nginx .deploy-temp/
cp -r scripts .deploy-temp/
cp docker-compose.production.yml .deploy-temp/
cp .env.production .deploy-temp/
cp Dockerfile.* .deploy-temp/ 2>/dev/null || true

# Remove unnecessary files
find .deploy-temp -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find .deploy-temp -name ".env.local" -type f -delete 2>/dev/null || true
find .deploy-temp -name ".env.development" -type f -delete 2>/dev/null || true
find .deploy-temp -name "*.log" -type f -delete 2>/dev/null || true

# Create tarball
echo "Compressing files..."
tar -czf deploy-package.tar.gz -C .deploy-temp .

# Upload to EC2
echo "Uploading to EC2..."
scp -i "$KEY_PATH" -o StrictHostKeyChecking=no deploy-package.tar.gz "$EC2_USER@$EC2_HOST:/tmp/"

# Deploy on EC2
echo "Deploying on EC2..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << ENDSSH
# Create app directory if it doesn't exist
mkdir -p $REMOTE_DIR
cd $REMOTE_DIR

# Backup current deployment if it exists
if [ -d "backend" ]; then
    echo "Creating backup..."
    sudo tar -czf ../rezom-backup-\$(date +%Y%m%d-%H%M%S).tar.gz . 2>/dev/null || echo "Backup skipped"
fi

# Extract new files
echo "Extracting new deployment..."
tar -xzf /tmp/deploy-package.tar.gz

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo yum update -y
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker ec2-user
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install dependencies and build
echo "Installing backend dependencies..."
cd backend && npm ci --production

echo "Building backend..."
npm run build

echo "Running database migrations..."
npx prisma generate
npx prisma migrate deploy || echo "No pending migrations"

cd ..

echo "Installing frontend dependencies..."
cd frontend && npm ci

echo "Building frontend..."
npm run build
cd ..

echo "Installing admin dependencies..."
cd admin && npm ci

echo "Building admin..."
npm run build
cd ..

# Start Docker and restart services
echo "Starting Docker service..."
sudo systemctl start docker

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Start new containers
echo "Starting services..."
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services
sleep 15

# Health check
echo "Running health checks..."
curl -f http://localhost:3000/health && echo " ✓ Backend is healthy" || echo " ✗ Backend check failed"
curl -f http://localhost:8080 && echo " ✓ Frontend is healthy" || echo " ✗ Frontend check failed"
curl -f http://localhost:8081 && echo " ✓ Admin is healthy" || echo " ✗ Admin check failed"

# Show running containers
echo "Docker containers status:"
docker-compose -f docker-compose.production.yml ps

# Cleanup
rm /tmp/deploy-package.tar.gz

echo "Deployment completed!"
echo "Your app should be available at:"
echo "Frontend: http://$EC2_HOST:8080"
echo "Admin: http://$EC2_HOST:8081"
echo "Backend API: http://$EC2_HOST:3000"
ENDSSH

# Cleanup local files
rm -rf .deploy-temp deploy-package.tar.gz
echo "✓ Deployment completed successfully!"
echo ""
echo "Access your application:"
echo "Frontend: http://3.36.113.18:8080"
echo "Admin: http://3.36.113.18:8081"
echo "Backend API: http://3.36.113.18:3000"