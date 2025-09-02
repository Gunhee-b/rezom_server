#!/bin/bash
echo "🔧 Redis 타입 에러 일괄 수정 중..."

# 1. 모든 파일에 적절한 import 추가
sed -i '1i import { pickRedisClient, safeRedisOperation } from "../../common/helpers/redis.helper";' src/modules/admin/admin.service.ts
sed -i '1i import { pickRedisClient, safeRedisOperation } from "../../common/helpers/redis.helper";' src/modules/questions/daily.controller.ts  
sed -i '1i import { pickRedisClient, safeRedisOperation } from "../../common/helpers/redis.helper";' src/modules/questions/questions.controller.ts
sed -i '1i import { pickRedisClient, safeRedisOperation } from "../common/helpers/redis.helper";' src/jobs/daily-question.job.ts
sed -i '1i import { safeRedisOperation } from "../helpers/redis.helper";' src/common/guards/rate-limit.guard.ts

# 2. 기존 함수 정의 및 import 제거
sed -i '/function pickRedisClient/,/^}/d' src/jobs/daily-question.job.ts
sed -i "/import.*redis\.service/d" src/jobs/daily-question.job.ts

# 3. 직접 Redis 호출을 안전한 호출로 변경
files_to_fix=(
  "src/common/guards/rate-limit.guard.ts"
  "src/jobs/daily-question.job.ts"  
)

for file in "${files_to_fix[@]}"; do
  sed -i 's/this\.redis\.client\./safeRedisOperation(this.redis, (client) => client./g' "$file"
  sed -i 's/, (client) => client\./, (client) => client./g' "$file"  # 중복 수정
done

echo "✅ 모든 Redis 에러 수정 완료!"
echo "🔥 이제 'npm run build' 실행하세요!"
