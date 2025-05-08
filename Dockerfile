### 0) 공통 ###
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

### 1) 빌드 ###
FROM base AS builder   
ENV NODE_ENV=development
RUN npm ci 
COPY . .
RUN npm run build          # dist/ 생성

### 2-a) 런타임-prod  (devDeps 제거) ###
FROM node:20-alpine AS runtime-prod
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "dist/src/main.js"]

### 2-b) 런타임-dev  (devDeps 포함 + 소스까지) ###
FROM node:20-alpine AS runtime-dev
ENV NODE_ENV=development
WORKDIR /app
# devDeps까지 설치!
COPY package*.json ./
RUN npm install
# 서비스 실행용 dist + 테스트·Lint용 소스 모두 복사
COPY --from=builder /app/dist ./dist
COPY . .                    
EXPOSE 3000
CMD ["node", "dist/src/main.js"]