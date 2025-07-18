# ─────────────── 1) 빌드 스테이지 ───────────────
FROM node:20-alpine AS builder

# 1‑1. 기본 설정
WORKDIR /app
ENV NODE_ENV=production

# 1‑2. 의존성 설치
# package*.json만 먼저 복사해 캐시 활용
COPY package*.json ./
RUN npm ci --ignore-scripts            # devDependencies 포함 전체 설치

# 1‑3. 소스 복사 & 컴파일
COPY . .
RUN npm run build                      # dist/ 생성
# prebuild/postinstall 스크립트에 prisma generate 등 포함 시 여기서 실행

# 1‑4. 프로덕션 의존성만 추출
RUN npm prune --omit=dev

# ─────────────── 2) 런타임 스테이지 ───────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
# 1000:1000 계정 생성 → root 실행 방지
RUN addgroup -S app && adduser -S nestjs -G app
USER nestjs

# 2‑1. 빌드 결과 받기
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# (설정 파일이 dist 밖에 있으면 추가 COPY)

EXPOSE 3000
# 2‑2. 헬스체크 (포트 3000 기준)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD \
  wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
