# Railway 배포 가이드

백엔드(NestJS)와 MySQL을 Railway에서 운영한다. `main`에 `backend/**` 변경이 push되면 자동 배포된다.

## 1. 프로젝트 만들기 (최초 1회)

1. https://railway.com 에 GitHub 계정으로 가입 → **Hobby 플랜** 구독
2. **New Project → Deploy from GitHub repo** → 이 저장소 선택
3. 생성된 서비스 → **Settings**
   - **Root Directory**: `/backend`
   - **Config-as-code**: `/backend/railway.json` (Dockerfile 빌드, `/health` 헬스체크, watch path 설정이 들어 있음)
   - **Region**: Asia (Singapore)
4. 같은 프로젝트에서 **+ New → Database → MySQL** 추가

## 2. 환경변수

백엔드 서비스 → **Variables** 탭. DB 값은 Railway MySQL 변수를 참조하도록 그대로 붙여넣는다.

```
NODE_ENV=production
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
```

나머지는 기존 EC2의 `.env`에서 **값을 그대로** 복사한다. 특히 `JWT_*_SECRET`을 바꾸면 모든 회원이 로그아웃된다.

```
JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN, ACCESS_TTL_SEC
JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN, REFRESH_TTL_SEC
JWT_EMAIL_VERIFICATION_SECRET, JWT_EMAIL_VERIFICATION_EXPIRES_IN, JWT_ISSUER
CODE_EXPIRE_MINUTES, CODE_MAX_ATTEMPTS
MAIL_USER, MAIL_APP_PASSWORD
SENTRY_ENVIRONMENT
```

`PORT`는 Railway가 자동으로 넣어 주므로 설정하지 않는다.

## 3. 비용 상한

Workspace → **Usage** → **Usage Limit** 설정 (예: $15). 한도를 넘으면 서비스가 멈추므로 대회 기간에는 여유 있게 잡는다.

## 4. RDS 데이터 이전

1. AWS 콘솔에서 RDS **수동 스냅샷** 생성
2. Railway MySQL → **Variables** 의 `MYSQL_PUBLIC_URL` 에서 외부 접속 host/port/user/password 확인
3. 백엔드 서비스는 잠시 내려 둔다 (Settings → 서비스 일시 정지, 또는 이전 끝날 때까지 첫 배포 보류)
4. RDS에 접근 가능한 기존 EC2에서 실행:

```bash
export SRC_HOST=<RDS 엔드포인트> SRC_USER=<유저> SRC_PASSWORD=<비번> SRC_DB=<DB이름>
export DST_HOST=<xxx.proxy.rlwy.net> DST_PORT=<포트> DST_USER=root DST_PASSWORD=<비번> DST_DB=railway
bash scripts/migrate-rds-to-railway.sh
```

마지막에 `✅ 모든 테이블 row 수 일치` 가 나오면 성공.

5. 백엔드 서비스 배포 → **Deployments** 로그에서 정상 기동 확인

## 5. 도메인 전환

1. 백엔드 서비스 → **Settings → Networking → Custom Domain** → `api.snubaseball.com` 추가
2. Railway가 알려주는 CNAME 값으로 Cloudflare DNS의 `api` 레코드 교체 (기존 Tunnel 레코드 대체)
3. 실제 사이트에서 로그인, 기록 조회 확인

## 6. 정리 (1~2주 문제 없으면)

- EC2 인스턴스 종료, RDS 삭제 (스냅샷은 보관)
- Cloudflare Tunnel 삭제
- `.github/workflows/deploy.yml`, `docker-compose.yml`, `appspec.yml`, `scripts/start*.sh` 삭제
