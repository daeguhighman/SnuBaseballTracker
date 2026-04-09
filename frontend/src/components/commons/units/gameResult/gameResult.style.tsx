// gameResult.style.tsx
import styled from "@emotion/styled";

// 반응형 미디어 쿼리
const small = "@media only screen and (max-width: 480px)";
const medium =
  "@media only screen and (min-width: 481px) and (max-width: 768px)";
const large =
  "@media only screen and (min-width: 769px) and (max-width: 1024px)";
const xlarge = "@media only screen and (min-width: 1025px)";

// ─── 전체 컨테이너 ─────────────────────────────
export const Container = styled.div`
  width: 100%;
  background-color: #f5f5f5;
  margin: 0 auto;
  /* margin-bottom: 50px; */
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding-bottom: 40px;
`;

// ─── 페이지 타이틀 ─────────────────────────────
export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 200;
  color: #0f0f70;
  margin: 40px 0 20px 0;
  text-align: center;
  font-family: "Futura", "Futura Std", sans-serif;
  letter-spacing: 2px;
`;

// ─── 팀 헤더 타이틀 ─────────────────────────────
export const TeamHeaderTitle = styled.h2`
  font-size: 20px;
  font-weight: 500;
  color: #1a365d;
  margin: 20px 0;
  text-align: center;
  font-family: "KBO-Dia-Gothic_medium";
`;

// ─── 상단 점수판 영역 ─────────────────────────────
export const ScoreBoardWrapper = styled.div`
  width: 90%;
  height: calc((100vh - 120px) * 0.2);
  margin-top: 3vh;
  margin-bottom: 1vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  box-shadow: 0px 21px 6px rgba(0, 0, 0, 0), 0px 14px 5px rgba(0, 0, 0, 0),
    0px 8px 5px rgba(0, 0, 0, 0.02), 0px 3px 3px rgba(0, 0, 0, 0.03),
    0px 1px 2px rgba(0, 0, 0, 0.03);
`;

/** ─────────────────────────────────────────────────────────
 *  1) 상단 이닝 헤더 (총 12열: 이닝(1~9) + R + H)
 * ───────────────────────────────────────────────────────── */
export const InningHeader = styled.div`
  display: grid;
  grid-template-columns: 15vw repeat(9, 1fr);
  width: 100%;
  height: 33%;
  justify-content: center;
  align-items: center;
  margin-top: 1vh;
  > * {
    padding-bottom: 1vh;
    border-bottom: 1px solid #ccc;
  }
  > *:first-of-type {
    border-bottom: none;
  }
  > *:nth-of-type(9),
  > *:nth-of-type(10) {
    color: red;
  }
  padding-right: 1vh;
`;

export const InningCell = styled.div`
  text-align: center;
  font-family: "Pretendard";
  font-weight: 700;
  font-size: 1.125rem;
`;

export const EditableInputScore = styled.input`
  width: 100%;
  border: none;
  text-align: center;
  font-family: "Pretendard";
  background-color: transparent;
  color: #1a365d;
  font-weight: 400;
  &:focus {
    outline: none;
  }
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  -moz-appearance: none;
  appearance: none;
`;

/** ─────────────────────────────────────────────────────────
 *  2) 팀 이름과 점수를 한 행으로 구성 (총 12열)
 *     첫 번째 열: 팀 이름 (별도 스타일)
 *     나머지 11열: 이닝별 점수 (팀 점수 셀)
 * ───────────────────────────────────────────────────────── */
export const TeamRow = styled.div`
  display: grid;
  grid-template-columns: 15vw repeat(9, 1fr);
  width: 100%;
  align-items: center;
  height: 33%;
  > *:nth-of-type(9),
  > *:nth-of-type(10) {
    color: red;
    font-weight: 700;
  }
  padding-right: 1vh;
`;

export const TeamNameCell = styled.div`
  text-align: center;
  font-weight: 500;
  font-family: "Pretendard";
  font-size: 0.8125rem;
  font-weight: 700;
  padding-left: 2.5vw;
  padding-right: 1vw;
`;

export const TeamScoreCell = styled.div`
  text-align: center;
  font-family: "Pretendard";
  font-weight: 400;
`;

// ─── 팀명 헤더 ─────────────────────────────
export const TeamTitle = styled.h2`
  margin: 24px 0 16px 0;
  font-weight: 600;
  text-align: center;
  color: #1a365d;
  ${small} {
    font-size: 18px;
  }
  ${medium} {
    font-size: 20px;
  }
  ${large}, ${xlarge} {
    font-size: 22px;
  }
`;

// ─── 테이블 영역 공통 스타일 ─────────────────────────────
export const TableWrapper = styled.div`
  width: 90%;
  max-width: 800px;
  margin-bottom: 24px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  padding: 20px;
  ${small} {
    padding: 15px;
  }
  ${medium} {
    padding: 18px;
  }
  ${large}, ${xlarge} {
    padding: 20px;
  }
`;

export const TableTitle = styled.div`
  font-weight: 600;
  margin-bottom: 16px;
  color: #1a365d;
  font-size: 18px;
  ${small} {
    font-size: 14px;
  }
  ${medium} {
    font-size: 15px;
  }
  ${large}, ${xlarge} {
    font-size: 16px;
  }
`;

// 타자 기록 테이블
export const RecordTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  text-align: center;
  background-color: #ffffff;
  th,
  td {
    padding: 12px 8px;
    border-bottom: 1px solid #f0f0f0;
  }
  th {
    font-weight: 600;
    color: #1a365d;
    border-bottom: 2px solid #e0e0e0;
  }
  tr:hover {
    background-color: #f8f9fa;
  }
  ${small} {
    font-size: 12px;
  }
  ${medium} {
    font-size: 14px;
  }
  ${large}, ${xlarge} {
    font-size: 15px;
  }

  /* �� 수정된 순서에 맞게 각 컬럼 너비 조정 */
  /* 순번 */
  th:nth-of-type(1),
  td:nth-of-type(1) {
    width: 5vh;
  }

  /* 이름 */
  th:nth-of-type(2),
  td:nth-of-type(2) {
    width: 8vh;
  }
  /* 타석 */
  th:nth-of-type(3),
  td:nth-of-type(3) {
    width: 5vh;
  }
  /* 타수 */
  th:nth-of-type(4),
  td:nth-of-type(4) {
    width: 5vh;
  }
  /* 안타 */
  th:nth-of-type(5),
  td:nth-of-type(5) {
    width: 5vh;
  }
  /* 2루타 */
  th:nth-of-type(6),
  td:nth-of-type(6) {
    width: 6vh;
  }
  /* 3루타 */
  th:nth-of-type(7),
  td:nth-of-type(7) {
    width: 6vh;
  }
  /* 홈런 */
  th:nth-of-type(8),
  td:nth-of-type(8) {
    width: 6vh;
  }
  /* 득점 */
  th:nth-of-type(9),
  td:nth-of-type(9) {
    width: 5vh;
  }
  /* 볼넷 */
  th:nth-of-type(10),
  td:nth-of-type(10) {
    width: 5vh;
  }
  /* 삼진 */
  th:nth-of-type(11),
  td:nth-of-type(11) {
    width: 5vh;
  }
  /* 희플 */
  th:nth-of-type(12),
  td:nth-of-type(12) {
    width: 5vh;
  }
  /* 희번 */
  th:nth-of-type(13),
  td:nth-of-type(13) {
    width: 5vh;
  }
`;

// 투수 기록 테이블
export const RecordTableP = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  background-color: #ffffff;
  th,
  td {
    padding: 12px 8px;
    border-bottom: 1px solid #f0f0f0;
  }
  th {
    font-weight: 600;
    color: #1a365d;
    border-bottom: 2px solid #e0e0e0;
  }
  tr:hover {
    background-color: #f8f9fa;
  }
  th:nth-of-type(1),
  td:nth-of-type(1) {
    width: 5vh;
  }

  th:nth-of-type(2),
  td:nth-of-type(2) {
    width: 8vh;
  }

  th:nth-of-type(3),
  td:nth-of-type(3) {
    width: 9vh;
  }
  ${small} {
    font-size: 12px;
  }
  ${medium} {
    font-size: 14px;
  }
  ${large}, ${xlarge} {
    font-size: 15px;
  }
`;

// 버튼 영역
export const ButtonContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  justify-content: space-between;
  width: 90%;
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

export const HomeButton = styled.button`
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

// ─── 수정 가능한 input 컴포넌트 ─────────────────────────────
export const EditableInput = styled.input`
  width: 100%;
  border: none;
  font-family: "KBO-Dia-Gothic_medium";
  text-align: center;
  background-color: transparent;
  color: #1a365d;

  &:focus {
    outline: none;
  }
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  -moz-appearance: none;
  appearance: none;
`;
