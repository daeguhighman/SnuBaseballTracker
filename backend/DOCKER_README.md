# Docker 배포 가이드

이 프로젝트는 Docker를 사용하여 컨테이너화된 NestJS 애플리케이션입니다.

## 🚀 빠른 시작

### 1. Docker Compose로 전체 스택 실행

```bash
# 환경 변수 파일 생성
cp env.example .env
# .env 파일을 편집하여 실제 값으로 설정

# 전체 스택 실행 (앱 + Nginx + 데이터베이스)
docker-compose up -d

# 로그 확인
docker-compose logs -f app
docker-compose logs -f nginx

# 서비스 중지
docker-compose down
```

### 2. Nginx를 통한 접근

```bash
# 전체 스택 실행 후
docker-compose up -d

# Nginx를 통해 접근 (포트 80)
curl http://localhost

# 직접 앱에 접근 (포트 3000)
curl http://localhost:3000

# 헬스체크
curl http://localhost/health
```

## 📁 파일 구조

```
├── Dockerfile              # 멀티스테이지 빌드 설정
├── .dockerignore          # Docker 빌드 시 제외할 파일들
├── docker-compose.yml     # 전체 스택 설정 (앱 + Nginx + DB)
├── nginx.conf             # Nginx 리버스 프록시 설정
├── healthcheck.js         # 헬스체크 스크립트
├── env.example            # 환경 변수 예시
└── DOCKER_README.md       # 이 파일
```

## 🔧 Dockerfile 설명

### 멀티스테이지 빌드

1. **Builder Stage**: TypeScript 컴파일 및 빌드
2. **Production Stage**: 최소한의 런타임 환경

### 보안 최적화

- `nestjs` 사용자로 실행 (root 권한 방지)
- 프로덕션 의존성만 설치
- 불필요한 파일 제외

### 성능 최적화

- Alpine Linux 사용 (경량)
- 레이어 캐싱 활용
- 멀티스테이지 빌드로 이미지 크기 최소화

## 🌐 Nginx 설정

### 리버스 프록시 기능

- **포트 80**: 외부 접근용 (Nginx)
- **포트 3000**: 내부 통신용 (NestJS 앱)
- **정적 파일 캐싱**: JS, CSS, 이미지 파일 최적화
- **Gzip 압축**: 응답 크기 최소화
- **보안 헤더**: XSS, CSRF 방지

### 주요 설정

```nginx
# 업스트림 서버 정의
upstream nestjs_backend {
    server app:3000;
    keepalive 32;
}

# API 요청 프록시
location / {
    proxy_pass http://nestjs_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 🌍 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `NODE_ENV` | 실행 환경 | `production` |
| `DATABASE_HOST` | 데이터베이스 호스트 | - |
| `DATABASE_PORT` | 데이터베이스 포트 | `3306` |
| `DATABASE_USERNAME` | 데이터베이스 사용자명 | - |
| `DATABASE_PASSWORD` | 데이터베이스 비밀번호 | - |
| `DATABASE_DATABASE` | 데이터베이스 이름 | - |

## 🏥 헬스체크

애플리케이션은 `/health` 엔드포인트를 통해 헬스체크를 제공합니다:

```bash
# 헬스체크 확인
curl http://localhost:3000/health
```

## 📊 모니터링

### 로그 확인

```bash
# 실시간 로그
docker-compose logs -f app

# 특정 시간 이후 로그
docker-compose logs --since="2024-01-01T00:00:00" app
```

### 리소스 사용량 확인

```bash
# 컨테이너 리소스 사용량
docker stats

# 특정 컨테이너 상세 정보
docker inspect snu-baseball-tracker
```

## 🔄 배포 워크플로우

### 1. 개발 환경

```bash
# 로컬 개발
npm run start:dev

# Docker 개발 환경
docker-compose up -d
```

### 2. 스테이징 환경

```bash
# 스테이징 이미지 빌드
docker build -t snu-baseball-tracker:staging .

# 스테이징 환경 실행
docker run -d \
  --name snu-baseball-staging \
  -p 3001:3000 \
  -e NODE_ENV=staging \
  snu-baseball-tracker:staging
```

### 3. 프로덕션 환경

```bash
# 프로덕션 이미지 빌드
docker build -t snu-baseball-tracker:latest .

# 프로덕션 환경 실행
docker run -d \
  --name snu-baseball-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  snu-baseball-tracker:latest
```

## 🛠️ 문제 해결

### 일반적인 문제들

1. **포트 충돌**
   ```bash
   # 사용 중인 포트 확인
   lsof -i :3000
   
   # 다른 포트로 실행
   docker run -p 3001:3000 snu-baseball-tracker
   ```

2. **데이터베이스 연결 실패**
   ```bash
   # 데이터베이스 상태 확인
   docker-compose logs db
   
   # 네트워크 연결 확인
   docker network ls
   ```

3. **메모리 부족**
   ```bash
   # 컨테이너 리소스 제한
   docker run --memory=512m snu-baseball-tracker
   ```

### 디버깅

```bash
# 컨테이너 내부 접속
docker exec -it <container-id> sh

# 로그 레벨 변경
docker run -e LOG_LEVEL=debug snu-baseball-tracker
```

## 📈 성능 최적화

### 이미지 크기 최적화

```bash
# 빌드 캐시 정리
docker builder prune

# 불필요한 이미지 정리
docker image prune
```

### 실행 성능 최적화

```bash
# CPU 제한
docker run --cpus=1.0 snu-baseball-tracker

# 메모리 제한
docker run --memory=512m snu-baseball-tracker
```

## 🔒 보안 고려사항

1. **비밀번호 관리**: 환경 변수나 Docker Secrets 사용
2. **네트워크 격리**: 필요한 포트만 노출
3. **이미지 스캔**: 정기적인 보안 취약점 검사
4. **업데이트**: 정기적인 베이스 이미지 업데이트

## 📚 추가 자료

- [Docker 공식 문서](https://docs.docker.com/)
- [NestJS Docker 가이드](https://docs.nestjs.com/deployment)
- [Docker Compose 문서](https://docs.docker.com/compose/) 