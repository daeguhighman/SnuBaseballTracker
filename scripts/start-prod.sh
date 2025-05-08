#!/bin/bash
set -e

# 최신 이미지  가져오기
docker pull daeguhighman/nest-app:prod

# 기존 컨테이너 제거
docker stop nest-app || true
docker rm nest-app || true

# 마이그레이션 실행
docker run --rm \
  --env-file /home/ec2-user/.env.production \
  daeguhighman/nest-app:prod \
  node dist/data-source.js migration:run

# 실행
docker run -d \
  --name nest-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e APP_STAGE=prod \
  --env-file /home/ec2-user/.env.production \
  daeguhighman/nest-app:prod

