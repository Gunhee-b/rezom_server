#!/bin/bash

# Rezom Production Deployment Script
set -e

echo "==================================="
echo "Starting Rezom Production Deployment"
echo "==================================="

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "Error: .env.production file not found!"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command_exists docker; then
    echo "Error: Docker is not installed"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

# Parse arguments
ACTION=${1:-deploy}
SERVICE=${2:-all}

case $ACTION in
    build)
        echo "Building Docker images..."
        docker-compose -f docker-compose.production.yml build --no-cache
        ;;
    
    deploy)
        echo "Deploying application..."
        
        # Pull latest code
        echo "Pulling latest code from repository..."
        git pull origin main
        
        # Install dependencies
        echo "Installing dependencies..."
        cd backend && npm ci && cd ..
        cd frontend && npm ci && cd ..
        cd admin && npm ci && cd ..
        
        # Run database migrations
        echo "Running database migrations..."
        cd backend && npx prisma migrate deploy && cd ..
        
        # Build and start containers
        echo "Starting Docker containers..."
        docker-compose -f docker-compose.production.yml up -d --build
        
        # Wait for services to be healthy
        echo "Waiting for services to be healthy..."
        sleep 10
        
        # Check health status
        ./scripts/health-check.sh
        
        echo "Deployment completed successfully!"
        ;;
    
    stop)
        echo "Stopping services..."
        docker-compose -f docker-compose.production.yml down
        ;;
    
    restart)
        echo "Restarting services..."
        if [ "$SERVICE" = "all" ]; then
            docker-compose -f docker-compose.production.yml restart
        else
            docker-compose -f docker-compose.production.yml restart $SERVICE
        fi
        ;;
    
    logs)
        echo "Showing logs..."
        if [ "$SERVICE" = "all" ]; then
            docker-compose -f docker-compose.production.yml logs -f
        else
            docker-compose -f docker-compose.production.yml logs -f $SERVICE
        fi
        ;;
    
    backup)
        echo "Creating backup..."
        ./scripts/backup.sh
        ;;
    
    restore)
        echo "Restoring from backup..."
        ./scripts/restore.sh
        ;;
    
    *)
        echo "Usage: $0 {build|deploy|stop|restart|logs|backup|restore} [service]"
        exit 1
        ;;
esac