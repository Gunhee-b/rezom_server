import request from 'supertest';

const base = 'http://localhost:3000';

describe('Daily E2E', () => {
  it('GET /questions/daily returns object', async () => {
    const res = await request(base).get('/questions/daily');
    expect(res.status).toBe(200);
    expect(res.body?.id).toBeTruthy();
  });
});