// helpers in test/_utils.ts (새 파일)
export const uniqueEmail = (prefix = 'e2e') =>
    `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2,8)}@example.com`;
  