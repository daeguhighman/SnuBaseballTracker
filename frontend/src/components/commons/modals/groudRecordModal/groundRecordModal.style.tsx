import styled from "@emotion/styled";
import { Switch } from "antd";
const small = "@media only screen and (max-width: 480px)";
const medium =
  "@media only screen and (min-width: 481px) and (max-width: 768px)";
const large =
  "@media only screen and (min-width: 769px) and (max-width: 1024px)";
const xlarge = "@media only screen and (min-width: 1025px)";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* 어두운 반투명 배경 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
`;

// 메인 컨테이너
export const GameRecordContainer = styled.div`
  width: 100%;
  max-width: 100vw;
  /* margin-top: 3vh; */
  background-color: rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  &.reconstruct-mode {
    background-color: #b8b8b8;
  }
`;

export const ScoreBoardWrapper = styled.div`
  width: 90%;
  /* margin-top: 2vh; */

  height: calc((100vh - 120px) * 0.2);
  margin-top: 3vh;
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
  width: 26vw;
  height: 5vh;
  border: 1px solid #999;
  font-family: "KBO-Dia-Gothic_bold";
  font-weight: bold;
  font-size: 0.813rem;
  color: #ffffff;
  cursor: pointer;
  border-radius: 20px;
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
  width: 90%;
  height: 12vh;
  border-bottom: 1px solid #ccc;
  background-color: #ffffff;
  border-radius: 2vh;
  margin-top: 3.5vh;
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
  /* background-color: red; */
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
  height: 10vh;
  grid-template-columns: repeat(4, 1fr);
  margin-top: auto;
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

/** ─────────────────────────────────────────────────────────
 *  v2경기기록 관련
 * ───────────────────────────────────────────────────────── */

// interface ModalContainerProps {
//   reconstructMode?: boolean;
// }

export const ModalContainer = styled.div`
  position: relative;
  /* margin-top: 20px; */
  width: 90%;
  height: 60vh;
  /* padding: 20px; */
  padding-left: 1vw;
  padding-right: 1vw;
  border-radius: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;

  z-index: 101;
  background-color: #f2f2f7;
  &.reconstruct-mode {
    background-color: #b8b8b8;
    will-change: background-color;
  }
`;

export const GraphicWrapper = styled.div<{ outside?: boolean }>`
  position: relative;
  overflow: visible;
  width: 90%;
  height: 35vh;
  background-color: green;
  /* background-image: url("/images/ground-without-home.png");/ */
  /* background-size: cover; 
  background-position: center; 
  background-repeat: no-repeat; */
  /* background: ${(p) => (p.outside ? "red" : "#2c660d")}; */
  border-radius: 2vh;
  z-index: 30;
  border: 1px solid black;
  /* margin: 3vh 0; */
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
  position: absolute;
  left: 4vw;
  bottom: 2vh;
  display: flex;
  gap: 1vw;
  align-items: center;
  justify-content: center;
  background: #000;
  border-radius: 5vh;
  padding: 0.5vh 1vw;
  height: 2.5vh;
`;

export const Ellipse = styled.div<{ active?: boolean }>`
  width: 1.5vh;
  height: 1.5vh;
  border-radius: 50%;
  background: ${(p) => (p.active ? "#fb0000" : "#707070")};
`;

export const OverlaySvg = styled.svg`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: auto;
  overflow: visible;
  background-color: blue;
`;

export const DiamondSvg = styled.svg`
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 53%;
  transform: translate(-50%, -50%);
  width: 53%;
  height: auto;
  overflow: visible;
  fill: transparent;

  /* border: 1px solid black; */
  /* background-image: url("/images/diamond.png"); */

  /* border: 1px solid black; */
  /* background-color: red; */

  /* 기존 inner 기본 스타일 */
  & .inner {
    fill: #ffffff;
    stroke: none;
  }
  /* id가 Home인 polygon만 빨간색으로 덮어쓰기 */

  & polygon#ground {
    fill: #a9a084;
    stroke: white;
    stroke-width: 0.5px;
    stroke-linejoin: miter;
    stroke-miterlimit: 10;
    /* vector-effect: non-scaling-stroke; */
  }
  & polygon#Home {
    fill: transparent;
  }

  /* 여기에 highlight 스타일 추가 */
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
  z-index: 9999;
`;
export const NameBadge = styled.div`
  position: absolute;
  contain: paint;
  font-family: "Pretendard";
  will-change: transform;
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
  height: 3vh;
  width: 13vw;
  white-space: nowrap;
  touch-action: none; /* 터치 동작(스크롤/줌) 비활성화 */
  pointer-events: all; /* 이벤트 확실히 받도록 */
  user-select: none; /* 드래그 중 텍스트 선택 방지 */
  .name-badge {
    will-change: transform;
    backface-visibility: hidden;
  }
`;

export const NameText = styled.div`
  color: #000000;
  font-family: var(--player-font-family);
  font-size: var(--player-font-size);
  font-weight: var(--player-font-weight);
`;

// -------- 이닝의 재구성 -------------

export const ReconstructionWrapper = styled.div`
  width: 36vw;
  height: 4.5vh;
  /* margin-top: 1vh; */
  /* margin-left: 1vh;  */
  // 단위 통일을 위해 꼭 vh로 할것

  /* font-weight: bold; */
  font-size: 0.813rem;
  background-color: #ffffff;
  box-shadow: 0px 76px 21px rgba(0, 0, 0, 0),
    //
    0px 49px 20px rgba(0, 0, 0, 0.01),
    //
    0px 27px 16px rgba(0, 0, 0, 0.03),
    //
    0px 12px 12px rgba(0, 0, 0, 0.04),
    //
    0px 3px 7px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  /* justify-content: center; */
  align-items: center;
`;

export const ReconstructionTitle = styled.div`
  width: 27.5vw;
  height: 4vh;
  /* border: 1px solid #999; */

  font-size: 0.813rem;
  color: black;
  /* background-color: red; */
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const ReconstructionButtonWrapper = styled.div`
  width: 16.5vw;
  height: 4vh;
  /* border: 1px solid #999; */

  font-size: 0.813rem;
  /* background-color: blue; */
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;
// export const ReconstructionSwitch = styled(Switch)`
//   /* 1) 트랙 전체에 빠른 전환 적용 */
//   && {
//     background-color: #e5e5ea !important;
//     width: 11vw !important;
//     min-width: 11vw !important;
//     height: 3vh !important;

//     /* 배경색 전환 속도 */
//     transition: background-color 100ms ease-in-out !important;
//   }

//   /* ON 상태 트랙 색 */
//   &.ant-switch-checked {
//     background-color: #0f0f70 !important;
//   }

//   /* 2) 내부 여백: 패딩만큼 핸들이 옆으로 빠지지 않도록 margin 설정 */
//   .ant-switch-inner {
//     margin: 2px;
//   }

//   /* 3) 핸들 크기 & 중앙 정렬 & 빠른 이동 애니메이션 */
//   .ant-switch-handle {
//     width: 4vw !important;
//     height: 4vw !important;
//     top: 50% !important;
//     transform: translateY(-50%) !important;
//     left: 5px !important;

//     /* 핸들 이동 속도 */
//     transition: left 200ms ease-in-out !important;
//   }

//   /* Checked 상태 핸들 위치 & 속도 재정의 */
//   &.ant-switch-checked .ant-switch-handle {
//     left: calc(100% - 5px - 4vw) !important;
//     transition: left 100ms ease-in-out !important;
//   }
// `;

export const ReconstructionSwitch = styled(Switch)`
  && {
    background-color: #e5e5ea !important;
    width: 11vw !important;
    min-width: 11vw !important;
    height: 3vh !important;

    /* 즉시 반영: 트랜지션 제거 */
    transition: none !important;
    will-change: background-color;
  }

  &.ant-switch-checked {
    background-color: #0f0f70 !important;
  }

  .ant-switch-inner {
    margin: 2px;
  }

  .ant-switch-handle {
    width: 4vw !important;
    height: 4vw !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    left: 5px !important;

    transition: none !important;
    will-change: left;
  }

  &.ant-switch-checked .ant-switch-handle {
    left: calc(100% - 5px - 4vw) !important;
  }
`;

export const ModalBottomWrapper = styled.div`
  width: 90%;
  height: 5vh;
  /* margin-top: 2vh; */
  /* border: 1px solid #999; */
  /* background-color: red; */

  /* font-weight: bold; */
  font-size: 0.813rem;
  color: #ffffff;
  font-family: "Pretendard";
  font-weight: 500;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
`;

export const ModalBottomRunnerWrapper = styled.div`
  width: 36vw;
  height: 4.5vh;

  /* font-weight: bold; */
  font-size: 0.813rem;
  background-color: #ffffff;
  box-shadow: 0px 76px 21px rgba(0, 0, 0, 0),
    //
    0px 49px 20px rgba(0, 0, 0, 0.01),
    //
    0px 27px 16px rgba(0, 0, 0, 0.03),
    //
    0px 12px 12px rgba(0, 0, 0, 0.04),
    //
    0px 3px 7px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
`;

export const ModalBottomRedoUndoWrapper = styled.div`
  width: 30vw;
  /* background-color: red; */
  margin-left: auto;
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  align-items: center;
`;

// Redo 아이콘용

export const ModalBottomRunnerTitle = styled.div`
  /* width: 27.5vw; */
  height: 4vh;
  /* border: 1px solid #999; */

  font-size: 0.813rem;
  color: black;
  /* background-color: red; */
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const OutZoneWrapper = styled.div`
  position: absolute;
  /* 부모의 가운데(가로·세로) */
  top: 50%;
  left: 50%;

  width: 70%;
  /* aspect-ratio: 1 / 1; */
  height: 85%;
  /* 자신의 크기의 절반만큼 당겨서 진짜 중앙에 위치 */
  transform: translate(-50%, -50%);
  opacity: 0.5;
  // background-color: BLUE;
  border-radius: 50%; /* 완전한 원 */

  display: flex;
  justify-content: center;
  align-items: center;

  z-index: 1;
  pointer-events: none;
`;

export const CustomBoundaryWrapper = styled.div`
  position: fixed;
  /* 부모의 가운데(가로·세로) */
  top: 51%;
  left: 50%;

  width: 85%; // 약간의 점만 넘기면 되니까 1%만 넘겨보기
  height: 35%;
  /* 자신의 크기의 절반만큼 당겨서 진짜 중앙에 위치 */
  transform: translate(-45%, -45%);
  opacity: 0.5;
  background-color: transparent;
  /* background-color: red; */
  border-radius: 12px;

  z-index: 104;
  pointer-events: none;
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
  /* background-image: url("/images/home.png"); */

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
  /* background-image: url("/images/line.png"); */

  border-radius: 2vh;
  /* margin: 3vh 0; */
`;

export const HomeBaseWrapper = styled.div<{ active: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 990;

  /* 배경색을 흰/파랑으로 토글 */
  /* background-color: ${({ active }) => (active ? "blue" : "white")}; */

  /* background-color: transparent; */
  background-color: white;
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
  /* background: ${(p) => (p.outside ? "red" : "transparent")}; */
  background-color: #081c0c;

  /* &.out-zone-active {
    background-color: red; 
  } */
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

export const CancelButton = styled.button`
  width: 3vh;
  height: 3vh;
  border: none;
  background-color: red;
`;

export const CancelButtonWrapper = styled.div`
  width: 90%;
  margin-top: 1vh;
  /* height: 3vh; */
  border: none;
  /* background-color: red; */
  display: flex;
  flex-direction: row;
  align-items: center;
`;
