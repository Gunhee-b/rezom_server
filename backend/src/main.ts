// src/main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import cookieParser from 'cookie-parser';
import { INestApplication, Logger } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';

const raw = process.env.FRONTEND_ORIGIN || '';
const ALLOWLIST = raw
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

// 안전하게 에러 메시지 뽑기
function errMsg(e: unknown): string {
  if (typeof e === 'string') return e;
  const anyE = e as any;
  return (anyE && (anyE.message || (typeof anyE.toString === 'function' ? anyE.toString() : ''))) || String(anyE);
}

// 라우트 덤프 (Swagger + Express + Fastify 모두 시도)
async function dumpRoutes(app: INestApplication, swaggerDoc?: any) {
  const logger = new Logger('ROUTES');

  // 1) Swagger에 등록된 경로
  try {
    const paths = Object.keys(swaggerDoc?.paths || {}).sort();
    logger.log(`Swagger paths (${paths.length})`);
    paths.forEach(p => logger.log(`- ${p}`));
  } catch (e) {
    logger.warn('Swagger dump failed: ' + errMsg(e));
  }

  // 2) Express 라우터 스택
  try {
    const inst: any = app.getHttpAdapter().getInstance();
    const stack = inst?._router?.stack ?? inst?.router?.stack ?? [];
    if (Array.isArray(stack) && stack.length) {
      const routes = stack
        .filter((l: any) => l && l.route)
        .map((l: any) => {
          const methods = Object.keys(l.route.methods || {}).join(',').toUpperCase();
          return `${methods.padEnd(12)} ${l.route.path}`;
        })
        .sort();
      logger.log('Express routes:\n' + routes.join('\n'));
    } else {
      logger.warn('Express router stack not found (might be Fastify).');
    }
  } catch (e) {
    logger.warn('Express routes dump failed: ' + errMsg(e));
  }

  // 3) Fastify printRoutes()
  try {
    const inst: any = app.getHttpAdapter().getInstance();
    if (typeof inst?.printRoutes === 'function') {
      logger.log('Fastify routes (below):');
      logger.log(inst.printRoutes());
    }
  } catch (e) {
    logger.warn('Fastify routes dump failed: ' + errMsg(e));
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.enableCors({
    origin: ALLOWLIST.length ? ALLOWLIST : [/\.rezom\.org$/],
    credentials: true,
  });

  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(GlobalValidationPipe);

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Rezom API')
    .setDescription('Rezom backend API docs')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addCookieAuth(process.env.REFRESH_COOKIE_NAME ?? 'rezom_rt')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, doc);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);

  // ✅ 라우트 덤프 호출 (Swagger doc 제공)
  await dumpRoutes(app, doc);

// bootstrap 마지막에 dumpRoutes(app, doc) 다음 줄에 추가:
try {
  const container = app.get(ModulesContainer);
  const lines: string[] = [];
  for (const [, m] of container.entries()) {
    const name = m.metatype?.name || '(anonymous)';
    if (name === 'DefineModule' || name === 'AdminModule') {
      lines.push(`${name} controllers=${m.controllers?.size ?? 0}`);
      for (const c of m.controllers.values()) {
        lines.push(` - ${c.metatype?.name}`);
      }
    }
  }
  console.log('[MODULES]\n' + (lines.join('\n') || '(no Define/Admin found)'));
} catch (e) {
  console.warn('[MODULES] dump failed:', e);
}
}

bootstrap();
