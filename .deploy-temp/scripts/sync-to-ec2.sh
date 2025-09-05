#!/bin/bash

# Sync and Deploy to Existing EC2 Instance
set -e

echo "==================================="
echo "Syncing to EC2 and Redeploying"
echo "==================================="

# Configuration - Update these with your actual values
EC2_HOST=${EC2_HOST:-"your-ec2-instance.compute.amazonaws.com"}
EC2_USER=${EC2_USER:-"ubuntu"}
EC2_KEY=${EC2_KEY:-"~/.ssh/your-key.pem"}
REMOTE_DIR=${REMOTE_DIR:-"/opt/rezom"}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            EC2_HOST="$2"
            shift 2
            ;;
        --user)
            EC2_USER="$2"
            shift 2
            ;;
        --key)
            EC2_KEY="$2"
            shift 2
            ;;
        --dir)
            REMOTE_DIR="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--host EC2_HOST] [--user EC2_USER] [--key KEY_PATH] [--dir REMOTE_DIR]"
            exit 1
            ;;
    esac
done

echo "Deployment Configuration:"
echo "  Host: $EC2_HOST"
echo "  User: $EC2_USER"
echo "  Key: $EC2_KEY"
echo "  Directory: $REMOTE_DIR"
echo ""

# Step 1: Sync code using rsync
echo "1. Syncing code to EC2..."
rsync -avz --delete \
    -e "ssh -i $EC2_KEY" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '.env.local' \
    --exclude '.env.development' \
    --exclude '*.log' \
    --exclude 'cookies.txt' \
    --exclude 'admin_cookies.txt' \
    --exclude 'test-*.html' \
    --exclude '.DS_Store' \
    ./ $EC2_USER@$EC2_HOST:$REMOTE_DIR/

# Step 2: Run deployment commands on EC2
echo "2. Running deployment on EC2..."
ssh -i $EC2_KEY $EC2_USER@$EC2_HOST << ENDSSH
cd $REMOTE_DIR

echo "Installing dependencies..."
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..
cd admin && npm ci && cd ..

echo "Building applications..."
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
cd admin && npm run build && cd ..

echo "Running database migrations..."
cd backend && npx prisma generate && npx prisma migrate deploy && cd ..

echo "Restarting Docker containers..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

echo "Waiting for services to start..."
sleep 15

echo "Health check..."
curl -f http://localhost:3000/health && echo " ✓ Backend is healthy"
curl -f http://localhost:8080 && echo " ✓ Frontend is healthy" 
curl -f http://localhost:8081 && echo " ✓ Admin is healthy"

echo "Deployment completed!"
ENDSSH

echo "==================================="
echo "Deployment successful!"
echo "==================================="
echo ""
echo "Your application is now running at:"
echo "  Frontend: https://$EC2_HOST"
echo "  API: https://$EC2_HOST/api" 
echo "  Admin: https://$EC2_HOST/admin"