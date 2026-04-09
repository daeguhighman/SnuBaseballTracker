import styled from "@emotion/styled";

// 공통 미디어 쿼리 (원하는 대로 수정 가능)
const small = "@media only screen and (max-width: 480px)";
const medium =
  "@media only screen and (min-width: 481px) and (max-width: 768px)";
const large =
  "@media only screen and (min-width: 769px) and (max-width: 1024px)";
const xlarge = "@media only screen and (min-width: 1025px)";

export const RankingContainer = styled.div`
  margin-top: 150px;
  margin-bottom: 150px;
`;

// ▼ 기호의 크기를 조절하기 위한 컴포넌트
export const ArrowIcon = styled.span`
  font-size: 0.75em; /* 원래 글자보다 75% 크기로 줄임 */
  margin-left: 2px;
`;

export const ArrowIconNone = styled.span`
  font-size: 0.75em; /* 원래 글자보다 75% 크기로 줄임 */
  margin-left: 2px;
  color: transparent; /* 텍스트를 투명하게 */
`;
export const TableTitle = styled.div`
  font-size: 12px;
  font-family: "KBO-Dia-Gothic_bold";
  margin-bottom: 10px;

  /* padding: 0 20px; */
`;

// 테이블을 감싸는 래퍼
export const TableWrapper = styled.div`
  width: 95%;
  margin: 20px auto 30px;
  padding: 0 20px;
  /* 열이 많을 경우 가로 스크롤을 보여주기 위해 추가 */
  overflow-x: auto;

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

export const RankingTable = styled.table`
  /* 기존 width: 100% 대신, 내용이 많아질 때 확장되도록 max-content 적용 */
  width: max-content;
  border-collapse: collapse;

  thead {
    tr {
      th {
        font-family: "KBO-Dia-Gothic_medium";
        /* font-weight: 600; */
        color: #000000;
        padding: 12px;
        text-align: center;
        border-bottom: 1px solid #000000;
        border-top: 1px solid #000000;

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
      /* background-color: red; */
      border-bottom: 1px solid #e8e8e8;

      &:last-of-type {
        border-bottom: none; /* 마지막 행에는 경계선 제거 */
      }

      td {
        /* background-color: red; */
        font-family: "KBO-Dia-Gothic_medium";
        /* font-weight: 400; */
        color: #000;
        text-align: left;
        padding: 12px;
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
`;

// 테이블 스타일
export const RankingTableP = styled.table`
  width: 100%;
  border-collapse: collapse;

  thead {
    tr {
      th {
        font-family: "KBO-Dia-Gothic_medium";
        /* font-weight: 600; */
        color: #000000;
        padding: 12px;
        text-align: center;
        border-bottom: 1px solid #000000;
        border-top: 1px solid #000000;

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
        border-bottom: none; /* 마지막 행에는 경계선 제거 */
      }

      td {
        font-family: "KBO-Dia-Gothic_medium";
        /* font-weight: 400; */
        color: #000;
        text-align: center;
        /* background-color: red; */
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

  /* 첫 번째 열의 너비 지정 */
  th:nth-of-type(1),
  td:nth-of-type(1) {
    width: 5vh; /* 원하는 값으로 조정 */
  }

  /* 두 번째 열의 너비 지정 */
  th:nth-of-type(2),
  td:nth-of-type(2) {
    width: 15vh; /* 원하는 값으로 조정 */
  }

  th:nth-of-type(3),
  td:nth-of-type(3) {
    width: 12vh; /* 원하는 값으로 조정 */
    /* background-color: red; */
    /* display: flex;
    flex-direction: column; */
    /* justify-content: center; */
    /* align-items: center; */
  }
`;

// "더보기" 버튼 예시 스타일 (선택 사항)
export const MoreButton = styled.button`
  background-color: rgba(0, 0, 0, 0.75);
  color: white;
  width: 90%;
  height: 2.5vh;
  border-radius: 25px;
  /* padding: 8px 16px; */
  cursor: pointer;
  font-family: "KBO-Dia-Gothic_bold";
  font-size: 12px;
  border: none;
`;
