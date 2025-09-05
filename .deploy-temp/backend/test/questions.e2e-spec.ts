/// <reference types="jest" />
import request from 'supertest';
import { uniqueEmail } from './_utils';

const base = 'http://localhost:3000';

describe('Questions E2E', () => {
  const agent = request.agent(base);
  let accessToken = '';
  let categoryId = 0;
  let qid = 0;

  beforeAll(async () => {
    // 항상 새 계정으로 가입
    const email = uniqueEmail('q');
    const r1 = await agent
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email, password: 'Passw0rd!', displayName: 'Q1' });
    expect(r1.status).toBeLessThan(400);
    accessToken = r1.body.accessToken;

    const r2 = await agent.get('/categories');
    expect(r2.status).toBe(200);
    if (!Array.isArray(r2.body) || r2.body.length === 0) {
      throw new Error('No categories. Seed at least one category.');
    }
    categoryId = r2.body[0].id;
  });

  it('create question', async () => {
    const res = await agent
      .post('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ categoryId, title: 'Hello', body: 'Body' });
    expect(res.status).toBeLessThan(400);
    qid = res.body.id;
  });

  it('get question by id', async () => {
    const res = await agent.get(`/questions/${qid}`);
    expect(res.status).toBe(200);
    expect(res.body?.id).toBe(qid);
  });
});
