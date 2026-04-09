import Link from "next/link";
import {
  ModalButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
} from "../../components/commons/modals/modal.style";
import { useState } from "react";

// 백엔드 정의 에러 코드 -> 한국어 메시지 맵
const ERROR_MESSAGE_MAP = {
  ERR_NETWORK: "credential설정",
  INTERNAL_SERVER_ERROR: "서버 내부 오류가 발생했습니다.",
  NOT_FOUND: "요청한 리소스를 찾을 수 없습니다.",
  UMPIRE_NOT_FOUND: "심판을 찾을 수 없습니다.",
  GAME_NOT_FOUND: "경기를 찾을 수 없습니다.",
  PLAYER_NOT_FOUND: "선수를 찾을 수 없습니다.",
  TEAM_NOT_FOUND: "팀을 찾을 수 없습니다.",
  TOURNAMENT_NOT_FOUND: "토너먼트를 찾을 수 없습니다.",
  TOKEN_NOT_FOUND: "토큰을 찾을 수 없습니다.",
  CODE_NOT_FOUND: "코드를 찾을 수 없습니다.",
  GAME_STAT_NOT_FOUND: "경기 통계를 찾을 수 없습니다.",
  PITCHER_NOT_FOUND: "투수를 찾을 수 없습니다.",
  ROSTER_NOT_FOUND: "명단을 찾을 수 없습니다.",
  GAME_INNING_STAT_NOT_FOUND: "이닝 통계를 찾을 수 없습니다.",
  PARTICIPATION_NOT_FOUND: "참여 정보를 찾을 수 없습니다.",
  BATTER_GAME_STAT_NOT_FOUND: "타자 경기 통계를 찾을 수 없습니다.",
  PITCHER_GAME_STAT_NOT_FOUND: "투수 경기 통계를 찾을 수 없습니다.",
  UNAUTHORIZED: "인증되지 않은 접근입니다.",
  FORBIDDEN: "권한이 없습니다.",
  INVALID_TOKEN: "유효하지 않은 토큰입니다.",
  CODE_EXPIRED: "인증 코드가 만료되었습니다.",
  CODE_MAX_ATTEMPTS_EXCEEDED: "인증 코드 시도 횟수를 초과했습니다.",
  INVALID_CODE: "유효하지 않은 코드입니다.",
  BAD_REQUEST: "잘못된 요청입니다.",
  INVALID_INPUT: "입력 값이 유효하지 않습니다.",
  PA_HIT_LESS_THAN_SPECIAL_HITS: "타수가 특수 안타보다 적습니다.",
  PA_AT_BATS_LESS_THAN_HITS: "타수보다 안타가 더 많습니다.",
  PA_AT_BATS_LESS_THAN_HITS_PLUS_WALKS_AND_SACRIFICE_FLIES:
    "타수보다 안타와 볼넷/희생플라이 합이 더 많습니다.",
  INVALID_LINEUP_ORDER_SEQUENCE: "타순 순서가 잘못되었습니다.",
  INVALID_LINEUP_MISSING_POSITION: "포지션이 누락되었습니다.",
  INVALID_LINEUP_DUPLICATE_POSITION: "중복된 포지션이 있습니다.",
  INVALID_LINEUP_DH_P_CONFLICT: "지명타자와 투수가 충돌합니다.",
  INVALID_LINEUP_MISSING_PITCHER: "투수가 누락되었습니다.",
  INVALID_LINEUP_PITCHER_MISMATCH: "투수가 일치하지 않습니다.",
  INVALID_LINEUP_DUPLICATE_PLAYER: "중복된 선수가 있습니다.",
  LINEUP_NOT_SUBMITTED: "라인업이 제출되지 않았습니다.",
  LINEUP_ALREADY_SUBMITTED: "라인업이 이미 제출되었습니다.",
  PLAYER_ALREADY_IN_ROSTER: "선수가 이미 명단에 등록되어 있습니다.",
  CANNOT_CHANGE_INNING_AFTER_7TH_INNING:
    "7회 이후에는 이닝을 변경할 수 없습니다.",
  GAME_NOT_IN_PROGRESS: "현재 진행 중인 경기가 아닙니다.",
  GAME_INNING_STAT_ALREADY_EXISTS: "이닝 통계가 이미 존재합니다.",
  GAME_NOT_EDITABLE: "경기를 수정할 수 없습니다.",
};

export default function ErrorAlert({
  error,
  onClose, // ⬅️ 부모가 넘겨줄 콜백(선택 사항)
}: {
  error: any;
  onClose?: () => void;
}) {
  const [visible, setVisible] = useState(true);
  if (!error || !visible) return null;

  const code = error.response?.data?.code || error.code;
  const message =
    code && ERROR_MESSAGE_MAP[code]
      ? ERROR_MESSAGE_MAP[code]
      : error.response?.data?.message ||
        error.message ||
        "알 수 없는 오류가 발생했습니다.";

  const handleConfirm = () => {
    setVisible(false); // 모달 닫기
    onClose?.(); // 부모에게도 알려주기(있다면)
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        <ModalTitleSmall>{message}</ModalTitleSmall>
        <ModalButton onClick={handleConfirm}>확인</ModalButton>
      </ModalContainer>
    </ModalOverlay>
  );
}
