import { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ShowAlert from "../../../../commons/libraries/showAlertModal";
import * as yup from "yup";
import {
  Container,
  Title,
  Form,
  FieldWrapper,
  Label,
  Input,
  PasswordWrapper,
  PasswordToggle,
  ToggleImage,
  SignUpButton,
  ErrorMessage,
  WrapperForEmail,
  EmailInput,
  EmailButton,
  SuggestionMessage,
  TitleWrapper,
  TitleInsideWrapper,
  BackButton,
  BackButtonNone,
} from "./sigunUp.style";
import API from "../../../../commons/apis/api";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../../../../commons/libraries/loadingOverlay";

import { setAccessToken } from "../../../../commons/libraries/token";
import { useRouter } from "next/router";
import axios from "axios";
// import { LeftOutlined } from "@ant-design/icons";
import Link from "next/link";

// 폼에서 다룰 데이터 타입 정의
interface SignUpFormData {
  email: string;
  verificationCode: number;
  password: string;
  confirmPassword: string;
  nickname?: string;
}

// yup을 사용한 유효성 검증 스키마 정의
const schema = yup.object().shape({
  email: yup
    .string()
    .email("유효한 이메일 형식이 아닙니다.")
    .required("이메일은 필수 입력 항목입니다."),
  verificationCode: yup.number(),
  password: yup
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
    .matches(
      /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      "비밀번호에는 특수문자가 하나 이상 포함되어야 합니다."
    )
    .required("비밀번호는 필수 입력 항목입니다."),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "비밀번호가 일치하지 않습니다.")
    .required("비밀번호 확인은 필수 입력 항목입니다."),
  nickname: yup
    .string()
    .required("닉네임은 필수 입력 항목입니다.")
    .min(2, "닉네임은 최소 2자 이상이어야 합니다.")
    .max(8, "닉네임은 최대 8자까지 입력 가능합니다.")
    .matches(/^\S*$/, "닉네임에는 공백을 사용할 수 없습니다."),
});

export default function SignUpPage() {
  // react-hook-form 훅 사용, yup resolver 연결
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const router = useRouter();
  const [alertInfo, setAlertInfo] = useState<{
    message: string;
    success?: boolean;
  } | null>(null);
  const [error, setError] = useState(null);
  // react-hook-form 훅 사용, yup resolver 연결
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  // ① 추가: 인증번호 발송 여부를 저장하는 state
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  // 2) window.alert() 을 ShowAlert 로 대체
  useEffect(() => {
    const orig = window.alert;
    window.alert = (msg: string) => {
      if (isMounted.current) {
        setAlertInfo({ message: msg });
      }
    };
    return () => {
      window.alert = orig;
    };
  }, []);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
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

    setIsSubmitting(true);
    try {
      // POST /auth/email/request
      await API.post("/auth/email/request", { email });
      console.log({ email });
      alert("인증번호가 발송되었습니다. \n이메일 수신함을 확인해주세요!");
      // ② 추가: 발송 성공 후 상태 업데이트
      setIsVerificationSent(true);
    } catch (error) {
      let msg = "인증번호 발송 중 알 수 없는 오류가 발생했습니다.";
      if (axios.isAxiosError(error)) {
        msg = error.response?.data?.message ?? error.message;
      }
      alert(msg);
      setError(error);
      const errorCode = axios.isAxiosError(error)
        ? error.response?.data?.errorCode
        : undefined;
      console.error("이메일 인증번호 발송 오류:", error, "errorCode:", errorCode);
    } finally {
      // 컴포넌트가 아직 마운트된 상태에서만 상태 갱신

      setIsSubmitting(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (isSubmitting) return;

    // 1) 코드 값 가져와서 trim
    const rawCode = getValues("verificationCode")?.toString().trim() ?? "";
    // 2) 숫자 6자리인지 검사
    if (!/^[0-9]{6}$/.test(rawCode)) {
      alert("인증번호는 6자리 숫자여야 합니다.");
      return;
    }
    // 3) 숫자로 변환 (필요하면)
    const code = Number(rawCode);
    const email = getValues("email").trim();

    setIsSubmitting(true);
    try {
      // POST /auth/email/verify
      const res = await API.post("/auth/email/verify", { email, code });
      console.log({ email, code });
      // 응답에서 verificationToken을 꺼내 상태로 저장
      const { verificationToken: token } = res.data;

      setVerificationToken(token);
      // console.log("verificationToken:", token);
      alert("인증이 완료되었습니다!");
    } catch (err: unknown) {
      if (!isMounted.current) return;
      // 1) AxiosError 인지 확인
      let msg = "인증 요청 중 알 수 없는 오류가 발생했습니다.";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message ?? err.message;
      }
      setAlertInfo({ message: msg, success: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log(verificationToken);
  // 폼 제출 핸들러
  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    // 인증 토큰 확인
    if (!verificationToken) {
      setAlertInfo({ message: "이메일 인증을 완료해주세요." });
      return;
    }
    console.log("🔥 onSubmit 시작", data);
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // 1) 요청 페이로드 조립
      const payload = {
        email: data.email.trim(),
        password: data.password,
        verificationToken, // state 에 저장된 토큰
        nickname: data.nickname, // 닉네임이 없으면 빈 문자열
      };
      console.log(payload);
      // 2) 회원가입 API 호출
      const res = await API.post("/auth/signup", payload);
      // console.log(payload);
      console.log("signup response:", res.data);

      // ── 여기에 토큰 동기화 추가 ──
      const { accessToken } = res.data;
      setAccessToken(accessToken);
      console.log("동기화된 accessToken:", accessToken);
      console.log("💾 signup 응답 받음, 이제 푸시!");

      console.log("➡️ router.push 완료");
      // 성공 메시지를 띄우기만 하고, navigation은 모달 닫을 때
      if (isMounted.current) {
        setAlertInfo({ message: "회원가입이 완료되었습니다!", success: true });
      }
    } catch (error) {
      console.log(error);
      if (isMounted.current) {
        setError(error);
        setAlertInfo({ message: "회원가입 중 오류가 발생했습니다." });
      }
      // ErrorAlert(errorCode); // 혹은 alert(errorCode)
    } finally {
      if (isMounted.current) setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 1) 메시지/오류 모두 이 모달에서 띄우고… */}
      <ShowAlert
        error={alertInfo || error}
        onClose={() => {
          if (alertInfo?.success) {
            router.push("/mainCalendar");
          }
          setAlertInfo(null);
          setError(null);
          // 성공 메시지일 때만 메인 캘린더로 이동

          // 모달 닫힐 때는 alertInfo, error 둘 다 클리어
        }}
      />
      <Container>
        <TitleWrapper>
          <TitleInsideWrapper>
            <Link href="/login" passHref>
              <BackButton as="a" />
            </Link>
            <Title>회원가입</Title>
            <BackButtonNone></BackButtonNone>
          </TitleInsideWrapper>
        </TitleWrapper>
        {/* 회원가입 폼 */}
        <Form onSubmit={handleSubmit(onSubmit)}>
          {/* 이메일 입력 */}
          <FieldWrapper>
            <Label htmlFor="email">이메일 주소</Label>
            <WrapperForEmail $disabled={!!verificationToken}>
              <EmailInput
                id="email"
                type="email"
                placeholder="@snu.ac.kr"
                {...register("email")}
                $noBottom
                disabled={!!verificationToken}
              />
              <EmailButton
                type="button"
                onClick={handleSendVerification}
                // 토큰까지 받았다면 완전히 막아버리기
                disabled={isSubmitting || !!verificationToken}
                $completed={!!verificationToken}
              >
                {verificationToken
                  ? "인증완료"
                  : isVerificationSent
                  ? "재발송"
                  : "인증번호 발송"}
              </EmailButton>
            </WrapperForEmail>
            <ErrorMessage>
              {errors.email ? (
                errors.email.message
              ) : verificationToken ? (
                "" // 토큰이 있으면 빈 문자열
              ) : (
                <>
                  {" "}
                  <span style={{ color: "#007AFF", opacity: 1 }}>
                    학교 계정이 없을 시 선수 명단 제출 시 사용한 이메일을
                    입력하세요
                  </span>
                </>
              )}
            </ErrorMessage>
            {/* 3) Mailcheck 제안 메시지 */}
            {suggestion && (
              <SuggestionMessage>
                {suggestion}
                {/* 예: “user@gmails.com → user@gmail.com 을 사용해 보세요” */}
              </SuggestionMessage>
            )}
          </FieldWrapper>

          {/* 인증번호 입력 */}
          <FieldWrapper>
            <Label htmlFor="verificationCode">
              발송된 인증번호를 입력하세요
            </Label>
            <WrapperForEmail $disabled={!!verificationToken}>
              <Input
                id="verificationCode"
                type="text"
                placeholder="6자리 숫자"
                {...register("verificationCode", { valueAsNumber: true })}
                disabled={!isVerificationSent || !!verificationToken}
                $completed={!!verificationToken}
              />
              {isVerificationSent && (
                <EmailButton
                  type="button"
                  onClick={handleSendVerificationCode}
                  // 토큰이 생겼으면 인증완료로 바꾸고 비활성
                  disabled={isSubmitting || !!verificationToken}
                  $completed={!!verificationToken}
                >
                  {verificationToken ? "인증완료" : "인증하기"}
                </EmailButton>
              )}
            </WrapperForEmail>

            {errors.verificationCode ? (
              <ErrorMessage>{`이메일 인증번호를 입력해주세요`}</ErrorMessage>
            ) : (
              <ErrorMessage />
            )}
          </FieldWrapper>

          {/* 비밀번호 입력 */}
          <FieldWrapper>
            <Label htmlFor="password">비밀번호</Label>
            <PasswordWrapper>
              <Input
                id="password"
                type="password"
                placeholder="영문 대소문자, 숫자, 특수문자가 포함된 8~20자 입력"
                {...register("password")}
                onChange={async (e) => {
                  register("password").onChange(e);
                  await trigger("password"); // password 필드만 onChange 검증
                }}
              />
            </PasswordWrapper>
            {errors.password ? (
              <ErrorMessage>{errors.password.message}</ErrorMessage>
            ) : (
              <ErrorMessage />
            )}
          </FieldWrapper>

          {/* 비밀번호 확인 입력 */}
          <FieldWrapper>
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="비밀번호 확인"
              {...register("confirmPassword")}
              onChange={async (e) => {
                register("confirmPassword").onChange(e);
                await trigger("confirmPassword"); // password 필드만 onChange 검증
              }}
            />
            {errors.confirmPassword ? (
              <ErrorMessage>{errors.confirmPassword.message}</ErrorMessage>
            ) : (
              <ErrorMessage />
            )}
          </FieldWrapper>
          {/* 닉네임 설정 입력 (맨 밑) */}
          <FieldWrapper>
            <Label htmlFor="nickname">닉네임 설정</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="2~8자 입력"
              {...register("nickname")}
              onChange={async (e) => {
                register("nickname").onChange(e);
                await trigger("nickname"); // password 필드만 onChange 검증
              }}
            />
            {errors.nickname ? (
              <ErrorMessage>{errors.nickname.message}</ErrorMessage>
            ) : (
              <ErrorMessage />
            )}
          </FieldWrapper>

          {/* 회원가입 버튼 */}
          <SignUpButton type="submit">회원가입</SignUpButton>
        </Form>
        <LoadingOverlay visible={isSubmitting}>
          <LoadingIcon spin fontSize={48} />
        </LoadingOverlay>
      </Container>
    </>
  );
}
