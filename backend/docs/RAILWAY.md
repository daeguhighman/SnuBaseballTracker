# Railway 배포 가이드

백엔드(NestJS)와 MySQL을 Railway(프로젝트 `grand-achievement`, 서비스 `SnuBaseballTracker` + `MySQL`)에서 운영한다. `main`에 `backend/**` 변경이 push되면 자동 배포된다.

2026-10-26 EC2 + RDS에서 이전을 마쳤다. 기존 GitHub Actions(Docker Hub → EC2) 배포는 제거됐다.

## 1. 서비스 설정

Railway가 config-as-code(`railway.json`)를 deprecated 처리해 API에서 거부하므로, 설정은 서비스 인스턴스에 직접 넣는다. 현재 값:

| 항목 | 값 |
| --- | --- |
| Root Directory | `/backend` |
| Builder | Dockerfile (`backend/Dockerfile` 자동 감지) |
| Watch Paths | `/backend/**` |
| Healthcheck Path | `/health` |
| Healthcheck Timeout | `120` |
| Restart Policy | `ON_FAILURE`, 최대 5회 |
| Region | Asia Southeast (`asia-southeast1-eqsg3a`) |

바꿀 때는 대시보드의 서비스 → **Settings**에서 수정하거나, CLI로 GraphQL `serviceInstanceUpdate`를 호출한다.

```bash
railway api 'mutation($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
  serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
}' --variables '{"serviceId":"<서비스 ID>","environmentId":"<환경 ID>","input":{"healthcheckTimeout":120}}'
```

새로 만들 때는 **New Project → Deploy from GitHub repo**로 이 저장소를 연결하고, 같은 프로젝트에 **+ New → Database → MySQL**을 추가한 뒤 위 표대로 설정한다.

## 2. 환경변수

백엔드 서비스 → **Variables** 탭. DB 값은 Railway MySQL 변수를 참조한다.

```
NODE_ENV=production
TZ=UTC
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
```

`TZ=UTC`는 DB의 `DATETIME`을 UTC로 저장하던 기존 운영과 맞추기 위한 값이다. 빼면 시간이 어긋나게 저장된다.

나머지는 EC2의 `.env` 값을 그대로 옮겨 두었다. 특히 `JWT_*_SECRET`을 바꾸면 모든 회원이 로그아웃된다.

```
JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN, ACCESS_TTL_SEC
JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN, REFRESH_TTL_SEC
JWT_EMAIL_VERIFICATION_SECRET, JWT_EMAIL_VERIFICATION_EXPIRES_IN, JWT_ISSUER
CODE_EXPIRE_MINUTES, CODE_MAX_ATTEMPTS
MAIL_USER, MAIL_APP_PASSWORD
SENTRY_ENVIRONMENT
```

`PORT`는 Railway가 자동으로 넣어 주므로 설정하지 않는다.

## 3. MySQL 외부 접속

MySQL 서비스 → **Settings → Networking**에서 **TCP Proxy**를 열면 `xxx.proxy.rlwy.net:<포트>` 주소가 생기고, `MYSQL_PUBLIC_URL` 변수에 접속 정보가 들어간다. 로컬에서 데이터를 확인하거나 시드를 넣을 때 이 주소를 쓴다. 백엔드 서비스는 내부 주소(`MYSQLHOST`)로 접속하므로 TCP Proxy와 무관하다.

## 4. 도메인

`api.snubaseball.com`은 Cloudflare를 거쳐 Railway로 연결된다.

- Railway: 백엔드 서비스 → **Settings → Networking → Custom Domain**에 `api.snubaseball.com` 등록
- Cloudflare DNS: `api` CNAME → Railway가 알려준 타깃, **Proxied**(주황 구름)
- Cloudflare SSL/TLS 모드: **Full**

Let's Encrypt rate limit 때문에 Railway 쪽 인증서가 아직 발급되지 않은 상태다. 그래서 Full(Strict 아님)로 운영하며, Proxied를 끄면 인증서 오류가 난다. Railway 인증서가 발급되면 Full (strict)로 올릴 수 있다.

## 5. 비용 상한

Workspace → **Usage** → **Usage Limit** 설정 (예: $15). 한도를 넘으면 서비스가 멈추므로 대회 기간에는 여유 있게 잡는다.

## 6. 데이터 이전 (완료)

RDS → Railway MySQL 이전은 끝났다. 다시 해야 할 때는 `scripts/migrate-rds-to-railway.sh`를 RDS에 접근 가능한 곳에서 실행한다.

```bash
export SRC_HOST=<RDS 엔드포인트> SRC_USER=<유저> SRC_PASSWORD=<비번> SRC_DB=<DB이름>
export DST_HOST=<xxx.proxy.rlwy.net> DST_PORT=<포트> DST_USER=root DST_PASSWORD=<비번> DST_DB=railway
bash scripts/migrate-rds-to-railway.sh
```

마지막에 `✅ 모든 테이블 row 수 일치`가 나오면 성공.

## 7. 남은 정리

대회 기간 운영을 확인한 뒤 AWS 콘솔에서 직접 정리한다.

- EC2 인스턴스 종료, RDS 삭제 (스냅샷은 보관)
- Cloudflare Tunnel 삭제
