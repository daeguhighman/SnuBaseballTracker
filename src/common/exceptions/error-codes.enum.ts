export enum ErrorCodes {
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',

  /*** NOT FOUND ***/
  NOT_FOUND = 'NOT_FOUND',
  UMPIRE_NOT_FOUND = 'UMPIRE_NOT_FOUND',
  GAME_NOT_FOUND = 'GAME_NOT_FOUND',
  PLAYER_NOT_FOUND = 'PLAYER_NOT_FOUND',
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  TOURNAMENT_NOT_FOUND = 'TOURNAMENT_NOT_FOUND',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  CODE_NOT_FOUND = 'CODE_NOT_FOUND',
  GAME_STAT_NOT_FOUND = 'GAME_STAT_NOT_FOUND',
  PITCHER_NOT_FOUND = 'PITCHER_NOT_FOUND',
  ROSTER_NOT_FOUND = 'ROSTER_NOT_FOUND',
  GAME_INNING_STAT_NOT_FOUND = 'GAME_INNING_STAT_NOT_FOUND',
  PARTICIPATION_NOT_FOUND = 'PARTICIPATION_NOT_FOUND',
  BATTER_GAME_STAT_NOT_FOUND = 'BATTER_GAME_STAT_NOT_FOUND',
  PITCHER_GAME_STAT_NOT_FOUND = 'PITCHER_GAME_STAT_NOT_FOUND',
  /*** UNAUTHORIZED ***/
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  CODE_EXPIRED = 'CODE_EXPIRED',
  CODE_MAX_ATTEMPTS_EXCEEDED = 'CODE_MAX_ATTEMPTS_EXCEEDED',
  INVALID_CODE = 'INVALID_CODE',

  /*** BAD REQUEST ***/
  BAD_REQUEST = 'BAD_REQUEST',
  INVALID_INPUT = 'INVALID_INPUT',

  /*** 1. PLATE APPEARANCE ***/
  PA_HIT_LESS_THAN_SPECIAL_HITS = 'PA_HIT_LESS_THAN_SPECIAL_HITS',
  PA_AT_BATS_LESS_THAN_HITS = 'PA_AT_BATS_LESS_THAN_HITS',
  PA_AT_BATS_LESS_THAN_HITS_PLUS_WALKS_AND_SACRIFICE_FLIES = 'PA_AT_BATS_LESS_THAN_HITS_PLUS_WALKS_AND_SACRIFICE_FLIES',

  /*** 2. LINEUP ***/
  INVALID_LINEUP_ORDER_SEQUENCE = 'INVALID_LINEUP_ORDER_SEQUENCE',
  INVALID_LINEUP_MISSING_POSITION = 'INVALID_LINEUP_MISSING_POSITION',
  INVALID_LINEUP_DUPLICATE_POSITION = 'INVALID_LINEUP_DUPLICATE_POSITION',
  INVALID_LINEUP_DH_P_CONFLICT = 'INVALID_LINEUP_DH_P_CONFLICT',
  INVALID_LINEUP_MISSING_PITCHER = 'INVALID_LINEUP_MISSING_PITCHER',
  INVALID_LINEUP_PITCHER_MISMATCH = 'INVALID_LINEUP_PITCHER_MISMATCH',
  INVALID_LINEUP_DUPLICATE_PLAYER = 'INVALID_LINEUP_DUPLICATE_PLAYER',
  LINEUP_NOT_SUBMITTED = 'LINEUP_NOT_SUBMITTED',
  LINEUP_ALREADY_SUBMITTED = 'LINEUP_ALREADY_SUBMITTED',
  INVALID_LINEUP_WC_LIMIT_EXCEEDED = 'INVALID_LINEUP_WC_LIMIT_EXCEEDED',
  /*** 3. SUBSTITUTE ***/
  PLAYER_ALREADY_IN_ROSTER = 'PLAYER_ALREADY_IN_ROSTER',

  /*** 4. SCOREBOARD ***/
  CANNOT_CHANGE_INNING_AFTER_7TH_INNING = 'CANNOT_CHANGE_INNING_AFTER_7TH_INNING',

  /*** 5. GAME STATUS ***/
  GAME_NOT_IN_PROGRESS = 'GAME_NOT_IN_PROGRESS',
  GAME_INNING_STAT_ALREADY_EXISTS = 'GAME_INNING_STAT_ALREADY_EXISTS',
  GAME_NOT_EDITABLE = 'GAME_NOT_EDITABLE',
}
