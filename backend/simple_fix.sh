#!/bin/bash

# 1. 모든 @Optional() Redis 주입을 any 타입으로 변경
find src/ -name "*.ts" -exec sed -i 's/@Optional.*redis.*RedisService/@Optional() private readonly redis?: any/g' {} \;

# 2. pickRedisClient 함수를 각 파일에서 제거하고 간단한 null 체크로 변경
files=(
  "src/jobs/daily-question.job.ts"
  "src/modules/admin/admin.service.ts" 
  "src/modules/questions/daily.controller.ts"
  "src/modules/questions/questions.controller.ts"
)

for file in "${files[@]}"; do
  # pickRedisClient 사용을 간단한 null 체크로 변경
  sed -i 's/pickRedisClient(this\.redis)/this.redis?.client/g' "$file"
  # 함수 정의 제거
  sed -i '/function pickRedisClient/,/^}/d' "$file"
  # import 제거
  sed -i '/import.*pickRedisClient/d' "$file"
done

# 3. rate-limit.guard.ts는 간단하게
sed -i 's/this\.redis\.client\./this.redis?.client?./g' src/common/guards/rate-limit.guard.ts

echo "간단 수정 완료"
