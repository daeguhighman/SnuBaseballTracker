## 📘 Entity Relationship Diagram (ERD)

### 📌 테이블 개요

---

#### `users`
| 필드명        | 타입     | 설명              |
|---------------|----------|-------------------|
| id            | int      | 사용자 ID (PK)    |
| email         | varchar  | 이메일 주소       |
| password_hash | char     | 비밀번호 해시     |

---

#### `email_verification_codes`
| 필드명     | 타입      | 설명         |
|-----------|-----------|--------------|
| email     | varchar   | 이메일 (PK)  |
| code      | varchar   | 인증 코드     |
| expires_at| timestamp | 만료 시간     |

---

#### `departments`
| 필드명 | 타입 | 설명         |
|--------|------|--------------|
| id     | int  | 학과 ID (PK) |
| name   | char | 학과명       |

---

#### `players`
| 필드명        | 타입     | 설명             |
|--------------|----------|------------------|
| id           | int      | 선수 ID (PK)     |
| team_id      | int      | 팀 ID (FK)       |
| department_id| int      | 학과 ID (FK)     |
| name         | char     | 선수 이름        |
| is_wildcard  | boolean  | 와일드카드 여부  |
| is_elite     | boolean  | 엘리트 여부      |

---

#### `teams`
| 필드명 | 타입 | 설명          |
|--------|------|---------------|
| id     | int  | 팀 ID (PK)    |
| name   | char | 팀 이름       |

---

#### `tournaments`
| 필드명 | 타입    | 설명            |
|--------|---------|-----------------|
| id     | int     | 대회 ID (PK)    |
| year   | year    | 년도            |
| season | enum    | 시즌 (봄/가을 등) |
| name   | varchar | 대회 이름       |

---

#### `team-tournament`
| 필드명       | 타입 | 설명          |
|-------------|------|---------------|
| id          | int  | ID (PK)       |
| team_id     | int  | 팀 ID (FK)    |
| tournament_id | int | 대회 ID (FK)  |
| games       | int  | 경기 수        |
| wins        | int  | 승리 수        |
| draws       | int  | 무승부 수      |
| loses       | int  | 패배 수        |
| group       | enum | 조            |
| rank        | int  | 순위          |

---

#### `player-tournament-registration`
| 필드명       | 타입 | 설명          |
|-------------|------|---------------|
| id          | int  | ID (PK)       |
| player_id   | int  | 선수 ID (FK)  |
| tournament_id | int | 대회 ID (FK)  |

---

#### `games`
| 필드명     | 타입     | 설명             |
|-----------|----------|------------------|
| id        | int      | 경기 ID (PK)     |
| home_id   | int      | 홈팀 ID (FK)     |
| away_id   | int      | 어웨이팀 ID (FK) |
| start_time| datetime | 시작 시간        |
| status    | enum     | 경기 상태        |

---

#### `game_stats`
| 필드명    | 타입 | 설명          |
|----------|------|---------------|
| id       | int  | 결과 ID (PK)  |
| game_id  | int  | 경기 ID (FK)  |
| home_score| int  | 홈팀 점수     |
| away_score| int  | 어웨이팀 점수 |
| home_hits| int  | 홈팀 안타수 |
| away_hits| int  | 어웨이팀 안타수 |
| current_inning| int  | 현재 이닝 |
| current_inning_half| int  | 초 or 말 |

---

#### `game_inning_scores`
| 필드명     | 타입  | 설명         |
|-----------|-------|-------------|
| id        | int   | ID (PK)      |
| game_id   | int   | 경기 ID (FK) |
| inning    | int   | 이닝         |
| inning_half | enum| 상/하        |
| score     | int   | 점수         |
| hits     | int   | 안타수         |

---

#### `batter_stats`
| 필드명             | 타입    | 설명              |
|--------------------|---------|-------------------|
| id                 | int     | ID (PK)           |
| player_id          | int     | 선수 ID (FK)      |
| tournament_id      | int     | 대회 ID (FK)      |
| plate_appearances  | int     | 타석              |
| at_bats            | int     | 타수              |
| hits               | int     | 안타              |
| doubles            | int     | 2루타             |
| triples            | int     | 3루타             |
| walks              | int     | 볼넷              |
| home_runs          | int     | 홈런              |
| batting_average    | decimal | 타율              |
| on_base_percentage | decimal | 출루율            |
| slugging_percentage| decimal | 장타율            |
| ops                | decimal | OPS               |

---

#### `pitcher_stats`
| 필드명        | 타입    | 설명         |
|---------------|---------|--------------|
| id            | int     | ID (PK)      |
| player_id     | int     | 선수 ID (FK) |
| tournament_id | int     | 대회 ID (FK) |
| strikeouts    | int     | 삼진         |

---

#### `batter_game_stats`
| 필드명            | 타입 | 설명         |
|-------------------|------|--------------|
| id                | int  | ID (PK)      |
| player_id         | int  | 선수 ID (FK) |
| game_id           | int  | 경기 ID (FK) |
| plate_appearances | int  | 타석         |
| hits              | int  | 안타         |
| doubles           | int  | 2루타        |
| triples           | int  | 3루타        |
| home_runs         | int  | 홈런         |
| walks             | int  | 볼넷         |

---

#### `pitcher_game_stats`
| 필드명     | 타입 | 설명         |
|------------|------|--------------|
| id         | int  | ID (PK)      |
| player_id  | int  | 선수 ID (FK) |
| game_id    | int  | 경기 ID (FK) |
| strikeouts | int  | 삼진         |

---

#### `batter_game_participations` / `pitcher_game_participations`
| 필드명   | 타입   | 설명             |
|---------|--------|------------------|
| id      | int    | ID (PK)          |
| game_id | int    | 경기 ID (FK)     |
| player_id| int   | 선수 ID (FK)     |
| is_active| boolean| 현재 출전 중 여부 |
| position| enum   | 포지션           |
| order   | int    | 타순             |

---

#### `umpires`
| 필드명        | 타입 | 설명         |
|--------------|------|--------------|
| id           | int  | ID (PK)      |
| user_id      | int  | 유저 ID (FK) |
| tournament_id| int  | 대회 ID (FK) |

---

#### `umpire_codes`
| 필드명        | 타입   | 설명         |
|--------------|--------|--------------|
| id           | int    | ID (PK)      |
| tournament_id| int    | 대회 ID (FK) |
| code         | varchar| 심판 코드    |
```