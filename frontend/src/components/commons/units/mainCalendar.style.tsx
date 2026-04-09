import styled from "@emotion/styled";
import DatePicker from "react-datepicker";

// ─── 전체 컨테이너 ─────────────────────────────
export const Container = styled.div`
  margin-top: 120px; /* 헤더 높이와 동일 */
  box-sizing: border-box;
  margin-bottom: 80px;
  background: #ffffff;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  /* background-color: red; */
`;

// ─── 헤더 영역 (배경 + 날짜 영역 포함) ─────────────────────────────
export const Background = styled.div`
  background: #5db075;
  width: 100%;
`;

export const PageHeader = styled.div`
  text-align: center;
  /* 기본값 (Large 구간 내에서 사용될 수 있음) */
  padding-top: 50px;

  /* Small */
  @media only screen and (max-width: 480px) {
    padding-top: 30px;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    padding-top: 40px;
  }
  /* Large */
  @media only screen and (min-width: 769px) and (max-width: 1024px) {
    padding-top: 50px;
  }
  /* Extra Large */
  @media only screen and (min-width: 1025px) {
    padding-top: 60px;
  }
`;

export const PageTitle = styled.h1`
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  font-size: 30px; /* 기본값 */

  /* Small */
  @media only screen and (max-width: 480px) {
    font-size: 24px;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    font-size: 28px;
  }
  /* Large */
  @media only screen and (min-width: 769px) and (max-width: 1024px) {
    font-size: 32px;
  }
  /* Extra Large */
  @media only screen and (min-width: 1025px) {
    font-size: 36px;
  }
`;

export const DaysOfWeekContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 16px; /* 기본값 */
  margin-top: 2vh;

  /* Small */
  @media only screen and (max-width: 480px) {
    padding: 10px;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    padding: 12px;
  }
  /* Large */
  @media only screen and (min-width: 769px) and (max-width: 1024px) {
    padding: 14px;
  }
  /* Extra Large */
  @media only screen and (min-width: 1025px) {
    padding: 16px;
  }
`;

export const DaysOfWeekWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 95%; /* 기본값 */
`;

export const DateWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  /* background-color: red; */
`;

export const Arrow = styled.div`
  font-weight: 1000;
  color: #000;
  font-size: 16px; /* 기본값 */
  cursor: pointer;

  /* Small */
  @media only screen and (max-width: 480px) {
    font-size: 14px;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    font-size: 15px;
  }
  /* Large & Extra Large */
  @media only screen and (min-width: 769px) {
    font-size: 16px;
  }
`;

export const DateDisplay = styled.div`
  align-self: center;
  margin-top: 2px;
  font-weight: 1000;
  /* background-color: red; */

  color: #000;
  font-size: 20px; /* 기본값 */
  margin-right: 13px;

  /* Small */
  @media only screen and (max-width: 480px) {
    font-size: 18px;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    font-size: 19px;
  }
  /* Large & Extra Large */
  @media only screen and (min-width: 769px) {
    font-size: 20px;
  }
`;

export const CalendarIcon = styled.img`
  width: 25px; /* 기본값 */
  height: 24px;
  object-fit: cover;
  cursor: pointer;
`;

export const MatchCardsContainer = styled.div`
  display: flex;
  margin-top: 2%;
  flex-direction: column;
  gap: 16px; /* 기본값 */
  padding: 16px; /* 기본값 */

  /* Small */
  @media only screen and (max-width: 480px) {
    gap: 12px;
    padding: 12px;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    gap: 14px;
    padding: 14px;
  }
  /* Large & Extra Large */
  @media only screen and (min-width: 769px) {
    gap: 16px;
    padding: 16px;
  }
`;

export const MatchCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
  padding: 8px 0;
  height: 10vh;
  /* background-color: red; */

  /* Small */
  @media only screen and (max-width: 480px) {
    padding: 6px 0;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    padding: 7px 0;
  }
  /* Large & Extra Large */
  @media only screen and (min-width: 769px) {
    padding: 8px 0;
  }
`;

export const MatchTimeLabel = styled.div`
  font-weight: 500;
  color: #000;
  /* margin-right: 8px; */
  font-size: 16px; /* 기본값 */

  /* Small */
  @media only screen and (max-width: 480px) {
    font-size: 14px;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    font-size: 15px;
  }
  /* Large & Extra Large */
  @media only screen and (min-width: 769px) {
    font-size: 16px;
  }
`;

export const TeamsContainer = styled.div`
  /* background-color: yellow; */
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;

  margin-left: 5px;
  margin-right: 5px;
`;

export const Team = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
  min-height: 45px;
  /* background-color: red; */
  /* margin-right: 5px; */
  /* margin-right: 10px; */
`;

export const TeamName = styled.div`
  font-weight: 500;
  color: #000;
  /* font-size: 16px; 기본값 */
  font-size: 0.875rem;
  margin-bottom: 7px;
  /* white-space: pre; */
  width: 21vw;
  text-align: center;
  /* background-color: red; */
`;

export const TeamScore = styled.div<{
  isWinner?: boolean;
  gameStatus?: string;
  isForfeit?: boolean;
}>`
  font-weight: 600;
  font-size: 12px;
  color: ${({ isForfeit, isWinner, gameStatus }) =>
    isForfeit
      ? "#FF0000"
      : gameStatus === "FINALIZED" && isWinner
      ? "#FF0000"
      : "#000"};
`;

export const StatusBox = styled.div<{ status: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  min-width: 60px;
  height: 22px;
  background-color: ${({ status }) =>
    status === "SCHEDULED"
      ? "#F3A231"
      : status === "FINALIZED" || status === "EDITING"
      ? "#000000"
      : status === "IN_PROGRESS" // 진행중
      ? "#37DC21"
      : "#37DC21"};
  color: #ffffff;
  font-size: 12px;
  font-family: "KBO-Dia-Gothic_medium";

  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  margin-bottom: 4px;
`;

export const TeamsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  /* background-color: red */
`;

export const VsText = styled.div`
  font-weight: 500;
  margin: 0 8px;
  font-size: 16px; /* 기본값 */

  /* Small */
  @media only screen and (max-width: 480px) {
    font-size: 14px;
    margin: 0 6px;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    font-size: 15px;
    margin: 0 7px;
  }
  /* Large & Extra Large */
  @media only screen and (min-width: 769px) {
    font-size: 16px;
    margin: 0 8px;
  }
`;

export const BraketText = styled.div`
  font-weight: 500;
  margin: 0 8px;
  font-size: 16px; /* 기본값 */
  color: #797979;
  /* width: 15vw; */
  text-align: center;
  width: 13vw;

  padding-bottom: 1vh;
  /* background-color: red; */

  /* Small */
  @media only screen and (max-width: 480px) {
    font-size: 14px;
    /* margin: 0 6px; */
    /* margin-top: 7px; */
    padding-top: 8px;
  }
  /* Medium */
  @media only screen and (min-width: 481px) and (max-width: 768px) {
    font-size: 15px;
    /* margin: 0 7px; */
    padding-top: 8px;
  }
  /* Large & Extra Large */
  @media only screen and (min-width: 769px) {
    font-size: 16px;
    /* margin: 0 8px; */
    padding-top: 8px;
  }
`;

export const RecordButton = styled.button`
  font-family: "KBO-Dia-Gothic_light";
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid #e8e8e8;
  color: black;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px; /* 기본값 */
  min-width: 55px;
  min-height: 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const RecordButtonPlaceholder = styled.div`
  min-width: 60px;
  min-height: 30px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid transparent;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const DatePickTotalWrapper = styled.div`
  position: absolute;
  z-index: 999;
  left: 50%;
  transform: translateX(-50%) translateY(60%) scale(0.8);
  transform-origin: top center;
  /* background-color: red; */
`;

export const DatePickWrapper = styled.div`
  width: 100%; /* 부모 요소의 90% 너비로 지정 */

  .react-datepicker {
    width: 100%; /* DatePicker는 DatePickWrapper의 너비에 맞춤 */
    height: auto; /* 콘텐츠에 따라 높이가 자동으로 조정 */
    border: 1px solid black;
    border-radius: 12px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    font-family: "KBO-Dia-Gothic_light";
  }

  /* 헤더 영역 */
  .react-datepicker__header {
    width: 100%;
    background-color: black;
    /* background-color: gray; */
    border: none;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    padding: 16px 0;
    position: relative;
  }

  .react-datepicker__current-month {
    font-size: 20px;
    color: #ffffff;
    font-weight: bold;
  }

  /* 네비게이션 버튼 */
  .react-datepicker__navigation {
    top: 20px;
    border: none;
    cursor: pointer;
  }

  .react-datepicker__navigation--previous {
    left: 16px;
  }

  .react-datepicker__navigation--next {
    right: 16px;
  }

  /* 요일 이름 컨테이너 (중앙 정렬) */
  .react-datepicker__day-names {
    display: flex;
    /* margin-top: 10px; */
    justify-content: center;
  }

  /* 요일 이름 */
  .react-datepicker__day-name {
    width: 2.8rem;
    height: 2rem;
    line-height: 2.8rem;
    font-size: 14px;
    color: white;
    font-weight: 600;
    margin: 0.2rem;
    /* background-color: red; */
    margin-top: 10px;
    text-align: center;
  }

  /* 날짜 셀 스타일 */
  .react-datepicker__day {
    width: 2.8rem;
    height: 2.8rem;
    line-height: 2.8rem;
    /* margin: 0.2rem; */
    font-size: 16px;
    color: #444444;
    transition: background-color 0.3s ease;
    cursor: pointer;
    text-align: center;
  }

  .react-datepicker__day:hover {
    background-color: #f5faff;
    border-radius: 8px;
  }

  /* 선택된 날짜 스타일 */
  .react-datepicker__day--selected,
  .react-datepicker__day--keyboard-selected {
    background-color: #4a90e2;
    color: #ffffff;
    border-radius: 8px;
  }

  /* 오늘 날짜 스타일 */
  .react-datepicker__day--today {
    border: 1px solid #4a90e2;
    border-radius: 8px;
  }

  /* 월 컨테이너 패딩 */
  .react-datepicker__month-container {
    padding: 12px;
  }
`;

export const StyledDatePicker = styled(DatePicker)``;
