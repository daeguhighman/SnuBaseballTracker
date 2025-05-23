import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBaseSchema1746252109001 implements MigrationInterface {
    name = 'CreateBaseSchema1746252109001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`departments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_8681da666ad9699d568b3e9106\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`player_tournaments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`player_id\` int NOT NULL, \`tournament_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_c0525e576c026928aec2fb95bb\` (\`player_id\`), INDEX \`IDX_d3f70e4ffdd3b0bcfb957439b6\` (\`tournament_id\`), UNIQUE INDEX \`IDX_8d92a13d7363e071af104d357c\` (\`player_id\`, \`tournament_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`game_inning_stats\` (\`id\` int NOT NULL AUTO_INCREMENT, \`game_id\` int NOT NULL, \`inning\` int NOT NULL, \`inningHalf\` enum ('TOP', 'BOT') NOT NULL, \`runs\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_f6c3223e06f14dd26279cf9824\` (\`game_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`batter_game_stats\` (\`id\` int NOT NULL AUTO_INCREMENT, \`batter_game_participation_id\` int NOT NULL, \`plate_appearances\` int NOT NULL DEFAULT '0', \`at_bats\` int NOT NULL DEFAULT '0', \`hits\` int NOT NULL DEFAULT '0', \`singles\` int NOT NULL DEFAULT '0', \`doubles\` int NOT NULL DEFAULT '0', \`triples\` int NOT NULL DEFAULT '0', \`home_runs\` int NOT NULL DEFAULT '0', \`walks\` int NOT NULL DEFAULT '0', \`sacrifice_flies\` int NOT NULL DEFAULT '0', \`etcs\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_3bd2cb3f2b7140f750a0fdaac8\` (\`batter_game_participation_id\`), UNIQUE INDEX \`REL_3bd2cb3f2b7140f750a0fdaac8\` (\`batter_game_participation_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`batter_game_participations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`game_id\` int NOT NULL, \`team_id\` int NOT NULL, \`player_id\` int NOT NULL, \`position\` enum ('P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH') NOT NULL, \`batting_order\` int NOT NULL, \`substitution_order\` int NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_b29689d47b22e01defb6efd7af\` (\`game_id\`), INDEX \`IDX_a7ccc1dd62d56aac8100c4c6ba\` (\`team_id\`), INDEX \`IDX_cf2b31d93d5f27d5c7545cf478\` (\`player_id\`), UNIQUE INDEX \`IDX_a4bd825cd021c90bfa0069f1a6\` (\`game_id\`, \`player_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pitcher_game_stats\` (\`id\` int NOT NULL AUTO_INCREMENT, \`pitcher_game_participation_id\` int NOT NULL, \`strikeouts\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_36c2e15af9df5e963ca0ae2135\` (\`pitcher_game_participation_id\`), UNIQUE INDEX \`REL_36c2e15af9df5e963ca0ae2135\` (\`pitcher_game_participation_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pitcher_game_participations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`game_id\` int NOT NULL, \`team_id\` int NOT NULL, \`player_id\` int NOT NULL, \`substitution_order\` int NOT NULL DEFAULT '0', \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_183a7e71b8769c92691056c67b\` (\`game_id\`), INDEX \`IDX_61a0c2f525649b1e1772df22bb\` (\`team_id\`), INDEX \`IDX_1b51def7742927b8eb23efe38b\` (\`player_id\`), UNIQUE INDEX \`IDX_3e29bbbe09c8647b79a849a20b\` (\`game_id\`, \`player_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`game_stats\` (\`id\` int NOT NULL AUTO_INCREMENT, \`game_id\` int NOT NULL, \`home_score\` int NOT NULL DEFAULT '0', \`away_score\` int NOT NULL DEFAULT '0', \`home_hits\` int NOT NULL DEFAULT '0', \`away_hits\` int NOT NULL DEFAULT '0', \`inning\` int NOT NULL DEFAULT '1', \`inningHalf\` enum ('TOP', 'BOT') NOT NULL DEFAULT 'TOP', \`home_pitcher_participation_id\` int NOT NULL, \`home_batter_participation_id\` int NOT NULL, \`away_pitcher_participation_id\` int NOT NULL, \`away_batter_participation_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`REL_a8e2b0df27f8baa40c5aef8d3e\` (\`game_id\`), UNIQUE INDEX \`REL_bd5db571ec09d387d82d84daf3\` (\`home_pitcher_participation_id\`), UNIQUE INDEX \`REL_207a04127d611441d47686ceeb\` (\`home_batter_participation_id\`), UNIQUE INDEX \`REL_13a674c8d1715401b040983dee\` (\`away_pitcher_participation_id\`), UNIQUE INDEX \`REL_73309278f6c6b7b7a273c24056\` (\`away_batter_participation_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`game_roasters\` (\`id\` int NOT NULL AUTO_INCREMENT, \`game_id\` int NOT NULL, \`team_id\` int NOT NULL, \`player_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_f55dcf4120348b21aa899a0082\` (\`game_id\`), INDEX \`IDX_0ab4fa69ea5db41cf49ccbb9d2\` (\`team_id\`), INDEX \`IDX_ca7cbf0f39d4505f3def4ee219\` (\`player_id\`), UNIQUE INDEX \`IDX_e5e264c9ebbcffafc62165e088\` (\`game_id\`, \`team_id\`, \`player_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`games\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tournament_id\` int NOT NULL, \`home_team_id\` int NOT NULL, \`away_team_id\` int NOT NULL, \`winner_team_id\` int NULL, \`start_time\` timestamp NOT NULL, \`status\` enum ('SCHEDULED', 'IN_PROGRESS', 'EDITING', 'FINALIZED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED', \`record_umpire_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_231e3bf4d40e033e0386413711\` (\`tournament_id\`), INDEX \`IDX_f6bc2302c5abcb1237f534d6ef\` (\`home_team_id\`), INDEX \`IDX_fbe84ca8c9405ed07bf7d47188\` (\`away_team_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`umpires\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_fd8afb174c95560b417d123013\` (\`user_id\`), UNIQUE INDEX \`REL_fd8afb174c95560b417d123013\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`umpire_tournaments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`umpire_id\` int NOT NULL, \`tournament_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_ba4b70070b8d5110132f35de41\` (\`umpire_id\`), INDEX \`IDX_567c84be6fc109ed6426e8f638\` (\`tournament_id\`), UNIQUE INDEX \`IDX_2dabd1764981ec5df3ddd6ddd4\` (\`umpire_id\`, \`tournament_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tournaments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`year\` int NOT NULL, \`season\` enum ('SPRING', 'FALL') NOT NULL, \`phase\` enum ('LEAGUE', 'KNOCKOUT') NOT NULL DEFAULT 'LEAGUE', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_b63b048f5871d7f48cdb4d4de1\` (\`name\`), INDEX \`IDX_90d3309455b169f7c054a01171\` (\`year\`), UNIQUE INDEX \`IDX_2bb25df95b47c4cd34ee356831\` (\`year\`, \`season\`, \`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`team_tournaments\` (\`id\` int NOT NULL AUTO_INCREMENT, \`team_id\` int NOT NULL, \`tournament_id\` int NOT NULL, \`group_name\` varchar(50) NOT NULL, \`games\` int NOT NULL DEFAULT '0', \`wins\` int NOT NULL DEFAULT '0', \`draws\` int NOT NULL DEFAULT '0', \`losses\` int NOT NULL DEFAULT '0', \`runs_scored\` int NOT NULL DEFAULT '0', \`runs_allowed\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_f95b4d911f29f91a7df914f7cf\` (\`team_id\`), INDEX \`IDX_0843a2f852f36e58beff26c708\` (\`tournament_id\`), UNIQUE INDEX \`IDX_54f3bc23cb3c4cc8a46f800986\` (\`team_id\`, \`tournament_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`teams\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_48c0c32e6247a2de155baeaf98\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`players\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`is_wildcard\` tinyint NOT NULL DEFAULT 0, \`is_elite\` tinyint NOT NULL DEFAULT 0, \`team_id\` int NULL, \`department_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, INDEX \`IDX_ce457a554d63e92f4627d6c576\` (\`team_id\`), INDEX \`IDX_d95435c3de3a663682fa21ebc2\` (\`department_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`umpire_email_codes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(150) NOT NULL, \`code_hash\` varchar(255) NOT NULL, \`expires_at\` timestamp NULL, \`verified_at\` timestamp NULL, \`try_count\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_08df7cb9d7295c29e8f1ca80fb\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`batter_stats\` (\`id\` int NOT NULL AUTO_INCREMENT, \`player_tournament_id\` int NOT NULL, \`plate_appearances\` int NOT NULL DEFAULT '0', \`at_bats\` int NOT NULL DEFAULT '0', \`hits\` int NOT NULL DEFAULT '0', \`singles\` int NOT NULL DEFAULT '0', \`doubles\` int NOT NULL DEFAULT '0', \`triples\` int NOT NULL DEFAULT '0', \`home_runs\` int NOT NULL DEFAULT '0', \`walks\` int NOT NULL DEFAULT '0', \`sacrifice_flies\` int NOT NULL DEFAULT '0', \`etcs\` int NOT NULL DEFAULT '0', \`batting_average\` decimal(4,3) NOT NULL DEFAULT '0.000', \`on_base_percentage\` decimal(4,3) NOT NULL DEFAULT '0.000', \`slugging_percentage\` decimal(4,3) NOT NULL DEFAULT '0.000', \`ops\` decimal(4,3) NOT NULL DEFAULT '0.000', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_673bbc97c1577000b37840d4e1\` (\`player_tournament_id\`), UNIQUE INDEX \`REL_673bbc97c1577000b37840d4e1\` (\`player_tournament_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pitcher_stats\` (\`id\` int NOT NULL AUTO_INCREMENT, \`player_tournament_id\` int NOT NULL, \`strikeouts\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, UNIQUE INDEX \`IDX_44266091b556e03d241ace53da\` (\`player_tournament_id\`), UNIQUE INDEX \`REL_44266091b556e03d241ace53da\` (\`player_tournament_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`player_tournaments\` ADD CONSTRAINT \`FK_c0525e576c026928aec2fb95bb5\` FOREIGN KEY (\`player_id\`) REFERENCES \`players\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`player_tournaments\` ADD CONSTRAINT \`FK_d3f70e4ffdd3b0bcfb957439b6e\` FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_inning_stats\` ADD CONSTRAINT \`FK_f6c3223e06f14dd26279cf9824c\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`batter_game_stats\` ADD CONSTRAINT \`FK_3bd2cb3f2b7140f750a0fdaac8d\` FOREIGN KEY (\`batter_game_participation_id\`) REFERENCES \`batter_game_participations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`batter_game_participations\` ADD CONSTRAINT \`FK_b29689d47b22e01defb6efd7af3\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`batter_game_participations\` ADD CONSTRAINT \`FK_a7ccc1dd62d56aac8100c4c6ba6\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`batter_game_participations\` ADD CONSTRAINT \`FK_cf2b31d93d5f27d5c7545cf4781\` FOREIGN KEY (\`player_id\`) REFERENCES \`players\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pitcher_game_stats\` ADD CONSTRAINT \`FK_36c2e15af9df5e963ca0ae2135e\` FOREIGN KEY (\`pitcher_game_participation_id\`) REFERENCES \`pitcher_game_participations\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pitcher_game_participations\` ADD CONSTRAINT \`FK_183a7e71b8769c92691056c67b2\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pitcher_game_participations\` ADD CONSTRAINT \`FK_61a0c2f525649b1e1772df22bb2\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pitcher_game_participations\` ADD CONSTRAINT \`FK_1b51def7742927b8eb23efe38b7\` FOREIGN KEY (\`player_id\`) REFERENCES \`players\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_stats\` ADD CONSTRAINT \`FK_a8e2b0df27f8baa40c5aef8d3e3\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_stats\` ADD CONSTRAINT \`FK_bd5db571ec09d387d82d84daf3d\` FOREIGN KEY (\`home_pitcher_participation_id\`) REFERENCES \`pitcher_game_participations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_stats\` ADD CONSTRAINT \`FK_207a04127d611441d47686ceeb5\` FOREIGN KEY (\`home_batter_participation_id\`) REFERENCES \`batter_game_participations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_stats\` ADD CONSTRAINT \`FK_13a674c8d1715401b040983dee8\` FOREIGN KEY (\`away_pitcher_participation_id\`) REFERENCES \`pitcher_game_participations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_stats\` ADD CONSTRAINT \`FK_73309278f6c6b7b7a273c240567\` FOREIGN KEY (\`away_batter_participation_id\`) REFERENCES \`batter_game_participations\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_roasters\` ADD CONSTRAINT \`FK_f55dcf4120348b21aa899a00822\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_roasters\` ADD CONSTRAINT \`FK_0ab4fa69ea5db41cf49ccbb9d2a\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`game_roasters\` ADD CONSTRAINT \`FK_ca7cbf0f39d4505f3def4ee2198\` FOREIGN KEY (\`player_id\`) REFERENCES \`players\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`games\` ADD CONSTRAINT \`FK_231e3bf4d40e033e03864137113\` FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`games\` ADD CONSTRAINT \`FK_f6bc2302c5abcb1237f534d6efc\` FOREIGN KEY (\`home_team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`games\` ADD CONSTRAINT \`FK_fbe84ca8c9405ed07bf7d471883\` FOREIGN KEY (\`away_team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`games\` ADD CONSTRAINT \`FK_a17ef1eb8f0819d11d7a33662ff\` FOREIGN KEY (\`winner_team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`games\` ADD CONSTRAINT \`FK_fb2fabf4d3e0529d229b3d215d4\` FOREIGN KEY (\`record_umpire_id\`) REFERENCES \`umpires\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`umpires\` ADD CONSTRAINT \`FK_fd8afb174c95560b417d1230136\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`umpire_tournaments\` ADD CONSTRAINT \`FK_ba4b70070b8d5110132f35de419\` FOREIGN KEY (\`umpire_id\`) REFERENCES \`umpires\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`umpire_tournaments\` ADD CONSTRAINT \`FK_567c84be6fc109ed6426e8f6384\` FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_tournaments\` ADD CONSTRAINT \`FK_f95b4d911f29f91a7df914f7cf5\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`team_tournaments\` ADD CONSTRAINT \`FK_0843a2f852f36e58beff26c7087\` FOREIGN KEY (\`tournament_id\`) REFERENCES \`tournaments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`players\` ADD CONSTRAINT \`FK_ce457a554d63e92f4627d6c5763\` FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`players\` ADD CONSTRAINT \`FK_d95435c3de3a663682fa21ebc23\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`batter_stats\` ADD CONSTRAINT \`FK_673bbc97c1577000b37840d4e1e\` FOREIGN KEY (\`player_tournament_id\`) REFERENCES \`player_tournaments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pitcher_stats\` ADD CONSTRAINT \`FK_44266091b556e03d241ace53da0\` FOREIGN KEY (\`player_tournament_id\`) REFERENCES \`player_tournaments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pitcher_stats\` DROP FOREIGN KEY \`FK_44266091b556e03d241ace53da0\``);
        await queryRunner.query(`ALTER TABLE \`batter_stats\` DROP FOREIGN KEY \`FK_673bbc97c1577000b37840d4e1e\``);
        await queryRunner.query(`ALTER TABLE \`players\` DROP FOREIGN KEY \`FK_d95435c3de3a663682fa21ebc23\``);
        await queryRunner.query(`ALTER TABLE \`players\` DROP FOREIGN KEY \`FK_ce457a554d63e92f4627d6c5763\``);
        await queryRunner.query(`ALTER TABLE \`team_tournaments\` DROP FOREIGN KEY \`FK_0843a2f852f36e58beff26c7087\``);
        await queryRunner.query(`ALTER TABLE \`team_tournaments\` DROP FOREIGN KEY \`FK_f95b4d911f29f91a7df914f7cf5\``);
        await queryRunner.query(`ALTER TABLE \`umpire_tournaments\` DROP FOREIGN KEY \`FK_567c84be6fc109ed6426e8f6384\``);
        await queryRunner.query(`ALTER TABLE \`umpire_tournaments\` DROP FOREIGN KEY \`FK_ba4b70070b8d5110132f35de419\``);
        await queryRunner.query(`ALTER TABLE \`umpires\` DROP FOREIGN KEY \`FK_fd8afb174c95560b417d1230136\``);
        await queryRunner.query(`ALTER TABLE \`games\` DROP FOREIGN KEY \`FK_fb2fabf4d3e0529d229b3d215d4\``);
        await queryRunner.query(`ALTER TABLE \`games\` DROP FOREIGN KEY \`FK_a17ef1eb8f0819d11d7a33662ff\``);
        await queryRunner.query(`ALTER TABLE \`games\` DROP FOREIGN KEY \`FK_fbe84ca8c9405ed07bf7d471883\``);
        await queryRunner.query(`ALTER TABLE \`games\` DROP FOREIGN KEY \`FK_f6bc2302c5abcb1237f534d6efc\``);
        await queryRunner.query(`ALTER TABLE \`games\` DROP FOREIGN KEY \`FK_231e3bf4d40e033e03864137113\``);
        await queryRunner.query(`ALTER TABLE \`game_roasters\` DROP FOREIGN KEY \`FK_ca7cbf0f39d4505f3def4ee2198\``);
        await queryRunner.query(`ALTER TABLE \`game_roasters\` DROP FOREIGN KEY \`FK_0ab4fa69ea5db41cf49ccbb9d2a\``);
        await queryRunner.query(`ALTER TABLE \`game_roasters\` DROP FOREIGN KEY \`FK_f55dcf4120348b21aa899a00822\``);
        await queryRunner.query(`ALTER TABLE \`game_stats\` DROP FOREIGN KEY \`FK_73309278f6c6b7b7a273c240567\``);
        await queryRunner.query(`ALTER TABLE \`game_stats\` DROP FOREIGN KEY \`FK_13a674c8d1715401b040983dee8\``);
        await queryRunner.query(`ALTER TABLE \`game_stats\` DROP FOREIGN KEY \`FK_207a04127d611441d47686ceeb5\``);
        await queryRunner.query(`ALTER TABLE \`game_stats\` DROP FOREIGN KEY \`FK_bd5db571ec09d387d82d84daf3d\``);
        await queryRunner.query(`ALTER TABLE \`game_stats\` DROP FOREIGN KEY \`FK_a8e2b0df27f8baa40c5aef8d3e3\``);
        await queryRunner.query(`ALTER TABLE \`pitcher_game_participations\` DROP FOREIGN KEY \`FK_1b51def7742927b8eb23efe38b7\``);
        await queryRunner.query(`ALTER TABLE \`pitcher_game_participations\` DROP FOREIGN KEY \`FK_61a0c2f525649b1e1772df22bb2\``);
        await queryRunner.query(`ALTER TABLE \`pitcher_game_participations\` DROP FOREIGN KEY \`FK_183a7e71b8769c92691056c67b2\``);
        await queryRunner.query(`ALTER TABLE \`pitcher_game_stats\` DROP FOREIGN KEY \`FK_36c2e15af9df5e963ca0ae2135e\``);
        await queryRunner.query(`ALTER TABLE \`batter_game_participations\` DROP FOREIGN KEY \`FK_cf2b31d93d5f27d5c7545cf4781\``);
        await queryRunner.query(`ALTER TABLE \`batter_game_participations\` DROP FOREIGN KEY \`FK_a7ccc1dd62d56aac8100c4c6ba6\``);
        await queryRunner.query(`ALTER TABLE \`batter_game_participations\` DROP FOREIGN KEY \`FK_b29689d47b22e01defb6efd7af3\``);
        await queryRunner.query(`ALTER TABLE \`batter_game_stats\` DROP FOREIGN KEY \`FK_3bd2cb3f2b7140f750a0fdaac8d\``);
        await queryRunner.query(`ALTER TABLE \`game_inning_stats\` DROP FOREIGN KEY \`FK_f6c3223e06f14dd26279cf9824c\``);
        await queryRunner.query(`ALTER TABLE \`player_tournaments\` DROP FOREIGN KEY \`FK_d3f70e4ffdd3b0bcfb957439b6e\``);
        await queryRunner.query(`ALTER TABLE \`player_tournaments\` DROP FOREIGN KEY \`FK_c0525e576c026928aec2fb95bb5\``);
        await queryRunner.query(`DROP INDEX \`REL_44266091b556e03d241ace53da\` ON \`pitcher_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_44266091b556e03d241ace53da\` ON \`pitcher_stats\``);
        await queryRunner.query(`DROP TABLE \`pitcher_stats\``);
        await queryRunner.query(`DROP INDEX \`REL_673bbc97c1577000b37840d4e1\` ON \`batter_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_673bbc97c1577000b37840d4e1\` ON \`batter_stats\``);
        await queryRunner.query(`DROP TABLE \`batter_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_08df7cb9d7295c29e8f1ca80fb\` ON \`umpire_email_codes\``);
        await queryRunner.query(`DROP TABLE \`umpire_email_codes\``);
        await queryRunner.query(`DROP INDEX \`IDX_d95435c3de3a663682fa21ebc2\` ON \`players\``);
        await queryRunner.query(`DROP INDEX \`IDX_ce457a554d63e92f4627d6c576\` ON \`players\``);
        await queryRunner.query(`DROP TABLE \`players\``);
        await queryRunner.query(`DROP INDEX \`IDX_48c0c32e6247a2de155baeaf98\` ON \`teams\``);
        await queryRunner.query(`DROP TABLE \`teams\``);
        await queryRunner.query(`DROP INDEX \`IDX_54f3bc23cb3c4cc8a46f800986\` ON \`team_tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_0843a2f852f36e58beff26c708\` ON \`team_tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_f95b4d911f29f91a7df914f7cf\` ON \`team_tournaments\``);
        await queryRunner.query(`DROP TABLE \`team_tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_2bb25df95b47c4cd34ee356831\` ON \`tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_90d3309455b169f7c054a01171\` ON \`tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_b63b048f5871d7f48cdb4d4de1\` ON \`tournaments\``);
        await queryRunner.query(`DROP TABLE \`tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_2dabd1764981ec5df3ddd6ddd4\` ON \`umpire_tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_567c84be6fc109ed6426e8f638\` ON \`umpire_tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_ba4b70070b8d5110132f35de41\` ON \`umpire_tournaments\``);
        await queryRunner.query(`DROP TABLE \`umpire_tournaments\``);
        await queryRunner.query(`DROP INDEX \`REL_fd8afb174c95560b417d123013\` ON \`umpires\``);
        await queryRunner.query(`DROP INDEX \`IDX_fd8afb174c95560b417d123013\` ON \`umpires\``);
        await queryRunner.query(`DROP TABLE \`umpires\``);
        await queryRunner.query(`DROP INDEX \`IDX_fbe84ca8c9405ed07bf7d47188\` ON \`games\``);
        await queryRunner.query(`DROP INDEX \`IDX_f6bc2302c5abcb1237f534d6ef\` ON \`games\``);
        await queryRunner.query(`DROP INDEX \`IDX_231e3bf4d40e033e0386413711\` ON \`games\``);
        await queryRunner.query(`DROP TABLE \`games\``);
        await queryRunner.query(`DROP INDEX \`IDX_e5e264c9ebbcffafc62165e088\` ON \`game_roasters\``);
        await queryRunner.query(`DROP INDEX \`IDX_ca7cbf0f39d4505f3def4ee219\` ON \`game_roasters\``);
        await queryRunner.query(`DROP INDEX \`IDX_0ab4fa69ea5db41cf49ccbb9d2\` ON \`game_roasters\``);
        await queryRunner.query(`DROP INDEX \`IDX_f55dcf4120348b21aa899a0082\` ON \`game_roasters\``);
        await queryRunner.query(`DROP TABLE \`game_roasters\``);
        await queryRunner.query(`DROP INDEX \`REL_73309278f6c6b7b7a273c24056\` ON \`game_stats\``);
        await queryRunner.query(`DROP INDEX \`REL_13a674c8d1715401b040983dee\` ON \`game_stats\``);
        await queryRunner.query(`DROP INDEX \`REL_207a04127d611441d47686ceeb\` ON \`game_stats\``);
        await queryRunner.query(`DROP INDEX \`REL_bd5db571ec09d387d82d84daf3\` ON \`game_stats\``);
        await queryRunner.query(`DROP INDEX \`REL_a8e2b0df27f8baa40c5aef8d3e\` ON \`game_stats\``);
        await queryRunner.query(`DROP TABLE \`game_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_3e29bbbe09c8647b79a849a20b\` ON \`pitcher_game_participations\``);
        await queryRunner.query(`DROP INDEX \`IDX_1b51def7742927b8eb23efe38b\` ON \`pitcher_game_participations\``);
        await queryRunner.query(`DROP INDEX \`IDX_61a0c2f525649b1e1772df22bb\` ON \`pitcher_game_participations\``);
        await queryRunner.query(`DROP INDEX \`IDX_183a7e71b8769c92691056c67b\` ON \`pitcher_game_participations\``);
        await queryRunner.query(`DROP TABLE \`pitcher_game_participations\``);
        await queryRunner.query(`DROP INDEX \`REL_36c2e15af9df5e963ca0ae2135\` ON \`pitcher_game_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_36c2e15af9df5e963ca0ae2135\` ON \`pitcher_game_stats\``);
        await queryRunner.query(`DROP TABLE \`pitcher_game_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_a4bd825cd021c90bfa0069f1a6\` ON \`batter_game_participations\``);
        await queryRunner.query(`DROP INDEX \`IDX_cf2b31d93d5f27d5c7545cf478\` ON \`batter_game_participations\``);
        await queryRunner.query(`DROP INDEX \`IDX_a7ccc1dd62d56aac8100c4c6ba\` ON \`batter_game_participations\``);
        await queryRunner.query(`DROP INDEX \`IDX_b29689d47b22e01defb6efd7af\` ON \`batter_game_participations\``);
        await queryRunner.query(`DROP TABLE \`batter_game_participations\``);
        await queryRunner.query(`DROP INDEX \`REL_3bd2cb3f2b7140f750a0fdaac8\` ON \`batter_game_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_3bd2cb3f2b7140f750a0fdaac8\` ON \`batter_game_stats\``);
        await queryRunner.query(`DROP TABLE \`batter_game_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_f6c3223e06f14dd26279cf9824\` ON \`game_inning_stats\``);
        await queryRunner.query(`DROP TABLE \`game_inning_stats\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_8d92a13d7363e071af104d357c\` ON \`player_tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_d3f70e4ffdd3b0bcfb957439b6\` ON \`player_tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_c0525e576c026928aec2fb95bb\` ON \`player_tournaments\``);
        await queryRunner.query(`DROP TABLE \`player_tournaments\``);
        await queryRunner.query(`DROP INDEX \`IDX_8681da666ad9699d568b3e9106\` ON \`departments\``);
        await queryRunner.query(`DROP TABLE \`departments\``);
    }

}
