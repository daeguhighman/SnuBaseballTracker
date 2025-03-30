#!/bin/bash

# pull 최신 이미지
docker pull YOUR_DOCKERHUB_ID/nest-app:latest

# 기존 컨테이너 제거
docker stop nest-app || true
docker rm nest-app || true

# 실행
docker run -d \
  --name nest-app \
  -p 3000:3000 \
  --env-file /home/ec2-user/.env \
  YOUR_DOCKERHUB_ID/nest-app:latest
