#!/bin/bash
# RDS(MySQL) → Railway MySQL 데이터 이전 스크립트
#
# RDS에 접근 가능한 곳(보통 기존 EC2)에서 실행한다. mysql 클라이언트는 docker 이미지로 대신한다.
#
# 사용법:
#   export SRC_HOST=xxx.rds.amazonaws.com SRC_USER=admin SRC_PASSWORD=... SRC_DB=snubaseball
#   export DST_HOST=xxx.proxy.rlwy.net DST_PORT=12345 DST_USER=root DST_PASSWORD=... DST_DB=railway
#   bash migrate-rds-to-railway.sh
#
# DST_* 값은 Railway MySQL 서비스 → Variables 탭의 MYSQL_PUBLIC_URL 에서 확인한다.
set -euo pipefail

: "${SRC_HOST:?}" "${SRC_USER:?}" "${SRC_PASSWORD:?}" "${SRC_DB:?}"
: "${DST_HOST:?}" "${DST_PORT:?}" "${DST_USER:?}" "${DST_PASSWORD:?}" "${DST_DB:?}"
SRC_PORT="${SRC_PORT:-3306}"

DUMP_FILE="rds-dump-$(date +%Y%m%d-%H%M%S).sql"
MYSQL_IMAGE="mysql:8.0"

# 비밀번호는 커맨드라인 대신 MYSQL_PWD 환경변수로 넘긴다.
# 첫 인자는 실행할 프로그램(mysql/mysqldump), 나머지는 그 옵션.
src() { local prog=$1; shift; sudo docker run --rm -i -e MYSQL_PWD="$SRC_PASSWORD" "$MYSQL_IMAGE" "$prog" -h "$SRC_HOST" -P "$SRC_PORT" -u "$SRC_USER" "$@"; }
dst() { local prog=$1; shift; sudo docker run --rm -i -e MYSQL_PWD="$DST_PASSWORD" "$MYSQL_IMAGE" "$prog" -h "$DST_HOST" -P "$DST_PORT" -u "$DST_USER" "$@"; }

row_counts() {
  local runner=$1 db=$2
  local tables
  tables=$($runner mysql -N -e "SELECT table_name FROM information_schema.tables WHERE table_schema='$db' AND table_type='BASE TABLE' ORDER BY table_name")
  for t in $tables; do
    echo "$t $($runner mysql -N -e "SELECT COUNT(*) FROM \`$db\`.\`$t\`")"
  done
}

echo "▶ 1/3 RDS 덤프 → $DUMP_FILE"
src mysqldump \
  --single-transaction --routines --triggers \
  --set-gtid-purged=OFF --no-tablespaces \
  --default-character-set=utf8mb4 \
  "$SRC_DB" > "$DUMP_FILE"
echo "  덤프 크기: $(du -h "$DUMP_FILE" | cut -f1)"

echo "▶ 2/3 Railway MySQL 복원"
dst mysql --default-character-set=utf8mb4 "$DST_DB" < "$DUMP_FILE"

echo "▶ 3/3 테이블별 row 수 비교"
row_counts src "$SRC_DB" > /tmp/src_counts.txt
row_counts dst "$DST_DB" > /tmp/dst_counts.txt
if diff -u /tmp/src_counts.txt /tmp/dst_counts.txt; then
  cat /tmp/dst_counts.txt
  echo "✅ 모든 테이블 row 수 일치"
else
  echo "❌ row 수 불일치 (위 diff 확인)"
  exit 1
fi
