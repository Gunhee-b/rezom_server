/// <reference types="jest" />
import request from 'supertest';
import { uniqueEmail } from './_utils';

const base = 'http://localhost:3000';   // localhost 로 고정 (쿠키 도메인 매칭)
describe('Auth E2E', () => {
  const agent = request.agent(base);    // 쿠키 유지
  let accessToken = '';
  let csrf = '';

  it('register -> set cookies + accessToken', async () => {
    const email = uniqueEmail('auth');
    const res = await agent
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ email, password: 'Passw0rd!', displayName: 'E2E1' });

    // 상태코드: 201 or <400 허용
    expect(res.status).toBeLessThan(400);
    expect(res.body.accessToken).toBeTruthy();
    accessToken = res.body.accessToken;

    const setCookies = (res.headers['set-cookie'] || []) as string[];
    // refresh 쿠키 존재
    expect(setCookies.join(';')).toContain('rezom_rt=');
    // csrf 쿠키 존재
    const csrfCookie = setCookies.find((c) => c.startsWith('X-CSRF-Token='));
    expect(csrfCookie).toBeTruthy();
    csrf = decodeURIComponent(String(csrfCookie).split(';')[0].split('=')[1]);
  });

  it('me with accessToken', async () => {
    const res = await agent.get('/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toContain('@example.com'); // 막 가입한 메일
  });

  it('refresh (cookie + csrf)', async () => {
    const res = await agent.post('/auth/refresh').set('X-CSRF-Token', csrf);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });
});
