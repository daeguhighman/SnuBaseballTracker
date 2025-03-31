# 빌드 스테이지: 소스 코드를 컴파일하고 빌드하는 단계
FROM node:20-alpine AS builder

# 환경 변수 설정 (기본값: development)
ARG APP_ENV=development
ENV NODE_ENV=$APP_ENV

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 파일을 복사
COPY package*.json ./
# 프로덕션 의존성 설치
RUN npm ci

# 소스 코드 전체를 복사
COPY . .

# TypeScript 코드를 JavaScript로 컴파일
RUN npm run build

# 런타임 스테이지: 실제 애플리케이션이 실행되는 단계
FROM node:20-alpine

# 환경 변수 설정 (기본값: development)
ARG APP_ENV=development
ENV NODE_ENV=$APP_ENV

# 작업 디렉토리 설정
WORKDIR /app

# 빌드 스테이지에서 생성된 dist 폴더만 복사
COPY --from=builder /app/dist ./dist
# package.json과 package-lock.json 파일을 복사
COPY package*.json ./

# 프로덕션 의존성만 설치 (개발 의존성 제외)
RUN npm ci --only=production

# 컨테이너가 3000번 포트를 사용함을 명시
EXPOSE 3000
# 애플리케이션 실행 명령어
CMD ["node", "dist/src/main.js"]
