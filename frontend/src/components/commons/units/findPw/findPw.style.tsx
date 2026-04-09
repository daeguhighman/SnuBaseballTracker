import styled from "@emotion/styled";

// 반응형 미디어 쿼리
const small = "@media only screen and (max-width: 480px)";
const medium =
  "@media only screen and (min-width: 481px) and (max-width: 768px)";
const large =
  "@media only screen and (min-width: 769px) and (max-width: 1024px)";
const xlarge = "@media only screen and (min-width: 1025px)";

export const Container = styled.div`
  width: 100vw;
  /* height: 50rem; */
  /* background-color: red; */
  display: flex;
  flex-direction: column;
  margin-top: 15vh;
  align-items: center; /* 수평 중앙 정렬 */
  justify-content: center;
  padding: 20px;
`;

export const Title = styled.h1`
  font-size: 1.5rem; /* 24px → 1.5rem */
  // margin-bottom: 40px;
  text-align: center;
  font-weight: bold;
  font-family: "KBO-Dia-Gothic_bold";
`;

/* 폼 전체를 감싸는 컨테이너 */
export const Form = styled.form`
  /* width: 100%; */
  background-color: red;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 16px; /* 요소 간의 간격 */
`;

/* 라벨 */
export const Label = styled.label`
  font-size: 1rem; /* 14px → 0.875rem */
  margin-bottom: 8px;
  /* background-color: red; */
`;

/* 각 입력 필드를 감싸는 Wrapper */
export const FieldWrapper = styled.div`
  /* width: 100%; */
  /* background-color: red; */
  width: 70vw;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  /* border-bottom: 1px solid #e8e8e8; */
`;

//   color: rgba(0, 0, 0, 0.3);

/* 기본 인풋 스타일 */
export const Input = styled.input`
  width: 100%;
  border: none;
  border-bottom: 1px solid #ccc;

  padding: 8px 0px;
  font-size: 0.875rem; /* 14px → 0.875rem */
  font-family: "KBO-Dia-Gothic_medium";

  &::placeholder {
    color: rgba(0, 0, 0, 0.3);
    font-size: 0.875rem; /* 14px → 0.875rem */
  }

  &:focus {
    outline: none;
    border-bottom: 1px solid #ccc;
  }
`;

/* 비밀번호 영역 (비밀번호 표시/숨기기 버튼 포함) */
export const PasswordWrapper = styled.div`
  display: flex;
  flex-direction: row;
  /* border-bottom: 1px solid #e8e8e8; */
  width: 100%;
`;

/* 비밀번호 표시/숨기기 토글 */
export const PasswordToggle = styled.span`
  cursor: pointer;
  font-size: 0.875rem; /* 14px → 0.875rem */
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  /* background-color: red; */
  width: 1vh;
  color: #666;
  border-bottom: 1px solid #ccc;
`;

export const ToggleImage = styled.img`
  width: 2vh;
  height: 2vh;
  margin-right: 2vh;
`;

/* 로그인 버튼 */
export const LoginButton = styled.button`
  width: 100%;
  margin-top: 30px;
  height: 36px;
  background-color: #0f0f70; /* 포인트 컬러 */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem; /* 16px → 1rem */
  font-family: "KBO-Dia-Gothic_medium";
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;
`;

/* 회원가입, 비밀번호 찾기 링크 그룹 */
export const LinkGroup = styled.div`
  margin-top: 20px;
  width: 70%;
  max-width: 480px;
  display: flex;
  flex-direction: row;
  align-items: center;
  /* justify-content: space-; */

  color: #000000;
  font-family: "KBO-Dia-Gothic_light";
  /* background-color: red; */
`;

export const ErrorMessage = styled.div`
  color: red;
  font-size: 0.75rem; /* 12px → 0.75rem */
  /* width: 12px; */
  width: 90%;
  height: 12px;
`;

export const MoveToSignUp = styled.div`
  /* margin-top: 20px; */
  width: 100%;
  font-size: 0.75rem; /* 12px → 0.75rem */
  margin-right: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: right;

  /* background-color: red; */
`;

export const VerticalSeparator = styled.div`
  width: 1px;
  height: 20px;
  background-color: #ccc; /* 회색 */
  margin: 0 10px;
`;

export const MoveToFindPw = styled.div`
  /* margin-top: 20px; */
  width: 100%;
  font-size: 0.75rem; /* 12px → 0.75rem */
  margin-left: 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: left;
  /* justify-content: ; */
  /* background-color: red; */
`;

export const SubLabel = styled.label`
  font-size: 0.8125rem;
  margin-bottom: 30px;

  font-family: "KBO-Dia-Gothic_light";
  /* background-color: red; */
`;
