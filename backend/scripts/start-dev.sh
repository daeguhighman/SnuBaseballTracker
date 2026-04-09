#!/bin/bash
set -e

docker pull daeguhighman/nest-app:dev

docker stop nest-app || true
docker rm   nest-app || true

docker run -d \
  --name nest-app \
  -p 3000:3000 \
  -e NODE_ENV=development \
  -e APP_STAGE=dev \
  --env-file /home/ec2-user/.env.development \
  daeguhighman/nest-app:dev
