// mypage.style.ts
import styled from "@emotion/styled";

export const Title = styled.h1`
  font-size: 1.5rem; /* 24px → 1.5rem */
  margin-top: 15vh;
  text-align: center;
  font-weight: bold;
  font-family: "KBO-Dia-Gothic_bold";
`;

// 메인 페이지 감싸는 Wrapper
export const PageWrapper = styled.div`
  width: 95%;
  margin-top: 30vh;
  margin-bottom: 15vh;
  max-width: 480px;
  /* margin: 0 auto; */
  padding: 16px;
  color: black;
  /* background-color: red; */
  display: flex;
  flex-direction: column;
  justify-self: center;
`;

// 정보 Row (닉네임, 이메일 등)
export const InfoRowWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 0.3px solid #b8b8b8;
`;

// 액션 Row (버튼 형태의 항목들)
export const ActionWrapper = styled.div`
  cursor: pointer;
  padding: 14px 0;
  /* border-bottom: 1px solid #e0e0e0; */
`;

// 레이블 텍스트
export const LabelWrapper = styled.div`
  font-size: 16px;
  font-weight: 500;
`;

// 일반 값 텍스트
export const ValueWrapper = styled.div`
  font-size: 16px;
  color: #333;
`;

// 이메일 전용 텍스트 (필요시 추가 스타일)
export const EmailWrapper = styled(ValueWrapper)`
  /* font-style: italic; */
  color: #333;
`;

// 새로운 버튼 스타일 추가
export const LogoutButton = styled.button`
  width: 80%;
  height: 6vh;
  background-color: transparent;
  border-radius: 20px;
  align-self: center;
  border: none;
  cursor: pointer;
  // font-family: "KBO-Dia-Gothic_medium";
  font-size: 16px;
  color: #000;
  margin: 20px auto;
  display: block;

  border: 1px solid #b8b8b8;
`;
