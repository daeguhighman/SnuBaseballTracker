import styled from "@emotion/styled";
import { Switch } from "antd";
const small = "@media only screen and (max-width: 480px)";
const medium =
  "@media only screen and (min-width: 481px) and (max-width: 768px)";
const large =
  "@media only screen and (min-width: 769px) and (max-width: 1024px)";
const xlarge = "@media only screen and (min-width: 1025px)";

// 메인 컨테이너
export const GameRecordContainer = styled.div`
  width: 100%;
  max-width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* min-height: 100vh; */
  height: calc(var(--vh) * 100);
  background-color: #f2f2f7;
`;

export const ScoreBoardWrapper = styled.div`
  width: 90%;
  /* margin-top: 2vh; */

  height: calc((100vh - 120px) * 0.2);
  margin-top: 3vh;
  margin-bottom: 1vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  /* border: 1px solid black; */
  border-radius: 10px;
  box-shadow: 0px 21px 6px rgba(0, 0, 0, 0),
    //
    0px 14px 5px rgba(0, 0, 0, 0),
    //
    0px 8px 5px rgba(0, 0, 0, 0.02),
    //
    0px 3px 3px rgba(0, 0, 0, 0.03),
    //
    0px 1px 2px rgba(0, 0, 0, 0.03);
`;

/** ─────────────────────────────────────────────────────────
 *  1) 상단 이닝 헤더 (총 12열: 이닝(1~9) + R + H)
 * ───────────────────────────────────────────────────────── */
export const InningHeader = styled.div<{ $innings?: number }>`
  display: grid;
  grid-template-columns: 15vw repeat(${({ $innings = 7 }) => $innings + 2}, 1fr);
  width: 100%;
  height: 33%;
  justify-content: center;
  align-items: center;
  /* border-bottom: 1px solid #ccc; */
  /* 모든 셀에 보더 붙이고, 아래 끝에 정렬 */

  margin-top: 1vh;
  > * {
    /* margin-bottom: 1vh; */

    padding-bottom: 1vh;
    border-bottom: 1px solid #ccc;
  }

  /* 첫 번째 셀만 보더 제거 */
  > *:first-of-type {
    border-bottom: none;
  }

  /* 마지막 두 칸(R, H) */
  > *:nth-last-of-type(-n + 2) {
    color: red;
  }
  /* margin-right: 1vh; */
  padding-right: 1vh;
  /* background-color: red; */
`;

export const InningCell = styled.div`
  text-align: center;
  /* padding-top: 1vh; */
  /* background-color: red; */
  /* padding-bottom: 1vh; */
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 1.125rem;
`;

/** ─────────────────────────────────────────────────────────
 *  2) 팀 이름과 점수를 한 행으로 구성 (총 12열)
 *     첫 번째 열: 팀 이름 (별도 스타일)
 *     나머지 11열: 이닝별 점수 (팀 점수 셀)
 * ───────────────────────────────────────────────────────── */
export const TeamRow = styled.div<{ $innings?: number }>`
  display: grid;
  grid-template-columns: 15vw repeat(${({ $innings = 7 }) => $innings + 2}, 1fr);

  width: 100%;
  align-items: center;
  /* border-bottom: 1px solid #ccc; */
  /* background-color: aqua; */
  height: 33%;
  /* 마지막 두 칸(R, H) */
  > *:nth-last-of-type(-n + 2) {
    color: red;
    font-weight: 700;
  }
  padding-right: 1vh;
`;

export const TeamNameCell = styled.div`
  text-align: center;
  /* padding: 1vh 0; */
  font-weight: 500;
  font-family: "Pretendard";
  font-size: 0.8125rem;
  font-weight: 700;
  /* background-color: red; */
  padding-left: 2.5vw;
  padding-right: 1vw;
`;

export const TeamScoreCell = styled.div`
  text-align: center;
  font-family: "Pretendard";
  font-weight: 400;
`;

/** ─────────────────────────────────────────────────────────
 *  3) 공수교대 / 경기종료 버튼 섹션
 * ───────────────────────────────────────────────────────── */
export const ControlButtonsRow = styled.div`
  width: 100%;
  height: 7vh;
  margin-top: 1.5vh;
  margin-bottom: 1.5vh;
  /* border-bottom: 1px solid #ccc; */

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
  width: 19vw;
  height: 4.8vh;
  border: 1px solid #999;
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 0.813rem;
  color: #ffffff;
  cursor: pointer;
  border-radius: 20px;
`;

export const ControlButtonWhite = styled.button`
  width: 19vw;
  height: 4.8vh;
  font-size: 0.813rem;
  border: none;
  background-color: #ffffff;
  color: #000000;
  font-family: "Pretendard";
  font-weight: 700;
  box-shadow: 0px 21px 6px rgba(0, 0, 0, 0),
    //
    0px 14px 5px rgba(0, 0, 0, 0),
    //
    0px 8px 5px rgba(0, 0, 0, 0.02),
    //
    0px 3px 3px rgba(0, 0, 0, 0.03),
    //
    0px 1px 2px rgba(0, 0, 0, 0.03);
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
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
  /* font-family: "KBO-Dia-Gothic_bold"; */
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
  /* font-family: "KBO-Dia-Gothic_bold"; */
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
  /* font-family: "KBO-Dia-Gothic_light"; */

  ${small} {
    font-size: 48px;
  }
`;

/** ─────────────────────────────────────────────────────────
 *  5) 현재 타자 / 투수 정보 섹션
 * ───────────────────────────────────────────────────────── */

export const InningRow = styled.div`
  display: flex;
  width: 90%;
  height: 3vh;
  border-bottom: 1px solid #ccc;
  background-color: #ffffff;
  border-radius: 5px;
  margin-top: 1vh;
  padding-left: 1vw;
  padding-right: 1vw;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
`;

export const InningItem = styled.div<{
  $isSelected?: boolean;
  $hasData?: boolean;
}>`
  cursor: ${({ $hasData }) => ($hasData ? "pointer" : "default")};
  padding: 0.5vh 1vw;
  font-family: "Pretendard";
  font-weight: 500;
  font-size: 0.75rem;
  color: ${({ $isSelected, $hasData }) => {
    if (!$hasData) return "#DADADA"; // 데이터 없으면 회색
    if ($isSelected) return "#007AFF"; // 선택되면 파란색
    return "#000"; // 기본 검은색
  }};

  // 호버 효과 (선택사항)
  &:hover {
    opacity: 0.7;
  }

  // 활성화 상태 (선택사항)
  &:active {
    transform: scale(0.95);
  }
`;

export const InningFullContainer = styled.div`
  // width: 95%;

  // display: flex;
  // flex-direction: column;
  // justify-content: space-between;
  // align-items: center;
`;
export const InningDividerContainer = styled.div<{ $isTop?: boolean }>`
  width: 85%;
  height: 2vh;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ $isTop }) => ($isTop ? "1.5vh" : "0")};
  align-self: center;
`;
export const InningDividerText = styled.div`
  width: 5%;
  height: 2vh;
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 0.5rem;
  color: #000;
  white-space: nowrap; // 텍스트가 줄바꿈되지 않도록
  // margin-right: 1vw; // 텍스트와 선 사이 간격
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const InningDividerLine = styled.div`
  width: 90%;
  height: 2vh;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const InningDividerReal = styled.div`
  width: 100%; // flex: 1인 부모의 전체 너비 사용
  height: 0.3px;
  background-color: #2c333b;
  opacity: 0.3;
`;

export const PlayersRow = styled.div`
  display: flex;
  width: 90%;
  height: 20vh;
  border-bottom: 1px solid #ccc;
  background-color: #ffffff;
  border-radius: 10px;
  margin-top: 1vh;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 2vh;
  padding-bottom: 2vh;
  margin-bottom: 12vh;
`;

export const BatterPlayerBox = styled.div<{ $compact?: boolean }>`
  width: 100%;
  display: flex;
  height: 100%;
  flex-direction: column;

  // background-color: blue;

  /* 👇 3개 미만일 때 상단 붙이기 */
  justify-content: ${({ $compact }) =>
    $compact ? "flex-start" : "space-between"};
  align-items: ${({ $compact }) => ($compact ? "stretch" : "center")};

  /* 간격/패딩 보정 */
  // gap: ${({ $compact }) => ($compact ? "0.5vh" : "0.5vh")};
  // padding-top: ${({ $compact }) => ($compact ? "0.5vh" : "0.5vh")};

  /* 스크롤바 공간을 항상 확보하여 레이아웃 일정성 유지 */
  overflow-y: scroll; /* auto 대신 scroll 사용 */
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  /* 3개 미만일 때 스크롤 비활성화 (스크롤바는 유지) */
  pointer-events: ${({ $compact }) => ($compact ? "none" : "auto")};

  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ $compact }) =>
      $compact ? "transparent" : "rgba(0, 0, 0, 0.2)"};
    border-radius: 3px;
  }

  /* Firefox용 스크롤바 스타일링 */
  scrollbar-width: thin;
  scrollbar-color: ${({ $compact }) =>
    $compact ? "transparent transparent" : "rgba(0, 0, 0, 0.2) transparent"};
`;

export const BatterPlayerSingleBox = styled.div<{
  $compact?: boolean;
  $isLast?: boolean;
}>`
  width: 100%;
  display: flex;
  // background-color: red;
  flex-direction: row;
  // justify-content: space-between;
  align-items: center;
  /* compact 모드에서는 고정 높이 제거 */
  height: 35%; /* 고정 높이로 설정 */
  min-height: 35%; /* 최소 높이도 보장 */
  flex-shrink: 0; /* 스크롤 시에도 높이 축소 방지 */
  position: relative; /* 가상 요소를 위한 상대 위치 */

  /* 기존 border 제거하고 가상 요소로 대체 */
  border-bottom: none;

  /* 가상 요소로 90% 길이의 border 생성 - 중앙 정렬 */
  /* 마지막 요소가 아닐 때만 border 표시 */
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 50%; /* 중앙에서 시작 */
    transform: translateX(-50%); /* 자신의 너비의 절반만큼 왼쪽으로 이동 */
    width: 85%;
    height: 0.3px;
    background-color: rgba(44, 51, 59, 0.3);
    /* 마지막 요소면 border 숨김 */
    display: ${({ $isLast }) => ($isLast ? "none" : "block")};
  }
`;
export const Divider = styled.div`
  width: 90%;
  height: 0.3px;
  background-color: #2c333b;
  opacity: 0.3;
  // margin-bottom: 1vh;
  /* margin: 8px 0; */
`;

export const DividerForPitcher = styled.div`
  width: 90%;
  height: 0.3px;
  background-color: #2c333b;
  opacity: 0.3;
  /* margin: 8px 0; */
`;

// ── 그룹 컨테이너 ──
export const BatterGroup = styled.div`
  box-sizing: border-box;
  /* flex-shrink: 0; */
  display: flex;
  flex-direction: column; /* stack each row vertically */
  justify-content: center;
  align-items: center; /* or center, depending on how you want the rows aligned */
  width: 100%; /* ≈ 209px @ 375px-wide reference */
  height: 100%; /* ≈ 131px @ 812px-tall reference */
  overflow: hidden;
  // background-color: red;
`;

export const BatterRow = styled.div<{ $isLast?: boolean }>`
  display: flex;
  flex-direction: row; /* lay out circle / who / today horizontally */
  align-items: center;
  justify-content: space-between;
  width: 85%; /* fill the full width of the group */
  padding: 0 0.27vw; /* ≈ 1px left/right padding @ 375px base */
  // gap: 1.87vw; /* ≈ 7px gap between items */
  /* height will auto-size to its children; remove absolute sizing */
  /* background-color: green; */
  // padding-bottom: 1vh;
  height: 100%;
  /* 마지막 요소가 아닐 때만 border-bottom 적용 - DividerForPitcher와 동일한 스타일 */
`;
export const OrderCircle = styled.div`
  color: #000;
  text-align: center;
  font-family: "Pretendard";
  font-weight: 600;
  font-size: 0.625rem; /* 10px */

  width: 1.6vw; /* 6px */
  height: 4.56vh; /* 37px */
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const WhoContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1vw; // 두 컨테이너 사이 간격
  align-items: flex-start;
  justify-content: space-between; // space-evenly 대신 space-between 사용
  width: 18vw; // 16vw에서 30vw로 증가 (또는 필요에 따라 조정)
  height: 3.5vh;

  // background-color: red;
`;

export const NameAvgContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5vh;
  align-items: flex-start;
  justify-content: flex-start;
`;

export const ResultOrderContainer = styled.div`
  display: flex;
  flex-direction: column;
  // gap: 0.5vh;
  height: 100%;
  align-items: center;

  justify-content: space-between;
`;

// export const NameResultContainer = styled.div`
//   display: flex;
//   flex-direction: row;
//   /* gap: 0.53vw; */
//   align-items: center;
//   justify-content: space-between;
//   width: 18vw; /* 51px */
//   margin-bottom: 0.5vh;
//   background-color: green;
// `;

export const PlayerName = styled.div<{ $nameLength?: number }>`
  color: #000;
  /* text-align: center; */
  font-family: "Pretendard";

  font-size: ${({ $nameLength }) =>
    $nameLength && $nameLength >= 4
      ? "0.5rem"
      : "0.625rem"}; /* 4글자 이상이면 14px, 아니면 16px */
  font-weight: 700;
  width: 9vw; /* 45px */
  height: 2.09vh; /* 17px */

  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding-top: 0.125rem;
  justify-content: flex-start;
  // background-color: green;
`;

export const ResultBox = styled.div<{ $isOut?: boolean }>`
  width: 7vw;
  height: 1.6vh;
  background-color: ${({ $isOut }) => ($isOut ? "red" : "#007AFF")};
  font-family: "Pretendard";
  font-size: 0.4rem;
  font-weight: 700;
  color: #ffffff;
  border-radius: 3.125rem;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const AvgFrame = styled.div`
  /* flex-shrink: 0; */
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  width: 16vw;
  height: 0.86vh; /* 7px */
  overflow: visible;
  /* position: relative; */
  /* background-color: red; */
`;

export const AvgText = styled.div`
  color: #2c333b;
  opacity: 50%;
  text-align: center;
  font-family: "Pretendard";
  font-size: 0.4375rem; /* 8px */
  font-weight: 600;

  display: flex;

  align-items: center;
  /* justify-content: space-evenly; */
`;

export const BattingOrderLabel = styled.div`
  color: #2c333b;
  // opacity: 50%;
  text-align: center;
  font-family: "Pretendard";
  font-size: 0.4375rem; /* 8px */
  font-weight: 600;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* justify-content: space-evenly; */
`;

export const AvgLabel = styled.span`
  color: #000;
`;
export const AvgValue = styled.span`
  color: var(--blue-1, #000);
`;

// ── 오늘 성적 ──
export const TodayContainer = styled.div`
  display: flex;
  width: 40%;
  flex-direction: row;
  /* gap: 2.13vw; */
  align-items: center;
  /* align-self: flex-end; */
  justify-content: space-evenly;
  height: 4.56vh; /* 37px */
`;

export const TodayFrame = styled.div`
  display: flex;
  flex-direction: column;
  /* gap: 0.53vw; */
  height: 80%;
  align-items: center;
  justify-content: space-evenly;
  width: 20%; /* 13px */
  /* height: auto; */
  /* background-color: red; */
`;

export const OpponentPitcherFrame = styled.div`
  display: flex;
  flex-direction: row;

  height: 80%;
  align-items: center;
  justify-content: space-evenly;
  width: 30%; /* 13px */

  font-family: "Pretendard";
  font-size: 0.75rem; /* 8px */
  font-weight: 600;
`;

export const OpponentPitcherLabel = styled.span`
  color: #707070;
  font-family: "Pretendard";
  font-weight: 600;
  font-size: 0.625rem; // 필요에 따라 조정
`;

export const OpponentPitcherName = styled.span`
  color: #000; // 또는 기본 텍스트 색상
  font-family: "Pretendard";
  font-weight: 600;
  font-size: 0.625rem; // 필요에 따라 조정
`;

export const TodayLabel = styled.div`
  color: #000;
  font-family: "Pretendard";
  font-size: 0.5rem; /* 8px */
  font-weight: 600;
`;

export const TodayValue = styled(TodayLabel)``;

// ── 피처 영역 ──
export const PitcherPlayerBox = styled.div`
  width: 30%;
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  // background-color: aqua;
`;

export const PitcherGroup = styled.div`
  display: flex;
  flex-direction: column;

  align-items: center;
  // justify-content: space-between;
  width: 24.27vw; /* 91px */
  height: 100%; /* 131px */
  /* position: relative; */
  /* overflow: hidden; */
  // background-color: red;
`;

export const PitcherWho = styled.div`
  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: space-evenly;
  width: 21.87vw; /* 82px */
  height: 35%; /* 39px */
  padding-top: 1vh;
  // margin-bottom: 0.5vh;
  // background-color: green;

  border-bottom: 0.3px solid rgba(44, 51, 59, 0.3);
`;

export const PitcherName = styled.div`
  color: #000;
  text-align: center;
  font-family: "Pretendard";
  font-size: 1rem; /* 16px */
  font-weight: 700;
  width: 17vw; /* 45px */
  height: 2.09vh; /* 17px */
  display: flex;
  align-items: center;
  justify-content: center;
  // background-color: red;
`;

export const PitcherToday = styled.div`
  display: flex;
  flex-direction: row;

  align-items: center;
  justify-content: space-evenly;
  width: 20vw; /* 78px */
  // background-color: red;
`;

export const StatFrame = styled.div<{ $isWide?: boolean }>`
  margin-top: 0.5vh;
  width: ${(props) => (props.$isWide ? "13vw" : "8vw")};
  height: 1.5vh; /* 7px */
  /* display: flex;
  flex-direction: row; */
  // background-color: red;
  /* justify-content: space-between; */
`;

export const StatFrame2 = styled.div<{ $isWide?: boolean }>`
  margin-top: 0.5vh;
  width: ${(props) => (props.$isWide ? "13vw" : "8vw")};
  height: 1.5vh; /* 7px */
  /* display: flex;
  flex-direction: row; */
  /* background-color: red; */
  // justify-content: space-evenly;
  /* align-items: center; */
`;

export const StatText = styled.div`
  text-align: center;
  font-family: "Pretendard";
  font-size: 0.5rem; /* 8px */
  font-weight: 600;
  // background-color: aqua;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
`;

export const StatLabel = styled.span`
  color: #000;
`;
export const StatValue = styled.span`
  color: var(--blue-1, #007aff);
  // width: 3vw;
  // background-color: red;
  /* id가 ip인 요소만 다른 width 적용 */
`;
export const PitcherStatsGrid = styled.div`
  margin-top: 0.5vh;
  display: grid;
  gap: 4vw;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: minmax(4vh, auto);
  // background-color: aqua;
`;

export const StatCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.53vw;
  align-items: center;
  justify-content: center;
`;

export const StatName = styled.div`
  color: #000;
  font-family: "Pretendard";
  font-size: 0.5rem;
  font-weight: 600;
`;

export const StatNumber = styled(StatName)``;

export const PlayerChangeButton = styled.button`
  background-color: #000;
  width: 17vw;
  height: 3vh;
  border-radius: 25px;
  color: #fff;
  border: none;
  font-family: "Pretendard";
  font-weight: 500;
  text-align: center;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  font-size: 0.75rem;
  /* padding: 6px 12px; */
  cursor: pointer;
`;
export const LeftArrow = styled.div`
  width: 13vw; /* 화살표 크기 */
  height: 100%;
  background-image: url("/images/L.png");
  /* background-color: red; */
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
`;

export const RightArrow = styled.div`
  width: 13vw; /* 화살표 크기 */
  height: 100%;
  background-image: url("/images/R.png");
  /* background-color: red; */
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
`;

export const VsText = styled.div`
  font-family: "Pretendard";
  font-weight: 600;
`;

export const PlayerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 80%;
`;

export const PlayerPosition = styled.div`
  display: inline-flex;
  align-items: center;
  font-family: "Pretendard";
  font-weight: 500;
  font-size: 0.625rem;
  color: rgba(0, 0, 0, 0.5);
`;

export const Dot = styled.span`
  display: inline-block;
  width: 2px; /* 점 크기 */
  height: 2px;
  margin: 0 0.21rem; /* 좌우 간격 */
  background-color: currentColor; /* 텍스트 컬러와 동일하게 */
  border-radius: 50%;
`;

export const PlayerInfo = styled.div`
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 1.3125rem;
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
  /* font-family: "KBO-Dia-Gothic_light"; */
  color: #ffffff;
  border-radius: 35px;
  text-align: center;
`;

export const WildCardBox = styled.div`
  width: 50px;
  height: 20px;
  background-color: #f3a231;
  /* font-family: "KBO-Dia-Gothic_light"; */
  color: #ffffff;
  border-radius: 35px;
  text-align: center;
`;

export const WildCardBoxNone = styled.div`
  width: 50px;
  height: 20px;
  background-color: transparent;
  /* font-family: "KBO-Dia-Gothic_light"; */

  text-align: center;
`;

/** ─────────────────────────────────────────────────────────
 *  6) 하단 기록 입력 버튼 섹션
 * ───────────────────────────────────────────────────────── */
export const RecordActionsRow = styled.div`
  display: grid;
  width: 100%;
  height: 10vh;
  grid-template-columns: repeat(4, 1fr);
  margin-top: auto;
`;

export const RecordActionButton = styled.button`
  /* 기본적으로 모든 테두리 제거 */
  border: none;
  background-color: #0f0f70;
  /* font-family: "KBO-Dia-Gothic_bold"; */
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
  width: 7vh;
  height: 24px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  /* font-family: "KBO-Dia-Gothic_medium"; */
`;

/** ─────────────────────────────────────────────────────────
 *  v2경기기록 관련
 * ───────────────────────────────────────────────────────── */

export const GraphicWrapper = styled.div`
  position: relative;
  overflow: visible;
  width: 90%;
  height: 42vh;
  /* background-color: red; */
  z-index: 0;
  /* ─── 배경 이미지 전체 덮기 ─── */
  background-image: url("/images/ground-without-home.png");
  background-size: cover; /* 컨테이너에 꽉 채우기 */
  background-position: center; /* 가운데를 기준으로 하기 */
  background-repeat: no-repeat; /* 반복하지 않기 */

  border-radius: 2vh;
  /* margin: 3vh 0; */
`;

export const HomeWrapper = styled.div`
  /* position: relative;
  overflow: visible;
  width: 90%;
  height: 40vh; */
  position: absolute; /* ② 절대 위치로 변경 */
  inset: 0;
  /* background-color: red; */
  z-index: 5;
  /* ─── 배경 이미지 전체 덮기 ─── */
  background-image: url("/images/home.png");
  background-size: cover; /* 컨테이너에 꽉 채우기 */
  background-position: center; /* 가운데를 기준으로 하기 */
  background-repeat: no-repeat; /* 반복하지 않기 */

  border-radius: 2vh;
  /* margin: 3vh 0; */
`;

export const LineWrapper = styled.div`
  /* position: relative;
  overflow: visible;
  width: 90%;
  height: 40vh; */
  position: absolute; /* ② 절대 위치로 변경 */
  inset: 0;
  /* background-color: red; */
  z-index: 7;
  /* ─── 배경 이미지 전체 덮기 ─── */
  background-image: url("/images/line.png");
  background-size: cover; /* 컨테이너에 꽉 채우기 */
  background-position: center; /* 가운데를 기준으로 하기 */
  background-repeat: no-repeat; /* 반복하지 않기 */

  border-radius: 2vh;
  /* margin: 3vh 0; */
`;

export const HomeBaseWrapper = styled.div`
  position: absolute;
  inset: 0;
  z-index: 80;

  /* 배경색을 흰/파랑으로 토글 */
  background-color: #ffffff;

  /* mask 에 흰색 png 파일의 알파 채널을 씁니다 */
  mask-image: url("/images/home-base-white-1.png");
  mask-size: cover;
  mask-position: center;
  mask-repeat: no-repeat;

  /* 사파리(webkit) 지원을 위해 */
  -webkit-mask-image: url("/images/home-base-white-1.png");
  -webkit-mask-size: cover;
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
`;

export const Ground = styled.div<{ outside?: boolean }>`
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;

  /* only paint red outside the circle at 50% 55% of 40% radius */
  background: ${(p) => (p.outside ? "red" : "transparent")};
  opacity: 30%;
  /* mask‐out that central circle */
  mask-image: radial-gradient(
    circle at 50% 55%,
    /* center of your OutZoneWrapper */ transparent 40%,
    /* inside the circle: transparent (cut‑out) */ black 40%
      /* outside: opaque => show the bg */
  );
  mask-mode: alpha;

  /* for Safari: */
  -webkit-mask-image: radial-gradient(
    circle at 50% 50%,
    transparent 55%,
    black 40%
  );
  -webkit-mask-mode: alpha;

  border-radius: 2vh;
`;

export const FullImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const OutCount = styled.div`
  width: 5vh;
  height: 2vh;
  display: flex;
  /* gap: 1vw; */
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
  background: #000;
  border-radius: 50px;

  /* padding: 0.5vh 1vw; */
`;

export const SideWrapper = styled.div`
  position: absolute;
  left: 84%;
  top: 75%;
  width: 5vh;
  /* height: 20vh; */
  /* background-color: red; */
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const Ellipse = styled.div<{ active?: boolean }>`
  width: 1vh;
  height: 1vh;
  align-self: center;
  border-radius: 50%;
  background: ${(p) => (p.active ? "#fb0000" : "#707070")};
`;

export const OnDeckWrapper = styled.div`
  margin-top: 0.5vh;
  /* position: absolute; */
  width: 5vh;
  /* dynamic height로 바꿔주면 내용에 맞게 늘어납니다 */
  height: 5.5vh;
  z-index: 80;
  font-family: "Pretendard";
  font-weight: 400;
  /* font-weight: bold; */
  font-size: 0.5rem;
  background-color: black;
  color: #f2f2f7;
  border-radius: 5px;
  /* margin-top: 0.4rem; */
  display: flex;
  flex-direction: column;
  /* 위아래 간격을 0.3rem씩 주기 */
  /* gap: 0.22rem; */
  /* 항목들이 위쪽부터 시작하도록 */
  justify-content: space-evenly;
  align-items: center;

  /* 위아래 여백도 추가하고 싶으면 padding 활용 */
  /* padding: 0.3rem 0; */
`;

export const OverlaySvg = styled.svg`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: auto;
  overflow: visible;
  // background-color: blue;
`;

export const DiamondSvg = styled.svg`
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 56%;
  transform: translate(-50%, -50%);
  width: 47%;
  height: auto;
  overflow: visible;
  fill: transparent;
  background-image: url("/images/diamond.png");
  background-size: cover; /* 컨테이너에 꽉 채우기 */
  background-position: center; /* 가운데를 기준으로 하기 */
  background-repeat: no-repeat; /* 반복하지 않기 */

  /* border: 1px solid black; */
  /* background-color: red; */

  /* 기존 inner 기본 스타일 */
  & .inner {
    fill: #ffffff;
    stroke: none;
  }

  /* 여기에 highlight 스타일 추가 */
  & .inner.highlight {
    fill: blue;
    transition: fill 0.2s ease;
  }
`;
export const Rotator = styled(OverlaySvg)`
  width: 4vw;
  height: 4vw;
  left: auto;
  right: 5vw;
  top: 2vh;
`;

export const ResetDot = styled.div`
  position: absolute;
  width: 2.5rem;
  height: 2.5rem;
  background-image: url("/images/reset.png");
  background-size: 150% auto;
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;

  z-index: 90; /* ★ 여기를 높게 주면 다른 요소보다 위에 올라옵니다 */
  pointer-events: auto;
`;
export const NameBadge = styled.div`
  position: absolute;
  font-family: "Pretendard";
  font-weight: 600;
  z-index: 999;
  left: 50%;
  font-size: 0.8rem;
  top: 85%;
  transform: translate(0, -50%);
  background: #ffffff;
  border: 0.3px solid black;
  border-radius: 50px;
  padding: 1vh 1vw;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.6vh;
  width: 13vw;
  white-space: nowrap;
  touch-action: none; /* 터치 동작(스크롤/줌) 비활성화 */
  pointer-events: all; /* 이벤트 확실히 받도록 */
  user-select: none; /* 드래그 중 텍스트 선택 방지 */
`;

export const NameText = styled.div`
  color: #000000;
  font-family: var(--player-font-family);
  font-size: var(--player-font-size);
  font-weight: var(--player-font-weight);
`;

// -------- 이닝의 재구성 -------------

export const ReconstructionWrapper = styled.div`
  width: 44vw;
  height: 4.8vh;
  /* border: 1px solid #999; */
  /* font-family: "KBO-Dia-Gothic_medium"; */
  /* font-weight: bold; */
  font-size: 0.813rem;
  background-color: #ffffff;
  color: #ffffff;
  box-shadow: 0px 21px 6px rgba(0, 0, 0, 0),
    //
    0px 14px 5px rgba(0, 0, 0, 0),
    //
    0px 8px 5px rgba(0, 0, 0, 0.02),
    //
    0px 3px 3px rgba(0, 0, 0, 0.03),
    //
    0px 1px 2px rgba(0, 0, 0, 0.03);
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  /* justify-content: center; */
  align-items: center;
`;

export const ReconstructionTitle = styled.div`
  width: 27.5vw;
  height: 4vh;
  /* border: 1px solid #999; */
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 0.813rem;
  color: black;
  /* background-color: red; */
  cursor: pointer;
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const ReconstructionButtonWrapper = styled.div`
  width: 16.5vw;
  height: 4vh;
  /* border: 1px solid #999; */
  /* font-family: "KBO-Dia-Gothic_bold"; */
  font-weight: bold;
  font-size: 0.813rem;
  /* background-color: blue; */
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const ReconstructionSwitch = styled(Switch)`
  /* 1) 트랙 너비 조정 (높이는 이미 custom 됐으니 필요 없다면 생략) */
  && {
    background-color: #e5e5ea !important;
    width: 11vw !important; /* 원하는 가로 길이 */
    min-width: 11vw !important;
    height: 2.8vh !important;
  }
  /* ON 상태의 트랙 색 */
  &.ant-switch-checked {
    background-color: #0f0f70 !important; /* 원하는 ON 트랙 색 */
  }

  /* 2) 내부 여백: 패딩만큼 핸들이 옆으로 빠지지 않도록 margin 설정 */
  .ant-switch-inner {
    margin: 2px; /* trackPadding 만큼 */
  }

  /* 3) 핸들 크기 & 중앙 정렬 & 움직일 때 애니메이션 제거 */
  .ant-switch-handle {
    width: 1rem !important; /* handleSize */
    height: 1rem !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    left: 5px !important;
    /* transition: none !important; */
  }

  /* Checked 상태에서 핸들 위치 재계산 */
  &.ant-switch-checked .ant-switch-handle {
    left: calc(100% - 5px - 18px) !important;
    /* 100% 트랙 너비에서 padding(2px)과 핸들 너비(18px)만큼 뺀 위치 */
  }
`;

export const OutZoneWrapper = styled.div`
  position: absolute;
  /* 부모의 가운데(가로·세로) */
  top: 50%;
  left: 50%;

  width: 70%;
  aspect-ratio: 1 / 1; /* 항상 정사각형 비율 유지 */
  /* 자신의 크기의 절반만큼 당겨서 진짜 중앙에 위치 */
  transform: translate(-50%, -50%);
  opacity: 0.5;
  /* background-color: red; */
  border-radius: 50%; /* 완전한 원 */

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 1;
  pointer-events: none;
`;

export const CustomBoundaryWrapper = styled.div`
  position: absolute;
  /* 부모의 가운데(가로·세로) */
  top: 50%;
  left: 50%;

  width: 101%; // 약간의 점만 넘기면 되니까 1%만 넘겨보기
  height: 100%;
  /* 자신의 크기의 절반만큼 당겨서 진짜 중앙에 위치 */
  transform: translate(-45%, -45%);
  opacity: 0.5;
  background-color: transparent;
  /* background-color: red; */
  border-radius: 12px;

  z-index: 1;
  pointer-events: none;
`;

export const HomePlateOverlay = styled.svg`
  position: absolute;
  left: 50%;
  top: 80%;
  border: none;
  transform: translate(-50%, -50%);
  width: 5%;
  height: auto;
  z-index: 10; /* 맨 위로 */
  pointer-events: none; /* 드래그등 이벤트 투명화 */
`;

// 좌상단 스코어보드
export const LeftSideWrapper = styled.div`
  position: absolute;
  left: 5%;
  top: 5%;
  width: 7.5vh;
  z-index: 100;
  /* height: 5vh; */
  /* background-color: red; */
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const InningBoard = styled.div`
  width: 1.6vh;
  height: 4.5vh;
  display: flex;
  /* gap: 1vw; */
  flex-direction: column;
  align-items: center;
  /* text-align */
  justify-content: space-evenly;
  background: #000;
  border-radius: 10px;
  color: white;

  /* padding: 0.5vh 1vw; */
`;

export const InningNumber = styled.div`
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 0.56rem;
  /* padding: 0.5vh 1vw; */
`;

export const LittleScoreBoardWrapper = styled.div`
  /* margin-top: 1vh; */
  /* position: absolute; */
  width: 5.5vh;
  height: 4.5vh;
  z-index: 80;
  /* font-weight: bold; */

  background-color: black;
  color: #f2f2f7;
  border-radius: 8px;
  /* margin-top: 0.4rem; */
  display: flex;
  flex-direction: column;

  /* 위아래 간격을 0.3rem씩 주기 */
  /* gap: 0.3rem; */
  /* 항목들이 위쪽부터 시작하도록 */
  justify-content: space-evenly;
  /* align-items: center; */

  /* 위아래 여백도 추가하고 싶으면 padding 활용 */
  /* padding: 0.3rem 0; */
`;

export const AwayTeamWrapper = styled.div`
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 0.5rem;
  display: flex;
  flex-direction: row;

  justify-content: center;
  /* align-items: center; */
  /* padding: 0.5vh 1vw; */
`;

export const AwayTeamName = styled.div`
  font-family: "Pretendard";
  /* background-color: red; */
  font-weight: 600;
  font-size: 0.5rem;
  text-align: center;
  /* padding: 0.5vh 1vw; */
  width: 60%;
  /* background-color: red; */
`;

export const AwayTeamScore = styled.div`
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 0.5rem;
  width: 20%;
  text-align: center;
  /* background-color: red; */
  /* padding: 0.5vh 1vw; */
`;

export const HomeTeamWrapper = styled.div`
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 0.5rem;
  display: flex;
  flex-direction: row;

  justify-content: center;
  /* padding: 0.5vh 1vw; */
`;

export const HomeTeamName = styled.div`
  font-family: "Pretendard";
  /* background-color: red; */
  font-weight: 600;
  font-size: 0.5rem;
  text-align: center;
  /* padding: 0.5vh 1vw; */
  width: 60%;
  /* background-color: red; */
`;

export const HomeTeamScore = styled.div`
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 0.5rem;
  width: 20%;
  text-align: center;
  /* background-color: red; */
  /* padding: 0.5vh 1vw; */
`;
