#!/bin/bash

# Redis 관련 코드를 모두 주석처리
find src/ -name "*.ts" -exec sed -i 's/^.*this\.redis.*$/\/\/ &/' {} \;
find src/ -name "*.ts" -exec sed -i 's/^.*@Optional.*redis.*$/\/\/ &/' {} \;

echo "Redis 완전 비활성화"
