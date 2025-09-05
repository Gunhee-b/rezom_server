# Rezom Backend (Prisma + NestJS)

## Quick Start
1) `cp .env.example .env`
2) `npm i`
3) `npm run db:up`
4) `npm run prisma:generate`
5) `npm run prisma:migrate`
6) `npm run seed`
7) `npm run dev` → http://localhost:3000/health , http://localhost:3000/docs

## Migrate (prod)
- Set `DATABASE_URL` to RDS
- `npm run prisma:deploy`
- (optional) `npm run seed`