import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  BackButton,
  BackButtonNone,
  Container,
  ErrorMessage,
  FieldWrapper,
  Input,
  Label,
  LoginButton,
  PasswordToggle,
  PasswordWrapper,
  Title,
  TitleInsideWrapper,
  TitleWrapper,
  ToggleImage,
} from "./findPwReset.style";
import API from "../../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import { useRouter } from "next/router";
import ShowAlert from "../../../../commons/libraries/showAlertModal";
import Link from "next/link";

// 폼에서 다룰 데이터 타입 정의
interface LoginFormData {
  newPw: string;
}

const schema = yup.object().shape({
  newPw: yup
    .string()
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다.")
    .max(20, "비밀번호는 최대 20자까지 입력 가능합니다.")
    .matches(
      /(?=.*[A-Za-z])/,
      "비밀번호에는 영문자가 하나 이상 포함되어야 합니다."
    )
    .matches(/(?=.*\d)/, "비밀번호에는 숫자가 하나 이상 포함되어야 합니다.")
    .matches(
      /(?=.*[A-Z])/,
      "비밀번호에는 하나 이상의 대문자를 포함해야 합니다."
    )
    .required("새로운 비밀번호를 입력하세요"),
});
export default function ResetPwPageComponent() {
  // react-hook-form 훅 사용, yup resolver 연결
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const router = useRouter();

  // query에서 받아온 token을 state로 관리
  const [token, setToken] = useState<string>("");

  // router가 준비되면 query.token을 꺼내서 state에 저장
  useEffect(() => {
    if (!router.isReady) return;
    const { token: queryToken } = router.query;
    if (typeof queryToken === "string") {
      setToken(queryToken);
    }
  }, [router.isReady, router.query]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // 폼 제출 핸들러
  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return; // 이미 제출 중이면 무시
    setIsSubmitting(true);
    try {
      // payload 객체 생성
      const payload = {
        token, // query에서 가져온 토큰
        newPassword: data.newPw, // form에서 입력한 새 비밀번호
      };
      console.log(payload);
      await API.post("/auth/password/reset", payload);
      alert("비밀번호가 성공적으로 \n변경되었습니다.");
      router.push("/login");
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "비밀번호 변경 중 \n오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const [alertObj, setAlertObj] = useState<any>(null);
  // mount 체크

  // ✨ window.alert 가로채기
  useEffect(() => {
    const orig = window.alert;
    window.alert = (msg: string) => {
      setAlertObj({ message: msg });
    };
    return () => {
      window.alert = orig;
    };
  }, []);
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  return (
    <Container>
      <ShowAlert
        error={alertObj}
        onClose={() => {
          setAlertObj(null);
        }}
      />
      <TitleWrapper>
        <TitleInsideWrapper>
          <Link href="/login" passHref>
            <BackButton as="a" />
          </Link>
          <Title>비밀번호 변경</Title>
          <BackButtonNone></BackButtonNone>
        </TitleInsideWrapper>
      </TitleWrapper>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldWrapper>
          <Label>새로운 비밀번호를 입력하세요</Label>
          <PasswordWrapper>
            <Input
              id="newPw"
              type={showPassword ? "text" : "password"}
              placeholder="영문 대소문자, 숫자가 포함된 8~20자 입력"
              {...register("newPw")}
            />
            <PasswordToggle onClick={handleTogglePassword}>
              {showPassword ? (
                <ToggleImage src="/images/view.png" alt="숨김" />
              ) : (
                <ToggleImage src="/images/hide.png" alt="표시" />
              )}
            </PasswordToggle>
          </PasswordWrapper>
          {errors.newPw ? (
            <ErrorMessage>{errors.newPw.message}</ErrorMessage>
          ) : (
            <ErrorMessage></ErrorMessage>
          )}
        </FieldWrapper>

        <LoginButton type="submit">비밀번호 변경하기</LoginButton>
      </form>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
    </Container>
  );
}
