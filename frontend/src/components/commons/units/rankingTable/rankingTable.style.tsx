import styled from "@emotion/styled";

// 공통 미디어 쿼리 구간 (원하는 대로 수정 가능)
const small = "@media only screen and (max-width: 480px)"; // Small
const medium =
  "@media only screen and (min-width: 481px) and (max-width: 768px)"; // Medium
const large =
  "@media only screen and (min-width: 769px) and (max-width: 1024px)"; // Large
const xlarge = "@media only screen and (min-width: 1025px)"; // Extra Large

export const RankingContainer = styled.div`
  margin-top: 140px;
`;

// 그룹 선택 영역 (예: "A조 ▼")
export const GroupSelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  /* margin-top: 50px; */
  /* background-color: red; */
`;

export const GroupSelector = styled.div`
  width: 100%;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.75);
  font-family: "KBO-Dia-Gothic_bold";
  color: white;
  border-radius: 25px;
  font-size: 12px;
  padding: 2px;
  height: 5%;
`;

// 표를 감싸는 래퍼 (가로 스크롤용 오버플로우 설정)
export const TableWrapper = styled.div`
  width: 95%;
  margin-top: 20px;
  margin-bottom: 50px;
  padding: 0 20px;
  /* margin-right: 5vh; */

  ${small} {
    padding: 0 10px;
  }
  ${medium} {
    padding: 0 15px;
  }
  ${large}, ${xlarge} {
    padding: 0 20px;
  }
`;

// 실제 테이블 스타일
export const RankingTable = styled.table`
  width: 100%;

  /* background-color: red; */
  thead {
    /* background-color: #f9f9f9; */
    tr {
      th {
        font-family: "KBO-Dia-Gothic_light";
        font-weight: 600;
        color: rgba(0, 0, 0, 0.5);
        padding: 12px;
        /* border-bottom: 1px solid #ddd; */
        text-align: center;

        ${small} {
          font-size: 12px;
          padding: 8px;
        }
        ${medium} {
          font-size: 14px;
        }
        ${large}, ${xlarge} {
          font-size: 16px;
        }
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #e8e8e8;

      &:last-of-type {
        border-bottom: none; // 마지막 행에는 경계선 제거
      }

      td {
        font-family: "KBO-Dia-Gothic_medium";
        font-weight: 400;
        color: #000;
        text-align: center;
        padding: 12px;

        ${small} {
          font-size: 12px;
          padding: 8px;
        }
        ${medium} {
          font-size: 14px;
        }
        ${large}, ${xlarge} {
          font-size: 16px;
        }
      }
    }
  }
`;
