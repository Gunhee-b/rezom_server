# ReZom Q&A Platform - Complete Project Documentation

## Project Overview

**Version**: 1.4.0  
**Status**: Production Ready  
**Architecture**: Monorepo with NestJS Backend + React Frontend + Admin Panel  
**Deployment**: AWS EC2 with Docker Compose  

ReZom is a comprehensive Q&A platform focused on social analysis and world understanding, featuring real-time updates, curated content management, and interactive knowledge graphs.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Development Setup](#development-setup)
6. [Deployment Guide](#deployment-guide)
7. [API Documentation](#api-documentation)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

---

## System Architecture

### Overview
```
┌─────────────────────────────────────────────────────┐
│                    NGINX (SSL/Proxy)                 │
├──────────┬──────────────┬──────────────┬────────────┤
│          │              │              │            │
│  rezom.org  api.rezom.org  admin.rezom.org         │
│     ↓            ↓              ↓                   │
│  Frontend    Backend        Admin Panel             │
│  (React)     (NestJS)         (React)              │
│     ↓            ↓              ↓                   │
│          MySQL Database (Prisma ORM)                │
│                    ↓                                │
│             Redis (Sessions)                        │
└─────────────────────────────────────────────────────┘
```

### Component Details

- **Frontend (Port 8080)**: React 18 with TypeScript, Vite, TailwindCSS
- **Backend (Port 3000)**: NestJS with Prisma ORM, JWT authentication
- **Admin Panel (Port 8081)**: Separate React application for content management
- **Database**: MySQL 8.0 with Prisma migrations
- **Cache**: Redis for session management
- **Reverse Proxy**: NGINX with SSL termination

---

## Features

### Core Functionality

1. **Authentication System**
   - JWT-based authentication with refresh tokens
   - CSRF protection
   - 4-hour session duration
   - Secure cookie handling

2. **Question & Answer System**
   - Create, read, update questions
   - Answer submission with titles
   - Category-based organization
   - Tag support

3. **Analyzing the World (세상분석)**
   - Special category for social analysis
   - Top-5 curated questions
   - Interactive graph visualization
   - Keyword relationships

4. **Real-time Updates**
   - Server-Sent Events (SSE) for live updates
   - Automatic refresh of daily questions
   - Live notification system

5. **Admin Management**
   - Daily question selection
   - Top-5 question curation
   - User management
   - Cache purging

6. **Define Graph System**
   - Interactive mind-map visualization
   - Concept relationships
   - Keyword management
   - Question linking

---

## Technology Stack

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: MySQL 8.0
- **ORM**: Prisma 5.x
- **Authentication**: JWT + Passport
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator
- **Security**: Helmet, CORS, CSRF

### Frontend
- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Styling**: TailwindCSS 3.x
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library

### Infrastructure
- **Container**: Docker + Docker Compose
- **Web Server**: NGINX
- **Process Manager**: PM2
- **SSL**: Let's Encrypt
- **Monitoring**: Health checks

---

## Project Structure

```
rezom_server/
├── backend/                # NestJS backend application
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/      # Authentication
│   │   │   ├── users/     # User management
│   │   │   ├── questions/ # Q&A functionality
│   │   │   ├── answers/   # Answer management
│   │   │   ├── define/    # Graph system
│   │   │   └── admin/     # Admin endpoints
│   │   ├── common/        # Shared utilities
│   │   ├── prisma/        # Database schema
│   │   └── main.ts        # Application entry
│   └── prisma/
│       └── schema.prisma  # Database schema
│
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── api/          # API client
│   │   ├── shared/       # Shared utilities
│   │   └── App.tsx       # Main application
│   └── public/           # Static assets
│
├── admin/                # Admin panel application
│   └── src/              # Similar structure to frontend
│
├── nginx/                # NGINX configuration
│   ├── sites-enabled/    # Site configurations
│   └── ssl/              # SSL certificates
│
├── scripts/              # Deployment and utility scripts
├── docker-compose.production.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── Dockerfile.admin
```

---

## Development Setup

### Prerequisites
- Node.js 20.x
- MySQL 8.0
- Redis 7.x
- Docker & Docker Compose

### Local Development

1. **Clone Repository**
```bash
git clone https://github.com/Gunhee-b/rezom_server.git
cd rezom_server
```

2. **Environment Setup**
```bash
# Copy environment variables
cp .env.example .env

# Update .env with your configuration
DATABASE_URL="mysql://user:password@localhost:3306/rezom"
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:5173"
```

3. **Backend Setup**
```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

4. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

5. **Admin Panel Setup**
```bash
cd admin
npm install
npm run dev
```

### Docker Development
```bash
docker-compose -f docker-compose.dev.yml up
```

---

## Deployment Guide

### AWS EC2 Deployment

#### Prerequisites
- EC2 instance (t3.medium recommended)
- Domain names configured
- SSL certificates

#### Deployment Steps

1. **Server Setup**
```bash
# Connect to server
ssh -i your-key.pem ec2-user@your-server-ip

# Clone repository
git clone https://github.com/Gunhee-b/rezom_server.git
cd rezom_server
```

2. **Environment Configuration**
```bash
# Create production .env
vim .env.production

# Required variables:
DATABASE_URL=mysql://root:password@mysql:3306/rezom
JWT_SECRET=production-secret
CORS_ORIGIN=https://rezom.org,https://admin.rezom.org
NODE_ENV=production
```

3. **SSL Setup**
```bash
# Install certbot
sudo yum install -y certbot

# Generate certificates
sudo certbot certonly --standalone \
  -d rezom.org \
  -d www.rezom.org \
  -d api.rezom.org \
  -d admin.rezom.org
```

4. **Deploy with Docker**
```bash
# Build and start services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker ps
docker logs rezom-backend
```

5. **Database Setup**
```bash
# Run migrations
docker exec rezom-backend npx prisma migrate deploy

# Seed initial data (if needed)
docker exec rezom-backend npm run seed
```

### Monitoring
```bash
# Check service health
curl https://api.rezom.org/health

# View logs
docker logs -f rezom-backend
docker logs -f rezom-frontend

# Check NGINX
docker exec rezom-nginx nginx -t
```

---

## API Documentation

### Base URLs
- Development: `http://localhost:3000`
- Production: `https://api.rezom.org`
- Swagger Docs: `/docs`

### Authentication Endpoints

#### Login
```
POST /auth/login
Body: { "email": "user@example.com", "password": "password" }
Response: { "access_token": "...", "user": {...} }
```

#### Register
```
POST /auth/register
Body: { "email": "...", "password": "...", "name": "..." }
```

#### Refresh Token
```
POST /auth/refresh
Cookies: rezom_rt=refresh_token
```

### Question Endpoints

#### List Questions
```
GET /questions
GET /questions?categoryId=4  # Analyze World category
```

#### Create Question
```
POST /questions
Headers: Authorization: Bearer <token>
Body: {
  "title": "Question title",
  "body": "Question content",
  "categoryId": 4,
  "tags": ["analyze-world"]
}
```

#### Get Daily Question
```
GET /daily/question
```

### Admin Endpoints

#### Set Daily Question
```
POST /admin/daily-question
Body: { "questionId": 123 }
```

#### Update Top-5 Questions
```
POST /admin/define/analyze-world/top5
Body: { "questionIds": [1, 2, 3, 4, 5] }
```

---

## Testing Guide

### Backend Testing
```bash
cd backend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

### Frontend Testing
```bash
cd frontend
npm run test          # Unit tests
npm run test:ui       # Vitest UI
```

### Manual Testing

#### SSE Live Updates
1. Open two browser windows
2. Login to both
3. Create question in one window
4. Verify update appears in other window

#### Authentication Flow
1. Register new user
2. Login with credentials
3. Access protected routes
4. Wait for token expiry (4 hours)
5. Verify refresh token works

---

## Troubleshooting

### Common Issues

#### CORS Errors
**Problem**: `Access-Control-Allow-Origin` header missing  
**Solution**: 
1. Check `CORS_ORIGIN` in `.env`
2. Restart backend container
3. Verify NGINX proxy headers

#### Authentication Issues
**Problem**: 401 Unauthorized errors  
**Solutions**:
1. Check token expiry
2. Verify refresh token cookie
3. Clear browser storage
4. Check CSRF token

#### SSE Connection Loops
**Problem**: Infinite reconnection attempts  
**Solution**: 
1. Check backend SSE endpoint
2. Verify NGINX buffering disabled
3. Monitor connection count

#### Database Connection
**Problem**: Prisma connection errors  
**Solution**:
1. Check `DATABASE_URL`
2. Verify MySQL is running
3. Check network connectivity
4. Run migrations

### Debug Commands

```bash
# Check container logs
docker logs rezom-backend --tail 100

# Database connection test
docker exec rezom-backend npx prisma db push --accept-data-loss

# Clear Redis cache
docker exec rezom-redis redis-cli FLUSHALL

# Restart services
docker-compose -f docker-compose.production.yml restart

# Check NGINX config
docker exec rezom-nginx nginx -t
```

---

## Maintenance

### Regular Tasks

#### Daily
- Monitor error logs
- Check disk space
- Verify backups

#### Weekly
- Update dependencies
- Review security alerts
- Performance monitoring

#### Monthly
- SSL certificate renewal
- Database optimization
- Security patches

### Backup Procedures

```bash
# Database backup
docker exec rezom-mysql mysqldump -u root -p rezom > backup.sql

# Full backup
tar -czf rezom-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /home/ec2-user/myapp
```

### Update Procedures

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose -f docker-compose.production.yml build

# Deploy updates
docker-compose -f docker-compose.production.yml up -d

# Run migrations
docker exec rezom-backend npx prisma migrate deploy
```

---

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, unique secrets
3. **Database**: Use parameterized queries (Prisma handles this)
4. **CORS**: Whitelist specific origins
5. **Rate Limiting**: Implemented on API routes
6. **HTTPS**: Always use SSL in production
7. **Headers**: Security headers via Helmet
8. **Input Validation**: class-validator on all inputs

---

## Performance Optimization

1. **Database**
   - Indexed foreign keys
   - Query optimization with Prisma
   - Connection pooling

2. **Caching**
   - Redis for sessions
   - Browser caching for static assets
   - API response caching

3. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Bundle size monitoring

4. **Backend**
   - Async operations
   - Efficient queries
   - Response compression

---

## Contact & Support

- **Repository**: https://github.com/Gunhee-b/rezom_server
- **Production**: https://rezom.org
- **API**: https://api.rezom.org
- **Admin**: https://admin.rezom.org

---

## Version History

- **v1.4.0** (Current) - CORS fixes, admin improvements
- **v1.3.2** - Authentication synchronization fixes
- **v1.3.0** - SSE implementation, live updates
- **v1.2.0** - Define graph system
- **v1.1.0** - Admin panel integration
- **v1.0.0** - Initial release

---

*Last Updated: September 2025*