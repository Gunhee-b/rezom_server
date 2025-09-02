"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
// src/infrastructure/prisma/prisma.service.ts (경로는 네 프로젝트에 맞춰)
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService extends client_1.PrismaClient {
    async onModuleInit() {
        await this.connectWithRetry();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async connectWithRetry(maxAttempts = 10, baseMs = 300) {
        let attempt = 0;
        // 지수 백오프(최대 ~10초 내외)
        while (true) {
            try {
                await this.$connect();
                return;
            }
            catch (err) {
                attempt++;
                if (attempt >= maxAttempts) {
                    throw err;
                }
                const wait = Math.min(baseMs * 2 ** (attempt - 1), 2000);
                // eslint-disable-next-line no-console
                console.warn(`[Prisma] connect failed (attempt ${attempt}/${maxAttempts}). retry in ${wait}ms`);
                await new Promise((r) => setTimeout(r, wait));
            }
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map