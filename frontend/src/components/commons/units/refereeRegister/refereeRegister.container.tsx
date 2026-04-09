import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Container,
  Title,
  Form,
  FieldWrapper,
  Label,
  Input,
  SignUpButton,
  ErrorMessage,
  WrapperForEmail,
  EmailButton,
} from "./refereeRegister.style";
import API from "../../../../commons/apis/api";
import { useRouter } from "next/router";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";
import { useRecoilState } from "recoil";
import { authMe } from "../../../../commons/stores";

import {
  ModalButton,
  ModalContainer,
  ModalOverlay,
  ModalTitleSmall,
  ModalTitleSmaller,
} from "../../modals/modal.style";
import Link from "next/link";
import ErrorAlert from "../../../../commons/libraries/showErrorCode";
import API2 from "../../../../commons/apis/api2";

// 폼에서 다룰 데이터 타입 정의 (숫자 타입으로 변경)
interface RefereeFormData {
  email: string;
  verificationCode: number;
  adminCode: number;
}

// yup을 사용한 유효성 검증 스키마 정의
const schema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일 형식이 아닙니다.")
    .test("domain", "이메일은 '@snu.ac.kr'을 포함해야 합니다.", (value) =>
      value ? value.includes("@snu.ac.kr") : false
    )
    .required("이메일은 필수 입력 항목입니다."),
  verificationCode: yup
    .number()
    .typeError("인증번호는 6자리 숫자여야 합니다.")
    .min(100000, "인증번호는 6자리 숫자여야 합니다.")
    .max(999999, "인증번호는 6자리 숫자여야 합니다.")
    .required("인증번호는 필수 입력 항목입니다."),
  // adminCode: yup
  //   .number()
  //   .typeError("인증코드는 6자리 숫자여야 합니다.")
  //   .min(100000, "인증코드는 6자리 숫자여야 합니다.")
  //   .max(999999, "인증코드는 6자리 숫자여야 합니다.")
  //   .required("인증코드는 필수 입력 항목입니다."),
});

export default function RefereeRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  // react-hook-form 훅 사용, yup resolver 연결
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: yupResolver(schema),
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      setValidationError(msg);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  // ① 인증번호 발송 버튼 클릭 시 실행되는 함수
  // ① 인증번호 발송 버튼 클릭 시 실행되는 함수
  const handleSendVerification = async () => {
    if (isSubmitting) return;
    const email = getValues("email").trim();

    // 1) 빈값 체크
    if (!email) {
      alert("이메일을 입력해주세요");
      return;
    }
    // 2) '@' 포함 여부 체크
    if (!email.includes("@")) {
      alert("유효한 이메일 형식이 아닙니다");
      return;
    }
    // 3) 도메인 체크
    if (!email.includes("@snu.ac.kr")) {
      alert("이메일은 @snu.ac.kr을 포함해야 합니다");
      return;
    }

    setIsSubmitting(true);
    try {
      // POST /auth/email/request
      await API.post("/auth/email/request", { email });
      console.log({ email });
      alert("인증번호가 발송되었습니다. \n이메일 수신함을 확인해주세요!");
    } catch (error) {
      setError(error);
      const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
      console.error(error, "errorCode:", errorCode);
      console.error("이메일 인증번호 발송 오류:", error);
      // alert("인증번호 발송에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 폼 제출 핸들러
  const onSubmit: SubmitHandler<RefereeFormData> = async (data) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        email: data.email,
        code: String(data.verificationCode),
      };
      const response = await API.post("/auth/email/verify", payload, {
        withCredentials: true,
      });
      console.log(payload, response);
      alert("심판 등록에 성공했습니다!");
      router.push(`/`);
    } catch (error) {
      setError(error);
      const errorCode = error?.response?.data?.errorCode; // 에러코드 추출
      console.error(error, "errorCode:", errorCode);
      console.error("등록 실패:", error);
      alert("심판 등록에 실패했습니다. 이메일과 인증코드를 다시 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [authInfo, setAuthInfo] = useRecoilState(authMe);
  // useEffect(() => {
  //   const fetchAuthInfo = async () => {
  //     try {
  //       const authRes = await API2.get("/auth/me");
  //       setAuthInfo(authRes.data);
  //       console.log("authRes.data", authRes.data);
  //     } catch (error) {
  //       setError(error);
  //       console.error("Failed to fetch auth info:", error);
  //     }
  //   };
  //   fetchAuthInfo();
  // }, []);

  console.log("authRes.data", authInfo);
  if (authInfo.role === "UMPIRE") {
    return (
      <ModalOverlay>
        <ModalContainer>
          <ModalTitleSmall>이미 등록된 심판입니다!</ModalTitleSmall>
          <Link href="/" passHref>
            <ModalButton as="a">확인</ModalButton>
          </Link>
        </ModalContainer>
      </ModalOverlay>
    );
  }

  return (
    <Container>
      <Title>심판 등록</Title>

      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* 이메일 입력 */}
        <FieldWrapper>
          <Label htmlFor="email">이메일 주소</Label>
          <WrapperForEmail>
            <Input
              id="email"
              type="email"
              placeholder="@snu.ac.kr"
              {...register("email")}
              $noBottom
            />
            <EmailButton
              type="button"
              onClick={handleSendVerification}
              disabled={isSubmitting}
            >
              인증번호 발송
            </EmailButton>
          </WrapperForEmail>
          {errors.email ? (
            <ErrorMessage>{errors.email.message}</ErrorMessage>
          ) : (
            <ErrorMessage />
          )}
        </FieldWrapper>

        {/* 발송된 인증번호 입력 */}
        <FieldWrapper>
          <Label htmlFor="verificationCode">발송된 인증번호를 입력하세요</Label>
          <WrapperForEmail>
            <Input
              id="verificationCode"
              type="number"
              placeholder="6자리 숫자"
              {...register("verificationCode")}
              $noBottom
            />
          </WrapperForEmail>
          {errors.verificationCode ? (
            <ErrorMessage>{errors.verificationCode.message}</ErrorMessage>
          ) : (
            <ErrorMessage />
          )}
        </FieldWrapper>

        {/* 운영진에게 전달받은 인증코드 입력
        <FieldWrapper>
          <Label htmlFor="adminCode">
            운영진에게 전달받은 인증코드를 입력하세요
          </Label>
          <Input
            id="adminCode"
            type="number"
            placeholder="6자리 숫자"
            {...register("adminCode")}
          />
          {errors.adminCode ? (
            <ErrorMessage>{errors.adminCode.message}</ErrorMessage>
          ) : (
            <ErrorMessage />
          )}
        </FieldWrapper> */}

        {/* 등록 버튼 */}
        <SignUpButton type="submit" disabled={isSubmitting}>
          심판 등록하기
        </SignUpButton>
      </Form>
      <LoadingOverlay visible={isSubmitting}>
        <LoadingIcon spin fontSize={48} />
      </LoadingOverlay>
      <ErrorAlert error={error} />
      {!isSubmitting && validationError && (
        <ModalOverlay>
          <ModalContainer>
            <ModalTitleSmaller>{validationError}</ModalTitleSmaller>

            <ModalButton onClick={() => setValidationError(null)}>
              확인
            </ModalButton>
          </ModalContainer>
        </ModalOverlay>
      )}
    </Container>
  );
}
