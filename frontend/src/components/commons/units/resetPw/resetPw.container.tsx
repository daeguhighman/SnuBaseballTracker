import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Container,
  ErrorMessage,
  FieldWrapper,
  Input,
  Label,
  LoginButton,
  Title,
} from "./resetPw.style";
import API from "../../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import { useRouter } from "next/router";

// 폼에서 다룰 데이터 타입 정의
interface LoginFormData {
  currentPw: string;
  newPw: string;
}

// 영문, 숫자 포함 8~20자 정규식
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;

// yup을 사용한 유효성 검증 스키마 정의
const schema = yup.object().shape({
  currentPw: yup
    .string()
    .required("현재 비밀번호를 입력하세요")
    .matches(passwordRegex, "영문과 숫자를 포함한 8~20자를 입력하세요"),
  newPw: yup
    .string()
    .required("새로운 비밀번호를 입력하세요")
    .matches(passwordRegex, "영문과 숫자를 포함한 8~20자를 입력하세요"),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 폼 제출 핸들러
  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return; // 이미 제출 중이면 무시
    setIsSubmitting(true);
    try {
      await API.post("/auth/password/change", {
        currentPassword: data.currentPw,
        newPassword: data.newPw,
      });
      alert("비밀번호가 성공적으로 변경되었습니다.");
      router.push("/mainCalendar");
    } catch (error: any) {
      console.error(error);
      alert(
        error.response?.data?.message || "비밀번호 변경 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Container>
      <Title>비밀번호 변경</Title>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 이메일 주소 입력 */}
        <FieldWrapper>
          <Label>현재 비밀번호를 입력하세요</Label>

          <Input id="currentPw" {...register("currentPw")} />
          {errors.currentPw ? (
            <ErrorMessage>{errors.currentPw.message}</ErrorMessage>
          ) : (
            <ErrorMessage></ErrorMessage>
          )}
        </FieldWrapper>

        <FieldWrapper>
          <Label>새로운 비밀번호를 입력하세요</Label>

          <Input
            id="newPw"
            placeholder="영문, 숫자가 포함된 8~20자 입력"
            {...register("newPw")}
          />
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
