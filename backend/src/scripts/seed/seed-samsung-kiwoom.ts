import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
for (const file of [`.env.${NODE_ENV}`, '.env']) {
  const abs = resolve(process.cwd(), file);
  if (existsSync(abs)) {
    config({ path: abs });
    break;
  }
}

async function main() {
  const ds = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: false,
    charset: 'utf8mb4',
  });

  try {
    await ds.initialize();
    console.log('✅ DB 연결 성공');

    // 1. 전체 초기화
    console.log('\n=== 1단계: 데이터 초기화 ===');
    await ds.query('SET FOREIGN_KEY_CHECKS = 0');
    const tables = [
      'runner_events', 'runner', 'plays',
      'batter_game_stats', 'pitcher_game_stats',
      'batter_game_participations', 'pitcher_game_participations',
      'game_roasters', 'game_inning_stats', 'game_stats', 'games',
      'batter_stats', 'pitcher_stats',
      'player_tournaments', 'team_tournaments', 'umpire_tournaments',
      'email_codes', 'password_reset_tokens', 'sessions',
      'players', 'teams', 'tournaments', 'umpires',
      'user_profiles', 'users', 'departments', 'colleges',
    ];
    for (const t of tables) {
      await ds.query(`TRUNCATE TABLE \`${t}\``);
    }
    await ds.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('  ✅ 모든 테이블 초기화 완료');

    // 2. 어드민 계정
    console.log('\n=== 2단계: 어드민 계정 생성 ===');
    const admins = [
      { email: 'admin@snu.ac.kr', nickname: '관리자', password: 'admin123!' },
      { email: 'superadmin@snu.ac.kr', nickname: '슈퍼관리자', password: 'superadmin123!' },
    ];
    for (const a of admins) {
      const hash = await bcrypt.hash(a.password, 10);
      const result = await ds.query(
        `INSERT INTO users (email, nickname, password_hash, role) VALUES (?, ?, ?, 'ADMIN')`,
        [a.email, a.nickname, hash],
      );
      await ds.query(
        `INSERT INTO user_profiles (nickname, userId) VALUES (?, ?)`,
        [a.nickname, result.insertId],
      );
      console.log(`  ✅ ${a.email}`);
    }

    // 3. College & Department
    console.log('\n=== 3단계: 단과대/학과 생성 ===');
    await ds.query(`INSERT INTO colleges (name) VALUES ('서울대학교')`);
    const collegeId = (await ds.query('SELECT LAST_INSERT_ID() as id'))[0].id;
    await ds.query(`INSERT INTO departments (name, collegeId) VALUES ('체육교육과', ?)`, [collegeId]);
    const deptId = (await ds.query('SELECT LAST_INSERT_ID() as id'))[0].id;
    console.log('  ✅ 서울대학교 / 체육교육과');

    // 4. Tournament
    console.log('\n=== 4단계: 대회 생성 ===');
    await ds.query(`INSERT INTO tournaments (name, year) VALUES ('스누나래', 2026)`);
    const tournamentId = (await ds.query('SELECT LAST_INSERT_ID() as id'))[0].id;
    console.log(`  ✅ 대회 ID: ${tournamentId}`);

    // 5. Teams
    console.log('\n=== 5단계: 팀 생성 ===');
    await ds.query(`INSERT INTO teams (name) VALUES ('삼성 라이온즈')`);
    const samsungId = (await ds.query('SELECT LAST_INSERT_ID() as id'))[0].id;
    await ds.query(`INSERT INTO teams (name) VALUES ('키움 히어로즈')`);
    const kiwoomId = (await ds.query('SELECT LAST_INSERT_ID() as id'))[0].id;

    await ds.query(
      `INSERT INTO team_tournaments (team_id, tournament_id, group_name) VALUES (?, ?, 'A조')`,
      [samsungId, tournamentId],
    );
    const samsungTTId = (await ds.query('SELECT LAST_INSERT_ID() as id'))[0].id;
    await ds.query(
      `INSERT INTO team_tournaments (team_id, tournament_id, group_name) VALUES (?, ?, 'A조')`,
      [kiwoomId, tournamentId],
    );
    const kiwoomTTId = (await ds.query('SELECT LAST_INSERT_ID() as id'))[0].id;
    console.log('  ✅ 삼성 라이온즈, 키움 히어로즈');

    // 6. Players
    console.log('\n=== 6단계: 선수 생성 ===');

    async function createPlayer(name: string, backNumber: number, ttId: number) {
      await ds.query(
        `INSERT INTO players (name, college_id, department_id) VALUES (?, ?, ?)`,
        [name, collegeId, deptId],
      );
      const playerId = (await ds.query('SELECT LAST_INSERT_ID() as id'))[0].id;
      await ds.query(
        `INSERT INTO player_tournaments (player_id, tournament_id, team_tournament_id, back_number, is_wildcard, is_elite) VALUES (?, ?, ?, ?, 0, 0)`,
        [playerId, tournamentId, ttId, backNumber],
      );
    }

    // 삼성 라이온즈
    const samsung: [string, number][] = [
      ['원태인', 17],
      ['김지찬', 3], ['양도근', 25], ['구자욱', 52], ['디아즈', 43],
      ['강민호', 10], ['김태훈', 37], ['류지혁', 7], ['이성규', 31], ['이재현', 2],
      ['김재성', 22], ['양우현', 55], ['전병우', 66], ['박승규', 36], ['김성윤', 50],
      ['가라비토', 40], ['김태훈(투)', 46], ['배찬승', 19], ['양창섭', 29],
      ['오승환', 18], ['육선엽', 11], ['이승민', 48], ['이승현(좌)', 61],
      ['이승현(우)', 62], ['이호성', 15], ['최원태', 20], ['황동재', 63], ['후라도', 34],
    ];

    // 키움 히어로즈
    const kiwoom: [string, number][] = [
      ['알칸타라', 49],
      ['송성문', 8], ['임지열', 37], ['최주환', 16], ['이주형', 53],
      ['주성원', 23], ['스톤', 38], ['어준서', 7], ['김건희', 22], ['서유신', 2],
      ['김동헌', 62], ['이주형(1루)', 54], ['전태현', 55], ['양현종', 17],
      ['박주홍', 61], ['박수종', 35],
      ['김선기', 30], ['박윤성', 47], ['박정훈', 26], ['오석주', 15],
      ['원종현', 36], ['웰스', 43], ['윤석원', 19], ['이준우', 50],
      ['정현우', 46], ['조영건', 48], ['주승우', 28], ['하영민', 58],
    ];

    for (const [name, num] of samsung) await createPlayer(name, num, samsungTTId);
    for (const [name, num] of kiwoom) await createPlayer(name, num, kiwoomTTId);
    console.log(`  ✅ 삼성 ${samsung.length}명, 키움 ${kiwoom.length}명`);

    // 7. Game - 2026-04-11 토요일 14:00 KST (= 05:00 UTC)
    console.log('\n=== 7단계: 경기 생성 ===');
    await ds.query(
      `INSERT INTO games (tournament_id, home_team_tournament_id, away_team_tournament_id, start_time, status, stage)
       VALUES (?, ?, ?, '2026-04-11 05:00:00', 'SCHEDULED', 'LEAGUE')`,
      [tournamentId, kiwoomTTId, samsungTTId],
    );
    console.log('  ✅ 삼성(원정) vs 키움(홈) | 2026-04-11 토 14:00 KST');

    console.log('\n🎉 시드 데이터 생성 완료!');
    console.log(`  - 어드민: ${admins.length}명`);
    console.log(`  - 팀: 2개`);
    console.log(`  - 선수: ${samsung.length + kiwoom.length}명`);
    console.log('  - 경기: 1개');
  } catch (error) {
    console.error('❌ 오류:', error);
    process.exit(1);
  } finally {
    if (ds.isInitialized) {
      await ds.destroy();
      console.log('✅ DB 연결 종료');
    }
  }
}

main();
