import styled from "@emotion/styled";

// 반응형 미디어 쿼리
const small = "@media only screen and (max-width: 480px)";
const medium =
  "@media only screen and (min-width: 481px) and (max-width: 768px)";
const large =
  "@media only screen and (min-width: 769px) and (max-width: 1024px)";
const xlarge = "@media only screen and (min-width: 1025px)";

/** 페이지 전체를 감싸는 컨테이너 */
export const Container = styled.div`
  width: 100%;
  height: 100%;
  /* background-color: red; */
  display: flex;
  flex-direction: column;

  margin-top: 25vh;
  /* justify-content: center; 수직 중앙 정렬 */
  align-items: center; /* 수평 중앙 정렬 */
  /* padding: 20px; */
`;

/** 페이지 제목 */
export const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 40px;
  text-align: center;
  font-weight: bold;
  font-family: "KBO-Dia-Gothic_bold";

  ${small} {
    font-size: 20px;
  }
  ${medium} {
    font-size: 22px;
  }
  ${large}, ${xlarge} {
    font-size: 24px;
  }
`;

/** 폼 전체를 감싸는 컨테이너 */
export const Form = styled.form`
  /* background-color: aqua; */
  width: 65%; /* 추가 */
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 16px; /* 요소 간의 간격 */
`;

/** 각 입력 필드를 감싸는 Wrapper */
export const WrapperForEmail = styled.div`
  width: 100%;

  /* background-color: red; */
  border-bottom: 1px solid #ccc;
  display: flex;
  flex-direction: row;
`;

export const EmailButton = styled.button`
  /* background-color: red; */
  background-color: transparent;
  font-family: "KBO-Dia-Gothic_bold";
  font-size: 9px;
  width: 25vw;
  color: black;
  border: 1px solid #bdbdbd;
  /* border-radius: 4px; */
  max-height: 25px;
  margin-top: 5px;
  margin-bottom: 5px;
`;

/** 라벨 */
export const Label = styled.label`
  font-size: 14px;
  margin-bottom: 8px;
  font-family: "KBO-Dia-Gothic_medium";

  ${small} {
    font-size: 13px;
  }
  ${medium} {
    font-size: 14px;
  }
  ${large}, ${xlarge} {
    font-size: 15px;
  }
`;

/** 각 입력 필드를 감싸는 Wrapper */
export const FieldWrapper = styled.div`
  width: 100%;
  /* background-color: red; */
  margin-top: 20px;
  display: flex;
  flex-direction: column;
`;

/** 기본 인풋 스타일 */
export const Input = styled.input<{ $noBottom?: boolean }>`
  width: 100%;
  margin-top: 5px;
  margin-bottom: 5px;
  border: none;
  /* border-bottom: 1px solid #ccc; */
  /* padding: 8px 4px; */
  padding-bottom: 4px;
  font-size: 14px;
  font-family: "KBO-Dia-Gothic_medium";
  border-bottom: ${({ $noBottom }) => ($noBottom ? "none" : "1px solid #ccc")};
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

  ${small} {
    font-size: 13px;
  }
  ${medium} {
    font-size: 14px;
  }
  ${large}, ${xlarge} {
    font-size: 15px;
  }
`;

/** 에러 메시지 */
export const ErrorMessage = styled.div`
  color: red;
  font-size: 12px;
  width: 90%;
  //
  height: 12px;
  font-family: "KBO-Dia-Gothic_light";
`;

/** 비밀번호 영역 (비밀번호 표시/숨기기 버튼 포함) */
export const PasswordWrapper = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

/** 비밀번호 표시/숨기기 토글 */
export const PasswordToggle = styled.span`
  cursor: pointer;
  font-size: 14px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 1vh;
  color: #666;
  border-bottom: 1px solid #ccc;
`;

/** 비밀번호 표시/숨기기 토글 아이콘 */
export const ToggleImage = styled.img`
  width: 2vh;
  height: 2vh;
  margin-right: 2vh;
`;

/** 회원가입 버튼 */
export const SignUpButton = styled.button`
  width: 100%;
  margin-top: 30px;
  height: 36px;
  background-color: #0f0f70; /* 포인트 컬러 */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-family: "KBO-Dia-Gothic_medium";
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;
`;
