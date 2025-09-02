// File: src/tools/db-check.ts
// Purpose: Run DB integrity checks without MySQL CLI, using Prisma + Node.
// Usage: npm run db:check

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pretty logger
const log = {
  pass: (msg: string) => console.log(`✅ ${msg}`),
  warn: (msg: string) => console.warn(`⚠️  ${msg}`),
  fail: (msg: string) => console.error(`❌ ${msg}`),
};

// Exit with non-zero if any check fails
let failed = false;

/** Expect a COUNT(*) query to return 0. Marks failure otherwise. */
async function expectZero(sql: string, label: string) {
  const [row]: any = await prisma.$queryRawUnsafe(sql);
  const n = Number(row?.n ?? row?.count ?? Object.values(row ?? {})[0] ?? 0);
  if (n === 0) log.pass(`${label}: 0`);
  else {
    log.fail(`${label}: ${n}`);
    failed = true;
  }
}

// ──[ Index check utilities ]──────────────────────────────────────────────

/** PRIMARY KEY must match expected column combo (comma-separated, in order). */
async function expectPrimaryKey(table: string, expectedColsCombo: string) {
  // SHOW KEYS / SHOW INDEX is the most robust across MySQL variants
  const rows = await prisma.$queryRawUnsafe<any[]>(`SHOW KEYS FROM \`${table}\``);
  // Rows look like: { Table, Non_unique, Key_name, Seq_in_index, Column_name, ... }
  const pk = rows
    .filter(r => String(r.Key_name).toUpperCase() === 'PRIMARY')
    .sort((a, b) => Number(a.Seq_in_index) - Number(b.Seq_in_index));
  const got = pk.map(r => String(r.Column_name)).join(',');
  if (got === expectedColsCombo) {
    log.pass(`${table} primary key OK`);
  } else {
    log.warn(`${table} missing/incorrect PRIMARY KEY -> expected ${expectedColsCombo}, got ${got || '(none)'}`);
  }
}

/** Non-primary indexes: check presence by column combo (names ignored). */
async function expectNonPrimaryIndexes(table: string, expectedCombos: string[]) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index) AS cols
       FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = '${table}'
        AND index_name <> 'PRIMARY'
      GROUP BY index_name`
  );
  const gotCombos = new Set(rows.map((r) => String(r.cols)));
  const missing = expectedCombos.filter((c) => !gotCombos.has(c));
  if (missing.length === 0) log.pass(`${table} indexes OK`);
  else log.warn(`${table} missing index columns ->\n  ${missing.join('\n  ')}`);
}

/** Unique index: verify both the column combo AND uniqueness (non_unique = 0). */
async function expectUniqueIndex(table: string, expectedCombo: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index) AS cols,
            MIN(non_unique) AS non_unique
       FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = '${table}'
        AND index_name <> 'PRIMARY'
      GROUP BY index_name`
  );
  const match = rows.find((r) => String(r.cols) === expectedCombo);
  if (match && Number(match.non_unique) === 0) log.pass(`${table} unique index OK (${expectedCombo})`);
  else if (match) log.warn(`${table} index on (${expectedCombo}) exists but is NOT unique`);
  else log.warn(`${table} missing UNIQUE index -> ${expectedCombo}`);
}

async function main() {
  // 0) Can connect?
  await prisma.$queryRawUnsafe('SELECT 1');
  log.pass('Connection OK');

  // 1) Orphan checks (should be 0)
  await expectZero(
    `SELECT COUNT(*) AS n
       FROM Answer a
  LEFT JOIN Question q ON q.id = a.questionId
      WHERE q.id IS NULL;`,
    'Answers without existing Question'
  );

  await expectZero(
    `SELECT COUNT(*) AS n
       FROM Comment c
      WHERE (c.questionId IS NULL AND c.answerId IS NULL);`,
    'Comments with no parent reference'
  );

  await expectZero(
    `SELECT COUNT(*) AS n
       FROM Comment c
  LEFT JOIN Question q ON q.id = c.questionId
      WHERE c.questionId IS NOT NULL AND q.id IS NULL;`,
    'Comments pointing to missing Question'
  );

  await expectZero(
    `SELECT COUNT(*) AS n
       FROM Comment c
  LEFT JOIN Answer a ON a.id = c.answerId
      WHERE c.answerId IS NOT NULL AND a.id IS NULL;`,
    'Comments pointing to missing Answer'
  );

  await expectZero(
    `SELECT COUNT(*) AS n
       FROM Follow f
  LEFT JOIN User u1 ON u1.id = f.followerId
  LEFT JOIN User u2 ON u2.id = f.followeeId
      WHERE u1.id IS NULL OR u2.id IS NULL;`,
    'Follows with missing users'
  );

  await expectZero(
    `SELECT COUNT(*) AS n
       FROM Notification n
  LEFT JOIN User u ON u.id = n.userId
      WHERE u.id IS NULL;`,
    'Notifications with missing user'
  );

  // 2) Index checks (warn only; fail=false)
  await expectPrimaryKey('Question', 'id');
  await expectNonPrimaryIndexes('Question', ['authorId,createdAt', 'categoryId,createdAt']);

  await expectPrimaryKey('Answer', 'id');
  await expectNonPrimaryIndexes('Answer', ['questionId,createdAt']);

  await expectPrimaryKey('Comment', 'id');
  await expectNonPrimaryIndexes('Comment', ['questionId,createdAt', 'answerId,createdAt']);

  await expectPrimaryKey('Follow', 'id');
  await expectUniqueIndex('Follow', 'followerId,followeeId');

  await expectPrimaryKey('Notification', 'id');
  await expectNonPrimaryIndexes('Notification', ['userId,isRead,createdAt']);

  await prisma.$disconnect();
  if (failed) process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
