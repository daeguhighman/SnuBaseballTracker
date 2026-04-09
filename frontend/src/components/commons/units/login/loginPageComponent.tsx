import React, { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Container,
  ErrorMessage,
  FieldWrapper,
  Input,
  Label,
  LinkGroup,
  LoginButton,
  LogoImage,
  MoveToFindPw,
  MoveToSignUp,
  PasswordToggle,
  PasswordWrapper,
  Title,
  ToggleImage,
  VerticalSeparator,
} from "./loginPage.style";
import Link from "next/link";
import API from "../../../../commons/apis/api";
import { setAccessToken } from "../../../../commons/libraries/token";
import { useRouter } from "next/router";
import ShowAlert from "../../../../commons/libraries/showAlertModal";
import axios from "axios";

// 폼에서 다룰 데이터 타입 정의
interface LoginFormData {
  email: string;
  password: string;
}

// yup을 사용한 유효성 검증 스키마 정의
const schema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일 형식이 아닙니다.")
    .required("이메일은 필수 입력 항목입니다."),
  password: yup
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
    .max(20, "비밀번호는 최대 20자까지 입력 가능합니다.")
    .required("비밀번호는 필수 입력 항목입니다."),
});

export default function LoginPageComponent() {
  const router = useRouter();
  // react-hook-form 훅 사용, yup resolver 연결
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // mount 체크
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✨ window.alert 가로채기
  // useEffect(() => {
  //   const orig = window.alert;
  //   window.alert = (msg: string) => {
  //     if (isMounted.current) {
  //       // ShowAlert에서는 error.message를 보므로 message 프로퍼티 추가
  //       setAlertObj({ message: msg });
  //     }
  //   };
  //   return () => {
  //     window.alert = orig;
  //   };
  // }, []);
  // 비밀번호 표시/숨기기 상태
  const [showPassword, setShowPassword] = useState(false);

  // 비밀번호 표시/숨기기 토글
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  // 1) 상태를 하나로 정리 (맨 위쪽에 위치)
  const [alertObj, setAlertObj] = useState<any>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
  //   try {
  //     const response = await API.post("/auth/login", {
  //       email: data.email,
  //       password: data.password,
  //     });
  //     const { accessToken } = response.data;
  //     setAccessToken(accessToken);
  //     // ★ push 하지 말고 성공 플래그 세팅 후 alert
  //     setLoginSuccess(true);
  //     alert("로그인에 성공하였습니다!"); // 모달로 뜸
  //   } catch (error) {
  //     console.error("전체 onSubmit에서 잡힌 에러:", error);
  //     alert("로그인에 실패하였습니다.\n다시 시도해주세요");
  //   }
  // };
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      const response = await API.post("/auth/login", {
        email: data.email,
        password: data.password,
      });
      const { accessToken } = response.data;
      setAccessToken(accessToken);

      setLoginSuccess(true);
      setAlertObj({ message: "로그인에 성공하였습니다!" });
    } catch (err: unknown) {
      if (!isMounted.current) return;

      // 1) 기본 메시지
      let message = "로그인에 실패하였습니다.\n다시 시도해주세요";

      // // 2) AxiosError 여부 검사
      // if (axios.isAxiosError(err)) {
      //   // 만약 서버가 { message } 형태로 보낸다면
      //   message = err.response?.data?.message ?? err.message;
      // }

      // 3) ShowAlert 로 띄우기
      setAlertObj({ message });
    }
  };

  return (
    <Container>
      <ShowAlert
        error={alertObj}
        onClose={() => {
          setAlertObj(null);
          if (loginSuccess) {
            // router.push("/mainCalendar");
            router.push("/");
          }
        }}
      />
      <Title>SNU BASEBALL</Title>

      <LogoImage src="/images/main-logo.png" alt="SNU Baseball 메인 로고" />

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 이메일 주소 입력 */}
        <FieldWrapper>
          <Label htmlFor="email">이메일 주소</Label>
          <Input
            id="email"
            type="email"
            placeholder="@snu.ac.kr"
            {...register("email")}
          />
          {errors.email ? (
            <ErrorMessage>{errors.email.message}</ErrorMessage>
          ) : (
            <ErrorMessage></ErrorMessage>
          )}
        </FieldWrapper>

        <FieldWrapper>
          {/* 비밀번호 입력 */}
          <Label htmlFor="password">비밀번호</Label>
          <PasswordWrapper>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="영문, 숫자가 포함된 8~20자 입력"
              {...register("password")}
            />
            <PasswordToggle onClick={handleTogglePassword}>
              {showPassword ? (
                <ToggleImage src="/images/view.png" alt="숨김" />
              ) : (
                <ToggleImage src="/images/hide.png" alt="표시" />
              )}
            </PasswordToggle>
          </PasswordWrapper>
          {errors.password ? (
            <ErrorMessage>{errors.password.message}</ErrorMessage>
          ) : (
            <ErrorMessage></ErrorMessage>
          )}
        </FieldWrapper>

        <LoginButton type="submit">로그인</LoginButton>
      </form>

      {/* 하단 링크: 회원가입 / 비밀번호 찾기 */}
      <LinkGroup>
        <Link href="/signUp" passHref>
          <MoveToSignUp>회원가입</MoveToSignUp>
        </Link>
        <VerticalSeparator />
        <Link href="/login/findPassword" passHref>
          <MoveToFindPw>비밀번호 재설정</MoveToFindPw>
        </Link>
      </LinkGroup>
    </Container>
  );
}
