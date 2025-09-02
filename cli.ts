#!/usr/bin/env tsx

import { Command } from 'commander';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from 'dotenv';
import { z } from 'zod';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

config();

interface Config {
  baseUrl: string;
  adminEmail: string;
  adminPassword: string;
}

interface AuthenticatedClient {
  client: AxiosInstance;
  token: string;
}

const KeywordSchema = z.object({
  label: z.string(),
  position: z.number().optional(),
  active: z.boolean().optional(),
});

const KeywordsFileSchema = z.object({
  keywords: z.array(KeywordSchema),
});

const QuestionSchema = z.object({
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  conceptSlug: z.string(),
});

const QuestionsFileSchema = z.object({
  questions: z.array(QuestionSchema),
});

function getConfig(): Config {
  const baseUrl = process.env.BASE_URL;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!baseUrl || !adminEmail || !adminPassword) {
    console.error(chalk.red('Missing required environment variables:'));
    console.error(chalk.red('- BASE_URL'));
    console.error(chalk.red('- ADMIN_EMAIL'));  
    console.error(chalk.red('- ADMIN_PASSWORD'));
    console.error(chalk.yellow('Create a .env file with these values'));
    process.exit(1);
  }

  return { baseUrl, adminEmail, adminPassword };
}

async function authenticate(config: Config): Promise<AuthenticatedClient> {
  const spinner = ora('Authenticating...').start();
  
  try {
    const response = await axios.post(`${config.baseUrl}/auth/login`, {
      email: config.adminEmail,
      password: config.adminPassword,
    });

    const { accessToken } = response.data;
    
    const client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    spinner.succeed('Authentication successful');
    return { client, token: accessToken };
  } catch (error) {
    spinner.fail('Authentication failed');
    handleAxiosError(error);
    process.exit(1);
  }
}

function handleAxiosError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      console.error(chalk.red(`HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`));
      if (axiosError.response.data) {
        console.error(chalk.red(JSON.stringify(axiosError.response.data, null, 2)));
      }
    } else if (axiosError.request) {
      console.error(chalk.red('No response received from server'));
      console.error(chalk.red(axiosError.message));
    } else {
      console.error(chalk.red('Request setup error:', axiosError.message));
    }
  } else {
    console.error(chalk.red('Unexpected error:', error));
  }
}

async function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(chalk.red('File validation failed:'));
      error.issues.forEach(issue => {
        console.error(chalk.red(`- ${issue.path.join('.')}: ${issue.message}`));
      });
    } else {
      console.error(chalk.red(`Failed to read file ${filePath}:`), error);
    }
    process.exit(1);
  }
}

async function readYamlOrJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    
    let parsed: unknown;
    if (ext === '.yaml' || ext === '.yml') {
      parsed = yaml.load(content);
    } else {
      parsed = JSON.parse(content);
    }
    
    return schema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(chalk.red('File validation failed:'));
      error.issues.forEach(issue => {
        console.error(chalk.red(`- ${issue.path.join('.')}: ${issue.message}`));
      });
    } else {
      console.error(chalk.red(`Failed to read file ${filePath}:`), error);
    }
    process.exit(1);
  }
}

async function uploadKeywords(options: {
  slug: string;
  file: string;
  dryRun?: boolean;
}) {
  const config = getConfig();
  
  const keywordsData = await readJsonFile(options.file, KeywordsFileSchema);
  
  if (options.dryRun) {
    console.log(chalk.yellow('DRY RUN MODE - Would upload:'));
    console.log(chalk.blue(`Slug: ${options.slug}`));
    console.log(chalk.blue(`Keywords (${keywordsData.keywords.length}):`));
    keywordsData.keywords.forEach((keyword, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${keyword.label} (pos: ${keyword.position || 'auto'}, active: ${keyword.active !== false})`));
    });
    return;
  }

  const { client } = await authenticate(config);
  const spinner = ora(`Uploading ${keywordsData.keywords.length} keywords for concept "${options.slug}"...`).start();

  try {
    await client.put(`/define/concepts/${options.slug}/keywords`, {
      keywords: keywordsData.keywords,
    });

    spinner.succeed(chalk.green(`Successfully uploaded ${keywordsData.keywords.length} keywords`));
  } catch (error) {
    spinner.fail('Failed to upload keywords');
    handleAxiosError(error);
    process.exit(1);
  }
}

async function uploadQuestions(options: {
  file: string;
  dryRun?: boolean;
  concurrency?: number;
}) {
  const config = getConfig();
  const concurrency = options.concurrency || 5;
  
  const questionsData = await readYamlOrJsonFile(options.file, QuestionsFileSchema);
  
  if (options.dryRun) {
    console.log(chalk.yellow('DRY RUN MODE - Would upload:'));
    console.log(chalk.blue(`Questions (${questionsData.questions.length}):`));
    questionsData.questions.forEach((question, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${question.title}`));
      console.log(chalk.gray(`     Concept: ${question.conceptSlug}`));
      console.log(chalk.gray(`     Tags: ${question.tags?.join(', ') || 'none'}`));
      console.log(chalk.gray(`     Keywords: ${question.keywords?.join(', ') || 'none'}`));
    });
    return;
  }

  const { client } = await authenticate(config);
  
  const spinner = ora(`Uploading ${questionsData.questions.length} questions with concurrency ${concurrency}...`).start();
  
  const successful: string[] = [];
  const failed: { question: string; error: string }[] = [];

  const uploadQuestion = async (question: typeof questionsData.questions[0]) => {
    try {
      await client.post('/questions', {
        title: question.title,
        content: question.content,
        tags: question.tags || [],
        keywords: question.keywords || [],
        conceptSlug: question.conceptSlug,
      });
      successful.push(question.title);
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data?.message || error.response.statusText;
      }
      failed.push({ question: question.title, error: errorMessage });
    }
  };

  const chunks = [];
  for (let i = 0; i < questionsData.questions.length; i += concurrency) {
    chunks.push(questionsData.questions.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map(uploadQuestion));
    spinner.text = `Progress: ${successful.length + failed.length}/${questionsData.questions.length}`;
  }

  if (failed.length === 0) {
    spinner.succeed(chalk.green(`Successfully uploaded all ${successful.length} questions`));
  } else {
    spinner.fail(`Upload completed with ${failed.length} failures`);
    console.log(chalk.green(`✓ Successful: ${successful.length}`));
    console.log(chalk.red(`✗ Failed: ${failed.length}`));
    
    if (failed.length > 0) {
      console.log(chalk.red('\nFailed uploads:'));
      failed.forEach(({ question, error }) => {
        console.log(chalk.red(`- ${question}: ${error}`));
      });
    }
  }
}

async function purgeDefine(options: {
  slug: string;
  dryRun?: boolean;
}) {
  const config = getConfig();
  
  if (options.dryRun) {
    console.log(chalk.yellow('DRY RUN MODE - Would purge cache for:'));
    console.log(chalk.blue(`Concept slug: ${options.slug}`));
    return;
  }

  const { client } = await authenticate(config);
  const spinner = ora(`Purging cache for concept "${options.slug}"...`).start();

  try {
    await client.post('/admin/cache/purge', {
      scope: 'define',
      slug: options.slug,
    });

    spinner.succeed(chalk.green(`Successfully purged cache for concept "${options.slug}"`));
  } catch (error) {
    spinner.fail('Failed to purge cache');
    handleAxiosError(error);
    process.exit(1);
  }
}

const program = new Command();

program
  .name('rezom-admin')
  .description('TypeScript-based Node.js CLI tool for Rezom admin operations')
  .version('1.0.0');

program
  .command('upload-keywords')
  .description('Upload keywords for a concept')
  .requiredOption('--slug <slug>', 'Concept slug')
  .requiredOption('--file <path>', 'Path to keywords JSON file')
  .option('--dry-run', 'Print payloads instead of sending requests')
  .action(uploadKeywords);

program
  .command('upload-questions')
  .description('Upload questions from YAML/JSON file')
  .requiredOption('--file <path>', 'Path to questions YAML/JSON file')
  .option('--dry-run', 'Print payloads instead of sending requests')
  .option('--concurrency <n>', 'Concurrency level for bulk uploads', '5')
  .action((options) => {
    uploadQuestions({
      ...options,
      concurrency: parseInt(options.concurrency, 10),
    });
  });

program
  .command('purge-define')
  .description('Purge cache for a concept')
  .requiredOption('--slug <slug>', 'Concept slug')
  .option('--dry-run', 'Print payloads instead of sending requests')
  .action(purgeDefine);

program.parse();