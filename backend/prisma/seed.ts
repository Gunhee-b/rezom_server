// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

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
      role: UserRole.USER,
      // Profile 모델이 존재할 때만 사용하세요.
      // profile: { create: { bio: 'Hello Rezom', links: [{ url: 'https://rezom.org' }] as any } },
    },
  });

  // 2-1) Admin user (ADMIN)  ✅ 추가
  const adminPw = await argon2.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin!2345');
  await prisma.user.upsert({
    where: { email: 'admin@rezom.org' },
    update: { displayName: 'Rezom Admin', role: UserRole.ADMIN, passwordHash: adminPw },
    create: { email: 'admin@rezom.org', passwordHash: adminPw, displayName: 'Rezom Admin', role: UserRole.ADMIN },
  });

  // 3) Create Concepts for /define functionality
  const concepts = [
    {
      slug: 'language-definition',
      title: 'Language Definition',
      description: 'Exploring the nature and structure of language and meaning'
    },
    {
      slug: 'happiness',
      title: 'Happiness', 
      description: 'Understanding the nature of happiness and well-being'
    },
    {
      slug: 'creativity',
      title: 'Creativity',
      description: 'Examining creative processes and innovation'
    }
  ];

  for (const conceptData of concepts) {
    await prisma.concept.upsert({
      where: { slug: conceptData.slug },
      update: {},
      create: {
        ...conceptData,
        createdById: demo.id,
      },
    });
  }

  // 4) Create default keywords for language-definition concept
  const languageConcept = await prisma.concept.findUnique({
    where: { slug: 'language-definition' }
  });

  if (languageConcept) {
    const defaultKeywords = [
      { keyword: 'Innovation', position: 1, active: true },
      { keyword: 'Creativity', position: 2, active: true },
      { keyword: 'Purpose', position: 3, active: true },
      { keyword: 'Growth', position: 4, active: true },
      { keyword: 'Impact', position: 5, active: true },
    ];

    for (const kw of defaultKeywords) {
      await prisma.conceptKeyword.upsert({
        where: {
          conceptId_position: {
            conceptId: languageConcept.id,
            position: kw.position,
          }
        },
        update: {},
        create: {
          conceptId: languageConcept.id,
          ...kw,
        },
      });
    }
  }

  // 5) One daily question
  const cat = await prisma.category.findFirst({ where: { name: 'Philosophy' } });
  if (cat) {
    await prisma.question.create({
      data: {
        authorId: demo.id,
        categoryId: cat.id,
        title: '오늘의 질문: 당신의 신념을 한 문장으로 요약한다면?',
        body: '신념의 뿌리를 찾고 연결해보세요.',
        isDaily: true,
        tags: ['daily', 'belief'] as any, // Json 필드
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
