#!/bin/bash

# Docker 사용자명을 환경 변수에서 가져옴
source /home/ec2-user/.env
# pull 최신 이미지
docker pull ${DOCKER_USERNAME}/nest-app:latest

# 기존 컨테이너 제거
docker stop nest-app || true
docker rm nest-app || true

# 실행
docker run -d \
  --name nest-app \
  -p 3000:3000 \
  --env-file /home/ec2-user/.env \
  ${DOCKER_USERNAME}/nest-app:latest
