#!/bin/bash

# Backup Script for Rezom Production
set -e

echo "==================================="
echo "Starting Backup Process"
echo "==================================="

# Configuration
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="rezom_backup_${DATE}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to backup MySQL database
backup_mysql() {
    echo "Backing up MySQL database..."
    docker exec rezom-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} rezom_production > "$BACKUP_DIR/${BACKUP_NAME}_mysql.sql"
    gzip "$BACKUP_DIR/${BACKUP_NAME}_mysql.sql"
    echo "MySQL backup completed: ${BACKUP_NAME}_mysql.sql.gz"
}

# Function to backup Redis data
backup_redis() {
    echo "Backing up Redis data..."
    docker exec rezom-redis redis-cli BGSAVE
    sleep 5  # Wait for background save to complete
    docker cp rezom-redis:/data/dump.rdb "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb"
    gzip "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb"
    echo "Redis backup completed: ${BACKUP_NAME}_redis.rdb.gz"
}

# Function to backup uploaded files (if any)
backup_uploads() {
    if [ -d "./uploads" ]; then
        echo "Backing up uploaded files..."
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" ./uploads
        echo "Uploads backup completed: ${BACKUP_NAME}_uploads.tar.gz"
    fi
}

# Function to backup environment files
backup_env() {
    echo "Backing up environment configuration..."
    tar -czf "$BACKUP_DIR/${BACKUP_NAME}_env.tar.gz" .env.production docker-compose.production.yml
    echo "Environment backup completed: ${BACKUP_NAME}_env.tar.gz"
}

# Perform backups
backup_mysql
backup_redis
backup_uploads
backup_env

# Create a manifest file
cat > "$BACKUP_DIR/${BACKUP_NAME}_manifest.txt" << EOF
Backup Date: $(date)
Backup Name: ${BACKUP_NAME}
Components:
- MySQL Database: ${BACKUP_NAME}_mysql.sql.gz
- Redis Data: ${BACKUP_NAME}_redis.rdb.gz
- Uploads: ${BACKUP_NAME}_uploads.tar.gz
- Environment: ${BACKUP_NAME}_env.tar.gz
EOF

echo "==================================="
echo "Backup completed successfully!"
echo "Backup location: $BACKUP_DIR"
echo "Backup name: ${BACKUP_NAME}"

# Optional: Upload to S3
if [ ! -z "$AWS_S3_BUCKET" ]; then
    echo "Uploading to S3..."
    aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}_mysql.sql.gz" "s3://${AWS_S3_BUCKET}/backups/"
    aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}_redis.rdb.gz" "s3://${AWS_S3_BUCKET}/backups/"
    aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" "s3://${AWS_S3_BUCKET}/backups/"
    aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}_env.tar.gz" "s3://${AWS_S3_BUCKET}/backups/"
    aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}_manifest.txt" "s3://${AWS_S3_BUCKET}/backups/"
    echo "S3 upload completed!"
fi

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "rezom_backup_*" -mtime +7 -delete
echo "Old backups cleaned up (keeping last 7 days)"