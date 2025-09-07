// Script to create sample questions for /analyze page
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAnalyzeQuestions() {
  // Find admin user and category
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@rezom.org' }
  });
  
  const category = await prisma.category.findFirst({
    where: { name: 'Society' } // or another appropriate category
  });

  if (!admin || !category) {
    console.error('Admin user or category not found');
    return;
  }

  // Sample questions for analyze-world
  const analyzeQuestions = [
    {
      title: 'How do economic systems influence social equality?',
      body: 'Examine the relationship between different economic models and their impact on social stratification.',
      tags: ['analyze-world', 'economics', 'society']
    },
    {
      title: 'What role does technology play in modern governance?',
      body: 'Analyze how digital technologies are transforming political systems and democratic processes.',
      tags: ['analyze-world', 'technology', 'politics']
    },
    {
      title: 'How do global supply chains affect local communities?',
      body: 'Investigate the impact of international trade networks on local economies and cultures.',
      tags: ['analyze-world', 'economics', 'globalization']
    },
    {
      title: 'What are the systemic causes of environmental degradation?',
      body: 'Examine the interconnected systems that contribute to environmental challenges.',
      tags: ['analyze-world', 'environment', 'systems']
    },
    {
      title: 'How do power structures shape information flow in society?',
      body: 'Analyze how institutional power affects what information reaches the public.',
      tags: ['analyze-world', 'politics', 'media']
    }
  ];

  // Create questions
  for (const questionData of analyzeQuestions) {
    await prisma.question.create({
      data: {
        authorId: admin.id,
        categoryId: category.id,
        title: questionData.title,
        body: questionData.body,
        tags: questionData.tags,
        updatedAt: new Date(),
      },
    });
    console.log(`Created question: ${questionData.title}`);
  }

  console.log(`Created ${analyzeQuestions.length} questions for /analyze page`);
}

createAnalyzeQuestions()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });