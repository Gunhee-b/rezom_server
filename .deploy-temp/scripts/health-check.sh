#!/bin/bash

# Health Check Script for Rezom Services
set -e

echo "==================================="
echo "Running Health Checks"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service_name=$1
    local health_endpoint=$2
    
    echo -n "Checking $service_name... "
    
    if curl -f -s -o /dev/null -w "%{http_code}" "$health_endpoint" | grep -q "200\|204"; then
        echo -e "${GREEN}✓ Healthy${NC}"
        return 0
    else
        echo -e "${RED}✗ Unhealthy${NC}"
        return 1
    fi
}

# Check backend
check_service "Backend API" "http://localhost:3000/health"

# Check frontend
check_service "Frontend" "http://localhost:8080"

# Check admin panel
check_service "Admin Panel" "http://localhost:8081"

# Check MySQL
echo -n "Checking MySQL... "
if docker exec rezom-mysql mysqladmin ping -h localhost --silent; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Check Redis
echo -n "Checking Redis... "
if docker exec rezom-redis redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

echo "==================================="
echo "Health check completed!"