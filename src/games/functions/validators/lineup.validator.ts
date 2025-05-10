import { HttpStatus } from '@nestjs/common';
import { SubmitLineupRequestDto } from '@games/dtos/lineup.dto';
import { Position } from '@/common/enums/position.enum';
import { BaseException } from '@/common/exceptions/base.exception';
import { ErrorCodes } from '@/common/exceptions/error-codes.enum';

interface LineupValidationContext {
  submitLineupDto: SubmitLineupRequestDto;
  teamId: number;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
  code?: ErrorCodes;
}

export class LineupValidator {
  private static readonly REQUIRED_POSITIONS = new Set([
    Position.C,
    Position['1B'],
    Position['2B'],
    Position['3B'],
    Position.SS,
    Position.LF,
    Position.CF,
    Position.RF,
  ]);

  private static validationBattingOrderSequence(
    context: LineupValidationContext,
  ): ValidationResult {
    const { batters } = context.submitLineupDto;
    const orderSet = new Set(batters.map((b) => b.battingOrder));
    for (let i = 1; i <= 9; i++) {
      if (!orderSet.has(i)) {
        return {
          isValid: false,
          error: `타순 ${i}번이 존재하지 않습니다.`,
          code: ErrorCodes.INVALID_LINEUP_ORDER_SEQUENCE,
        };
      }
    }

    return { isValid: true };
  }
  private static validatePositions(
    context: LineupValidationContext,
  ): ValidationResult {
    const { batters } = context.submitLineupDto;
    const positionCount = new Map<Position, number>();
    let hasDH = false;
    let hasPitcher = false;

    // 각 포지션 카운트
    batters.forEach((batter) => {
      positionCount.set(
        batter.position as Position,
        (positionCount.get(batter.position as Position) || 0) + 1,
      );

      if (batter.position === Position.DH) hasDH = true;
      if (batter.position === Position.P) hasPitcher = true;
    });

    // DH와 P가 동시에 있는지 확인
    if (hasDH === hasPitcher) {
      return {
        isValid: false,
        error:
          '지명타자와 투수는 둘 중 하나만 라인업에 포함되어 있어야 합니다.',
        code: ErrorCodes.INVALID_LINEUP_DH_P_CONFLICT,
      };
    }

    // 필수 포지션 확인
    for (const position of LineupValidator.REQUIRED_POSITIONS) {
      if (!positionCount.has(position)) {
        return {
          isValid: false,
          error: `${position} 포지션이 없습니다.`,
          code: ErrorCodes.INVALID_LINEUP_MISSING_POSITION,
        };
      }
      if (positionCount.get(position) > 1) {
        return {
          isValid: false,
          error: `${position} 포지션이 중복되어 있습니다.`,
          code: ErrorCodes.INVALID_LINEUP_DUPLICATE_POSITION,
        };
      }
    }

    return { isValid: true };
  }
  private static validatePitcherLineup(
    context: LineupValidationContext,
  ): ValidationResult {
    const { batters, pitcher } = context.submitLineupDto;
    if (!pitcher) {
      return {
        isValid: false,
        error: '투수는 반드시 선택되어야 합니다.',
        code: ErrorCodes.INVALID_LINEUP_MISSING_PITCHER,
      };
    }

    const hasDH = batters.some((b) => b.position === Position.DH);
    if (!hasDH) {
      // 타순에 투수가 있는지 확인
      const pitcherInLineup = batters.find((b) => b.position === Position.P);

      if (!pitcherInLineup) {
        return {
          isValid: false,
          error:
            'DH가 없는 경우 포지션이 P인 타자가 라인업에 포함되어야 합니다.',
          code: ErrorCodes.INVALID_LINEUP_MISSING_PITCHER,
        };
      }

      // 타순의 투수와 지정된 투수가 일치하는지 확인
      if (pitcherInLineup.playerId !== pitcher.playerId) {
        return {
          isValid: false,
          error: '포지션이 P인 타자와 지정된 투수는 같은 선수여야 합니다.',
          code: ErrorCodes.INVALID_LINEUP_PITCHER_MISMATCH,
        };
      }
      if (hasDH) {
        // 타순에 투수가 있는지 확인
        const pitcherInLineup = batters.find((b) => b.position === Position.P);

        if (pitcherInLineup) {
          return {
            isValid: false,
            error:
              'DH가 있는 경우 포지션이 P인 타자는 라인업에 포함될 수 없습니다.',
            code: ErrorCodes.INVALID_LINEUP_PITCHER_MISMATCH,
          };
        }

        // 지정된 투수가 타자로 타순에 포함되어 있는지 확인
        const isPitcherInBattingOrder = batters.some(
          (b) => b.playerId === pitcher.playerId,
        );

        if (isPitcherInBattingOrder) {
          return {
            isValid: false,
            error: 'DH가 있는 경우 투수는 타순에 포함될 수 없습니다.',
            code: ErrorCodes.INVALID_LINEUP_PITCHER_MISMATCH,
          };
        }
      }
      return { isValid: true };
    } else {
      // hasDH가 true인 경우
      // 타순에 투수가 있는지 확인
      const pitcherInLineup = batters.find((b) => b.position === Position.P);

      if (pitcherInLineup) {
        return {
          isValid: false,
          error:
            'DH가 있는 경우 포지션이 P인 타자는 라인업에 포함될 수 없습니다.',
          code: ErrorCodes.INVALID_LINEUP_PITCHER_MISMATCH,
        };
      }

      // 지정된 투수가 타자로 타순에 포함되어 있는지 확인
      const isPitcherInBattingOrder = batters.some(
        (b) => b.playerId === pitcher.playerId,
      );

      if (isPitcherInBattingOrder) {
        return {
          isValid: false,
          error: 'DH가 있는 경우 투수는 타순에 포함될 수 없습니다.',
          code: ErrorCodes.INVALID_LINEUP_PITCHER_MISMATCH,
        };
      }
      return { isValid: true };
    }
  }
  private static validateDuplicatePlayers(
    context: LineupValidationContext,
  ): ValidationResult {
    const { batters } = context.submitLineupDto;
    const playerSet = new Set<number>();

    for (const batter of batters) {
      if (playerSet.has(batter.playerId)) {
        return {
          isValid: false,
          error: `중복된 선수가 있습니다: ${batter.playerId}`,
          code: ErrorCodes.INVALID_LINEUP_DUPLICATE_PLAYER,
        };
      }
      playerSet.add(batter.playerId);
    }

    return { isValid: true };
  }
  public static validate(context: LineupValidationContext): void {
    const validators = [
      this.validationBattingOrderSequence,
      this.validatePositions,
      this.validatePitcherLineup,
      this.validateDuplicatePlayers,
    ];

    for (const validator of validators) {
      const result = validator(context);
      if (!result.isValid) {
        throw new BaseException(
          result.error,
          result.code,
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
