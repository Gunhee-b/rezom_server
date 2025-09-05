#!/bin/bash

# Interactive EC2 Deployment Script
set -e

echo "==================================="
echo "Rezom EC2 Deployment Assistant"
echo "==================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to prompt for input
prompt_input() {
    local prompt=$1
    local var_name=$2
    local default=$3
    
    if [ ! -z "$default" ]; then
        read -p "$prompt [$default]: " input
        eval $var_name="${input:-$default}"
    else
        read -p "$prompt: " input
        eval $var_name="$input"
    fi
}

# Step 1: Gather EC2 connection information
echo -e "${GREEN}Step 1: EC2 Connection Details${NC}"
echo "-------------------------------"

prompt_input "Enter your EC2 public IP or domain" EC2_HOST ""
prompt_input "Enter SSH user" EC2_USER "ubuntu"
prompt_input "Enter path to your .pem key file" KEY_PATH "~/.ssh/your-key.pem"
prompt_input "Enter deployment directory on EC2" REMOTE_DIR "/opt/rezom"

# Expand tilde in key path
KEY_PATH="${KEY_PATH/#\~/$HOME}"

# Verify key file exists
if [ ! -f "$KEY_PATH" ]; then
    echo -e "${RED}Error: Key file not found at $KEY_PATH${NC}"
    exit 1
fi

# Test SSH connection
echo -e "\n${YELLOW}Testing SSH connection...${NC}"
if ssh -o ConnectTimeout=5 -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed. Please check your details.${NC}"
    exit 1
fi

# Step 2: Choose deployment action
echo -e "\n${GREEN}Step 2: Choose Deployment Action${NC}"
echo "-------------------------------"
echo "1) First-time setup (fresh installation)"
echo "2) Update existing deployment"
echo "3) Quick sync (code only, no build)"
echo "4) Check deployment status"
echo "5) View logs"
echo "6) Create backup"

prompt_input "Select action (1-6)" ACTION "2"

case $ACTION in
    1)
        echo -e "\n${GREEN}First-time Setup${NC}"
        echo "=================="
        
        # Upload setup files
        echo "Uploading setup files..."
        scp -i "$KEY_PATH" scripts/setup-ec2.sh "$EC2_USER@$EC2_HOST:/tmp/"
        scp -i "$KEY_PATH" docker-compose.production.yml "$EC2_USER@$EC2_HOST:/tmp/"
        scp -i "$KEY_PATH" .env.production "$EC2_USER@$EC2_HOST:/tmp/" 2>/dev/null || {
            echo -e "${YELLOW}Warning: .env.production not found. You'll need to create it on the server.${NC}"
        }
        
        # Run setup on EC2
        ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
# Make setup script executable and run it
chmod +x /tmp/setup-ec2.sh
/tmp/setup-ec2.sh

# Create application directory
sudo mkdir -p /opt/rezom
sudo chown $USER:$USER /opt/rezom
cd /opt/rezom

# Move files
mv /tmp/docker-compose.production.yml .
[ -f /tmp/.env.production ] && mv /tmp/.env.production .

echo "First-time setup completed!"
echo "Now you need to:"
echo "1. Clone your repository or upload your code"
echo "2. Configure .env.production"
echo "3. Run the deployment"
ENDSSH
        ;;
        
    2)
        echo -e "\n${GREEN}Updating Deployment${NC}"
        echo "===================="
        
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
        echo "Uploading to EC2 (this may take a moment)..."
        scp -i "$KEY_PATH" deploy-package.tar.gz "$EC2_USER@$EC2_HOST:/tmp/"
        
        # Deploy on EC2
        echo "Deploying on EC2..."
        ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << ENDSSH
cd $REMOTE_DIR || { echo "Error: $REMOTE_DIR not found"; exit 1; }

# Backup current deployment
echo "Creating backup..."
sudo tar -czf ../rezom-backup-\$(date +%Y%m%d-%H%M%S).tar.gz .

# Extract new files
echo "Extracting new deployment..."
tar -xzf /tmp/deploy-package.tar.gz

# Install dependencies and build
echo "Installing backend dependencies..."
cd backend && npm ci

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

# Restart Docker containers
echo "Restarting services..."
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d --build

# Wait for services
sleep 10

# Health check
echo "Running health checks..."
curl -f http://localhost:3000/health && echo " ✓ Backend is healthy" || echo " ✗ Backend unhealthy"
curl -f http://localhost:8080 && echo " ✓ Frontend is healthy" || echo " ✗ Frontend unhealthy"
curl -f http://localhost:8081 && echo " ✓ Admin is healthy" || echo " ✗ Admin unhealthy"

# Cleanup
rm /tmp/deploy-package.tar.gz

echo "Deployment completed!"
ENDSSH
        
        # Cleanup local files
        rm -rf .deploy-temp deploy-package.tar.gz
        echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
        ;;
        
    3)
        echo -e "\n${GREEN}Quick Sync${NC}"
        echo "==========="
        
        # Use rsync for quick sync
        echo "Syncing files..."
        rsync -avz --delete \
            -e "ssh -i $KEY_PATH" \
            --exclude 'node_modules' \
            --exclude '.git' \
            --exclude 'dist' \
            --exclude '.env.local' \
            --exclude '.env.development' \
            --exclude '*.log' \
            --exclude '.DS_Store' \
            --exclude '.deploy-temp' \
            ./ "$EC2_USER@$EC2_HOST:$REMOTE_DIR/"
        
        echo -e "${GREEN}✓ Files synced successfully!${NC}"
        echo -e "${YELLOW}Note: You may need to restart services manually${NC}"
        ;;
        
    4)
        echo -e "\n${GREEN}Deployment Status${NC}"
        echo "================="
        
        ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << ENDSSH
cd $REMOTE_DIR 2>/dev/null || { echo "Deployment directory not found"; exit 1; }

echo "Docker Services Status:"
docker-compose -f docker-compose.production.yml ps

echo -e "\nHealth Checks:"
curl -sf http://localhost:3000/health && echo "✓ Backend: Healthy" || echo "✗ Backend: Unhealthy"
curl -sf http://localhost:8080 && echo "✓ Frontend: Healthy" || echo "✗ Frontend: Unhealthy"
curl -sf http://localhost:8081 && echo "✓ Admin: Healthy" || echo "✗ Admin: Unhealthy"

echo -e "\nDisk Usage:"
df -h | grep -E "^/dev/"

echo -e "\nMemory Usage:"
free -h
ENDSSH
        ;;
        
    5)
        echo -e "\n${GREEN}View Logs${NC}"
        echo "========="
        echo "1) All services"
        echo "2) Backend"
        echo "3) Frontend"
        echo "4) Admin"
        echo "5) MySQL"
        echo "6) Redis"
        echo "7) Nginx"
        
        prompt_input "Select service (1-7)" LOG_CHOICE "1"
        
        SERVICE=""
        case $LOG_CHOICE in
            1) SERVICE="";;
            2) SERVICE="backend";;
            3) SERVICE="frontend";;
            4) SERVICE="admin";;
            5) SERVICE="mysql";;
            6) SERVICE="redis";;
            7) SERVICE="nginx";;
        esac
        
        echo "Fetching logs (Ctrl+C to stop)..."
        ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" \
            "cd $REMOTE_DIR && docker-compose -f docker-compose.production.yml logs -f --tail=100 $SERVICE"
        ;;
        
    6)
        echo -e "\n${GREEN}Create Backup${NC}"
        echo "============="
        
        ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << ENDSSH
cd $REMOTE_DIR || { echo "Error: $REMOTE_DIR not found"; exit 1; }

# Create backup directory
mkdir -p ~/backups

# Backup database
echo "Backing up database..."
docker exec rezom-mysql mysqldump -u root -p\${MYSQL_ROOT_PASSWORD} rezom_production > ~/backups/db-backup-\$(date +%Y%m%d-%H%M%S).sql

# Backup application files
echo "Backing up application files..."
tar -czf ~/backups/app-backup-\$(date +%Y%m%d-%H%M%S).tar.gz $REMOTE_DIR

echo "Backups created in ~/backups/"
ls -lh ~/backups/
ENDSSH
        echo -e "${GREEN}✓ Backup completed!${NC}"
        ;;
esac

echo -e "\n${GREEN}Operation completed!${NC}"
echo "==================================="