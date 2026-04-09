import styled from "@emotion/styled";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 120px; /* 헤더 높이 만큼 띄워줌 */
  left: 0;
  right: 0;
  bottom: 0;
  background-color: hsla(0, 0%, 0%, 0.5);
  display: flex;
  align-items: flex-start; /* 모달 컨텐츠가 헤더 밑에 표시되도록 */
  justify-content: center;
`;

export const ModalContainer = styled.div`
  background-color: #fff;
  width: 100vw; /* 테이블을 위해 살짝 넓힘 */
  height: 100vh; /* 모달의 높이를 고정 */
  max-height: calc(100vh - 120px); /* 헤더를 제외한 최대 높이 */
  margin-bottom: 200px;
  padding: 20px;
  text-align: center;
  overflow-y: auto; /* 콘텐츠가 높이를 넘으면 스크롤되도록 */
`;

export const ModalTitle = styled.h2`
  margin-bottom: 35px;
  margin-top: 35px;
  font-size: 18px;
  font-family: "KBO-Dia-Gothic_bold";
`;

export const ModalSmallTitle = styled.h2`
  margin-bottom: 35px;
  margin-top: 20px;
  font-size: 15px;
  font-family: "KBO-Dia-Gothic_bold";
`;

export const PlayerTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th,
  td {
    padding: 10px;
    font-size: 14px;
    text-align: center;
  }

  th {
    background-color: white;
    border-bottom: 1px solid black;
    border-top: 1px solid black;
  }

  tr:last-of-type td {
    border-bottom: none;
  }

  tbody tr:hover {
    background-color: #f2f2f2;
    cursor: pointer;
  }
`;

export const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px;
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
