#!/bin/bash

# Redis helper 완전 삭제
rm -f src/common/helpers/redis.helper.ts

# 각 파일에서 우리가 추가한 모든 import 제거
files=(
  "src/jobs/daily-question.job.ts"
  "src/modules/admin/admin.service.ts"
  "src/modules/questions/daily.controller.ts" 
  "src/modules/questions/questions.controller.ts"
  "src/common/guards/rate-limit.guard.ts"
)

for file in "${files[@]}"; do
  # 우리가 추가한 import들 모두 제거
  sed -i '/import.*redis\.helper/d' "$file"
  sed -i '/import.*safeRedisOperation/d' "$file" 
  sed -i '/import.*pickRedisClient/d' "$file"
done

echo "파일 초기화 완료"
