import styled from "@emotion/styled";

const small = "@media only screen and (max-width: 480px)";
const medium =
  "@media only screen and (min-width: 481px) and (max-width: 768px)";
const large =
  "@media only screen and (min-width: 769px) and (max-width: 1024px)";
const xlarge = "@media only screen and (min-width: 1025px)";

// 메인 컨테이너
export const GameRecordContainer = styled.div`
  width: 100%;
  /* max-width: 768px; */
  margin-top: 120px;
  background-color: rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const ScoreBoardWrapper = styled.div`
  width: calc((100% - 2px));
  /* margin-top: 2vh; */
  margin-top: calc((100vh - 120px) * 0.01);
  height: calc((100vh - 120px) * 0.2);
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid black;
  border-radius: 10px;
`;

/** ─────────────────────────────────────────────────────────
 *  1) 상단 이닝 헤더 (총 12열: 이닝(1~9) + R + H)
 * ───────────────────────────────────────────────────────── */
export const InningHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  width: 100%;
  height: 33%;
  align-items: center;
  border-bottom: 1px solid #ccc;
  /* background-color: red; */
`;

export const InningCell = styled.div`
  text-align: center;
  /* padding-top: 1vh; */
  /* background-color: red; */
  /* padding-bottom: 1vh; */
  font-weight: 600;
  ${small} {
    font-size: 15px;
  }
  ${medium} {
    font-size: 20px;
  }
  ${large}, ${xlarge} {
    font-size: 20px;
  }
`;

/** ─────────────────────────────────────────────────────────
 *  2) 팀 이름과 점수를 한 행으로 구성 (총 12열)
 *     첫 번째 열: 팀 이름 (별도 스타일)
 *     나머지 11열: 이닝별 점수 (팀 점수 셀)
 * ───────────────────────────────────────────────────────── */
export const TeamRow = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr); /* 12개의 동일한 너비 */
  width: 100%;
  align-items: center;
  /* border-bottom: 1px solid #ccc; */
  /* background-color: aqua; */
  height: 33%;
`;

export const TeamNameCell = styled.div`
  text-align: center;
  padding: 1vh 0;
  font-weight: 500;
  font-family: "KBO-Dia-Gothic_medium";
  font-style: normal;

  ${small} {
    font-size: 10px;
  }
  ${medium} {
    font-size: 12px;
  }
  ${large}, ${xlarge} {
    font-size: 14px;
  }
`;

export const TeamScoreCell = styled.div`
  text-align: center;
  font-family: "KBO-Dia-Gothic_light";
  padding: 1vh 0;
  font-weight: 400;
  ${small} {
    font-size: 15px;
  }
  ${medium} {
    font-size: 20px;
  }
  ${large}, ${xlarge} {
    font-size: 20px;
  }
`;

/** ─────────────────────────────────────────────────────────
 *  3) 공수교대 / 경기종료 버튼 섹션
 * ───────────────────────────────────────────────────────── */
export const ControlButtonsRow = styled.div`
  width: 100%;
  height: calc((100vh - 120px) * 0.15 - 3vh);
  border-bottom: 1px solid #ccc;
  /* margin-top: 100px; */
  /* padding: 1vh 0; */
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  /* padding-top: 1vh; */
  /* background-color: aqua; */
`;

export const ControlButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end; /* 요소들을 아래쪽 정렬 */
  width: 90%;
  /* background-color: red; */
  /* padding-top: 2vh; */
`;

export const ControlButton = styled.button`
  background-color: #000000;
  width: 26vw;
  height: 4.5vh;
  border: 1px solid #999;
  font-family: "KBO-Dia-Gothic_bold";
  font-weight: bold;
  font-size: 12px;
  color: #ffffff;
  cursor: pointer;
  border-radius: 4px;
`;

/** ─────────────────────────────────────────────────────────
 *  4) 이번 이닝 득점 섹션
 * ───────────────────────────────────────────────────────── */
export const InningScoreContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc((100vh - 120px) * 0.2);
  border-bottom: 1px solid #ccc;
  text-align: center;
  padding-top: 4vh;
  padding-bottom: 4vh;
`;

export const InningScoreTitle = styled.div`
  /* margin-bottom: 8px; */
  font-family: "KBO-Dia-Gothic_bold";
  font-weight: 500;
  ${small} {
    font-size: 20px;
  }
  ${medium} {
    font-size: 23px;
  }
  ${large}, ${xlarge} {
    font-size: 24px;
  }
`;

export const InningScoreControls = styled.div`
  display: inline-flex;
  /* background-color: red; */
  align-items: center;
  gap: 16px;
`;

export const ScoreButton = styled.button`
  background-color: #000000;
  border: none;
  color: #ffffff;
  border-radius: 4px;
  font-size: 16px;
  font-family: "KBO-Dia-Gothic_bold";
  font-weight: 500;
  width: 40px;
  height: 40px;
  cursor: pointer;

  ${small} {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }
`;

export const ScoreDisplay = styled.div`
  font-size: 48px;
  min-width: 24px;
  text-align: center;
  font-family: "KBO-Dia-Gothic_light";

  ${small} {
    font-size: 48px;
  }
`;

/** ─────────────────────────────────────────────────────────
 *  5) 현재 타자 / 투수 정보 섹션
 * ───────────────────────────────────────────────────────── */

export const PlayersRow = styled.div`
  display: flex;
  width: 100%;
  height: calc((100vh - 120px) * 0.32);
  border-bottom: 1px solid #ccc;
`;

export const PlayerBox = styled.div`
  flex: 1;
  border-right: 1px solid #ccc;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative; /* OrderBadge를 절대 위치로 배치하기 위해 필요 */
  &:last-child {
    border-right: none;
  }
`;

export const PlayerChangeButton = styled.button`
  position: absolute;
  top: 0;
  left: 0;
  background-color: #000;
  width: 16vw;
  height: 4vh;

  color: #fff;
  border: none;
  font-family: "KBO-Dia-Gothic_bold";
  font-size: 12px;
  /* padding: 6px 12px; */
  cursor: pointer;
`;

export const PlayerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 60%;
`;

export const PlayerPosition = styled.div`
  font-family: "KBO-Dia-Gothic_light";
  color: rgba(0, 0, 0, 0.5);
  ${small} {
    font-size: 20px;
  }
  ${medium} {
    font-size: 24px;
  }
  ${large}, ${xlarge} {
    font-size: 26px;
  }
`;

export const PlayerInfo = styled.div`
  font-weight: 500;
  line-height: 1.4;
  ${small} {
    font-size: 32px;
  }
  ${medium} {
    font-size: 35px;
  }
  ${large}, ${xlarge} {
    font-size: 36px;
  }
`;

interface PlayerExWrapperProps {
  count: number;
}

export const PlayerExWrapper = styled.div<PlayerExWrapperProps>`
  display: flex;
  flex-direction: row;
  justify-content: ${({ count }) => (count === 1 ? "center" : "space-between")};
  width: 15vh;
`;

export const EliteBox = styled.div`
  width: 50px;
  height: 20px;
  background-color: #ff0004;
  font-family: "KBO-Dia-Gothic_light";
  color: #ffffff;
  border-radius: 35px;
  text-align: center;
`;

export const WildCardBox = styled.div`
  width: 50px;
  height: 20px;
  background-color: #f3a231;
  font-family: "KBO-Dia-Gothic_light";
  color: #ffffff;
  border-radius: 35px;
  text-align: center;
`;

export const WildCardBoxNone = styled.div`
  width: 50px;
  height: 20px;
  background-color: transparent;
  font-family: "KBO-Dia-Gothic_light";

  text-align: center;
`;

/** ─────────────────────────────────────────────────────────
 *  6) 하단 기록 입력 버튼 섹션
 * ───────────────────────────────────────────────────────── */
export const RecordActionsRow = styled.div`
  display: grid;
  width: 100%;
  height: calc((100vh - 120px) * 0.12 + 3vh);
  grid-template-columns: repeat(4, 1fr);
`;

export const RecordActionButton = styled.button`
  /* 기본적으로 모든 테두리 제거 */
  border: none;
  background-color: #0f0f70;
  font-family: "KBO-Dia-Gothic_bold";
  font-weight: bold;
  font-size: 20px;
  color: #ffffff;

  /* 마지막 버튼이 아닌 경우(1, 2, 3번째)에만 오른쪽 테두리 추가 */
  &:not(:last-child) {
    border-right: 1px solid white;
  }

  ${small} {
    font-size: 20px;
  }
  ${medium} {
    font-size: 24px;
  }
  ${large}, ${xlarge} {
    font-size: 25px;
  }
`;

/** ─────────────────────────────────────────────────────────
 *  추가: 선수교체 버튼과 order값을 정렬하기 위한 flex 컨테이너
 * ───────────────────────────────────────────────────────── */

/** ─────────────────────────────────────────────────────────
 *  추가: 선수 순번(Order)을 표시하기 위한 스타일 태그
 * ───────────────────────────────────────────────────────── */
// OrderBadge를 PlayerBox의 우상단에 딱 붙게 설정
export const OrderBadge = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  /* background: #fff; */
  /* border: 1px solid #ccc; */
  /* border-radius: 50%; */
  width: 7vh;
  height: 24px;
  margin-top: 10px;
  /* margin-right: 5px; */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-family: "KBO-Dia-Gothic_medium";
`;

// 이 아래에 추가
