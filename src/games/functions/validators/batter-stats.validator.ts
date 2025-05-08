import { BaseException } from '@/common/exceptions/base.exception';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';
import { BadRequestException, HttpStatus } from '@nestjs/common';

export class BatterStatsValidator {
  /**
   * 타자 스탯의 유효성을 검증합니다.
   * 1. 타수(AB) >= 안타(H) >= 홈런(HR) + 2루타(2B) + 3루타(3B)
   * 2. 타석(PA) >= 타수(AB) + 볼넷(BB) + 희생타(SAC)
   *
   * @throws {BadRequestException} 검증 실패 시 예외를 던집니다.
   */
  static validateUpdateRequest(
    currentStats: {
      plateAppearances: number; // 타석
      atBats: number; // 타수
      singles: number; // 1루타
      doubles: number; // 2루타
      triples: number; // 3루타
      homeRuns: number; // 홈런
      walks: number; // 볼넷
      sacrificeFlies: number; // 희생타
    },
    updateDto: {
      PA?: number; // 타석
      AB?: number; // 타수
      H?: number; // 총 안타
      '2B'?: number; // 2루타
      '3B'?: number; // 3루타
      HR?: number; // 홈런
      BB?: number; // 볼넷
      SAC?: number; // 희생타
    },
  ): void {
    // 변경될 값 계산
    const newPA =
      updateDto.PA !== undefined ? updateDto.PA : currentStats.plateAppearances;
    const newAtBats =
      updateDto.AB !== undefined ? updateDto.AB : currentStats.atBats;
    const newDoubles =
      updateDto['2B'] !== undefined ? updateDto['2B'] : currentStats.doubles;
    const newTriples =
      updateDto['3B'] !== undefined ? updateDto['3B'] : currentStats.triples;
    const newHomeRuns =
      updateDto.HR !== undefined ? updateDto.HR : currentStats.homeRuns;
    const newWalks =
      updateDto.BB !== undefined ? updateDto.BB : currentStats.walks;
    const newSacrificeFlies =
      updateDto.SAC !== undefined ? updateDto.SAC : currentStats.sacrificeFlies;

    // 특수 타입 안타(2B+3B+HR) 합계
    const specialHits = newDoubles + newTriples + newHomeRuns;

    // 새로운 총 안타 수
    let newTotalHits;
    if (updateDto.H !== undefined) {
      newTotalHits = updateDto.H;
      // 특수 타입 안타 합계가 총 안타 수를 초과하는지 검증
      if (newTotalHits < specialHits) {
        throw new BaseException(
          `총 안타 수(${newTotalHits})는 2루타(${newDoubles}) + 3루타(${newTriples}) + 홈런(${newHomeRuns})보다 작을 수 없습니다.`,
          ErrorCodes.PA_HIT_LESS_THAN_SPECIAL_HITS,
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      // 요청에 H가 없는 경우, 현재 1루타 + 새로운 특수 타입 안타를 사용
      newTotalHits = currentStats.singles + specialHits;
    }

    // 타수 >= 안타 검증
    if (newAtBats < newTotalHits) {
      throw new BaseException(
        `타수(${newAtBats})는 총 안타 수(${newTotalHits})보다 작을 수 없습니다.`,
        ErrorCodes.PA_AT_BATS_LESS_THAN_HITS,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 타석 >= 타수 + 볼넷 + 희생타 검증
    const accountedPA = newAtBats + newWalks + newSacrificeFlies;
    if (newPA < accountedPA) {
      throw new BaseException(
        `타수(${newAtBats}) + 볼넷(${newWalks}) + 희생타(${newSacrificeFlies})의 합이 타석(${newPA})을 초과할 수 없습니다.`,
        ErrorCodes.PA_AT_BATS_LESS_THAN_HITS_PLUS_WALKS_AND_SACRIFICE_FLIES,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 타자 스탯을 조정하여 일관성을 유지합니다.
   * 1. 총 안타(H) = 1루타 + 2루타 + 3루타 + 홈런을 유지합니다.
   * 2. ETC = 타석(PA) - (타수(AB) + 볼넷(BB) + 희생타(SAC))로 자동 계산합니다.
   *
   * @returns 타자 스탯 조정 결과
   */
  static adjustStats(
    currentStats: {
      plateAppearances: number; // 타석
      atBats: number; // 타수
      singles: number; // 1루타
      doubles: number; // 2루타
      triples: number; // 3루타
      homeRuns: number; // 홈런
      walks: number; // 볼넷
      sacrificeFlies: number; // 희생타
      etcs: number; // 기타 결과
    },
    updateDto: {
      PA?: number; // 타석
      AB?: number; // 타수
      H?: number; // 총 안타
      '2B'?: number; // 2루타
      '3B'?: number; // 3루타
      HR?: number; // 홈런
      BB?: number; // 볼넷
      SAC?: number; // 희생타
    },
  ): {
    plateAppearances: number;
    atBats: number;
    singles: number;
    doubles: number;
    triples: number;
    homeRuns: number;
    walks: number;
    sacrificeFlies: number;
    etcs: number;
  } {
    // 먼저 검증 수행
    this.validateUpdateRequest(currentStats, updateDto);

    // 검증 통과 후 기존 값 복사
    const result = { ...currentStats };

    // 업데이트할 값이 있으면 적용
    if (updateDto.PA !== undefined) result.plateAppearances = updateDto.PA;
    if (updateDto.AB !== undefined) result.atBats = updateDto.AB;
    if (updateDto['2B'] !== undefined) result.doubles = updateDto['2B'];
    if (updateDto['3B'] !== undefined) result.triples = updateDto['3B'];
    if (updateDto.HR !== undefined) result.homeRuns = updateDto.HR;
    if (updateDto.BB !== undefined) result.walks = updateDto.BB;
    if (updateDto.SAC !== undefined) result.sacrificeFlies = updateDto.SAC;

    // 1. 총 안타(H)에 따른 1루타 조정
    if (updateDto.H !== undefined) {
      // 2, 3루타, 홈런을 제외한 나머지를 1루타로 조정
      result.singles = Math.max(
        0,
        updateDto.H - result.doubles - result.triples - result.homeRuns,
      );
    }

    // 2. etc 계산 (PA에서 AB, BB, SAC을 뺀 나머지)
    const accountedPA = result.atBats + result.walks + result.sacrificeFlies;
    result.etcs = result.plateAppearances - accountedPA;

    return result;
  }
}
