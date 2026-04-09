import { useRecoilValue } from "recoil";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { authCheckedState } from "../stores";
import {
  LoadingIcon,
  LoadingOverlay,
  LoadingOverlayNoOpacity,
} from "../libraries/loadingOverlay";

// 인증이 필요하지 않은 페이지 패턴
const PUBLIC_PATH_PATTERNS = [
  /^\/loging/,
  /^\/register/,
  /^\/find-password/,
  /^\/reset-password/,
  /^\/signUp/,
];

function AuthGate({
  children,
  fallback,
  redirectTo = "/login", // 리다이렉트할 페이지 (기본값: /login)
  additionalPublicPaths = [], // 추가 공개 경로
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string; // 추가된 prop
  additionalPublicPaths?: string[];
}) {
  const checked = useRecoilValue(authCheckedState);
  const router = useRouter();
  // 현재 경로가 공개 경로인지 확인
  const isPublicPath = [
    ...PUBLIC_PATH_PATTERNS,
    ...additionalPublicPaths.map((path) => new RegExp(`^${path}`)),
  ].some((pattern) => pattern.test(router.pathname));

  useEffect(() => {
    let isMounted = true;

    if (checked === false && !isPublicPath) {
      if (router.pathname !== redirectTo) {
        // 비동기 작업을 안전하게 처리
        router.push(redirectTo).then(() => {
          // 컴포넌트가 마운트된 상태에서만 추가 작업 수행
          if (isMounted) {
            // 필요한 경우 추가 로직
          }
        });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [checked, router, redirectTo, isPublicPath]);

  // 인증 체크 중이거나 인증에 실패한 경우 fallback 표시
  if (!checked) {
    return (
      <>
        {fallback ?? (
          <LoadingOverlayNoOpacity visible={true}>
            <LoadingIcon spin fontSize={48} />
          </LoadingOverlayNoOpacity>
        )}
      </>
    );
  }

  // 인증 성공한 경우 children 표시
  return <>{children}</>;
}

export default AuthGate;
