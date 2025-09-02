"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const prisma = new client_1.PrismaClient();
async function main() {
    // 1) Categories (name 기반 upsert)
    const categories = [
        { name: 'Philosophy' },
        { name: 'Economics' },
        { name: 'Science' },
        { name: 'Society' },
    ];
    for (const c of categories) {
        await prisma.category.upsert({
            where: { name: c.name }, // ← name이 unique
            update: {},
            create: c,
        });
    }
    // 2) Demo user
    const passwordHash = await argon2.hash('rezom1234!');
    const demo = await prisma.user.upsert({
        where: { email: 'demo@rezom.org' },
        update: {},
        create: {
            email: 'demo@rezom.org',
            passwordHash,
            displayName: 'Rezom Demo',
            role: client_1.UserRole.USER,
            // Profile 모델이 존재할 때만 사용하세요.
            // profile: { create: { bio: 'Hello Rezom', links: [{ url: 'https://rezom.org' }] as any } },
        },
    });
    // 3) One daily question
    const cat = await prisma.category.findFirst({ where: { name: 'Philosophy' } });
    if (cat) {
        await prisma.question.create({
            data: {
                authorId: demo.id,
                categoryId: cat.id,
                title: '오늘의 질문: 당신의 신념을 한 문장으로 요약한다면?',
                body: '신념의 뿌리를 찾고 연결해보세요.',
                isDaily: true,
                tags: ['daily', 'belief'], // Json 필드
            },
        });
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map