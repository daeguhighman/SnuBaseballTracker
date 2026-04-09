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

  /* height: 100vh; */
  /* background-color: red; */
  display: flex;
  flex-direction: column;
  margin-top: 3vh;
  align-items: center; /* 수평 중앙 정렬 */
  justify-content: center;
  padding: 20px;
`;

export const TitleWrapper = styled.div`
  width: 80%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  // background-color: red;
`;

export const TitleInsideWrapper = styled.div`
  width: 100%;
  height: 10vh;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  // background-color: red;
`;

export const Title = styled.h1`
  font-size: 1.5rem; /* 24px → 1.5rem */
  // margin-bottom: 40px;

  text-align: center;
  font-weight: bold;
  font-family: "KBO-Dia-Gothic_bold";
`;

export const BackButton = styled.button`
  width: 1.5rem;
  height: 1.5rem;
  background-image: url("/images/backKey.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  cursor: pointer;
  border: none;
  background-color: transparent;
  padding: 0;
`;

export const BackButtonNone = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  background-color: transparent;
  padding: 0;
`;

/* 폼 전체를 감싸는 컨테이너 */
export const Form = styled.form`
  /* width: 100%; */
  /* background-color: red; */
  max-width: 480px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

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
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  /* border-bottom: 1px solid #e8e8e8; */
`;

//   color: rgba(0, 0, 0, 0.3);

/* 기본 인풋 스타일 */
export const Input = styled.input<{ $completed?: boolean }>`
  width: 100%;
  /* margin-top: 5px;
  margin-bottom: 5px; */
  border: none;
  border-bottom: 1px solid #ccc;
  /* padding: 8px 4px; */
  padding-top: 4px;
  padding-bottom: 4px;
  /* padding-left: 4px; */
  font-size: 14px;
  font-family: "KBO-Dia-Gothic_medium";

  &[id="verificationCode"] {
    border: none;
    border-bottom: none;
  }
  &::placeholder {
    color: rgba(0, 0, 0, 0.3);
    font-size: 0.7rem; /* 14px → 0.875rem */
  }

  &[id="verificationCode"]:disabled {
    /* background-color: rgba(0, 0, 0, 0.1); */
    color: black; /* 입력된 텍스트를 보이지 않게 */
    caret-color: transparent; /* 커서 색도 숨기기 */
  }

  &:focus {
    outline: none;
    /* border-bottom: 1px solid #ccc; */
  }
  /* 비활성화 상태 스타일 */
  &:disabled {
    /* verificationToken 이전에는 gray, 이후($completed)에는 투명 */
    background-color: ${({ $completed }) =>
      $completed ? "transparent" : "#e8e8e8"};
    cursor: not-allowed;
  }
`;

export const EmailInput = styled.input<{ $noBottom?: boolean }>`
  width: 100%;
  /* margin-top: 5px;
  margin-bottom: 5px; */
  border: none;
  border-bottom: 1px solid #ccc;
  /* padding: 8px 4px; */
  padding-top: 4px;
  padding-bottom: 4px;
  /* padding-left: 4px; */
  font-size: 14px;
  font-family: "KBO-Dia-Gothic_medium";
  border-bottom: ${({ $noBottom }) => ($noBottom ? "none" : "1px solid #ccc")};

  &:disabled {
    /* background-color: rgba(0, 0, 0, 0.1); */
    cursor: not-allowed;
  }
  &::placeholder {
    color: rgba(0, 0, 0, 0.3);
    font-size: 14px;
  }

  &:focus {
    outline: none;
    border-bottom: 1px solid #ccc;
    border-bottom: ${({ $noBottom }) =>
      $noBottom ? "none" : "1px solid #ccc"};
  }
`;

export const EmailButton = styled.button<{ $completed?: boolean }>`
  /* background-color: red; */
  background-color: transparent;
  font-family: "KBO-Dia-Gothic_bold";
  font-size: 9px;
  width: 25vw;
  color: ${({ $completed }) => ($completed ? "#0f0f70" : "black")};

  border: 1px solid #bdbdbd;
  /* border-radius: 4px; */
  /* max-height: 25px; */
  margin-top: 3px;
  margin-bottom: 3px;
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
export const SignUpButton = styled.button`
  width: 100%;
  margin-top: 30px;
  margin-bottom: 10vh;
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
  font-size: 0.6rem; /* 12px → 0.75rem */
  /* width: 12px; */
  margin-top: 3px;
  width: 100%;
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
export const WrapperForEmail = styled.div<{ $disabled?: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid #ccc;

  /* verificationToken이 있을 때 배경색 적용 */
  background-color: transparent;
`;

export const SuggestionMessage = styled.div`
  color: #f90; /* 눈에 띄는 주황색 */
  font-size: 0.875rem; /* 에러 메시지보단 살짝 작게 */
  margin-top: 0.25rem;
`;
