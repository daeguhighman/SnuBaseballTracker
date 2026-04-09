// import { Injectable, NotFoundException } from '@nestjs/common';
// import { DataSource, EntityManager } from 'typeorm';
// import { Play, PlayStatus } from '@/plays/entities/play.entity';
// import { GameStat } from '@/games/entities/game-stat.entity';
// import { InningHalf } from '@/common/enums/inning-half.enum';
// import { AddRunnerEventsDto } from './dtos/add-runner-events.dto';
// import { PitcherGameStat } from '@/games/entities/pitcher-game-stat.entity';
// import { BatterGameStat } from '@/games/entities/batter-game-stat.entity';
// import { PlateAppearanceResult } from '@/common/enums/plate-appearance-result.enum';
// import { BatterGameParticipation } from '@/games/entities/batter-game-participation.entity';
// import { PitcherGameParticipation } from '@/games/entities/pitcher-game-participation.entity';
// import { GameInningStat } from '@/games/entities/game-inning-stat.entity';
// import { RunnerEvent } from './entities/runner-event.entity';
// import { GameStatsService } from '@/games/services/game-stats.service';
// import { GameCoreService } from '@/games/services/game-core.service';
// import { Game } from '@/games/entities/game.entity';
// import { RunnerEventInput } from './dtos/create-runner-events.dto';
// import { UpdatePlayDto } from './dtos/update-play.dto';

// @Injectable()
// export class PlayService {
//   constructor(
//     private readonly em: EntityManager,
//     private readonly dataSource: DataSource,
//     private readonly gameStatsService: GameStatsService,
//     private readonly gameCoreService: GameCoreService,
//   ) {}

//   async createPlay(gameId: number) {
//     return await this.em.transaction(async (em) => {
//       const gameStat = await em.findOne(GameStat, { where: { gameId } });
//       if (!gameStat) throw new NotFoundException('GameStat not found');
//       const isTop = gameStat.inningHalf === InningHalf.TOP;
//       const { max } = await em
//         .createQueryBuilder(Play, 'p')
//         .where('p.gameId = :gameId', { gameId })
//         .select('COALESCE(MAX(p.seq), 0)', 'max')
//         .getRawOne();
//       const seq = Number(max) + 1;

//       const play = em.create(Play, {
//         gameId,
//         seq,
//         batterGpId: isTop
//           ? gameStat.awayBatterParticipationId
//           : gameStat.homeBatterParticipationId,
//         pitcherGpId: isTop
//           ? gameStat.homePitcherParticipationId
//           : gameStat.awayPitcherParticipationId,
//         status: PlayStatus.LIVE,
//       });
//       const savedPlay = await em.save(play);

//       // 관중용 스냅샷 push
//       await this.gameCoreService.pushSnapshotAudience(gameId, savedPlay.id);

//       return savedPlay;
//     });
//   }

//   async updatePlay(playId: number, body: UpdatePlayDto) {
//     const queryRunner = this.dataSource.createQueryRunner();
//     await queryRunner.connect();
//     await queryRunner.startTransaction();

//     try {
//       const play = await queryRunner.manager.findOne(Play, {
//         where: { id: playId },
//       });
//       if (!play) throw new NotFoundException('Play not found');

//       play.resultCode = body.resultCode;

//       // Play 엔티티 저장 (한 번만)
//       await queryRunner.manager.save(play);

//       const batterParticipationId = play.batterGpId;
//       const pitcherParticipationId = play.pitcherGpId;

//       // 1. BatterGameStat, BatterStat 업데이트
//       const isHit = await this.updateBatterStats(
//         queryRunner,
//         batterParticipationId,
//         body,
//       );

//       // 2. PitcherGameStat, PitcherStat 업데이트
//       await this.updatePitcherStats(queryRunner, pitcherParticipationId, body);

//       // 3. GameStat 업데이트
//       const gameStat = await queryRunner.manager.findOne(GameStat, {
//         where: { gameId: play.gameId },
//       });
//       if (!gameStat) throw new NotFoundException('GameStat not found');
//       const isTopInning = gameStat.inningHalf === InningHalf.TOP;
//       if (isHit) {
//         isTopInning ? gameStat.awayHits++ : gameStat.homeHits++;
//       }
//       await queryRunner.manager.save(gameStat);
//       await queryRunner.commitTransaction();
//       return play;
//     } catch (error) {
//       await queryRunner.rollbackTransaction();
//       throw error;
//     } finally {
//       await queryRunner.release();
//     }
//   }

//   async addRunnerEvents(playId: number, dto: AddRunnerEventsDto) {
//     return await this.em.transaction(async (em) => {
//       // 1. 엔티티 조회
//       const play = await em.findOne(Play, {
//         where: { id: playId },
//         relations: ['gameInningStat'],
//       });
//       if (!play) throw new NotFoundException('Play not found');

//       const batterGp = await em.findOne(BatterGameParticipation, {
//         where: { id: play.batterGpId },
//         relations: ['batterGameStat'],
//       });

//       const pitcherGp = await em.findOne(PitcherGameParticipation, {
//         where: { id: play.pitcherGpId },
//         relations: ['pitcherGameStat'],
//       });

//       // 2. 이벤트 분류
//       const actual = dto.runnerEvents.filter((e) => e.isActual);
//       const virtual = dto.runnerEvents.filter((e) => !e.isActual);

//       // 3. RunnerEvent 생성
//       const makeRunnerEvents = (events: RunnerEventInput[]): RunnerEvent[] =>
//         events.map((event) => {
//           const runnerEvent = em.create(RunnerEvent, {
//             runnerGpId: event.runnerId,
//             startBase: event.startBase,
//             endBase: event.endBase,
//             isActual: event.isActual,
//             gameId: play.gameId,
//             playId,
//           });
//           return runnerEvent;
//         });

//       const allRunnerEvents = [
//         ...makeRunnerEvents(actual),
//         ...makeRunnerEvents(virtual),
//       ];

//       // 4. phase에 따른 분기 처리
//       if (dto.phase === 'PREV') {
//         // 타석 진행 중 이벤트 처리
//         let hasThreeOuts = false;
//         let abandonedPlay = false;

//         // 이벤트 처리 및 3아웃 확인
//         const result = await this.processEvents(
//           em,
//           play,
//           actual,
//           [], // afterActual은 빈 배열
//           batterGp,
//           pitcherGp,
//         );

//         hasThreeOuts = result.hasThreeOuts;
//         abandonedPlay = result.abandonedPlay;

//         // GameStat 업데이트
//         const gameStat = await em.findOne(GameStat, {
//           where: { gameId: play.gameId },
//         });

//         if (gameStat) {
//           const updatedBases = await this.updateGameStatBases(
//             em,
//             gameStat,
//             actual,
//           );
//           Object.assign(gameStat, updatedBases);
//           await em.save(gameStat);
//         }

//         // RunnerEvents 저장
//         await em.save(allRunnerEvents);

//         // 3아웃이면 이닝 변경 및 공수교대 처리
//         if (hasThreeOuts) {
//           // 3아웃 시 이닝 변경 및 공수교대
//           await this.handleInningChange(em, gameStat, play.gameId);

//           // Game 조회
//           const game = await em.findOne(Game, {
//             where: { id: play.gameId },
//             relations: [
//               'homeTeam.team',
//               'awayTeam.team',
//               'gameStat',
//               'inningStats',
//               'batterGameParticipations',
//               'batterGameParticipations.playerTournament',
//               'batterGameParticipations.playerTournament.player',
//               'batterGameParticipations.batterGameStat',
//               'pitcherGameParticipations',
//               'pitcherGameParticipations.playerTournament',
//               'pitcherGameParticipations.playerTournament.player',
//               'pitcherGameParticipations.pitcherGameStat',
//             ],
//           });
//           if (!game) throw new NotFoundException('Game not found');

//           // 공수교대 시 GameStat의 타자/투수 ID 업데이트
//           const isTopInning = gameStat.inningHalf === 'TOP';
//           const oppositeTeamId = isTopInning
//             ? game.homeTeam.team.id
//             : game.awayTeam.team.id;

//           // 반대쪽 팀의 첫 번째 타자 찾기
//           const firstBatter = await em.findOne(BatterGameParticipation, {
//             where: {
//               gameId: play.gameId,
//               teamTournamentId: oppositeTeamId,
//               battingOrder: 1,
//               isActive: true,
//             },
//           });

//           if (firstBatter) {
//             if (isTopInning) {
//               gameStat.homeBatterParticipationId = firstBatter.id;
//             } else {
//               gameStat.awayBatterParticipationId = firstBatter.id;
//             }
//           }

//           // 반대쪽 팀의 투수 찾기
//           const oppositePitcher = await em.findOne(PitcherGameParticipation, {
//             where: {
//               gameId: play.gameId,
//               teamTournamentId: oppositeTeamId,
//               isActive: true,
//             },
//           });

//           if (oppositePitcher) {
//             if (isTopInning) {
//               gameStat.awayPitcherParticipationId = oppositePitcher.id;
//             } else {
//               gameStat.homePitcherParticipationId = oppositePitcher.id;
//             }
//           }

//           await em.save(gameStat);

//           // GameStat 데이터를 Game 객체에 반영
//           if (gameStat) {
//             game.gameStat.onFirstGpId = gameStat.onFirstGpId;
//             game.gameStat.onSecondGpId = gameStat.onSecondGpId;
//             game.gameStat.onThirdGpId = gameStat.onThirdGpId;
//             game.gameStat.awayBatterParticipationId =
//               gameStat.awayBatterParticipationId;
//             game.gameStat.homeBatterParticipationId =
//               gameStat.homeBatterParticipationId;
//           }

//           const nextPlay = await this.createNextPlay(
//             em,
//             play,
//             hasThreeOuts,
//             abandonedPlay,
//             game,
//           );
//           const snapshot = await this.gameStatsService.makePlaySnapshotUmpire(
//             game,
//             nextPlay.id,
//           );
//           return snapshot;
//         }

//         // 3아웃이 아니면 현재 상태 반환
//         const game = await em.findOne(Game, {
//           where: { id: play.gameId },
//           relations: [
//             'homeTeam.team',
//             'awayTeam.team',
//             'gameStat',
//             'inningStats',
//             'batterGameParticipations',
//             'batterGameParticipations.playerTournament',
//             'batterGameParticipations.playerTournament.player',
//             'batterGameParticipations.batterGameStat',
//             'pitcherGameParticipations',
//             'pitcherGameParticipations.playerTournament',
//             'pitcherGameParticipations.playerTournament.player',
//             'pitcherGameParticipations.pitcherGameStat',
//           ],
//         });

//         if (!game) {
//           throw new NotFoundException('Game not found');
//         }

//         // GameStat 데이터를 Game 객체에 반영
//         if (gameStat) {
//           game.gameStat.onFirstGpId = gameStat.onFirstGpId;
//           game.gameStat.onSecondGpId = gameStat.onSecondGpId;
//           game.gameStat.onThirdGpId = gameStat.onThirdGpId;
//           game.gameStat.awayBatterParticipationId =
//             gameStat.awayBatterParticipationId;
//           game.gameStat.homeBatterParticipationId =
//             gameStat.homeBatterParticipationId;
//         }

//         const snapshot = await this.gameStatsService.makePlaySnapshotUmpire(
//           game,
//           play.id,
//         );
//         return snapshot;
//       } else {
//         // 타석 결과 이벤트 처리 (AFTER)
//         let hasThreeOuts = false;
//         let abandonedPlay = false;

//         // 이벤트 처리 및 3아웃 확인
//         const result = await this.processEvents(
//           em,
//           play,
//           [], // prevActual은 빈 배열
//           actual,
//           batterGp,
//           pitcherGp,
//         );

//         hasThreeOuts = result.hasThreeOuts;
//         abandonedPlay = result.abandonedPlay;

//         // GameStat 업데이트
//         const gameStat = await em.findOne(GameStat, {
//           where: { gameId: play.gameId },
//         });

//         if (gameStat) {
//           const updatedBases = await this.updateGameStatBases(
//             em,
//             gameStat,
//             actual,
//           );
//           Object.assign(gameStat, updatedBases);

//           // 다음 타자 업데이트
//           await this.updateNextBatter(em, play.gameId, gameStat);

//           await em.save(gameStat);
//         }

//         // RunnerEvents 저장
//         await em.save(allRunnerEvents);

//         // Game 조회
//         const game = await em.findOne(Game, {
//           where: { id: play.gameId },
//           relations: [
//             'homeTeam.team',
//             'awayTeam.team',
//             'gameStat',
//             'inningStats',
//             'batterGameParticipations',
//             'batterGameParticipations.playerTournament',
//             'batterGameParticipations.playerTournament.player',
//             'batterGameParticipations.batterGameStat',
//             'pitcherGameParticipations',
//             'pitcherGameParticipations.playerTournament',
//             'pitcherGameParticipations.playerTournament.player',
//             'pitcherGameParticipations.pitcherGameStat',
//           ],
//         });
//         if (!game) throw new NotFoundException('Game not found');

//         // 3아웃이면 이닝 변경 및 공수교대 처리
//         if (hasThreeOuts) {
//           // 3아웃 시 이닝 변경 및 공수교대
//           await this.handleInningChange(em, gameStat, play.gameId);

//           // 공수교대 시 GameStat의 타자/투수 ID 업데이트
//           const isTopInning = gameStat.inningHalf === 'TOP';
//           const oppositeTeamId = isTopInning
//             ? game.homeTeam.team.id
//             : game.awayTeam.team.id;

//           // 반대쪽 팀의 첫 번째 타자 찾기
//           const firstBatter = await em.findOne(BatterGameParticipation, {
//             where: {
//               gameId: play.gameId,
//               teamTournamentId: oppositeTeamId,
//               battingOrder: 1,
//               isActive: true,
//             },
//           });

//           if (firstBatter) {
//             if (isTopInning) {
//               gameStat.homeBatterParticipationId = firstBatter.id;
//             } else {
//               gameStat.awayBatterParticipationId = firstBatter.id;
//             }
//           }

//           // 반대쪽 팀의 투수 찾기
//           const oppositePitcher = await em.findOne(PitcherGameParticipation, {
//             where: {
//               gameId: play.gameId,
//               teamTournamentId: oppositeTeamId,
//               isActive: true,
//             },
//           });

//           if (oppositePitcher) {
//             if (isTopInning) {
//               gameStat.awayPitcherParticipationId = oppositePitcher.id;
//             } else {
//               gameStat.homePitcherParticipationId = oppositePitcher.id;
//             }
//           }

//           await em.save(gameStat);
//         }

//         // 다음 플레이 생성
//         play.status = PlayStatus.COMPLETE;
//         await em.save(play);

//         // GameStat 데이터를 Game 객체에 반영
//         if (gameStat) {
//           game.gameStat.onFirstGpId = gameStat.onFirstGpId;
//           game.gameStat.onSecondGpId = gameStat.onSecondGpId;
//           game.gameStat.onThirdGpId = gameStat.onThirdGpId;
//           game.gameStat.awayBatterParticipationId =
//             gameStat.awayBatterParticipationId;
//           game.gameStat.homeBatterParticipationId =
//             gameStat.homeBatterParticipationId;
//         }

//         const nextPlay = await this.createNextPlay(
//           em,
//           play,
//           hasThreeOuts,
//           abandonedPlay,
//           game,
//         );
//         const snapshot = await this.gameStatsService.makePlaySnapshotUmpire(
//           game,
//           nextPlay.id,
//         );
//         return snapshot;
//       }
//     });
//   }

//   /**
//    * 이벤트들을 처리하고 3아웃 여부를 확인
//    */
//   private async processEvents(
//     em: EntityManager,
//     play: Play,
//     prevActual: RunnerEventInput[],
//     afterActual: RunnerEventInput[],
//     batterGp: BatterGameParticipation,
//     pitcherGp: PitcherGameParticipation,
//   ): Promise<{ hasThreeOuts: boolean; abandonedPlay: boolean }> {
//     let hasThreeOuts = false;
//     let abandonedPlay = false;

//     // prevActual 이벤트 처리 (타석 중 발생한 이벤트)
//     for (const event of prevActual) {
//       const result = await this.processRunnerEvent(
//         em,
//         event,
//         play,
//         batterGp,
//         pitcherGp,
//       );
//       if (result.hasThreeOuts) {
//         hasThreeOuts = true;
//         abandonedPlay = true; // prevActual에서 3아웃이면 타석 중단
//         return { hasThreeOuts, abandonedPlay };
//       }
//     }

//     // afterActual 이벤트 처리 (타석 결과로 발생한 이벤트)
//     for (const event of afterActual) {
//       const result = await this.processRunnerEvent(
//         em,
//         event,
//         play,
//         batterGp,
//         pitcherGp,
//       );
//       if (result.hasThreeOuts) {
//         hasThreeOuts = true;
//         return { hasThreeOuts, abandonedPlay };
//       }
//     }

//     return { hasThreeOuts, abandonedPlay };
//   }

//   /**
//    * 개별 RunnerEvent 처리
//    */
//   private async processRunnerEvent(
//     em: EntityManager,
//     event: RunnerEventInput,
//     play: Play,
//     batterGp: BatterGameParticipation,
//     pitcherGp: PitcherGameParticipation,
//   ): Promise<{ hasThreeOuts: boolean }> {
//     const runnerGp = await em.findOne(BatterGameParticipation, {
//       where: { id: event.runnerId },
//       relations: ['batterGameStat'],
//     });
//     if (!runnerGp) throw new NotFoundException('Runner not found');

//     if (event.endBase === 'O') {
//       play.gameInningStat.outs++;
//       console.log('outs', play.gameInningStat.outs);

//       // 투수의 inningPitchedOuts 1 증가
//       if (pitcherGp && pitcherGp.pitcherGameStat) {
//         pitcherGp.pitcherGameStat.inningPitchedOuts++;
//         await em.save(pitcherGp.pitcherGameStat);
//       }

//       if (play.gameInningStat.outs === 3) {
//         return { hasThreeOuts: true };
//       }
//     } else if (event.endBase === 'H') {
//       // 득점 처리
//       play.gameInningStat.runs++;

//       // 주자(BatterGameStat)의 runs 1 증가
//       if (runnerGp && runnerGp.batterGameStat) {
//         runnerGp.batterGameStat.runs++;
//         await em.save(runnerGp.batterGameStat);
//       }

//       // 투수(PitcherGameStat)의 allowedRuns 1 증가
//       if (pitcherGp && pitcherGp.pitcherGameStat) {
//         pitcherGp.pitcherGameStat.allowedRuns++;
//         await em.save(pitcherGp.pitcherGameStat);
//       }
//     }
//     await em.save(play.gameInningStat);

//     return { hasThreeOuts: false };
//   }

//   /**
//    * GameStat의 주자 슬롯 업데이트
//    */
//   private async updateGameStatBases(
//     em: EntityManager,
//     gameStat: GameStat,
//     allActualEvents: RunnerEventInput[],
//   ): Promise<Partial<GameStat>> {
//     let bases = {
//       1: gameStat.onFirstGpId,
//       2: gameStat.onSecondGpId,
//       3: gameStat.onThirdGpId,
//     };

//     for (const event of allActualEvents) {
//       const { runnerId, startBase, endBase } = event;

//       if (startBase === 'B' && ['1', '2', '3'].includes(endBase)) {
//         // 타자가 베이스로 진루
//         bases[Number(endBase)] = runnerId;
//       } else if (startBase === 'B' && endBase === 'H') {
//         // 타자 홈런 케이스 - 베이스에서 제거할 필요 없음

//       } else if (
//         ['1', '2', '3'].includes(startBase) &&
//         ['1', '2', '3'].includes(endBase)
//       ) {
//         // 주자가 베이스 간 이동 (도루, 진루 등)
//         if (String(bases[Number(startBase)]) === String(runnerId)) {
//           bases[Number(startBase)] = null;
//         }
//         bases[Number(endBase)] = runnerId;
//       } else if (
//         ['1', '2', '3'].includes(startBase) &&
//         (endBase === 'H' || endBase === 'O')
//       ) {
//         // 주자가 홈으로 들어오거나 아웃
//         if (String(bases[Number(startBase)]) === String(runnerId)) {
//           bases[Number(startBase)] = null;
//         }
//       }
//     }

//     return {
//       onFirstGpId: bases[1] ?? null,
//       onSecondGpId: bases[2] ?? null,
//       onThirdGpId: bases[3] ?? null,
//     };
//   }

//   /**
//    * 다음 플레이 생성
//    */
//   private async createNextPlay(
//     em: EntityManager,
//     play: Play,
//     hasThreeOuts: boolean,
//     abandonedPlay: boolean,
//     game: Game,
//   ): Promise<Play> {
//     // 1. 현재 GameStat 조회
//     const gameStat = await em.findOne(GameStat, {
//       where: { gameId: play.gameId },
//     });
//     if (!gameStat) throw new NotFoundException('GameStat not found');
//     const inningStat = await em.findOne(GameInningStat, {
//       where: {
//         gameId: play.gameId,
//         inning: gameStat.inning,
//         inningHalf: gameStat.inningHalf,
//       },
//     });
//     if (!inningStat) throw new NotFoundException('InningStat not found');

//     // 3. 타자와 투수 결정
//     let nextBatterGpId: number;
//     let nextPitcherGpId: number;

//     if (hasThreeOuts) {
//       // 공수교대가 되었으면 반대쪽 타자/투수 사용
//       const isTopInning = gameStat.inningHalf === 'TOP';
//       nextBatterGpId = isTopInning
//         ? gameStat.homeBatterParticipationId
//         : gameStat.awayBatterParticipationId;
//       nextPitcherGpId = isTopInning
//         ? gameStat.awayPitcherParticipationId
//         : gameStat.homePitcherParticipationId;
//     } else {
//       // 공수교대가 안되었으면 nextBatter 메서드 사용
//       if (abandonedPlay) {
//         // 타석 중단이면 현재 타자 유지
//         nextBatterGpId = play.batterGpId;
//       } else {
//         // 타석 완료면 다음 타자 찾기
//         const nextBatter = await this.findNextBatter(em, play.gameId, gameStat);
//         nextBatterGpId = nextBatter.id;
//       }
//       nextPitcherGpId = play.pitcherGpId; // 투수는 현재 투수 유지
//     }

//     const nextPlay = em.create(Play, {
//       game: { id: play.gameId },
//       gameId: play.gameId,
//       seq: play.seq + 1,
//       batterGpId: nextBatterGpId,
//       pitcherGpId: nextPitcherGpId,
//       gameInningStat: inningStat,
//       gameInningStatId: inningStat.id,
//       status: PlayStatus.LIVE,
//     });

//     return await em.save(nextPlay);
//   }

//   // 1. BatterGameStat, BatterStat 업데이트
//   private async updateBatterStats(
//     queryRunner,
//     batterParticipationId,
//     body: UpdatePlayDto,
//   ): Promise<boolean> {
//     // BatterGameParticipation, BatterGameStat, BatterStat 조회
//     const batterParticipation = await queryRunner.manager.findOne(
//       BatterGameParticipation,
//       {
//         where: { id: batterParticipationId },
//       },
//     );
//     if (!batterParticipation)
//       throw new NotFoundException('BatterGameParticipation not found');
//     const batterGameStat = await queryRunner.manager.findOne(BatterGameStat, {
//       where: { batterGameParticipationId: batterParticipationId },
//     });
//     if (!batterGameStat)
//       throw new NotFoundException('BatterGameStat not found');

//     let isHit = false;
//     const resultCode = body.resultCode;
//     batterGameStat.plateAppearances++;
//     switch (resultCode) {
//       case PlateAppearanceResult.SINGLE:
//         batterGameStat.atBats++;
//         batterGameStat.singles++;
//         batterGameStat.hits++;

//         isHit = true;
//         break;
//       case PlateAppearanceResult.DOUBLE:
//         batterGameStat.atBats++;
//         batterGameStat.doubles++;
//         batterGameStat.hits++;
//         isHit = true;
//         break;
//       case PlateAppearanceResult.TRIPLE:
//         batterGameStat.atBats++;
//         batterGameStat.triples++;
//         batterGameStat.hits++;
//         isHit = true;
//         break;
//       case PlateAppearanceResult.HOMERUN:
//         batterGameStat.atBats++;
//         batterGameStat.homeRuns++;
//         batterGameStat.hits++;
//         isHit = true;
//         break;
//       case PlateAppearanceResult.WALK:
//         batterGameStat.walks++;
//         break;
//       case PlateAppearanceResult.SACRIFICE_FLY:
//         batterGameStat.sacrificeFlies++;
//         break;
//       case PlateAppearanceResult.SACRIFICE_BUNT:
//         batterGameStat.sacrificeBunts++;
//         break;
//       case PlateAppearanceResult.STRIKEOUT:
//         batterGameStat.strikeouts++;
//         break;
//       case PlateAppearanceResult.STRIKEOUT_DROP:
//         batterGameStat.strikeouts++;
//         break;
//       case PlateAppearanceResult.FIELDERS_CHOICE:
//         batterGameStat.atBats++;
//         break;
//       case PlateAppearanceResult.ERROR:
//         batterGameStat.atBats++;
//         break;
//       case PlateAppearanceResult.OUT:
//         batterGameStat.atBats++;
//         break;
//     }
//     await queryRunner.manager.save(batterGameStat);
//     return isHit;
//   }

//   // 2. PitcherGameStat, PitcherStat 업데이트
//   private async updatePitcherStats(
//     queryRunner,
//     pitcherParticipationId,
//     body: UpdatePlayDto,
//   ) {
//     // PitcherGameParticipation, PitcherGameStat, PitcherStat 조회
//     const pitcherParticipation = await queryRunner.manager.findOne(
//       PitcherGameParticipation,
//       {
//         where: { id: pitcherParticipationId },
//       },
//     );
//     if (!pitcherParticipation)
//       throw new NotFoundException('PitcherGameParticipation not found');
//     const pitcherGameStat = await queryRunner.manager.findOne(PitcherGameStat, {
//       where: { pitcherGameParticipationId: pitcherParticipationId },
//     });
//     if (!pitcherGameStat)
//       throw new NotFoundException('PitcherGameStat not found');
//     // TODO: body.resultCode에 따라 기록 업데이트 (삼진, 실점 등)
//     const resultCode = body.resultCode;
//     switch (resultCode) {
//       case PlateAppearanceResult.STRIKEOUT:
//         pitcherGameStat.strikeouts++;
//         break;
//       case PlateAppearanceResult.STRIKEOUT_DROP:
//         pitcherGameStat.strikeouts++;
//         break;
//       case PlateAppearanceResult.SINGLE:
//       case PlateAppearanceResult.DOUBLE:
//       case PlateAppearanceResult.TRIPLE:
//       case PlateAppearanceResult.HOMERUN:
//         pitcherGameStat.hits++;
//         break;
//       case PlateAppearanceResult.WALK:
//         pitcherGameStat.walks++;
//         break;
//     }
//     await queryRunner.manager.save(pitcherGameStat);
//   }

//   /**
//    * 3아웃 시 이닝 변경 및 공수교대 처리
//    * @param em EntityManager
//    * @param gameStat 게임 상태
//    * @param gameId 게임 ID
//    */
//   private async handleInningChange(
//     em: EntityManager,
//     gameStat: GameStat,
//     gameId: number,
//   ): Promise<void> {
//     // 1. 이닝 변경
//     this.advanceInning(gameStat);

//     // 2. 주자판 비우기
//     this.clearBases(gameStat);

//     // 3. GameStat 저장
//     await em.save(gameStat);

//     // 4. 새로운 이닝의 GameInningStat 생성
//     await this.createNewInningStat(em, gameStat, gameId);
//   }

//   /**
//    * 이닝을 다음으로 진행
//    * @param gameStat 게임 상태
//    */
//   private advanceInning(gameStat: GameStat): void {
//     if (gameStat.inningHalf === InningHalf.TOP) {
//       // 1회초 → 1회말
//       gameStat.inningHalf = InningHalf.BOT;
//     } else {
//       // 1회말 → 2회초
//       gameStat.inning += 1;
//       gameStat.inningHalf = InningHalf.TOP;
//     }
//   }

//   /**
//    * 주자판 비우기
//    * @param gameStat 게임 상태
//    */
//   private clearBases(gameStat: GameStat): void {
//     gameStat.onFirstGpId = null;
//     gameStat.onSecondGpId = null;
//     gameStat.onThirdGpId = null;
//   }

//   /**
//    * 새로운 이닝의 GameInningStat 생성
//    * @param em EntityManager
//    * @param gameStat 게임 상태
//    * @param gameId 게임 ID
//    */
//   private async createNewInningStat(
//     em: EntityManager,
//     gameStat: GameStat,
//     gameId: number,
//   ): Promise<void> {
//     const newInningStat = em.create(GameInningStat, {
//       game: { id: gameId },
//       gameId: gameId,
//       inning: gameStat.inning,
//       inningHalf: gameStat.inningHalf,
//       runs: 0,
//       outs: 0,
//       errorFlag: false,
//     });
//     await em.save(newInningStat);
//   }

//   /**
//    * 다음 타자를 찾고 GameStat을 업데이트
//    * @param em EntityManager
//    * @param gameId 게임 ID
//    * @param gameStat 게임 상태
//    * @param analysis 분석 결과
//    */
//   private async updateNextBatter(
//     em: EntityManager,
//     gameId: number,
//     gameStat: GameStat,
//   ): Promise<void> {
//     // 공수교대가 안되었으면 nextBatter 메서드 사용
//     const nextBatter = await this.findNextBatter(em, gameId, gameStat);

//     // GameStat의 현재 타자 ID 업데이트
//     if (gameStat.inningHalf === 'TOP') {
//       gameStat.awayBatterParticipationId = nextBatter.id;
//     } else {
//       gameStat.homeBatterParticipationId = nextBatter.id;
//     }
//   }

//   /**
//    * 다음 타자를 찾는 메서드
//    * @param em EntityManager
//    * @param gameId 게임 ID
//    * @param gameStat 게임 상태
//    * @returns 다음 타자 BatterGameParticipation 또는 null
//    */
//   private async findNextBatter(
//     em: EntityManager,
//     gameId: number,
//     gameStat: GameStat,
//   ): Promise<BatterGameParticipation> {
//     // 현재 공격 팀 ID 결정
//     const isTopInning = gameStat.inningHalf === 'TOP';
//     const currentBatterGpId = isTopInning
//       ? gameStat.awayBatterParticipationId
//       : gameStat.homeBatterParticipationId;

//     // 현재 타자 정보 조회
//     const currentBatter = await em.findOne(BatterGameParticipation, {
//       where: { id: currentBatterGpId },
//       relations: ['teamTournament'],
//     });

//     // 현재 공격 팀의 모든 활성 타자 조회 (타순 순으로 정렬)
//     const teamBatters = await em.find(BatterGameParticipation, {
//       where: {
//         gameId: gameId,
//         teamTournamentId: currentBatter.teamTournamentId,
//         isActive: true,
//       },
//       order: { battingOrder: 'ASC' },
//     });

//     if (teamBatters.length === 0) {
//       throw new NotFoundException('No next batter found');
//     }

//     // 현재 타자의 타순 찾기
//     const currentOrder = currentBatter.battingOrder;

//     // 다음 타자 찾기 (현재 타순 + 1, 만약 마지막이면 1번으로)
//     let nextOrder = currentOrder + 1;
//     if (nextOrder > teamBatters.length) {
//       nextOrder = 1;
//     }

//     // 다음 타자 반환
//     const nextBatter = teamBatters.find((b) => b.battingOrder === nextOrder);
//     return nextBatter;
//   }
// }
