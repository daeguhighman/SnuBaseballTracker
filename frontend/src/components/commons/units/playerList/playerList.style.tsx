import styled from "@emotion/styled";

// 미디어 쿼리 예시
const small = "@media only screen and (max-width: 480px)";
const medium =
  "@media only screen and (min-width: 481px) and (max-width: 768px)";
const large =
  "@media only screen and (min-width: 769px) and (max-width: 1024px)";
const xlarge = "@media only screen and (min-width: 1025px)";

// 메인 컨테이너
export const TeamListContainer = styled.div`
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  margin-top: 140px; /* 요구사항: 140px */
  font-family: "Inter-Regular", sans-serif;

  display: flex;
  flex-direction: column;
  align-items: center;
`;

// 타이틀
export const Title = styled.h1`
  text-align: center;
  font-size: 20px;
  margin-bottom: 30px;

  ${small} {
    font-size: 18px;
  }
  ${medium} {
    font-size: 19px;
  }
  ${large}, ${xlarge} {
    font-size: 20px;
  }
`;

// 테이블 래퍼 (가로 스크롤 대비)
export const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-bottom: 20px;
`;

// 실제 테이블
export const TeamListTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 480px; /* 컬럼이 많을 경우 최소 너비 확보 */

  thead {
    background-color: #f9f9f9;

    th {
      font-family: "Inter-SemiBold", sans-serif;
      font-weight: 600;
      text-align: center;
      padding: 12px;
      border-bottom: 1px solid #ccc;

      ${small} {
        font-size: 14px;
      }
      ${medium} {
        font-size: 15px;
      }
      ${large}, ${xlarge} {
        font-size: 16px;
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #eee;

      &:last-of-type {
        border-bottom: none; /* 마지막 행 경계선 제거 */
      }

      td {
        text-align: center;
        padding: 12px;

        ${small} {
          font-size: 14px;
        }
        ${medium} {
          font-size: 15px;
        }
        ${large}, ${xlarge} {
          font-size: 16px;
        }
      }
    }
  }
`;

// 하단 뒤로가기 버튼
export const BackButton = styled.button`
  margin-top: 20px;
  align-self: flex-end; /* 오른쪽 정렬 예시 */
  font-family: "Inter-Regular", sans-serif;
  font-size: 16px;
  padding: 10px 20px;
  cursor: pointer;
  border: 1px solid #ccc;
  background-color: #fff;
  border-radius: 4px;

  &:hover {
    background-color: #f7f7f7;
  }

  ${small} {
    font-size: 14px;
    padding: 8px 16px;
  }
  ${medium} {
    font-size: 15px;
  }
  ${large}, ${xlarge} {
    font-size: 16px;
  }
`;
