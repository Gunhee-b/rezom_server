#!/bin/bash

# Deployment Configuration for Rezom
# Update these values with your actual EC2 details

# EC2 Instance Details
export EC2_HOST="your-ec2-domain.compute.amazonaws.com"
export EC2_USER="ubuntu"
export EC2_KEY="~/.ssh/your-ec2-key.pem"
export REMOTE_DIR="/opt/rezom"

# Application URLs
export FRONTEND_URL="https://your-domain.com"
export API_URL="https://api.your-domain.com"
export ADMIN_URL="https://admin.your-domain.com"

# AWS Resources (optional)
export AWS_REGION="ap-northeast-2"
export AWS_S3_BUCKET="rezom-backups"
export AWS_RDS_ENDPOINT=""  # If using RDS instead of Docker MySQL

# Database Configuration (for production)
export DB_HOST="localhost"
export DB_PORT="3306"
export DB_NAME="rezom_production"
export DB_USER="rezom_user"

# Quick deployment function
deploy() {
    echo "Deploying to $EC2_HOST..."
    ./scripts/sync-to-ec2.sh \
        --host "$EC2_HOST" \
        --user "$EC2_USER" \
        --key "$EC2_KEY" \
        --dir "$REMOTE_DIR"
}

# Quick SSH function
connect() {
    echo "Connecting to $EC2_HOST..."
    ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST"
}

# View logs function
logs() {
    service=${1:-all}
    echo "Viewing logs for $service on $EC2_HOST..."
    ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" \
        "cd $REMOTE_DIR && docker-compose -f docker-compose.production.yml logs -f $service"
}

# Backup function
backup() {
    echo "Creating backup on $EC2_HOST..."
    ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" \
        "cd $REMOTE_DIR && ./scripts/backup.sh"
}

# Status check function
status() {
    echo "Checking status on $EC2_HOST..."
    ssh -i "$EC2_KEY" "$EC2_USER@$EC2_HOST" \
        "cd $REMOTE_DIR && docker-compose -f docker-compose.production.yml ps"
}

echo "Deployment configuration loaded!"
echo "Available commands:"
echo "  deploy  - Deploy to EC2"
echo "  connect - SSH to EC2"
echo "  logs [service] - View logs"
echo "  backup  - Create backup"
echo "  status  - Check service status"