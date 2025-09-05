/// <reference types="jest" />
import request from 'supertest';
const base = 'http://localhost:3000';

describe('App (e2e)', () => {
  it('/health (GET)', async () => {
    const res = await request(base).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
